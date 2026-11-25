import { describe, expect, it } from "vitest";
import { consolidarNotas } from "../src/nucleo/consolidacao.js";
import { calcularTotaisDebitos } from "../src/nucleo/debitos.js";
import { calcularTotais } from "../src/nucleo/saldo.js";
import { arquivoCreditos, arquivoDebitos, credito, debito, n } from "./apoio/construtores.js";
import { lido } from "./apoio/lidos.js";

const notasDe = (periodos: Array<[string, Array<Record<string, unknown>>]>) => consolidarNotas([lido("a.json", "creditos", arquivoCreditos(periodos))], "creditos").notas;
const t = (v: { toFixed(d: number): string }) => v.toFixed(2);

describe("quatro totais por período e gerais (CA-7, D-3, DT-8)", () => {
  const notas = notasDe([
    ["11/2026", [credito({ chave: "C", aApropriar: "0.1" }), credito({ chave: "D", aApropriar: "0.2" })]],
    [
      "10/2026",
      [
        credito({ chave: "A", aApropriar: "100.10", apropriado: "50", utilizado: "20", saldoCredor: "30" }),
        // apropriado (10) é diferente de utilizado + saldoCredor (4 + 5): nenhum total é derivado de outro
        credito({ chave: "B", aApropriar: "0.20", apropriado: "10", utilizado: "4", saldoCredor: "5" }),
      ],
    ],
  ]);
  const r = calcularTotais(notas);

  it("cada total é a soma do seu campo, conferida à mão", () => {
    const p10 = r.porPeriodo.find((p) => p.pa === "10/2026")!.totais;
    expect([t(p10.aApropriar), t(p10.apropriado), t(p10.utilizado), t(p10.saldoCredor)]).toEqual(["100.30", "60.00", "24.00", "35.00"]);
    const p11 = r.porPeriodo.find((p) => p.pa === "11/2026")!.totais;
    expect([t(p11.aApropriar), t(p11.apropriado), t(p11.utilizado), t(p11.saldoCredor)]).toEqual(["0.30", "0.00", "0.00", "0.00"]);
    expect([t(r.geral.aApropriar), t(r.geral.apropriado), t(r.geral.utilizado), t(r.geral.saldoCredor)]).toEqual(["100.60", "60.00", "24.00", "35.00"]);
  });

  it("nenhum total é calculado a partir dos outros", () => {
    expect(t(r.geral.apropriado)).not.toBe(t(r.geral.utilizado.plus(r.geral.saldoCredor)));
  });

  it("períodos em ordem cronológica", () => {
    expect(r.porPeriodo.map((p) => p.pa)).toEqual(["10/2026", "11/2026"]);
    const virada = calcularTotais(notasDe([["01/2027", [credito({ chave: "X" })]], ["12/2026", [credito({ chave: "Y" })]]]));
    expect(virada.porPeriodo.map((p) => p.pa)).toEqual(["12/2026", "01/2027"]);
  });

  it("a estrutura tem só os quatro totais (CA-8)", () => {
    expect(Object.keys(r.geral).sort()).toEqual(["aApropriar", "apropriado", "saldoCredor", "utilizado"]);
  });

  it("suspenso, inapropriável e prescrito não entram em nenhum total (CA-8)", () => {
    const base = calcularTotais(notasDe([["11/2026", [credito({ chave: "A", aApropriar: "10.00" })]]]));
    const com = calcularTotais(
      notasDe([
        [
          "11/2026",
          [
            credito({
              chave: "A",
              aApropriar: "10.00",
              extras: { apropriacao: { suspenso: n("999.00"), inapropriavel: n("888.00"), prescrito: n("777.00") }, cbs: { excedente: n("666.00") } },
            }),
          ],
        ],
      ]),
    );
    expect(com.geral.aApropriar.eq(base.geral.aApropriar)).toBe(true);
    for (const k of ["apropriado", "utilizado", "saldoCredor"] as const) expect(t(com.geral[k])).toBe("0.00");
  });

  it("campo ausente vale zero", () => {
    const so = calcularTotais(notasDe([["11/2026", [credito({ chave: "A", apropriado: "5" })]]]));
    expect(t(so.geral.aApropriar)).toBe("0.00");
    expect(t(so.geral.apropriado)).toBe("5.00");
  });

  it("sem notas, não há período e os totais gerais são zero", () => {
    const vazio = calcularTotais([]);
    expect(vazio.porPeriodo).toEqual([]);
    expect(t(vazio.geral.aApropriar)).toBe("0.00");
  });
});

describe("origens diferentes de normal e emissão fora do mês (CA-13, D-6)", () => {
  it("somadas como vêm, inclusive valor negativo", () => {
    const r = calcularTotais(
      notasDe([["11/2026", [credito({ chave: "A", aApropriar: "100.00" }), credito({ chave: "B", origem: 20, aApropriar: "-30.50" }), credito({ chave: "C", origem: 30, aApropriar: "10.00" })]]]),
    );
    expect(t(r.geral.aApropriar)).toBe("79.50");
  });

  it("emissão fora do mês do período não muda nada", () => {
    const r = calcularTotais(notasDe([["11/2026", [credito({ chave: "A", aApropriar: "10.00", emissao: "2026-10-30T10:00:00-03:00" }), credito({ chave: "B", aApropriar: "5.00", emissao: "2026-12-02T10:00:00-03:00" })]]]));
    expect(t(r.porPeriodo[0].totais.aApropriar)).toBe("15.00");
  });
});

describe("totais de débitos (CA-D2)", () => {
  const debitos = consolidarNotas(
    [
      lido(
        "d.json",
        "debitos",
        arquivoDebitos([
          ["11/2026", [debito({ chave: "D3", apurado: "0.1", saldoDevedor: "0.1" }), debito({ chave: "D4", apurado: "0.2", saldoDevedor: "0.2" })]],
          ["10/2026", [debito({ chave: "D1", apurado: "100", extinto: "40", saldoDevedor: "60" }), debito({ chave: "D2", apurado: "50.50" })]],
        ]),
      ),
    ],
    "debitos",
  ).notas;
  const r = calcularTotaisDebitos(debitos);

  it("apurado, extinto e saldoDevedor por período e gerais", () => {
    const p10 = r.porPeriodo.find((p) => p.pa === "10/2026")!.totais;
    expect([t(p10.apurado), t(p10.extinto), t(p10.saldoDevedor)]).toEqual(["150.50", "40.00", "110.50"]);
    expect(r.porPeriodo.map((p) => p.pa)).toEqual(["10/2026", "11/2026"]);
    expect([t(r.geral.apurado), t(r.geral.extinto), t(r.geral.saldoDevedor)]).toEqual(["150.80", "40.00", "110.80"]);
  });

  it("a estrutura tem só os três totais de débito", () => {
    expect(Object.keys(r.geral).sort()).toEqual(["apurado", "extinto", "saldoDevedor"]);
  });
});
