// Lista de créditos (CA-10, CA-13, DT-5): filtro, ordenação, busca e paginação no servidor.
import type Big from "big.js";
import { compararInstantes } from "./datas.js";
import { somar } from "./dinheiro.js";
import { CAMINHOS_CREDITO } from "./saldo.js";
import { nomeOrigem } from "./tabelas.js";
import type { NotaCredito } from "./tipos.js";

export const POR_PAGINA = 100;

export interface ConsultaLista {
  pa?: string;
  documento?: number;
  /** CNPJ, raiz, `nao-identificado` ou `propria-empresa`. */
  emitente?: string;
  pendente: boolean;
  /** Trecho da chave, em maiúsculas. */
  busca?: string;
  ordem: "emissao" | "aApropriar";
  sentido: "asc" | "desc";
  pagina: number;
}

export interface LinhaLista extends NotaCredito {
  /** "origem: <nome>" quando a origem não é normal. */
  marcaOrigem?: string;
}

export interface ResultadoLista {
  linhas: LinhaLista[];
  totalNotas: number;
  totalPaginas: number;
  pagina: number;
  /** Total a apropriar de todo o filtro, não só da página. */
  totalAApropriar: Big;
}

export function lerConsulta(params: URLSearchParams): { consulta: ConsultaLista; avisos: string[] } {
  const avisos: string[] = [];
  const texto = (nome: string) => params.get(nome) ?? "";

  const pa = /^(0[1-9]|1[0-2])\/\d{4}$/.test(texto("pa")) ? texto("pa") : undefined;
  const documento = /^\d{1,3}$/.test(texto("documento")) ? parseInt(texto("documento"), 10) : undefined;
  const emitenteBruto = texto("emitente");
  const emitente =
    emitenteBruto === "nao-identificado" || emitenteBruto === "propria-empresa"
      ? emitenteBruto
      : /^[A-Za-z0-9]{8,14}$/.test(emitenteBruto)
        ? emitenteBruto.toUpperCase()
        : undefined;

  let busca: string | undefined;
  const buscaBruta = texto("busca");
  if (buscaBruta !== "") {
    if (/^[A-Za-z0-9]{4,50}$/.test(buscaBruta)) busca = buscaBruta.toUpperCase();
    else avisos.push("A busca foi ignorada: use de 4 a 50 letras ou dígitos da chave, sem outros símbolos.");
  }

  const ordem = texto("ordem") === "aApropriar" ? "aApropriar" : "emissao";
  const sentido = texto("sentido") === "asc" ? "asc" : "desc";
  const pagina = /^\d+$/.test(texto("pagina")) ? Math.max(1, parseInt(texto("pagina"), 10)) : 1;

  return { consulta: { pa, documento, emitente, pendente: texto("pendente") === "1", busca, ordem, sentido, pagina }, avisos };
}

const aApropriarDe = (n: NotaCredito): Big => n.valores[CAMINHOS_CREDITO.aApropriar] ?? somar([]);

function confere(n: NotaCredito, c: ConsultaLista): boolean {
  if (c.pa !== undefined && n.pa !== c.pa) return false;
  if (c.documento !== undefined && n.documento !== c.documento) return false;
  if (c.pendente && !aApropriarDe(n).gt(0)) return false;
  if (c.busca !== undefined && !n.chave.toUpperCase().includes(c.busca)) return false;
  if (c.emitente !== undefined) {
    const e = n.emitente.emitente;
    if (c.emitente === "nao-identificado") return e.tipo === "nao-identificado";
    if (c.emitente === "propria-empresa") return e.tipo === "propria-empresa";
    if (e.numero === undefined) return false;
    return e.numero === c.emitente || (c.emitente.length === 8 && e.documento === "cnpj" && e.numero.startsWith(c.emitente));
  }
  return true;
}

export function listarCreditos(notas: NotaCredito[], c: ConsultaLista): ResultadoLista {
  const filtradas = notas.filter((n) => confere(n, c));
  const direcao = c.sentido === "asc" ? 1 : -1;
  filtradas.sort((a, b) => {
    const porCampo = c.ordem === "emissao" ? compararInstantes(a.emissao, b.emissao) : aApropriarDe(a).cmp(aApropriarDe(b));
    if (porCampo !== 0) return porCampo * direcao;
    return a.chave < b.chave ? -1 : a.chave > b.chave ? 1 : 0;
  });

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const pagina = Math.min(c.pagina, totalPaginas);
  const linhas = filtradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA).map(
    (n): LinhaLista => ({ ...n, marcaOrigem: n.origem === 0 ? undefined : `origem: ${nomeOrigem(n.origem) ?? `código ${n.origem} (sem nome na tabela)`}` }),
  );
  return { linhas, totalNotas: filtradas.length, totalPaginas, pagina, totalAApropriar: somar(filtradas.map(aApropriarDe)) };
}
