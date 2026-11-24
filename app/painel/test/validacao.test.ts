import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MOTIVO_NI, criarValidador } from "../src/nucleo/validacao.js";
import { arquivoCreditos, arquivoDebitos, arquivoRecolhimentos, bytes, credito, debito, itemRecolhimento, NI14 } from "./apoio/construtores.js";

const validador = criarValidador();
const texto = (t: string) => new TextEncoder().encode(t);
const fixture = (nome: string) => new Uint8Array(readFileSync(new URL(`./fixtures/apuracao-cbs/${nome}`, import.meta.url)));

const creditosOk = () => arquivoCreditos([["11/2026", [credito({ aApropriar: "10.5" })]]], { ni: "90817263" });
const reco = (ni: string) => arquivoRecolhimentos([["2026-11-10", [["99999000000000001", [itemRecolhimento()]]]]], { ni });

describe("arquivos válidos (CA-1, CA-2)", () => {
  it("créditos, recolhimentos e débitos válidos são aceitos", () => {
    expect(validador.validar("creditos", bytes(creditosOk())).situacao).toBe("aceito");
    expect(validador.validar("recolhimentos", bytes(reco("90817263"))).situacao).toBe("aceito");
    const deb = arquivoDebitos([["11/2026", [debito({ extinto: "3" })]]], { ni: "90817263" });
    expect(validador.validar("debitos", bytes(deb)).situacao).toBe("aceito");
  });

  it("devolve os dados com os números como texto original", () => {
    const r = validador.validar("creditos", bytes(arquivoCreditos([["11/2026", [credito({ aApropriar: "10.50" })]]], { ni: "90817263" })));
    const dados = r.dados as { apuracao: Array<{ creditos: Array<{ cbs: { apropriacao: { aApropriar: string } } }> }> };
    expect(dados.apuracao[0].creditos[0].cbs.apropriacao.aApropriar).toBe("10.50");
  });

  it("aceita campos zerados ausentes, números com 0 a 2 casas e datas com 0 a 6 casas de fração", () => {
    const itens = [
      credito({ chave: "A", aApropriar: "100", emissao: "2026-11-02T10:00:00-03:00", registro: "2026-11-02T10:00:00.123456-03:00", atualizacao: "2026-11-02T10:00:00.1-03:00" }),
      credito({ chave: "B", aApropriar: "12.5" }),
      credito({ chave: "C", aApropriar: "12.50", apropriado: "1.5", utilizado: "1.50" }),
    ];
    expect(validador.validar("creditos", bytes(arquivoCreditos([["11/2026", itens]], { ni: "90817263" }))).situacao).toBe("aceito");
  });

  it("aceita BOM inicial", () => {
    const comBom = texto(`﻿${new TextDecoder().decode(bytes(creditosOk()))}`);
    expect(validador.validar("creditos", comBom).situacao).toBe("aceito");
  });

  it("aceita as fixtures válidas e vazias copiadas da apuracao-cbs", () => {
    for (const [servico, nome] of [
      ["creditos", "creditos/valido.json"],
      ["creditos", "creditos/vazio.json"],
      ["debitos", "debitos/valido.json"],
      ["debitos", "debitos/vazio.json"],
      ["recolhimentos", "recolhimentos/valido.json"],
      ["recolhimentos", "recolhimentos/vazio.json"],
    ] as const) {
      expect(validador.validar(servico, fixture(nome)).situacao, nome).toBe("aceito");
    }
  });
});

describe("tolerância do ni (CA-2, D-2)", () => {
  it("ni de 14 dígitos é aceito com divergência conhecida", () => {
    const r = validador.validar("creditos", bytes(arquivoCreditos([["11/2026", [credito()]]], { ni: NI14 })));
    expect(r.situacao).toBe("aceito-com-divergencia");
    expect(r.motivos).toEqual([MOTIVO_NI]);
    expect(MOTIVO_NI).toBe("ni com 14 dígitos (o schema exige 8)");
    expect(r.dados).toBeDefined();
  });

  it("vale também para recolhimentos e débitos", () => {
    expect(validador.validar("recolhimentos", bytes(reco(NI14))).situacao).toBe("aceito-com-divergencia");
    const deb = arquivoDebitos([["11/2026", [debito()]]], { ni: NI14 });
    expect(validador.validar("debitos", bytes(deb)).situacao).toBe("aceito-com-divergencia");
  });

  it("ni de 8 dígitos continua aceito sem divergência", () => {
    expect(validador.validar("creditos", bytes(creditosOk())).motivos).toEqual([]);
  });
});

describe("arquivos recusados (CA-2)", () => {
  const recusado = (conteudo: unknown) => validador.validar("creditos", bytes(conteudo));

  it("ni de 13 dígitos", () => {
    const r = recusado(arquivoCreditos([["11/2026", [credito()]]], { ni: "9081726300018" }));
    expect(r.situacao).toBe("recusado");
    expect(r.motivos.length).toBeGreaterThan(0);
    expect(r.dados).toBeUndefined();
  });

  it("ni com letra", () => {
    expect(recusado(arquivoCreditos([["11/2026", [credito()]]], { ni: "9081726A000181" })).situacao).toBe("recusado");
    expect(recusado(arquivoCreditos([["11/2026", [credito()]]], { ni: "9081726A" })).situacao).toBe("recusado");
  });

  it("ni de 14 dígitos mais outro erro", () => {
    const r = recusado(arquivoCreditos([["11/2026", [credito({ origem: 7 })]]], { ni: NI14 }));
    expect(r.situacao).toBe("recusado");
    expect(r.motivos.length).toBeGreaterThanOrEqual(1);
    expect(r.dados).toBeUndefined();
  });

  it("número com três casas decimais", () => {
    const r = recusado(arquivoCreditos([["11/2026", [credito({ aApropriar: "10.123" })]]], { ni: "90817263" }));
    expect(r.situacao).toBe("recusado");
    expect(r.motivos.join(" ")).toContain("duas casas");
  });

  it("número em notação exponencial", () => {
    const r = recusado(arquivoCreditos([["11/2026", [credito({ aApropriar: "1E+2" })]]], { ni: "90817263" }));
    expect(r.situacao).toBe("recusado");
    expect(r.motivos.join(" ")).toContain("exponencial");
  });

  it("niConsumidor inválido não tem tolerância", () => {
    expect(recusado(arquivoCreditos([["11/2026", [credito()]]], { ni: "90817263", niConsumidor: "123" })).situacao).toBe("recusado");
    expect(recusado(arquivoCreditos([["11/2026", [credito()]]], { ni: NI14, niConsumidor: "123" })).situacao).toBe("recusado");
  });

  it("JSON ilegível", () => {
    const r = validador.validar("creditos", texto("{ não é json"));
    expect(r.situacao).toBe("recusado");
    expect(r.motivos[0]).toContain("JSON inválido");
  });

  it("lista no máximo 20 divergências e informa o total", () => {
    const muitos = Array.from({ length: 30 }, (_, i) => credito({ chave: `X${i}`, origem: 7 }));
    const r = recusado(arquivoCreditos([["11/2026", muitos]], { ni: "90817263" }));
    expect(r.situacao).toBe("recusado");
    expect(r.motivos.length).toBeLessThanOrEqual(20);
    expect(r.total).toBeGreaterThan(20);
  });

  it("as fixtures inválidas da apuracao-cbs seguem recusadas", () => {
    expect(validador.validar("creditos", fixture("creditos/invalido-obrigatorio.json")).situacao).toBe("recusado");
    expect(validador.validar("creditos", fixture("creditos/invalido-tres-casas.json")).situacao).toBe("recusado");
    expect(validador.validar("debitos", fixture("debitos/invalido.json")).situacao).toBe("recusado");
    expect(validador.validar("recolhimentos", fixture("recolhimentos/invalido.json")).situacao).toBe("recusado");
  });

  it("campo obrigatório ausente", () => {
    const c = credito();
    delete (c["cbs"] as Record<string, unknown>)["apurado"];
    expect(recusado(arquivoCreditos([["11/2026", [c]]], { ni: "90817263" })).situacao).toBe("recusado");
  });
});

describe("datas que o painel não sabe ler (rodada 1, C4)", () => {
  // O schema (format date-time do ajv-formats) aceita estas formas, que o painel não consegue comparar nem exibir.
  const ilegiveis: Array<[string, string]> = [
    ["fuso sem dois-pontos", "2026-11-18T08:00:00-0300"],
    ["t minúsculo", "2026-11-18t08:00:00-03:00"],
    ["z minúsculo", "2026-11-18T08:00:00z"],
    ["espaço no lugar do T", "2026-11-18 08:00:00-03:00"],
    ["fração com mais de 9 dígitos", "2026-11-18T08:00:00.1234567890-03:00"],
    ["segundo 60", "2026-11-18T23:59:60Z"],
  ];
  type Servico = "creditos" | "debitos" | "recolhimentos";
  const campos: Array<[string, Servico, (d: string) => unknown]> = [
    ["atualizacao", "creditos", (d) => arquivoCreditos([["11/2026", [credito({ atualizacao: d })]]], { ni: "90817263" })],
    ["emissao", "creditos", (d) => arquivoCreditos([["11/2026", [credito({ emissao: d })]]], { ni: "90817263" })],
    ["registro", "creditos", (d) => arquivoCreditos([["11/2026", [credito({ registro: d })]]], { ni: "90817263" })],
    ["geradoEm", "creditos", (d) => arquivoCreditos([["11/2026", [credito()]]], { ni: "90817263", geradoEm: d })],
    ["geradoEm", "debitos", (d) => arquivoDebitos([["11/2026", [debito()]]], { ni: "90817263", geradoEm: d })],
    ["geradoEm", "recolhimentos", (d) => arquivoRecolhimentos([["2026-11-10", [["99999000000000001", [itemRecolhimento()]]]]], { ni: "90817263", geradoEm: d })],
  ];

  for (const [campo, servico, montar] of campos) {
    for (const [nome, data] of ilegiveis) {
      it(`${servico}, ${campo}: ${nome} é recusada com motivo claro`, () => {
        const r = validador.validar(servico, bytes(montar(data)));
        expect(r.situacao).toBe("recusado");
        expect(r.motivos.join(" ")).toContain("data que o painel não consegue ler");
        expect(r.motivos.join(" ")).toContain(campo);
        expect(r.dados).toBeUndefined();
      });
    }
  }

  it("as datas no formato lido pelo painel seguem aceitas", () => {
    const itens = [credito({ emissao: "2026-11-02T10:00:00Z", registro: "2026-11-02T10:00:00.123456789+05:30", atualizacao: "2026-11-02T10:00:00.1-03:00" })];
    expect(validador.validar("creditos", bytes(arquivoCreditos([["11/2026", itens]], { ni: "90817263" }))).situacao).toBe("aceito");
  });
});
