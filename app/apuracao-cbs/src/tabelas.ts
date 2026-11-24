// Tabelas de códigos das páginas de créditos e débitos (docs da Receita, versão 1.3 de 13/11/2026).

/** documento: tipo do documento fiscal. */
export const NOMES_DOCUMENTO: Readonly<Record<number, string>> = {
  55: "NF-e",
  57: "CT-e",
  62: "NFCOM",
  63: "BP-e",
  64: "GTV-e",
  65: "NFC-e",
  66: "NF3-e",
  67: "CT-e OS",
  91: "NFS-e",
  92: "NFS-e Via",
  93: "BP-e TM",
  94: "DERE",
  97: "CT-e Simplificado",
};

/** origem do crédito ou do débito. */
export const NOMES_ORIGEM: Readonly<Record<number, string>> = {
  0: "NORMAL",
  20: "DEVOLUCAO_POR_PCONT",
  21: "DEVOLUCAO_POR_RAD",
  22: "DEVOLUCAO_POR_CREDITO",
  30: "CANCELAMENTO_CREDITO",
  31: "CANCELAMENTO_RAD",
  32: "CANCELAMENTO_PCONT",
  50: "PERECIMENTO_TRANSPORTE_FOB",
  51: "PERECIMENTO_TRANSPORTE_CIF",
  52: "DEVOLUCAO_PERECIMENTO_TRANSPORTE_CIF_POR_PCONT",
  53: "DEVOLUCAO_PERECIMENTO_TRANSPORTE_CIF_POR_RAD",
  54: "DEVOLUCAO_PERECIMENTO_TRANSPORTE_CIF_POR_CREDITO",
  55: "NOTA_CREDITO_MULTA_JUROS",
};

export interface CodigoNomeado {
  codigo: number;
  nome: string;
}

export function documento(codigo: number): CodigoNomeado {
  return { codigo, nome: NOMES_DOCUMENTO[codigo] ?? "desconhecido" };
}

export function origem(codigo: number): CodigoNomeado {
  return { codigo, nome: NOMES_ORIGEM[codigo] ?? "desconhecida" };
}
