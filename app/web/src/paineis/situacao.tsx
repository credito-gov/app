// Estados dos dados (CA-12 a CA-22): o que cada serviço mostra no lugar dos números, os alertas do topo
// e o resumo de até quando os números valem. Nunca formata um valor ausente (design 3.6).
import type { ReactNode } from "react";
import { Alerta } from "../componentes/Alerta";
import { formatarData, formatarInstante } from "../formatacao/datas";
import { TEXTOS } from "./textos";
import type { Painel, SituacaoDoServico } from "./tipos";

type Servico = "creditos" | "debitos";

const NOMES = {
  creditos: { Titulo: "Créditos", plural: "créditos" },
  debitos: { Titulo: "Débitos", plural: "débitos" },
} as const;

const SERVICOS: Servico[] = ["creditos", "debitos"];

/** Alertas do topo (CA-15, CA-19) e o resumo de cada serviço (CA-14). */
export function SituacaoDosDados({ situacao }: { situacao: Painel["situacao"] }) {
  return (
    <div className="painel-situacao">
      {SERVICOS.map((servico) => {
        const s = situacao[servico];
        const n = NOMES[servico];
        return (
          <div key={servico} className="painel-situacao-servico">
            {s.desatualizado && s.diasSemAtualizacao !== null ? <Alerta tipo="warning" titulo={TEXTOS.desatualizado(n.Titulo, s.diasSemAtualizacao)} /> : null}
            {s.falha ? (
              <Alerta tipo="error" titulo={TEXTOS.falhou(n.plural, formatarInstante(s.falha.em))}>
                {s.falha.tipo === "credencial" ? TEXTOS.falhaDeCredencial : TEXTOS.falhaSemCulpa}
              </Alerta>
            ) : null}
            {s.ultimaAceitaEm !== null ? (
              <p className="cg-help">{TEXTOS.ultimaConsulta(n.Titulo, formatarInstante(s.ultimaAceitaEm), s.atualizacao ? formatarData(s.atualizacao.de) : null, s.atualizacao ? formatarData(s.atualizacao.ate) : null)}</p>
            ) : null}
          </div>
        );
      })}
      <p className="cg-help">{TEXTOS.fraseDasConsultas}</p>
    </div>
  );
}

function Vazio({ children }: { children: ReactNode }) {
  return (
    <div className="cg-empty">
      <p className="cg-empty-text">{children}</p>
    </div>
  );
}

/** O que o bloco de um serviço mostra: os números (children) ou o estado, sem zero inventado. */
export function EstadoDoBloco({
  servico,
  situacao,
  semNotas,
  children,
}: {
  servico: Servico;
  situacao: SituacaoDoServico;
  semNotas: boolean;
  children: ReactNode;
}) {
  const n = NOMES[servico];
  const andamento = situacao.emAndamento ? <p className="cg-help">{TEXTOS.emAndamento}</p> : null;

  if (situacao.estado === "sem_consulta") {
    return (
      <>
        <Vazio>{TEXTOS.aindaNaoConsultados(n.plural)}</Vazio>
        {andamento}
      </>
    );
  }
  if (situacao.estado === "vazio") {
    return (
      <>
        <Vazio>{TEXTOS.vazio(n.plural, situacao.ultimaAceitaEm === null ? "" : formatarInstante(situacao.ultimaAceitaEm))}</Vazio>
        {andamento}
      </>
    );
  }
  if (situacao.estado === "sem_dados_usaveis") {
    return (
      <>
        <Vazio>{TEXTOS.nenhumRetornoUsavel(n.plural)}</Vazio>
        {andamento}
      </>
    );
  }
  return (
    <>
      {andamento}
      {situacao.recusados ? (
        <Alerta tipo="warning" titulo={TEXTOS.recusados(situacao.recusados.quantidade, n.plural, formatarInstante(situacao.recusados.ultimoEm).split(" ")[0] ?? "")} />
      ) : null}
      {situacao.falha && situacao.ultimaAceitaEm !== null ? (
        <p className="cg-inline-note">{TEXTOS.numerosAnteriores(formatarInstante(situacao.ultimaAceitaEm))}</p>
      ) : null}
      {semNotas ? <Vazio>{servico === "creditos" ? TEXTOS.semNotasCreditos : TEXTOS.semNotasDebitos}</Vazio> : children}
    </>
  );
}
