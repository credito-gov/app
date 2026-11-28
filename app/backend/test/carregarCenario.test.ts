// npm run admin -- carregar-cenario (CA-16 a CA-20, CA-26; DT-13): grava os cenários fictícios pela
// mesma leitura do coletor, só no ambiente local, e nunca a partir de arquivo do disco.
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import type { Kysely } from "kysely";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { criarComandosAdmin, ErroAdmin, type ComandosAdmin } from "../src/admin/comandos.js";
import { abrirKysely } from "../src/banco/conexao.js";
import type { Esquema } from "../src/banco/esquema.js";
import { criarBanco, type Banco } from "../src/banco/transacao.js";
import { carregarConfig } from "../src/config.js";
import { CENARIOS, montarCenario } from "../src/ficticios/cenarios.js";
import { criarEmailMemoria } from "../src/email/memoria.js";
import { abrirComoMigracao, limparTabelas } from "./banco/limpar.js";
import { URL_APP } from "./banco/urls.js";
import { SEGREDO, WEB_URL } from "./api/ajudas.js";
import { RAIZ } from "./apoio/construtores.js";

const DIA = 24 * 60 * 60_000;
const AGORA = new Date("2026-11-27T15:00:00.000Z");
const ENV = {
  CREDITOGOV_AMBIENTE: "local",
  CREDITOGOV_BANCO_URL: URL_APP,
  CREDITOGOV_SESSAO_SEGREDO: SEGREDO,
  CREDITOGOV_WEB_URL: WEB_URL,
  CREDITOGOV_EMAIL: "memoria",
};

let migracao: Kysely<Esquema>;
let app: Kysely<Esquema>;
let banco: Banco;
let admin: ComandosAdmin;

function comandos(ambiente = "local", log?: { info(o: object): void; warn(o: object): void }): ComandosAdmin {
  return criarComandosAdmin({
    ...(log ? { log } : {}),
    banco,
    email: criarEmailMemoria(),
    relogio: () => AGORA,
    config: carregarConfig({ ...ENV, CREDITOGOV_AMBIENTE: ambiente }),
  });
}

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
  admin = comandos();
});

const novaEmpresa = async (raiz = RAIZ, nome = "Comércio Exemplo Ltda.") => (await admin.criarEmpresa({ cnpjRaiz: raiz, nome })).id;
const consultasDe = (id: string) =>
  banco.naEmpresaFixada(id, (trx) => trx.selectFrom("consulta").selectAll().orderBy("criada_em").execute());
const arquivosDe = (id: string) => banco.naEmpresaFixada(id, (trx) => trx.selectFrom("arquivo_bruto").selectAll().execute());
const contar = (id: string, tabela: "credito_lido" | "debito_lido") =>
  banco.naEmpresaFixada(id, async (trx) => (await trx.selectFrom(tabela).select("id").execute()).length);

const motivo = async (p: Promise<unknown>): Promise<string> => {
  try {
    await p;
  } catch (e) {
    expect(e).toBeInstanceOf(ErroAdmin);
    return (e as Error).message;
  }
  throw new Error("era esperado um erro");
};

describe("recusas (CA-26)", () => {
  test.each(["homologacao"])("com CREDITOGOV_AMBIENTE %s, para com mensagem e não grava nada", async (ambiente) => {
    const id = await novaEmpresa();
    expect(await motivo(comandos(ambiente).carregarCenario({ empresaId: id, cenario: "completo" }))).toMatch(/local/);
    expect(await consultasDe(id)).toHaveLength(0);
    expect(await arquivosDe(id)).toHaveLength(0);
  });

  test("produção nem chega ao comando: a configuração já recusa", () => {
    expect(() => carregarConfig({ ...ENV, CREDITOGOV_AMBIENTE: "producao" })).toThrow();
  });

  test("empresa que já tem consulta é recusada, e nada novo é gravado", async () => {
    const id = await novaEmpresa();
    await admin.carregarCenario({ empresaId: id, cenario: "vazio" });
    const antes = (await consultasDe(id)).length;
    expect(await motivo(admin.carregarCenario({ empresaId: id, cenario: "completo" }))).toMatch(/já tem consulta/i);
    expect(await consultasDe(id)).toHaveLength(antes);
  });

  test("cenário desconhecido é recusado, com a lista dos válidos", async () => {
    const id = await novaEmpresa();
    const m = await motivo(admin.carregarCenario({ empresaId: id, cenario: "inventado" }));
    for (const nome of CENARIOS) expect(m).toContain(nome);
    expect(await consultasDe(id)).toHaveLength(0);
  });

  test("empresa inexistente e id que não é uuid são recusados", async () => {
    expect(await motivo(admin.carregarCenario({ empresaId: "00000000-0000-4000-8000-000000000000", cenario: "completo" }))).toMatch(/empresa/i);
    expect(await motivo(admin.carregarCenario({ empresaId: "abc", cenario: "completo" }))).toMatch(/uuid/i);
  });
});

describe("os nove cenários gravam as consultas no estado da tabela da Spec", () => {
  const esperado = (nome: string) => montarCenario(nome, { raiz: RAIZ, agora: AGORA, semente: 1 });

  test.each([...CENARIOS])("%s: consultas, estados e horários", async (nome) => {
    const id = await novaEmpresa();
    await admin.carregarCenario({ empresaId: id, cenario: nome });
    const gravadas = await consultasDe(id);
    const previstas = esperado(nome);
    expect(gravadas).toHaveLength(previstas.length);
    const chave = (c: { servico: string; estado: string; criadaEm: Date; concluidaEm: Date | null; finalizadaEm: Date | null }) =>
      `${c.servico}|${c.estado}|${c.criadaEm.toISOString()}|${c.concluidaEm?.toISOString() ?? "-"}|${c.finalizadaEm?.toISOString() ?? "-"}`;
    expect(gravadas.map((g) => chave({ servico: g.servico, estado: g.estado, criadaEm: g.criada_em, concluidaEm: g.concluida_em, finalizadaEm: g.finalizada_em })).sort()).toEqual(
      previstas.map(chave).sort(),
    );
  });

  test("sem-consulta não grava nada", async () => {
    const id = await novaEmpresa();
    await admin.carregarCenario({ empresaId: id, cenario: "sem-consulta" });
    expect(await consultasDe(id)).toHaveLength(0);
    expect(await arquivosDe(id)).toHaveLength(0);
  });

  test("em-andamento grava uma consulta aberta, sem arquivo", async () => {
    const id = await novaEmpresa();
    await admin.carregarCenario({ empresaId: id, cenario: "em-andamento" });
    const c = await consultasDe(id);
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ servico: "creditos", estado: "aberta", concluida_em: null, finalizada_em: null });
    expect(await arquivosDe(id)).toHaveLength(0);
  });

  test("completo: quatro consultas lidas, quatro arquivos, notas de crédito e de débito", async () => {
    const id = await novaEmpresa();
    await admin.carregarCenario({ empresaId: id, cenario: "completo" });
    const arqs = await arquivosDe(id);
    expect(arqs).toHaveLength(4);
    expect(arqs.every((a) => a.situacao === "aceito_com_divergencia" && a.versao_leitor === "033.1")).toBe(true);
    expect(await contar(id, "credito_lido")).toBe(940);
    expect(await contar(id, "debito_lido")).toBe(320);
  });

  test("recusado grava dois arquivos recusados (outra_empresa e fora_do_schema) e nenhuma nota deles", async () => {
    const id = await novaEmpresa();
    await admin.carregarCenario({ empresaId: id, cenario: "recusado" });
    const arqs = await arquivosDe(id);
    const recusados = arqs.filter((a) => a.situacao === "recusado");
    expect(recusados.map((a) => a.motivo_recusa).sort()).toEqual(["fora_do_schema", "outra_empresa"]);
    expect(arqs.length).toBeGreaterThan(recusados.length);
    const notas = await banco.naEmpresaFixada(id, async (trx) => [
      ...(await trx.selectFrom("credito_lido").select("arquivo_id").execute()),
      ...(await trx.selectFrom("debito_lido").select("arquivo_id").execute()),
    ]);
    const idsRecusados = new Set(recusados.map((a) => a.id));
    expect(notas.length).toBeGreaterThan(0);
    expect(notas.some((n) => idsRecusados.has(n.arquivo_id))).toBe(false);
  });

  test("recusado passa o log à leitura: um warn por retorno recusado, com a causa e sem conteúdo (revisão B8)", async () => {
    const id = await novaEmpresa();
    const avisos: Record<string, unknown>[] = [];
    await comandos("local", { info() {}, warn: (o) => void avisos.push(o as Record<string, unknown>) }).carregarCenario({ empresaId: id, cenario: "recusado" });
    const recusas = avisos.filter((a) => a["evento"] === "leitura_recusada");
    expect(recusas.map((a) => a["causa"]).sort()).toEqual(["fora_do_schema", "outra_empresa"]);
    for (const a of recusas) {
      expect(a).toMatchObject({ servico: "creditos" });
      expect(typeof a["arquivoId"]).toBe("string");
      // os identificadores (UUID) são tirados antes: oito dígitos seguidos num UUID aleatório não são vazamento
      const semIds = JSON.stringify(a).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "");
      expect(semIds).not.toMatch(/must have|CHAVE|\d{8}/);
    }
  });

  test("desatualizado grava concluida_em 9 dias antes do relógio", async () => {
    const id = await novaEmpresa();
    await admin.carregarCenario({ empresaId: id, cenario: "desatualizado" });
    const c = await consultasDe(id);
    expect(c.length).toBeGreaterThan(0);
    for (const x of c) expect(x.concluida_em?.getTime()).toBe(AGORA.getTime() - 9 * DIA);
  });

  test("parcial e falha-com-anteriores gravam as consultas com falha", async () => {
    const a = await novaEmpresa(RAIZ, "Comércio Exemplo Ltda.");
    const b = await novaEmpresa("11111111", "Indústria Exemplo S.A.");
    await admin.carregarCenario({ empresaId: a, cenario: "parcial" });
    await admin.carregarCenario({ empresaId: b, cenario: "falha-com-anteriores" });
    expect((await consultasDe(a)).some((c) => c.servico === "debitos" && c.estado === "erro")).toBe(true);
    expect((await consultasDe(b)).some((c) => c.servico === "creditos" && c.estado === "credencial_invalida")).toBe(true);
  });

  test("o cenário vai só para a empresa pedida", async () => {
    const a = await novaEmpresa(RAIZ, "Comércio Exemplo Ltda.");
    const b = await novaEmpresa("11111111", "Indústria Exemplo S.A.");
    await admin.carregarCenario({ empresaId: a, cenario: "vazio" });
    expect(await consultasDe(a)).toHaveLength(2);
    expect(await consultasDe(b)).toHaveLength(0);
  });
});

describe("saída do comando", () => {
  test("traz o cenário, a empresa e as quantidades, e nenhum valor, chave ou CNPJ", async () => {
    const id = await novaEmpresa();
    const { saida } = await admin.carregarCenario({ empresaId: id, cenario: "completo" });
    expect(saida).toContain("completo");
    expect(saida).toContain(id);
    expect(saida).toMatch(/940/);
    const semId = saida.replace(id, "");
    expect(semId).not.toMatch(/\d{7,}/);
    expect(semId).not.toContain(RAIZ);
    expect(semId).not.toMatch(/R\$|\d+\.\d{2}/);
  });
});

describe("processo do admin", () => {
  const RAIZ_DO_PACOTE = join(import.meta.dirname, "..");

  beforeAll(() => {
    const b = spawnSync(process.execPath, [join(RAIZ_DO_PACOTE, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.json"], {
      cwd: RAIZ_DO_PACOTE,
      encoding: "utf8",
      timeout: 120_000,
    });
    expect(b.status, b.stdout + b.stderr).toBe(0);
  }, 130_000);

  const rodar = (env: Record<string, string>, ...args: string[]) =>
    spawnSync(process.execPath, [join(RAIZ_DO_PACOTE, "dist", "admin", "main.js"), ...args], {
      cwd: RAIZ_DO_PACOTE,
      encoding: "utf8",
      env: { ...process.env, ...ENV, ...env },
      timeout: 60_000,
    });

  test("fora do ambiente local o processo sai com código 1 e diz o motivo", () => {
    const r = rodar(
      { CREDITOGOV_AMBIENTE: "homologacao" },
      "carregar-cenario",
      "--empresa",
      "00000000-0000-4000-8000-000000000000",
      "--cenario",
      "completo",
    );
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/local/);
  }, 130_000);

  test("sem as opções, sai com código 1; o cenário desconhecido também", () => {
    expect(rodar({}, "carregar-cenario").status).toBe(1);
    const r = rodar({}, "carregar-cenario", "--empresa", "00000000-0000-4000-8000-000000000000", "--cenario", "inventado");
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("completo");
  }, 130_000);

  test("a lista de comandos tem o carregar-cenario e nenhum que leia arquivo do disco (DT-13)", () => {
    const r = rodar({});
    expect(r.status).toBe(1);
    const comandosListados = [...r.stderr.matchAll(/^ {2}([a-z-]+)/gm)].map((m) => m[1]);
    expect(comandosListados.sort()).toEqual(["carregar-cenario", "convidar", "criar-empresa", "empresas-do-usuario", "remover-vinculo"]);
    expect(r.stderr).not.toMatch(/--(arquivo|caminho|pasta|importar)/i);
  }, 130_000);
});
