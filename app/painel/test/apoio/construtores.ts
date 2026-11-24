// Monta, nos testes, arquivos de retorno fictícios no formato oficial. Nada aqui é dado real.
import { cnpjInvalidoDe } from "./dv.js";

/** Número JSON escrito como texto, para controlar 0, 1 ou 2 casas decimais. */
export class Num {
  constructor(readonly texto: string) {}
}
export const n = (texto: string): Num => new Num(texto);

type Obj = Record<string, unknown>;

export function serializar(valor: unknown, nivel = 0): string {
  const recuo = "  ".repeat(nivel + 1);
  const fecha = "  ".repeat(nivel);
  if (valor instanceof Num) return valor.texto;
  if (Array.isArray(valor)) {
    if (valor.length === 0) return "[]";
    return `[\n${valor.map((v) => recuo + serializar(v, nivel + 1)).join(",\n")}\n${fecha}]`;
  }
  if (valor !== null && typeof valor === "object") {
    const entradas = Object.entries(valor).filter(([, v]) => v !== undefined);
    if (entradas.length === 0) return "{}";
    return `{\n${entradas.map(([k, v]) => `${recuo}${JSON.stringify(k)}: ${serializar(v, nivel + 1)}`).join(",\n")}\n${fecha}}`;
  }
  return JSON.stringify(valor);
}

export function bytes(valor: unknown): Uint8Array {
  return new TextEncoder().encode(serializar(valor));
}

// Empresa fictícia: raiz de 8 dígitos e CNPJ de 14 com dígito verificador propositalmente errado.
export const RAIZ = "90817263";
export const NI14 = cnpjInvalidoDe(`${RAIZ}0001`);
export const OUTRA_RAIZ = "55443322";
export const NI14_OUTRA = cnpjInvalidoDe(`${OUTRA_RAIZ}0001`);

export const GERADO = "2026-11-20T10:15:30.000-03:00";

export interface CreditoOpts {
  pa?: string;
  origem?: number;
  documento?: number;
  chave?: string;
  emissao?: string;
  registro?: string;
  atualizacao?: string;
  apurado?: string;
  aApropriar?: string;
  apropriado?: string;
  utilizado?: string;
  saldoCredor?: string;
  /** Campos extras de cbs.apropriacao (suspenso, prescrito...) ou de cbs (excedente). */
  extras?: Obj;
}

/** Um crédito. Os campos zerados ficam ausentes, como na Receita; saldoCredor vem sempre (padrão 0). */
export function credito(o: CreditoOpts = {}): Obj {
  const apropriacao: Obj = {
    aApropriar: o.aApropriar === undefined ? undefined : n(o.aApropriar),
    apropriado: o.apropriado === undefined ? undefined : n(o.apropriado),
    ...((o.extras?.["apropriacao"] as Obj | undefined) ?? {}),
    utilizacao: {
      utilizado: o.utilizado === undefined ? undefined : n(o.utilizado),
      naoUtilizado: { saldoCredor: n(o.saldoCredor ?? "0") },
    },
  };
  return {
    origem: o.origem ?? 0,
    documento: o.documento ?? 55,
    chave: o.chave ?? "FICT-0001",
    emissao: o.emissao ?? "2026-11-02T10:00:00.000-03:00",
    registro: o.registro ?? "2026-11-02T10:05:00.123456-03:00",
    atualizacao: o.atualizacao ?? "2026-11-18T08:00:00-03:00",
    cbs: {
      ...((o.extras?.["cbs"] as Obj | undefined) ?? {}),
      apurado: n(o.apurado ?? o.aApropriar ?? "10.00"),
      apropriacao,
    },
  };
}

export interface DebitoOpts {
  pa?: string;
  origem?: number;
  documento?: number;
  chave?: string;
  emissao?: string;
  registro?: string;
  atualizacao?: string;
  apurado?: string;
  extinto?: string;
  saldoDevedor?: string;
}

export function debito(o: DebitoOpts = {}): Obj {
  return {
    origem: o.origem ?? 0,
    documento: o.documento ?? 55,
    chave: o.chave ?? "FICT-D-0001",
    emissao: o.emissao ?? "2026-11-02T10:00:00.000-03:00",
    registro: o.registro ?? "2026-11-02T10:05:00.123-03:00",
    atualizacao: o.atualizacao ?? "2026-11-18T08:00:00-03:00",
    cbs: {
      apurado: n(o.apurado ?? "10.00"),
      extinto: o.extinto === undefined ? undefined : n(o.extinto),
      saldoDevedor: n(o.saldoDevedor ?? o.apurado ?? "10.00"),
    },
  };
}

export interface CabecalhoOpts {
  ni?: string;
  niConsumidor?: string;
  geradoEm?: string;
  tiquete?: string;
}

function cabecalho(o: CabecalhoOpts, padraoTiquete: string): Obj {
  const ni = o.ni ?? NI14;
  return {
    tiqueteSolicitacao: o.tiquete ?? padraoTiquete,
    ni,
    niConsumidor: o.niConsumidor ?? ni,
    geradoEm: o.geradoEm ?? GERADO,
  };
}

/** `periodos`: pares [pa, créditos]. */
export function arquivoCreditos(periodos: Array<[string, Obj[]]>, o: CabecalhoOpts = {}): Obj {
  return {
    ...cabecalho(o, "FICTCRED"),
    apuracao: periodos.map(([pa, creditos]) => ({ pa, creditos })),
  };
}

export function arquivoDebitos(periodos: Array<[string, Obj[]]>, o: CabecalhoOpts = {}): Obj {
  return {
    ...cabecalho(o, "FICTDEB"),
    apuracao: periodos.map(([pa, debitos]) => ({ pa, debitos })),
  };
}

export interface ItemRecolhimentoOpts {
  sequencial?: number;
  pa?: string;
  vencimento?: string;
  niFornecedor?: string;
  chaveDFE?: string;
  principal?: string;
  multa?: string;
  juros?: string;
  total?: string;
}

export function itemRecolhimento(o: ItemRecolhimentoOpts = {}): Obj {
  return {
    sequencial: o.sequencial ?? 1,
    pa: o.pa ?? "11/2026",
    vencimento: o.vencimento ?? "2026-12-20",
    niFornecedor: o.niFornecedor ?? cnpjInvalidoDe("112233440001"),
    chaveDFE: o.chaveDFE,
    principal: n(o.principal ?? "100.00"),
    multa: n(o.multa ?? "0"),
    juros: n(o.juros ?? "0"),
    total: n(o.total ?? o.principal ?? "100.00"),
  };
}

/** `dias`: [dataArrecadacao, [[numeroDARF, itens]]]. */
export function arquivoRecolhimentos(dias: Array<[string, Array<[string, Obj[]]>]>, o: CabecalhoOpts = {}): Obj {
  return {
    ...cabecalho(o, "FICTRECO"),
    apuracao: dias.map(([dataArrecadacao, darfs]) => ({
      dataArrecadacao,
      pagamentos: darfs.map(([numeroDARF, composicao]) => ({ numeroDARF, tipo: 1, composicao })),
    })),
  };
}

/** Dígito verificador da chave: módulo 11, pesos 2 a 9 da direita para a esquerda, ASCII − 48. Implementação própria do teste. */
export function dvChave(base43: string): string {
  let soma = 0;
  let peso = 2;
  for (let i = base43.length - 1; i >= 0; i--) {
    soma += (base43.charCodeAt(i) - 48) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const resto = soma % 11;
  return String(resto < 2 ? 0 : 11 - resto);
}

export interface ChaveOpts {
  uf?: string;
  aamm?: string;
  /** 14 posições (CNPJ, CPF precedido de zeros, ou CNPJ com letras). */
  emitente: string;
  modelo?: string;
  serie?: string;
  numero?: string;
  tpEmis?: string;
  codigo?: string;
}

/** Chave de 44 posições com DV correto, a menos que `dv` force outro. UF 99 por padrão (fora da tabela de UFs). */
export function montarChave(o: ChaveOpts, dv?: string): string {
  const base =
    (o.uf ?? "99") +
    (o.aamm ?? "2611") +
    o.emitente +
    (o.modelo ?? "55") +
    (o.serie ?? "001") +
    (o.numero ?? "000000001") +
    (o.tpEmis ?? "1") +
    (o.codigo ?? "12345678");
  if (base.length !== 43) throw new Error(`chave com ${base.length + 1} posições`);
  return base + (dv ?? dvChave(base));
}
