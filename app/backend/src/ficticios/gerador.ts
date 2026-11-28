// Gerador de retornos fictícios no formato oficial (CA-26). Determinístico: a mesma semente e o mesmo
// instante de referência dão o mesmo conteúdo. Não lê disco, rede nem variável de ambiente, e não
// pergunta a hora: o relógio chega por parâmetro.
//
// Imita a forma observada nos arquivos reais (O-3 a O-16, O-18 a O-25), sem nenhum dado real:
// cerca de 900 créditos em 9 períodos (quase todos num só), documentos 55, 57, 62, 65 e 91
// (perto de 15% de 91, com chave de 50 posições), cerca de 99% com valor a apropriar, apropriado
// igual a utilizado, saldoCredor presente e zero, uma nota da própria empresa, débitos em 3 períodos
// e campo zerado ausente. Todo CNPJ de 14 dígitos tem o DV errado de propósito; o DV da chave é certo.
import { cnpjInvalidoDe, dvChave } from "./dv.js";

const HORA = 60 * 60_000;
const DIA = 24 * HORA;

export interface ParametrosGerador {
  /** Raiz do CNPJ da empresa (8 dígitos). */
  raiz: string;
  semente: number;
  /** Instante em que o arquivo foi gerado (`geradoEm`). Nenhuma data do arquivo passa dele. */
  ref: Date;
}

/** Número JSON escrito como texto, para controlar 0, 1 ou 2 casas decimais. */
class Num {
  constructor(readonly texto: string) {}
}

/** Uma nota (crédito ou débito) pronta para serializar. */
export interface NotaGerada {
  pa: string;
  origem: number;
  documento: number;
  chave: string;
  emissao: string;
  registro: string;
  atualizacao: string;
  /** Valores em centavos por caminho dentro de `cbs`; zero fica ausente (exceto saldoCredor e saldoDevedor). */
  cbs: Record<string, number>;
  /** Para o retorno inválido de propósito (cenário recusado). */
  semChave?: boolean;
}

export type Aleatorio = () => number;

/** mulberry32. */
export function aleatorio(semente: number): Aleatorio {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const inteiro = (r: Aleatorio, min: number, max: number): number => min + Math.floor(r() * (max - min + 1));
const digitos = (r: Aleatorio, n: number): string => Array.from({ length: n }, () => String(inteiro(r, 0, 9))).join("");

/** Data e hora com o fuso -03:00, como a Receita escreve. */
export function formatarData(d: Date): string {
  return `${new Date(d.getTime() - 3 * HORA).toISOString().slice(0, 23)}-03:00`;
}

function texto(centavos: number, casas: 0 | 1 | 2): string {
  const negativo = centavos < 0;
  const c = Math.abs(centavos);
  const reais = Math.floor(c / 100);
  const resto = c % 100;
  const fracao = casas === 0 ? "" : casas === 1 ? `.${Math.floor(resto / 10)}` : `.${String(resto).padStart(2, "0")}`;
  return `${negativo ? "-" : ""}${reais}${fracao}`;
}

/** Escreve o valor com 0, 1 ou 2 casas (o valor é arredondado para essas casas), como nos arquivos reais. */
function numero(r: Aleatorio, centavos: number): { num: Num; centavos: number } {
  const sorteio = r();
  const casas: 0 | 1 | 2 = sorteio < 0.25 ? 0 : sorteio < 0.4 ? 1 : 2;
  const arredondado = casas === 0 ? Math.round(centavos / 100) * 100 : casas === 1 ? Math.round(centavos / 10) * 10 : centavos;
  const final = arredondado === 0 ? 100 : arredondado;
  return { num: new Num(texto(final, casas)), centavos: final };
}

function serializarValor(valor: unknown): string {
  if (valor instanceof Num) return valor.texto;
  if (Array.isArray(valor)) return `[${valor.map(serializarValor).join(",")}]`;
  if (valor !== null && typeof valor === "object") {
    const entradas = Object.entries(valor).filter(([, v]) => v !== undefined);
    return `{${entradas.map(([k, v]) => `${JSON.stringify(k)}: ${serializarValor(v)}`).join(",")}}`;
  }
  return JSON.stringify(valor);
}

export const NI_DA_EMPRESA = (raiz: string): string => cnpjInvalidoDe(`${raiz}0001`);

/** Texto de um número JSON a partir de centavos, com a forma que o arquivo real teria. */
function numeroDe(c: number): Num {
  // Valores já escolhidos: duas casas, sem zeros à direita desnecessários nos inteiros.
  return new Num(c % 100 === 0 ? texto(c, 0) : c % 10 === 0 ? texto(c, 1) : texto(c, 2));
}

function montarCbsDeCredito(cbs: Record<string, number>): Record<string, unknown> {
  const v = (c: string) => (cbs[c] === undefined ? undefined : numeroDe(cbs[c]));
  const utilizacao = {
    inutilizavel: v("inutilizavel"),
    utilizado: v("utilizado"),
    restabelecido: v("restabelecido"),
    naoUtilizado: { saldoCredor: new Num("0"), pedidoRessarcimento: v("pedidoRessarcimento") },
  };
  if (cbs["saldoCredor"] !== undefined && cbs["saldoCredor"] !== 0) utilizacao.naoUtilizado.saldoCredor = numeroDe(cbs["saldoCredor"]);
  return {
    excedente: v("excedente"),
    apurado: v("apurado"),
    apropriacao: {
      inapropriavel: v("inapropriavel"),
      suspenso: v("suspenso"),
      prescrito: v("prescrito"),
      aApropriar: v("aApropriar"),
      apropriado: v("apropriado"),
      utilizacao,
    },
  };
}

function montarCbsDeDebito(cbs: Record<string, number>): Record<string, unknown> {
  const v = (c: string) => (cbs[c] === undefined ? undefined : numeroDe(cbs[c]));
  return {
    excedente: v("excedente"),
    apurado: v("apurado"),
    inexigivel: v("inexigivel"),
    suspenso: v("suspenso"),
    pgtoAntecipado: v("pgtoAntecipado"),
    extinto: v("extinto"),
    saldoDevedor: cbs["saldoDevedor"] === undefined ? new Num("0") : numeroDe(cbs["saldoDevedor"]),
  };
}

export interface CabecalhoRetorno {
  raiz: string;
  ref: Date;
  tiquete: string;
  /** Outra raiz de empresa, para o retorno recusado de propósito. */
  raizDoNi?: string;
}

/** Serializa um retorno de créditos ou de débitos no formato oficial. */
export function serializarRetorno(servico: "creditos" | "debitos", cab: CabecalhoRetorno, notas: NotaGerada[]): Uint8Array {
  const porPa = new Map<string, NotaGerada[]>();
  for (const n of notas) porPa.set(n.pa, [...(porPa.get(n.pa) ?? []), n]);
  const apuracao = [...porPa.entries()].map(([pa, lista]) => ({
    pa,
    [servico]: lista.map((n) => ({
      origem: n.origem,
      documento: n.documento,
      chave: n.semChave ? undefined : n.chave,
      emissao: n.emissao,
      registro: n.registro,
      atualizacao: n.atualizacao,
      cbs: servico === "creditos" ? montarCbsDeCredito(n.cbs) : montarCbsDeDebito(n.cbs),
    })),
  }));
  const ni = NI_DA_EMPRESA(cab.raizDoNi ?? cab.raiz);
  const objeto = {
    tiqueteSolicitacao: cab.tiquete,
    ni,
    niConsumidor: ni,
    geradoEm: formatarData(cab.ref),
    apuracao,
  };
  return new TextEncoder().encode(serializarValor(objeto));
}

/** Retorno com `apuracao` vazia (cenário vazio). */
export function serializarVazio(cab: CabecalhoRetorno): Uint8Array {
  return serializarRetorno("creditos", cab, []);
}

interface Periodo {
  ano: number;
  mes: number;
}

function periodos(ref: Date, quantidade: number): Periodo[] {
  return Array.from({ length: quantidade }, (_, k) => {
    const d = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() - k, 1));
    return { ano: d.getUTCFullYear(), mes: d.getUTCMonth() + 1 };
  });
}

const rotuloPa = (p: Periodo): string => `${String(p.mes).padStart(2, "0")}/${p.ano}`;

const UFS = ["35", "33", "41", "43", "31"];

function chaveDe(r: Aleatorio, documento: number, emissao: Date, emitente: string, sequencia: number): string {
  if (documento === 91) return `${String(sequencia).padStart(8, "0")}${digitos(r, 42)}`;
  const aamm = `${String(emissao.getUTCFullYear() % 100).padStart(2, "0")}${String(emissao.getUTCMonth() + 1).padStart(2, "0")}`;
  const base =
    UFS[inteiro(r, 0, UFS.length - 1)]! +
    aamm +
    emitente +
    String(documento) +
    String(inteiro(r, 1, 5)).padStart(3, "0") +
    String(sequencia).padStart(9, "0") +
    "1" +
    digitos(r, 8);
  return base + dvChave(base);
}

function sortearDocumento(r: Aleatorio): number {
  const x = r();
  return x < 0.15 ? 91 : x < 0.27 ? 57 : x < 0.33 ? 62 : x < 0.45 ? 65 : 55;
}

/** Pool de emitentes fictícios: nenhum tem a raiz da empresa, e todos têm o DV do CNPJ errado. */
function poolDeEmitentes(r: Aleatorio, raiz: string, quantidade: number): string[] {
  const pool: string[] = [];
  while (pool.length < quantidade) {
    const base = digitos(r, 8);
    if (base === raiz || pool.some((e) => e.startsWith(base))) continue;
    pool.push(cnpjInvalidoDe(`${base}0001`));
  }
  return pool;
}

/** Datas de uma nota de um período: emissão, registro e atualização, nunca depois de `ref`. */
function datasDe(r: Aleatorio, p: Periodo, ref: Date): { emissao: Date; registro: Date; atualizacao: Date } {
  const doMesCorrente = p.ano === ref.getUTCFullYear() && p.mes === ref.getUTCMonth() + 1;
  const diaMax = doMesCorrente ? Math.max(1, ref.getUTCDate() - 1) : 28;
  const emissao = new Date(Date.UTC(p.ano, p.mes - 1, inteiro(r, 1, diaMax), inteiro(r, 8, 14), inteiro(r, 0, 59), inteiro(r, 0, 59)));
  const registro = new Date(emissao.getTime() + 5 * 60_000 + inteiro(r, 0, 999));
  const teto = ref.getTime() - HORA;
  const piso = Math.min(Math.max(registro.getTime() + HORA, ref.getTime() - 20 * DIA), teto);
  const atualizacao = new Date(piso + Math.floor(r() * Math.max(0, teto - piso)));
  return { emissao, registro, atualizacao };
}

/** Valor base de uma nota, em centavos: de poucos reais a alguns milhares. */
function valorBase(r: Aleatorio): number {
  return Math.max(100, Math.round(Math.pow(10, 0.5 + r() * 3.3) * 100));
}

/**
 * Créditos de volume (cenário completo): cerca de `quantidade` notas em 9 períodos, mais da metade no mais recente.
 * Uma delas é emitida pela própria raiz da empresa.
 */
export function gerarCreditos(p: ParametrosGerador, quantidade = 900): NotaGerada[] {
  const r = aleatorio(p.semente);
  const pool = poolDeEmitentes(r, p.raiz, 120);
  const meses = periodos(p.ref, 9);
  const propria = cnpjInvalidoDe(`${p.raiz}0002`);
  const notas: NotaGerada[] = [];
  for (let i = 0; i < quantidade; i++) {
    const sorteio = r();
    const periodo = sorteio < 0.62 ? meses[0]! : meses[1 + Math.floor(((sorteio - 0.62) / 0.38) * 8)]!;
    const documento = i === 17 ? 55 : sortearDocumento(r);
    const { emissao, registro, atualizacao } = datasDe(r, periodo, p.ref);
    const emitente = i === 17 ? propria : pool[Math.floor(Math.pow(r(), 2.2) * pool.length)]!;
    const chave = chaveDe(r, documento, emissao, emitente, i + 1);

    const apurado = numero(r, valorBase(r));
    const cbs: Record<string, number> = { apurado: apurado.centavos, saldoCredor: 0 };
    if (r() < 0.99) cbs["aApropriar"] = apurado.centavos;
    const ja = r();
    if (ja < 0.25) {
      const parte = Math.max(100, Math.round((apurado.centavos * (0.2 + r() * 0.6)) / 100) * 100);
      cbs["apropriado"] = parte;
      cbs["utilizado"] = parte;
    } else if (ja < 0.3) {
      cbs["apropriado"] = Math.max(100, Math.round(apurado.centavos / 200) * 100);
    }
    notas.push({ pa: rotuloPa(periodo), origem: 0, documento, chave, emissao: formatarData(emissao), registro: formatarData(registro), atualizacao: formatarData(atualizacao), cbs });
  }
  return notas;
}

/** Débitos de volume: notas de venda em 3 períodos, emitidas pela própria empresa. */
export function gerarDebitos(p: ParametrosGerador, quantidade = 300): NotaGerada[] {
  const r = aleatorio(p.semente + 1000);
  const meses = periodos(p.ref, 3);
  const propria = cnpjInvalidoDe(`${p.raiz}0001`);
  const notas: NotaGerada[] = [];
  for (let i = 0; i < quantidade; i++) {
    const sorteio = r();
    const periodo = sorteio < 0.6 ? meses[0]! : sorteio < 0.85 ? meses[1]! : meses[2]!;
    const documento = r() < 0.7 ? 55 : 65;
    const { emissao, registro, atualizacao } = datasDe(r, periodo, p.ref);
    const apurado = valorBase(r);
    const cbs: Record<string, number> = { apurado };
    let extinto = 0;
    if (r() < 0.5) {
      extinto = Math.max(100, Math.round((apurado * (0.1 + r() * 0.4)) / 100) * 100);
      cbs["extinto"] = extinto;
    }
    if (apurado - extinto !== 0) cbs["saldoDevedor"] = apurado - extinto;
    notas.push({
      pa: rotuloPa(periodo),
      origem: 0,
      documento,
      chave: chaveDe(r, documento, emissao, propria, i + 1),
      emissao: formatarData(emissao),
      registro: formatarData(registro),
      atualizacao: formatarData(atualizacao),
      cbs,
    });
  }
  return notas;
}

/**
 * Versões novas de algumas notas (D-5): a mesma identidade, com `atualizacao` mais recente e valor mudado.
 * `ref` é o instante do arquivo novo.
 */
export function versoesNovas(notas: NotaGerada[], ref: Date, quantidade: number, semente: number): NotaGerada[] {
  const r = aleatorio(semente);
  const passo = Math.max(1, Math.floor(notas.length / quantidade));
  const novas: NotaGerada[] = [];
  for (let i = 0; i < notas.length && novas.length < quantidade; i += passo) {
    const base = notas[i]!;
    const cbs = { ...base.cbs };
    if (cbs["aApropriar"] !== undefined) {
      cbs["aApropriar"] = cbs["aApropriar"] + 100 * inteiro(r, 1, 50);
      cbs["apurado"] = Math.max(cbs["apurado"] ?? 0, cbs["aApropriar"]);
    }
    const ate = ref.getTime() - HORA;
    const de = Math.max(Date.parse(base.atualizacao), ref.getTime() - 7 * DIA) + HORA;
    novas.push({ ...base, cbs, atualizacao: formatarData(new Date(Math.min(ate, de + Math.floor(r() * Math.max(0, ate - de))))) });
  }
  return novas;
}

/** Nota feita à mão, para os cenários com valores raros. */
export function notaEspecial(
  p: ParametrosGerador,
  sequencia: number,
  opcoes: { origem?: number; documento?: number; periodo?: number; cbs: Record<string, number> },
): NotaGerada {
  const r = aleatorio(p.semente + 5000 + sequencia);
  const pool = poolDeEmitentes(r, p.raiz, 1);
  const periodo = periodos(p.ref, 3)[opcoes.periodo ?? 0]!;
  const { emissao, registro, atualizacao } = datasDe(r, periodo, p.ref);
  const documento = opcoes.documento ?? 55;
  return {
    pa: rotuloPa(periodo),
    origem: opcoes.origem ?? 0,
    documento,
    chave: chaveDe(r, documento, emissao, pool[0]!, 900_000 + sequencia),
    emissao: formatarData(emissao),
    registro: formatarData(registro),
    atualizacao: formatarData(atualizacao),
    cbs: { saldoCredor: 0, ...opcoes.cbs },
  };
}
