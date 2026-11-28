import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate, Outlet } from "react-router";
import {
  definirAoPerderSessao,
  requisitar,
  type DadosSessao,
  type Empresa,
  type Resultado,
  type Usuario,
} from "../api/cliente";
import { Alerta } from "../componentes/Alerta";
import { AlertaDeRede, ehFalhaDeRede, type FalhaDeRede } from "../componentes/AlertaDeRede";

export type EstadoSessao =
  | { status: "carregando" }
  // Falha ao ler a sessão (sem conexão, serviço fora do ar ou erro do servidor): não é "sem sessão".
  | { status: "erro"; falha: FalhaDeRede | "outro" }
  | { status: "anonima"; motivo?: "expirada" }
  | { status: "logada"; usuario: Usuario; empresas: Empresa[] };

type ContextoSessao = {
  estado: EstadoSessao;
  entrar: (email: string, senha: string) => Promise<Resultado<DadosSessao>>;
  // Para telas que já recebem a sessão da API (aceitar convite).
  iniciarSessao: (dados: DadosSessao) => void;
  // Lê a sessão de novo (botão "Tentar de novo" quando a leitura inicial falhou).
  recarregar: () => void;
  // Troca a lista de empresas guardada (depois de recarregar GET /api/empresas).
  atualizarEmpresas: (empresas: Empresa[]) => void;
  // Falso se o servidor não encerrou a sessão: quem chama avisa e não finge o logout.
  sair: () => Promise<boolean>;
};

const Contexto = createContext<ContextoSessao | null>(null);

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoSessao>({ status: "carregando" });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    definirAoPerderSessao((motivo) =>
      setEstado(motivo === "expirada" ? { status: "anonima", motivo: "expirada" } : { status: "anonima" }),
    );
    return () => definirAoPerderSessao(null);
  }, []);

  useEffect(() => {
    let ativo = true;
    void requisitar<DadosSessao>("GET", "/api/sessao").then((r) => {
      if (!ativo) return;
      if (r.tipo === "ok") setEstado({ status: "logada", ...r.dados });
      else if (r.tipo === "erro" && r.status === 401) {
        setEstado(r.codigo === "sessao_expirada" ? { status: "anonima", motivo: "expirada" } : { status: "anonima" });
      } else if (ehFalhaDeRede(r)) setEstado({ status: "erro", falha: r.tipo });
      else setEstado({ status: "erro", falha: "outro" });
    });
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  const recarregar = useCallback(() => {
    setEstado({ status: "carregando" });
    setTentativa((t) => t + 1);
  }, []);

  const atualizarEmpresas = useCallback((empresas: Empresa[]) => {
    setEstado((e) => (e.status === "logada" ? { ...e, empresas } : e));
  }, []);

  const iniciarSessao = useCallback((dados: DadosSessao) => {
    setEstado({ status: "logada", usuario: dados.usuario, empresas: dados.empresas });
  }, []);

  const entrar = useCallback(
    async (email: string, senha: string) => {
      const r = await requisitar<DadosSessao>("POST", "/api/sessao", { corpo: { email, senha } });
      if (r.tipo === "ok") iniciarSessao(r.dados);
      return r;
    },
    [iniciarSessao],
  );

  const sair = useCallback(async () => {
    const r = await requisitar("DELETE", "/api/sessao");
    if (r.tipo !== "ok") return false;
    setEstado({ status: "anonima" });
    return true;
  }, []);

  const valor = useMemo(
    () => ({ estado, entrar, iniciarSessao, recarregar, atualizarEmpresas, sair }),
    [estado, entrar, iniciarSessao, recarregar, atualizarEmpresas, sair],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao(): ContextoSessao {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useSessao fora do ProvedorSessao");
  return contexto;
}

// Guarda das rotas logadas: sem sessão, vai para /entrar (com o motivo, se expirou).
export function RequerSessao() {
  const { estado, recarregar } = useSessao();
  if (estado.status === "carregando") return <p className="cg-help" role="status">Carregando…</p>;
  if (estado.status === "erro") {
    return (
      <main className="conteudo">
        {estado.falha === "outro" ? (
          <Alerta
            tipo="error"
            titulo="Não foi possível carregar sua sessão"
            acao={
              <div>
                <button type="button" className="cg-btn cg-btn-secondary cg-btn-sm" onClick={recarregar}>
                  Tentar de novo
                </button>
              </div>
            }
          />
        ) : (
          <AlertaDeRede tipo={estado.falha} aoTentar={recarregar} />
        )}
      </main>
    );
  }
  if (estado.status === "anonima") {
    return <Navigate to={estado.motivo === "expirada" ? "/entrar?motivo=expirada" : "/entrar"} replace />;
  }
  return <Outlet />;
}
