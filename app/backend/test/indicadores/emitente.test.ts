// Origem: app/painel/test/emitente.test.ts (commit 39e4fae da main), sem os casos de recolhimento (CA-7: só a chave).
import { describe, expect, it } from "vitest";
import { formatarCnpj, formatarCpf, lerChave } from "../../src/indicadores/emitente.js";
import { cnpjInvalidoDe, cpfInvalidoDe } from "../../src/ficticios/dv.js";
import { dvChave, montarChave, RAIZ } from "../apoio/construtores.js";

const OUTRO = cnpjInvalidoDe(`${"66778899"}0001`);
const PROPRIO = cnpjInvalidoDe(`${RAIZ}0002`);
const CPF = cpfInvalidoDe("123456789");

const ROTULO_CNPJ = "CNPJ do emitente, lido da chave da nota";
const ROTULO_CPF = "CPF do emitente, lido da chave da nota";

const pelaChave = (chave: string, documento = 55) => ({ emitente: lerChave(chave, documento, RAIZ) });

describe("emitente pela chave de 44 posições (CA-6, CA-7, CA-8, D-4, fontes F-A a F-E)", () => {
  it("CNPJ só com dígitos nas posições 7 a 20", () => {
    const r = pelaChave(montarChave({ emitente: OUTRO }));
    expect(r.emitente).toMatchObject({ tipo: "identificado", documento: "cnpj", numero: OUTRO, fonte: "chave", rotulo: ROTULO_CNPJ });
  });

  it("CNPJ com letras nas posições 7 a 18", () => {
    const alfa = "FICT1234AB9Z01";
    const r = pelaChave(montarChave({ emitente: alfa }));
    expect(r.emitente).toMatchObject({ tipo: "identificado", documento: "cnpj", numero: alfa, rotulo: ROTULO_CNPJ });
  });

  it("os modelos 55, 57, 62 e 65 são lidos", () => {
    for (const [modelo, documento] of [["55", 55], ["57", 57], ["62", 62], ["65", 65]] as const) {
      const r = pelaChave(montarChave({ emitente: OUTRO, modelo }), documento);
      expect(r.emitente.numero, modelo).toBe(OUTRO);
    }
  });

  it("chave fora do leiaute de 44 posições", () => {
    const motivo = "chave fora do leiaute de 44 posições";
    const boa = montarChave({ emitente: OUTRO });
    expect(pelaChave(boa.slice(0, 43)).emitente).toMatchObject({ tipo: "nao-identificado", motivo });
    expect(pelaChave(`${boa}0`).emitente.motivo).toBe(motivo);
    expect(pelaChave(boa.toLowerCase().replace(/\d/g, "a")).emitente.motivo).toBe(motivo);
    expect(pelaChave("FICT-NFE-0001").emitente.motivo).toBe(motivo);
    // letra fora das posições 7 a 18
    expect(pelaChave(`A${boa.slice(1)}`).emitente.motivo).toBe(motivo);
  });

  it("documento 91 com chave de 50 posições não é lido pela chave", () => {
    const r = pelaChave("1234567890".repeat(5), 91);
    expect(r.emitente.tipo).toBe("nao-identificado");
    expect(r.emitente.motivo).toBe("leiaute da chave deste tipo de documento sem fonte registrada");
  });

  it("outro código de documento também não é lido", () => {
    const r = pelaChave(montarChave({ emitente: OUTRO, modelo: "63" }), 63);
    expect(r.emitente.tipo).toBe("nao-identificado");
  });

  it("modelo nas posições 21 e 22 diferente do documento", () => {
    const r = pelaChave(montarChave({ emitente: OUTRO, modelo: "57" }), 55);
    expect(r.emitente).toMatchObject({ tipo: "nao-identificado", motivo: "modelo na chave diverge do tipo de documento" });
  });

  it("dígito verificador inválido", () => {
    const base = montarChave({ emitente: OUTRO });
    const errado = String((parseInt(base[43], 10) + 1) % 10);
    const r = pelaChave(base.slice(0, 43) + errado);
    expect(r.emitente).toMatchObject({ tipo: "nao-identificado", motivo: "dígito verificador da chave inválido" });
  });

  it("o cálculo do dígito verificador fecha com chave de dígitos e com letras (ASCII menos 48)", () => {
    for (const emitente of [OUTRO, "FICT1234AB9Z01", "ZZZZZZZZZZZZ99"]) {
      const chave = montarChave({ emitente });
      expect(chave[43]).toBe(dvChave(chave.slice(0, 43)));
      expect(pelaChave(chave).emitente.tipo, emitente).toBe("identificado");
    }
  });

  it("DV com resto 0 ou 1 vale 0", () => {
    // procura, entre chaves de teste, uma cujo DV calculado seja 0 por resto 0 ou 1 e confere que o painel a aceita
    let achou = 0;
    for (let i = 0; i < 400 && achou < 3; i++) {
      const chave = montarChave({ emitente: OUTRO, codigo: String(10000000 + i) });
      if (chave[43] === "0") {
        achou++;
        expect(pelaChave(chave).emitente.tipo).toBe("identificado");
      }
    }
    expect(achou).toBeGreaterThan(0);
  });

  it("NFA-e: modelo 55 com série de 890 a 899 traz o CNPJ do fisco", () => {
    for (const serie of ["890", "895", "899"]) {
      const r = pelaChave(montarChave({ emitente: OUTRO, serie }));
      expect(r.emitente).toMatchObject({ tipo: "nao-identificado", motivo: "nota fiscal avulsa: a chave traz o CNPJ do fisco" });
    }
  });

  it("modelo 55 com série de 900 a 909 é lida como CNPJ", () => {
    expect(pelaChave(montarChave({ emitente: OUTRO, serie: "905" })).emitente.numero).toBe(OUTRO);
  });

  it("modelo 55, série de 910 em diante, com CPF precedido de zeros", () => {
    for (const serie of ["910", "999"]) {
      const r = pelaChave(montarChave({ emitente: `000${CPF}`, serie }));
      expect(r.emitente).toMatchObject({ tipo: "identificado", documento: "cpf", numero: CPF, fonte: "chave", rotulo: ROTULO_CPF });
    }
  });

  it("modelo 55, série de 910 em diante, sem CPF na chave", () => {
    const motivo = "série de emitente CPF sem CPF na chave";
    expect(pelaChave(montarChave({ emitente: OUTRO, serie: "920" })).emitente).toMatchObject({ tipo: "nao-identificado", motivo });
    expect(pelaChave(montarChave({ emitente: `000${CPF.slice(0, 8)}A${CPF.slice(9)}`, serie: "920" })).emitente.motivo).toBe(motivo);
  });

  it("modelo 65 com série de 890 em diante", () => {
    const r = pelaChave(montarChave({ emitente: OUTRO, modelo: "65", serie: "890" }), 65);
    expect(r.emitente).toMatchObject({ tipo: "nao-identificado", motivo: "série sem regra confirmada para NFC-e" });
    expect(pelaChave(montarChave({ emitente: OUTRO, modelo: "65", serie: "001" }), 65).emitente.numero).toBe(OUTRO);
  });

  it("modelo 57 com as posições 7 a 9 iguais a 000", () => {
    const r = pelaChave(montarChave({ emitente: `000${CPF}`, modelo: "57" }), 57);
    expect(r.emitente).toMatchObject({ tipo: "nao-identificado", motivo: "CT-e com CPF ou CNPJ não distinguível pela chave" });
  });

  it("modelo 57 comum é lido como CNPJ", () => {
    expect(pelaChave(montarChave({ emitente: OUTRO, modelo: "57" }), 57).emitente.numero).toBe(OUTRO);
  });
});

describe("própria empresa (CA-8)", () => {
  it("CNPJ da chave com a mesma raiz da empresa", () => {
    const r = pelaChave(montarChave({ emitente: PROPRIO }));
    expect(r.emitente).toMatchObject({ tipo: "propria-empresa", documento: "cnpj", numero: PROPRIO, fonte: "chave" });
  });

  it("raiz diferente não é da própria empresa", () => {
    expect(pelaChave(montarChave({ emitente: OUTRO })).emitente.tipo).toBe("identificado");
  });

  it("CPF nunca é da própria empresa", () => {
    // CPF cujos 8 primeiros dígitos (depois dos zeros) coincidem com a raiz
    const cpfDaRaiz = cpfInvalidoDe(`${RAIZ}0`);
    const r = pelaChave(montarChave({ emitente: `000${cpfDaRaiz}`, serie: "910" }));
    expect(r.emitente).toMatchObject({ tipo: "identificado", documento: "cpf" });
  });

  it("sem raiz da empresa, nada é da própria empresa", () => {
    expect(lerChave(montarChave({ emitente: PROPRIO }), 55, undefined).tipo).toBe("identificado");
  });
});

// Vetores com o DV escrito como literal (rodada 1, F1). Chaves fictícias, UF 99. O DV de cada uma foi calculado à parte, sem usar
// o helper dvChave nem o código de src/: soma de (caractere ASCII - 48) x peso (2 a 9, da direita para a esquerda, voltando a 2 depois do 9),
// resto da divisão por 11, DV = 0 se o resto for 0 ou 1, senão 11 - resto.
describe("dígito verificador da chave, com vetores literais (rodada 1, F1)", () => {
  // Chave de 43 posições: UF 99, AAMM 2611, emitente, modelo 55, série 001, número 1 com 9 posições, tpEmis 1 e código de 8 posições.
  const base = (emitente: string, codigo: string) => ["99", "2611", emitente, "55", "001", "0".repeat(8) + "1", "1", codigo].join("");
  const CNPJ_NUM = ["11223344", "000155"].join("");
  const VETORES: Array<{ nome: string; base: string; soma: number; resto: number; dv: string; emitente: string }> = [
    { nome: "só dígitos, resto 9", base: base(CNPJ_NUM, "10000000"), soma: 405, resto: 9, dv: "2", emitente: CNPJ_NUM },
    { nome: "com letras, resto 7", base: base("AB12CD34EF5699", "10000000"), soma: 1074, resto: 7, dv: "4", emitente: "AB12CD34EF5699" },
    { nome: "só dígitos, resto 0", base: base(CNPJ_NUM, "10000001"), soma: 407, resto: 0, dv: "0", emitente: CNPJ_NUM },
    { nome: "com letras, resto 0", base: base("AB12CD34EF5699", "10000002"), soma: 1078, resto: 0, dv: "0", emitente: "AB12CD34EF5699" },
    { nome: "só dígitos, resto 1", base: base(CNPJ_NUM, "10000007"), soma: 419, resto: 1, dv: "0", emitente: CNPJ_NUM },
    { nome: "com letras, resto 1", base: base("AB12CD34EF5699", "10000008"), soma: 1090, resto: 1, dv: "0", emitente: "AB12CD34EF5699" },
  ];

  for (const v of VETORES) {
    it(`${v.nome}: com o DV ${v.dv} lê o emitente; com qualquer outro DV recusa`, () => {
      expect(v.base).toHaveLength(43);
      expect(v.soma % 11).toBe(v.resto);
      const certa = pelaChave(`${v.base}${v.dv}`);
      expect(certa.emitente).toMatchObject({ tipo: "identificado", documento: "cnpj", numero: v.emitente, fonte: "chave" });
      for (const outro of "0123456789") {
        if (outro === v.dv) continue;
        expect(pelaChave(`${v.base}${outro}`).emitente, `DV ${outro}`).toMatchObject({ tipo: "nao-identificado", motivo: "dígito verificador da chave inválido" });
      }
    });
  }

  it("o helper dvChave dos testes concorda com os vetores literais", () => {
    for (const v of VETORES) expect(dvChave(v.base)).toBe(v.dv);
  });
});

describe("limites das séries reservadas (rodada 1, F2)", () => {
  it("modelo 55: 889, 900 e 909 são CNPJ; 890 e 899 são nota avulsa; 910 sem CPF não é CNPJ", () => {
    for (const serie of ["000", "001", "889", "900", "909"]) {
      expect(pelaChave(montarChave({ emitente: OUTRO, serie })).emitente, serie).toMatchObject({ tipo: "identificado", documento: "cnpj", numero: OUTRO });
    }
    for (const serie of ["890", "899"]) {
      expect(pelaChave(montarChave({ emitente: OUTRO, serie })).emitente.motivo, serie).toBe("nota fiscal avulsa: a chave traz o CNPJ do fisco");
    }
    expect(pelaChave(montarChave({ emitente: OUTRO, serie: "910" })).emitente.motivo).toBe("série de emitente CPF sem CPF na chave");
  });

  it("modelo 65: 889 é CNPJ; 890 não tem regra", () => {
    expect(pelaChave(montarChave({ emitente: OUTRO, modelo: "65", serie: "889" }), 65).emitente).toMatchObject({ tipo: "identificado", numero: OUTRO });
    expect(pelaChave(montarChave({ emitente: OUTRO, modelo: "65", serie: "890" }), 65).emitente.tipo).toBe("nao-identificado");
  });

  it("modelos 57 e 62 com série de 890 em diante seguem lidos como CNPJ", () => {
    for (const modelo of ["57", "62"]) {
      for (const serie of ["889", "890", "899", "910", "999"]) {
        const r = pelaChave(montarChave({ emitente: OUTRO, modelo, serie }), parseInt(modelo, 10));
        expect(r.emitente, `${modelo}/${serie}`).toMatchObject({ tipo: "identificado", documento: "cnpj", numero: OUTRO, fonte: "chave" });
      }
    }
  });
});

describe("formatação", () => {
  it("CNPJ AA.AAA.AAA/AAAA-DD, com as letras como vierem", () => {
    expect(formatarCnpj(`${"11223344"}000187`)).toBe("11.223.344/0001-87");
    expect(formatarCnpj("FICT1234AB9Z01")).toBe("FI.CT1.234/AB9Z-01");
  });

  it("CPF DDD.DDD.DDD-DD", () => {
    expect(formatarCpf(`${"123456789"}00`)).toBe("123.456.789-00");
  });
});

describe("só a chave decide o emitente (CA-7)", () => {
  it("lerChave recebe só a chave, o documento e a raiz da empresa: nenhum nome, razão social ou valor", () => {
    expect(lerChave.length).toBe(3);
  });
});

describe("emitente CPF (P-S1, aprovada)", () => {
  it("NF-e de série 910 ou acima com CPF na chave dá emitente com documento cpf e o CPF de 11 dígitos", () => {
    for (const serie of ["910", "950", "999"]) {
      const e = lerChave(montarChave({ emitente: `000${CPF}`, serie }), 55, RAIZ);
      expect(e).toMatchObject({ tipo: "identificado", documento: "cpf", numero: CPF });
      expect(e.numero).toHaveLength(11);
    }
  });
});
