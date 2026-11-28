import { sql } from "kysely";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { hmacToken } from "../../src/autenticacao/tokens.js";
import { COOKIE, criarContexto, HORA, MIN, SEGREDO, SENHA_BOA, type Contexto } from "./ajudas.js";

let ctx: Contexto;
beforeEach(async () => {
  ctx = await criarContexto();
});
afterEach(async () => {
  await ctx.encerrar();
});

const EMAIL = "pessoa@exemplo.com.br";

describe("login (CA-15)", () => {
  test("e-mail com espaços e maiúsculas entra na conta normalizada; a resposta traz usuario e empresas", async () => {
    const id = await ctx.criarUsuario(EMAIL, "Pessoa Exemplo");
    const empresa = await ctx.criarEmpresa("Comércio Exemplo Ltda.", "00000000");
    await ctx.vincular(empresa, id, "titular");
    const r = await ctx.login(" Pessoa@Exemplo.com.br ");
    expect(r.status).toBe(200);
    expect(r.corpo.usuario).toEqual({ id, nome: "Pessoa Exemplo" });
    expect(r.corpo.empresas).toEqual([
      { id: empresa, nome: "Comércio Exemplo Ltda.", cnpjRaiz: "00000000", cnpjRaizFormatado: "00.000.000", papel: "titular" },
    ]);
    expect(r.cookie).toBeTruthy();
  });
});

describe("login sem revelar o e-mail (CA-16)", () => {
  test("e-mail inexistente e senha errada dão o mesmo status e o mesmo corpo, e o verificador roda nos dois", async () => {
    await ctx.criarUsuario(EMAIL);
    const errada = await ctx.login(EMAIL, "senha errada ficticia");
    const inexistente = await ctx.login("ninguem@exemplo.com.br", "senha errada ficticia");
    expect(errada.status).toBe(401);
    expect(inexistente.status).toBe(401);
    expect(inexistente.corpo).toEqual(errada.corpo);
    expect(errada.corpo).toEqual({ erro: "credencial_invalida", mensagem: "E-mail ou senha incorretos" });
    expect(ctx.verificador).toHaveBeenCalledTimes(2);
    expect(errada.cookie).toBeNull();
  });
});

describe("limite pela rota (CA-17)", () => {
  test("a 6ª tentativa dá 429, também com a senha certa", async () => {
    await ctx.criarUsuario(EMAIL);
    for (let i = 0; i < 5; i++) {
      expect((await ctx.login(EMAIL, "senha errada ficticia")).status).toBe(401);
    }
    const r = await ctx.login(EMAIL, SENHA_BOA);
    expect(r.status).toBe(429);
    expect(r.corpo).toEqual({
      erro: "muitas_tentativas",
      mensagem: "Muitas tentativas. Tente de novo em alguns minutos.",
    });
    // sem verificar a senha: o espião só foi chamado nas 5 primeiras
    expect(ctx.verificador).toHaveBeenCalledTimes(5);
  });

  test("a resposta de bloqueio é igual para e-mail inexistente", async () => {
    for (let i = 0; i < 5; i++) await ctx.login("ninguem@exemplo.com.br", "senha errada ficticia");
    const r = await ctx.login("ninguem@exemplo.com.br", "senha errada ficticia");
    expect(r.status).toBe(429);
    expect(r.corpo.erro).toBe("muitas_tentativas");
  });

  test("passados 15 minutos, entra", async () => {
    await ctx.criarUsuario(EMAIL);
    for (let i = 0; i < 5; i++) await ctx.login(EMAIL, "senha errada ficticia");
    expect((await ctx.login(EMAIL)).status).toBe(429);
    ctx.relogio.avancar(15 * MIN);
    expect((await ctx.login(EMAIL)).status).toBe(200);
  });
});

describe("cookie e sessão (CA-19)", () => {
  test("o Set-Cookie tem os atributos exigidos e o banco guarda só o HMAC", async () => {
    await ctx.criarUsuario(EMAIL);
    const r = await ctx.login(EMAIL);
    const linha = r.setCookie.find((c) => c.startsWith(`${COOKIE}=`)) ?? "";
    expect(linha).toMatch(/HttpOnly/i);
    expect(linha).toMatch(/;\s*Secure/i);
    expect(linha).toMatch(/SameSite=Strict/i);
    expect(linha).toMatch(/Path=\/api(;|$)/);
    expect(linha).toMatch(/Max-Age=43200/);
    const guardado = await sql<{ token_hmac: string }>`select token_hmac from sessao`.execute(ctx.migracao);
    expect(guardado.rows).toHaveLength(1);
    expect(guardado.rows[0]?.token_hmac).not.toBe(r.cookie);
    expect(guardado.rows[0]?.token_hmac).toBe(hmacToken(SEGREDO, r.cookie ?? ""));
  });
});

describe("validade da sessão (CA-20)", () => {
  test("sem cookie dá 401 sem_sessao", async () => {
    const r = await ctx.req("GET", "/api/sessao");
    expect(r.status).toBe(401);
    expect(r.corpo.erro).toBe("sem_sessao");
  });

  test("cookie desconhecido dá 401 sem_sessao", async () => {
    const r = await ctx.req("GET", "/api/sessao", { cookie: "desconhecido" });
    expect(r.status).toBe(401);
    expect(r.corpo.erro).toBe("sem_sessao");
  });

  test("com sessão válida, GET /api/sessao devolve usuario e empresas", async () => {
    const cookie = await ctx.sessaoDe(EMAIL);
    const r = await ctx.req("GET", "/api/sessao", { cookie });
    expect(r.status).toBe(200);
    expect(r.corpo.usuario.nome).toBe("Pessoa Exemplo");
    expect(r.corpo.empresas).toEqual([]);
  });

  test("2 h sem uso dão 401 sessao_expirada", async () => {
    const cookie = await ctx.sessaoDe(EMAIL);
    ctx.relogio.avancar(2 * HORA);
    const r = await ctx.req("GET", "/api/sessao", { cookie });
    expect(r.status).toBe(401);
    expect(r.corpo.erro).toBe("sessao_expirada");
  });

  test("1 h 59 min sem uso ainda vale", async () => {
    const cookie = await ctx.sessaoDe(EMAIL);
    ctx.relogio.avancar(2 * HORA - MIN);
    expect((await ctx.req("GET", "/api/sessao", { cookie })).status).toBe(200);
  });

  test("com uso a cada 30 min, 12 h depois do login a sessão expira", async () => {
    const cookie = await ctx.sessaoDe(EMAIL);
    for (let i = 0; i < 23; i++) {
      ctx.relogio.avancar(30 * MIN);
      expect((await ctx.req("GET", "/api/sessao", { cookie })).status).toBe(200);
    }
    ctx.relogio.avancar(30 * MIN);
    const r = await ctx.req("GET", "/api/sessao", { cookie });
    expect(r.status).toBe(401);
    expect(r.corpo.erro).toBe("sessao_expirada");
  });

  test("ultimo_uso_em não muda em duas requisições com menos de 1 minuto entre elas", async () => {
    const cookie = await ctx.sessaoDe(EMAIL);
    const ler = async () =>
      (await sql<{ ultimo_uso_em: Date }>`select ultimo_uso_em from sessao`.execute(ctx.migracao)).rows[0]?.ultimo_uso_em.getTime();
    const inicial = await ler();
    ctx.relogio.avancar(2 * MIN);
    await ctx.req("GET", "/api/sessao", { cookie });
    const aposPrimeira = await ler();
    expect(aposPrimeira).toBe((inicial ?? 0) + 2 * MIN);
    ctx.relogio.avancar(30_000);
    await ctx.req("GET", "/api/sessao", { cookie });
    expect(await ler()).toBe(aposPrimeira);
  });
});

describe("saída (CA-21)", () => {
  test("depois de DELETE /api/sessao o mesmo cookie dá 401 e a resposta vence o cookie", async () => {
    const cookie = await ctx.sessaoDe(EMAIL);
    const r = await ctx.req("DELETE", "/api/sessao", { cookie });
    expect(r.status).toBe(204);
    const linha = r.setCookie.find((c) => c.startsWith(`${COOKIE}=`)) ?? "";
    expect(linha).toMatch(/^cg_sessao=;/);
    expect(linha).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/);
    expect(linha).toMatch(/Path=\/api/);
    const depois = await ctx.req("GET", "/api/sessao", { cookie });
    expect(depois.status).toBe(401);
    expect(depois.corpo.erro).toBe("sem_sessao");
    const guardada = await sql<{ motivo_encerramento: string }>`select motivo_encerramento from sessao`.execute(ctx.migracao);
    expect(guardada.rows[0]?.motivo_encerramento).toBe("saida");
  });
});

describe("nova sessão e proteção de origem (CA-22)", () => {
  test("login com cookie válido anterior encerra a sessão anterior e devolve um valor novo", async () => {
    await ctx.criarUsuario(EMAIL);
    const primeiro = (await ctx.login(EMAIL)).cookie;
    const segundo = (await ctx.login(EMAIL, SENHA_BOA, { cookie: primeiro })).cookie;
    expect(segundo).toBeTruthy();
    expect(segundo).not.toBe(primeiro);
    expect((await ctx.req("GET", "/api/sessao", { cookie: primeiro })).status).toBe(401);
    expect((await ctx.req("GET", "/api/sessao", { cookie: segundo })).status).toBe(200);
  });

  test("POST sem X-CreditoGov-Requisicao dá 403 origem_recusada", async () => {
    await ctx.criarUsuario(EMAIL);
    const r = await ctx.req("POST", "/api/sessao", { corpo: { email: EMAIL, senha: SENHA_BOA }, semCabecalho: true });
    expect(r.status).toBe(403);
    expect(r.corpo.erro).toBe("origem_recusada");
  });

  test("DELETE sem o cabeçalho também dá 403", async () => {
    const cookie = await ctx.sessaoDe(EMAIL);
    const r = await ctx.req("DELETE", "/api/sessao", { cookie, semCabecalho: true });
    expect(r.status).toBe(403);
  });

  test("Origin de outro site dá 403, e o da web passa", async () => {
    await ctx.criarUsuario(EMAIL);
    const corpo = { email: EMAIL, senha: SENHA_BOA };
    const outro = await ctx.req("POST", "/api/sessao", { corpo, headers: { origin: "https://outro.example.com" } });
    expect(outro.status).toBe(403);
    expect(outro.corpo.erro).toBe("origem_recusada");
    const web = await ctx.req("POST", "/api/sessao", { corpo, headers: { origin: "http://localhost:5173" } });
    expect(web.status).toBe(200);
  });

  test("a resposta não traz cabeçalho CORS, nem para a verificação prévia", async () => {
    const r = await ctx.req("POST", "/api/sessao", { corpo: {}, headers: { origin: "https://outro.example.com" } });
    expect(r.headers["access-control-allow-origin"]).toBeUndefined();
    const pre = await ctx.req("OPTIONS", "/api/sessao", {
      headers: { origin: "https://outro.example.com", "access-control-request-method": "POST" },
    });
    expect(pre.headers["access-control-allow-origin"]).toBeUndefined();
    expect(pre.status).toBeGreaterThanOrEqual(400);
  });
});

describe("rotas públicas (CA-7)", () => {
  test("nenhuma rota pública cria usuário, empresa ou vínculo, além de aceitar convite", () => {
    const mudam = ctx.app.rotas.filter((r) => /^(POST|PUT|PATCH|DELETE) /.test(r));
    const permitidas = new Set([
      "POST /api/sessao",
      "DELETE /api/sessao",
      "POST /api/recuperacao",
      "POST /api/recuperacao/confirmar",
      "POST /api/convites/consultar",
      "POST /api/convites/aceitar",
      "POST /api/empresas/:empresaId/convites",
      "DELETE /api/empresas/:empresaId/vinculos/:usuarioId",
    ]);
    for (const r of mudam) expect(permitidas.has(r), r).toBe(true);
    expect(mudam).toContain("POST /api/sessao");
    for (const r of mudam) {
      expect(r).not.toMatch(/cadastro|registrar|usuarios|criar-conta/);
      expect(r).not.toBe("POST /api/empresas");
    }
  });
});

describe("cabeçalhos de segurança", () => {
  test("Referrer-Policy, nosniff e no-store em /api", async () => {
    const r = await ctx.req("GET", "/api/sessao");
    expect(r.headers["referrer-policy"]).toBe("no-referrer");
    expect(r.headers["x-content-type-options"]).toBe("nosniff");
    expect(r.headers["cache-control"]).toBe("no-store");
  });
});

describe("entrada inválida", () => {
  test("campos ausentes dão 400 entrada_invalida com campos", async () => {
    const r = await ctx.req("POST", "/api/sessao", { corpo: {} });
    expect(r.status).toBe(400);
    expect(r.corpo.erro).toBe("entrada_invalida");
    expect(typeof r.corpo.mensagem).toBe("string");
    const nomes = (r.corpo.campos as { campo: string; mensagem: string }[]).map((c) => c.campo).sort();
    expect(nomes).toEqual(["email", "senha"]);
    for (const c of r.corpo.campos) expect(typeof c.mensagem).toBe("string");
  });
});
