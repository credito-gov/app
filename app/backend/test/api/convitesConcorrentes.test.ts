// Dois convites pendentes para o mesmo e-mail e empresa não coexistem (CA-9, CA-10).
import { sql } from "kysely";
import { afterEach, beforeEach, expect, test } from "vitest";
import { criarContexto, type Contexto } from "./ajudas.js";

let ctx: Contexto;
beforeEach(async () => {
  ctx = await criarContexto();
});
afterEach(async () => {
  await ctx.encerrar();
});

async function pendentes(empresa: string): Promise<number> {
  return ctx.migracao.transaction().execute(async (trx) => {
    await sql`select set_config('app.empresas', ${`{${empresa}}`}, true)`.execute(trx);
    const r = await sql<{ n: string }>`select count(*) as n from convite where usado_em is null and invalidado_em is null`.execute(trx);
    return Number(r.rows[0]!.n);
  });
}

test("o banco recusa um segundo convite pendente do mesmo e-mail na mesma empresa", async () => {
  const empresa = await ctx.criarEmpresa("Comércio Exemplo Ltda.", "11111111");
  const inserir = (token: string) =>
    ctx.migracao.transaction().execute(async (trx) => {
      await sql`select set_config('app.empresas', ${`{${empresa}}`}, true)`.execute(trx);
      await sql`insert into convite (empresa_id, email_normalizado, papel, token_hmac, origem, expira_em)
                values (${empresa}, 'novo@exemplo.com.br', 'contador', ${token}, 'equipe', now() + interval '1 day')`.execute(trx);
    });
  await inserir("hmac-um");
  await expect(inserir("hmac-dois")).rejects.toMatchObject({ code: "23505" });
});

test("dois pedidos simultâneos deixam um só convite pendente e nenhum dá erro", async () => {
  const empresa = await ctx.criarEmpresa("Comércio Exemplo Ltda.", "11111111");
  const titular = await ctx.criarUsuario("titular@exemplo.com.br");
  await ctx.vincular(empresa, titular, "titular");
  const cookie = (await ctx.login("titular@exemplo.com.br")).cookie!;
  const pedir = () =>
    ctx.req("POST", `/api/empresas/${empresa}/convites`, {
      cookie,
      corpo: { email: "novo@exemplo.com.br", papel: "contador" },
    });
  const rs = await Promise.all([pedir(), pedir(), pedir()]);
  expect(rs.map((r) => r.status)).toEqual([202, 202, 202]);
  expect(await pendentes(empresa)).toBe(1);
});
