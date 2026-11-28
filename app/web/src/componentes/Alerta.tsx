import type { ReactNode } from "react";
import { Icone, type NomeIcone } from "./Icone";

export type TipoAlerta = "info" | "success" | "warning" | "error";

const ICONES: Record<TipoAlerta, NomeIcone> = {
  info: "info",
  success: "sucesso",
  warning: "alerta",
  error: "alerta",
};

type Props = {
  tipo: TipoAlerta;
  titulo: string;
  children?: ReactNode;
  acao?: ReactNode;
};

export function Alerta({ tipo, titulo, children, acao }: Props) {
  const classe = tipo === "info" ? "cg-alert" : `cg-alert cg-alert-${tipo}`;
  return (
    <div className={classe} role={tipo === "error" || tipo === "warning" ? "alert" : "status"}>
      <Icone nome={ICONES[tipo]} grande />
      <div className="cg-alert-body">
        <p className="cg-alert-title">{titulo}</p>
        {children ? <p className="cg-alert-text">{children}</p> : null}
        {acao}
      </div>
    </div>
  );
}
