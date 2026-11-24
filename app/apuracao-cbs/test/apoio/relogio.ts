import type { Relogio } from "../../src/relogio.js";

export interface RelogioFalso extends Relogio {
  /** Avança o relógio em milissegundos. */
  avancar(ms: number): void;
  definir(d: Date): void;
}

export function criarRelogioFalso(inicio: Date = new Date(2026, 10, 23, 10, 0, 0, 0)): RelogioFalso {
  let atual = inicio.getTime();
  return {
    agora: () => new Date(atual),
    avancar(ms) {
      atual += ms;
    },
    definir(d) {
      atual = d.getTime();
    },
  };
}

export interface DormirFalso {
  (ms: number): Promise<void>;
  /** Esperas pedidas, em milissegundos, na ordem. */
  pedidos: number[];
}

/** Espera falsa: não espera de verdade; só registra e, se houver relógio, o avança. */
export function criarDormirFalso(relogio?: RelogioFalso): DormirFalso {
  const pedidos: number[] = [];
  const dormir = (async (ms: number) => {
    pedidos.push(ms);
    relogio?.avancar(ms);
  }) as DormirFalso;
  dormir.pedidos = pedidos;
  return dormir;
}
