// Monta a visão completa a partir da pasta lida: empresa, consolidação, emitentes, totais, débitos e pendências.
import type { ArquivoLido, ResultadoPasta } from "./arquivos.js";
import { consolidarNotas, consolidarRecolhimentos, type ItemRecolhimento, type Nota } from "./consolidacao.js";
import { compararInstantes } from "./datas.js";
import { calcularTotaisDebitos, type TotaisDebitos } from "./debitos.js";
import { resolverEmitente } from "./emitente.js";
import { verificarEmpresa, type ResultadoEmpresa } from "./empresa.js";
import { agruparPendencias, type Pendencias } from "./pendencias.js";
import { calcularTotais, type Totais, type TotaisPorPeriodo } from "./saldo.js";
import type { NotaCredito } from "./tipos.js";

export interface ResumoServico {
  /** Arquivos aceitos do serviço. */
  arquivos: number;
  geradoEmMaisRecente?: string;
  atualizacaoMinima?: string;
  atualizacaoMaxima?: string;
}

export interface Visao {
  pasta: string;
  legivel: boolean;
  erro?: string;
  codigoErro?: string;
  arquivos: ArquivoLido[];
  empresa: ResultadoEmpresa;
  /** Sem nenhum crédito nos arquivos lidos (CA-6). */
  vazio: boolean;
  notas: NotaCredito[];
  debitos: Nota[];
  recolhimentos: ItemRecolhimento[];
  totais?: { porPeriodo: Array<TotaisPorPeriodo<Totais>>; geral: Totais };
  totaisDebitos?: { porPeriodo: Array<TotaisPorPeriodo<TotaisDebitos>>; geral: TotaisDebitos };
  pendencias?: Pendencias;
  servicos: { creditos: ResumoServico; recolhimentos: ResumoServico; debitos: ResumoServico };
  substituidas: { creditos: number; debitos: number; recolhimentos: number };
  /** Chaves presentes nos débitos (O-25). */
  chavesEmDebitos: Set<string>;
}

const aceito = (a: ArquivoLido) => a.situacao === "aceito" || a.situacao === "aceito-com-divergencia";

function resumo(arquivos: ArquivoLido[], servico: string, notas: Nota[]): ResumoServico {
  const usados = arquivos.filter((a) => a.servico === servico && aceito(a));
  const r: ResumoServico = { arquivos: usados.length };
  for (const a of usados) {
    if (a.geradoEm !== undefined && (r.geradoEmMaisRecente === undefined || compararInstantes(a.geradoEm, r.geradoEmMaisRecente) > 0)) r.geradoEmMaisRecente = a.geradoEm;
  }
  for (const n of notas) {
    if (r.atualizacaoMinima === undefined || compararInstantes(n.atualizacao, r.atualizacaoMinima) < 0) r.atualizacaoMinima = n.atualizacao;
    if (r.atualizacaoMaxima === undefined || compararInstantes(n.atualizacao, r.atualizacaoMaxima) > 0) r.atualizacaoMaxima = n.atualizacao;
  }
  return r;
}

export function montarVisao(pasta: ResultadoPasta): Visao {
  const empresa = verificarEmpresa(pasta.arquivos);
  const usar = pasta.legivel && !empresa.conflito;
  const arquivos = usar ? pasta.arquivos : [];

  const creditos = consolidarNotas(arquivos, "creditos");
  const debitos = consolidarNotas(arquivos, "debitos");
  const recolhimentos = consolidarRecolhimentos(arquivos);

  const notas: NotaCredito[] = creditos.notas.map((n) => ({ ...n, emitente: resolverEmitente(n, recolhimentos.itens, empresa.raiz) }));
  const vazio = notas.length === 0;

  return {
    pasta: pasta.pasta,
    legivel: pasta.legivel,
    erro: pasta.erro,
    codigoErro: pasta.codigoErro,
    arquivos: pasta.arquivos,
    empresa,
    vazio,
    notas,
    debitos: debitos.notas,
    recolhimentos: recolhimentos.itens,
    totais: vazio ? undefined : calcularTotais(notas),
    totaisDebitos: debitos.notas.length === 0 ? undefined : calcularTotaisDebitos(debitos.notas),
    pendencias: vazio ? undefined : agruparPendencias(notas),
    servicos: {
      creditos: resumo(arquivos, "creditos", creditos.notas),
      recolhimentos: resumo(arquivos, "recolhimentos", []),
      debitos: resumo(arquivos, "debitos", debitos.notas),
    },
    substituidas: { creditos: creditos.substituidas, debitos: debitos.substituidas, recolhimentos: recolhimentos.substituidos },
    chavesEmDebitos: new Set(debitos.notas.map((n) => n.chave)),
  };
}
