import type { ReactNode } from "react";

const CAMINHOS: Record<string, ReactNode> = {
  relogio: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  alerta: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </>
  ),
  sucesso: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </>
  ),
  olho: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  olhoRiscado: (
    <>
      <path d="M3 3l18 18" />
      <path d="M10.6 6.1A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.9A17 17 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4.1-.9" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  carregando: <path d="M21 12a9 9 0 1 1-6.2-8.6" />,
  usuarios: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6" />
    </>
  ),
  predio: (
    <>
      <path d="M4 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17M15 9h4a1 1 0 0 1 1 1v11M2 21h20" />
      <path d="M8 7h3M8 11h3M8 15h3" />
    </>
  ),
  trocar: <path d="m7 4-4 4 4 4M3 8h14M17 20l4-4-4-4M21 16H7" />,
  seta: <path d="m6 9 6 6 6-6" />,
};

export type NomeIcone = keyof typeof CAMINHOS;

export function Icone({ nome, grande = false, girando = false }: { nome: NomeIcone; grande?: boolean; girando?: boolean }) {
  const classes = ["cg-icon", grande ? "cg-icon-lg" : "", girando ? "cg-spin" : ""].filter(Boolean).join(" ");
  return (
    <svg className={classes} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {CAMINHOS[nome]}
    </svg>
  );
}
