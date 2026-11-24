import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { lerConfig } from "../src/config.js";
import { ErroApi } from "../src/erros.js";
import { criarRedator } from "../src/redacao.js";
import { criarRegistro } from "../src/registro.js";
import { criarClienteToken } from "../src/token.js";
import { criarApiSimulada, erroDeRede } from "./apoio/apiSimulada.js";
import { ID, SEGREDO, TOKEN, URL_TOKEN, envFicticio } from "./apoio/ficticios.js";
import { pastaTemporaria } from "./apoio/pasta.js";
import { criarRelogioFalso } from "./apoio/relogio.js";
import { criarSaidaCapturada } from "./apoio/saida.js";

const RESPOSTA_OK = { status: 200, corpo: { access_token: TOKEN, token_type: "Bearer", expires_in: 3600 } };

function montar(env: Record<string, string | undefined> = {}, opcoes: { pastaLocal?: string; relogio?: ReturnType<typeof criarRelogioFalso> } = {}) {
  const config = lerConfig(envFicticio(env));
  const pastaLocal = opcoes.pastaLocal ?? pastaTemporaria();
  const relogio = opcoes.relogio ?? criarRelogioFalso();
  const api = criarApiSimulada();
  const registro = criarRegistro({ pastaLocal, relogio });
  const saida = criarSaidaCapturada();
  const redator = criarRedator();
  const cliente = criarClienteToken({ config, fetch: api.fetch, relogio, registro, pastaLocal, saida, redator, servico: "creditos" });
  return { config, pastaLocal, relogio, api, registro, saida, redator, cliente };
}

async function falha(promessa: Promise<unknown>): Promise<ErroApi> {
  try {
    await promessa;
  } catch (e) {
    expect(e).toBeInstanceOf(ErroApi);
    return e as ErroApi;
  }
  throw new Error("era esperado um ErroApi");
}

describe("pedido de token", () => {
  it("basic: Authorization com id e segredo codificados e corpo só com grant_type", async () => {
    const t = montar({ APURACAO_TOKEN_CREDENCIAIS: "basic" });
    t.api.rota("POST", "/token", RESPOSTA_OK);
    await expect(t.cliente.obter()).resolves.toBe(TOKEN);
    const [pedido] = t.api.pedidos;
    expect(pedido.metodo).toBe("POST");
    expect(pedido.url).toBe(URL_TOKEN);
    const basic = Buffer.from(`${encodeURIComponent(ID)}:${encodeURIComponent(SEGREDO)}`).toString("base64");
    expect(pedido.cabecalhos).toEqual({
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
      authorization: `Basic ${basic}`,
    });
    expect(pedido.corpo).toBe("grant_type=client_credentials");
    expect(pedido.temSinal).toBe(true);
  });

  it("basic: codifica caracteres especiais antes do base64 (RFC 6749, 2.3.1)", async () => {
    const t = montar({ APURACAO_CLIENT_ID: "id com:espaco", APURACAO_CLIENT_SECRET: "s+e/c=r&" });
    t.api.rota("POST", "/token", RESPOSTA_OK);
    await t.cliente.obter();
    const esperado = Buffer.from("id+com%3Aespaco:s%2Be%2Fc%3Dr%26").toString("base64");
    expect(t.api.pedidos[0].cabecalhos.authorization).toBe(`Basic ${esperado}`);
  });

  it("corpo: id e segredo no corpo e nenhum Authorization", async () => {
    const t = montar({ APURACAO_TOKEN_CREDENCIAIS: "corpo" });
    t.api.rota("POST", "/token", RESPOSTA_OK);
    await t.cliente.obter();
    const [pedido] = t.api.pedidos;
    expect(pedido.cabecalhos).toEqual({
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
    });
    expect(pedido.corpo).toBe(`grant_type=client_credentials&client_id=${ID}&client_secret=${SEGREDO}`);
  });

  it("scope só vai se estiver configurado", async () => {
    const sem = montar({ APURACAO_TOKEN_CREDENCIAIS: "corpo" });
    sem.api.rota("POST", "/token", RESPOSTA_OK);
    await sem.cliente.obter();
    expect(sem.api.pedidos[0].corpo).not.toContain("scope");

    const com = montar({ APURACAO_TOKEN_CREDENCIAIS: "basic", APURACAO_TOKEN_SCOPE: "escopo-ficticio" });
    com.api.rota("POST", "/token", RESPOSTA_OK);
    await com.cliente.obter();
    expect(com.api.pedidos[0].corpo).toBe("grant_type=client_credentials&scope=escopo-ficticio");
  });

  it("access_token ausente é erro", async () => {
    const t = montar();
    t.api.rota("POST", "/token", { status: 200, corpo: { token_type: "Bearer", expires_in: 3600 } });
    const e = await falha(t.cliente.obter());
    expect(e.tipoChamada).toBe("token");
    expect(e.message).toContain("access_token");
  });

  it("mostra 'válido por N s' e nunca o token", async () => {
    const t = montar();
    t.api.rota("POST", "/token", { status: 200, corpo: { access_token: TOKEN, expires_in: 1800 } });
    await t.cliente.obter();
    expect(t.saida.texto()).toContain("token obtido, válido por 1800 s");
    expect(t.saida.texto()).not.toContain(TOKEN);
  });

  it("sem expires_in, assume 3600 e avisa", async () => {
    const t = montar();
    t.api.rota("POST", "/token", { status: 200, corpo: { access_token: TOKEN } });
    await t.cliente.obter();
    expect(t.saida.texto()).toContain("expires_in ausente");
    expect(t.saida.texto()).toContain("3600");
    const cache = JSON.parse(readFileSync(join(t.pastaLocal, "token.json"), "utf8")) as { obtidoEm: string; expiraEm: string };
    expect(new Date(cache.expiraEm).getTime() - new Date(cache.obtidoEm).getTime()).toBe(3600_000);
  });

  it("registra o pedido sem token nem credencial", async () => {
    const t = montar();
    t.api.rota("POST", "/token", RESPOSTA_OK);
    await t.cliente.obter();
    const bruto = readFileSync(join(t.pastaLocal, "chamadas.jsonl"), "utf8");
    expect(JSON.parse(bruto)).toMatchObject({ servico: "creditos", tipo: "token", http: 200, tiquete: null });
    for (const proibido of [TOKEN, ID, SEGREDO]) expect(bruto).not.toContain(proibido);
  });

  it("entrega o token ao redator", async () => {
    const t = montar();
    t.api.rota("POST", "/token", RESPOSTA_OK);
    await t.cliente.obter();
    expect(t.redator.redigir(`x ${TOKEN} y`)).toBe("x *** y");
  });
});

describe("cache do token", () => {
  it("guarda o cache com a chave da credencial, em .local/token.json", async () => {
    const t = montar();
    t.api.rota("POST", "/token", RESPOSTA_OK);
    await t.cliente.obter();
    const cache = JSON.parse(readFileSync(join(t.pastaLocal, "token.json"), "utf8")) as Record<string, string>;
    expect(Object.keys(cache).sort()).toEqual(["accessToken", "chaveCredencial", "expiraEm", "obtidoEm"]);
    expect(cache.chaveCredencial).toBe(createHash("sha256").update(`${URL_TOKEN}\n${ID}`).digest("hex"));
    expect(cache.accessToken).toBe(TOKEN);
  });

  it("segunda execução (novo cliente, mesma pasta) reutiliza o cache sem chamar", async () => {
    const primeira = montar();
    primeira.api.rota("POST", "/token", RESPOSTA_OK);
    await primeira.cliente.obter();

    const segunda = montar({}, { pastaLocal: primeira.pastaLocal, relogio: primeira.relogio });
    segunda.relogio.avancar(10 * 60_000);
    await expect(segunda.cliente.obter()).resolves.toBe(TOKEN);
    expect(segunda.api.pedidos).toHaveLength(0);
    expect(segunda.redator.redigir(TOKEN)).toBe("***");
  });

  it("na mesma execução, obter duas vezes pede uma vez só", async () => {
    const t = montar();
    t.api.rota("POST", "/token", RESPOSTA_OK);
    await t.cliente.obter();
    await t.cliente.obter();
    expect(t.api.pedidos).toHaveLength(1);
  });

  it("cache a menos de 120 s do fim pede um novo", async () => {
    const t = montar();
    t.api.rota("POST", "/token", RESPOSTA_OK, { status: 200, corpo: { access_token: "token-ficticio-novo", expires_in: 3600 } });
    await t.cliente.obter();
    t.relogio.avancar(3600_000 - 119_000);
    await expect(t.cliente.obter()).resolves.toBe("token-ficticio-novo");
    expect(t.api.pedidos).toHaveLength(2);
  });

  it("cache com mais de 120 s para vencer é reaproveitado", async () => {
    const t = montar();
    t.api.rota("POST", "/token", RESPOSTA_OK);
    await t.cliente.obter();
    t.relogio.avancar(3600_000 - 121_000);
    await t.cliente.obter();
    expect(t.api.pedidos).toHaveLength(1);
  });

  it("cache de outra credencial é ignorado", async () => {
    const a = montar();
    a.api.rota("POST", "/token", RESPOSTA_OK);
    await a.cliente.obter();
    const b = montar({ APURACAO_CLIENT_ID: "outro-id-ficticio" }, { pastaLocal: a.pastaLocal, relogio: a.relogio });
    b.api.rota("POST", "/token", RESPOSTA_OK);
    await b.cliente.obter();
    expect(b.api.pedidos).toHaveLength(1);
  });

  it("cache de outro endereço de token é ignorado", async () => {
    const a = montar();
    a.api.rota("POST", "/token", RESPOSTA_OK);
    await a.cliente.obter();
    const b = montar({ APURACAO_URL_TOKEN: "https://outro.exemplo.invalid/token" }, { pastaLocal: a.pastaLocal, relogio: a.relogio });
    b.api.rota("POST", "/token", RESPOSTA_OK);
    await b.cliente.obter();
    expect(b.api.pedidos).toHaveLength(1);
  });

  it("descartar() apaga o cache e a próxima chamada pede outro token", async () => {
    const t = montar();
    t.api.rota("POST", "/token", RESPOSTA_OK, RESPOSTA_OK);
    await t.cliente.obter();
    expect(existsSync(join(t.pastaLocal, "token.json"))).toBe(true);
    t.cliente.descartar();
    expect(existsSync(join(t.pastaLocal, "token.json"))).toBe(false);
    await t.cliente.obter();
    expect(t.api.pedidos).toHaveLength(2);
  });

  it("descartar() sem cache não falha", () => {
    const t = montar();
    expect(() => t.cliente.descartar()).not.toThrow();
  });
});

describe("limite de 2 tokens por hora", () => {
  it("com 2 pedidos na última hora, recusa sem chamar e diz a partir de que horas pode pedir", async () => {
    const relogio = criarRelogioFalso(new Date(2026, 10, 23, 9, 20, 0));
    const t = montar({}, { relogio });
    t.registro.registrar({ servico: "creditos", tipo: "token", http: 401, tiquete: null });
    relogio.definir(new Date(2026, 10, 23, 9, 40, 0));
    t.registro.registrar({ servico: "creditos", tipo: "token", http: 200, tiquete: null });
    relogio.definir(new Date(2026, 10, 23, 10, 0, 0));

    const e = await falha(t.cliente.obter());
    expect(t.api.pedidos).toHaveLength(0);
    expect(e.message).toContain("limite de 2 tokens por hora");
    expect(e.message).toContain("a partir de 10:20");
    expect(e.codigoSaida).toBe(1);
  });

  it("a renovação durante uma espera longa respeita o limite", async () => {
    const relogio = criarRelogioFalso(new Date(2026, 10, 23, 10, 30, 0));
    const t = montar({}, { relogio });
    const curto = (n: string) => ({ status: 200, corpo: { access_token: n, expires_in: 600 } });
    t.api.rota("POST", "/token", curto("token-ficticio-a"), curto("token-ficticio-b"), curto("token-ficticio-c"));

    await expect(t.cliente.obter()).resolves.toBe("token-ficticio-a");
    relogio.avancar(9 * 60_000); // 10:39, faltam 60 s: renova
    await expect(t.cliente.obter()).resolves.toBe("token-ficticio-b");
    relogio.avancar(9 * 60_000); // 10:48, renovaria, mas já houve 2 pedidos na hora
    const e = await falha(t.cliente.obter());
    expect(t.api.pedidos).toHaveLength(2);
    expect(e.message).toContain("a partir de 11:30");
  });

  it("pedidos com mais de uma hora não contam", async () => {
    const relogio = criarRelogioFalso(new Date(2026, 10, 23, 8, 0, 0));
    const t = montar({}, { relogio });
    t.registro.registrar({ servico: "creditos", tipo: "token", http: 200, tiquete: null });
    t.registro.registrar({ servico: "creditos", tipo: "token", http: 200, tiquete: null });
    relogio.definir(new Date(2026, 10, 23, 9, 30, 0));
    t.api.rota("POST", "/token", RESPOSTA_OK);
    await expect(t.cliente.obter()).resolves.toBe(TOKEN);
  });
});

describe("erros no pedido de token", () => {
  for (const http of [400, 401]) {
    it(`${http}: credencial recusada, sem nova tentativa e com os pedidos que restam`, async () => {
      const t = montar();
      t.api.rota("POST", "/token", { status: http, corpo: { error: "invalid_client" } }, RESPOSTA_OK);
      const e = await falha(t.cliente.obter());
      expect(e.http).toBe(http);
      expect(e.message).toContain("Credencial recusada");
      expect(e.message).toContain("Restam 1 pedido(s) de token nesta hora pelo controle local");
      expect(t.api.pedidos).toHaveLength(1);
      expect(existsSync(join(t.pastaLocal, "token.json"))).toBe(false);
      expect(JSON.parse(readFileSync(join(t.pastaLocal, "chamadas.jsonl"), "utf8"))).toMatchObject({ tipo: "token", http });
    });
  }

  it("o corpo da resposta de erro não aparece na mensagem", async () => {
    const t = montar();
    t.api.rota("POST", "/token", { status: 401, corpo: "dado-qualquer-do-gateway" });
    const e = await falha(t.cliente.obter());
    expect(e.message).not.toContain("dado-qualquer-do-gateway");
  });

  it("erro de rede: sem resposta, http null no registro, nada repetido", async () => {
    const t = montar();
    t.api.rota("POST", "/token", { erro: erroDeRede() }, RESPOSTA_OK);
    const e = await falha(t.cliente.obter());
    expect(e.message).toContain("Sem resposta");
    expect(t.api.pedidos).toHaveLength(1);
    expect(JSON.parse(readFileSync(join(t.pastaLocal, "chamadas.jsonl"), "utf8"))).toMatchObject({ tipo: "token", http: null });
  });

  it("outros códigos (500) também encerram sem nova tentativa", async () => {
    const t = montar();
    t.api.rota("POST", "/token", { status: 500 }, RESPOSTA_OK);
    const e = await falha(t.cliente.obter());
    expect(e.http).toBe(500);
    expect(t.api.pedidos).toHaveLength(1);
  });
});
