// Componentes de indicadores do dashboard (classes cg- da 032, só tema claro).
import type { ReactNode } from "react";
import { Link } from "react-router";
import { formatarCnpj, formatarCpf } from "../formatacao/documento";
import { formatarPercentual, formatarReais } from "../formatacao/dinheiro";
import { formatarPeriodo } from "../formatacao/datas";
import { TEXTOS } from "./textos";
import type { BlocoDeCreditos, BlocoDeDebitos, Origem, TotaisDeCredito } from "./tipos";

type Creditos = Extract<BlocoDeCreditos, { semNotasNoRecorte: false }>;
type Debitos = Extract<BlocoDeDebitos, { semNotasNoRecorte: false }>;

/** Só aceita texto decimal da API: valor ausente por estado nunca passa por aqui. */
export function Dinheiro({ valor }: { valor: string }) {
  return <span className="cg-money">{formatarReais(valor)}</span>;
}

export function CartaoTotal({
  rotulo,
  campo,
  nota,
  valor,
  grande,
  pendente,
  children,
}: {
  rotulo: string;
  campo: string;
  nota: string;
  valor: string;
  grande?: boolean;
  pendente?: boolean;
  children?: ReactNode;
}) {
  return (
    <div role="group" aria-label={rotulo} className={`cg-total${grande ? " is-xl" : ""}${pendente ? " cg-total-pendente" : ""}`}>
      <span className="cg-total-label">{rotulo}</span>
      <span className="cg-total-value">
        <Dinheiro valor={valor} />
      </span>
      <span className="cg-total-field">{campo}</span>
      <span className="cg-total-note">{nota}</span>
      {children}
    </div>
  );
}

export function CartoesDeCredito({ creditos }: { creditos: Creditos }) {
  const t = creditos.totais;
  return (
    <div className="painel-cartoes">
      <CartaoTotal {...TEXTOS.apurado} valor={t.apurado} grande>
        <span className="cg-help">{TEXTOS.notas(creditos.quantidadeNotas)}</span>
      </CartaoTotal>
      <CartaoTotal {...TEXTOS.aApropriar} valor={t.aApropriar} pendente>
        <span className="cg-help">{TEXTOS.comAApropriar(creditos.quantidadeComAApropriar, creditos.quantidadeNotas)}</span>
      </CartaoTotal>
      <CartaoTotal {...TEXTOS.apropriado} valor={t.apropriado} />
      <CartaoTotal {...TEXTOS.utilizado} valor={t.utilizado} />
      <CartaoTotal {...TEXTOS.saldoCredor} valor={t.saldoCredor} />
    </div>
  );
}

export function OutrosValores({ outros }: { outros: Creditos["outros"] }) {
  if (outros.length === 0) return null;
  return (
    <section className="cg-card" aria-label={TEXTOS.outros}>
      <div className="cg-card-head">
        <h3 className="cg-card-title">{TEXTOS.outros}</h3>
      </div>
      <div className="cg-card-body">
        <table className="cg-table">
          <tbody>
            {outros.map((o) => (
              <tr key={o.campo}>
                <td>{TEXTOS.rotulosDeOutros[o.campo] ?? o.campo}</td>
                <td>
                  <span className="cg-total-field">{o.campo}</span>
                </td>
                <td>
                  <Dinheiro valor={o.valor} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="cg-help">{TEXTOS.outrosNota}</p>
      </div>
    </section>
  );
}

const consulta = (periodo: string | null): string => (periodo === null ? "" : `?periodo=${encodeURIComponent(periodo)}`);

export function PendentePorEmitente({ pendentes, empresaId, periodo }: { pendentes: Creditos["pendentes"]; empresaId: string; periodo: string | null }) {
  const para = (grupo: string) => `/e/${empresaId}/pendencias/${encodeURIComponent(grupo)}${consulta(periodo)}`;
  return (
    <section className="cg-card" aria-label={TEXTOS.tela.pendenteBloco}>
      <div className="cg-card-head">
        <h3 className="cg-card-title">{TEXTOS.pendentePorEmitente}</h3>
        <Link className="cg-link" to={`/e/${empresaId}/pendencias${consulta(periodo)}`}>
          {TEXTOS.verTodos}
        </Link>
      </div>
      <div className="cg-card-body">
        <div className="cg-table-wrap">
          <table className="cg-table" aria-label={TEXTOS.pendentePorEmitente}>
            <thead>
              <tr>
                <th>{TEXTOS.tela.colunaEmitente}</th>
                <th>{TEXTOS.tela.colunaNotas}</th>
                <th>{TEXTOS.tela.colunaTotalAApropriar}</th>
              </tr>
            </thead>
            <tbody>
              {pendentes.emitentes.map((e) => (
                <tr key={e.grupo}>
                  <td>
                    {e.documento === "cpf" ? <span className="cg-help">{TEXTOS.cpfDoEmitente} </span> : null}
                    <Link className="cg-rowlink" to={para(e.grupo)}>
                      {e.documento === "cpf" ? formatarCpf(e.grupo) : formatarCnpj(e.grupo)}
                    </Link>
                  </td>
                  <td>{e.quantidade}</td>
                  <td>
                    <Dinheiro valor={e.total} />
                  </td>
                </tr>
              ))}
              {pendentes.demais ? (
                <tr>
                  <td>{TEXTOS.demais(pendentes.demais.emitentes)}</td>
                  <td>{pendentes.demais.quantidade}</td>
                  <td>
                    <Dinheiro valor={pendentes.demais.total} />
                  </td>
                </tr>
              ) : null}
              {pendentes.propriaEmpresa.quantidade > 0 ? (
                <tr>
                  <td>
                    <Link className="cg-rowlink" to={para("propria-empresa")}>
                      {TEXTOS.propriaEmpresa}
                    </Link>
                  </td>
                  <td>{pendentes.propriaEmpresa.quantidade}</td>
                  <td>
                    <Dinheiro valor={pendentes.propriaEmpresa.total} />
                  </td>
                </tr>
              ) : null}
              {pendentes.naoIdentificado.quantidade > 0 ? (
                <tr>
                  <td>
                    <Link className="cg-rowlink" to={para("nao-identificado")}>
                      {TEXTOS.naoIdentificado}
                    </Link>{" "}
                    <span className="cg-badge" aria-hidden="true">
                      ?
                    </span>
                  </td>
                  <td>{pendentes.naoIdentificado.quantidade}</td>
                  <td>
                    <Dinheiro valor={pendentes.naoIdentificado.total} />
                  </td>
                </tr>
              ) : null}
              {pendentes.negativos ? (
                <tr>
                  <td>
                    <Link className="cg-rowlink" to={para("negativos")}>
                      {TEXTOS.negativos}
                    </Link>
                  </td>
                  <td>{pendentes.negativos.quantidade}</td>
                  <td>
                    <Dinheiro valor={pendentes.negativos.total} />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {pendentes.percentualNaoIdentificado !== null ? <p className="cg-help">{TEXTOS.percentual(formatarPercentual(pendentes.percentualNaoIdentificado))}</p> : null}
      </div>
    </section>
  );
}

const CAMPOS_DA_EVOLUCAO: Array<[keyof TotaisDeCredito, { rotulo: string; campo: string }]> = [
  ["apurado", TEXTOS.apurado],
  ["aApropriar", TEXTOS.aApropriar],
  ["apropriado", TEXTOS.apropriado],
  ["utilizado", TEXTOS.utilizado],
  ["saldoCredor", TEXTOS.saldoCredor],
];

export function EvolucaoPorPeriodo({ creditos }: { creditos: Creditos }) {
  return (
    <section className="cg-card" aria-label={TEXTOS.tela.evolucaoBloco}>
      <div className="cg-card-head">
        <h3 className="cg-card-title">{TEXTOS.evolucao}</h3>
      </div>
      <div className="cg-card-body">
        <div className="cg-table-wrap">
          <table className="cg-table" aria-label={TEXTOS.evolucao}>
            <thead>
              <tr>
                <th>{TEXTOS.periodo}</th>
                {CAMPOS_DA_EVOLUCAO.map(([chave, t]) => (
                  <th key={chave}>
                    {t.rotulo} <span className="cg-total-field">{t.campo}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {creditos.porPeriodo.map((p) => (
                <tr key={p.periodo}>
                  <td>{formatarPeriodo(p.periodo)}</td>
                  {CAMPOS_DA_EVOLUCAO.map(([chave]) => (
                    <td key={chave}>
                      <Dinheiro valor={p.totais[chave]} />
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td>{TEXTOS.total}</td>
                {CAMPOS_DA_EVOLUCAO.map(([chave]) => (
                  <td key={chave}>
                    <Dinheiro valor={creditos.totais[chave]} />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export function AvisoOrigens({ origens }: { origens: Origem[] }) {
  if (origens.length === 0) return null;
  const itens = origens.map((o) => `${o.nome} (${o.codigo}): ${TEXTOS.notas(o.quantidade)}`).join(", ");
  return <p className="cg-inline-note">{TEXTOS.origens(itens)}</p>;
}

export function BlocoDebitos({ debitos }: { debitos: Debitos }) {
  return (
    <div className="painel-cartoes">
      <CartaoTotal {...TEXTOS.debitoApurado} nota={TEXTOS.tela.notaApuradoDebitos} valor={debitos.totais.apurado} grande>
        <span className="cg-help">{TEXTOS.notas(debitos.quantidadeNotas)}</span>
      </CartaoTotal>
      <CartaoTotal {...TEXTOS.jaExtinto} nota={TEXTOS.tela.notaExtintoDebitos} valor={debitos.totais.extinto} />
      <CartaoTotal {...TEXTOS.emAberto} nota={TEXTOS.tela.notaEmAbertoDebitos} valor={debitos.totais.saldoDevedor} />
    </div>
  );
}

export function AvisoSoCbs() {
  return <p className="cg-inline-note">{TEXTOS.soCbs}</p>;
}
