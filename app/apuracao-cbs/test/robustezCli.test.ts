import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { erroDeTempo } from "./apoio/apiSimulada.js";
import { semSegredos, trilha } from "./apoio/cicloCli.js";
import { RESPOSTA_TOKEN, bytesDaFixture, criarAmbienteCli, roteirizarCiclo, type AmbienteCli } from "./apoio/cli.js";
import { TOKEN } from "./apoio/ficticios.js";

const COMANDO = "Para retomar: npm run consulta -- creditos --tiquete TIQ-1";
const valido = (): Uint8Array => bytesDaFixture("creditos", "valido.json");
const registroTexto = (a: AmbienteCli): string => readFileSync(join(a.pastaLocal, "chamadas.jsonl"), "utf8");
const aberturas = (a: AmbienteCli): number => registroTexto(a).split("\n").filter((l) => l.includes('"tipo":"abertura"')).length;

describe("depois do tíquete conhecido, toda falha termina com o comando de retomada (B)", () => {
  it("download do arquivo com corpo que estoura o tempo: código 1, retomada, nada guardado, uma só abertura", async () => {
    const a = criarAmbienteCli();
    roteirizarCiclo(a.api, { servico: "creditos", bytes: valido(), arquivo: { status: 200, corpoRejeita: erroDeTempo() } });
    expect(await a.rodar(["consulta", "creditos"])).toBe(1);
    const texto = a.saida.texto();
    expect(texto).toContain("interrompido");
    expect(texto).toContain("tempo esgotado");
    expect(texto.endsWith(COMANDO)).toBe(true);
    expect(texto).not.toContain("Erro inesperado");
    expect(a.guardados()).toEqual([]);
    expect(a.api.contar("POST", "/creditos/")).toBe(1);
    expect(aberturas(a)).toBe(1);
    expect(registroTexto(a)).not.toContain('"tipo":"arquivo","http":200');
    semSegredos(a);
  });

  it("abertura com corpo ilegível: mensagem de corpo ilegível, aviso de que contou no limite, sem retomada (tíquete desconhecido)", async () => {
    const a = criarAmbienteCli();
    a.api.rota("POST", "/token", RESPOSTA_TOKEN);
    a.api.rota("POST", "/creditos/12345678", { status: 201, corpoRejeita: erroDeTempo() });
    expect(await a.rodar(["consulta", "creditos"])).toBe(1);
    const texto = a.saida.texto();
    expect(texto).toContain("corpo da resposta não pôde ser lido (tempo esgotado)");
    expect(texto).toContain("contou no limite de 4 aberturas por dia");
    expect(texto).not.toContain("Erro inesperado");
    expect(aberturas(a)).toBe(1);
    semSegredos(a);
  });

  it("token com corpo ilegível: mensagem certa e nenhuma abertura", async () => {
    const a = criarAmbienteCli();
    a.api.rota("POST", "/token", { status: 200, corpoRejeita: erroDeTempo() });
    expect(await a.rodar(["consulta", "creditos"])).toBe(1);
    expect(a.saida.texto()).toContain("contado no controle local do limite de 2 tokens por hora");
    expect(a.api.contar("POST", "/creditos/")).toBe(0);
  });

  it("token que vence durante a espera: novo pedido e novo Bearer; na terceira renovação, código 1 sem terceiro POST de token, sem nova abertura e com retomada", async () => {
    const a = criarAmbienteCli();
    const curto = (t: string) => ({ status: 200, corpo: { access_token: t, expires_in: 150 } });
    a.api.rota("POST", "/token", curto(TOKEN), curto("token-ficticio-2"), curto("token-ficticio-3"));
    a.api.rota("POST", "/creditos/12345678", { status: 201, corpo: { tiqueteSolicitacao: "TIQ-1", tEASegundos: 120 } });
    a.api.rota("GET", "/situacao/", ...["PENDENTE", "PENDENTE", "PENDENTE"].map((s) => ({ status: 200, corpo: { situacao: s } })));

    expect(await a.rodar(["consulta", "creditos"])).toBe(1);

    expect(a.api.contar("POST", "/token")).toBe(2);
    expect(a.api.contar("POST", "/creditos/")).toBe(1);
    expect(a.api.pedidos.find((p) => p.url.includes("/creditos/"))?.cabecalhos.authorization).toBe(`Bearer ${TOKEN}`);
    expect(a.api.pedidos.find((p) => p.url.includes("/situacao/"))?.cabecalhos.authorization).toBe("Bearer token-ficticio-2");
    const texto = a.saida.texto();
    expect(texto).toContain("limite de 2 tokens por hora");
    expect(texto).not.toContain("Erro inesperado");
    expect(texto.endsWith(COMANDO)).toBe(true);
    expect(aberturas(a)).toBe(1);
    expect(texto).not.toContain("token-ficticio-3");
  });

  it("falha ao gravar o arquivo bruto: código 1, caminho, código do erro e retomada; nada com nome canônico", async () => {
    const a = criarAmbienteCli();
    writeFileSync(join(a.pastaLocal, "arquivos"), "isto é um arquivo, não uma pasta");
    roteirizarCiclo(a.api, { servico: "creditos", bytes: valido() });
    expect(await a.rodar(["consulta", "creditos"])).toBe(1);
    const texto = a.saida.texto();
    expect(texto).toContain("arquivo bruto");
    expect(texto).toMatch(/E[A-Z]+/);
    expect(texto).toContain("arquivos");
    expect(texto.endsWith(COMANDO)).toBe(true);
    expect(texto).not.toContain("Erro inesperado");
    expect(aberturas(a)).toBe(1);
  });
});

describe("checagem de escrita antes da primeira chamada (A)", () => {
  it("chamadas.jsonl impossível de gravar: zero chamadas, código 1 e mensagem que diz isso", async () => {
    const a = criarAmbienteCli();
    mkdirSync(join(a.pastaLocal, "chamadas.jsonl"));
    roteirizarCiclo(a.api, { servico: "creditos", bytes: valido() });
    expect(await a.rodar(["consulta", "creditos"])).toBe(1);
    expect(a.api.pedidos).toHaveLength(0);
    expect(a.saida.texto()).toContain("chamadas.jsonl");
    expect(a.saida.texto()).toContain("Nenhuma chamada foi feita");
  });

  it("pasta local que é um arquivo: zero chamadas, também na retomada por tíquete", async () => {
    const a = criarAmbienteCli();
    rmSync(a.pastaLocal, { recursive: true, force: true });
    writeFileSync(a.pastaLocal, "arquivo no lugar da pasta");
    roteirizarCiclo(a.api, { servico: "creditos", bytes: valido(), situacoes: ["CONCLUIDA"] });
    expect(await a.rodar(["consulta", "creditos", "--tiquete", "T-9"])).toBe(1);
    expect(a.api.pedidos).toHaveLength(0);
    expect(a.saida.texto()).toContain("Nenhuma chamada foi feita");
  });
});

describe("falha de gravação depois da chamada feita não interrompe o fluxo (A, F)", () => {
  it("registro quebra logo depois da abertura aceita: tíquete e retomada na saída, aviso, e o ciclo termina com código 0", async () => {
    const a = criarAmbienteCli();
    roteirizarCiclo(a.api, { servico: "creditos", bytes: valido() });
    const real = a.deps.fetch;
    a.deps.fetch = (async (entrada: string | URL | Request, init?: RequestInit) => {
      const r = await real(entrada, init);
      if (init?.method === "POST" && String(entrada).includes("/creditos/")) {
        rmSync(join(a.pastaLocal, "chamadas.jsonl"), { force: true });
        mkdirSync(join(a.pastaLocal, "chamadas.jsonl"));
      }
      return r;
    }) as typeof fetch;
    expect(await a.rodar(["consulta", "creditos"])).toBe(0);
    const texto = a.saida.texto();
    expect(texto).toContain(`Tíquete recebido: TIQ-1. ${COMANDO}`);
    expect(texto).toContain("Aviso: não foi possível gravar o registro");
    expect(texto.indexOf("Tíquete recebido")).toBeLessThan(texto.indexOf("Aviso: não foi possível gravar"));
    expect(a.guardados()).toHaveLength(1);
    expect(trilha(a).filter((l) => l.startsWith("POST /creditos"))).toHaveLength(1);
  });

  it("cache do token impossível de gravar: o token é usado mesmo assim", async () => {
    const a = criarAmbienteCli();
    mkdirSync(join(a.pastaLocal, "token.json"));
    roteirizarCiclo(a.api, { servico: "creditos", bytes: valido() });
    expect(await a.rodar(["consulta", "creditos"])).toBe(0);
    expect(a.api.pedidos.find((p) => p.url.includes("/creditos/"))?.cabecalhos.authorization).toBe(`Bearer ${TOKEN}`);
    expect(a.saida.texto()).toMatch(/Aviso: .*token\.json/);
    expect(a.api.contar("POST", "/token")).toBe(1);
  });
});

describe("registro ilegível não impede o download nem mascara o erro (E)", () => {
  const abertura = '{"quando":"2026-11-23T09:00:00.000-03:00","servico":"creditos","tipo":"abertura","http":201,"tiquete":"T-9"}';

  it("linha malformada: o download acontece, o aviso cita a linha e ela é avisada uma só vez", async () => {
    const a = criarAmbienteCli();
    writeFileSync(join(a.pastaLocal, "chamadas.jsonl"), `${abertura}\n{lixo\n`);
    roteirizarCiclo(a.api, { servico: "creditos", bytes: valido(), tiquete: "T-9", situacoes: ["CONCLUIDA"] });
    expect(await a.rodar(["consulta", "creditos", "--tiquete", "T-9"])).toBe(0);
    const texto = a.saida.texto();
    expect(texto).toContain("linha 2");
    expect(texto.split("linha 2").length - 1).toBe(1);
    expect(texto).not.toContain("Erro inesperado");
    expect(a.guardados()).toHaveLength(1);
  });

  it("429 na abertura continua sendo o 429, com a linha ilegível contada como abertura feita", async () => {
    const a = criarAmbienteCli();
    writeFileSync(join(a.pastaLocal, "chamadas.jsonl"), "{lixo\n");
    a.api.rota("POST", "/token", RESPOSTA_TOKEN);
    a.api.rota("POST", "/creditos/12345678", { status: 429, corpo: { codigoErro: "LIMITE" } });
    expect(await a.rodar(["consulta", "creditos"])).toBe(1);
    const texto = a.saida.texto();
    expect(texto).toContain("Limite excedido (HTTP 429)");
    expect(texto).toContain("linha 1");
    expect(texto).toContain("Aberturas de creditos registradas hoje: 1 (0 aceitas)");
    expect(texto).not.toContain("Erro inesperado");
  });
});
