import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { erroDeTempo } from "./apoio/apiSimulada.js";
import { falha, montarClientes } from "./apoio/clientes.js";
import { TOKEN } from "./apoio/ficticios.js";

describe("cache e corpo do token (F, C)", () => {
  it("falha ao gravar o cache: o token obtido é usado mesmo assim, vira aviso e não é pedido de novo", async () => {
    const t = montarClientes();
    mkdirSync(join(t.pastaLocal, "token.json")); // impossível gravar o arquivo
    await expect(t.token.obter()).resolves.toBe(TOKEN);
    expect(t.saida.texto()).toMatch(/Aviso: .*token\.json/);
    await expect(t.token.obter()).resolves.toBe(TOKEN);
    expect(t.api.contar("POST", "/token")).toBe(1);
  });

  it("cache existente mas ilegível gera aviso e um novo pedido, sem repetir o conteúdo", async () => {
    const t = montarClientes();
    writeFileSync(join(t.pastaLocal, "token.json"), "{isto nao e json");
    await expect(t.token.obter()).resolves.toBe(TOKEN);
    expect(t.saida.texto()).toMatch(/Aviso: .*token\.json.*ilegível/);
    expect(t.saida.texto()).not.toContain("isto nao e json");
  });

  it("corpo 2xx que não pode ser lido: erro com a causa, avisando que o pedido contou no limite de 2 por hora", async () => {
    const t = montarClientes("creditos", { semTokenPadrao: true });
    t.api.rota("POST", "/token", { status: 200, corpoRejeita: erroDeTempo() });
    const e = await falha(t.token.obter());
    expect(e.message).toContain("corpo da resposta não pôde ser lido (tempo esgotado)");
    expect(e.message).toContain("contou no limite de 2 tokens por hora");
    expect(t.registro.pedidosDeTokenDesde(new Date(0))).toHaveLength(1);
  });

  it("resposta 2xx que não é JSON e JSON sem access_token têm mensagens distintas", async () => {
    const a = montarClientes("creditos", { semTokenPadrao: true });
    a.api.rota("POST", "/token", { status: 200, corpo: "<html>x</html>" });
    const naoJson = await falha(a.token.obter());
    expect(naoJson.message).toContain("não é um objeto JSON");
    expect(naoJson.message).toContain("contou no limite");

    const b = montarClientes("creditos", { semTokenPadrao: true });
    b.api.rota("POST", "/token", { status: 200, corpo: { token_type: "Bearer" } });
    const semCampo = await falha(b.token.obter());
    expect(semCampo.message).toContain("não trouxe access_token");
    expect(semCampo.message).not.toContain("não é um objeto JSON");
    expect(semCampo.message).toContain("contou no limite");
  });
});
