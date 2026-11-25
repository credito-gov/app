// Texto de log de um erro interno: nome, mensagem truncada (pode citar conteúdo de arquivo) e o começo da pilha.
const MAXIMO_MENSAGEM = 200;

export function descreverErro(e: unknown): string {
  if (!(e instanceof Error)) return "erro que não é Error";
  const pilha = (e.stack ?? "").split("\n").slice(1, 6).join("\n");
  const mensagem = e.message.length > MAXIMO_MENSAGEM ? `${e.message.slice(0, MAXIMO_MENSAGEM)}...` : e.message;
  return `${e.name}: ${mensagem}\n${pilha}`;
}

/** Nome do erro para mostrar na tela; nada além do nome. */
export function nomeDoErro(e: unknown): string {
  return e instanceof Error && /^\w+$/.test(e.name) ? e.name : "erro desconhecido";
}
