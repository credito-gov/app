// Origem: app/painel/src/nucleo/consolidacao.ts (commit 39e4fae da main; AD-14), adaptada ao banco (CA-24, D-5).
// Cada nota conta uma vez. A identidade é (pa, chave, documento, origem). Vence a versão com:
//   1. atualizacao mais recente, comparada como instante, com qualquer quantidade de casas de fração (O-15);
//   2. no empate, o arquivo com gerado_em mais recente;
//   3. no empate, o arquivo com recebido_em mais recente;
//   4. persistindo o empate, o arquivo_id maior (no lugar do "nome de arquivo" do painel).
// Só entram arquivos aceito e aceito_com_divergencia. Função pura: sem acesso a banco, servidor nem ambiente.
import { compararInstantes } from "../leitura/datas.js";

/** Nota (crédito ou débito) lida do banco, com os dados do arquivo de onde veio. */
export interface NotaDoBanco {
  arquivoId: string;
  situacaoArquivo: "aceito" | "aceito_com_divergencia" | "recusado";
  geradoEm: string | null;
  recebidoEm: Date;
  pa: string;
  chave: string;
  documento: number;
  origem: number;
  emissao: string | null;
  registro: string | null;
  atualizacao: string | null;
  /** Só os campos que vieram no arquivo, em texto decimal; ausente não está no mapa. */
  valores: Record<string, string>;
}

/** Positivo se `a` vence `b`. */
function vence(a: NotaDoBanco, b: NotaDoBanco): boolean {
  const porAtualizacao = compararInstantes(a.atualizacao ?? "", b.atualizacao ?? "");
  if (porAtualizacao !== 0) return porAtualizacao > 0;
  const porGeracao = compararInstantes(a.geradoEm ?? "", b.geradoEm ?? "");
  if (porGeracao !== 0) return porGeracao > 0;
  if (a.recebidoEm.getTime() !== b.recebidoEm.getTime()) return a.recebidoEm.getTime() > b.recebidoEm.getTime();
  return a.arquivoId > b.arquivoId;
}

/** Mês e ano de `MM/AAAA` como `AAAA-MM`, para ordenar no tempo. */
export function periodoOrdenavel(pa: string): string {
  return `${pa.slice(3)}-${pa.slice(0, 2)}`;
}

/** Uma nota por identidade, em ordem de período e, dentro dele, de chave. */
export function consolidarNotas<T extends NotaDoBanco>(notas: readonly T[]): T[] {
  const vencedoras = new Map<string, T>();
  for (const nota of notas) {
    if (nota.situacaoArquivo === "recusado") continue;
    const identidade = `${nota.pa}|${nota.chave}|${nota.documento}|${nota.origem}`;
    const atual = vencedoras.get(identidade);
    if (!atual || vence(nota, atual)) vencedoras.set(identidade, nota);
  }
  return [...vencedoras.values()].sort((x, y) => {
    const porPeriodo = periodoOrdenavel(x.pa).localeCompare(periodoOrdenavel(y.pa));
    return porPeriodo !== 0 ? porPeriodo : x.chave < y.chave ? -1 : x.chave > y.chave ? 1 : 0;
  });
}
