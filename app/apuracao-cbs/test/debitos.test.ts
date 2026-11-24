import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { lerSemPerda } from "../src/json.js";
import { resumirDebitos } from "../src/leitores/debitos.js";
import { cabecalhoDe, linhasDoResumo, MENSAGEM_SEM_ALTERACOES } from "../src/saida.js";
import { descreverCicloDaConsulta } from "./apoio/cicloCli.js";

const PROIBIDOS = /dispon[ií]vel|a pagar|pendente|confirmado/i;

const ler = (nome: string): unknown => lerSemPerda(readFileSync(join(import.meta.dirname, "fixtures", "debitos", nome), "utf8"));

describe("leitor de débitos", () => {
  const resumo = resumirDebitos(ler("valido.json"));

  it("agrupa por período de apuração, na ordem do arquivo", () => {
    expect(resumo.vazio).toBe(false);
    expect(resumo.periodos.map((p) => p.pa)).toEqual(["10/2026", "11/2026"]);
  });

  it("uma linha por débito, com período, chave, tipo, apurado, extinto e saldo devedor", () => {
    const [a, b] = resumo.periodos[0].linhas;
    expect(a).toMatchObject({ pa: "10/2026", chave: "FICT-NFE-0101", documento: { codigo: 55, nome: "NF-e" } });
    expect(a.apurado.toFixed(2)).toBe("800.00");
    expect(a.extinto.toFixed(2)).toBe("300.00");
    expect(a.saldoDevedor.toFixed(2)).toBe("500.00");
    expect(b.chave).toBe("FICT-NFCE-0102");
    expect(b.documento).toEqual({ codigo: 65, nome: "NFC-e" });
  });

  it("extinto omitido vale 0,00", () => {
    const [, semExtinto] = resumo.periodos[0].linhas;
    expect(semExtinto.apurado.toFixed(2)).toBe("150.07");
    expect(semExtinto.extinto.toFixed(2)).toBe("0.00");
    expect(semExtinto.saldoDevedor.toFixed(2)).toBe("150.07");
  });

  it("por período: quantidade e os três totais, ao centavo", () => {
    const [p10, p11] = resumo.periodos;
    expect(p10.quantidade).toBe(2);
    expect(p10.totalApurado.toFixed(2)).toBe("950.07");
    expect(p10.totalExtinto.toFixed(2)).toBe("300.00");
    expect(p10.totalSaldoDevedor.toFixed(2)).toBe("650.07");
    expect(p11.quantidade).toBe(1);
    expect(p11.totalApurado.toFixed(2)).toBe("90.10");
    expect(p11.totalExtinto.toFixed(2)).toBe("90.10");
    expect(p11.totalSaldoDevedor.toFixed(2)).toBe("0.00");
  });

  it("apuracao vazia é resultado válido", () => {
    const vazio = resumirDebitos(ler("vazio.json"));
    expect(vazio.vazio).toBe(true);
    expect(vazio.periodos).toEqual([]);
  });
});

describe("resumo de débitos", () => {
  const brutos = ler("valido.json");
  const texto = linhasDoResumo(cabecalhoDe("debitos", brutos, "C:/x/d.json"), resumirDebitos(brutos)).join("\n");

  it("traz o cabeçalho comum e não mostra o niConsumidor", () => {
    expect(texto).toContain("debitos");
    expect(texto).toContain("TIQUETE-FICTICIO-DEBI-0001");
    expect(texto).toContain("C:/x/d.json");
    expect(texto).not.toContain("12345678000100");
  });

  it("mostra por débito: chave, tipo, apurado, extinto e saldo devedor", () => {
    expect(texto).toContain("Período 10/2026");
    expect(texto).toContain("FICT-NFE-0101");
    expect(texto).toContain("NF-e (55)");
    expect(texto).toContain("apurado 800,00");
    expect(texto).toContain("extinto 300,00");
    expect(texto).toContain("saldo devedor 500,00");
    expect(texto).toContain("extinto 0,00");
  });

  it("mostra por período a quantidade e os três totais", () => {
    expect(texto).toContain("2 débito(s)");
    expect(texto).toContain("total apurado 950,07");
    expect(texto).toContain("total extinto 300,00");
    expect(texto).toContain("total saldo devedor 650,07");
  });

  it("não usa os rótulos proibidos", () => {
    expect(texto).not.toMatch(PROIBIDOS);
  });

  it("arquivo vazio mostra a mensagem de sem alterações", () => {
    const vazio = ler("vazio.json");
    const t = linhasDoResumo(cabecalhoDe("debitos", vazio, "C:/x/v.json"), resumirDebitos(vazio)).join("\n");
    expect(t).toContain(MENSAGEM_SEM_ALTERACOES);
  });
});

descreverCicloDaConsulta("debitos", {
  esperado: ["FICT-NFE-0101", "saldo devedor 500,00", "total saldo devedor 650,07", "extinto"],
  marcaDeResumo: "Período",
  invalidos: ["invalido.json"],
  divergencia: "/apuracao/0/debitos/0/cbs",
});
