// Estados dos dados (CA-12 a CA-22). Esta versão cobre o período sem nota; a task 26 completa os demais.
import type { ReactNode } from "react";
import { TEXTOS } from "./textos";
import type { Painel, SituacaoDoServico } from "./tipos";

export function SituacaoDosDados(_props: { situacao: Painel["situacao"] }) {
  return null;
}

export function EstadoDoBloco({
  servico,
  semNotas,
  children,
}: {
  servico: "creditos" | "debitos";
  situacao: SituacaoDoServico;
  semNotas: boolean;
  children: ReactNode;
}) {
  if (semNotas) {
    return (
      <div className="cg-empty">
        <p className="cg-empty-text">{servico === "creditos" ? TEXTOS.semNotasCreditos : TEXTOS.semNotasDebitos}</p>
      </div>
    );
  }
  return <>{children}</>;
}
