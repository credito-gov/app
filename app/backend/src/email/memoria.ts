import type { EnvioEmail, Mensagem } from "./tipos.js";

export interface EnvioEmailMemoria extends EnvioEmail {
  readonly mensagens: Mensagem[];
}

/** Guarda as mensagens num vetor que os testes leem. */
export function criarEmailMemoria(): EnvioEmailMemoria {
  const mensagens: Mensagem[] = [];
  return {
    mensagens,
    async enviar(mensagem) {
      mensagens.push({ ...mensagem });
    },
  };
}
