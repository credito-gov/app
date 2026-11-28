// Tokens de sessão, convite e recuperação (CA-19). O banco guarda só o HMAC.
import { createHmac, randomBytes } from "node:crypto";

/** 32 bytes aleatórios em base64url. */
export function gerarToken(): string {
  return randomBytes(32).toString("base64url");
}

/** HMAC-SHA-256(segredo, valor) em base64url. Serve também para e-mail e origem. */
export function hmacToken(segredo: string, valor: string): string {
  return createHmac("sha256", segredo).update(valor).digest("base64url");
}
