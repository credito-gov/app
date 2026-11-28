import type { ReactNode } from "react";

// Liga ajuda e erro ao controle por aria-describedby.
export function descricaoDoCampo(id: string, erro?: string, ajuda?: string) {
  const ids = [ajuda ? `${id}-ajuda` : null, erro ? `${id}-erro` : null].filter(Boolean);
  return {
    "aria-describedby": ids.length > 0 ? ids.join(" ") : undefined,
    "aria-invalid": erro ? (true as const) : undefined,
  };
}

type Props = {
  id: string;
  rotulo: string;
  erro?: string;
  ajuda?: string;
  children: ReactNode;
};

export function Campo({ id, rotulo, erro, ajuda, children }: Props) {
  return (
    <div className="cg-field">
      <label className="cg-label" htmlFor={id}>
        {rotulo}
      </label>
      {children}
      {ajuda ? (
        <span className="cg-help" id={`${id}-ajuda`}>
          {ajuda}
        </span>
      ) : null}
      {erro ? (
        <span className="cg-error-text" id={`${id}-erro`}>
          {erro}
        </span>
      ) : null}
    </div>
  );
}

type CampoTextoProps = {
  id: string;
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  tipo?: "text" | "email";
  autoComplete?: string;
  erro?: string;
  ajuda?: string;
  desabilitado?: boolean;
};

export function CampoTexto({ id, rotulo, valor, aoMudar, tipo = "text", autoComplete, erro, ajuda, desabilitado }: CampoTextoProps) {
  return (
    <Campo id={id} rotulo={rotulo} erro={erro} ajuda={ajuda}>
      <input
        id={id}
        className="cg-input"
        type={tipo}
        value={valor}
        autoComplete={autoComplete}
        disabled={desabilitado}
        onChange={(e) => aoMudar(e.target.value)}
        {...descricaoDoCampo(id, erro, ajuda)}
      />
    </Campo>
  );
}
