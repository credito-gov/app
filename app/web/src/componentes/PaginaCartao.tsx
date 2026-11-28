import type { ReactNode } from "react";

// Moldura das telas simples sem sessão (esqueci a senha, redefinir, convite).
export function PaginaCartao({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: ReactNode }) {
  return (
    <main className="pagina-cartao">
      <div className="pagina-cartao-corpo">
        <img className="pagina-cartao-logo" src="/logo.png" alt="CreditoGov" />
        <h1 className="heading">{titulo}</h1>
        {subtitulo ? <p className="entrar-subtitulo">{subtitulo}</p> : null}
        {children}
      </div>
    </main>
  );
}

export const REGRA_SENHA = "Use de 12 a 128 caracteres. Não use uma senha comum.";
