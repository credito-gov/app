import { randomUUID } from "node:crypto";
import { sql, type Kysely, type Transaction } from "kysely";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { abrirKysely } from "../../src/banco/conexao.js";
import type { Esquema } from "../../src/banco/esquema.js";
import { criarBanco, EmpresaNaoEncontrada } from "../../src/banco/transacao.js";
import { abrirComoMigracao, limparTabelas, semear } from "./limpar.js";
import { URL_APP } from "./urls.js";

// Dados fictícios: empresas A, B e C; U1 tem vínculo em A e B; U2 só em C.
const A = randomUUID();
const B = randomUUID();
const C = randomUUID();
const U1 = randomUUID();
const U2 = randomUUID();

let migracao: Kysely<Esquema>;
let app: Kysely<Esquema>;

/** Roda como creditogov_app, fixando as empresas (e o usuário) à mão, como a API faz. */
async function comoApp<T>(
  empresas: string[] | null,
  fn: (trx: Transaction<Esquema>) => Promise<T>,
  usuario: string | null = null,
): Promise<T> {
  return app.transaction().execute(async (trx) => {
    if (empresas) {
      await sql`select set_config('app.empresas', ${`{${empresas.join(",")}}`}, true)`.execute(trx);
    }
    if (usuario) {
      await sql`select set_config('app.usuario_id', ${usuario}, true)`.execute(trx);
    }
    return fn(trx);
  });
}

beforeAll(async () => {
  migracao = abrirComoMigracao();
  app = abrirKysely(URL_APP);
  await limparTabelas(migracao);
  const conviteA = randomUUID();
  const conviteB = randomUUID();
  await semear(migracao, [A, B, C], async (trx) => {
    await sql`insert into usuario (id, nome, email_normalizado) values
      (${U1}, 'Pessoa Um', 'um@exemplo.com.br'), (${U2}, 'Pessoa Dois', 'dois@exemplo.com.br')`.execute(trx);
    await sql`insert into empresa (id, cnpj_raiz, nome) values
      (${A}, '00000000', 'Comércio Exemplo Ltda.'),
      (${B}, '11111111', 'Indústria Exemplo S.A.'),
      (${C}, '22222222', 'Serviços Exemplo ME')`.execute(trx);
    await sql`insert into convite (id, empresa_id, email_normalizado, papel, token_hmac, origem, expira_em) values
      (${conviteA}, ${A}, 'novo-a@exemplo.com.br', 'colaborador', 'hmac-a', 'equipe', now() + interval '7 days'),
      (${conviteB}, ${B}, 'novo-b@exemplo.com.br', 'colaborador', 'hmac-b', 'equipe', now() + interval '7 days')`.execute(trx);
    await sql`insert into vinculo_empresa (empresa_id, usuario_id, papel) values
      (${A}, ${U1}, 'titular'), (${B}, ${U1}, 'contador'), (${C}, ${U2}, 'titular')`.execute(trx);
  });
});

afterAll(async () => {
  await app?.destroy();
  await migracao?.destroy();
});

describe("CA-35: segurança por linha, direto no banco", () => {
  test("sem app.empresas, SELECT volta vazio", async () => {
    for (const tabela of ["empresa", "vinculo_empresa", "convite"]) {
      const r = await comoApp(null, (trx) =>
        sql<{ n: string }>`select count(*)::text as n from ${sql.table(tabela)}`.execute(trx),
      );
      expect(r.rows[0]?.n, tabela).toBe("0");
    }
  });

  test("com A fixada, nenhuma linha de B volta", async () => {
    await comoApp([A], async (trx) => {
      const e = await sql<{ id: string }>`select id from empresa`.execute(trx);
      expect(e.rows.map((x) => x.id)).toEqual([A]);
      const v = await sql<{ empresa_id: string }>`select empresa_id from vinculo_empresa`.execute(trx);
      expect(v.rows.every((x) => x.empresa_id === A)).toBe(true);
      expect(v.rows).toHaveLength(1);
      const c = await sql<{ empresa_id: string }>`select empresa_id from convite`.execute(trx);
      expect(c.rows.map((x) => x.empresa_id)).toEqual([A]);
    });
  });

  test("INSERT com empresa_id de B falha com A fixada", async () => {
    await expect(
      comoApp([A], (trx) =>
        sql`insert into convite (empresa_id, email_normalizado, papel, token_hmac, origem, expira_em)
            values (${B}, 'x@exemplo.com.br', 'colaborador', 'hmac-x', 'equipe', now() + interval '1 day')`.execute(trx),
      ),
    ).rejects.toThrow(/row-level security/);
    await expect(
      comoApp([A], (trx) =>
        sql`insert into vinculo_empresa (empresa_id, usuario_id, papel) values (${B}, ${U2}, 'colaborador')`.execute(trx),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  test("UPDATE que move linha de A para B falha com A fixada (WITH CHECK)", async () => {
    await expect(
      comoApp([A], (trx) => sql`update convite set empresa_id = ${B} where empresa_id = ${A}`.execute(trx)),
    ).rejects.toThrow(/row-level security/);
    await expect(
      comoApp([A], (trx) => sql`update vinculo_empresa set empresa_id = ${B} where empresa_id = ${A}`.execute(trx)),
    ).rejects.toThrow(/row-level security/);
    await comoApp([A], async (trx) => {
      const r = await sql<{ n: string }>`select count(*)::text as n from convite`.execute(trx);
      expect(r.rows[0]?.n).toBe("1"); // continua em A
    });
  });

  test("UPDATE e DELETE em linha de B afetam 0 linhas com A fixada", async () => {
    await comoApp([A], async (trx) => {
      const up = await sql`update vinculo_empresa set papel = 'colaborador' where empresa_id = ${B}`.execute(trx);
      expect(up.numAffectedRows).toBe(0n);
      const upE = await sql`update empresa set nome = 'Alterada' where id = ${B}`.execute(trx);
      expect(upE.numAffectedRows).toBe(0n);
      const del = await sql`delete from convite where empresa_id = ${B}`.execute(trx);
      expect(del.numAffectedRows).toBe(0n);
      const delV = await sql`delete from vinculo_empresa where empresa_id = ${B}`.execute(trx);
      expect(delV.numAffectedRows).toBe(0n);
    });
    // As linhas de B continuam lá.
    await comoApp([B], async (trx) => {
      const r = await sql<{ n: string }>`select count(*)::text as n from convite`.execute(trx);
      expect(r.rows[0]?.n).toBe("1");
    });
  });
});

describe("CA-36: nada vaza entre transações", () => {
  test("com uma conexão só, a transação seguinte não herda a empresa fixada", async () => {
    const unica = abrirKysely(URL_APP, { max: 1 });
    try {
      await unica.transaction().execute(async (trx) => {
        await sql`select set_config('app.empresas', ${`{${A}}`}, true)`.execute(trx);
        const e = await sql`select id from empresa`.execute(trx);
        expect(e.rows).toHaveLength(1);
      });
      await unica.transaction().execute(async (trx) => {
        const cfg = await sql<{ v: string | null }>`select current_setting('app.empresas', true) as v`.execute(trx);
        expect(cfg.rows[0]?.v ?? "").toBe("");
        const e = await sql`select id from empresa`.execute(trx);
        expect(e.rows).toHaveLength(0);
      });
    } finally {
      await unica.destroy();
    }
  });

  test("naCarteira com vínculos em A e B não mostra C", async () => {
    const unica = abrirKysely(URL_APP, { max: 1 });
    try {
      const banco = criarBanco(unica);
      const ids = await banco.naCarteira(U1, async (trx) =>
        (await sql<{ id: string }>`select id from empresa`.execute(trx)).rows.map((r) => r.id),
      );
      expect([...ids].sort()).toEqual([A, B].sort());
      expect(ids).not.toContain(C);
      // e a conexão não guarda a carteira
      const depois = await banco.semUsuario(async (trx) => (await sql`select id from empresa`.execute(trx)).rows);
      expect(depois).toHaveLength(0);
    } finally {
      await unica.destroy();
    }
  });

  test("naSessaoDoUsuario mostra os vínculos do usuário e nenhum de outro", async () => {
    const banco = criarBanco(app);
    const doU1 = await banco.naSessaoDoUsuario(U1, async (trx) =>
      (await sql<{ usuario_id: string }>`select usuario_id from vinculo_empresa`.execute(trx)).rows,
    );
    expect(doU1).toHaveLength(2);
    expect(doU1.every((r) => r.usuario_id === U1)).toBe(true);
    const doU2 = await banco.naSessaoDoUsuario(U2, async (trx) =>
      (await sql<{ usuario_id: string }>`select usuario_id from vinculo_empresa`.execute(trx)).rows,
    );
    expect(doU2).toHaveLength(1);
    expect(doU2[0]?.usuario_id).toBe(U2);
    // sem empresa fixada, as demais tabelas não mostram nada
    const empresas = await banco.naSessaoDoUsuario(U1, async (trx) => (await sql`select id from empresa`.execute(trx)).rows);
    expect(empresas).toHaveLength(0);
  });

  test("naEmpresa fixa só a empresa com vínculo ativo e recusa as outras com a mesma exceção", async () => {
    const banco = criarBanco(app);
    const visto = await banco.naEmpresa(U1, A, async (trx, ctx) => {
      expect(ctx.papel).toBe("titular");
      return (await sql<{ id: string }>`select id from empresa`.execute(trx)).rows.map((r) => r.id);
    });
    expect(visto).toEqual([A]);
    await expect(banco.naEmpresa(U1, C, async () => 1)).rejects.toBeInstanceOf(EmpresaNaoEncontrada);
    await expect(banco.naEmpresa(U1, randomUUID(), async () => 1)).rejects.toBeInstanceOf(EmpresaNaoEncontrada);
  });
});

describe("CA-37 e CA-2: catálogo", () => {
  test("creditogov_app não é superusuário, não ignora a segurança por linha e não é dono de tabela", async () => {
    const papel = await comoApp(null, (trx) =>
      sql<{ rolsuper: boolean; rolbypassrls: boolean }>`select rolsuper, rolbypassrls from pg_roles where rolname = current_user`.execute(trx),
    );
    expect(papel.rows[0]).toEqual({ rolsuper: false, rolbypassrls: false });
    const donos = await comoApp(null, (trx) =>
      sql<{ n: string }>`select count(*)::text as n from pg_tables where tableowner = 'creditogov_app'`.execute(trx),
    );
    expect(donos.rows[0]?.n).toBe("0");
  });

  test("as tabelas pertencem a creditogov_migracao", async () => {
    const r = await sql<{ tablename: string; tableowner: string }>`
      select tablename, tableowner from pg_tables where schemaname = 'public'`.execute(migracao);
    expect(r.rows.length).toBeGreaterThan(0);
    for (const t of r.rows) expect(t.tableowner, t.tablename).toBe("creditogov_migracao");
  });

  test("empresa e toda tabela com empresa_id têm RLS, FORCE e ao menos uma regra", async () => {
    const cols = await sql<{ table_name: string }>`
      select table_name from information_schema.columns
      where table_schema = 'public' and column_name = 'empresa_id'`.execute(migracao);
    const tabelas = new Set(["empresa", ...cols.rows.map((r) => r.table_name)]);
    expect([...tabelas]).toEqual(expect.arrayContaining(["empresa", "vinculo_empresa", "convite"]));
    for (const t of tabelas) {
      const c = await sql<{ relrowsecurity: boolean; relforcerowsecurity: boolean }>`
        select relrowsecurity, relforcerowsecurity from pg_class
        where oid = ${`public.${t}`}::regclass`.execute(migracao);
      expect(c.rows[0], t).toEqual({ relrowsecurity: true, relforcerowsecurity: true });
      const p = await sql<{ n: string }>`
        select count(*)::text as n from pg_policies where schemaname = 'public' and tablename = ${t}`.execute(migracao);
      expect(Number(p.rows[0]?.n), t).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("CA-38: numeric", () => {
  test("numeric(20,2) volta como string, sem perda", async () => {
    const r = await sql<{ v: unknown }>`select 12345678901234.56::numeric(20,2) as v`.execute(app);
    expect(typeof r.rows[0]?.v).toBe("string");
    expect(r.rows[0]?.v).toBe("12345678901234.56");
  });
});
