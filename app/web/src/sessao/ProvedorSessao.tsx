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

export type EstadoSessao =
  | { status: "carregando" }
  | { status: "anonima"; motivo?: "expirada" }
  | { status: "logada"; usuario: Usuario; empresas: Empresa[] };

type ContextoSessao = {
  estado: EstadoSessao;
  entrar: (email: string, senha: string) => Promise<Resultado<DadosSessao>>;
  // Para telas que já recebem a sessão da API (aceitar convite).
  iniciarSessao: (dados: DadosSessao) => void;
  sair: () => Promise<void>;
};

const Contexto = createContext<ContextoSessao | null>(null);

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoSessao>({ status: "carregando" });

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
      else setEstado(r.tipo === "erro" && r.codigo === "sessao_expirada" ? { status: "anonima", motivo: "expirada" } : { status: "anonima" });
    });
    return () => {
      ativo = false;
    };
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
    await requisitar("DELETE", "/api/sessao");
    setEstado({ status: "anonima" });
  }, []);

  const valor = useMemo(() => ({ estado, entrar, iniciarSessao, sair }), [estado, entrar, iniciarSessao, sair]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao(): ContextoSessao {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useSessao fora do ProvedorSessao");
  return contexto;
}

// Guarda das rotas logadas: sem sessão, vai para /entrar (com o motivo, se expirou).
export function RequerSessao() {
  const { estado } = useSessao();
  if (estado.status === "carregando") return <p className="cg-help" role="status">Carregando…</p>;
  if (estado.status === "anonima") {
    return <Navigate to={estado.motivo === "expirada" ? "/entrar?motivo=expirada" : "/entrar"} replace />;
  }
  return <Outlet />;
}
