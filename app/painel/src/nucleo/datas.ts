// Exibição e comparação de datas a partir do texto do arquivo, sem objeto Date e sem conversão de fuso para exibir.

export interface PartesData {
  ano: string;
  mes: string;
  dia: string;
  hora: string;
  minuto: string;
  segundo: string;
  /** Dígitos da fração de segundo, como vieram (pode ser vazio). */
  fracao: string;
  /** Fuso como veio: "Z" ou "+hh:mm" / "-hh:mm". */
  fuso: string;
}

const PADRAO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2})$/;
const PADRAO_DIA = /^(\d{4})-(\d{2})-(\d{2})$/;

function diaValido(ano: number, mes: number, dia: number): boolean {
  if (mes < 1 || mes > 12 || dia < 1) return false;
  const limite = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return dia <= limite;
}

/** Quebra a data em partes; null se não for uma data-hora válida. */
export function analisarData(texto: string): PartesData | null {
  const m = PADRAO.exec(texto);
  if (!m) return null;
  const [, ano, mes, dia, hora, minuto, segundo, fracao = "", fuso] = m;
  if (!diaValido(parseInt(ano, 10), parseInt(mes, 10), parseInt(dia, 10))) return null;
  if (parseInt(hora, 10) > 23 || parseInt(minuto, 10) > 59 || parseInt(segundo, 10) > 59) return null;
  if (fuso !== "Z" && (parseInt(fuso.slice(1, 3), 10) > 23 || parseInt(fuso.slice(4, 6), 10) > 59)) return null;
  return { ano, mes, dia, hora, minuto, segundo, fracao, fuso };
}

/** dd/mm/aaaa hh:mm (fuso do arquivo). A hora é a do arquivo. */
export function exibirData(texto: string): string {
  const p = analisarData(texto);
  if (!p) return "data inválida";
  return `${p.dia}/${p.mes}/${p.ano} ${p.hora}:${p.minuto} (${p.fuso === "Z" ? "UTC" : p.fuso})`;
}

/** dd/mm/aaaa, para datas só com o dia (aaaa-mm-dd). */
export function exibirDia(texto: string): string {
  const m = PADRAO_DIA.exec(texto);
  if (!m || !diaValido(parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10))) return "data inválida";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** Instante em nanossegundos desde 1970-01-01T00:00Z; null se a data for inválida. */
export function instante(texto: string): bigint | null {
  const p = analisarData(texto);
  if (!p) return null;
  const ms = Date.UTC(parseInt(p.ano, 10), parseInt(p.mes, 10) - 1, parseInt(p.dia, 10), parseInt(p.hora, 10), parseInt(p.minuto, 10), parseInt(p.segundo, 10));
  let ns = BigInt(ms) * 1_000_000n + BigInt(p.fracao.padEnd(9, "0"));
  // A fração é de segundo inteiro: Date.UTC já trouxe o segundo, a fração soma só os nanossegundos.
  if (p.fuso !== "Z") {
    const sinal = p.fuso.startsWith("-") ? -1n : 1n;
    const minutos = BigInt(parseInt(p.fuso.slice(1, 3), 10) * 60 + parseInt(p.fuso.slice(4, 6), 10));
    ns -= sinal * minutos * 60n * 1_000_000_000n;
  }
  return ns;
}

/** -1, 0 ou 1. Data inválida vale menos que qualquer data válida. */
export function compararInstantes(a: string, b: string): -1 | 0 | 1 {
  const x = instante(a);
  const y = instante(b);
  if (x === null && y === null) return 0;
  if (x === null) return -1;
  if (y === null) return 1;
  return x < y ? -1 : x > y ? 1 : 0;
}
