// Conferência na subida da API e do admin (CA-35): o papel do banco não pode ignorar
// a segurança por linha. Superusuário, BYPASSRLS e dono de tabela passam por cima dela.
import { sql } from "kysely";
import type { Banco } from "./transacao.js";

export class ErroPapel extends Error {
  constructor(motivo: string) {
    super(`O papel do banco não serve para a API: ${motivo}. Use o papel de trabalho (sem a URL na mensagem).`);
    this.name = "ErroPapel";
  }
}

export async function verificarPapelDoBanco(banco: Banco): Promise<void> {
  const r = await banco.semUsuario(async (trx) => {
    const papel = await sql<{ super: boolean; bypass: boolean }>`
      select rolsuper as super, rolbypassrls as bypass from pg_roles where rolname = current_user`.execute(trx);
    const donas = await sql<{ n: string }>`
      select count(*) as n from pg_tables where tableowner = current_user and schemaname = 'public'`.execute(trx);
    return { papel: papel.rows[0], donas: Number(donas.rows[0]?.n ?? 0) };
  });
  if (!r.papel) throw new ErroPapel("papel não encontrado");
  if (r.papel.super) throw new ErroPapel("é superusuário");
  if (r.papel.bypass) throw new ErroPapel("tem BYPASSRLS");
  if (r.donas > 0) throw new ErroPapel("é dono de tabelas");
}
