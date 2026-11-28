// Empresas do usuário (CA-29, CA-30). A empresa é mostrada com a raiz do CNPJ formatada.
import type { Papel } from "../banco/esquema.js";
import type { Trx } from "../banco/transacao.js";

export interface EmpresaDto {
  id: string;
  nome: string;
  cnpjRaiz: string;
  cnpjRaizFormatado: string;
  papel: Papel;
}

/** `11111111` vira `11.111.111`. */
export function formatarCnpjRaiz(raiz: string): string {
  return `${raiz.slice(0, 2)}.${raiz.slice(2, 5)}.${raiz.slice(5, 8)}`;
}

const colacao = new Intl.Collator("pt-BR");

/** Só as empresas com vínculo ativo do usuário, por nome. Roda dentro de naCarteira. */
export async function listarEmpresas(trx: Trx, usuarioId: string): Promise<EmpresaDto[]> {
  const linhas = await trx
    .selectFrom("empresa")
    .innerJoin("vinculo_empresa", "vinculo_empresa.empresa_id", "empresa.id")
    .select(["empresa.id", "empresa.nome", "empresa.cnpj_raiz", "vinculo_empresa.papel"])
    .where("vinculo_empresa.usuario_id", "=", usuarioId)
    .where("vinculo_empresa.removido_em", "is", null)
    .execute();
  return linhas
    .map((l) => ({
      id: l.id,
      nome: l.nome,
      cnpjRaiz: l.cnpj_raiz,
      cnpjRaizFormatado: formatarCnpjRaiz(l.cnpj_raiz),
      papel: l.papel,
    }))
    .sort((a, b) => colacao.compare(a.nome, b.nome));
}
