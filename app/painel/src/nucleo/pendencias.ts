// Pendências (CA-14, CA-15, DT-9): notas com valor a apropriar, agrupadas pelo emitente. Não diz o motivo da pendência.
import type Big from "big.js";
import { percentual, somar } from "./dinheiro.js";
import { formatarEmitente, type Emitente } from "./emitente.js";
import { CAMINHOS_CREDITO } from "./saldo.js";
import type { NotaCredito } from "./tipos.js";

export interface GrupoPendencia {
  /** `cnpj-<número>`, `cpf-<número>`, `nao-identificado` ou `propria-empresa`. */
  id: string;
  rotulo: string;
  emitente?: Emitente;
  /** Como o emitente foi identificado, uma vez por fonte: o grupo pode juntar notas do recolhimento e da chave. */
  rotulos: string[];
  quantidade: number;
  total: Big;
  notas: NotaCredito[];
}

export interface Pendencias {
  grupos: GrupoPendencia[];
  /** Notas com valor a apropriar negativo (possíveis pela D-6), para a soma da tela fechar. */
  negativas: { quantidade: number; total: Big; notas: NotaCredito[] };
  /** Total a apropriar do CA-7. */
  totalAApropriar: Big;
  /** Soma dos grupos e da linha de negativos. */
  somaGrupos: Big;
  confere: boolean;
  /** Percentual do total a apropriar em "emitente não identificado"; traço se o total for zero. */
  percentualNaoIdentificado: string;
}

export const ROTULO_NAO_IDENTIFICADO = "emitente não identificado";
export const ROTULO_PROPRIA_EMPRESA = "emitida pela própria empresa";

const aApropriar = (n: NotaCredito) => n.valores[CAMINHOS_CREDITO.aApropriar];

export function agruparPendencias(todas: NotaCredito[]): Pendencias {
  const grupos = new Map<string, GrupoPendencia>();
  const novo = (id: string, rotulo: string, emitente?: Emitente): GrupoPendencia => ({ id, rotulo, emitente, rotulos: [], quantidade: 0, total: somar([]), notas: [] });
  grupos.set("nao-identificado", novo("nao-identificado", ROTULO_NAO_IDENTIFICADO));
  grupos.set("propria-empresa", novo("propria-empresa", ROTULO_PROPRIA_EMPRESA));
  const negativas = novo("negativas", "notas com valor a apropriar negativo");

  for (const nota of todas) {
    const valor = aApropriar(nota);
    if (valor === undefined || valor.eq(0)) continue;
    const alvo = valor.lt(0) ? negativas : grupoDe(grupos, nota, novo);
    alvo.quantidade++;
    alvo.total = alvo.total.plus(valor);
    alvo.notas.push(nota);
    const rotuloFonte = nota.emitente.emitente.rotulo;
    if (alvo.emitente !== undefined && rotuloFonte !== undefined && !alvo.rotulos.includes(rotuloFonte)) alvo.rotulos.push(rotuloFonte);
  }

  const lista = [...grupos.values()].sort((a, b) => b.total.cmp(a.total) || b.quantidade - a.quantidade || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const totalAApropriar = somar(todas.map(aApropriar));
  const somaGrupos = somar([...lista.map((g) => g.total), negativas.total]);
  return {
    grupos: lista,
    negativas: { quantidade: negativas.quantidade, total: negativas.total, notas: negativas.notas },
    totalAApropriar,
    somaGrupos,
    confere: somaGrupos.eq(totalAApropriar),
    percentualNaoIdentificado: percentual(grupos.get("nao-identificado")!.total, totalAApropriar),
  };
}

function grupoDe(grupos: Map<string, GrupoPendencia>, nota: NotaCredito, novo: (id: string, rotulo: string, e?: Emitente) => GrupoPendencia): GrupoPendencia {
  const e = nota.emitente.emitente;
  if (e.tipo === "nao-identificado" || e.numero === undefined) return grupos.get("nao-identificado")!;
  if (e.tipo === "propria-empresa") return grupos.get("propria-empresa")!;
  const id = `${e.documento}-${e.numero}`;
  let g = grupos.get(id);
  if (!g) {
    g = novo(id, formatarEmitente(e), e);
    grupos.set(id, g);
  }
  return g;
}
