// registrarLeitura e interpretarRetorno (CA-20, CA-23, CA-24; DT-6; seção 8 da arquitetura).
import { createHash, randomUUID } from "node:crypto";
import { Writable } from "node:stream";
import Fastify from "fastify";
import { sql, type Kysely } from "kysely";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { abrirKysely } from "../../src/banco/conexao.js";
import type { Esquema } from "../../src/banco/esquema.js";
import { criarBanco, type Banco } from "../../src/banco/transacao.js";
import { interpretarRetorno, registrarLeitura, VERSAO_LEITOR } from "../../src/leitura/registrar.js";
import { opcoesDeLog } from "../../src/registro.js";
import {
  arquivoCreditos,
  arquivoDebitos,
  bytes,
  credito,
  debito,
  GERADO,
  n,
  NI14,
  NI14_OUTRA,
  RAIZ,
} from "../apoio/construtores.js";
import { cnpjInvalidoDe } from "../../src/ficticios/dv.js";
import {
  VALOR_FORA_DO_LIMITE,
  VALOR_LONGO,
  VALOR_MAXIMO_14,
  VALORES_QUE_O_AJV_RECUSA,
  valoresDeterministicos,
} from "../apoio/valores.js";
import { abrirComoMigracao, limparTabelas, semear } from "../banco/limpar.js";
import { URL_APP } from "../banco/urls.js";

const EMPRESA = randomUUID();
const RECEBIDO = new Date("2026-11-26T12:00:00.000Z");

let migracao: Kysely<Esquema>;
let app: Kysely<Esquema>;
let banco: Banco;

beforeAll(() => {
  migracao = abrirComoMigracao();
  app = abrirKysely(URL_APP);
  banco = criarBanco(app);
});
afterAll(async () => {
  await app?.destroy();
  await migracao?.destroy();
});
beforeEach(async () => {
  await limparTabelas(migracao);
  await semear(migracao, [EMPRESA], (trx) =>
    sql`insert into empresa (id, cnpj_raiz, nome) values (${EMPRESA}, ${RAIZ}, 'Comércio Exemplo Ltda.')`.execute(trx),
  );
});

async function novaConsulta(servico: "creditos" | "debitos"): Promise<string> {
  const id = randomUUID();
  await banco.naEmpresaFixada(EMPRESA, (trx) =>
    trx
      .insertInto("consulta")
      .values({
        id,
        empresa_id: EMPRESA,
        servico,
        estado: "lida",
        criada_em: RECEBIDO,
        concluida_em: RECEBIDO,
        finalizada_em: RECEBIDO,
      })
      .execute(),
  );
  return id;
}

// O log é obrigatório em registrarLeitura; os testes que não olham o log passam um que descarta.
const SEM_LOG = { info() {}, warn() {} };

async function ler(servico: "creditos" | "debitos", conteudo: Uint8Array, log: { info(o: object, m?: string): void; warn(o: object, m?: string): void } = SEM_LOG) {
  const consultaId = await novaConsulta(servico);
  const r = await banco.naEmpresaFixada(EMPRESA, (trx) =>
    registrarLeitura(trx, { consultaId, servico, conteudo, recebidoEm: RECEBIDO, log }),
  );
  return { ...r, consultaId };
}

const arquivos = () =>
  banco.naEmpresaFixada(EMPRESA, (trx) => trx.selectFrom("arquivo_bruto").selectAll().execute());
const creditos = () =>
  banco.naEmpresaFixada(EMPRESA, (trx) => trx.selectFrom("credito_lido").selectAll().orderBy("chave").execute());
const debitos = () =>
  banco.naEmpresaFixada(EMPRESA, (trx) => trx.selectFrom("debito_lido").selectAll().orderBy("chave").execute());

describe("arquivo aceito (CA-23, CA-24)", () => {
  test("créditos: grava arquivo_bruto com hash, tamanho, geradoEm e versão do leitor, e uma linha por nota", async () => {
    const conteudo = bytes(
      arquivoCreditos(
        [
          [
            "11/2026",
            [
              credito({ chave: "FICT-1", apurado: "100.50", aApropriar: "100.50", apropriado: "20", utilizado: "20.00" }),
              credito({ chave: "FICT-2", apurado: "7.1", aApropriar: "7.1", extras: { apropriacao: { suspenso: n("3.00") } } }),
            ],
          ],
          ["10/2026", [credito({ chave: "FICT-3", apurado: "1", aApropriar: "1", origem: 30, documento: 91 })]],
        ],
        { ni: "90817263" },
      ),
    );
    const r = await ler("creditos", conteudo);
    expect(r.situacao).toBe("aceito");
    expect(r.notas).toBe(3);
    expect(r.motivo).toBeUndefined();
    expect(VERSAO_LEITOR).toBe("033.1");

    const [arq] = await arquivos();
    expect(arq).toMatchObject({
      id: r.arquivoId,
      consulta_id: r.consultaId,
      servico: "creditos",
      situacao: "aceito",
      motivo_recusa: null,
      gerado_em: GERADO,
      versao_leitor: "033.1",
      objeto: null,
      tamanho: conteudo.length,
      sha256: createHash("sha256").update(conteudo).digest("hex"),
    });
    expect(arq?.recebido_em).toEqual(RECEBIDO);
    expect(arq?.versao_schema).toBe("1.0.0");

    const linhas = await creditos();
    expect(linhas.map((l) => l.chave)).toEqual(["FICT-1", "FICT-2", "FICT-3"]);
    const um = linhas[0]!;
    expect(um).toMatchObject({ pa: "11/2026", documento: 55, origem: 0, apurado: "100.50", a_apropriar: "100.50", apropriado: "20.00", utilizado: "20.00" });
    expect(um.suspenso).toBeNull();
    expect(um.restabelecido).toBeNull();
    expect(um.emissao).toBe("2026-11-02T10:00:00.000-03:00");
    expect(um.atualizacao).toBe("2026-11-18T08:00:00-03:00");
    expect(linhas[1]).toMatchObject({ a_apropriar: "7.10", suspenso: "3.00" });
    expect(linhas[2]).toMatchObject({ pa: "10/2026", documento: 91, origem: 30 });
    expect(linhas.every((l) => l.arquivo_id === r.arquivoId && l.empresa_id === EMPRESA)).toBe(true);
  });

  test("débitos: grava em debito_lido com os campos de débito", async () => {
    const r = await ler(
      "debitos",
      bytes(arquivoDebitos([["11/2026", [debito({ chave: "FICT-D1", apurado: "800.00", extinto: "300.00", saldoDevedor: "500.00" })]]], { ni: "90817263" })),
    );
    expect(r).toMatchObject({ situacao: "aceito", notas: 1 });
    const [d] = await debitos();
    expect(d).toMatchObject({ chave: "FICT-D1", apurado: "800.00", extinto: "300.00", saldo_devedor: "500.00" });
    expect(d?.suspenso).toBeNull();
    expect(await creditos()).toHaveLength(0);
  });

  test("o valor de 14 dígitos inteiros volta como texto igual, sem perda (CA-23)", async () => {
    await ler("creditos", bytes(arquivoCreditos([["11/2026", [credito({ apurado: VALOR_LONGO, aApropriar: VALOR_LONGO })]]], { ni: "90817263" })));
    const [l] = await creditos();
    expect(typeof l?.apurado).toBe("string");
    expect(l?.apurado).toBe(VALOR_LONGO);
    expect(l?.a_apropriar).toBe(VALOR_LONGO);
  });

  test("ni de 14 dígitos é aceito com divergência (D-2) e as notas entram", async () => {
    const r = await ler("creditos", bytes(arquivoCreditos([["11/2026", [credito()]]], { ni: NI14 })));
    expect(r).toMatchObject({ situacao: "aceito_com_divergencia", notas: 1 });
    expect((await arquivos())[0]?.situacao).toBe("aceito_com_divergencia");
    expect(await creditos()).toHaveLength(1);
  });

  test("notas de dois estabelecimentos da raiz da empresa entram como da empresa (CA-24, O-24)", async () => {
    const outroEstabelecimento = cnpjInvalidoDe(`${RAIZ}0002`);
    const a = await ler("creditos", bytes(arquivoCreditos([["11/2026", [credito({ chave: "FICT-A" })]]], { ni: NI14 })));
    const b = await ler("creditos", bytes(arquivoCreditos([["11/2026", [credito({ chave: "FICT-B" })]]], { ni: outroEstabelecimento })));
    expect(a.situacao).toBe("aceito_com_divergencia");
    expect(b.situacao).toBe("aceito_com_divergencia");
    const linhas = await creditos();
    expect(linhas.map((l) => l.chave)).toEqual(["FICT-A", "FICT-B"]);
    expect(linhas.every((l) => l.empresa_id === EMPRESA)).toBe(true);
  });

  test("retorno vazio (apuracao vazia) é aceito, sem notas", async () => {
    const r = await ler("creditos", bytes(arquivoCreditos([], { ni: "90817263" })));
    expect(r).toMatchObject({ situacao: "aceito", notas: 0 });
    expect(await creditos()).toHaveLength(0);
    expect(await arquivos()).toHaveLength(1);
  });

  test("grava em lotes: 1.201 notas entram todas", async () => {
    const notas = Array.from({ length: 1201 }, (_, i) => credito({ chave: `FICT-${String(i).padStart(5, "0")}`, aApropriar: "1.00" }));
    const r = await ler("creditos", bytes(arquivoCreditos([["11/2026", notas]], { ni: "90817263" })));
    expect(r.notas).toBe(1201);
    expect(await creditos()).toHaveLength(1201);
  });
});

describe("arquivo recusado (CA-20): grava o arquivo com o motivo e nenhuma nota", () => {
  const semNotas = async () => {
    expect(await creditos()).toHaveLength(0);
    expect(await debitos()).toHaveLength(0);
  };

  test("conteúdo ilegível: ilegivel, e geradoEm nulo", async () => {
    const conteudo = new TextEncoder().encode("isto não é JSON {");
    const r = await ler("creditos", conteudo);
    expect(r).toMatchObject({ situacao: "recusado", motivo: "ilegivel", notas: 0 });
    const [a] = await arquivos();
    expect(a).toMatchObject({ situacao: "recusado", motivo_recusa: "ilegivel", gerado_em: null, tamanho: conteudo.length });
    expect(a?.sha256).toBe(createHash("sha256").update(conteudo).digest("hex"));
    await semNotas();
  });

  test("campo fora do schema: fora_do_schema", async () => {
    const semChave = credito();
    delete semChave["chave"];
    const r = await ler("creditos", bytes(arquivoCreditos([["11/2026", [semChave]]], { ni: "90817263" })));
    expect(r).toMatchObject({ situacao: "recusado", motivo: "fora_do_schema" });
    expect((await arquivos())[0]?.motivo_recusa).toBe("fora_do_schema");
    await semNotas();
  });

  test("ni de outra raiz: outra_empresa", async () => {
    const r = await ler("creditos", bytes(arquivoCreditos([["11/2026", [credito()]]], { ni: NI14_OUTRA })));
    expect(r).toMatchObject({ situacao: "recusado", motivo: "outra_empresa", notas: 0 });
    expect((await arquivos())[0]?.motivo_recusa).toBe("outra_empresa");
    await semNotas();
  });

  test("ni de 8 dígitos de outra raiz também é outra_empresa", async () => {
    const r = await ler("debitos", bytes(arquivoDebitos([["11/2026", [debito()]]], { ni: "55443322" })));
    expect(r).toMatchObject({ situacao: "recusado", motivo: "outra_empresa" });
    await semNotas();
  });

  test("valor com 19 dígitos inteiros: valor_fora_do_limite", async () => {
    const r = await ler("creditos", bytes(arquivoCreditos([["11/2026", [credito({ apurado: VALOR_FORA_DO_LIMITE, aApropriar: "1.00" })]]], { ni: "90817263" })));
    expect(r).toMatchObject({ situacao: "recusado", motivo: "valor_fora_do_limite" });
    await semNotas();
  });

  test("a recusa não guarda detalhe do conteúdo (só situação e motivo)", async () => {
    await ler("creditos", bytes(arquivoCreditos([["11/2026", [credito({ chave: "CHAVE-SIGILOSA-77", apurado: "4321.099" })]]], { ni: "90817263" })));
    const [a] = await arquivos();
    expect(JSON.stringify(a)).not.toContain("CHAVE-SIGILOSA-77");
    expect(JSON.stringify(a)).not.toContain("4321.09");
  });
});

describe("múltiplo de 0,01 sem ponto flutuante (DT-6)", () => {
  const aceita = (valor: string) =>
    interpretarRetorno(bytes(arquivoCreditos([["11/2026", [credito({ apurado: valor, aApropriar: valor })]]], { ni: "90817263" })), "creditos", RAIZ);

  test.each(["0.1", "10", "1234.56", VALOR_MAXIMO_14, ...VALORES_QUE_O_AJV_RECUSA])("aceita %s", (v) => {
    const r = aceita(v);
    expect(r.situacao).toBe("aceito");
    expect(r.notas[0]?.valores["apurado"]).toBe(v);
  });

  test.each(["0.001", "1.005", "0.0001"])("recusa %s com fora_do_schema", (v) => {
    expect(aceita(v)).toMatchObject({ situacao: "recusado", motivo: "fora_do_schema" });
  });

  test("500 valores válidos pseudoaleatórios de até 14 dígitos inteiros são todos aceitos", () => {
    const recusados = valoresDeterministicos(500).filter((v) => aceita(v).situacao !== "aceito");
    expect(recusados).toEqual([]);
  });
});

describe("interpretarRetorno (parte pura, sem banco)", () => {
  test("devolve situação, motivo e notas já lidas; só os campos que vieram estão em valores", () => {
    const r = interpretarRetorno(
      bytes(arquivoCreditos([["11/2026", [credito({ chave: "FICT-1", apurado: "10.00", aApropriar: "10.00", extras: { cbs: { excedente: n("1.50") } } })]]], { ni: NI14 })),
      "creditos",
      RAIZ,
    );
    expect(r.situacao).toBe("aceito_com_divergencia");
    expect(r.motivo).toBeUndefined();
    expect(r.geradoEm).toBe(GERADO);
    expect(r.notas).toHaveLength(1);
    expect(r.notas[0]).toMatchObject({ pa: "11/2026", chave: "FICT-1", documento: 55, origem: 0 });
    expect(r.notas[0]?.valores).toEqual({ apurado: "10.00", aApropriar: "10.00", saldoCredor: "0", excedente: "1.50" });
  });

  test("débitos usam os campos de débito", () => {
    const r = interpretarRetorno(bytes(arquivoDebitos([["11/2026", [debito({ apurado: "5.00", extinto: "2.00", saldoDevedor: "3.00" })]]], { ni: "90817263" })), "debitos", RAIZ);
    expect(r.notas[0]?.valores).toEqual({ apurado: "5.00", extinto: "2.00", saldoDevedor: "3.00" });
  });

  test("recusado devolve o motivo e nenhuma nota", () => {
    const r = interpretarRetorno(bytes(arquivoCreditos([["11/2026", [credito()]]], { ni: NI14_OUTRA })), "creditos", RAIZ);
    expect(r).toMatchObject({ situacao: "recusado", motivo: "outra_empresa" });
    expect(r.notas).toEqual([]);
  });
});

describe("log (seção 8 da arquitetura)", () => {
  test("traz consultaId, situação, motivo e quantidade, e nenhum dado do conteúdo", async () => {
    const linhasDeLog: string[] = [];
    const stream = new Writable({
      write(chunk, _enc, cb) {
        linhasDeLog.push(String(chunk));
        cb();
      },
    });
    const servidor = Fastify({ logger: opcoesDeLog({ stream }) });
    const a = await ler(
      "creditos",
      bytes(arquivoCreditos([["11/2026", [credito({ chave: "CHAVE-SIGILOSA-77", apurado: "4321.09", aApropriar: "4321.09" })]]], { ni: NI14 })),
      servidor.log,
    );
    const b = await ler("creditos", bytes(arquivoCreditos([["11/2026", [credito({ chave: "CHAVE-SIGILOSA-78" })]]], { ni: NI14_OUTRA })), servidor.log);
    await servidor.close();
    const tudo = linhasDeLog.join("");
    expect(tudo).toContain(a.consultaId);
    expect(tudo).toContain("aceito_com_divergencia");
    expect(tudo).toContain(b.consultaId);
    expect(tudo).toContain("outra_empresa");
    const registros = linhasDeLog.map((l) => JSON.parse(l) as Record<string, unknown>);
    expect(registros.find((r) => r["consultaId"] === a.consultaId)).toMatchObject({ situacao: "aceito_com_divergencia", notas: 1 });
    expect(registros.find((r) => r["consultaId"] === b.consultaId)).toMatchObject({ situacao: "recusado", motivo: "outra_empresa", notas: 0 });
    for (const proibido of ["CHAVE-SIGILOSA", "4321.09", RAIZ, NI14, NI14_OUTRA, "Comércio Exemplo"]) {
      expect(tudo, proibido).not.toContain(proibido);
    }
  });
});

describe("log de retorno recusado (revisão B8)", () => {
  async function comLog(servico: "creditos" | "debitos", conteudo: Uint8Array) {
    const linhas: string[] = [];
    const stream = new Writable({
      write(chunk, _enc, cb) {
        linhas.push(String(chunk));
        cb();
      },
    });
    const servidor = Fastify({ logger: opcoesDeLog({ stream }) });
    const r = await ler(servico, conteudo, servidor.log);
    await servidor.close();
    return { r, linhas, registros: linhas.map((l) => JSON.parse(l) as Record<string, unknown>) };
  }
  const recusa = (registros: Record<string, unknown>[]) => registros.find((x) => x["evento"] === "leitura_recusada");

  test("fora do schema: warn com servico, arquivoId, total e a lista de caminhos e regras, sem message nem valor", async () => {
    const semChave = credito({ apurado: "4321.09" });
    delete semChave["chave"];
    const { r, linhas, registros } = await comLog(
      "creditos",
      bytes(arquivoCreditos([["11/2026", [semChave, credito({ chave: "CHAVE-SIGILOSA-91" })]]], { ni: "90817263" })),
    );
    const e = recusa(registros)!;
    expect(e).toBeDefined();
    expect(e["level"]).toBe(40);
    expect(e).toMatchObject({ servico: "creditos", consultaId: r.consultaId, motivo: "fora_do_schema", causa: "fora_do_schema", divergencias: 1 });
    expect(e["arquivoId"]).toBe(r.arquivoId);
    expect(e["ocorrencias"]).toEqual(["/apuracao/#/creditos/##required"]);
    const tudo = linhas.join("");
    for (const proibido of ["must have required property", "CHAVE-SIGILOSA", "4321.09", RAIZ, NI14]) expect(tudo, proibido).not.toContain(proibido);
  });

  test("aninhado e chave_repetida têm causa própria no log; ilegível também", async () => {
    const aninhado = await comLog("creditos", new TextEncoder().encode(`${"[".repeat(100)}${"]".repeat(100)}`));
    expect(recusa(aninhado.registros)).toMatchObject({ level: 40, causa: "aninhado", divergencias: 1 });
    const repetida = await comLog("debitos", new TextEncoder().encode('{"ni":"1","ni":"2"}'));
    expect(recusa(repetida.registros)).toMatchObject({ level: 40, servico: "debitos", causa: "chave_repetida" });
    const ilegivel = await comLog("creditos", new TextEncoder().encode("isto não é JSON {"));
    expect(recusa(ilegivel.registros)).toMatchObject({ level: 40, causa: "ilegivel" });
  });

  test("outra empresa: warn sem a raiz nem o ni", async () => {
    const { registros, linhas } = await comLog("creditos", bytes(arquivoCreditos([["11/2026", [credito()]]], { ni: NI14_OUTRA })));
    expect(recusa(registros)).toMatchObject({ level: 40, causa: "outra_empresa", motivo: "outra_empresa" });
    expect(linhas.join("")).not.toContain(NI14_OUTRA);
  });

  test("aceito continua em info, sem evento de recusa", async () => {
    const { registros } = await comLog("creditos", bytes(arquivoCreditos([["11/2026", [credito()]]], { ni: NI14 })));
    expect(recusa(registros)).toBeUndefined();
    expect(registros.find((x) => x["evento"] === "leitura_registrada")).toMatchObject({ level: 30 });
  });
});
