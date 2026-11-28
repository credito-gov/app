import { Alerta } from "./Alerta";

export type FalhaDeRede = "sem_conexao" | "servidor_indisponivel";

// Falha de rede (sem conexão) ou serviço fora do ar (502, 503, 504), com o botão de tentar de novo.
export function AlertaDeRede({ tipo, aoTentar }: { tipo: FalhaDeRede; aoTentar?: () => void }) {
  const acao = aoTentar ? (
    <div>
      <button type="button" className="cg-btn cg-btn-secondary cg-btn-sm" onClick={aoTentar}>
        Tentar de novo
      </button>
    </div>
  ) : undefined;
  if (tipo === "servidor_indisponivel") {
    return (
      <Alerta tipo="error" titulo="Serviço indisponível" acao={acao}>
        O serviço está indisponível no momento. Tente em alguns minutos.
      </Alerta>
    );
  }
  return (
    <Alerta tipo="error" titulo="Sem conexão" acao={acao}>
      Não conseguimos falar com o servidor. Verifique a internet.
    </Alerta>
  );
}

export function ehFalhaDeRede(r: { tipo: string }): r is { tipo: FalhaDeRede } {
  return r.tipo === "sem_conexao" || r.tipo === "servidor_indisponivel";
}
