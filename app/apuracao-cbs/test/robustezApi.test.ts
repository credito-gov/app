import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { erroDeRede, erroDeTempo } from "./apoio/apiSimulada.js";
import { montarClientes, falha } from "./apoio/clientes.js";
import { ID, SEGREDO, TOKEN, URL_ASSINADA } from "./apoio/ficticios.js";

function quebrarRegistro(pasta: string): void {
  rmSync(join(pasta, "chamadas.jsonl"), { force: true });
  mkdirSync(join(pasta, "chamadas.jsonl"));
}

describe("segredos (CA-12): a redação é exercida de verdade", () => {
  it("a urlAssinada, o token e as credenciais não aparecem em saída, registro nem mensagem de erro, mesmo quando o corpo de erro os repete", async () => {
    const t = montarClientes();
    t.redator.registrar(ID);
    t.redator.registrar(SEGREDO);
    t.api.rota("GET", "/download/", { status: 200, corpo: { urlAssinada: URL_ASSINADA } });
    t.api.rota("GET", "/situacao/", {
      status: 403,
      corpo: { codigoErro: `X-${ID}`, mensagemErro: `negado para ${URL_ASSINADA} com ${TOKEN} e ${SEGREDO}` },
    });
    await t.cliente.linkDownload("T-1");
    const e = await falha(t.cliente.situacao("T-1"));
    expect(e.message).toContain("***");
    const tudo = [t.saida.texto(), e.message, JSON.stringify(t.linhasDoRegistro())].join("\n");
    for (const proibido of [URL_ASSINADA, TOKEN, ID, SEGREDO]) expect(tudo).not.toContain(proibido);
  });

  it("erro de rede mostra só o código da causa, nunca a mensagem inteira", async () => {
    const t = montarClientes();
    t.api.rota("GET", "/situacao/", { erro: erroDeRede("fetch failed https://api.exemplo.invalid/x?chave=MUITO-SECRETA", "ENOTFOUND") });
    const e = await falha(t.cliente.situacao("T-1"));
    expect(e.message).toContain("ENOTFOUND");
    expect(e.message).not.toContain("MUITO-SECRETA");
    expect(e.message).not.toContain("fetch failed");
  });
});

describe("corpo da resposta que não pode ser lido (C)", () => {
  it("abertura 2xx: erro com a causa e aviso de que contou no limite; registro com 201 e tíquete nulo", async () => {
    const t = montarClientes();
    t.api.rota("POST", "/creditos/12345678", { status: 201, corpoRejeita: erroDeTempo() });
    const e = await falha(t.cliente.abrir());
    expect(e.tiquete).toBeUndefined();
    expect(e.message).toContain("corpo da resposta não pôde ser lido (tempo esgotado)");
    expect(e.message).toContain("contou no limite de 4 aberturas por dia");
    expect(t.linhasDoRegistro().filter((l) => l.tipo === "abertura")).toEqual([expect.objectContaining({ http: 201, tiquete: null })]);
  });

  it("abertura 2xx: não é JSON e JSON sem o campo têm mensagens distintas, ambas dizendo que contou no limite", async () => {
    const a = montarClientes();
    a.api.rota("POST", "/creditos/12345678", { status: 201, corpo: "<html>nada</html>" });
    const naoJson = await falha(a.cliente.abrir());
    expect(naoJson.message).toContain("não é um objeto JSON");
    expect(naoJson.message).toContain("contou no limite");
    expect(naoJson.message).not.toContain("<html>");

    const b = montarClientes();
    b.api.rota("POST", "/creditos/12345678", { status: 201, corpo: { outro: 1 } });
    const semCampo = await falha(b.cliente.abrir());
    expect(semCampo.message).toContain("não trouxe tiqueteSolicitacao");
    expect(semCampo.message).not.toContain("não é um objeto JSON");
    expect(semCampo.message).toContain("contou no limite");
  });

  it("situação e link de download: corpo ilegível vira erro com o tíquete e o comando de retomada", async () => {
    const t = montarClientes();
    t.api.rota("GET", "/situacao/", { status: 200, corpoRejeita: erroDeTempo() });
    const e = await falha(t.cliente.situacao("T-1"));
    expect(e.tiquete).toBe("T-1");
    expect(e.message).toContain("tempo esgotado");
    expect(e.message.endsWith("npm run consulta -- creditos --tiquete T-1")).toBe(true);

    t.api.rota("GET", "/download/", { status: 200, corpoRejeita: erroDeRede("x", "ECONNRESET") });
    const d = await falha(t.cliente.linkDownload("T-1"));
    expect(d.message).toContain("ECONNRESET");
    expect(d.message.endsWith("--tiquete T-1")).toBe(true);
  });

  it("arquivo: corpo que falha na leitura é erro com o tíquete, registra a falha (http null) e não devolve bytes", async () => {
    const t = montarClientes();
    t.api.rota("GET", "arquivo?assinatura", { status: 200, corpoRejeita: erroDeTempo() });
    const e = await falha(t.cliente.baixarArquivo(URL_ASSINADA, "T-1"));
    expect(e.tiquete).toBe("T-1");
    expect(e.message).toContain("interrompido");
    expect(e.message).toContain("tempo esgotado");
    expect(e.message).toContain("48 h");
    expect(t.linhasDoRegistro().filter((l) => l.tipo === "arquivo")).toEqual([expect.objectContaining({ http: null })]);
  });
});

describe("registro que falha depois da chamada feita (A, E, F)", () => {
  it("abertura aceita: tíquete e comando de retomada vão para a saída antes de gravar; falha de gravação vira aviso", async () => {
    const t = montarClientes();
    await t.token.obter();
    quebrarRegistro(t.pastaLocal);
    t.api.rota("POST", "/creditos/12345678", { status: 201, corpo: { tiqueteSolicitacao: "TIQ-9", tEASegundos: 60 } });
    await expect(t.cliente.abrir()).resolves.toEqual({ tiquete: "TIQ-9", teaSegundos: 60 });
    const texto = t.saida.texto();
    expect(texto).toContain("Tíquete recebido: TIQ-9. Para retomar: npm run consulta -- creditos --tiquete TIQ-9");
    expect(texto).toContain("Aviso: não foi possível gravar o registro");
    expect(texto.indexOf("Tíquete recebido")).toBeLessThan(texto.indexOf("Aviso: não foi possível gravar"));
  });

  it("situação com registro quebrado: segue normalmente", async () => {
    const t = montarClientes();
    await t.token.obter();
    quebrarRegistro(t.pastaLocal);
    t.api.rota("GET", "/situacao/", { status: 200, corpo: { situacao: "PENDENTE" } });
    await expect(t.cliente.situacao("T-1")).resolves.toEqual({ situacao: "PENDENTE" });
  });

  it("429 não é mascarado por registro ilegível", async () => {
    const t = montarClientes();
    await t.token.obter();
    writeFileSync(join(t.pastaLocal, "chamadas.jsonl"), "{lixo\n");
    t.api.rota("POST", "/creditos/12345678", { status: 429, corpo: { codigoErro: "LIMITE" } });
    const e = await falha(t.cliente.abrir());
    expect(e.http).toBe(429);
    expect(e.message).toContain("Limite excedido (HTTP 429)");
  });

  it("401 com cache do token impossível de apagar: a mensagem do 401 aparece e o aviso manda apagar à mão", async () => {
    const t = montarClientes();
    await t.token.obter();
    rmSync(join(t.pastaLocal, "token.json"), { force: true });
    mkdirSync(join(t.pastaLocal, "token.json"));
    t.api.rota("GET", "/situacao/", { status: 401, corpo: { codigoErro: "NAO_AUTORIZADO" } });
    const e = await falha(t.cliente.situacao("T-1"));
    expect(e.message).toContain("Token recusado");
    expect(t.saida.texto()).toMatch(/apague .*token\.json.* manualmente/i);
  });
});
