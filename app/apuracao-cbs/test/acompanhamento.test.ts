import { describe, expect, it } from "vitest";
import { acompanhar } from "../src/acompanhamento.js";
import { lerConfig } from "../src/config.js";
import { ErroApi } from "../src/erros.js";
import { criarRedator } from "../src/redacao.js";
import { criarRegistro } from "../src/registro.js";
import type { Situacao } from "../src/api.js";
import { envFicticio } from "./apoio/ficticios.js";
import { pastaTemporaria } from "./apoio/pasta.js";
import { criarDormirFalso, criarRelogioFalso } from "./apoio/relogio.js";
import { criarSaidaCapturada } from "./apoio/saida.js";

type Roteiro = Array<Situacao | Error>;

function montar(opcoes: { env?: Record<string, string | undefined>; abertura?: boolean } = {}) {
  const config = lerConfig(envFicticio(opcoes.env));
  const relogio = criarRelogioFalso(new Date(2026, 10, 23, 10, 0, 0));
  const registro = criarRegistro({ pastaLocal: pastaTemporaria(), relogio });
  if (opcoes.abertura !== false) registro.registrar({ servico: "creditos", tipo: "abertura", http: 201, tiquete: "T-1" });
  const saida = criarSaidaCapturada();
  const dormir = criarDormirFalso(relogio);
  const chamadas: string[] = [];
  const comRoteiro = (roteiro: Roteiro) => ({
    situacao: async (tiquete: string): Promise<Situacao> => {
      chamadas.push(tiquete);
      const r = roteiro[Math.min(chamadas.length - 1, roteiro.length - 1)];
      if (r instanceof Error) throw r;
      return r;
    },
  });
  const redator = criarRedator();
  const rodar = (roteiro: Roteiro, extra: { teaSegundos?: number } = {}) =>
    acompanhar({
      servico: "creditos",
      tiquete: "T-1",
      teaSegundos: extra.teaSegundos,
      config,
      api: comRoteiro(roteiro),
      registro,
      relogio,
      dormir,
      saida,
      redator,
    });
  return { config, relogio, registro, saida, dormir, chamadas, rodar, redator };
}

const PENDENTE: Situacao = { situacao: "PENDENTE" };
const EM_PROCESSAMENTO: Situacao = { situacao: "EM_PROCESSAMENTO" };
const CONCLUIDA: Situacao = { situacao: "CONCLUIDA" };

async function falha(promessa: Promise<unknown>): Promise<ErroApi> {
  try {
    await promessa;
  } catch (e) {
    expect(e).toBeInstanceOf(ErroApi);
    return e as ErroApi;
  }
  throw new Error("era esperado um ErroApi");
}

describe("cabeçalho do acompanhamento", () => {
  it("mostra serviço, tíquete e a estimativa em minutos e segundos", async () => {
    const t = montar();
    await t.rodar([CONCLUIDA], { teaSegundos: 125 });
    const texto = t.saida.texto();
    expect(texto).toContain("creditos");
    expect(texto).toContain("T-1");
    expect(texto).toContain("Estimativa: 2 min 5 s");
  });

  it("-1 é sem estimativa", async () => {
    const t = montar();
    await t.rodar([CONCLUIDA], { teaSegundos: -1 });
    expect(t.saida.texto()).toContain("Estimativa: sem estimativa");
  });

  it("na retomada, a estimativa não está disponível", async () => {
    const t = montar();
    await t.rodar([CONCLUIDA]);
    expect(t.saida.texto()).toContain("Estimativa: não disponível na retomada");
  });
});

describe("esperas entre consultas de situação", () => {
  const INTERVALO_MS = 300_000;

  it("primeira espera = max(60, min(tEASegundos, intervalo)) com tEASegundos > 0; depois, o intervalo", async () => {
    const casos: Array<[number | undefined, number]> = [
      [120, 120_000],
      [30, 60_000],
      [1000, INTERVALO_MS],
      [300, INTERVALO_MS],
      [-1, INTERVALO_MS],
      [0, INTERVALO_MS],
      [undefined, INTERVALO_MS],
    ];
    for (const [tea, esperado] of casos) {
      const t = montar();
      await t.rodar([PENDENTE, PENDENTE, CONCLUIDA], { teaSegundos: tea });
      expect(t.dormir.pedidos, `tea=${tea}`).toEqual([esperado, INTERVALO_MS, INTERVALO_MS]);
    }
  });

  it("respeita o intervalo configurado", async () => {
    const t = montar({ env: { APURACAO_INTERVALO_SITUACAO_SEGUNDOS: "90" } });
    await t.rodar([PENDENTE, CONCLUIDA], { teaSegundos: 600 });
    expect(t.dormir.pedidos).toEqual([90_000, 90_000]);
  });

  it("consulta a situação do tíquete certo a cada espera", async () => {
    const t = montar();
    await t.rodar([PENDENTE, CONCLUIDA]);
    expect(t.chamadas).toEqual(["T-1", "T-1"]);
  });
});

describe("mudanças de situação", () => {
  it("mostra a primeira situação e cada mudança, com horário, sem repetir a igual", async () => {
    const t = montar();
    await t.rodar([PENDENTE, PENDENTE, EM_PROCESSAMENTO, EM_PROCESSAMENTO, CONCLUIDA]);
    const linhas = t.saida.linhas.filter((l) => /situação:/.test(l));
    expect(linhas).toHaveLength(3);
    expect(linhas[0]).toMatch(/^\[\d{2}:\d{2}:\d{2}\] situação: PENDENTE$/);
    expect(linhas[1]).toMatch(/situação: EM_PROCESSAMENTO$/);
    expect(linhas[2]).toMatch(/situação: CONCLUIDA$/);
  });

  it("CONCLUIDA devolve o controle", async () => {
    const t = montar();
    await expect(t.rodar([PENDENTE, CONCLUIDA])).resolves.toBeDefined();
    expect(t.chamadas).toHaveLength(2);
  });

  it("ERRO encerra com codigoErro e mensagemErro", async () => {
    const t = montar();
    const e = await falha(t.rodar([PENDENTE, { situacao: "ERRO", codigoErro: "ERRO_PROC", mensagemErro: "falha ao processar" }]));
    expect(e.motivo).toBe("situacao-erro");
    expect(e.message).toContain("codigoErro=ERRO_PROC");
    expect(e.message).toContain("mensagemErro=falha ao processar");
    expect(e.message).toContain("T-1");
  });

  it("EXPIRADA encerra com codigoErro e mensagemErro", async () => {
    const t = montar();
    const e = await falha(t.rodar([{ situacao: "EXPIRADA", codigoErro: "EXPIRADA", mensagemErro: "prazo de 240 minutos" }]));
    expect(e.motivo).toBe("situacao-expirada");
    expect(e.message).toContain("codigoErro=EXPIRADA");
    expect(e.message).toContain("prazo de 240 minutos");
  });

  it("situação desconhecida é erro, sem adivinhar", async () => {
    const t = montar();
    const e = await falha(t.rodar([{ situacao: "NOVA_SITUACAO" }]));
    expect(e.message).toContain("situação não documentada: NOVA_SITUACAO");
    expect(t.chamadas).toHaveLength(1);
  });

  it("um erro da API na consulta de situação sobe sem nova tentativa", async () => {
    const t = montar();
    const erro = new ErroApi({ tipoChamada: "situacao", servico: "creditos", http: 500, tiquete: "T-1" }, criarRedator());
    const e = await falha(t.rodar([PENDENTE, erro, CONCLUIDA]));
    expect(e).toBe(erro);
    expect(t.chamadas).toHaveLength(2);
  });
});

describe("espera máxima", () => {
  it("passada a espera máxima, para com o comando de retomada", async () => {
    const t = montar({ env: { APURACAO_ESPERA_MAXIMA_MINUTOS: "10", APURACAO_INTERVALO_SITUACAO_SEGUNDOS: "300" } });
    const e = await falha(t.rodar([PENDENTE]));
    expect(e.motivo).toBe("espera-maxima");
    expect(e.codigoSaida).toBe(1);
    expect(e.message).toContain("Espera máxima");
    expect(e.message.endsWith("npm run consulta -- creditos --tiquete T-1")).toBe(true);
    expect(t.chamadas).toHaveLength(2);
  });
});

describe("tempo de processamento", () => {
  it("vai da abertura registrada até a primeira CONCLUIDA observada", async () => {
    const t = montar();
    const r = await t.rodar([PENDENTE, CONCLUIDA], { teaSegundos: -1 });
    // abertura às 10:00:00; duas esperas de 300 s; CONCLUIDA às 10:10:00
    expect(r.tempoProcessamentoMs).toBe(600_000);
    expect(t.saida.texto()).toContain("Tempo de processamento: 10 min 0 s");
  });

  it("na retomada, conta desde a abertura registrada, mesmo de outra execução", async () => {
    const t = montar();
    t.relogio.avancar(30 * 60_000); // retomada às 10:30
    const r = await t.rodar([CONCLUIDA]);
    expect(r.tempoProcessamentoMs).toBe((30 * 60 + 300) * 1000);
  });

  it("sem abertura registrada, avisa que não dá para medir", async () => {
    const t = montar({ abertura: false });
    const r = await t.rodar([CONCLUIDA]);
    expect(r.tempoProcessamentoMs).toBeUndefined();
    expect(t.saida.texto()).toContain("Tempo de processamento: não disponível");
  });
});
