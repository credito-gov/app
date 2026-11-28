import { sql } from "kysely";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { hmacToken } from "../../src/autenticacao/tokens.js";
import { criarContexto, HORA, MIN, SEGREDO, SENHA_BOA, type Contexto } from "./ajudas.js";

const EMAIL = "pessoa@exemplo.com.br";
const NOVA = "uma senha nova e ficticia";
const MENSAGEM = "Se houver uma conta com esse e-mail, enviaremos um link para criar uma nova senha.";

let ctx: Contexto;
beforeEach(async () => {
  ctx = await criarContexto();
});
afterEach(async () => {
  await ctx.encerrar();
});

const pedir = (email: string, opcoes: { ip?: string } = {}) =>
  ctx.req("POST", "/api/recuperacao", { corpo: { email }, ...opcoes });
const confirmar = (token: string, senha: string) =>
  ctx.req("POST", "/api/recuperacao/confirmar", { corpo: { token, senha } });

function ultimoToken(): string {
  const msg = ctx.email.mensagens.at(-1)!;
  return /\/redefinir-senha#t=([A-Za-z0-9_-]+)/.exec(msg.texto)![1]!;
}
const hashDe = async (email: string) =>
  (await sql<{ hash_senha: string }>`select hash_senha from identidade where sujeito = ${email}`.execute(ctx.migracao)).rows[0]!.hash_senha;

describe("pedido de recuperação (CA-23)", () => {
  test("e-mail com e sem conta recebem o mesmo 202 e a mesma mensagem; o e-mail sai só no primeiro caso", async () => {
    await ctx.criarUsuario(EMAIL);
    const com = await pedir(EMAIL);
    const sem = await pedir("ninguem@exemplo.com.br");
    expect(com.status).toBe(202);
    expect(sem.status).toBe(202);
    expect(com.corpo).toEqual({ mensagem: MENSAGEM });
    expect(sem.corpo).toEqual(com.corpo);
    expect(ctx.email.mensagens).toHaveLength(1);
    expect(ctx.email.mensagens[0]!.para).toBe(EMAIL);
  });

  test("o e-mail traz o link no fragmento e a validade de 1 hora; o banco guarda só o HMAC", async () => {
    await ctx.criarUsuario(EMAIL);
    await pedir(" Pessoa@Exemplo.com.br ");
    const msg = ctx.email.mensagens[0]!;
    expect(msg.texto).toContain("http://localhost:5173/redefinir-senha#t=");
    expect(msg.texto).toContain("1 hora");
    const token = ultimoToken();
    const linhas = await sql<{ token_hmac: string; criada_em: Date; expira_em: Date }>`select token_hmac, criada_em, expira_em from recuperacao_senha`.execute(ctx.migracao);
    expect(linhas.rows).toHaveLength(1);
    expect(linhas.rows[0]!.token_hmac).toBe(hmacToken(SEGREDO, token));
    expect(linhas.rows[0]!.expira_em.getTime() - linhas.rows[0]!.criada_em.getTime()).toBe(HORA);
    expect(JSON.stringify(linhas.rows)).not.toContain(token);
  });

  test("entrada inválida dá 400 entrada_invalida", async () => {
    const r = await ctx.req("POST", "/api/recuperacao", { corpo: {} });
    expect(r.status).toBe(400);
    expect(r.corpo.erro).toBe("entrada_invalida");
  });

  test("sem o cabeçalho de proteção dá 403", async () => {
    const r = await ctx.req("POST", "/api/recuperacao", { corpo: { email: EMAIL }, semCabecalho: true });
    expect(r.status).toBe(403);
  });
});

describe("nova senha pelo link (CA-24)", () => {
  test("encerra as duas sessões abertas, marca o link como usado e a senha nova passa a valer", async () => {
    await ctx.criarUsuario(EMAIL);
    const s1 = (await ctx.login(EMAIL)).cookie!;
    const s2 = (await ctx.login(EMAIL)).cookie!;
    expect(s1).not.toBe(s2);
    expect((await ctx.req("GET", "/api/sessao", { cookie: s1 })).status).toBe(200);
    expect((await ctx.req("GET", "/api/sessao", { cookie: s2 })).status).toBe(200);
    const antes = await hashDe(EMAIL);

    await pedir(EMAIL);
    const r = await confirmar(ultimoToken(), NOVA);
    expect(r.status).toBe(204);

    for (const c of [s1, s2]) expect((await ctx.req("GET", "/api/sessao", { cookie: c })).status).toBe(401);
    const motivos = await sql<{ motivo_encerramento: string }>`select motivo_encerramento from sessao`.execute(ctx.migracao);
    expect(motivos.rows.map((m) => m.motivo_encerramento)).toEqual(["nova_senha", "nova_senha"]);
    const usada = await sql<{ usada_em: Date | null }>`select usada_em from recuperacao_senha`.execute(ctx.migracao);
    expect(usada.rows[0]!.usada_em).toBeInstanceOf(Date);

    expect(await hashDe(EMAIL)).not.toBe(antes);
    expect((await hashDe(EMAIL)).startsWith("$argon2id$")).toBe(true);
    expect((await ctx.login(EMAIL, NOVA)).status).toBe(200);
    expect((await ctx.login(EMAIL, SENHA_BOA)).status).toBe(401);
  });

  test("senha fora da regra dá 400 senha_invalida e o link continua valendo", async () => {
    await ctx.criarUsuario(EMAIL);
    await pedir(EMAIL);
    const token = ultimoToken();
    const antes = await hashDe(EMAIL);
    const curta = "a1b2c3d4e5f";
    const r = await confirmar(token, curta);
    expect(r.status).toBe(400);
    expect(r.corpo.erro).toBe("senha_invalida");
    expect(r.corpo.regra).toBe("tamanho_minimo");
    expect(r.corpo.mensagem.length).toBeGreaterThan(0);
    expect(r.texto).not.toContain(curta);
    expect(await hashDe(EMAIL)).toBe(antes);
    expect((await confirmar(token, NOVA)).status).toBe(204);
  });

  test("1 h menos 1 s depois ainda vale", async () => {
    await ctx.criarUsuario(EMAIL);
    await pedir(EMAIL);
    ctx.relogio.avancar(HORA - 1000);
    expect((await confirmar(ultimoToken(), NOVA)).status).toBe(204);
  });
});

describe("link que não vale (CA-25)", () => {
  const MENSAGEM_LINK = "Este link não vale mais. Peça um novo.";

  async function recusado(token: string) {
    const antes = await hashDe(EMAIL);
    const r = await confirmar(token, NOVA);
    expect(r.status).toBe(410);
    expect(r.corpo).toEqual({ erro: "link_invalido", mensagem: MENSAGEM_LINK });
    expect(await hashDe(EMAIL)).toBe(antes);
  }

  test("vencido (1 h e 1 s)", async () => {
    await ctx.criarUsuario(EMAIL);
    await pedir(EMAIL);
    ctx.relogio.avancar(HORA + 1000);
    await recusado(ultimoToken());
  });

  test("já usado", async () => {
    await ctx.criarUsuario(EMAIL);
    await pedir(EMAIL);
    const token = ultimoToken();
    expect((await confirmar(token, NOVA)).status).toBe(204);
    const antes = await hashDe(EMAIL);
    const r = await confirmar(token, "outra senha nova ficticia");
    expect(r.status).toBe(410);
    expect(await hashDe(EMAIL)).toBe(antes);
  });

  test("alterado", async () => {
    await ctx.criarUsuario(EMAIL);
    await pedir(EMAIL);
    const t = ultimoToken();
    await recusado((t[0] === "a" ? "b" : "a") + t.slice(1));
  });

  test("substituído por um pedido novo", async () => {
    await ctx.criarUsuario(EMAIL);
    await pedir(EMAIL);
    const antigo = ultimoToken();
    await pedir(EMAIL);
    const novo = ultimoToken();
    expect(novo).not.toBe(antigo);
    await recusado(antigo);
    expect((await confirmar(novo, NOVA)).status).toBe(204);
  });

  test("o token não é uma sessão: confirmar não abre sessão", async () => {
    await ctx.criarUsuario(EMAIL);
    await pedir(EMAIL);
    const r = await confirmar(ultimoToken(), NOVA);
    expect(r.cookie).toBeNull();
  });
});

describe("limite dos pedidos (CA-26)", () => {
  test("o 6º pedido em 15 minutos dá 429, para e-mail com conta", async () => {
    await ctx.criarUsuario(EMAIL);
    for (let i = 0; i < 5; i++) expect((await pedir(EMAIL)).status).toBe(202);
    const r = await pedir(EMAIL);
    expect(r.status).toBe(429);
    expect(r.corpo).toEqual({ erro: "muitas_tentativas", mensagem: "Muitas tentativas. Tente de novo em alguns minutos." });
    expect(ctx.email.mensagens).toHaveLength(5);
  });

  test("a resposta é igual para e-mail sem conta", async () => {
    for (let i = 0; i < 5; i++) expect((await pedir("ninguem@exemplo.com.br")).status).toBe(202);
    const r = await pedir("ninguem@exemplo.com.br");
    expect(r.status).toBe(429);
    expect(r.corpo.erro).toBe("muitas_tentativas");
  });

  test("passados 15 minutos, volta a aceitar", async () => {
    for (let i = 0; i < 5; i++) await pedir("ninguem@exemplo.com.br");
    expect((await pedir("ninguem@exemplo.com.br")).status).toBe(429);
    ctx.relogio.avancar(15 * MIN);
    expect((await pedir("ninguem@exemplo.com.br")).status).toBe(202);
  });

  test("a contagem por origem bloqueia e-mails diferentes do mesmo endereço", async () => {
    for (let i = 0; i < 5; i++) await pedir(`pessoa${i}@exemplo.com.br`);
    expect((await pedir("outra@exemplo.com.br")).status).toBe(429);
    expect((await pedir("outra@exemplo.com.br", { ip: "192.0.2.99" })).status).toBe(202);
  });
});
