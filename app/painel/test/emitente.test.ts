import Big from "big.js";
import { describe, expect, it } from "vitest";
import type { ItemRecolhimento } from "../src/nucleo/consolidacao.js";
import { formatarCnpj, formatarCpf, resolverEmitente } from "../src/nucleo/emitente.js";
import { dvChave, montarChave, RAIZ } from "./apoio/construtores.js";
import { cnpjInvalidoDe, cpfInvalidoDe } from "./apoio/dv.js";

const FORNECEDOR = cnpjInvalidoDe("112233440001");
const OUTRO = cnpjInvalidoDe("667788990001");
const PROPRIO = cnpjInvalidoDe(`${RAIZ}0002`);
const CPF = cpfInvalidoDe("123456789");

const ROTULO_RECOLHIMENTO = "CNPJ do fornecedor, informado no recolhimento";
const ROTULO_CNPJ = "CNPJ do emitente, lido da chave da nota";
const ROTULO_CPF = "CPF do emitente, lido da chave da nota";

function item(chaveDFE: string | undefined, niFornecedor: string): ItemRecolhimento {
  const zero = Big(0);
  return {
    dataArrecadacao: "2026-11-10",
    numeroDARF: "99999000000000001",
    sequencial: 1,
    pa: "11/2026",
    vencimento: "2026-12-20",
    niFornecedor,
    chaveDFE,
    principal: zero,
    multa: zero,
    juros: zero,
    total: zero,
    arquivo: "a.json",
    geradoEm: "2026-11-20T10:00:00-03:00",
  };
}

const pelaChave = (chave: string, documento = 55, recolhimentos: ItemRecolhimento[] = []) => resolverEmitente({ chave, documento }, recolhimentos, RAIZ);

describe("emitente pelo recolhimento (CA-12, D-4)", () => {
  it("usa o niFornecedor do recolhimento com a mesma chaveDFE", () => {
    const chave = montarChave({ emitente: OUTRO });
    const r = pelaChave(chave, 55, [item(chave, FORNECEDOR), item("outra-chave", OUTRO)]);
    expect(r.emitente).toMatchObject({ tipo: "identificado", documento: "cnpj", numero: FORNECEDOR, fonte: "recolhimento", rotulo: ROTULO_RECOLHIMENTO });
  });

  it("vale também para documento sem leitura pela chave (91)", () => {
    const chave = "9".repeat(50);
    const r = pelaChave(chave, 91, [item(chave, FORNECEDOR)]);
    expect(r.emitente.numero).toBe(FORNECEDOR);
    expect(r.emitente.fonte).toBe("recolhimento");
  });

  it("itens do mesmo fornecedor para a mesma chave não divergem", () => {
    const chave = montarChave({ emitente: OUTRO });
    const r = pelaChave(chave, 55, [item(chave, FORNECEDOR), item(chave, FORNECEDOR)]);
    expect(r.emitente.numero).toBe(FORNECEDOR);
  });

  it("recolhimentos com fornecedores diferentes: não identificado", () => {
    const chave = montarChave({ emitente: OUTRO });
    const r = pelaChave(chave, 55, [item(chave, FORNECEDOR), item(chave, OUTRO)]);
    expect(r.emitente).toMatchObject({ tipo: "nao-identificado", motivo: "recolhimentos divergentes" });
  });

  it("recolhimento e chave divergentes: vale o recolhimento e os dois ficam disponíveis (DT-6)", () => {
    const chave = montarChave({ emitente: OUTRO });
    const r = pelaChave(chave, 55, [item(chave, FORNECEDOR)]);
    expect(r.emitente.numero).toBe(FORNECEDOR);
    expect(r.recolhimento?.numero).toBe(FORNECEDOR);
    expect(r.chave.numero).toBe(OUTRO);
    expect(r.divergente).toBe(true);
  });

  it("recolhimento e chave iguais não são divergência", () => {
    const chave = montarChave({ emitente: FORNECEDOR });
    const r = pelaChave(chave, 55, [item(chave, FORNECEDOR)]);
    expect(r.divergente).toBe(false);
    expect(r.emitente.fonte).toBe("recolhimento");
  });

  it("sem recolhimento ligado, divergente é falso", () => {
    expect(pelaChave(montarChave({ emitente: OUTRO })).divergente).toBe(false);
  });
});

describe("emitente pela chave de 44 posições (CA-12, D-4, fontes F-A a F-E)", () => {
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
    const r = pelaChave("12345678901234567890123456789012345678901234567890", 91);
    expect(r.emitente.tipo).toBe("nao-identificado");
    expect(r.emitente.motivo).toBe("leiaute da chave deste tipo de documento não confirmado");
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

describe("própria empresa (CA-12)", () => {
  it("CNPJ da chave com a mesma raiz da empresa", () => {
    const r = pelaChave(montarChave({ emitente: PROPRIO }));
    expect(r.emitente).toMatchObject({ tipo: "propria-empresa", documento: "cnpj", numero: PROPRIO, fonte: "chave" });
  });

  it("fornecedor do recolhimento com a mesma raiz da empresa", () => {
    const chave = montarChave({ emitente: OUTRO });
    const r = pelaChave(chave, 55, [item(chave, PROPRIO)]);
    expect(r.emitente).toMatchObject({ tipo: "propria-empresa", fonte: "recolhimento" });
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
    const r = resolverEmitente({ chave: montarChave({ emitente: PROPRIO }), documento: 55 }, [], undefined);
    expect(r.emitente.tipo).toBe("identificado");
  });
});

describe("formatação", () => {
  it("CNPJ AA.AAA.AAA/AAAA-DD, com as letras como vierem", () => {
    expect(formatarCnpj("11223344000187")).toBe("11.223.344/0001-87");
    expect(formatarCnpj("FICT1234AB9Z01")).toBe("FI.CT1.234/AB9Z-01");
  });

  it("CPF DDD.DDD.DDD-DD", () => {
    expect(formatarCpf("12345678900")).toBe("123.456.789-00");
  });
});
