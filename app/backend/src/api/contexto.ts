import type { Limite } from "../autenticacao/limite.js";
import type { CustoArgon2, Verificador } from "../autenticacao/senha.js";
import type { Sessoes } from "../autenticacao/sessao.js";
import type { Banco } from "../banco/transacao.js";
import type { Config } from "../config.js";
import type { EnvioEmail } from "../email/tipos.js";

/** Tudo o que as rotas precisam; montado uma vez em criarServidor. */
export interface Contexto {
  config: Config;
  banco: Banco;
  email: EnvioEmail;
  relogio: () => Date;
  verificador: Verificador;
  custoHash: CustoArgon2;
  sessoes: Sessoes;
  limite: Limite;
  /** Hash fictício da inicialização, para igualar o trabalho no e-mail inexistente (CA-16). */
  hashFicticio: string;
}

declare module "fastify" {
  interface FastifyRequest {
    /** Preenchido nas rotas com sessão. */
    usuario: { id: string; sessaoId: string } | null;
  }
}
