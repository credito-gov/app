import { describe, expect, it } from "vitest";
import { consolidarNotas, consolidarRecolhimentos } from "../src/nucleo/consolidacao.js";
import { arquivoCreditos, arquivoDebitos, arquivoRecolhimentos, credito, debito, itemRecolhimento, NI14 } from "./apoio/construtores.js";
import { lido } from "./apoio/lidos.js";

type Itens = Array<Record<string, unknown>>;
const DARF = "99999000000000001";
const cred = (nome: string, geradoEm: string, itens: Itens) => lido(nome, "creditos", arquivoCreditos([["11/2026", itens]], { geradoEm }));
const deb = (nome: string, geradoEm: string, itens: Itens) => lido(nome, "debitos", arquivoDebitos([["11/2026", itens]], { geradoEm }));
const A1 = "2026-11-20T10:00:00.000-03:00";
const A2 = "2026-11-21T10:00:00.000-03:00";
const aApropriar = (n: { valores: Record<string, { toFixed(d: number): string }> }) => n.valores["cbs.apropriacao.aApropriar"].toFixed(2);

describe("créditos: cada crédito conta uma vez (CA-4, D-5)", () => {
  it("sem repetição, todos entram", () => {
    const r = consolidarNotas([cred("a.json", A1, [credito({ chave: "X" }), credito({ chave: "Y" })])], "creditos");
    expect(r.notas.map((n) => n.chave).sort()).toEqual(["X", "Y"]);
    expect(r.substituidas).toBe(0);
  });

  it("vence a atualização mais recente, mesmo com frações e fusos diferentes", () => {
    // 10:00:00.999999-03:00 = 13:00:00.999999Z; 13:00:01Z vem 1 ms depois, em outro fuso e sem fração.
    const antigo = credito({ chave: "X", aApropriar: "10.00", atualizacao: "2026-11-10T10:00:00.999999-03:00" });
    const maisNovo = credito({ chave: "X", aApropriar: "20.00", atualizacao: "2026-11-10T13:00:01Z" });
    const r = consolidarNotas([cred("a.json", A1, [maisNovo]), cred("b.json", A2, [antigo])], "creditos");
    expect(r.notas).toHaveLength(1);
    expect(aApropriar(r.notas[0])).toBe("20.00");
    expect(r.substituidas).toBe(1);
  });

  it("a ordem dos arquivos não muda o resultado", () => {
    const v1 = credito({ chave: "X", aApropriar: "10.00", atualizacao: "2026-11-10T10:00:00-03:00" });
    const v2 = credito({ chave: "X", aApropriar: "20.00", atualizacao: "2026-11-11T10:00:00-03:00" });
    const a = consolidarNotas([cred("a.json", A1, [v1]), cred("b.json", A1, [v2])], "creditos");
    const b = consolidarNotas([cred("b.json", A1, [v2]), cred("a.json", A1, [v1])], "creditos");
    expect(aApropriar(a.notas[0])).toBe("20.00");
    expect(aApropriar(b.notas[0])).toBe("20.00");
  });

  it("empate na atualização: vale o arquivo com geradoEm mais recente", () => {
    const v1 = credito({ chave: "X", aApropriar: "10.00", atualizacao: "2026-11-10T10:00:00-03:00" });
    const v2 = credito({ chave: "X", aApropriar: "20.00", atualizacao: "2026-11-10T10:00:00-03:00" });
    const r = consolidarNotas([cred("z.json", A1, [v1]), cred("a.json", A2, [v2])], "creditos");
    expect(aApropriar(r.notas[0])).toBe("20.00");
  });

  it("empate também no geradoEm: vale o nome de arquivo maior", () => {
    const v1 = credito({ chave: "X", aApropriar: "10.00" });
    const v2 = credito({ chave: "X", aApropriar: "20.00" });
    const r = consolidarNotas([cred("a.json", A1, [v1]), cred("b.json", A1, [v2])], "creditos");
    expect(aApropriar(r.notas[0])).toBe("20.00");
    expect(r.notas[0].arquivo).toBe("b.json");
  });

  it("o mesmo arquivo em duas cópias com nomes diferentes não muda nada", () => {
    const itens = [credito({ chave: "X", aApropriar: "10.00" }), credito({ chave: "Y", aApropriar: "5.50" })];
    const sozinho = consolidarNotas([cred("a.json", A1, itens)], "creditos");
    const dobrado = consolidarNotas([cred("a.json", A1, itens), cred("b.json", A1, itens)], "creditos");
    expect(dobrado.notas).toHaveLength(2);
    expect(dobrado.notas.map(aApropriar)).toEqual(sozinho.notas.map(aApropriar));
    expect(dobrado.substituidas).toBe(2);
  });

  it("identidade é período, chave, documento e origem: mudar qualquer um é outro crédito", () => {
    const base = { chave: "X" };
    const r = consolidarNotas(
      [
        cred("a.json", A1, [credito(base), credito({ ...base, documento: 57 }), credito({ ...base, origem: 20 })]),
        lido("b.json", "creditos", arquivoCreditos([["10/2026", [credito(base)]]])),
      ],
      "creditos",
    );
    expect(r.notas).toHaveLength(4);
  });

  it("só usa arquivos aceitos do serviço pedido", () => {
    const recusado = { ...cred("r.json", A1, [credito({ chave: "R" })]), situacao: "recusado" as const };
    const d = deb("d.json", A1, [debito({ chave: "D" })]);
    const r = consolidarNotas([recusado, d, cred("a.json", A1, [credito({ chave: "X" })])], "creditos");
    expect(r.notas.map((n) => n.chave)).toEqual(["X"]);
  });

  it("guarda período, documento, origem, datas e valores como Big", () => {
    const r = consolidarNotas(
      [cred("a.json", A1, [credito({ chave: "X", documento: 57, origem: 20, aApropriar: "10.50", apropriado: "2", utilizado: "1.5", saldoCredor: "0.5" })])],
      "creditos",
    );
    const n = r.notas[0];
    expect([n.pa, n.documento, n.origem, n.arquivo, n.geradoEm]).toEqual(["11/2026", 57, 20, "a.json", A1]);
    expect(n.emissao).toBe("2026-11-02T10:00:00.000-03:00");
    expect(aApropriar(n)).toBe("10.50");
    expect(n.valores["cbs.apropriacao.apropriado"].toFixed(2)).toBe("2.00");
    expect(n.valores["cbs.apropriacao.utilizacao.utilizado"].toFixed(2)).toBe("1.50");
    expect(n.valores["cbs.apropriacao.utilizacao.naoUtilizado.saldoCredor"].toFixed(2)).toBe("0.50");
    expect(n.valores["cbs.apropriacao.suspenso"]).toBeUndefined();
  });
});

describe("débitos (CA-D1)", () => {
  it("mesma regra de versão mais recente", () => {
    const v1 = debito({ chave: "D", apurado: "10.00", saldoDevedor: "10.00", atualizacao: "2026-11-10T10:00:00-03:00" });
    const v2 = debito({ chave: "D", apurado: "10.00", extinto: "4.00", saldoDevedor: "6.00", atualizacao: "2026-11-12T10:00:00-03:00" });
    const r = consolidarNotas([deb("a.json", A1, [v1]), deb("b.json", A1, [v2])], "debitos");
    expect(r.notas).toHaveLength(1);
    expect(r.notas[0].valores["cbs.saldoDevedor"].toFixed(2)).toBe("6.00");
    expect(r.substituidas).toBe(1);
  });

  it("o mesmo arquivo duas vezes não duplica", () => {
    const itens = [debito({ chave: "D1" }), debito({ chave: "D2" })];
    expect(consolidarNotas([deb("a.json", A1, itens), deb("b.json", A1, itens)], "debitos").notas).toHaveLength(2);
  });
});

describe("itens de recolhimento (DT-7)", () => {
  const reco = (nome: string, geradoEm: string, itens: Itens) => lido(nome, "recolhimentos", arquivoRecolhimentos([["2026-11-10", [[DARF, itens]]]], { geradoEm, ni: NI14 }));

  it("lê os campos do item e o dia de arrecadação", () => {
    const r = consolidarRecolhimentos([reco("a.json", A1, [itemRecolhimento({ sequencial: 3, chaveDFE: "X", principal: "100.00", multa: "1.50", juros: "0.25", total: "101.75" })])]);
    expect(r.itens).toHaveLength(1);
    const i = r.itens[0];
    expect([i.dataArrecadacao, i.numeroDARF, i.sequencial, i.chaveDFE, i.pa]).toEqual(["2026-11-10", DARF, 3, "X", "11/2026"]);
    expect(i.total.toFixed(2)).toBe("101.75");
    expect(i.multa.toFixed(2)).toBe("1.50");
  });

  it("item repetido: vence o do arquivo com geradoEm mais recente", () => {
    const r = consolidarRecolhimentos([reco("a.json", A2, [itemRecolhimento({ principal: "20.00" })]), reco("b.json", A1, [itemRecolhimento({ principal: "10.00" })])]);
    expect(r.itens).toHaveLength(1);
    expect(r.itens[0].principal.toFixed(2)).toBe("20.00");
    expect(r.substituidos).toBe(1);
  });

  it("item repetido: o arquivo mais recente vence mesmo vindo depois na lista (rodada 1, F3)", () => {
    const antigo = reco("a.json", A1, [itemRecolhimento({ principal: "10.00" })]);
    const novo = reco("b.json", A2, [itemRecolhimento({ principal: "20.00" })]);
    for (const ordem of [[antigo, novo], [novo, antigo]]) {
      const r = consolidarRecolhimentos(ordem);
      expect(r.itens).toHaveLength(1);
      expect(r.itens[0].principal.toFixed(2)).toBe("20.00");
      expect(r.itens[0].arquivo).toBe("b.json");
      expect(r.substituidos).toBe(1);
    }
  });

  it("empate de geradoEm: vence o maior nome de arquivo, em qualquer ordem da lista (rodada 1, F3)", () => {
    const a = reco("20261120T100000Z_recolhimentos_A.json", A1, [itemRecolhimento({ principal: "10.00" })]);
    const b = reco("20261120T110000Z_recolhimentos_B.json", A1, [itemRecolhimento({ principal: "20.00" })]);
    for (const ordem of [[a, b], [b, a]]) {
      const r = consolidarRecolhimentos(ordem);
      expect(r.itens).toHaveLength(1);
      expect(r.itens[0].arquivo).toBe("20261120T110000Z_recolhimentos_B.json");
      expect(r.itens[0].principal.toFixed(2)).toBe("20.00");
    }
  });

  it("três versões do mesmo item, em todas as ordens, dão o mesmo resultado (rodada 1, F3)", () => {
    const v1 = reco("a.json", "2026-11-19T10:00:00-03:00", [itemRecolhimento({ principal: "1.00" })]);
    const v2 = reco("b.json", "2026-11-21T10:00:00-03:00", [itemRecolhimento({ principal: "2.00" })]);
    const v3 = reco("c.json", "2026-11-20T10:00:00-03:00", [itemRecolhimento({ principal: "3.00" })]);
    const ordens = [[v1, v2, v3], [v1, v3, v2], [v2, v1, v3], [v2, v3, v1], [v3, v1, v2], [v3, v2, v1]];
    for (const ordem of ordens) {
      const r = consolidarRecolhimentos(ordem);
      expect(r.itens.map((i) => i.principal.toFixed(2))).toEqual(["2.00"]);
      expect(r.substituidos).toBe(2);
    }
  });

  it("o mesmo arquivo lido duas vezes não duplica itens", () => {
    const itens = [itemRecolhimento({ sequencial: 1 }), itemRecolhimento({ sequencial: 2 })];
    expect(consolidarRecolhimentos([reco("a.json", A1, itens), reco("b.json", A1, itens)]).itens).toHaveLength(2);
  });

  it("sequencial diferente no mesmo DARF é outro item", () => {
    const r = consolidarRecolhimentos([reco("a.json", A1, [itemRecolhimento({ sequencial: 1 }), itemRecolhimento({ sequencial: 2 })])]);
    expect(r.itens).toHaveLength(2);
  });
});
