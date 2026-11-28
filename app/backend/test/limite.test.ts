import type { Kysely } from "kysely";
import { sql } from "kysely";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { chaveEmail, chaveOrigem, criarLimite, type Limite } from "../src/autenticacao/limite.js";
import { abrirKysely } from "../src/banco/conexao.js";
import type { Esquema } from "../src/banco/esquema.js";
import { criarBanco } from "../src/banco/transacao.js";
import { abrirComoMigracao, limparTabelas } from "./banco/limpar.js";
import { URL_APP } from "./banco/urls.js";

const SEGREDO = "segredo-ficticio-do-limite-com-mais-de-32-bytes";
const MIN = 60_000;
const EMAIL = "pessoa@exemplo.com.br";

let migracao: Kysely<Esquema>;
let app: Kysely<Esquema>;
let agora: Date;
let limite: Limite;

beforeAll(() => {
  migracao = abrirComoMigracao();
  app = abrirKysely(URL_APP);
});
afterAll(async () => {
  await app.destroy();
  await migracao.destroy();
});
beforeEach(async () => {
  await limparTabelas(migracao);
  agora = new Date("2026-12-01T12:00:00Z");
  limite = criarLimite({ banco: criarBanco(app), segredo: SEGREDO, relogio: () => agora });
});

const avancar = (ms: number) => {
  agora = new Date(agora.getTime() + ms);
};

/** n falhas na chave do e-mail, cada uma de uma origem diferente (isola a chave do e-mail). */
async function falhasDoEmail(n: number, email = EMAIL, tipo: "login" | "recuperacao" = "login") {
  for (let i = 0; i < n; i++) {
    await limite.registrarFalha(tipo, { email, origem: `192.0.2.${100 + i}` });
  }
}

describe("limite de login (CA-17)", () => {
  test("5 falhas bloqueiam e a 6ª tentativa já dá bloqueado, antes de verificar a senha", async () => {
    await falhasDoEmail(4);
    expect(await limite.estaBloqueado("login", { email: EMAIL, origem: "192.0.2.1" })).toBe(false);
    await falhasDoEmail(1);
    expect(await limite.estaBloqueado("login", { email: EMAIL, origem: "192.0.2.1" })).toBe(true);
  });

  test("15 minutos depois do bloqueio, libera", async () => {
    await falhasDoEmail(5);
    avancar(14 * MIN + 59_000);
    expect(await limite.estaBloqueado("login", { email: EMAIL, origem: "192.0.2.1" })).toBe(true);
    avancar(1_000);
    expect(await limite.estaBloqueado("login", { email: EMAIL, origem: "192.0.2.1" })).toBe(false);
  });

  test("tentativas durante o bloqueio não o prolongam", async () => {
    await falhasDoEmail(5);
    avancar(10 * MIN);
    await falhasDoEmail(3);
    avancar(5 * MIN);
    expect(await limite.estaBloqueado("login", { email: EMAIL, origem: "192.0.2.1" })).toBe(false);
  });

  test("depois de liberar, a contagem recomeça do zero", async () => {
    await falhasDoEmail(5);
    avancar(15 * MIN);
    await falhasDoEmail(4);
    expect(await limite.estaBloqueado("login", { email: EMAIL, origem: "192.0.2.1" })).toBe(false);
    await falhasDoEmail(1);
    expect(await limite.estaBloqueado("login", { email: EMAIL, origem: "192.0.2.1" })).toBe(true);
  });

  test("falhas fora da janela de 15 minutos não contam", async () => {
    await falhasDoEmail(4);
    avancar(15 * MIN);
    await falhasDoEmail(1);
    expect(await limite.estaBloqueado("login", { email: EMAIL, origem: "192.0.2.1" })).toBe(false);
  });

  test("a origem bloqueia e-mails diferentes vindos do mesmo endereço", async () => {
    for (let i = 0; i < 5; i++) {
      await limite.registrarFalha("login", { email: `pessoa${i}@exemplo.com.br`, origem: "192.0.2.50" });
    }
    expect(await limite.estaBloqueado("login", { email: "outra@exemplo.com.br", origem: "192.0.2.50" })).toBe(true);
    expect(await limite.estaBloqueado("login", { email: "outra@exemplo.com.br", origem: "192.0.2.51" })).toBe(false);
  });

  test("o bloqueio do e-mail vale para qualquer origem", async () => {
    await falhasDoEmail(5);
    expect(await limite.estaBloqueado("login", { email: EMAIL, origem: "192.0.2.200" })).toBe(true);
  });

  test("o sucesso apaga as falhas da chave do e-mail", async () => {
    await falhasDoEmail(4);
    await limite.registrarSucesso("login", { email: EMAIL });
    await falhasDoEmail(4);
    expect(await limite.estaBloqueado("login", { email: EMAIL, origem: "192.0.2.1" })).toBe(false);
  });

  test("a chave gravada é o HMAC, não o e-mail nem o endereço", async () => {
    await limite.registrarFalha("login", { email: EMAIL, origem: "192.0.2.77" });
    for (let i = 0; i < 5; i++) await limite.registrarFalha("login", { email: EMAIL, origem: "192.0.2.77" });
    const falhas = await sql<{ chave_hmac: string }>`select chave_hmac from falha_acesso`.execute(app);
    const bloqueios = await sql<{ chave_hmac: string }>`select chave_hmac from bloqueio_acesso`.execute(app);
    const chaves = [...falhas.rows, ...bloqueios.rows].map((r) => r.chave_hmac);
    expect(chaves.length).toBeGreaterThan(0);
    for (const c of chaves) {
      expect(c).not.toContain("exemplo");
      expect(c).not.toContain("192.0.2.77");
    }
    expect(chaves).toContain(chaveEmail(SEGREDO, EMAIL));
    expect(chaves).toContain(chaveOrigem(SEGREDO, "192.0.2.77"));
  });

  test("os tipos login e recuperação contam em separado", async () => {
    await falhasDoEmail(5, EMAIL, "recuperacao");
    expect(await limite.estaBloqueado("login", { email: EMAIL, origem: "192.0.2.1" })).toBe(false);
    expect(await limite.estaBloqueado("recuperacao", { email: EMAIL, origem: "192.0.2.1" })).toBe(true);
  });

  test("as linhas com mais de 24 h somem na gravação seguinte", async () => {
    await falhasDoEmail(2);
    avancar(24 * 60 * MIN + 1_000);
    await limite.registrarFalha("login", { email: "outra@exemplo.com.br", origem: "192.0.2.9" });
    const r = await sql<{ n: string }>`select count(*)::text as n from falha_acesso`.execute(app);
    // só as duas chaves (e-mail e origem) da falha nova
    expect(r.rows[0]?.n).toBe("2");
  });
});

describe("limite de recuperação (CA-26)", () => {
  test("5 pedidos em 15 minutos bloqueiam o 6º, exista ou não a conta", async () => {
    for (let i = 0; i < 5; i++) {
      expect(await limite.estaBloqueado("recuperacao", { email: EMAIL, origem: "192.0.2.5" })).toBe(false);
      await limite.registrarFalha("recuperacao", { email: EMAIL, origem: "192.0.2.5" });
    }
    expect(await limite.estaBloqueado("recuperacao", { email: EMAIL, origem: "192.0.2.5" })).toBe(true);
    // mesmo resultado para um e-mail que não existe, desde que a origem seja a mesma
    expect(await limite.estaBloqueado("recuperacao", { email: "naoexiste@exemplo.com.br", origem: "192.0.2.5" })).toBe(true);
  });
});
