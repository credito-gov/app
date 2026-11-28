// CA-23 no backend: valores em texto decimal, soma exata de duas notas de 14 dígitos inteiros,
// e nenhuma conversão para número de ponto flutuante em src/indicadores e src/paineis.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { consolidarNotas } from "../../src/indicadores/consolidacao.js";
import { agruparPendentes, indicadoresDeCredito } from "../../src/indicadores/creditos.js";
import { indicadoresDeDebito } from "../../src/indicadores/debitos.js";
import { montarNotasDoGrupo } from "../../src/paineis/dados.js";
import { RAIZ } from "../apoio/construtores.js";
import { consolidadoDeCreditos, notaDoBanco } from "../apoio/notas.js";
import { VALOR_MAXIMO_14 } from "../apoio/valores.js";

/** Duas vezes o maior valor de 14 dígitos inteiros: 15 dígitos inteiros e .98. */
const DOBRO = `1${VALOR_MAXIMO_14.slice(0, -3)}.98`;

describe("CA-23: a soma de duas notas de valor máximo é exata", () => {
  it("créditos: totais, total por período e total a apropriar dos pendentes", () => {
    const campos = {
      apurado: VALOR_MAXIMO_14,
      aApropriar: VALOR_MAXIMO_14,
      apropriado: VALOR_MAXIMO_14,
      utilizado: VALOR_MAXIMO_14,
      saldoCredor: VALOR_MAXIMO_14,
    };
    const notas = consolidarNotas([
      notaDoBanco({ chave: "PRECISAO-1", valores: campos }),
      notaDoBanco({ chave: "PRECISAO-2", valores: campos }),
    ]);
    const r = indicadoresDeCredito(notas, RAIZ, null);
    if (r.semNotasNoRecorte) throw new Error("sem notas");
    for (const campo of ["apurado", "aApropriar", "apropriado", "utilizado", "saldoCredor"] as const) {
      expect(r.totais[campo], campo).toBe(DOBRO);
      expect(typeof r.totais[campo]).toBe("string");
    }
    expect(r.porPeriodo).toHaveLength(1);
    expect(r.porPeriodo[0]!.totais.aApropriar).toBe(DOBRO);
    expect(agruparPendentes(notas, RAIZ).totalAApropriar).toBe(DOBRO);
  });

  it("débitos: totais", () => {
    const campos = { apurado: VALOR_MAXIMO_14, extinto: VALOR_MAXIMO_14, saldoDevedor: VALOR_MAXIMO_14 };
    const r = indicadoresDeDebito(
      consolidarNotas([notaDoBanco({ chave: "PRECISAO-D1", valores: campos }), notaDoBanco({ chave: "PRECISAO-D2", valores: campos })]),
      null,
    );
    if (r.semNotasNoRecorte) throw new Error("sem notas");
    expect(r.totais).toEqual({ apurado: DOBRO, extinto: DOBRO, saldoDevedor: DOBRO });
  });

  it("total das notas de um grupo", () => {
    const c = consolidadoDeCreditos([
      notaDoBanco({ chave: "SEM-LEIAUTE-A", valores: { aApropriar: VALOR_MAXIMO_14 } }),
      notaDoBanco({ chave: "SEM-LEIAUTE-B", valores: { aApropriar: VALOR_MAXIMO_14 } }),
    ]);
    const r = montarNotasDoGrupo(c, null, "nao-identificado", undefined);
    if (r.tipo !== "ok") throw new Error(`esperava ok, veio ${r.tipo}`);
    expect(r.corpo["total"]).toBe(DOBRO);
  });
});

describe("CA-23: sem número de ponto flutuante nos indicadores e no painel", () => {
  const raiz = join(import.meta.dirname, "..", "..", "src");
  const arquivos = (pasta: string): string[] =>
    readdirSync(pasta).flatMap((nome) => {
      const c = join(pasta, nome);
      return statSync(c).isDirectory() ? arquivos(c) : /\.ts$/.test(nome) ? [c] : [];
    });

  it("src/indicadores e src/paineis não contêm Number(, parseFloat nem parseInt", () => {
    const todos = [...arquivos(join(raiz, "indicadores")), ...arquivos(join(raiz, "paineis"))];
    expect(todos.length).toBeGreaterThan(0);
    for (const c of todos) {
      const texto = readFileSync(c, "utf8");
      for (const proibido of ["Number(", "parseFloat", "parseInt"]) {
        expect(texto, `${c}: ${proibido}`).not.toContain(proibido);
      }
    }
  });
});
