import type Big from "big.js";
import { exibirData } from "../nucleo/datas.js";
import { formatarReais } from "../nucleo/dinheiro.js";

/** 12345678 vira 12.345.678. */
export function raizFormatada(raiz: string): string {
  return `${raiz.slice(0, 2)}.${raiz.slice(2, 5)}.${raiz.slice(5, 8)}`;
}

export const reais = (v: Big): string => formatarReais(v);

export const dataHora = (texto: string | undefined): string => (texto === undefined ? "—" : exibirData(texto));

export function arquivos(quantidade: number): string {
  if (quantidade === 0) return "nenhum arquivo";
  return quantidade === 1 ? "1 arquivo" : `${quantidade} arquivos`;
}

export const TEXTO_SO_DOS_ARQUIVOS = "A visão é só a dos arquivos lidos. A Receita não fornece histórico por esta API.";
