// Busca de dados do dashboard com cache por empresa e recorte, sem estado global (AD-3, DT-5).
// O dado muda uma vez por dia: vale por 5 minutos e não busca de novo ao voltar à aba.
// O cache é limpo ao sair e ao receber 401 (ver ProvedorSessao), para os dados de uma pessoa não ficarem na aba.
import { QueryClient, useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { requisitar } from "../api/cliente";
import { Alerta } from "../componentes/Alerta";
import { AlertaDeRede } from "../componentes/AlertaDeRede";
import type { NotasDoGrupo, Painel, Pendencias } from "./tipos";

export class ErroDeBusca extends Error {
  constructor(
    readonly tipo: "sem_conexao" | "erro",
    readonly status: number,
    readonly codigo: string,
  ) {
    super(tipo);
    this.name = "ErroDeBusca";
  }
}

export function criarClienteDeCache(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 5 * 60_000, refetchOnWindowFocus: false, retry: false } },
  });
}

async function buscar<T>(caminho: string): Promise<T> {
  const r = await requisitar<T>("GET", caminho, { logada: true });
  if (r.tipo === "ok") return r.dados;
  if (r.tipo === "sem_conexao") throw new ErroDeBusca("sem_conexao", 0, "sem_conexao");
  throw new ErroDeBusca("erro", r.status, r.codigo);
}

const recorteNaUrl = (periodo: string | null): string => (periodo === null ? "" : `periodo=${encodeURIComponent(periodo)}`);
const comConsulta = (caminho: string, ...partes: string[]): string => {
  const usadas = partes.filter((p) => p !== "");
  return usadas.length === 0 ? caminho : `${caminho}?${usadas.join("&")}`;
};
const base = (empresaId: string): string => `/api/empresas/${encodeURIComponent(empresaId)}`;

export function usePainel(empresaId: string, periodo: string | null): UseQueryResult<Painel, Error> {
  return useQuery({
    queryKey: ["painel", empresaId, periodo],
    queryFn: () => buscar<Painel>(comConsulta(`${base(empresaId)}/painel`, recorteNaUrl(periodo))),
  });
}

export function usePendencias(empresaId: string, periodo: string | null): UseQueryResult<Pendencias, Error> {
  return useQuery({
    queryKey: ["pendencias", empresaId, periodo],
    queryFn: () => buscar<Pendencias>(comConsulta(`${base(empresaId)}/pendencias`, recorteNaUrl(periodo))),
  });
}

export function useNotasDoGrupo(empresaId: string, grupo: string, periodo: string | null, pagina: number): UseQueryResult<NotasDoGrupo, Error> {
  return useQuery({
    queryKey: ["notas", empresaId, grupo, periodo, pagina],
    queryFn: () =>
      buscar<NotasDoGrupo>(comConsulta(`${base(empresaId)}/pendencias/${encodeURIComponent(grupo)}/notas`, recorteNaUrl(periodo), `pagina=${pagina}`)),
  });
}

/** Carregando, alerta de falha com "Tentar de novo" ou os dados. */
export function ResultadoDaBusca<T>({ consulta, children }: { consulta: UseQueryResult<T, Error>; children: (dados: T) => ReactNode }) {
  if (consulta.isError) {
    const tentar = () => void consulta.refetch();
    if (consulta.error instanceof ErroDeBusca && consulta.error.tipo === "sem_conexao") return <AlertaDeRede aoTentar={tentar} />;
    return (
      <Alerta
        tipo="error"
        titulo="Não foi possível carregar os dados"
        acao={
          <div>
            <button type="button" className="cg-btn cg-btn-secondary cg-btn-sm" onClick={tentar}>
              Tentar de novo
            </button>
          </div>
        }
      />
    );
  }
  if (consulta.isPending) {
    return (
      <p className="cg-help" role="status">
        Carregando…
      </p>
    );
  }
  return <>{children(consulta.data)}</>;
}
