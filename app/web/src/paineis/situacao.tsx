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
export function SituacaoDosDados({ situacao, servicos = SERVICOS }: { situacao: Partial<Painel["situacao"]>; servicos?: readonly Servico[] }) {
  return (
    <div className="painel-situacao">
      {servicos.map((servico) => {
        const s = situacao[servico];
        if (!s) return null;
        const n = NOMES[servico];
        return (
          <div key={servico} className="painel-situacao-servico">
            {s.desatualizado && s.diasSemAtualizacao !== null ? <Alerta tipo="warning" titulo={TEXTOS.desatualizado(n.Titulo, s.diasSemAtualizacao)} /> : null}
            <AlertaDeFalha servico={servico} falha={s.falha} />
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

/** O título da falha e a ação: credencial recusada pede uma nova; outro erro não depende do usuário (CA-19). */
function AlertaDeFalha({ servico, falha }: { servico: Servico; falha: SituacaoDoServico["falha"] }) {
  if (!falha) return null;
  return (
    <Alerta tipo="error" titulo={TEXTOS.falhou(NOMES[servico].plural, formatarInstante(falha.em))}>
      {falha.tipo === "credencial" ? TEXTOS.falhaDeCredencial : TEXTOS.falhaSemCulpa}
    </Alerta>
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
  textoSemNotas,
  children,
}: {
  servico: Servico;
  situacao: SituacaoDoServico;
  semNotas: boolean;
  /** Troca o texto de "sem notas" onde ele diria outra coisa (Pendências: não há crédito a apropriar). */
  textoSemNotas?: string;
  children: ReactNode;
}) {
  const n = NOMES[servico];
  const andamento = situacao.emAndamento ? <p className="cg-help">{TEXTOS.emAndamento}</p> : null;
  // Sem números o bloco não pode dizer só "ainda não consultados" quando a última tentativa falhou (CA-18, CA-19).
  const falha = <AlertaDeFalha servico={servico} falha={situacao.falha} />;

  if (situacao.estado === "sem_consulta") {
    return (
      <>
        <Vazio>{TEXTOS.aindaNaoConsultados(n.plural)}</Vazio>
        {falha}
        {andamento}
      </>
    );
  }
  if (situacao.estado === "vazio") {
    return (
      <>
        <Vazio>{TEXTOS.vazio(n.plural, situacao.ultimaAceitaEm === null ? null : formatarInstante(situacao.ultimaAceitaEm))}</Vazio>
        {falha}
        {andamento}
      </>
    );
  }
  if (situacao.estado === "sem_dados_usaveis") {
    return (
      <>
        <Vazio>{TEXTOS.nenhumRetornoUsavel(n.plural)}</Vazio>
        {falha}
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
      {semNotas ? <Vazio>{textoSemNotas ?? (servico === "creditos" ? TEXTOS.semNotasCreditos : TEXTOS.semNotasDebitos)}</Vazio> : children}
    </>
  );
}
