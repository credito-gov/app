import { useState } from "react";
import { Link } from "react-router";
import type { Empresa } from "../api/cliente";
import { Icone } from "./Icone";

// Só aparece quando o usuário tem mais de uma empresa.
export function TrocaEmpresa({ atual, outras }: { atual: Empresa; outras: Empresa[] }) {
  const [aberta, setAberta] = useState(false);
  return (
    <div className="troca-empresa">
      <button
        type="button"
        className="cg-company-switch"
        aria-label="Trocar empresa"
        aria-expanded={aberta}
        aria-controls="troca-empresa-lista"
        onClick={() => setAberta((a) => !a)}
      >
        <span className="cg-company">
          <span className="cg-company-name">{atual.nome}</span>
          <span className="cg-company-meta">CNPJ raiz {atual.cnpjRaizFormatado}</span>
        </span>
        <Icone nome="trocar" />
      </button>
      {aberta ? (
        <ul className="troca-empresa-lista cg-card" id="troca-empresa-lista">
          {outras.map((e) => (
            <li key={e.id}>
              <Link className="cg-rowlink troca-empresa-item" to={`/e/${e.id}`} onClick={() => setAberta(false)}>
                {e.nome}
                <span className="cg-company-meta"> CNPJ raiz {e.cnpjRaizFormatado}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
