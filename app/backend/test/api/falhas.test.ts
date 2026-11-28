// Falhas silenciosas e tratamento de erro (correção 1 da revisão da 034).
// Nenhum dado real: e-mails de exemplo.com.br e raízes fictícias.
import { Writable } from "node:stream";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { criarContexto, SENHA_BOA, type Contexto } from "./ajudas.js";

let ctx: Contexto;
let linhas: string[];

beforeEach(async () => {
  linhas = [];
  const stream = new Writable({
    write(chunk, _enc, cb) {
      linhas.push(String(chunk));
      cb();
    },
  });
  ctx = await criarContexto({ log: { stream } });
});
afterEach(async () => {
  vi.restoreAllMocks();
  await ctx.encerrar();
});

type Linha = Record<string, any>;
const registros = (): Linha[] =>
  linhas
    .join("")
    .split("\n")
    .filter((l) => l.trim().startsWith("{"))
    .map((l) => JSON.parse(l) as Linha);
const evento = (nome: string) => registros().find((o) => o["evento"] === nome);

/** Faz a n-ésima chamada a `banco.semUsuario` falhar; as outras seguem normais. */
function falharSemUsuarioNaChamada(n: number) {
  const original = ctx.banco.semUsuario.bind(ctx.banco);
  let chamadas = 0;
  vi.spyOn(ctx.banco, "semUsuario").mockImplementation(((fn: never) =>
    ++chamadas === n ? Promise.reject(new Error("falha simulada")) : original(fn)) as never);
}

describe("log do 500 (CA-39)", () => {
  test("registra tipo, codigo, restricao, rota e stack, sem detail nem message", async () => {
    await ctx.criarUsuario("a@exemplo.com.br");
    ctx.verificador.mockRejectedValueOnce(
      Object.assign(new Error("valor-secreto-na-mensagem"), {
        code: "23505",
        constraint: "restricao_x",
        detail: "Key (email)=(valor-secreto-no-detalhe) already exists.",
      }),
    );
    const r = await ctx.login("a@exemplo.com.br");
    expect(r.status).toBe(500);
    const e = registros().find((o) => o["msg"] === "erro_interno")!;
    expect(e).toMatchObject({ tipo: "Error", codigo: "23505", restricao: "restricao_x", rota: "/api/sessao" });
    expect(typeof e["stack"]).toBe("string");
    expect(e["stack"]).toContain("at ");
    const log = linhas.join("");
    expect(log).not.toContain("valor-secreto");
  });
});

describe("erros 4xx do framework", () => {
  const bruto = (payload: string, tipo: string) =>
    ctx.app.inject({
      method: "POST",
      url: "/api/sessao",
      headers: { "x-creditogov-requisicao": "1", "content-type": tipo },
      payload,
    });

  test("corpo grande demais mantém 413 e registra aviso com o código", async () => {
    const r = await ctx.req("POST", "/api/sessao", { corpo: { email: "a@exemplo.com.br", senha: "x".repeat(20_000) } });
    expect(r.status).toBe(413);
    expect(registros().some((o) => o["level"] === 40 && o["codigo"] === "FST_ERR_CTP_BODY_TOO_LARGE")).toBe(true);
  });

  test("tipo de conteúdo não aceito mantém 415", async () => {
    const r = await bruto("<a/>", "application/xml");
    expect(r.statusCode).toBe(415);
  });

  test("JSON malformado continua 400 entrada_invalida", async () => {
    const r = await bruto("{", "application/json");
    expect(r.statusCode).toBe(400);
    expect(r.json().erro).toBe("entrada_invalida");
  });
});

describe("sair (CA-21)", () => {
  test("vence o cookie mesmo se encerrar a sessão falhar no banco", async () => {
    const cookie = await ctx.sessaoDe("a@exemplo.com.br");
    falharSemUsuarioNaChamada(2); // 1: validar; 2: encerrar
    const r = await ctx.req("DELETE", "/api/sessao", { cookie });
    expect(r.status).toBe(500);
    expect(r.setCookie.some((c) => c.startsWith("cg_sessao=;"))).toBe(true);
  });
});

describe("login: cookie só depois de os dados da sessão darem certo", () => {
  test("se os dados falham, não grava o cookie e encerra a sessão criada", async () => {
    await ctx.criarUsuario("a@exemplo.com.br");
    vi.spyOn(ctx.banco, "naCarteira").mockRejectedValueOnce(new Error("falha simulada"));
    const r = await ctx.login("a@exemplo.com.br");
    expect(r.status).toBe(500);
    expect(r.cookie).toBeNull();
    const abertas = await ctx.migracao.selectFrom("sessao").select("id").where("encerrada_em", "is", null).execute();
    expect(abertas).toHaveLength(0);
  });
});

describe("e-mail que não sai", () => {
  test("recuperação: 202 igual, para conta que existe ou não, e registra email_falhou", async () => {
    const usuarioId = await ctx.criarUsuario("a@exemplo.com.br");
    vi.spyOn(ctx.email, "enviar").mockRejectedValue(new Error("smtp caiu"));
    const existe = await ctx.req("POST", "/api/recuperacao", { corpo: { email: "a@exemplo.com.br" } });
    const nao = await ctx.req("POST", "/api/recuperacao", { corpo: { email: "b@exemplo.com.br" } });
    expect(existe.status).toBe(202);
    expect(nao.status).toBe(202);
    expect(existe.corpo).toEqual(nao.corpo);
    const e = evento("email_falhou")!;
    expect(e).toMatchObject({ usuarioId, tipo: "recuperacao" });
    const log = linhas.join("");
    expect(log).not.toContain("a@exemplo.com.br");
    expect(log).not.toContain("smtp caiu");
  });

  test("convite: 502 email_nao_enviado, convite criado e email_falhou registrado", async () => {
    const empresa = await ctx.criarEmpresa("Comércio Exemplo Ltda.", "00000000");
    const titular = await ctx.criarUsuario("titular@exemplo.com.br");
    await ctx.vincular(empresa, titular, "titular");
    const cookie = (await ctx.login("titular@exemplo.com.br")).cookie!;
    vi.spyOn(ctx.email, "enviar").mockRejectedValue(new Error("smtp caiu"));
    const r = await ctx.req("POST", `/api/empresas/${empresa}/convites`, {
      cookie,
      corpo: { email: "novo@exemplo.com.br", papel: "contador" },
    });
    expect(r.status).toBe(502);
    expect(r.corpo.erro).toBe("email_nao_enviado");
    expect(r.corpo.mensagem).toBe("O convite foi criado, mas o e-mail não saiu. Tente reenviar.");
    const e = evento("email_falhou")!;
    expect(e).toMatchObject({ empresaId: empresa, usuarioId: titular, tipo: "convite" });
    expect(e["conviteId"]).toMatch(/^[0-9a-f-]{36}$/);
    expect(linhas.join("")).not.toContain("novo@exemplo.com.br");
  });
});

describe("aceite com commit e falha ao abrir a sessão", () => {
  test("devolve convite_aceito_sem_sessao, sem cookie, e o login depois funciona", async () => {
    const empresa = await ctx.criarEmpresa("Comércio Exemplo Ltda.", "00000000");
    const titular = await ctx.criarUsuario("titular@exemplo.com.br");
    await ctx.vincular(empresa, titular, "titular");
    const cookie = (await ctx.login("titular@exemplo.com.br")).cookie!;
    await ctx.req("POST", `/api/empresas/${empresa}/convites`, {
      cookie,
      corpo: { email: "novo@exemplo.com.br", papel: "contador" },
    });
    const m = /#e=([0-9a-f-]{36})&t=([A-Za-z0-9_-]+)/.exec(ctx.email.mensagens.at(-1)!.texto)!;
    vi.spyOn(ctx.banco, "naCarteira").mockRejectedValueOnce(new Error("falha simulada"));
    const r = await ctx.req("POST", "/api/convites/aceitar", {
      corpo: { empresaId: m[1], token: m[2], nome: "Pessoa Convidada", senha: SENHA_BOA },
    });
    expect(r.status).toBe(500);
    expect(r.corpo.erro).toBe("convite_aceito_sem_sessao");
    expect(r.corpo.mensagem).toBe("Convite aceito. Entre com seu e-mail e senha.");
    expect(r.cookie).toBeNull();
    expect(evento("convite_aceito_sem_sessao")).toBeDefined();
    expect((await ctx.login("novo@exemplo.com.br")).status).toBe(200);
  });
});

describe("trocar a senha (CA-24)", () => {
  test("se o update não afeta nenhuma linha, desfaz a transação e o link continua válido", async () => {
    await ctx.criarUsuario("a@exemplo.com.br");
    await ctx.req("POST", "/api/recuperacao", { corpo: { email: "a@exemplo.com.br" } });
    const token = /t=([A-Za-z0-9_-]+)/.exec(ctx.email.mensagens.at(-1)!.texto)![1]!;
    await ctx.migracao.deleteFrom("identidade").execute(); // some a identidade depois do pedido
    const r = await ctx.req("POST", "/api/recuperacao/confirmar", { corpo: { token, senha: "uma senha nova e ficticia" } });
    expect(r.status).toBe(500);
    const links = await ctx.migracao.selectFrom("recuperacao_senha").select("usada_em").execute();
    expect(links.map((l) => l.usada_em)).toEqual([null]);
  });
});
