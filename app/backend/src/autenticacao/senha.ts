// Senha: regra de formato e hash argon2id (CA-14, P-4).
import argon2 from "argon2";
import { senhasComuns } from "./senhasComuns.js";

export const SENHA_MINIMO = 12;
export const SENHA_MAXIMO = 128;

export type RegraSenha = "tamanho_minimo" | "tamanho_maximo" | "senha_comum";
export type ResultadoSenha = { ok: true } | { ok: false; regra: RegraSenha };

export interface CustoArgon2 {
  memoryCost?: number;
  timeCost?: number;
  parallelism?: number;
}

/** Verificador injetável, para o espião do teste de CA-16. */
export type Verificador = (
  hash: string,
  senha: string,
  /** Chamado se o hash guardado tem formato inválido (o chamador registra, com o usuarioId). */
  aoHashInvalido?: () => void,
) => Promise<boolean>;

/** De 12 a 128 pontos de código depois de NFC, fora da lista de senhas comuns. */
export function validarSenha(
  senha: string,
  comuns: ReadonlySet<string> = senhasComuns,
): ResultadoSenha {
  const normal = senha.normalize("NFC");
  const tamanho = [...normal].length;
  if (tamanho < SENHA_MINIMO) return { ok: false, regra: "tamanho_minimo" };
  if (tamanho > SENHA_MAXIMO) return { ok: false, regra: "tamanho_maximo" };
  if (comuns.has(normal.toLowerCase())) return { ok: false, regra: "senha_comum" };
  return { ok: true };
}

/** Parâmetros padrão da biblioteca; os testes passam um custo menor. */
export function gerarHash(senha: string, custo: CustoArgon2 = {}): Promise<string> {
  return argon2.hash(senha.normalize("NFC"), { type: argon2.argon2id, ...custo });
}

/**
 * Só o erro de formato de hash (TypeError do desserializador) vira false, e avisa o
 * chamador para registrar. Qualquer outro erro (memória, bug) é relançado e vira 500.
 */
export const verificar: Verificador = async (hash, senha, aoHashInvalido) => {
  try {
    return await argon2.verify(hash, senha.normalize("NFC"));
  } catch (e) {
    if (e instanceof TypeError) {
      aoHashInvalido?.();
      return false;
    }
    throw e;
  }
};
