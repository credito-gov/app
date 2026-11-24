import { describe, expect, it } from "vitest";
import type { ResultadoPasta } from "../src/nucleo/arquivos.js";
import { ROTULO_CNPJ_CHAVE, ROTULO_RECOLHIMENTO } from "../src/nucleo/emitente.js";
import { montarVisao } from "../src/nucleo/visao.js";
import {
  arquivoCreditos,
  arquivoDebitos,
  arquivoRecolhimentos,
  credito,
  debito,
  itemRecolhimento,
  montarChave,
  NI14,
  NI14_OUTRA,
  RAIZ,
} from "./apoio/construtores.js";
import { cnpjInvalidoDe } from "./apoio/dv.js";
import { lido } from "./apoio/lidos.js";

const A1 = "2026-11-20T10:00:00.000-03:00";
const A2 = "2026-11-21T10:00:00.000-03:00";
const emit = (base8: string) => cnpjInvalidoDe(`${base8}0001`);
let contador = 0;
const chaveDe = (base8: string) => montarChave({ emitente: emit(base8), codigo: String(10000000 + ++contador) });
const pasta = (arquivos: ResultadoPasta["arquivos"]): ResultadoPasta => ({ pasta: "/fict", legivel: true, arquivos });
const t = (v: { toFixed(d: number): string }) => v.toFixed(2);

describe("estado vazio (CA-6)", () => {
  it("sem arquivo de créditos, a visão é vazia e sem totais", () => {
    const v = montarVisao(pasta([]));
    expect(v.vazio).toBe(true);
    expect(v.totais).toBeUndefined();
    expect(v.pendencias).toBeUndefined();
  });

  it("só com arquivo de créditos de apuracao vazia", () => {
    const v = montarVisao(pasta([lido("a.json", "creditos", { ...arquivoCreditos([]), apuracao: [] })]));
    expect(v.vazio).toBe(true);
    expect(v.totais).toBeUndefined();
    expect(v.servicos.creditos.arquivos).toBe(1);
  });

  it("com créditos, não é vazia", () => {
    const v = montarVisao(pasta([lido("a.json", "creditos", arquivoCreditos([["11/2026", [credito({ aApropriar: "1" })]]]))]));
    expect(v.vazio).toBe(false);
    expect(v.totais).toBeDefined();
  });

  it("pasta ilegível não tem valores", () => {
    const v = montarVisao({ pasta: "/fict", legivel: false, erro: "A pasta não pôde ser lida: /fict", arquivos: [] });
    expect(v.legivel).toBe(false);
    expect(v.totais).toBeUndefined();
  });
});

describe("conflito de empresa (CA-3)", () => {
  it("a visão não traz nenhum valor", () => {
    const v = montarVisao(
      pasta([
        lido("a.json", "creditos", arquivoCreditos([["11/2026", [credito({ aApropriar: "5" })]]], { ni: NI14 })),
        lido("b.json", "creditos", arquivoCreditos([["11/2026", [credito({ chave: "OUTRA", aApropriar: "7" })]]], { ni: NI14_OUTRA })),
        lido("c.json", "debitos", arquivoDebitos([["11/2026", [debito()]]], { ni: NI14 })),
      ]),
    );
    expect(v.empresa.conflito).toBe(true);
    expect(v.notas).toEqual([]);
    expect(v.debitos).toEqual([]);
    expect(v.recolhimentos).toEqual([]);
    expect(v.totais).toBeUndefined();
    expect(v.totaisDebitos).toBeUndefined();
    expect(v.pendencias).toBeUndefined();
  });
});

describe("data dos dados por serviço (CA-5)", () => {
  it("geradoEm mais recente, quantidade de arquivos e intervalo de atualização", () => {
    const v = montarVisao(
      pasta([
        lido("a.json", "creditos", arquivoCreditos([["11/2026", [credito({ chave: "X", atualizacao: "2026-11-10T10:00:00-03:00" })]]], { geradoEm: A1 })),
        lido("b.json", "creditos", arquivoCreditos([["11/2026", [credito({ chave: "Y", atualizacao: "2026-11-15T10:00:00.5-03:00" }), credito({ chave: "Z", atualizacao: "2026-11-12T10:00:00-03:00" })]]], { geradoEm: A2 })),
      ]),
    );
    expect(v.servicos.creditos).toEqual({
      arquivos: 2,
      geradoEmMaisRecente: A2,
      atualizacaoMinima: "2026-11-10T10:00:00-03:00",
      atualizacaoMaxima: "2026-11-15T10:00:00.5-03:00",
    });
    expect(v.servicos.debitos.arquivos).toBe(0);
    expect(v.servicos.debitos.geradoEmMaisRecente).toBeUndefined();
  });

  it("arquivo recusado e ignorado não contam", () => {
    const recusado = { ...lido("r.json", "creditos", arquivoCreditos([["11/2026", [credito()]]])), situacao: "recusado" as const };
    expect(montarVisao(pasta([recusado])).servicos.creditos.arquivos).toBe(0);
  });

  it("versões substituídas por serviço", () => {
    const v = montarVisao(
      pasta([
        lido("a.json", "creditos", arquivoCreditos([["11/2026", [credito({ chave: "X" })]]])),
        lido("b.json", "creditos", arquivoCreditos([["11/2026", [credito({ chave: "X" })]]])),
        lido("c.json", "debitos", arquivoDebitos([["11/2026", [debito({ chave: "D" })]]])),
      ]),
    );
    expect(v.substituidas).toEqual({ creditos: 1, debitos: 0, recolhimentos: 0 });
  });
});

describe("débitos separados do crédito (CA-D2, O-25)", () => {
  it("a nota nos dois serviços não altera nenhum total do outro lado", () => {
    const chave = montarChave({ emitente: cnpjInvalidoDe(`${RAIZ}0001`) });
    const creditos = lido("a.json", "creditos", arquivoCreditos([["11/2026", [credito({ chave, aApropriar: "10.00" })]]]));
    const sem = montarVisao(pasta([creditos]));
    const com = montarVisao(pasta([creditos, lido("d.json", "debitos", arquivoDebitos([["11/2026", [debito({ chave, apurado: "99.00", saldoDevedor: "99.00" })]]]))]));
    expect(t(com.totais!.geral.aApropriar)).toBe(t(sem.totais!.geral.aApropriar));
    expect(t(com.totaisDebitos!.geral.apurado)).toBe("99.00");
    expect(com.chavesEmDebitos.has(chave)).toBe(true);
    expect(sem.chavesEmDebitos.has(chave)).toBe(false);
  });

  it("só débitos: sem créditos, mas com o bloco de débitos", () => {
    const v = montarVisao(pasta([lido("d.json", "debitos", arquivoDebitos([["11/2026", [debito()]]]))]));
    expect(v.vazio).toBe(true);
    expect(v.totaisDebitos).toBeDefined();
  });
});

describe("grupo de pendência com duas fontes de identificação (rodada 1, E6)", () => {
  const X = emit("11223344");
  const pelaChaveY = chaveDe("99887766"); // a chave diz outro CNPJ; o recolhimento diz X
  const pelaChaveX = chaveDe("11223344");
  const v = montarVisao(
    pasta([
      lido("a.json", "creditos", arquivoCreditos([["11/2026", [credito({ chave: pelaChaveY, aApropriar: "10.00" }), credito({ chave: pelaChaveX, aApropriar: "5.00" })]]], { ni: RAIZ })),
      lido("r.json", "recolhimentos", arquivoRecolhimentos([["2026-11-10", [["99999000000000001", [itemRecolhimento({ chaveDFE: pelaChaveY, niFornecedor: X })]]]]], { ni: RAIZ })),
    ]),
  );

  it("o grupo do mesmo CNPJ junta as duas notas e guarda os dois rótulos", () => {
    const g = v.pendencias!.grupos.find((x) => x.id === `cnpj-${X}`)!;
    expect(g.quantidade).toBe(2);
    expect([...g.rotulos].sort()).toEqual([ROTULO_CNPJ_CHAVE, ROTULO_RECOLHIMENTO].sort());
  });

  it("grupo de uma fonte só guarda um rótulo", () => {
    const so = montarVisao(pasta([lido("a.json", "creditos", arquivoCreditos([["11/2026", [credito({ chave: pelaChaveX, aApropriar: "5.00" })]]], { ni: RAIZ }))]));
    expect(so.pendencias!.grupos.find((x) => x.id === `cnpj-${X}`)!.rotulos).toEqual([ROTULO_CNPJ_CHAVE]);
  });
});

describe("emitente na visão (CA-12)", () => {
  it("o recolhimento ligado pela chave define o emitente da nota", () => {
    const chave = chaveDe("11223344");
    const v = montarVisao(
      pasta([
        lido("a.json", "creditos", arquivoCreditos([["11/2026", [credito({ chave, aApropriar: "10" })]]])),
        lido("r.json", "recolhimentos", arquivoRecolhimentos([["2026-11-10", [["99999000000000001", [itemRecolhimento({ chaveDFE: chave, niFornecedor: emit("55667788") })]]]]])),
      ]),
    );
    expect(v.notas[0].emitente.emitente.numero).toBe(emit("55667788"));
    expect(v.notas[0].emitente.divergente).toBe(true);
  });

  it("a raiz da empresa vem dos arquivos aceitos", () => {
    const v = montarVisao(pasta([lido("a.json", "creditos", arquivoCreditos([["11/2026", [credito({ chave: chaveDe(RAIZ), aApropriar: "10" })]]]))]));
    expect(v.notas[0].emitente.emitente.tipo).toBe("propria-empresa");
    expect(v.empresa.raiz).toBe(RAIZ);
  });
});

describe("pendências (CA-14, DT-9)", () => {
  const B = chaveDe("11223344");
  const A1c = chaveDe("66778899");
  const A2c = chaveDe("66778899");
  const C = chaveDe("22334455");
  const D = chaveDe("33445566");
  const E = chaveDe("44556677");
  const P = chaveDe(RAIZ);
  const neg = chaveDe("66778899");
  const sem = chaveDe("88776655");
  const v = montarVisao(
    pasta([
      lido(
        "a.json",
        "creditos",
        arquivoCreditos([
          [
            "11/2026",
            [
              credito({ chave: B, aApropriar: "30.00" }),
              credito({ chave: A1c, aApropriar: "10.00" }),
              credito({ chave: A2c, aApropriar: "5.00" }),
              credito({ chave: C, aApropriar: "15.00" }),
              credito({ chave: D, aApropriar: "4.00" }),
              credito({ chave: E, aApropriar: "4.00" }),
              credito({ chave: "FICT-SEM-EMITENTE", aApropriar: "7.00" }),
              credito({ chave: P, aApropriar: "3.00" }),
              credito({ chave: neg, origem: 20, aApropriar: "-2.00" }),
              credito({ chave: sem, apropriado: "9.00" }),
            ],
          ],
        ]),
      ),
    ]),
  );
  const p = v.pendencias!;

  it("grupos por emitente, do maior total para o menor, depois quantidade, depois número", () => {
    expect(p.grupos.map((g) => [g.rotulo, t(g.total), g.quantidade])).toEqual([
      [expect.stringContaining("11.223.344/0001-"), "30.00", 1],
      [expect.stringContaining("66.778.899/0001-"), "15.00", 2],
      [expect.stringContaining("22.334.455/0001-"), "15.00", 1],
      ["emitente não identificado", "7.00", 1],
      [expect.stringContaining("33.445.566/0001-"), "4.00", 1],
      [expect.stringContaining("44.556.677/0001-"), "4.00", 1],
      ["emitida pela própria empresa", "3.00", 1],
    ]);
  });

  it("os grupos têm identificador para a URL e as notas", () => {
    const a = p.grupos.find((g) => g.quantidade === 2)!;
    expect(a.id).toMatch(/^cnpj-66778899/);
    expect(a.notas.map((n) => n.chave).sort()).toEqual([A1c, A2c].sort());
    expect(p.grupos.find((g) => g.id === "nao-identificado")!.notas).toHaveLength(1);
    expect(p.grupos.find((g) => g.id === "propria-empresa")!.notas).toHaveLength(1);
  });

  it("nota com valor a apropriar negativo fica numa linha própria", () => {
    expect(p.negativas.quantidade).toBe(1);
    expect(t(p.negativas.total)).toBe("-2.00");
    expect(p.negativas.notas[0].chave).toBe(neg);
  });

  it("nota sem valor a apropriar não entra", () => {
    const todas = [...p.grupos.flatMap((g) => g.notas), ...p.negativas.notas];
    expect(todas.some((n) => n.chave === sem)).toBe(false);
  });

  it("a soma dos grupos e da linha de negativos é igual ao total a apropriar do CA-7", () => {
    expect(t(p.totalAApropriar)).toBe("76.00");
    expect(t(p.totalAApropriar)).toBe(t(v.totais!.geral.aApropriar));
    expect(t(p.somaGrupos)).toBe("76.00");
    expect(p.confere).toBe(true);
  });

  it("percentual do total a apropriar em emitente não identificado", () => {
    expect(p.percentualNaoIdentificado).toBe("9,2%");
  });

  it("os grupos fixos aparecem mesmo vazios", () => {
    const so = montarVisao(pasta([lido("a.json", "creditos", arquivoCreditos([["11/2026", [credito({ chave: B, aApropriar: "30.00" })]]]))])).pendencias!;
    expect(so.grupos.map((g) => g.id)).toEqual([expect.stringMatching(/^cnpj-/), "nao-identificado", "propria-empresa"]);
    expect(so.grupos[1].quantidade).toBe(0);
    expect(t(so.grupos[2].total)).toBe("0.00");
    expect(so.percentualNaoIdentificado).toBe("0,0%");
  });

  it("total a apropriar zero mostra traço", () => {
    const zero = montarVisao(pasta([lido("a.json", "creditos", arquivoCreditos([["11/2026", [credito({ chave: B, apropriado: "5" })]]]))])).pendencias!;
    expect(zero.percentualNaoIdentificado).toBe("—");
  });
});

