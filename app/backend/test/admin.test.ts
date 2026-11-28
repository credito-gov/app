import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { sql, type Kysely } from "kysely";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { criarComandosAdmin, ErroAdmin, type ComandosAdmin } from "../src/admin/comandos.js";
import { hmacToken } from "../src/autenticacao/tokens.js";
import { abrirKysely } from "../src/banco/conexao.js";
import type { Esquema } from "../src/banco/esquema.js";
import { criarBanco } from "../src/banco/transacao.js";
import { carregarConfig } from "../src/config.js";
import { criarEmailMemoria, type EnvioEmailMemoria } from "../src/email/memoria.js";
import { abrirComoMigracao, limparTabelas } from "./banco/limpar.js";
import { URL_APP, URL_MIGRACAO } from "./banco/urls.js";
import { criarContexto, SEGREDO, WEB_URL, type Contexto } from "./api/ajudas.js";

const ENV = {
  CREDITOGOV_AMBIENTE: "local",
  CREDITOGOV_BANCO_URL: URL_APP,
  CREDITOGOV_SESSAO_SEGREDO: SEGREDO,
  CREDITOGOV_WEB_URL: WEB_URL,
  CREDITOGOV_EMAIL: "memoria",
};
const DIA = 24 * 60 * 60_000;

let migracao: Kysely<Esquema>;
let app: Kysely<Esquema>;
let email: EnvioEmailMemoria;
let agora: Date;
let admin: ComandosAdmin;

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
  email = criarEmailMemoria();
  agora = new Date("2026-12-01T12:00:00Z");
  admin = criarComandosAdmin({
    banco: criarBanco(app),
    email,
    relogio: () => agora,
    config: carregarConfig(ENV),
  });
});

const motivo = async (p: Promise<unknown>): Promise<string> => {
  try {
    await p;
  } catch (e) {
    expect(e).toBeInstanceOf(ErroAdmin);
    return (e as Error).message;
  }
  throw new Error("era esperado um erro");
};

describe("criar-empresa (CA-5)", () => {
  test("aceita a raiz com e sem pontuação, grava e devolve o id", async () => {
    const a = await admin.criarEmpresa({ cnpjRaiz: "00000000", nome: "Comércio Exemplo Ltda." });
    const b = await admin.criarEmpresa({ cnpjRaiz: "11.111.111", nome: "Indústria Exemplo S.A." });
    expect(a.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(a.saida).toContain(a.id);
    const gravadas = await migracao.transaction().execute(async (trx) => {
      await sql`select set_config('app.empresas', ${`{${a.id},${b.id}}`}, true)`.execute(trx);
      return (await sql<{ cnpj_raiz: string }>`select cnpj_raiz from empresa order by cnpj_raiz`.execute(trx)).rows;
    });
    expect(gravadas.map((g) => g.cnpj_raiz)).toEqual(["00000000", "11111111"]);
  });

  test("recusa raiz com 7 dígitos ou com letras, dizendo o motivo", async () => {
    expect(await motivo(admin.criarEmpresa({ cnpjRaiz: "0000000", nome: "X" }))).toMatch(/8 dígitos/);
    expect(await motivo(admin.criarEmpresa({ cnpjRaiz: "0000000a", nome: "X" }))).toMatch(/8 dígitos/);
  });

  test("recusa nome vazio", async () => {
    expect(await motivo(admin.criarEmpresa({ cnpjRaiz: "00000000", nome: "  " }))).toMatch(/nome/i);
  });

  test("recusa raiz repetida, dizendo o motivo", async () => {
    await admin.criarEmpresa({ cnpjRaiz: "00000000", nome: "Comércio Exemplo Ltda." });
    expect(await motivo(admin.criarEmpresa({ cnpjRaiz: "00.000.000", nome: "Outra" }))).toMatch(/já existe/i);
  });
});

describe("convidar (CA-6)", () => {
  test.each(["titular", "contador"] as const)("convite de %s gera e-mail com o link, origem equipe e validade de 7 dias", async (papel) => {
    const { id } = await admin.criarEmpresa({ cnpjRaiz: "00000000", nome: "Comércio Exemplo Ltda." });
    const r = await admin.convidar({ empresaId: id, email: " Novo@Exemplo.com.br ", papel });
    expect(email.mensagens).toHaveLength(1);
    const msg = email.mensagens[0]!;
    expect(msg.para).toBe("novo@exemplo.com.br");
    const achado = /(http:\/\/localhost:5173\/convite#e=([0-9a-f-]{36})&t=([A-Za-z0-9_-]{43}))/.exec(msg.texto);
    expect(achado).not.toBeNull();
    expect(achado![2]).toBe(id);
    const token = achado![3]!;
    expect(msg.texto).toContain("a equipe CreditoGov");
    expect(msg.texto).toContain(papel);

    const convite = await migracao.transaction().execute(async (trx) => {
      await sql`select set_config('app.empresas', ${`{${id}}`}, true)`.execute(trx);
      return (await sql<Record<string, unknown>>`select * from convite`.execute(trx)).rows;
    });
    expect(convite).toHaveLength(1);
    const c = convite[0]!;
    expect(c["origem"]).toBe("equipe");
    expect(c["criado_por"]).toBeNull();
    expect(c["email_normalizado"]).toBe("novo@exemplo.com.br");
    expect(c["papel"]).toBe(papel);
    expect((c["expira_em"] as Date).getTime()).toBe(agora.getTime() + 7 * DIA);
    expect(c["token_hmac"]).toBe(hmacToken(SEGREDO, token));
    expect(JSON.stringify(c)).not.toContain(token);

    // a saída do comando não leva token nem link
    expect(r.saida).not.toContain(token);
    expect(r.saida).not.toContain("convite#");
    expect(r.saida).not.toContain("http");
  });

  test("colaborador é recusado para a equipe", async () => {
    const { id } = await admin.criarEmpresa({ cnpjRaiz: "00000000", nome: "Comércio Exemplo Ltda." });
    expect(await motivo(admin.convidar({ empresaId: id, email: "novo@exemplo.com.br", papel: "colaborador" }))).toMatch(/titular ou contador/);
    expect(email.mensagens).toHaveLength(0);
  });

  test("empresa que não existe é recusada", async () => {
    expect(
      await motivo(admin.convidar({ empresaId: "00000000-0000-4000-8000-000000000000", email: "novo@exemplo.com.br", papel: "titular" })),
    ).toMatch(/empresa/i);
    expect(email.mensagens).toHaveLength(0);
  });
});

describe("empresas-do-usuario", () => {
  test("lista as empresas do usuário e nenhuma outra", async () => {
    const ctx = await criarContexto();
    try {
      const admin2 = criarComandosAdmin({ banco: ctx.banco, email: ctx.email, relogio: () => ctx.relogio.agora(), config: ctx.config });
      const u = await ctx.criarUsuario("pessoa@exemplo.com.br");
      const outro = await ctx.criarUsuario("outra@exemplo.com.br");
      const a = await ctx.criarEmpresa("Comércio Exemplo Ltda.", "00000000");
      const b = await ctx.criarEmpresa("Indústria Exemplo S.A.", "11111111");
      const c = await ctx.criarEmpresa("Serviços Exemplo ME", "22222222");
      await ctx.vincular(a, u, "titular");
      await ctx.vincular(b, u, "contador");
      await ctx.vincular(c, outro, "titular");
      const r = await admin2.empresasDoUsuario({ email: "Pessoa@exemplo.com.br" });
      expect(r.empresas.map((e) => e.id).sort()).toEqual([a, b].sort());
      expect(r.empresas.find((e) => e.id === b)?.papel).toBe("contador");
      expect(r.saida).toContain(a);
      expect(r.saida).not.toContain(c);
    } finally {
      await ctx.encerrar();
    }
  });

  test("usuário que não existe é recusado", async () => {
    expect(await motivo(admin.empresasDoUsuario({ email: "ninguem@exemplo.com.br" }))).toMatch(/usuário/i);
  });
});

describe("remover-vinculo (CA-34)", () => {
  let ctx: Contexto;
  beforeEach(async () => {
    ctx = await criarContexto();
  });
  afterEach(async () => {
    await ctx.encerrar();
  });

  test("remove o contador e recusa o último titular", async () => {
    const adminC = criarComandosAdmin({ banco: ctx.banco, email: ctx.email, relogio: () => ctx.relogio.agora(), config: ctx.config });
    const titular = await ctx.criarUsuario("titular@exemplo.com.br");
    const contador = await ctx.criarUsuario("contador@exemplo.com.br");
    const empresa = await ctx.criarEmpresa("Comércio Exemplo Ltda.", "00000000");
    await ctx.vincular(empresa, titular, "titular");
    await ctx.vincular(empresa, contador, "contador");

    await adminC.removerVinculo({ empresaId: empresa, email: "contador@exemplo.com.br" });
    const restantes = await ctx.banco.naEmpresa(titular, empresa, async (trx) =>
      trx.selectFrom("vinculo_empresa").select(["usuario_id", "removido_em", "removido_por"]).where("usuario_id", "=", contador).execute(),
    );
    expect(restantes[0]?.removido_em).toBeInstanceOf(Date);
    expect(restantes[0]?.removido_por).toBeNull();

    expect(await motivo(adminC.removerVinculo({ empresaId: empresa, email: "titular@exemplo.com.br" }))).toMatch(/último titular/i);
    // o titular continua com acesso
    await expect(ctx.banco.naEmpresa(titular, empresa, async () => 1)).resolves.toBe(1);
  });
});

describe("processo do admin (sem .env e sem shell)", () => {
  const RAIZ = join(import.meta.dirname, "..");

  // Um build só para os testes de processo. O processo roda com `node dist/admin/main.js`,
  // sem --env-file-if-exists: o .env do desenvolvedor nunca é lido.
  beforeAll(() => {
    const b = spawnSync(process.execPath, [join(RAIZ, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.json"], {
      cwd: RAIZ,
      encoding: "utf8",
      timeout: 120_000,
    });
    expect(b.status, b.stdout + b.stderr).toBe(0);
  }, 130_000);

  const rodar = (...args: string[]) =>
    spawnSync(process.execPath, [join(RAIZ, "dist", "admin", "main.js"), ...args], {
      cwd: RAIZ,
      encoding: "utf8",
      env: { ...process.env, ...ENV },
      timeout: 60_000,
    });

  test("raiz inválida sai com código 1 e diz o motivo; sem comando também falha", () => {
    const ruim = rodar("criar-empresa", "--cnpj-raiz", "123", "--nome", "Comércio Exemplo Ltda.");
    expect(ruim.status).toBe(1);
    expect(ruim.stderr).toMatch(/8 dígitos/);
    const vazio = rodar();
    expect(vazio.status).toBe(1);
  }, 130_000);

  test("criar-empresa válido sai com código 0, imprime o id e o nome chega inteiro", async () => {
    const ok = rodar("criar-empresa", "--cnpj-raiz", "00.000.000", "--nome", "Comércio Exemplo Ltda.");
    expect(ok.status).toBe(0);
    expect(ok.stderr).not.toContain("DEP0190");
    const id = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/.exec(ok.stdout)?.[1];
    expect(id).toBeDefined();
    const nome = await migracao.transaction().execute(async (trx) => {
      await sql`select set_config('app.empresas', ${`{${id}}`}, true)`.execute(trx);
      return (await sql<{ nome: string }>`select nome from empresa`.execute(trx)).rows[0]?.nome;
    });
    expect(nome).toBe("Comércio Exemplo Ltda.");
  }, 130_000);

  test("com o papel de migração na URL do app, o processo recusa subir", () => {
    const r = spawnSync(process.execPath, [join(RAIZ, "dist", "admin", "main.js"), "empresas-do-usuario", "--email", "a@exemplo.com.br"], {
      cwd: RAIZ,
      encoding: "utf8",
      env: { ...process.env, ...ENV, CREDITOGOV_BANCO_URL: URL_MIGRACAO },
      timeout: 60_000,
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/papel do banco/i);
  }, 130_000);
});

describe("convidar: validação de e-mail e falha no envio", () => {
  test("usa a mesma validação da API: e-mail sem ponto no domínio é recusado", async () => {
    const { id } = await admin.criarEmpresa({ cnpjRaiz: "00000000", nome: "Comércio Exemplo Ltda." });
    expect(await motivo(admin.convidar({ empresaId: id, email: "pessoa@exemplo", papel: "titular" }))).toMatch(/e-mail inválido/i);
    expect(email.mensagens).toHaveLength(0);
  });

  test("se o e-mail não sai, diz que o convite foi criado", async () => {
    const { id } = await admin.criarEmpresa({ cnpjRaiz: "00000000", nome: "Comércio Exemplo Ltda." });
    const semEnvio = criarComandosAdmin({
      banco: criarBanco(app),
      email: {
        async enviar() {
          throw new Error("smtp caiu");
        },
      },
      relogio: () => agora,
      config: carregarConfig(ENV),
    });
    expect(await motivo(semEnvio.convidar({ empresaId: id, email: "novo@exemplo.com.br", papel: "titular" }))).toMatch(
      /Convite criado, mas o e-mail não foi enviado/,
    );
  });
});
