import { Writable } from "node:stream";
import { sql } from "kysely";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { chaveEmail, chaveOrigem } from "../../src/autenticacao/limite.js";
import { hmacToken } from "../../src/autenticacao/tokens.js";
import { criarContexto, SEGREDO, SENHA_BOA, type Contexto, type Resposta } from "./ajudas.js";

const NOVA = "uma senha nova e ficticia";
const ERRADA = "senha errada ficticia";
const SENHA_CONVITE = "senha do convite ficticia";
const EMAIL_CONVIDADO = "convidado@exemplo.com.br";

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
  await ctx.encerrar();
});

/** Roda os fluxos e devolve tudo o que é segredo, e todas as respostas. */
async function rodarFluxos() {
  const respostas: Resposta[] = [];
  const segredos: string[] = [];
  const guardar = (r: Resposta) => {
    respostas.push(r);
    if (r.cookie) segredos.push(r.cookie, hmacToken(SEGREDO, r.cookie));
    return r;
  };
  const tokenDoUltimoEmail = () => {
    const texto = ctx.email.mensagens.at(-1)!.texto;
    const link = /(https?:\/\/\S+#\S+)/.exec(texto)![1]!;
    const token = /t=([A-Za-z0-9_-]+)/.exec(link)![1]!;
    segredos.push(link, token, hmacToken(SEGREDO, token));
    return { link, token, empresaId: /e=([0-9a-f-]{36})/.exec(link)?.[1] };
  };

  const titular = await ctx.criarUsuario("titular@exemplo.com.br", "Maria Titular");
  const contador = await ctx.criarUsuario("contador@exemplo.com.br", "Carlos Contador");
  const empresa = await ctx.criarEmpresa("Comércio Exemplo Ltda.", "11111111");
  await ctx.vincular(empresa, titular, "titular");
  await ctx.vincular(empresa, contador, "contador");
  segredos.push(
    "titular@exemplo.com.br",
    "contador@exemplo.com.br",
    EMAIL_CONVIDADO,
    SENHA_BOA,
    NOVA,
    ERRADA,
    SENHA_CONVITE,
    chaveEmail(SEGREDO, "titular@exemplo.com.br"),
    chaveEmail(SEGREDO, "contador@exemplo.com.br"),
    chaveEmail(SEGREDO, EMAIL_CONVIDADO),
    chaveOrigem(SEGREDO, "127.0.0.1"),
  );

  // login certo e errado
  const sessao = guardar(await ctx.login("titular@exemplo.com.br"));
  guardar(await ctx.login("titular@exemplo.com.br", ERRADA));
  guardar(await ctx.login("ninguem@exemplo.com.br", ERRADA));

  // convite: criar, consultar, aceitar
  guardar(
    await ctx.req("POST", `/api/empresas/${empresa}/convites`, {
      cookie: sessao.cookie,
      corpo: { email: EMAIL_CONVIDADO, papel: "colaborador" },
    }),
  );
  const convite = tokenDoUltimoEmail();
  guardar(await ctx.req("POST", "/api/convites/consultar", { corpo: { empresaId: convite.empresaId, token: convite.token } }));
  guardar(
    await ctx.req("POST", "/api/convites/aceitar", {
      corpo: { empresaId: convite.empresaId, token: convite.token, nome: "Pessoa Convidada", senha: SENHA_CONVITE },
    }),
  );
  // senha curta no convite (a resposta de erro também não pode ecoar a senha)
  guardar(
    await ctx.req("POST", "/api/convites/aceitar", {
      corpo: { empresaId: convite.empresaId, token: convite.token, nome: "Pessoa", senha: "curta" },
    }),
  );

  // remoção de vínculo
  guardar(await ctx.req("DELETE", `/api/empresas/${empresa}/vinculos/${contador}`, { cookie: sessao.cookie }));

  // recuperação: pedir, confirmar (com a senha nova)
  guardar(await ctx.req("POST", "/api/recuperacao", { corpo: { email: "titular@exemplo.com.br" } }));
  const rec = tokenDoUltimoEmail();
  guardar(await ctx.req("POST", "/api/recuperacao/confirmar", { corpo: { token: rec.token, senha: NOVA } }));

  // sair
  const de = guardar(await ctx.login("titular@exemplo.com.br", NOVA));
  guardar(await ctx.req("DELETE", "/api/sessao", { cookie: de.cookie }));

  return { respostas, segredos, empresa };
}

describe("logs (CA-39)", () => {
  test("o log inteiro não tem e-mail, senha, token, link, HMAC nem cookie", async () => {
    const { segredos } = await rodarFluxos();
    const log = linhas.join("");
    expect(log.length).toBeGreaterThan(0);
    for (const s of new Set(segredos)) {
      expect(log.includes(s), `o log contém um segredo: ${s.slice(0, 6)}…`).toBe(false);
    }
  });

  test("os eventos próprios aparecem, só com uuids, e login_recusado não leva usuarioId", async () => {
    await rodarFluxos();
    const eventos = linhas
      .join("")
      .split("\n")
      .filter((l) => l.trim().startsWith("{"))
      .map((l) => JSON.parse(l) as Record<string, unknown>)
      .filter((o) => typeof o["evento"] === "string");
    const nomes = new Set(eventos.map((e) => e["evento"]));
    for (const esperado of [
      "login_ok",
      "login_recusado",
      "convite_criado",
      "convite_aceito",
      "recuperacao_pedida",
      "senha_redefinida",
      "vinculo_removido",
      "sessao_encerrada",
    ]) {
      expect(nomes.has(esperado), esperado).toBe(true);
    }
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    for (const e of eventos) {
      for (const chave of ["usuarioId", "empresaId", "conviteId"]) {
        if (chave in e) expect(String(e[chave]), `${e["evento"]}.${chave}`).toMatch(uuid);
      }
      for (const chave of Object.keys(e)) {
        expect(["evento", "usuarioId", "empresaId", "conviteId"].includes(chave) || ["level", "time", "pid", "hostname", "msg", "req", "res", "reqId", "responseTime"].includes(chave), chave).toBe(true);
      }
    }
    for (const e of eventos.filter((x) => x["evento"] === "login_recusado")) {
      expect("usuarioId" in e).toBe(false);
    }
  });

  test("nenhuma tabela guarda senha em texto (CA-14)", async () => {
    const { empresa } = await rodarFluxos();
    const tabelas = [
      "usuario",
      "identidade",
      "sessao",
      "recuperacao_senha",
      "falha_acesso",
      "bloqueio_acesso",
      "empresa",
      "vinculo_empresa",
      "convite",
    ];
    const conteudo = await ctx.migracao.transaction().execute(async (trx) => {
      await sql`select set_config('app.empresas', ${`{${empresa}}`}, true)`.execute(trx);
      const partes: string[] = [];
      for (const t of tabelas) {
        const r = await sql<{ txt: string }>`select coalesce(string_agg(to_jsonb(x)::text, ' '), '') as txt from ${sql.table(t)} x`.execute(trx);
        partes.push(r.rows[0]!.txt);
      }
      return partes.join(" ");
    });
    expect(conteudo).toContain("$argon2id$"); // a varredura leu o que importa
    for (const senha of [SENHA_BOA, NOVA, ERRADA, SENHA_CONVITE, "curta"]) {
      expect(conteudo.includes(senha), "uma tabela guarda uma senha em texto").toBe(false);
    }
  });

  test("nenhuma resposta JSON ecoa a senha (CA-14)", async () => {
    const { respostas } = await rodarFluxos();
    for (const r of respostas) {
      for (const senha of [SENHA_BOA, NOVA, ERRADA, SENHA_CONVITE, "curta"]) {
        expect(r.texto.includes(senha), `resposta ${r.status} ecoa uma senha`).toBe(false);
      }
    }
  });
});
