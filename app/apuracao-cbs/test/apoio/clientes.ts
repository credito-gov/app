import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect } from "vitest";
import { criarClienteApi } from "../../src/api.js";
import { lerConfig } from "../../src/config.js";
import { ErroApi } from "../../src/erros.js";
import { criarRedator } from "../../src/redacao.js";
import { criarRegistro } from "../../src/registro.js";
import { buscarServico, type NomeServico } from "../../src/servicos.js";
import { criarClienteToken } from "../../src/token.js";
import { criarApiSimulada } from "./apiSimulada.js";
import { TOKEN, envFicticio } from "./ficticios.js";
import { pastaTemporaria } from "./pasta.js";
import { criarRelogioFalso } from "./relogio.js";
import { criarSaidaCapturada } from "./saida.js";

export const RESPOSTA_TOKEN_OK = { status: 200, corpo: { access_token: TOKEN, token_type: "Bearer", expires_in: 3600 } };

/** Clientes de token e de API montados com registro que avisa na mesma saída capturada. */
export function montarClientes(nome: NomeServico = "creditos", opcoes: { semTokenPadrao?: boolean } = {}) {
  const config = lerConfig(envFicticio());
  const pastaLocal = pastaTemporaria();
  const relogio = criarRelogioFalso();
  const api = criarApiSimulada();
  if (!opcoes.semTokenPadrao) api.rota("POST", "/token", RESPOSTA_TOKEN_OK);
  const saida = criarSaidaCapturada();
  const registro = criarRegistro({ pastaLocal, relogio, avisar: (t) => saida.escrever(t) });
  const redator = criarRedator();
  const token = criarClienteToken({ config, fetch: api.fetch, relogio, registro, pastaLocal, saida, redator, servico: nome });
  const servico = buscarServico(nome);
  if (!servico) throw new Error("serviço de teste desconhecido");
  const cliente = criarClienteApi({ config, fetch: api.fetch, token, registro, relogio, redator, servico, saida });
  const linhasDoRegistro = () =>
    existsSync(join(pastaLocal, "chamadas.jsonl"))
      ? readFileSync(join(pastaLocal, "chamadas.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Record<string, unknown>)
      : [];
  return { config, pastaLocal, relogio, api, registro, saida, redator, token, cliente, linhasDoRegistro };
}

export async function falha(promessa: Promise<unknown>): Promise<ErroApi> {
  try {
    await promessa;
  } catch (e) {
    expect(e).toBeInstanceOf(ErroApi);
    return e as ErroApi;
  }
  throw new Error("era esperado um ErroApi");
}
