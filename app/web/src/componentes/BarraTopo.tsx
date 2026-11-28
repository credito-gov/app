import { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import type { Empresa } from "../api/cliente";
import { useSessao } from "../sessao/ProvedorSessao";
import { Alerta } from "./Alerta";
import { TrocaEmpresa } from "./TrocaEmpresa";

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toLocaleUpperCase("pt-BR");
}

export function BarraTopo({ empresa, outras }: { empresa: Empresa; outras: Empresa[] }) {
  const { estado, sair } = useSessao();
  const navegar = useNavigate();
  const nomeUsuario = estado.status === "logada" ? estado.usuario.nome : "";

  const [erroSaida, setErroSaida] = useState(false);

  async function aoSair() {
    setErroSaida(false);
    // Só sai da tela se o servidor encerrou a sessão; senão ela continuaria aberta.
    if (await sair()) navegar("/entrar", { replace: true });
    else setErroSaida(true);
  }

  return (
    <>
    <header className="cg-appbar">
      <img className="cg-appbar-logo" src="/logo.png" alt="CreditoGov" />
      <nav className="cg-topnav" aria-label="Principal">
        <NavLink className="cg-topnav-item" to={`/e/${empresa.id}`} end>
          Início
        </NavLink>
        <NavLink className="cg-topnav-item" to={`/e/${empresa.id}/pessoas`}>
          Pessoas
        </NavLink>
      </nav>
      <div className="cg-appbar-end">
        {outras.length > 0 ? (
          <TrocaEmpresa atual={empresa} outras={outras} />
        ) : (
          <div className="cg-company">
            <span className="cg-company-name">{empresa.nome}</span>
            <span className="cg-company-meta">CNPJ raiz {empresa.cnpjRaizFormatado}</span>
          </div>
        )}
        <span className="cg-avatar" title={nomeUsuario}>
          {iniciais(nomeUsuario)}
        </span>
        <button type="button" className="cg-btn cg-btn-ghost cg-btn-sm" onClick={() => void aoSair()}>
          Sair
        </button>
      </div>
    </header>
    {erroSaida ? <Alerta tipo="error" titulo="Não conseguimos encerrar a sessão no servidor. Tente de novo." /> : null}
    </>
  );
}
