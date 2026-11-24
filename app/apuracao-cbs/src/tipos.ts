/** Saída de texto (o terminal, nos programas; uma captura, nos testes). */
export interface Saida {
  escrever(linha: string): void;
}

/** Espera injetada: os testes não esperam de verdade. */
export type Dormir = (ms: number) => Promise<void>;
