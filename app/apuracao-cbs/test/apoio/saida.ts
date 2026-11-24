import type { Saida } from "../../src/tipos.js";

export interface SaidaCapturada extends Saida {
  linhas: string[];
  texto(): string;
}

export function criarSaidaCapturada(): SaidaCapturada {
  const linhas: string[] = [];
  return {
    linhas,
    escrever(linha) {
      linhas.push(linha);
    },
    texto: () => linhas.join("\n"),
  };
}
