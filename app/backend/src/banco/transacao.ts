// Única porta da API ao banco (CA-33, CA-35, CA-36). Todas as funções usam
// set_config(..., true): o valor vale só dentro da transação, nunca na sessão.
import { sql, type Kysely, type Transaction } from "kysely";
import type { Esquema, Papel } from "./esquema.js";

export class EmpresaNaoEncontrada extends Error {
  constructor() {
    super("Empresa não encontrada ou sem acesso.");
    this.name = "EmpresaNaoEncontrada";
  }
}

export type Trx = Transaction<Esquema>;

export interface ContextoEmpresa {
  usuarioId: string;
  empresaId: string;
  papel: Papel;
}

export interface Banco {
  /** Fixa só app.usuario_id: vê os vínculos do próprio usuário. */
  naSessaoDoUsuario<T>(usuarioId: string, fn: (trx: Trx) => Promise<T>): Promise<T>;
  /** Confere o vínculo ativo e só então fixa a empresa. Sem vínculo, lança EmpresaNaoEncontrada. */
  naEmpresa<T>(
    usuarioId: string,
    empresaId: string,
    fn: (trx: Trx, ctx: ContextoEmpresa) => Promise<T>,
  ): Promise<T>;
  /** Fixa todas as empresas com vínculo ativo do usuário (carteira do contador). */
  naCarteira<T>(usuarioId: string, fn: (trx: Trx) => Promise<T>): Promise<T>;
  /** Não fixa nada: login, recuperação e o que é autorizado por token. */
  semUsuario<T>(fn: (trx: Trx) => Promise<T>): Promise<T>;
  /** Para convite (DT-6) e `admin`: fixa uma empresa por id, sem usuário. */
  naEmpresaFixada<T>(empresaId: string, fn: (trx: Trx) => Promise<T>): Promise<T>;
  encerrar(): Promise<void>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ehUuid(valor: string): boolean {
  return UUID.test(valor);
}

async function fixar(trx: Trx, nome: string, valor: string): Promise<void> {
  await sql`select set_config(${nome}, ${valor}, true)`.execute(trx);
}

const lista = (ids: string[]): string => `{${ids.join(",")}}`;

export function criarBanco(db: Kysely<Esquema>): Banco {
  return {
    naSessaoDoUsuario(usuarioId, fn) {
      return db.transaction().execute(async (trx) => {
        await fixar(trx, "app.usuario_id", usuarioId);
        return fn(trx);
      });
    },

    naEmpresa(usuarioId, empresaId, fn) {
      return db.transaction().execute(async (trx) => {
        if (!ehUuid(usuarioId) || !ehUuid(empresaId)) throw new EmpresaNaoEncontrada();
        await fixar(trx, "app.usuario_id", usuarioId);
        const vinculo = await trx
          .selectFrom("vinculo_empresa")
          .select("papel")
          .where("empresa_id", "=", empresaId)
          .where("usuario_id", "=", usuarioId)
          .where("removido_em", "is", null)
          .executeTakeFirst();
        if (!vinculo) throw new EmpresaNaoEncontrada();
        await fixar(trx, "app.empresas", lista([empresaId]));
        return fn(trx, { usuarioId, empresaId, papel: vinculo.papel });
      });
    },

    naCarteira(usuarioId, fn) {
      return db.transaction().execute(async (trx) => {
        await fixar(trx, "app.usuario_id", usuarioId);
        const vinculos = await trx
          .selectFrom("vinculo_empresa")
          .select("empresa_id")
          .where("usuario_id", "=", usuarioId)
          .where("removido_em", "is", null)
          .execute();
        await fixar(trx, "app.empresas", lista(vinculos.map((v) => v.empresa_id)));
        return fn(trx);
      });
    },

    semUsuario(fn) {
      return db.transaction().execute((trx) => fn(trx));
    },

    naEmpresaFixada(empresaId, fn) {
      return db.transaction().execute(async (trx) => {
        if (!ehUuid(empresaId)) throw new EmpresaNaoEncontrada();
        await fixar(trx, "app.empresas", lista([empresaId]));
        return fn(trx);
      });
    },

    encerrar() {
      return db.destroy();
    },
  };
}
