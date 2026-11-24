import { utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { lerConfig } from "../src/config.js";
import { criarRedator } from "../src/redacao.js";
import { criarRegistro } from "../src/registro.js";
import { criarClienteToken } from "../src/token.js";
import { criarApiSimulada } from "./apoio/apiSimulada.js";
import { TOKEN, envFicticio } from "./apoio/ficticios.js";
import { pastaTemporaria } from "./apoio/pasta.js";
import { criarRelogioFalso } from "./apoio/relogio.js";
import { criarSaidaCapturada } from "./apoio/saida.js";

const RESPOSTA_OK = { status: 200, corpo: { access_token: TOKEN, token_type: "Bearer", expires_in: 3600 } };
const ILEGIVEIS = "{lixo um\n{lixo dois\n";

function montar(modificadoEm: Date, agora: Date) {
  const pastaLocal = pastaTemporaria();
  const arquivo = join(pastaLocal, "chamadas.jsonl");
  writeFileSync(arquivo, ILEGIVEIS);
  utimesSync(arquivo, modificadoEm, modificadoEm);
  const relogio = criarRelogioFalso(agora);
  const registro = criarRegistro({ pastaLocal, relogio });
  const api = criarApiSimulada();
  const saida = criarSaidaCapturada();
  const cliente = criarClienteToken({
    config: lerConfig(envFicticio({})),
    fetch: api.fetch,
    relogio,
    registro,
    pastaLocal,
    saida,
    redator: criarRedator(),
    servico: "creditos",
  });
  return { relogio, registro, api, cliente };
}

describe("linha ilegível não bloqueia para sempre", () => {
  it("duas linhas ilegíveis e arquivo modificado há mais de uma hora: o token é pedido", async () => {
    const t = montar(new Date(2026, 10, 23, 8, 0, 0), new Date(2026, 10, 23, 10, 0, 0));
    t.api.rota("POST", "/token", RESPOSTA_OK);
    await expect(t.cliente.obter()).resolves.toBe(TOKEN);
    expect(t.api.pedidos).toHaveLength(1);
  });

  it("arquivo modificado agora: recusa, cita o registro ilegível e diz como corrigir", async () => {
    const t = montar(new Date(2026, 10, 23, 10, 0, 0), new Date(2026, 10, 23, 10, 0, 0));
    t.api.rota("POST", "/token", RESPOSTA_OK);
    const e = await t.cliente.obter().then(
      () => undefined,
      (x: unknown) => x as Error,
    );
    expect(e?.message).toContain("limite de 2 tokens por hora");
    expect(e?.message).toContain("ilegível");
    expect(e?.message).toContain("linha 1");
    expect(e?.message).toContain("linha 2");
    expect(e?.message).toMatch(/corrija ou apague/i);
    expect(e?.message).toContain(".local/chamadas.jsonl");
    expect(t.api.pedidos).toHaveLength(0);
  });

  it("execução seguinte, com o relógio adiante, não renova o bloqueio", async () => {
    const t = montar(new Date(2026, 10, 23, 10, 0, 0), new Date(2026, 10, 23, 10, 0, 0));
    t.api.rota("POST", "/token", RESPOSTA_OK);
    await expect(t.cliente.obter()).rejects.toThrow();
    t.relogio.avancar(61 * 60_000);
    await expect(t.cliente.obter()).resolves.toBe(TOKEN);
  });

  it("aberturas do dia não incluem linha ilegível de arquivo modificado em dia anterior", () => {
    const antes = montar(new Date(2026, 10, 22, 15, 0, 0), new Date(2026, 10, 23, 10, 0, 0));
    expect(antes.registro.contarAberturas("creditos", new Date(2026, 10, 23, 10, 0, 0))).toEqual({ total: 0, aceitas: 0 });
    const hoje = montar(new Date(2026, 10, 23, 9, 0, 0), new Date(2026, 10, 23, 10, 0, 0));
    expect(hoje.registro.contarAberturas("creditos", new Date(2026, 10, 23, 10, 0, 0))).toEqual({ total: 2, aceitas: 0 });
  });

  it("o aviso da linha ilegível diz como sair", () => {
    const pastaLocal = pastaTemporaria();
    writeFileSync(join(pastaLocal, "chamadas.jsonl"), "{lixo\n");
    const avisos: string[] = [];
    const r = criarRegistro({ pastaLocal, relogio: criarRelogioFalso(), avisar: (x) => avisos.push(x) });
    r.contarAberturas("creditos", new Date());
    expect(avisos[0]).toMatch(/corrija ou apague a linha 1 de \.local\/chamadas\.jsonl/i);
  });
});
