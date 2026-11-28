// Quem pode convidar quem (P-2). A API confere pelo papel do vínculo ativo, lido do banco.
import type { Papel } from "../banco/esquema.js";

export const PODE_CONVIDAR: Record<Papel, readonly Papel[]> = {
  titular: ["titular", "contador", "colaborador"],
  contador: ["titular", "colaborador"],
  colaborador: [],
};

export const PAPEIS: readonly Papel[] = ["titular", "contador", "colaborador"];
