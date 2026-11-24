export interface Redator {
  /** Registra um segredo conhecido na execução. Texto vazio é ignorado. */
  registrar(segredo: string | undefined): void;
  /** Troca qualquer ocorrência dos segredos registrados por `***`. */
  redigir(texto: string): string;
}

/** Defesa extra: nenhum código deve imprimir segredos, mas toda saída passa por aqui. */
export function criarRedator(): Redator {
  const segredos = new Set<string>();
  return {
    registrar(segredo) {
      if (segredo) segredos.add(segredo);
    },
    redigir(texto) {
      let saida = texto;
      const ordenados = [...segredos].sort((a, b) => b.length - a.length);
      for (const s of ordenados) saida = saida.split(s).join("***");
      return saida;
    },
  };
}
