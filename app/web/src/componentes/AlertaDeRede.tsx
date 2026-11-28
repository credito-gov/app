import { Alerta } from "./Alerta";

export type FalhaDeRede = "sem_conexao";

// Falha de rede ou API fora do ar (502, 503, 504 do proxy), com o botão de tentar de novo.
export function AlertaDeRede({ aoTentar }: { aoTentar?: () => void }) {
  const acao = aoTentar ? (
    <div>
      <button type="button" className="cg-btn cg-btn-secondary cg-btn-sm" onClick={aoTentar}>
        Tentar de novo
      </button>
    </div>
  ) : undefined;
  return (
    <Alerta tipo="error" titulo="Sem conexão" acao={acao}>
      Não conseguimos falar com o servidor. Verifique a internet.
    </Alerta>
  );
}

export function ehFalhaDeRede(r: { tipo: string }): r is { tipo: FalhaDeRede } {
  return r.tipo === "sem_conexao";
}
