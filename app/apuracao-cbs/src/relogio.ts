export interface Relogio {
  agora(): Date;
}

export const relogioReal: Relogio = { agora: () => new Date() };

const dois = (n: number): string => String(n).padStart(2, "0");

/** ISO 8601 com o fuso local da máquina (ex.: 2026-11-23T14:25:30.123-03:00). */
export function isoLocal(d: Date): string {
  const deslocamento = -d.getTimezoneOffset();
  const sinal = deslocamento >= 0 ? "+" : "-";
  const abs = Math.abs(deslocamento);
  return (
    `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}` +
    `T${dois(d.getHours())}:${dois(d.getMinutes())}:${dois(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, "0")}` +
    `${sinal}${dois(Math.floor(abs / 60))}:${dois(abs % 60)}`
  );
}
