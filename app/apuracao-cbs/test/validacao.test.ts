import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { criarValidador } from "../src/validacao.js";
import type { NomeServico } from "../src/servicos.js";

const pastaFixtures = join(import.meta.dirname, "fixtures");
const lerFixture = (servico: string, nome: string): Uint8Array => new Uint8Array(readFileSync(join(pastaFixtures, servico, nome)));
const texto = (s: string): Uint8Array => new TextEncoder().encode(s);

const pastaOficiais = join(import.meta.dirname, "..", "schemas", "oficiais");

const NOMES = [
  "credito-retorno.schema.json",
  "recolhimento-retorno.schema.json",
  "pagamento-retorno.schema.json",
  "debito-retorno.schema.json",
];

describe("cópias oficiais dos schemas", () => {
  const versoes = JSON.parse(readFileSync(join(pastaOficiais, "versoes.json"), "utf8")) as Record<
    string,
    Record<string, string>
  >;

  it("registra exatamente as quatro cópias", () => {
    expect(Object.keys(versoes).sort()).toEqual([...NOMES].sort());
  });

  for (const nome of NOMES) {
    describe(nome, () => {
      it("tem todos os campos de proveniência e a URL oficial", () => {
        const entrada = versoes[nome];
        for (const campo of ["url", "versaoSchema", "pagina", "versaoPagina", "lidoEm", "sha256"]) {
          expect(entrada[campo], campo).toBeTruthy();
        }
        expect(entrada.url).toBe(`https://docs.receitafederal.gov.br/apuracao-cbs/schemas/${nome}`);
      });

      it("tem o SHA-256 dos bytes igual ao registrado", () => {
        const bytes = readFileSync(join(pastaOficiais, nome));
        expect(createHash("sha256").update(bytes).digest("hex")).toBe(versoes[nome].sha256);
      });

      it("é JSON Schema Draft 2020-12", () => {
        const schema = JSON.parse(readFileSync(join(pastaOficiais, nome), "utf8")) as { $schema: string };
        expect(schema.$schema).toMatch(/2020-12/);
      });
    });
  }
});

const SERVICOS: NomeServico[] = ["creditos", "recolhimentos", "pagamentos", "debitos"];

/** Documento de créditos mínimo, com o valor monetário (texto) posto em apurado e aApropriar. */
function docCredito(valorTexto: string): Uint8Array {
  return texto(`{
  "tiqueteSolicitacao": "TIQUETE-FICTICIO",
  "ni": "12345678",
  "niConsumidor": "12345678000100",
  "geradoEm": "2026-11-20T10:15:30.000-03:00",
  "apuracao": [{ "pa": "10/2026", "creditos": [{
    "origem": 0, "documento": 55, "chave": "FICT-NFE-0001",
    "emissao": "2026-10-05T09:00:00.000-03:00", "registro": "2026-10-05T09:05:00.000-03:00", "atualizacao": "2026-11-18T08:00:00.000-03:00",
    "cbs": { "apurado": ${valorTexto}, "apropriacao": { "aApropriar": ${valorTexto}, "utilizacao": { "naoUtilizado": { "saldoCredor": 0.00 } } } }
  }] }]
}`);
}

describe("validação contra o schema oficial", () => {
  const validador = criarValidador();

  for (const servico of SERVICOS) {
    for (const arquivo of ["valido.json", "vazio.json"]) {
      it(`${servico}/${arquivo} passa no schema da consulta`, () => {
        const r = validador.validar(servico, lerFixture(servico, arquivo));
        expect(r.valido).toBe(true);
      });
    }
  }

  it("devolve os dados lidos sem perda (números como texto original)", () => {
    const r = validador.validar("creditos", lerFixture("creditos", "valido.json"));
    if (!r.valido) throw new Error("era esperado válido");
    const cbs = (r.dados as { apuracao: Array<{ creditos: Array<{ cbs: { apurado: string; apropriacao: { aApropriar: string } } }> }> })
      .apuracao[0].creditos[0].cbs;
    expect(cbs.apurado).toBe("1234.56");
    expect(cbs.apropriacao.aApropriar).toBe("1000.10");
  });

  const INVALIDOS: Array<[NomeServico, string]> = [
    ["creditos", "invalido-obrigatorio.json"],
    ["creditos", "invalido-tres-casas.json"],
    ["recolhimentos", "invalido.json"],
    ["pagamentos", "rad-vencimento-data.json"],
    ["debitos", "invalido.json"],
  ];

  for (const [servico, arquivo] of INVALIDOS) {
    it(`${servico}/${arquivo} falha, com divergências (caminho e mensagem) e o total`, () => {
      const r = validador.validar(servico, lerFixture(servico, arquivo));
      expect(r.valido).toBe(false);
      if (r.valido) return;
      expect(r.total).toBeGreaterThanOrEqual(1);
      expect(r.divergencias.length).toBeGreaterThanOrEqual(1);
      expect(r.divergencias.length).toBeLessThanOrEqual(20);
      for (const d of r.divergencias) {
        expect(typeof d.caminho).toBe("string");
        expect(d.mensagem.length).toBeGreaterThan(0);
      }
    });
  }

  it("a divergência de campo obrigatório aponta o caminho", () => {
    const r = validador.validar("creditos", lerFixture("creditos", "invalido-obrigatorio.json"));
    if (r.valido) throw new Error("era esperado inválido");
    expect(r.divergencias.some((d) => d.caminho === "/apuracao/0/creditos/0" && d.mensagem.includes("chave"))).toBe(true);
  });

  it("o vencimento só com data em RAD (exemplo oficial) é recusado: divergência 3", () => {
    const r = validador.validar("pagamentos", lerFixture("pagamentos", "rad-vencimento-data.json"));
    if (r.valido) throw new Error("era esperado inválido");
    expect(r.divergencias.some((d) => d.caminho.endsWith("/vencimento"))).toBe(true);
  });

  it("não mostra o valor do campo nas divergências", () => {
    const r = validador.validar("creditos", lerFixture("creditos", "invalido-tres-casas.json"));
    if (r.valido) throw new Error("era esperado inválido");
    expect(JSON.stringify(r)).not.toContain("10.005");
    const r2 = validador.validar("pagamentos", lerFixture("pagamentos", "rad-vencimento-data.json"));
    if (r2.valido) throw new Error("era esperado inválido");
    expect(JSON.stringify(r2)).not.toContain("2026-11-20");
    expect(JSON.stringify(r2)).not.toContain("FICT-NFE-0001");
  });

  it("lista no máximo 20 divergências e informa o total", () => {
    const item = (n: number) =>
      `{ "origem": 0, "documento": 55, "emissao": "2026-10-05T09:00:00.000-03:00", "registro": "2026-10-05T09:05:00.000-03:00", "atualizacao": "2026-11-18T08:00:00.000-03:00", "cbs": { "apurado": ${n}.00, "apropriacao": { "utilizacao": { "naoUtilizado": { "saldoCredor": 0.00 } } } } }`;
    const itens = Array.from({ length: 25 }, (_, i) => item(i)).join(",");
    const bruto = texto(`{ "tiqueteSolicitacao": "T", "ni": "12345678", "niConsumidor": "12345678000100", "geradoEm": "2026-11-20T10:15:30.000-03:00", "apuracao": [{ "pa": "10/2026", "creditos": [${itens}] }] }`);
    const r = validador.validar("creditos", bruto);
    if (r.valido) throw new Error("era esperado inválido");
    expect(r.divergencias).toHaveLength(20);
    expect(r.total).toBeGreaterThanOrEqual(25);
  });

  describe("valores monetários", () => {
    it("0.07 é aceito (sem falso negativo de multipleOf em ponto flutuante)", () => {
      expect(validador.validar("creditos", docCredito("0.07")).valido).toBe(true);
      expect(validador.validar("creditos", docCredito("0.29")).valido).toBe(true);
      expect(validador.validar("creditos", docCredito("1234567.89")).valido).toBe(true);
    });

    it("três casas decimais é recusado", () => {
      const r = validador.validar("creditos", docCredito("10.005"));
      expect(r.valido).toBe(false);
      const r2 = validador.validar("creditos", docCredito("0.001"));
      expect(r2.valido).toBe(false);
    });

    it("três casas com zeros à direita também é recusado pela checagem do texto", () => {
      const r = validador.validar("creditos", docCredito("10.500"));
      expect(r.valido).toBe(false);
      if (r.valido) return;
      expect(r.divergencias.some((d) => d.mensagem.includes("duas casas"))).toBe(true);
    });

    it("notação exponencial é recusada pela checagem do texto, sem mostrar o valor", () => {
      for (const valor of ["1e2", "1E2", "5.0e-1"]) {
        const r = validador.validar("creditos", docCredito(valor));
        expect(r.valido, valor).toBe(false);
        if (r.valido) continue;
        expect(r.divergencias.some((d) => d.mensagem.includes("exponencial") && d.caminho.endsWith("/cbs/apurado"))).toBe(true);
        expect(JSON.stringify(r)).not.toContain(valor);
      }
    });
  });

  describe("leitura do arquivo", () => {
    it("JSON que não faz parse recebe o tratamento de inválido, sem mostrar o conteúdo", () => {
      const r = validador.validar("creditos", texto("{ conteudo-qualquer não é json"));
      expect(r.valido).toBe(false);
      if (r.valido) return;
      expect(r.total).toBe(1);
      expect(r.divergencias[0].mensagem).toContain("JSON");
      expect(JSON.stringify(r)).not.toContain("conteudo-qualquer");
    });

    it("BOM inicial não impede a leitura", () => {
      const original = lerFixture("creditos", "valido.json");
      const comBom = new Uint8Array([0xef, 0xbb, 0xbf, ...original]);
      expect(validador.validar("creditos", comBom).valido).toBe(true);
    });

    it("arquivo vazio de bytes é inválido", () => {
      expect(validador.validar("debitos", new Uint8Array()).valido).toBe(false);
    });
  });
});
