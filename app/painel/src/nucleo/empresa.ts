// Empresa (CA-3): a comparação é pela raiz do CNPJ, os 8 primeiros dígitos de `ni`.
import type { ArquivoLido } from "./arquivos.js";

/** Raiz de um `ni` de 8 ou 14 dígitos; null se não for nenhum dos dois. */
export function raizDe(ni: string): string | null {
  return /^(\d{8}|\d{14})$/.test(ni) ? ni.slice(0, 8) : null;
}

export interface GrupoEmpresa {
  raiz: string;
  arquivos: string[];
}

export interface ResultadoEmpresa {
  /** A raiz da empresa; ausente sem arquivo aceito ou com conflito. */
  raiz?: string;
  conflito: boolean;
  /** Arquivos aceitos agrupados por raiz, em ordem de raiz. */
  grupos: GrupoEmpresa[];
}

/** Só arquivos aceitos (com ou sem divergência) entram na comparação. */
export function verificarEmpresa(arquivos: ArquivoLido[]): ResultadoEmpresa {
  const porRaiz = new Map<string, string[]>();
  for (const a of arquivos) {
    if ((a.situacao !== "aceito" && a.situacao !== "aceito-com-divergencia") || !a.raiz) continue;
    const lista = porRaiz.get(a.raiz) ?? [];
    lista.push(a.nome);
    porRaiz.set(a.raiz, lista);
  }
  const grupos = [...porRaiz.entries()]
    .map(([raiz, nomes]) => ({ raiz, arquivos: nomes.sort() }))
    .sort((x, y) => (x.raiz < y.raiz ? -1 : x.raiz > y.raiz ? 1 : 0));
  if (grupos.length === 1) return { raiz: grupos[0].raiz, conflito: false, grupos };
  return { conflito: grupos.length > 1, grupos };
}
