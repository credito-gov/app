// Instantes da API (ISO 8601 UTC), datas de nota (AAAA-MM-DD) e períodos (AAAA-MM) para a tela (CA-23).
// Os instantes saem sempre no fuso de São Paulo, qualquer que seja o fuso do navegador.

const INSTANTE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const DATA = /^(\d{4})-(\d{2})-(\d{2})$/;
const PERIODO = /^(\d{4})-(\d{2})$/;

const FORMATADOR = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** `2026-11-26T15:05:00.000Z` vira `26/11/2026 às 12:05`. */
export function formatarInstante(iso: string): string {
  if (typeof iso !== "string" || !INSTANTE.test(iso)) throw new Error("Instante fora do formato ISO 8601.");
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error("Instante inválido.");
  const p = Object.fromEntries(FORMATADOR.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p["day"]}/${p["month"]}/${p["year"]} às ${p["hour"]}:${p["minute"]}`;
}

/** `2026-11-21` vira `21/11/2026`, só por texto. */
export function formatarData(data: string): string {
  const m = typeof data === "string" ? DATA.exec(data) : null;
  if (!m) throw new Error("Data fora do formato AAAA-MM-DD.");
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** `2026-11` vira `11/2026`. */
export function formatarPeriodo(periodo: string): string {
  const m = typeof periodo === "string" ? PERIODO.exec(periodo) : null;
  if (!m) throw new Error("Período fora do formato AAAA-MM.");
  return `${m[2]}/${m[1]}`;
}
