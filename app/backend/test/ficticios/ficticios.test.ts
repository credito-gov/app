// Gerador fictício e cenários (CA-26): determinismo, formato oficial, forma observada nos arquivos
// reais (O-3 a O-25) e os nove cenários da Spec. Sem banco, sem rede, sem disco.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { CENARIOS, montarCenario, type ConsultaDeCenario } from "../../src/ficticios/cenarios.js";
import { cnpjValido, dvChave } from "../../src/ficticios/dv.js";
import { interpretarRetorno, type NotaInterpretada } from "../../src/leitura/registrar.js";
import { RAIZ } from "../apoio/construtores.js";

const AGORA = new Date("2026-11-27T15:00:00.000Z");
const DIA = 24 * 60 * 60_000;
const P = { raiz: RAIZ, agora: AGORA, semente: 7 };

const cenario = (nome: string) => montarCenario(nome, P);
const lidas = (c: ConsultaDeCenario[], servico: "creditos" | "debitos") =>
  c.filter((x) => x.servico === servico && x.estado === "lida");
const notasDe = (c: ConsultaDeCenario[], servico: "creditos" | "debitos"): NotaInterpretada[] =>
  lidas(c, servico).flatMap((x) => interpretarRetorno(x.retorno!, servico, RAIZ).notas);
const texto = (b: Uint8Array) => new TextDecoder().decode(b);
const identidade = (n: NotaInterpretada) => `${n.pa}|${n.chave}|${n.documento}|${n.origem}`;

describe("lista de cenários", () => {
  test("existem os nove da Spec, e um nome desconhecido é recusado", () => {
    expect([...CENARIOS].sort()).toEqual(
      ["completo", "sem-consulta", "em-andamento", "vazio", "parcial", "falha-com-anteriores", "desatualizado", "recusado", "outros-valores"].sort(),
    );
    expect(() => montarCenario("inventado", P)).toThrow();
  });
});

describe("determinismo", () => {
  test("a mesma semente e o mesmo relógio dão o mesmo conteúdo, byte a byte", () => {
    const a = cenario("completo");
    const b = cenario("completo");
    expect(a).toHaveLength(b.length);
    a.forEach((x, i) => {
      expect(x.estado).toBe(b[i]?.estado);
      expect(x.criadaEm).toEqual(b[i]?.criadaEm);
      expect(x.retorno === null).toBe(b[i]?.retorno === null);
      if (x.retorno) expect(Buffer.from(x.retorno).equals(Buffer.from(b[i]!.retorno!))).toBe(true);
    });
  });

  test("outra semente muda o conteúdo", () => {
    const a = cenario("completo")[0]!.retorno!;
    const b = montarCenario("completo", { ...P, semente: 8 })[0]!.retorno!;
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
  });

  test("o gerador não lê disco, rede nem process.env", () => {
    for (const arquivo of ["gerador.ts", "cenarios.ts", "dv.ts"]) {
      const fonte = readFileSync(join(import.meta.dirname, "..", "..", "src", "ficticios", arquivo), "utf8");
      for (const proibido of ["node:fs", "node:net", "node:http", "node:https", "process.env", "fetch(", "readFile", "new Date()", "Date.now("]) {
        expect(fonte, `${arquivo}: ${proibido}`).not.toContain(proibido);
      }
    }
  });
});

describe("formato oficial", () => {
  test.each(CENARIOS.filter((n) => n !== "recusado"))("todo retorno de %s passa pela leitura", (nome) => {
    for (const c of cenario(nome)) {
      if (!c.retorno) continue;
      const r = interpretarRetorno(c.retorno, c.servico as "creditos" | "debitos", RAIZ);
      expect(["aceito", "aceito_com_divergencia"], `${nome} ${c.servico}`).toContain(r.situacao);
    }
  });

  test("no cenário recusado, só os retornos de propósito são recusados, com os dois motivos", () => {
    const c = cenario("recusado");
    const resultados = c.filter((x) => x.retorno).map((x) => interpretarRetorno(x.retorno!, x.servico as "creditos" | "debitos", RAIZ));
    const motivos = resultados.filter((r) => r.situacao === "recusado").map((r) => r.motivo).sort();
    expect(motivos).toEqual(["fora_do_schema", "outra_empresa"]);
    expect(resultados.some((r) => r.situacao !== "recusado" && r.notas.length > 0)).toBe(true);
  });
});

describe("forma observada (cenário completo)", () => {
  const c = cenario("completo");
  const creditos = notasDe(c, "creditos");
  const unicas = new Map(creditos.map((n) => [identidade(n), n]));

  test("entre 850 e 950 créditos em 9 períodos, mais da metade num só", () => {
    expect(unicas.size).toBeGreaterThanOrEqual(850);
    expect(unicas.size).toBeLessThanOrEqual(950);
    const porPeriodo = new Map<string, number>();
    for (const n of unicas.values()) porPeriodo.set(n.pa, (porPeriodo.get(n.pa) ?? 0) + 1);
    expect(porPeriodo.size).toBe(9);
    expect(Math.max(...porPeriodo.values())).toBeGreaterThan(unicas.size / 2);
  });

  test("documentos 55, 57, 62, 65 e 91; o 91 entre 10% e 20%, com chave de 50 posições", () => {
    const docs = new Set([...unicas.values()].map((n) => n.documento));
    for (const d of [55, 57, 62, 65, 91]) expect(docs.has(d), String(d)).toBe(true);
    const nfse = [...unicas.values()].filter((n) => n.documento === 91);
    expect(nfse.length / unicas.size).toBeGreaterThanOrEqual(0.1);
    expect(nfse.length / unicas.size).toBeLessThanOrEqual(0.2);
    expect(nfse.every((n) => n.chave.length === 50)).toBe(true);
    const outras = [...unicas.values()].filter((n) => n.documento !== 91);
    expect(outras.every((n) => /^\d{44}$/.test(n.chave))).toBe(true);
  });

  test("ao menos 95% com aApropriar maior que zero; apropriado igual a utilizado onde há os dois", () => {
    const todas = [...unicas.values()];
    const com = todas.filter((n) => n.valores["aApropriar"] !== undefined && Number(n.valores["aApropriar"]) > 0);
    expect(com.length / todas.length).toBeGreaterThanOrEqual(0.95);
    const dois = todas.filter((n) => n.valores["apropriado"] !== undefined && n.valores["utilizado"] !== undefined);
    expect(dois.length).toBeGreaterThan(0);
    expect(dois.every((n) => n.valores["apropriado"] === n.valores["utilizado"])).toBe(true);
  });

  test("saldoCredor presente e zero; nenhum outro campo de valor com zero escrito", () => {
    for (const n of unicas.values()) {
      expect(Number(n.valores["saldoCredor"]), n.chave).toBe(0);
      expect(n.valores["saldoCredor"]).toBeDefined();
      for (const [campo, v] of Object.entries(n.valores)) {
        if (campo !== "saldoCredor") expect(Number(v), `${campo} de ${n.chave}`).not.toBe(0);
      }
    }
  });

  test("uma nota emitida pela própria raiz da empresa", () => {
    const propria = [...unicas.values()].filter((n) => n.documento !== 91 && n.chave.slice(6, 14) === RAIZ);
    expect(propria).toHaveLength(1);
  });

  test("a segunda consulta traz versões novas de algumas notas, com atualizacao mais recente", () => {
    const [primeira, segunda] = lidas(c, "creditos");
    expect(primeira && segunda).toBeTruthy();
    const a = new Map(interpretarRetorno(primeira!.retorno!, "creditos", RAIZ).notas.map((n) => [identidade(n), n]));
    const b = interpretarRetorno(segunda!.retorno!, "creditos", RAIZ).notas;
    const repetidas = b.filter((n) => a.has(identidade(n)));
    expect(repetidas.length).toBeGreaterThan(0);
    expect(repetidas.every((n) => Date.parse(n.atualizacao) > Date.parse(a.get(identidade(n))!.atualizacao))).toBe(true);
    expect(segunda!.concluidaEm!.getTime()).toBe(AGORA.getTime() - DIA);
  });

  test("débitos em 3 períodos", () => {
    const debitos = notasDe(c, "debitos");
    expect(new Set(debitos.map((n) => n.pa)).size).toBe(3);
  });

  test("números escritos como número JSON, com 0 a 2 casas", () => {
    const bruto = texto(lidas(c, "creditos")[0]!.retorno!);
    const valores = [...bruto.matchAll(/"(?:apurado|aApropriar|apropriado|utilizado|saldoCredor)":\s*([^,\n}]+)/g)].map((m) => m[1]!.trim());
    expect(valores.length).toBeGreaterThan(1000);
    for (const v of valores) expect(v, v).toMatch(/^-?\d+(\.\d{1,2})?$/);
    const objeto = JSON.parse(bruto) as { apuracao: { creditos: { cbs: { apurado: unknown } }[] }[] };
    expect(typeof objeto.apuracao[0]?.creditos[0]?.cbs.apurado).toBe("number");
  });
});

describe("dados fictícios (CA-26)", () => {
  test.each([...CENARIOS])("em %s, todo CNPJ de 14 dígitos tem o DV inválido e toda chave de 44 posições tem o DV válido", (nome) => {
    for (const c of cenario(nome)) {
      if (!c.retorno) continue;
      const bruto = texto(c.retorno);
      let objeto: { ni?: string; niConsumidor?: string; apuracao?: Record<string, unknown>[] };
      try {
        objeto = JSON.parse(bruto);
      } catch {
        continue; // retorno ilegível de propósito (cenário recusado)
      }
      for (const ni of [objeto.ni, objeto.niConsumidor]) {
        if (ni && /^\d{14}$/.test(ni)) expect(cnpjValido(ni), `ni de ${nome}`).toBe(false);
      }
      for (const bloco of objeto.apuracao ?? []) {
        for (const lista of [bloco["creditos"], bloco["debitos"]]) {
          for (const nota of (lista as { chave: string; documento: number }[] | undefined) ?? []) {
            if (nota.chave.length !== 44) continue;
            expect(nota.chave[43], `DV da chave em ${nome}`).toBe(dvChave(nota.chave.slice(0, 43)));
            expect(cnpjValido(nota.chave.slice(6, 20)), `emitente em ${nome}`).toBe(false);
            expect(nota.chave.slice(20, 22)).toBe(String(nota.documento));
          }
        }
      }
    }
  });
});

describe("os nove cenários (tabela da Spec)", () => {
  test("sem-consulta não grava nada", () => {
    expect(cenario("sem-consulta")).toEqual([]);
  });

  test("em-andamento: uma consulta de créditos aberta, sem retorno e sem horários", () => {
    const c = cenario("em-andamento");
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ servico: "creditos", estado: "aberta", concluidaEm: null, finalizadaEm: null, retorno: null });
    expect(c[0]!.criadaEm.getTime()).toBeLessThanOrEqual(AGORA.getTime());
  });

  test("vazio: consultas lidas com apuracao vazia nos dois serviços", () => {
    const c = cenario("vazio");
    expect(c.map((x) => `${x.servico}:${x.estado}`).sort()).toEqual(["creditos:lida", "debitos:lida"]);
    for (const x of c) {
      const r = interpretarRetorno(x.retorno!, x.servico as "creditos" | "debitos", RAIZ);
      expect(r).toMatchObject({ situacao: expect.stringMatching(/^aceito/), notas: [] });
    }
  });

  test("parcial: créditos com dados; débitos só com uma consulta em erro", () => {
    const c = cenario("parcial");
    expect(notasDe(c, "creditos").length).toBeGreaterThan(0);
    const debitos = c.filter((x) => x.servico === "debitos");
    expect(debitos).toHaveLength(1);
    expect(debitos[0]).toMatchObject({ estado: "erro", concluidaEm: null, retorno: null });
    expect(debitos[0]!.finalizadaEm).toBeInstanceOf(Date);
  });

  test("falha-com-anteriores: dados de 3 dias atrás e a última tentativa de créditos em credencial_invalida, hoje", () => {
    const c = cenario("falha-com-anteriores");
    for (const l of [...lidas(c, "creditos"), ...lidas(c, "debitos")]) expect(l.concluidaEm!.getTime()).toBe(AGORA.getTime() - 3 * DIA);
    expect(notasDe(c, "creditos").length).toBeGreaterThan(0);
    const falha = c.filter((x) => x.servico === "creditos" && x.estado === "credencial_invalida");
    expect(falha).toHaveLength(1);
    expect(falha[0]!.concluidaEm).toBeNull();
    expect(falha[0]!.finalizadaEm!.getTime()).toBeGreaterThan(AGORA.getTime() - 12 * 60 * 60_000);
    expect(falha[0]!.finalizadaEm!.getTime()).toBeLessThanOrEqual(AGORA.getTime());
    expect(falha[0]!.criadaEm.getTime()).toBeGreaterThan(Math.max(...lidas(c, "creditos").map((x) => x.criadaEm.getTime())));
  });

  test("desatualizado: a última consulta concluída foi há 9 dias nos dois serviços", () => {
    const c = cenario("desatualizado");
    for (const servico of ["creditos", "debitos"] as const) {
      const ultima = Math.max(...lidas(c, servico).map((x) => x.concluidaEm!.getTime()));
      expect(ultima).toBe(AGORA.getTime() - 9 * DIA);
    }
  });

  test("recusado: dados aceitos, mais um retorno de outra raiz e um fora do schema", () => {
    const c = cenario("recusado");
    const creditos = lidas(c, "creditos");
    expect(creditos.length).toBeGreaterThanOrEqual(3);
    expect(creditos.every((x) => x.concluidaEm !== null && x.finalizadaEm !== null)).toBe(true);
  });

  test("outros-valores: suspenso, prescrito e pedidoRessarcimento diferentes de zero, origens 20 e 30 e aApropriar negativo", () => {
    const notas = notasDe(cenario("outros-valores"), "creditos");
    for (const campo of ["suspenso", "prescrito", "pedidoRessarcimento"]) {
      expect(notas.some((n) => n.valores[campo] !== undefined && Number(n.valores[campo]) !== 0), campo).toBe(true);
    }
    const origens = new Set(notas.map((n) => n.origem));
    expect(origens.has(20)).toBe(true);
    expect(origens.has(30)).toBe(true);
    expect(notas.filter((n) => Number(n.valores["aApropriar"] ?? 0) < 0)).toHaveLength(1);
  });
});
