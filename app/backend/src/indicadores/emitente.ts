// Origem: app/painel/src/nucleo/emitente.ts (commit 39e4fae da main; AD-14), sem o recolhimento: a API de
// recolhimentos responde 404 e o emitente sai só da chave (CA-7, D-4).
// Emitente de uma nota de crédito pela chave de 44 posições (fontes F-A a F-E da Spec da 030).
// As posições (emitente 7-20, modelo 21-22, série 23-25, DV 44) são derivadas da ordem e do tamanho dos campos.
// Função pura: sem acesso a banco, servidor nem ambiente.

export interface Emitente {
  tipo: "identificado" | "propria-empresa" | "nao-identificado";
  documento?: "cnpj" | "cpf";
  numero?: string;
  fonte?: "chave";
  rotulo?: string;
  /** Só quando não identificado. */
  motivo?: string;
}

export const ROTULO_CNPJ_CHAVE = "CNPJ do emitente, lido da chave da nota";
export const ROTULO_CPF_CHAVE = "CPF do emitente, lido da chave da nota";

export const MOTIVOS = {
  semLeiaute: "leiaute da chave deste tipo de documento sem fonte registrada",
  formato: "chave fora do leiaute de 44 posições",
  modelo: "modelo na chave diverge do tipo de documento",
  digito: "dígito verificador da chave inválido",
  avulsa: "nota fiscal avulsa: a chave traz o CNPJ do fisco",
  serieCpf: "série de emitente CPF sem CPF na chave",
  serieNfce: "série sem regra confirmada para NFC-e",
  cte: "CT-e com CPF ou CNPJ não distinguível pela chave",
} as const;

const DOCUMENTOS_COM_LEIAUTE = new Set([55, 57, 62, 65]);
const FORMATO_CHAVE = /^[0-9]{6}[A-Z0-9]{12}[0-9]{26}$/;

function naoIdentificado(motivo: string, fonte?: "chave"): Emitente {
  return { tipo: "nao-identificado", motivo, fonte };
}

/** Módulo 11, pesos de 2 a 9 da direita para a esquerda, caractere convertido por ASCII menos 48 (F-A 2.2.6.2; F-D item 5). */
function digitoDaChave(base43: string): string {
  let soma = 0;
  let peso = 2;
  for (let i = base43.length - 1; i >= 0; i--) {
    soma += (base43.charCodeAt(i) - 48) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const resto = soma % 11;
  return String(resto < 2 ? 0 : 11 - resto);
}

function cnpj(numero: string, fonte: "chave", raiz: string | undefined): Emitente {
  return {
    tipo: raiz !== undefined && numero.slice(0, 8) === raiz ? "propria-empresa" : "identificado",
    documento: "cnpj",
    numero,
    fonte,
    rotulo: ROTULO_CNPJ_CHAVE,
  };
}

/** Emitente lido só da chave da nota. */
export function lerChave(chave: string, documento: number, raizEmpresa?: string): Emitente {
  if (!DOCUMENTOS_COM_LEIAUTE.has(documento)) return naoIdentificado(MOTIVOS.semLeiaute);
  if (!FORMATO_CHAVE.test(chave)) return naoIdentificado(MOTIVOS.formato);
  if (chave.slice(20, 22) !== String(documento)) return naoIdentificado(MOTIVOS.modelo);
  if (chave[43] !== digitoDaChave(chave.slice(0, 43))) return naoIdentificado(MOTIVOS.digito);

  // Série de três dígitos (o formato já foi conferido): comparada como texto, sem converter para número.
  const serie = chave.slice(22, 25);
  const posicoes7a20 = chave.slice(6, 20);
  if (documento === 55) {
    if (serie >= "890" && serie <= "899") return naoIdentificado(MOTIVOS.avulsa);
    if (serie >= "910") {
      if (posicoes7a20.startsWith("000") && /^\d{11}$/.test(posicoes7a20.slice(3))) {
        return { tipo: "identificado", documento: "cpf", numero: posicoes7a20.slice(3), fonte: "chave", rotulo: ROTULO_CPF_CHAVE };
      }
      return naoIdentificado(MOTIVOS.serieCpf);
    }
  }
  if (documento === 65 && serie >= "890") return naoIdentificado(MOTIVOS.serieNfce);
  if (documento === 57 && posicoes7a20.startsWith("000")) return naoIdentificado(MOTIVOS.cte);
  return cnpj(posicoes7a20, "chave", raizEmpresa);
}

/** AA.AAA.AAA/AAAA-DD, com as letras como vierem. */
export function formatarCnpj(numero: string): string {
  return `${numero.slice(0, 2)}.${numero.slice(2, 5)}.${numero.slice(5, 8)}/${numero.slice(8, 12)}-${numero.slice(12, 14)}`;
}

/** DDD.DDD.DDD-DD. */
export function formatarCpf(numero: string): string {
  return `${numero.slice(0, 3)}.${numero.slice(3, 6)}.${numero.slice(6, 9)}-${numero.slice(9, 11)}`;
}

/** Texto do emitente com a identificação formatada, para as páginas. */
export function formatarEmitente(e: Emitente): string {
  if (e.tipo === "nao-identificado" || e.numero === undefined) return "emitente não identificado";
  return e.documento === "cpf" ? formatarCpf(e.numero) : formatarCnpj(e.numero);
}
