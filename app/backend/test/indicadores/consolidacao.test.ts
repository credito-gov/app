// Consolidação (CA-24, D-5): cada nota conta uma vez; vence a versão mais recente.
import { describe, expect, it } from "vitest";
import { consolidarNotas, type NotaDoBanco } from "../../src/indicadores/consolidacao.js";

let sequencia = 0;
function nota(extra: Partial<NotaDoBanco> = {}): NotaDoBanco {
  sequencia++;
  return {
    arquivoId: `aaaaaaaa-0000-4000-8000-${String(sequencia).padStart(12, "0")}`,
    situacaoArquivo: "aceito",
    geradoEm: "2026-11-20T10:00:00.000-03:00",
    recebidoEm: new Date("2026-11-20T13:05:00.000Z"),
    pa: "11/2026",
    chave: "X",
    documento: 55,
    origem: 0,
    emissao: "2026-11-02T10:00:00.000-03:00",
    registro: "2026-11-02T10:05:00.000-03:00",
    atualizacao: "2026-11-10T10:00:00-03:00",
    valores: { aApropriar: "10.00" },
    ...extra,
  };
}
const aApropriar = (n: NotaDoBanco) => n.valores["aApropriar"];
const G1 = "2026-11-20T10:00:00.000-03:00";
const G2 = "2026-11-21T10:00:00.000-03:00";

describe("a mesma nota em duas consultas conta uma vez (CA-24)", () => {
  it("sem repetição, todas entram", () => {
    const r = consolidarNotas([nota({ chave: "X" }), nota({ chave: "Y" })]);
    expect(r.map((n) => n.chave).sort()).toEqual(["X", "Y"]);
  });

  it("a mesma nota em dois arquivos conta uma vez", () => {
    expect(consolidarNotas([nota({ chave: "X" }), nota({ chave: "X" })])).toHaveLength(1);
  });

  it("o mesmo arquivo repetido não duplica nenhuma nota", () => {
    const a = [nota({ chave: "X" }), nota({ chave: "Y", valores: { aApropriar: "5.50" } })];
    const b = a.map((n, i) => ({ ...n, arquivoId: `aaaaaaaa-0000-4000-8000-${String(900 + i).padStart(12, "0")}` }));
    expect(consolidarNotas([...a, ...b])).toHaveLength(2);
  });

  it("identidade é período, chave, documento e origem: mudar qualquer um é outra nota", () => {
    const r = consolidarNotas([
      nota({ chave: "X" }),
      nota({ chave: "X", documento: 57 }),
      nota({ chave: "X", origem: 20 }),
      nota({ chave: "X", pa: "10/2026" }),
      nota({ chave: "Y" }),
    ]);
    expect(r).toHaveLength(5);
  });

  it("a mesma chave com origem diferente são duas notas", () => {
    const r = consolidarNotas([nota({ chave: "X", origem: 0 }), nota({ chave: "X", origem: 30 })]);
    expect(r.map((n) => n.origem).sort()).toEqual([0, 30]);
  });

  it("serve a débitos: os mesmos critérios, com valores de débito", () => {
    const v1 = nota({ chave: "D", valores: { saldoDevedor: "10.00" }, atualizacao: "2026-11-10T10:00:00-03:00" });
    const v2 = nota({ chave: "D", valores: { saldoDevedor: "6.00" }, atualizacao: "2026-11-12T10:00:00-03:00" });
    expect(consolidarNotas([v1, v2])[0]?.valores["saldoDevedor"]).toBe("6.00");
  });
});

describe("critérios de desempate, nesta ordem (D-5)", () => {
  it("1. vence a atualizacao mais recente, em qualquer ordem da lista", () => {
    const velha = nota({ chave: "X", valores: { aApropriar: "10.00" }, atualizacao: "2026-11-10T10:00:00-03:00" });
    const nova = nota({ chave: "X", valores: { aApropriar: "20.00" }, atualizacao: "2026-11-11T10:00:00-03:00" });
    expect(aApropriar(consolidarNotas([velha, nova])[0]!)).toBe("20.00");
    expect(aApropriar(consolidarNotas([nova, velha])[0]!)).toBe("20.00");
  });

  it.each([
    ["0 casas de fração contra 3", "2026-11-10T10:00:00-03:00", "2026-11-10T10:00:00.001-03:00"],
    ["3 casas contra 6", "2026-11-10T10:00:00.123-03:00", "2026-11-10T10:00:00.123456-03:00"],
    ["0 casas contra 6", "2026-11-10T10:00:00-03:00", "2026-11-10T10:00:00.000001-03:00"],
    ["fusos diferentes: 10:00:00.999999-03:00 contra 13:00:01Z", "2026-11-10T10:00:00.999999-03:00", "2026-11-10T13:00:01Z"],
  ])("atualizacao com %s: vence o instante maior", (_nome, menor, maior) => {
    const a = nota({ chave: "X", valores: { aApropriar: "10.00" }, atualizacao: menor });
    const b = nota({ chave: "X", valores: { aApropriar: "20.00" }, atualizacao: maior });
    expect(aApropriar(consolidarNotas([a, b])[0]!)).toBe("20.00");
    expect(aApropriar(consolidarNotas([b, a])[0]!)).toBe("20.00");
  });

  it("o mesmo instante escrito de formas diferentes empata e passa para o critério seguinte", () => {
    const a = nota({ chave: "X", valores: { aApropriar: "10.00" }, atualizacao: "2026-11-10T10:00:00-03:00", geradoEm: G1 });
    const b = nota({ chave: "X", valores: { aApropriar: "20.00" }, atualizacao: "2026-11-10T13:00:00Z", geradoEm: G2 });
    expect(aApropriar(consolidarNotas([a, b])[0]!)).toBe("20.00");
    expect(aApropriar(consolidarNotas([b, a])[0]!)).toBe("20.00");
  });

  it("2. empate na atualizacao: vale o arquivo com gerado_em mais recente", () => {
    const a = nota({ chave: "X", valores: { aApropriar: "10.00" }, geradoEm: G2 });
    const b = nota({ chave: "X", valores: { aApropriar: "20.00" }, geradoEm: G1 });
    expect(aApropriar(consolidarNotas([a, b])[0]!)).toBe("10.00");
    expect(aApropriar(consolidarNotas([b, a])[0]!)).toBe("10.00");
  });

  it("3. empate também no gerado_em: vale o recebido_em mais recente", () => {
    const a = nota({ chave: "X", valores: { aApropriar: "10.00" }, recebidoEm: new Date("2026-11-20T13:05:00Z") });
    const b = nota({ chave: "X", valores: { aApropriar: "20.00" }, recebidoEm: new Date("2026-11-20T13:06:00Z") });
    expect(aApropriar(consolidarNotas([a, b])[0]!)).toBe("20.00");
    expect(aApropriar(consolidarNotas([b, a])[0]!)).toBe("20.00");
  });

  it("4. persistindo o empate: vale o arquivo_id maior", () => {
    const a = nota({ chave: "X", valores: { aApropriar: "10.00" }, arquivoId: "00000000-0000-4000-8000-000000000aaa" });
    const b = nota({ chave: "X", valores: { aApropriar: "20.00" }, arquivoId: "00000000-0000-4000-8000-000000000bbb" });
    expect(aApropriar(consolidarNotas([a, b])[0]!)).toBe("20.00");
    expect(aApropriar(consolidarNotas([b, a])[0]!)).toBe("20.00");
  });

  it("gerado_em nulo perde para qualquer gerado_em", () => {
    const a = nota({ chave: "X", valores: { aApropriar: "10.00" }, geradoEm: null });
    const b = nota({ chave: "X", valores: { aApropriar: "20.00" }, geradoEm: G1 });
    expect(aApropriar(consolidarNotas([a, b])[0]!)).toBe("20.00");
  });

  it("três versões, em todas as ordens, dão o mesmo resultado", () => {
    const v = [
      nota({ chave: "X", valores: { aApropriar: "1.00" }, atualizacao: "2026-11-09T10:00:00-03:00" }),
      nota({ chave: "X", valores: { aApropriar: "2.00" }, atualizacao: "2026-11-11T10:00:00-03:00" }),
      nota({ chave: "X", valores: { aApropriar: "3.00" }, atualizacao: "2026-11-10T10:00:00-03:00" }),
    ];
    const ordens = [
      [0, 1, 2],
      [0, 2, 1],
      [1, 0, 2],
      [1, 2, 0],
      [2, 0, 1],
      [2, 1, 0],
    ];
    for (const o of ordens) expect(aApropriar(consolidarNotas(o.map((i) => v[i]!))[0]!)).toBe("2.00");
  });
});

describe("arquivos recusados não entram", () => {
  it("nota de arquivo recusado é ignorada, ainda que mais nova", () => {
    const boa = nota({ chave: "X", valores: { aApropriar: "10.00" }, atualizacao: "2026-11-10T10:00:00-03:00" });
    const ruim = nota({
      chave: "X",
      valores: { aApropriar: "99.00" },
      atualizacao: "2026-11-15T10:00:00-03:00",
      situacaoArquivo: "recusado",
    });
    const r = consolidarNotas([boa, ruim]);
    expect(r).toHaveLength(1);
    expect(aApropriar(r[0]!)).toBe("10.00");
    expect(consolidarNotas([ruim])).toEqual([]);
  });

  it("aceito_com_divergencia entra", () => {
    expect(consolidarNotas([nota({ situacaoArquivo: "aceito_com_divergencia" })])).toHaveLength(1);
  });
});

describe("ordem de saída", () => {
  it("por período cronológico (inclusive a virada de ano) e depois pela chave", () => {
    const r = consolidarNotas([
      nota({ pa: "01/2027", chave: "A" }),
      nota({ pa: "12/2026", chave: "Z" }),
      nota({ pa: "12/2026", chave: "B" }),
      nota({ pa: "11/2026", chave: "A" }),
    ]);
    expect(r.map((n) => `${n.pa}:${n.chave}`)).toEqual(["11/2026:A", "12/2026:B", "12/2026:Z", "01/2027:A"]);
  });
});
