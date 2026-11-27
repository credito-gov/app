import { createContext, useContext, useEffect, useState } from "react";
import { Link, Outlet, useParams } from "react-router";
import { requisitar, type Empresa } from "../api/cliente";
import { Alerta } from "./Alerta";
import { BarraTopo } from "./BarraTopo";

const ContextoEmpresa = createContext<Empresa | null>(null);

// A empresa em foco, carregada de GET /api/empresas/:empresaId. A 033 usa este hook.
export function useEmpresaEmFoco(): Empresa {
  const empresa = useContext(ContextoEmpresa);
  if (!empresa) throw new Error("useEmpresaEmFoco fora do LayoutEmpresa");
  return empresa;
}

type Carga =
  | { tipo: "carregando" }
  | { tipo: "nao_encontrada" }
  | { tipo: "sem_conexao" }
  | { tipo: "ok"; empresa: Empresa; todas: Empresa[] };

export function LayoutEmpresa() {
  const { empresaId = "" } = useParams();
  const [carga, setCarga] = useState<Carga>({ tipo: "carregando" });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    setCarga({ tipo: "carregando" });
    void Promise.all([
      requisitar<Empresa>("GET", `/api/empresas/${encodeURIComponent(empresaId)}`, { logada: true }),
      requisitar<Empresa[]>("GET", "/api/empresas", { logada: true }),
    ]).then(([empresa, todas]) => {
      if (!ativo) return;
      if (empresa.tipo === "ok") {
        setCarga({ tipo: "ok", empresa: empresa.dados, todas: todas.tipo === "ok" ? todas.dados : [empresa.dados] });
      } else if (empresa.tipo === "sem_conexao") {
        setCarga({ tipo: "sem_conexao" });
      } else if (empresa.status !== 401) {
        setCarga({ tipo: "nao_encontrada" });
      }
    });
    return () => {
      ativo = false;
    };
  }, [empresaId, tentativa]);

  if (carga.tipo === "carregando") {
    return (
      <p className="cg-help conteudo" role="status">
        Carregando…
      </p>
    );
  }
  if (carga.tipo === "nao_encontrada") {
    return (
      <main className="cg-empty">
        <h1 className="cg-empty-title">Empresa não encontrada ou sem acesso</h1>
        <Link className="cg-link" to="/empresas">
          Ver minhas empresas
        </Link>
      </main>
    );
  }
  if (carga.tipo === "sem_conexao") {
    return (
      <main className="conteudo">
        <Alerta
          tipo="error"
          titulo="Sem conexão"
          acao={
            <div>
              <button type="button" className="cg-btn cg-btn-secondary cg-btn-sm" onClick={() => setTentativa((t) => t + 1)}>
                Tentar de novo
              </button>
            </div>
          }
        >
          Não conseguimos falar com o servidor. Verifique a internet.
        </Alerta>
      </main>
    );
  }

  return (
    <ContextoEmpresa.Provider value={carga.empresa}>
      <BarraTopo empresa={carga.empresa} outras={carga.todas.filter((e) => e.id !== carga.empresa.id)} />
      <main className="conteudo">
        <Outlet />
      </main>
    </ContextoEmpresa.Provider>
  );
}
