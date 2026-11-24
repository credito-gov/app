// Valores fictícios e reconhecíveis, usados só nos testes. Nada aqui é real.
export const ID = "id-ficticio-123";
export const SEGREDO = "segredo-ficticio-456";
export const TOKEN = "token-ficticio-789";
export const URL_ASSINADA = "https://armazenamento.exemplo.invalid/arquivo?assinatura=ficticia";
/** Só a query da URL assinada (a parte que carrega a autorização). */
export const QUERY_ASSINADA = "assinatura=ficticia";
/** Base64 de "id:segredo", como iria no cabeçalho Basic. */
export const BASE64_CREDENCIAIS = Buffer.from("id-ficticio-123:segredo-ficticio-456").toString("base64");
export const URL_TOKEN = "https://token.exemplo.invalid/token";
export const URL_BASE = "https://api.exemplo.invalid/apuracao-cbs/v2";
export const CNPJ_BASE = "12345678";

/** Variáveis de ambiente fictícias, montadas no teste (nunca process.env). */
export function envFicticio(extra: Record<string, string | undefined> = {}): Record<string, string | undefined> {
  return {
    APURACAO_CLIENT_ID: ID,
    APURACAO_CLIENT_SECRET: SEGREDO,
    APURACAO_URL_TOKEN: URL_TOKEN,
    APURACAO_URL_BASE: URL_BASE,
    APURACAO_TOKEN_CREDENCIAIS: "basic",
    APURACAO_CNPJ_BASE: CNPJ_BASE,
    ...extra,
  };
}
