// indicadoresDeCredito (CA-1 a CA-12, CA-23, CA-25): totais separados, pendentes por emitente,
// evolução por período, origens. Funções puras sobre notas consolidadas.
import Big from "big.js";
import { describe, expect, it } from "vitest";
import { EMITENTES_NO_BLOCO, indicadoresDeCredito, periodosDisponiveis } from "../../src/indicadores/creditos.js";
import { cnpjInvalidoDe, cpfInvalidoDe } from "../../src/ficticios/dv.js";
import { montarChave, RAIZ } from "../apoio/construtores.js";
import { notaDoBanco, notasDoCenario } from "../apoio/notas.js";
import { VALOR_LONGO } from "../apoio/valores.js";

const CENARIOS_COM_DADOS = ["completo", "parcial", "falha-com-anteriores", "desatualizado", "recusado", "outros-valores"];
const soma = (valores: Array<string | undefined>) => valores.reduce((t, v) => t.plus(v ?? "0"), Big(0)).toFixed(2);
const emit = (base8: string, final = "0001") => cnpjInvalidoDe(`${base8}${final}`);

let numeroDaNota = 0;

/** Uma nota de compra de um emitente, com o valor a apropriar. */
function compra(emitente: string, aApropriar: string, extra: Parameters<typeof notaDoBanco>[0] = {}) {
  numeroDaNota++;
  return notaDoBanco({
    chave: montarChave({ emitente, numero: String(numeroDaNota).padStart(9, "0") }),
    valores: { apurado: aApropriar, aApropriar },
    ...extra,
  });
}

describe("CA-1: cada total é a soma do seu campo, nota a nota", () => {
  const notas = notasDoCenario("completo");
  const r = indicadoresDeCredito(notas, RAIZ, null);

  it("I-1 a I-5 batem com a soma calculada no teste, com ausente valendo zero, em texto com duas casas", () => {
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.totais).toEqual({
      apurado: soma(notas.map((n) => n.valores["apurado"])),
      aApropriar: soma(notas.map((n) => n.valores["aApropriar"])),
      apropriado: soma(notas.map((n) => n.valores["apropriado"])),
      utilizado: soma(notas.map((n) => n.valores["utilizado"])),
      saldoCredor: soma(notas.map((n) => n.valores["saldoCredor"])),
    });
    for (const v of Object.values(r.totais)) expect(v).toMatch(/^-?\d+\.\d{2}$/);
  });

  it("a soma não vira número: tudo sai como texto", () => {
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    for (const v of Object.values(r.totais)) expect(typeof v).toBe("string");
  });
});

describe("CA-2: nenhum total é derivado de outro", () => {
  it("a resposta tem uma lista fechada de chaves, sem soma, diferença nem proporção entre totais", () => {
    const r = indicadoresDeCredito(notasDoCenario("completo"), RAIZ, null);
    expect(Object.keys(r).sort()).toEqual(
      ["origens", "outros", "pendentes", "porPeriodo", "quantidadeComAApropriar", "quantidadeNotas", "semNotasNoRecorte", "totais"].sort(),
    );
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(Object.keys(r.totais).sort()).toEqual(["aApropriar", "apropriado", "apurado", "saldoCredor", "utilizado"]);
    expect(Object.keys(r.pendentes).sort()).toEqual(
      ["demais", "emitentes", "naoIdentificado", "negativos", "percentualNaoIdentificado", "propriaEmpresa"].sort(),
    );
  });

  it("apurado diferente de apropriado mais aApropriar aparece como veio", () => {
    const notas = [notaDoBanco({ valores: { apurado: "100.00", aApropriar: "30.00", apropriado: "20.00" } })];
    const r = indicadoresDeCredito(notas, RAIZ, null);
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.totais.apurado).toBe("100.00");
    expect(r.totais.aApropriar).toBe("30.00");
    expect(r.totais.apropriado).toBe("20.00");
    expect(r.totais.utilizado).toBe("0.00");
  });
});

describe("CA-3: outros valores só quando diferentes de zero", () => {
  it("no completo, outros é vazio", () => {
    const r = indicadoresDeCredito(notasDoCenario("completo"), RAIZ, null);
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.outros).toEqual([]);
  });

  it("no outros-valores, só os campos com soma diferente de zero, cada um em item próprio", () => {
    const notas = notasDoCenario("outros-valores");
    const r = indicadoresDeCredito(notas, RAIZ, null);
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.outros.map((o) => o.campo)).toEqual(["suspenso", "prescrito", "pedidoRessarcimento"]);
    for (const o of r.outros) expect(o.valor).toBe(soma(notas.map((n) => n.valores[o.campo])));
  });

  it("excedente entra com o mesmo tratamento (P-S2); soma zero fica de fora", () => {
    const notas = [
      notaDoBanco({ valores: { apurado: "1.00", excedente: "1.50", restabelecido: "2.00" } }),
      notaDoBanco({ valores: { apurado: "1.00", restabelecido: "-2.00", inutilizavel: "4.25" } }),
    ];
    const r = indicadoresDeCredito(notas, RAIZ, null);
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.outros).toEqual([
      { campo: "inutilizavel", valor: "4.25" },
      { campo: "excedente", valor: "1.50" },
    ]);
  });
});

describe("CA-5: quantidades", () => {
  it("quantidadeNotas e quantidadeComAApropriar", () => {
    const notas = notasDoCenario("completo");
    const r = indicadoresDeCredito(notas, RAIZ, null);
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.quantidadeNotas).toBe(notas.length);
    expect(r.quantidadeComAApropriar).toBe(notas.filter((n) => n.valores["aApropriar"] !== undefined && Big(n.valores["aApropriar"]).gt(0)).length);
    expect(r.quantidadeComAApropriar).toBeLessThan(r.quantidadeNotas);
  });
});

describe("CA-6: emitentes", () => {
  it("em ordem decrescente de total, com empate pelo identificador, CNPJ sem formatação", () => {
    const a = emit("16273849");
    const b = emit("48392017");
    const c = emit("72615839");
    const notas = [compra(c, "5.00"), compra(a, "5.00"), compra(b, "9.00"), compra(a, "0.50")];
    const r = indicadoresDeCredito(notas, RAIZ, null);
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.pendentes.emitentes).toEqual([
      { grupo: b, documento: "cnpj", quantidade: 1, total: "9.00" },
      { grupo: a, documento: "cnpj", quantidade: 2, total: "5.50" },
      { grupo: c, documento: "cnpj", quantidade: 1, total: "5.00" },
    ]);
    expect(r.pendentes.emitentes.every((e) => /^[0-9A-Z]{14}$/.test(e.grupo))).toBe(true);
  });

  it("só entram notas com valor a apropriar maior que zero", () => {
    const e = emit("16273849");
    const notas = [compra(e, "5.00"), notaDoBanco({ chave: montarChave({ emitente: e, numero: "000000777" }), valores: { apurado: "9.00" } })];
    const r = indicadoresDeCredito(notas, RAIZ, null);
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.pendentes.emitentes).toEqual([{ grupo: e, documento: "cnpj", quantidade: 1, total: "5.00" }]);
  });

  it("emitente CPF vira grupo com documento cpf e o CPF de 11 dígitos (P-S1)", () => {
    const cpf = cpfInvalidoDe("123456789");
    const nota = compra(`000${cpf}`, "7.00", {});
    nota.chave = montarChave({ emitente: `000${cpf}`, serie: "910" });
    const r = indicadoresDeCredito([nota], RAIZ, null);
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.pendentes.emitentes).toEqual([{ grupo: cpf, documento: "cpf", quantidade: 1, total: "7.00" }]);
  });
});

describe("CA-8: nota da própria empresa", () => {
  it("emitente com a raiz da empresa, de qualquer estabelecimento, vai para própria empresa", () => {
    const notas = [compra(emit(RAIZ, "0002"), "3.00"), compra(emit(RAIZ, "0007"), "2.00"), compra(emit("16273849"), "1.00")];
    const r = indicadoresDeCredito(notas, RAIZ, null);
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.pendentes.propriaEmpresa).toEqual({ quantidade: 2, total: "5.00" });
    expect(r.pendentes.emitentes).toHaveLength(1);
  });
});

describe("CA-9: a soma dos grupos fecha com I-2", () => {
  it.each(CENARIOS_COM_DADOS)("em %s: emitentes, demais, não identificado, própria empresa e negativos somam I-2 ao centavo", (nome) => {
    const r = indicadoresDeCredito(notasDoCenario(nome), RAIZ, null);
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    const p = r.pendentes;
    const total = Big(0)
      .plus(soma(p.emitentes.map((e) => e.total)))
      .plus(p.demais?.total ?? "0")
      .plus(p.naoIdentificado.total)
      .plus(p.propriaEmpresa.total)
      .plus(p.negativos?.total ?? "0");
    expect(total.toFixed(2)).toBe(r.totais.aApropriar);
  });

  it("a linha de negativos só existe no cenário que tem nota negativa (DT-10)", () => {
    for (const nome of CENARIOS_COM_DADOS) {
      const r = indicadoresDeCredito(notasDoCenario(nome), RAIZ, null);
      if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
      if (nome === "outros-valores") expect(r.pendentes.negativos).toEqual({ quantidade: 1, total: "-15.50" });
      else expect(r.pendentes.negativos, nome).toBeNull();
    }
  });

  it.each([
    ["1,00 de 3,00", "2.00", "1.00", "33.3"],
    ["1,00 de 8,00", "7.00", "1.00", "12.5"],
    ["1,00 de 16,00, meio para cima", "15.00", "1.00", "6.3"],
  ])("percentual não identificado, %s, é %s%%", (_nome, deEmitente, naoIdentificado, esperado) => {
    const notas = [compra(emit("16273849"), deEmitente), notaDoBanco({ chave: "NFSE-1", documento: 91, valores: { apurado: naoIdentificado, aApropriar: naoIdentificado } })];
    const r = indicadoresDeCredito(notas, RAIZ, null);
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.pendentes.naoIdentificado).toEqual({ quantidade: 1, total: naoIdentificado });
    expect(r.pendentes.percentualNaoIdentificado).toBe(esperado);
  });

  it("sem valor a apropriar (I-2 zero), o percentual não existe", () => {
    const r = indicadoresDeCredito([notaDoBanco({ valores: { apurado: "10.00" } })], RAIZ, null);
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.pendentes.percentualNaoIdentificado).toBeNull();
  });

  it("o documento 91, a chave de 50 posições e a de DV errado ficam em não identificado", () => {
    const certa = montarChave({ emitente: emit("16273849") });
    const dvErrado = `${certa.slice(0, 43)}${(Number(certa[43]) + 1) % 10}`;
    const notas = [
      notaDoBanco({ chave: "9".repeat(50), documento: 91, valores: { aApropriar: "1.00" } }),
      notaDoBanco({ chave: dvErrado, valores: { aApropriar: "2.00" } }),
    ];
    const r = indicadoresDeCredito(notas, RAIZ, null);
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.pendentes.naoIdentificado).toEqual({ quantidade: 2, total: "3.00" });
    expect(r.pendentes.emitentes).toEqual([]);
  });
});

describe("CA-10: limite do bloco e demais emitentes", () => {
  it("o limite provisório é 5 (P-S3)", () => {
    expect(EMITENTES_NO_BLOCO).toBe(5);
  });

  it("com o limite mais 3 emitentes, o bloco tem o limite e demais traz o resto", () => {
    const bases = ["10000001", "10000002", "10000003", "10000004", "10000005", "10000006", "10000007", "10000008"];
    const notas = bases.flatMap((b, i) => [compra(emit(b), `${100 - i * 10}.00`), compra(emit(b), "1.00")]);
    const r = indicadoresDeCredito(notas, RAIZ, null);
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(bases).toHaveLength(EMITENTES_NO_BLOCO + 3);
    expect(r.pendentes.emitentes).toHaveLength(EMITENTES_NO_BLOCO);
    const resto = bases.slice(EMITENTES_NO_BLOCO).map((_, k) => 100 - (EMITENTES_NO_BLOCO + k) * 10 + 1);
    expect(r.pendentes.demais).toEqual({ emitentes: 3, quantidade: 6, total: soma(resto.map(String)) });
  });

  it("com o limite ou menos emitentes, não há demais", () => {
    const notas = [compra(emit("16273849"), "1.00"), compra(emit("48392017"), "2.00")];
    const r = indicadoresDeCredito(notas, RAIZ, null);
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.pendentes.demais).toBeNull();
  });
});

describe("CA-11: evolução por período", () => {
  it("em ordem cronológica, inclusive na virada de ano, só períodos com nota, e cada coluna soma o total", () => {
    const notas = [
      notaDoBanco({ pa: "01/2027", valores: { apurado: "4.00", aApropriar: "4.00", utilizado: "1.00" } }),
      notaDoBanco({ pa: "12/2026", valores: { apurado: "2.00", aApropriar: "2.00" } }),
      notaDoBanco({ pa: "12/2026", valores: { apurado: "3.00", apropriado: "3.00" } }),
      notaDoBanco({ pa: "11/2026", valores: { apurado: "1.00", saldoCredor: "0" } }),
    ];
    const r = indicadoresDeCredito(notas, RAIZ, null);
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.porPeriodo.map((p) => p.periodo)).toEqual(["2026-11", "2026-12", "2027-01"]);
    for (const campo of ["apurado", "aApropriar", "apropriado", "utilizado", "saldoCredor"] as const) {
      expect(soma(r.porPeriodo.map((p) => p.totais[campo])), campo).toBe(r.totais[campo]);
    }
  });

  it("no completo são 9 períodos", () => {
    const r = indicadoresDeCredito(notasDoCenario("completo"), RAIZ, null);
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.porPeriodo).toHaveLength(9);
  });

  it("periodosDisponiveis lista AAAA-MM em ordem cronológica, sem repetir", () => {
    const notas = [notaDoBanco({ pa: "01/2027" }), notaDoBanco({ pa: "11/2026" }), notaDoBanco({ pa: "11/2026" }), notaDoBanco({ pa: "12/2026" })];
    expect(periodosDisponiveis(notas)).toEqual(["2026-11", "2026-12", "2027-01"]);
  });
});

describe("CA-12: recorte por período", () => {
  const notas = [
    compra(emit("16273849"), "5.00", { pa: "11/2026" }),
    compra(emit("48392017"), "7.00", { pa: "10/2026" }),
    notaDoBanco({ pa: "10/2026", valores: { apurado: "2.00", suspenso: "1.00" }, origem: 20 }),
  ];

  it("com recorte de um período, todos os blocos só têm notas dele", () => {
    const r = indicadoresDeCredito(notas, RAIZ, "2026-10");
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.quantidadeNotas).toBe(2);
    expect(r.totais.apurado).toBe("9.00");
    expect(r.totais.aApropriar).toBe("7.00");
    expect(r.pendentes.emitentes.map((e) => e.total)).toEqual(["7.00"]);
    expect(r.porPeriodo.map((p) => p.periodo)).toEqual(["2026-10"]);
    expect(r.outros).toEqual([{ campo: "suspenso", valor: "1.00" }]);
    expect(r.origens).toEqual([{ codigo: 20, nome: "DEVOLUCAO_POR_PCONT", quantidade: 1 }]);
  });

  it("recorte sem nota dá semNotasNoRecorte, sem totais", () => {
    const r = indicadoresDeCredito(notas, RAIZ, "2026-09");
    expect(r).toEqual({ semNotasNoRecorte: true });
  });

  it("sem notas nenhuma, também semNotasNoRecorte", () => {
    expect(indicadoresDeCredito([], RAIZ, null)).toEqual({ semNotasNoRecorte: true });
  });
});

describe("CA-23: sem perda de precisão", () => {
  it("o valor de 14 dígitos inteiros chega ao total como texto igual", () => {
    const r = indicadoresDeCredito([notaDoBanco({ valores: { apurado: VALOR_LONGO, aApropriar: VALOR_LONGO } })], RAIZ, null);
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.totais.apurado).toBe(VALOR_LONGO);
    expect(r.totais.aApropriar).toBe(VALOR_LONGO);
    expect(r.porPeriodo[0]?.totais.apurado).toBe(VALOR_LONGO);
  });
});

describe("CA-25: origens diferentes de normal", () => {
  it("no outros-valores, lista 20 e 30 com o nome da tabela oficial e a quantidade; os valores entram com o sinal", () => {
    const notas = notasDoCenario("outros-valores");
    const r = indicadoresDeCredito(notas, RAIZ, null);
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.origens).toEqual([
      { codigo: 20, nome: "DEVOLUCAO_POR_PCONT", quantidade: 1 },
      { codigo: 30, nome: "CANCELAMENTO_CREDITO", quantidade: 1 },
    ]);
    expect(r.totais.aApropriar).toBe(soma(notas.map((n) => n.valores["aApropriar"])));
  });

  it("no completo não há origem para avisar", () => {
    const r = indicadoresDeCredito(notasDoCenario("completo"), RAIZ, null);
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.origens).toEqual([]);
  });

  it("origem sem nome na tabela mostra o código", () => {
    const r = indicadoresDeCredito([notaDoBanco({ origem: 77, valores: { apurado: "1.00" } })], RAIZ, null);
    if (r.semNotasNoRecorte) throw new Error("era esperado haver notas");
    expect(r.origens[0]).toMatchObject({ codigo: 77, quantidade: 1 });
  });
});
