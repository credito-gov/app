// Consolidação (CA-4, CA-D1, D-5, DT-7): cada crédito, débito ou item de recolhimento conta uma vez.
import type Big from "big.js";
import type { ArquivoLido } from "./arquivos.js";
import { compararInstantes } from "./datas.js";
import { valor } from "./dinheiro.js";

interface Objeto {
  [chave: string]: unknown;
}

/** Crédito ou débito, com os valores de `cbs` achatados por caminho (por exemplo, `cbs.apropriacao.aApropriar`). */
export interface Nota {
  pa: string;
  chave: string;
  documento: number;
  origem: number;
  emissao: string;
  registro: string;
  atualizacao: string;
  /** Só os campos que vieram no arquivo; ausente não está no mapa. */
  valores: Record<string, Big>;
  arquivo: string;
  geradoEm: string;
}

export interface ItemRecolhimento {
  dataArrecadacao: string;
  numeroDARF: string;
  sequencial: number;
  pa: string;
  vencimento: string;
  niFornecedor: string;
  chaveDFE?: string;
  principal: Big;
  multa: Big;
  juros: Big;
  total: Big;
  arquivo: string;
  geradoEm: string;
}

function achatar(valorLido: unknown, caminho: string, saida: Record<string, Big>): void {
  if (typeof valorLido === "string") {
    saida[caminho] = valor(valorLido);
  } else if (valorLido !== null && typeof valorLido === "object") {
    for (const [k, v] of Object.entries(valorLido)) achatar(v, `${caminho}.${k}`, saida);
  }
}

function aceito(a: ArquivoLido, servico: string): boolean {
  return a.servico === servico && (a.situacao === "aceito" || a.situacao === "aceito-com-divergencia") && a.dados !== undefined;
}

/** Positivo se `a` vence `b`: atualização, depois geradoEm do arquivo, depois nome de arquivo. */
function venceNota(a: Nota, b: Nota): boolean {
  const porAtualizacao = compararInstantes(a.atualizacao, b.atualizacao);
  if (porAtualizacao !== 0) return porAtualizacao > 0;
  const porGeracao = compararInstantes(a.geradoEm, b.geradoEm);
  if (porGeracao !== 0) return porGeracao > 0;
  return a.arquivo > b.arquivo;
}

function mesAno(pa: string): string {
  return `${pa.slice(3)}-${pa.slice(0, 2)}`;
}

export function consolidarNotas(arquivos: ArquivoLido[], servico: "creditos" | "debitos"): { notas: Nota[]; substituidas: number } {
  const campo = servico === "creditos" ? "creditos" : "debitos";
  const vencedoras = new Map<string, Nota>();
  let substituidas = 0;
  for (const a of arquivos) {
    if (!aceito(a, servico)) continue;
    const dados = a.dados as Objeto;
    for (const bloco of (dados.apuracao as Objeto[] | undefined) ?? []) {
      for (const item of (bloco[campo] as Objeto[] | undefined) ?? []) {
        const valores: Record<string, Big> = {};
        achatar(item.cbs, "cbs", valores);
        const nota: Nota = {
          pa: bloco.pa as string,
          chave: item.chave as string,
          documento: parseInt(item.documento as string, 10),
          origem: parseInt(item.origem as string, 10),
          emissao: item.emissao as string,
          registro: item.registro as string,
          atualizacao: item.atualizacao as string,
          valores,
          arquivo: a.nome,
          geradoEm: a.geradoEm ?? "",
        };
        const identidade = `${nota.pa}|${nota.chave}|${nota.documento}|${nota.origem}`;
        const atual = vencedoras.get(identidade);
        if (!atual) {
          vencedoras.set(identidade, nota);
          continue;
        }
        substituidas++;
        if (venceNota(nota, atual)) vencedoras.set(identidade, nota);
      }
    }
  }
  const notas = [...vencedoras.values()].sort((x, y) => {
    const porPeriodo = mesAno(x.pa).localeCompare(mesAno(y.pa));
    return porPeriodo !== 0 ? porPeriodo : x.chave < y.chave ? -1 : x.chave > y.chave ? 1 : 0;
  });
  return { notas, substituidas };
}

function venceItem(a: ItemRecolhimento, b: ItemRecolhimento): boolean {
  const porGeracao = compararInstantes(a.geradoEm, b.geradoEm);
  if (porGeracao !== 0) return porGeracao > 0;
  return a.arquivo > b.arquivo;
}

export function consolidarRecolhimentos(arquivos: ArquivoLido[]): { itens: ItemRecolhimento[]; substituidos: number } {
  const vencedores = new Map<string, ItemRecolhimento>();
  let substituidos = 0;
  for (const a of arquivos) {
    if (!aceito(a, "recolhimentos")) continue;
    const dados = a.dados as Objeto;
    for (const dia of (dados.apuracao as Objeto[] | undefined) ?? []) {
      for (const pagamento of (dia.pagamentos as Objeto[] | undefined) ?? []) {
        for (const c of (pagamento.composicao as Objeto[] | undefined) ?? []) {
          const item: ItemRecolhimento = {
            dataArrecadacao: dia.dataArrecadacao as string,
            numeroDARF: pagamento.numeroDARF as string,
            sequencial: parseInt(c.sequencial as string, 10),
            pa: c.pa as string,
            vencimento: c.vencimento as string,
            niFornecedor: c.niFornecedor as string,
            chaveDFE: c.chaveDFE as string | undefined,
            principal: valor(c.principal as string),
            multa: valor(c.multa as string),
            juros: valor(c.juros as string),
            total: valor(c.total as string),
            arquivo: a.nome,
            geradoEm: a.geradoEm ?? "",
          };
          const identidade = `${item.numeroDARF}|${item.sequencial}`;
          const atual = vencedores.get(identidade);
          if (!atual) {
            vencedores.set(identidade, item);
            continue;
          }
          substituidos++;
          if (venceItem(item, atual)) vencedores.set(identidade, item);
        }
      }
    }
  }
  const itens = [...vencedores.values()].sort((x, y) =>
    x.numeroDARF === y.numeroDARF ? x.sequencial - y.sequencial : x.numeroDARF < y.numeroDARF ? -1 : 1,
  );
  return { itens, substituidos };
}
