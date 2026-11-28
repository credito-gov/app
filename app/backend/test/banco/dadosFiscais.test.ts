// Migração 0002 (dados fiscais): segurança por linha, chaves compostas, CHECK, permissões,
// numeric(20,2), down e transação interna (CA-20, CA-23, CA-24, CA-26; AD-6).
import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { Kysely, PostgresDialect, sql, type Transaction } from "kysely";
import { Migrator, type MigrationProvider } from "kysely/migration";
import pg from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { abrirKysely } from "../../src/banco/conexao.js";
import type { Esquema } from "../../src/banco/esquema.js";
import { criarBanco } from "../../src/banco/transacao.js";
import { VALOR_LONGO } from "../apoio/valores.js";
import { abrirComoMigracao, limparTabelas, semear } from "./limpar.js";
import { URL_APP, URL_MIGRACAO, URL_SUPER } from "./urls.js";

const A = randomUUID();
const B = randomUUID();
const TABELAS_NOVAS = ["consulta", "arquivo_bruto", "credito_lido", "debito_lido"];
const SHA = "a".repeat(64);
const AGORA = "2026-11-26T12:00:00Z";

let migracao: Kysely<Esquema>;
let app: Kysely<Esquema>;

type Ids = { consulta: string; arquivo: string };

async function comoApp<T>(empresas: string[] | null, fn: (trx: Transaction<Esquema>) => Promise<T>): Promise<T> {
  return app.transaction().execute(async (trx) => {
    if (empresas) await sql`select set_config('app.empresas', ${`{${empresas.join(",")}}`}, true)`.execute(trx);
    return fn(trx);
  });
}

async function inserirConsulta(trx: Transaction<Esquema>, empresa: string): Promise<string> {
  const id = randomUUID();
  await sql`insert into consulta (id, empresa_id, servico, estado, criada_em, concluida_em, finalizada_em)
    values (${id}, ${empresa}, 'creditos', 'lida', ${AGORA}, ${AGORA}, ${AGORA})`.execute(trx);
  return id;
}

async function inserirArquivo(trx: Transaction<Esquema>, empresa: string, consulta: string): Promise<string> {
  const id = randomUUID();
  await sql`insert into arquivo_bruto (id, empresa_id, consulta_id, servico, recebido_em, tamanho, sha256, situacao, versao_leitor)
    values (${id}, ${empresa}, ${consulta}, 'creditos', ${AGORA}, 10, ${SHA}, 'aceito', '033.1')`.execute(trx);
  return id;
}

async function inserirCredito(
  trx: Transaction<Esquema>,
  empresa: string,
  arquivo: string,
  apurado: string | null = "10.00",
): Promise<void> {
  await sql`insert into credito_lido (empresa_id, arquivo_id, pa, chave, documento, origem, apurado)
    values (${empresa}, ${arquivo}, '11/2026', ${"k".repeat(44)}, 55, 0, ${apurado})`.execute(trx);
}

async function inserirDebito(trx: Transaction<Esquema>, empresa: string, arquivo: string): Promise<void> {
  await sql`insert into debito_lido (empresa_id, arquivo_id, pa, chave, documento, origem, apurado)
    values (${empresa}, ${arquivo}, '11/2026', ${"k".repeat(44)}, 55, 0, '5.00')`.execute(trx);
}

async function semearEmpresas(): Promise<void> {
  await semear(migracao, [A, B], async (trx) => {
    await sql`insert into empresa (id, cnpj_raiz, nome) values
      (${A}, '11111111', 'Comércio Exemplo Ltda.'), (${B}, '22222222', 'Indústria Exemplo S.A.')`.execute(trx);
  });
}

/** Uma consulta, um arquivo, um crédito e um débito para a empresa. */
async function semearFiscal(empresa: string): Promise<Ids> {
  return semear(migracao, [empresa], async (trx) => {
    const consulta = await inserirConsulta(trx, empresa);
    const arquivo = await inserirArquivo(trx, empresa, consulta);
    await inserirCredito(trx, empresa, arquivo);
    await inserirDebito(trx, empresa, arquivo);
    return { consulta, arquivo };
  });
}

beforeAll(() => {
  migracao = abrirComoMigracao();
  app = abrirKysely(URL_APP);
});
afterAll(async () => {
  await app?.destroy();
  await migracao?.destroy();
});
beforeEach(async () => {
  await limparTabelas(migracao);
  await semearEmpresas();
});

describe("segurança por linha nas quatro tabelas (AD-6)", () => {
  test("com A fixada, nenhuma linha de B volta", async () => {
    await semearFiscal(A);
    await semearFiscal(B);
    for (const t of TABELAS_NOVAS) {
      const r = await comoApp([A], (trx) => sql<{ empresa_id: string }>`select empresa_id from ${sql.table(t)}`.execute(trx));
      expect(r.rows.length, t).toBeGreaterThan(0);
      expect(
        r.rows.every((x) => x.empresa_id === A),
        t,
      ).toBe(true);
    }
  });

  test("sem empresa fixada, as quatro voltam vazias", async () => {
    await semearFiscal(A);
    for (const t of TABELAS_NOVAS) {
      const r = await comoApp(null, (trx) => sql<{ n: string }>`select count(*)::text as n from ${sql.table(t)}`.execute(trx));
      expect(r.rows[0]?.n, t).toBe("0");
    }
  });

  test("INSERT em credito_lido com empresa_id de B, com A fixada, falha", async () => {
    const { arquivo } = await semearFiscal(A);
    await expect(comoApp([A], (trx) => inserirCredito(trx, B, arquivo))).rejects.toMatchObject({ code: "42501" });
  });

  test("INSERT em consulta de B, com A fixada, falha", async () => {
    await expect(comoApp([A], (trx) => inserirConsulta(trx, B))).rejects.toMatchObject({ code: "42501" });
  });

  test("o papel de trabalho grava na empresa fixada", async () => {
    const id = await comoApp([A], (trx) => inserirConsulta(trx, A));
    const r = await comoApp([A], (trx) => sql`select id from consulta where id = ${id}`.execute(trx));
    expect(r.rows).toHaveLength(1);
  });
});

describe("catálogo (CA-37 da 034)", () => {
  test("as quatro tabelas aparecem na descoberta por empresa_id, com RLS, FORCE e regra", async () => {
    const cols = await sql<{ table_name: string }>`
      select table_name from information_schema.columns
      where table_schema = 'public' and column_name = 'empresa_id'`.execute(migracao);
    const tabelas = new Set(cols.rows.map((r) => r.table_name));
    for (const t of TABELAS_NOVAS) {
      expect(tabelas.has(t), t).toBe(true);
      const c = await sql<{ relrowsecurity: boolean; relforcerowsecurity: boolean }>`
        select relrowsecurity, relforcerowsecurity from pg_class where oid = ${`public.${t}`}::regclass`.execute(migracao);
      expect(c.rows[0], t).toEqual({ relrowsecurity: true, relforcerowsecurity: true });
      const p = await sql<{ n: string }>`
        select count(*)::text as n from pg_policies where schemaname = 'public' and tablename = ${t}`.execute(migracao);
      expect(Number(p.rows[0]?.n), t).toBeGreaterThanOrEqual(1);
    }
  });

  test("as tabelas novas pertencem a creditogov_migracao", async () => {
    const r = await sql<{ tablename: string; tableowner: string }>`
      select tablename, tableowner from pg_tables where schemaname = 'public' and tablename = any (${TABELAS_NOVAS})`.execute(migracao);
    expect(r.rows.map((x) => x.tablename).sort()).toEqual([...TABELAS_NOVAS].sort());
    for (const t of r.rows) expect(t.tableowner, t.tablename).toBe("creditogov_migracao");
  });
});

describe("chaves estrangeiras compostas", () => {
  test("arquivo_bruto de A ligado a consulta de B é recusado", async () => {
    // consulta de B sem arquivo: a recusa tem de vir da chave composta, não da unicidade
    const consultaB = await semear(migracao, [B], (trx) => inserirConsulta(trx, B));
    await expect(semear(migracao, [A, B], (trx) => inserirArquivo(trx, A, consultaB))).rejects.toMatchObject({ code: "23503" });
  });

  test("credito_lido de A ligado a arquivo_bruto de B é recusado", async () => {
    const { arquivo: arquivoB } = await semearFiscal(B);
    await expect(semear(migracao, [A, B], (trx) => inserirCredito(trx, A, arquivoB))).rejects.toMatchObject({ code: "23503" });
  });

  test("debito_lido de A ligado a arquivo_bruto de B é recusado", async () => {
    const { arquivo: arquivoB } = await semearFiscal(B);
    await expect(semear(migracao, [A, B], (trx) => inserirDebito(trx, A, arquivoB))).rejects.toMatchObject({ code: "23503" });
  });
});

describe("CHECK (AD-9)", () => {
  const consultaCom = (estado: string, concluida: string | null, finalizada: string | null) =>
    semear(migracao, [A], async (trx) => {
      await sql`insert into consulta (empresa_id, servico, estado, criada_em, concluida_em, finalizada_em)
        values (${A}, 'creditos', ${estado}, ${AGORA}, ${concluida}, ${finalizada})`.execute(trx);
    });

  test("lida exige concluida_em e finalizada_em", async () => {
    await expect(consultaCom("lida", null, AGORA)).rejects.toMatchObject({ code: "23514" });
    await expect(consultaCom("lida", AGORA, null)).rejects.toMatchObject({ code: "23514" });
    await expect(consultaCom("lida", AGORA, AGORA)).resolves.toBeUndefined();
  });

  test("estado de erro exige finalizada_em", async () => {
    for (const e of ["erro", "expirada", "credencial_invalida", "servico_indisponivel", "aberta_sem_tiquete"]) {
      await expect(consultaCom(e, null, null), e).rejects.toMatchObject({ code: "23514" });
      await expect(consultaCom(e, null, AGORA), e).resolves.toBeUndefined();
    }
  });

  test("estados em andamento não exigem horários", async () => {
    for (const e of ["agendada", "abrindo", "aberta", "concluida", "baixada"]) {
      await expect(consultaCom(e, null, null), e).resolves.toBeUndefined();
    }
  });

  test("estado fora da lista da AD-9 e serviço fora da lista são recusados", async () => {
    await expect(consultaCom("qualquer", null, null)).rejects.toMatchObject({ code: "23514" });
    await expect(
      semear(migracao, [A], (trx) =>
        sql`insert into consulta (empresa_id, servico, estado, criada_em) values (${A}, 'outro', 'agendada', ${AGORA})`.execute(trx),
      ),
    ).rejects.toMatchObject({ code: "23514" });
  });

  const arquivoCom = (situacao: string, motivo: string | null) =>
    semear(migracao, [A], async (trx) => {
      const consulta = await inserirConsulta(trx, A);
      await sql`insert into arquivo_bruto (empresa_id, consulta_id, servico, recebido_em, tamanho, sha256, situacao, motivo_recusa, versao_leitor)
        values (${A}, ${consulta}, 'creditos', ${AGORA}, 10, ${SHA}, ${situacao}, ${motivo}, '033.1')`.execute(trx);
    });

  test("recusado exige motivo_recusa; aceito não pode ter", async () => {
    await expect(arquivoCom("recusado", null)).rejects.toMatchObject({ code: "23514" });
    await expect(arquivoCom("aceito", "ilegivel")).rejects.toMatchObject({ code: "23514" });
    await expect(arquivoCom("aceito_com_divergencia", "ilegivel")).rejects.toMatchObject({ code: "23514" });
    await expect(arquivoCom("recusado", "ilegivel")).resolves.toBeUndefined();
    for (const m of ["fora_do_schema", "outra_empresa", "valor_fora_do_limite"]) {
      await expect(arquivoCom("recusado", m), m).resolves.toBeUndefined();
    }
    await expect(arquivoCom("recusado", "motivo_inventado")).rejects.toMatchObject({ code: "23514" });
    await expect(arquivoCom("situacao_inventada", null)).rejects.toMatchObject({ code: "23514" });
  });

  test("consulta_id repetido em arquivo_bruto é recusado", async () => {
    const { consulta } = await semearFiscal(A);
    await expect(semear(migracao, [A], (trx) => inserirArquivo(trx, A, consulta))).rejects.toMatchObject({ code: "23505" });
  });
});

describe("permissões do papel de trabalho (CA-26)", () => {
  test("creditogov_app tem SELECT e INSERT e não tem UPDATE nem DELETE nas quatro tabelas", async () => {
    const r = await sql<{ table_name: string; privilege_type: string }>`
      select table_name, privilege_type from information_schema.role_table_grants
      where grantee = 'creditogov_app' and table_schema = 'public' and table_name = any (${TABELAS_NOVAS})`.execute(migracao);
    for (const t of TABELAS_NOVAS) {
      const privilegios = r.rows
        .filter((x) => x.table_name === t)
        .map((x) => x.privilege_type)
        .sort();
      expect(privilegios, t).toEqual(["INSERT", "SELECT"]);
    }
  });

  test("UPDATE e DELETE são negados na prática", async () => {
    await semearFiscal(A);
    await expect(comoApp([A], (trx) => sql`update consulta set estado = 'erro'`.execute(trx))).rejects.toMatchObject({ code: "42501" });
    await expect(comoApp([A], (trx) => sql`delete from credito_lido`.execute(trx))).rejects.toMatchObject({ code: "42501" });
  });
});

describe("numeric(20,2) (CA-23)", () => {
  test("o valor longo volta como texto igual e o campo não gravado volta null", async () => {
    const { arquivo } = await semearFiscal(A);
    await comoApp([A], (trx) => inserirCredito(trx, A, arquivo, VALOR_LONGO));
    const linhas = await comoApp([A], (trx) =>
      trx.selectFrom("credito_lido").select(["apurado", "a_apropriar"]).where("apurado", "=", VALOR_LONGO).execute(),
    );
    expect(linhas).toHaveLength(1);
    expect(typeof linhas[0]?.apurado).toBe("string");
    expect(linhas[0]?.apurado).toBe(VALOR_LONGO);
    expect(linhas[0]?.a_apropriar).toBeNull();
  });

  test("a coluna é numeric(20,2)", async () => {
    const r = await sql<{ t: string }>`select data_type || '(' || numeric_precision || ',' || numeric_scale || ')' as t
      from information_schema.columns where table_name = 'credito_lido' and column_name = 'apurado'`.execute(migracao);
    expect(r.rows[0]?.t).toBe("numeric(20,2)");
  });
});

describe("down da 0002", () => {
  test("as quatro tabelas somem e as da 0001 continuam", async () => {
    const nome = `creditogov_teste_down_${Date.now()}`;
    const urlMigracao = new URL(URL_MIGRACAO);
    urlMigracao.pathname = `/${nome}`;
    const su = new pg.Client({ connectionString: URL_SUPER });
    await su.connect();
    await su.query(`CREATE DATABASE ${nome} OWNER creditogov_migracao`);
    await su.query(`GRANT CONNECT ON DATABASE ${nome} TO creditogov_app`);
    const db = new Kysely<unknown>({
      dialect: new PostgresDialect({ pool: new pg.Pool({ connectionString: urlMigracao.toString(), max: 1 }) }),
    });
    try {
      const inicial = await import("../../src/banco/migracoes/0001_inicial.js");
      const fiscal = await import("../../src/banco/migracoes/0002_dados_fiscais.js");
      const provider: MigrationProvider = {
        async getMigrations() {
          return { "0001_inicial": inicial, "0002_dados_fiscais": fiscal };
        },
      };
      const m = new Migrator({ db, provider });
      expect((await m.migrateToLatest()).error).toBeUndefined();
      const existem = async () =>
        (await sql<{ tablename: string }>`select tablename from pg_tables where schemaname = 'public'`.execute(db)).rows.map(
          (r) => r.tablename,
        );
      expect(await existem()).toEqual(expect.arrayContaining(TABELAS_NOVAS));
      expect((await m.migrateDown()).error).toBeUndefined();
      const depois = await existem();
      for (const t of TABELAS_NOVAS) expect(depois, t).not.toContain(t);
      expect(depois).toEqual(expect.arrayContaining(["empresa", "usuario", "vinculo_empresa", "convite", "sessao"]));
    } finally {
      await db.destroy();
      await su.query(`DROP DATABASE IF EXISTS ${nome} WITH (FORCE)`);
      await su.end();
    }
  }, 60_000);
});

describe("transação interna (naEmpresaFixada, no lugar de naEmpresaInterna)", () => {
  test("vê só a empresa fixada e não fixa usuário", async () => {
    await semearFiscal(A);
    await semearFiscal(B);
    const banco = criarBanco(app);
    const r = await banco.naEmpresaFixada(A, async (trx) => {
      const consultas = await sql<{ empresa_id: string }>`select empresa_id from consulta`.execute(trx);
      const usuario = await sql<{ u: string | null }>`select app_usuario()::text as u`.execute(trx);
      return { consultas: consultas.rows, usuario: usuario.rows[0]?.u };
    });
    expect(r.consultas.length).toBeGreaterThan(0);
    expect(r.consultas.every((c) => c.empresa_id === A)).toBe(true);
    expect(r.usuario).toBeNull();
  });

  test("nenhum arquivo de src/api/ usa naEmpresaFixada", () => {
    const raiz = join(import.meta.dirname, "..", "..", "src", "api");
    const achados: string[] = [];
    const varrer = (pasta: string) => {
      for (const nome of readdirSync(pasta)) {
        const c = join(pasta, nome);
        if (statSync(c).isDirectory()) varrer(c);
        else if (readFileSync(c, "utf8").includes("naEmpresaFixada")) achados.push(c);
      }
    };
    varrer(raiz);
    expect(achados).toEqual([]);
  });
});

describe("limpeza do banco de teste", () => {
  test("limparTabelas esvazia as quatro tabelas novas", async () => {
    await semearFiscal(A);
    await limparTabelas(migracao);
    await semearEmpresas();
    for (const t of TABELAS_NOVAS) {
      const r = await semear(migracao, [A, B], (trx) => sql<{ n: string }>`select count(*)::text as n from ${sql.table(t)}`.execute(trx));
      expect(r.rows[0]?.n, t).toBe("0");
    }
  });
});
