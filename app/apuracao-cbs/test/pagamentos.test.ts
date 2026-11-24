import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { lerSemPerda } from "../src/json.js";
import { resumirPagamentos } from "../src/leitores/pagamentos.js";
import { cabecalhoDe, linhasDoResumo, MENSAGEM_SEM_ALTERACOES } from "../src/saida.js";
import { descreverCicloDaConsulta, trilha } from "./apoio/cicloCli.js";
import { bytesDaFixture, criarAmbienteCli, roteirizarCiclo } from "./apoio/cli.js";

const PROIBIDOS = /dispon[ií]vel|a pagar|pendente|confirmado/i;

const ler = (nome: string): unknown => lerSemPerda(readFileSync(join(import.meta.dirname, "fixtures", "pagamentos", nome), "utf8"));

describe("leitor de pagamentos", () => {
  const resumo = resumirPagamentos(ler("valido.json"));

  it("agrupa os itens por período de apuração, em ordem cronológica", () => {
    expect(resumo.vazio).toBe(false);
    expect(resumo.periodos.map((p) => p.pa)).toEqual(["09/2026", "10/2026"]);
  });

  it("a origem vem do tipo: 1 = RAD, 2 = PCONT, com os nomes da página", () => {
    const p10 = resumo.periodos[1];
    expect(p10.linhas[0].origem).toEqual({ codigo: 1, sigla: "RAD", nome: "RAD (recolhimento pelo adquirente)" });
    expect(p10.linhas[1].origem).toEqual({ codigo: 2, sigla: "PCONT", nome: "PCONT (pagamento pelo contribuinte)" });
  });

  it("uma linha por item de composicao, com numeroDARF, dataArrecadacao, período e total", () => {
    const [rad10, pcont10] = resumo.periodos[1].linhas;
    expect(rad10).toMatchObject({ pa: "10/2026", numeroDARF: "12345678901234569", dataArrecadacao: "2026-11-10" });
    expect(rad10.total.toFixed(2)).toBe("100.00");
    expect(pcont10).toMatchObject({ pa: "10/2026", numeroDARF: "12345678901234570", dataArrecadacao: "2026-11-10" });
    expect(pcont10.total.toFixed(2)).toBe("200.10");
  });

  it("um pagamento com itens de períodos diferentes vira linhas em cada período", () => {
    const p09 = resumo.periodos[0];
    expect(p09.linhas).toHaveLength(1);
    expect(p09.linhas[0]).toMatchObject({ numeroDARF: "12345678901234569", pa: "09/2026" });
    expect(p09.linhas[0].total.toFixed(2)).toBe("42.50");
  });

  it("por período: quantidade, total RAD, total PCONT e total geral, ao centavo", () => {
    const [p09, p10] = resumo.periodos;
    expect(p09.quantidade).toBe(1);
    expect(p09.totalRAD.toFixed(2)).toBe("42.50");
    expect(p09.totalPCONT.toFixed(2)).toBe("0.00");
    expect(p09.totalGeral.toFixed(2)).toBe("42.50");
    expect(p10.quantidade).toBe(2);
    expect(p10.totalRAD.toFixed(2)).toBe("100.00");
    expect(p10.totalPCONT.toFixed(2)).toBe("200.10");
    expect(p10.totalGeral.toFixed(2)).toBe("300.10");
  });

  it("apuracao vazia é resultado válido", () => {
    const vazio = resumirPagamentos(ler("vazio.json"));
    expect(vazio.vazio).toBe(true);
    expect(vazio.periodos).toEqual([]);
  });
});

describe("resumo de pagamentos", () => {
  const brutos = ler("valido.json");
  const texto = linhasDoResumo(cabecalhoDe("pagamentos", brutos, "C:/x/p.json"), resumirPagamentos(brutos)).join("\n");

  it("traz o cabeçalho comum", () => {
    expect(texto).toContain("pagamentos");
    expect(texto).toContain("TIQUETE-FICTICIO-PAGA-0001");
    expect(texto).toContain("C:/x/p.json");
  });

  it("mostra por item a origem (RAD ou PCONT), o DARF, a arrecadação e o total", () => {
    expect(texto).toContain("Período 10/2026");
    expect(texto).toContain("RAD (recolhimento pelo adquirente)");
    expect(texto).toContain("PCONT (pagamento pelo contribuinte)");
    expect(texto).toContain("DARF 12345678901234569");
    expect(texto).toContain("arrecadação 2026-11-10");
    expect(texto).toContain("total 200,10");
  });

  it("mostra por período os totais de RAD, PCONT e geral", () => {
    expect(texto).toContain("total RAD 100,00");
    expect(texto).toContain("total PCONT 200,10");
    expect(texto).toContain("total geral 300,10");
    expect(texto).toContain("total RAD 42,50");
    expect(texto).toContain("total PCONT 0,00");
  });

  it("não mostra niAdquirente nem niContribuinte, e não usa os rótulos proibidos", () => {
    expect(texto).not.toContain("12345678000200");
    expect(texto).not.toContain("12345678000100");
    expect(texto).not.toMatch(PROIBIDOS);
  });

  it("arquivo vazio mostra a mensagem de sem alterações", () => {
    const vazio = ler("vazio.json");
    const t = linhasDoResumo(cabecalhoDe("pagamentos", vazio, "C:/x/v.json"), resumirPagamentos(vazio)).join("\n");
    expect(t).toContain(MENSAGEM_SEM_ALTERACOES);
  });
});

descreverCicloDaConsulta("pagamentos", {
  esperado: ["RAD (recolhimento pelo adquirente)", "PCONT (pagamento pelo contribuinte)", "total geral 300,10", "12345678901234570"],
  marcaDeResumo: "Período",
  invalidos: ["rad-vencimento-data.json"],
  divergencia: "/vencimento",
});

describe("RAD com vencimento só data, como o exemplo oficial (divergência 3, decisão D-1)", () => {
  it("é recusado pelo schema, fica guardado, dá código 3 e não gera resumo", async () => {
    const a = criarAmbienteCli();
    const bytes = bytesDaFixture("pagamentos", "rad-vencimento-data.json");
    roteirizarCiclo(a.api, { servico: "pagamentos", bytes });
    expect(await a.rodar(["consulta", "pagamentos"])).toBe(3);
    expect(a.guardados()).toHaveLength(1);
    const texto = a.saida.texto();
    expect(texto).toContain("/apuracao/0/pagamentos/0/composicao/0/vencimento");
    expect(texto).toContain("date-time");
    expect(texto).not.toContain("Período");
    expect(texto).not.toContain("total geral");
    // o valor do campo não é mostrado
    expect(texto).not.toContain("2026-11-20");
    expect(trilha(a).filter((t) => t.startsWith("POST /pagamentos"))).toHaveLength(1);
  });

  it("não existe opção para resumir arquivo inválido", async () => {
    const a = criarAmbienteCli();
    expect(await a.rodar(["consulta", "pagamentos", "--resumir-mesmo-invalido"])).toBe(2);
    expect(a.api.pedidos).toHaveLength(0);
  });
});
