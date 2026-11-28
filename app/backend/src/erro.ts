// Texto de erro para o terminal do operador (npm run admin, migrar, subida da API).
// Nunca vai para o log da API nem para a resposta HTTP: lá só entram tipo e código.

/** `name`, `code` e `message` do erro; aceita qualquer valor lançado. */
export function descreverErro(e: unknown): string {
  if (!(e instanceof Error)) return `Erro: ${String(e)}`;
  const code = (e as { code?: unknown }).code;
  const partes = [`tipo: ${e.name}`];
  if (code !== undefined) partes.push(`codigo: ${String(code)}`);
  const mensagem = e.message || (e instanceof AggregateError ? e.errors.map((x) => String(x?.message ?? x)).join("; ") : "");
  if (mensagem) partes.push(`mensagem: ${mensagem}`);
  return partes.join(", ");
}
