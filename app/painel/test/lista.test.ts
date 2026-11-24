import { describe, expect, it } from "vitest";
import { lerConsulta, listarCreditos, POR_PAGINA } from "../src/nucleo/lista.js";
import type { NotaCredito } from "../src/nucleo/tipos.js";
import { montarVisao } from "../src/nucleo/visao.js";
import { arquivoCreditos, credito, montarChave, NI14, RAIZ } from "./apoio/construtores.js";
import { cnpjInvalidoDe } from "./apoio/dv.js";
import { lido } from "./apoio/lidos.js";

const emit = (base8: string) => cnpjInvalidoDe(`${base8}0001`);
let seq = 0;
const chaveDe = (base8: string, modelo = "55") => montarChave({ emitente: emit(base8), modelo, codigo: String(20000000 + ++seq) });

function notasDe(periodos: Array<[string, Array<Record<string, unknown>>]>): NotaCredito[] {
  return montarVisao({ pasta: "/fict", legivel: true, arquivos: [lido("a.json", "creditos", arquivoCreditos(periodos, { ni: NI14 }))] }).notas;
}

const consulta = (query: string) => lerConsulta(new URLSearchParams(query)).consulta;
const chaves = (r: { linhas: Array<{ chave: string }> }) => r.linhas.map((l) => l.chave);

const X1 = chaveDe("11223344");
const X2 = chaveDe("11223344");
const Y1 = chaveDe("66778899");
const P1 = chaveDe(RAIZ);
const C57 = chaveDe("11223344", "57");
const SEM = "FICT-SEM-EMITENTE";

const base = notasDe([
  [
    "10/2026",
    [
      credito({ chave: X1, aApropriar: "10.00", emissao: "2026-10-03T10:00:00-03:00" }),
      credito({ chave: C57, documento: 57, aApropriar: "2.00", emissao: "2026-10-05T10:00:00-03:00" }),
    ],
  ],
  [
    "11/2026",
    [
      credito({ chave: X2, aApropriar: "30.00", emissao: "2026-11-02T10:00:00-03:00" }),
      credito({ chave: Y1, apropriado: "8.00", emissao: "2026-11-04T10:00:00-03:00" }),
      credito({ chave: P1, aApropriar: "5.00", emissao: "2026-11-06T10:00:00-03:00" }),
      credito({ chave: SEM, aApropriar: "7.00", emissao: "2026-11-01T10:00:00-03:00" }),
      credito({ chave: "FICT-DEVOLUCAO", origem: 20, aApropriar: "-1.00", emissao: "2026-11-07T10:00:00-03:00" }),
    ],
  ],
]);

describe("leitura da consulta pela URL (CA-10)", () => {
  it("padrões: emissão decrescente, primeira página, sem filtro", () => {
    const { consulta: c, avisos } = lerConsulta(new URLSearchParams(""));
    expect(c).toEqual({ pa: undefined, documento: undefined, emitente: undefined, pendente: false, busca: undefined, ordem: "emissao", sentido: "desc", pagina: 1 });
    expect(avisos).toEqual([]);
  });

  it("lê os filtros", () => {
    const c = consulta("pa=11/2026&documento=57&emitente=nao-identificado&pendente=1&busca=abcd&ordem=aApropriar&sentido=asc&pagina=3");
    expect(c).toEqual({ pa: "11/2026", documento: 57, emitente: "nao-identificado", pendente: true, busca: "ABCD", ordem: "aApropriar", sentido: "asc", pagina: 3 });
  });

  it("busca fora de 4 a 50 caracteres ou com outros símbolos é ignorada e avisada", () => {
    for (const ruim of ["abc", "ab-12", "a".repeat(51), "ab 12"]) {
      const { consulta: c, avisos } = lerConsulta(new URLSearchParams({ busca: ruim }));
      expect(c.busca, ruim).toBeUndefined();
      expect(avisos.length, ruim).toBe(1);
    }
    expect(lerConsulta(new URLSearchParams({ busca: "a".repeat(50) })).consulta.busca).toBeDefined();
    expect(lerConsulta(new URLSearchParams({ busca: "1234" })).avisos).toEqual([]);
  });

  it("valores inválidos voltam ao padrão", () => {
    const c = consulta("ordem=xx&sentido=yy&pagina=abc&documento=abc&pa=zz&pendente=0");
    expect([c.ordem, c.sentido, c.pagina, c.documento, c.pa, c.pendente]).toEqual(["emissao", "desc", 1, undefined, undefined, false]);
    expect(consulta("pagina=0").pagina).toBe(1);
    expect(consulta("pagina=-4").pagina).toBe(1);
  });
});

describe("filtros (CA-10)", () => {
  it("sem filtro, todas as notas, com o total a apropriar do filtro", () => {
    const r = listarCreditos(base, consulta(""));
    expect(r.totalNotas).toBe(base.length);
    expect(r.totalAApropriar.toFixed(2)).toBe("53.00");
  });

  it("por período", () => {
    expect(chaves(listarCreditos(base, consulta("pa=10/2026"))).sort()).toEqual([X1, C57].sort());
  });

  it("por tipo de documento", () => {
    expect(chaves(listarCreditos(base, consulta("documento=57")))).toEqual([C57]);
  });

  it("por emitente: CNPJ, raiz, não identificado e própria empresa", () => {
    expect(chaves(listarCreditos(base, consulta(`emitente=${emit("11223344")}`))).sort()).toEqual([X1, X2, C57].sort());
    expect(chaves(listarCreditos(base, consulta("emitente=66778899")))).toEqual([Y1]);
    expect(chaves(listarCreditos(base, consulta("emitente=nao-identificado"))).sort()).toEqual([SEM, "FICT-DEVOLUCAO"].sort());
    expect(chaves(listarCreditos(base, consulta("emitente=propria-empresa")))).toEqual([P1]);
  });

  it("só com valor a apropriar", () => {
    const r = listarCreditos(base, consulta("pendente=1"));
    expect(chaves(r)).not.toContain(Y1);
    expect(chaves(r)).not.toContain("FICT-DEVOLUCAO");
    expect(r.totalNotas).toBe(5);
  });

  it("busca por trecho da chave", () => {
    const trecho = X1.slice(35, 43);
    expect(chaves(listarCreditos(base, consulta(`busca=${trecho}`)))).toEqual([X1]);
    expect(chaves(listarCreditos(base, consulta("busca=emitente")))).toEqual([SEM]);
    expect(chaves(listarCreditos(base, consulta("busca=SEMEMIT")))).toEqual([]);
  });

  it("filtros combinados", () => {
    const r = listarCreditos(base, consulta(`pa=11/2026&emitente=${emit("11223344")}&pendente=1&documento=55`));
    expect(chaves(r)).toEqual([X2]);
    expect(r.totalAApropriar.toFixed(2)).toBe("30.00");
  });

  it("sem resultado", () => {
    const r = listarCreditos(base, consulta("pa=01/2020"));
    expect(r.totalNotas).toBe(0);
    expect(r.totalPaginas).toBe(1);
    expect(r.linhas).toEqual([]);
  });
});

describe("ordenação (CA-10)", () => {
  it("padrão: emissão decrescente", () => {
    const r = listarCreditos(base, consulta(""));
    expect(chaves(r)).toEqual(["FICT-DEVOLUCAO", P1, Y1, X2, SEM, C57, X1]);
  });

  it("emissão crescente", () => {
    const r = listarCreditos(base, consulta("ordem=emissao&sentido=asc"));
    expect(chaves(r)).toEqual([X1, C57, SEM, X2, Y1, P1, "FICT-DEVOLUCAO"]);
  });

  it("valor a apropriar nos dois sentidos", () => {
    expect(chaves(listarCreditos(base, consulta("ordem=aApropriar&sentido=desc")))[0]).toBe(X2);
    expect(chaves(listarCreditos(base, consulta("ordem=aApropriar&sentido=asc")))[0]).toBe("FICT-DEVOLUCAO");
  });

  it("empate pela chave", () => {
    const empatadas = notasDe([["11/2026", [credito({ chave: "B2", aApropriar: "1" }), credito({ chave: "A1", aApropriar: "1" }), credito({ chave: "C3", aApropriar: "1" })]]]);
    expect(chaves(listarCreditos(empatadas, consulta("ordem=aApropriar&sentido=desc")))).toEqual(["A1", "B2", "C3"]);
    expect(chaves(listarCreditos(empatadas, consulta("ordem=aApropriar&sentido=asc")))).toEqual(["A1", "B2", "C3"]);
  });
});

describe("paginação, com 1.000 notas em um período (CA-10, DT-5)", () => {
  const mil = notasDe([
    [
      "11/2026",
      Array.from({ length: 1000 }, (_, i) =>
        credito({
          chave: montarChave({ emitente: emit("11223344"), codigo: String(30000000 + i) }),
          aApropriar: "1.00",
          emissao: new Date(Date.UTC(2026, 10, 1, 0, i)).toISOString(),
        }),
      ),
    ],
  ]);

  it("100 por página, com o total de notas e de páginas", () => {
    expect(POR_PAGINA).toBe(100);
    const r = listarCreditos(mil, consulta(""));
    expect(r.linhas).toHaveLength(100);
    expect(r.totalNotas).toBe(1000);
    expect(r.totalPaginas).toBe(10);
    expect(r.pagina).toBe(1);
  });

  it("o total a apropriar é do filtro inteiro, não só da página", () => {
    expect(listarCreditos(mil, consulta("")).totalAApropriar.toFixed(2)).toBe("1000.00");
  });

  it("páginas seguem a ordem sem repetir nota", () => {
    const todas = new Set<string>();
    for (let p = 1; p <= 10; p++) for (const l of listarCreditos(mil, consulta(`pagina=${p}`)).linhas) todas.add(l.chave);
    expect(todas.size).toBe(1000);
  });

  it("página fora do intervalo mostra a última", () => {
    const r = listarCreditos(mil, consulta("pagina=99"));
    expect(r.pagina).toBe(10);
    expect(r.linhas).toHaveLength(100);
  });

  it("última página incompleta", () => {
    const r = listarCreditos(mil.slice(0, 250), consulta("pagina=3"));
    expect(r.linhas).toHaveLength(50);
    expect(r.totalPaginas).toBe(3);
  });
});

describe("origem diferente de normal (CA-13)", () => {
  it("a linha leva a marca com o nome da origem", () => {
    const linhas = listarCreditos(base, consulta("")).linhas;
    expect(linhas.find((l) => l.chave === "FICT-DEVOLUCAO")?.marcaOrigem).toBe("origem: DEVOLUCAO_POR_PCONT");
    expect(linhas.find((l) => l.chave === X1)?.marcaOrigem).toBeUndefined();
  });

  it("emissão fora do mês do período fica como vem", () => {
    const fora = listarCreditos(notasDe([["11/2026", [credito({ chave: "FORA", aApropriar: "1", emissao: "2026-09-30T23:00:00-03:00" })]]]), consulta("")).linhas[0];
    expect(fora.emissao).toBe("2026-09-30T23:00:00-03:00");
    expect(fora.pa).toBe("11/2026");
  });
});
