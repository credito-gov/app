// Pendências: todos os grupos de I-7 (emitentes, não identificado, própria empresa e negativos), cada um com
// as suas notas (CA-9, CA-10). O recorte vem da URL e é preservado nos links.
import { Link, useSearchParams } from "react-router";
import { useEmpresaEmFoco } from "../componentes/LayoutEmpresa";
import { formatarPercentual } from "../formatacao/dinheiro";
import { formatarCnpj, formatarCpf } from "../formatacao/documento";
import { formatarPeriodo } from "../formatacao/datas";
import { Dinheiro } from "../paineis/blocos";
import { ResultadoDaBusca, usePendencias } from "../paineis/busca";
import { EstadoDoBloco } from "../paineis/situacao";
import { TEXTOS } from "../paineis/textos";
import type { GrupoDePendencia } from "../paineis/tipos";

/** O texto de um grupo: o CNPJ ou CPF formatado, ou o nome do grupo especial. */
export function rotuloDoGrupo(g: Pick<GrupoDePendencia, "grupo" | "tipo" | "documento">): string {
  if (g.tipo === "nao_identificado") return TEXTOS.naoIdentificado;
  if (g.tipo === "propria_empresa") return TEXTOS.propriaEmpresa;
  if (g.tipo === "negativos") return TEXTOS.negativos;
  return g.documento === "cpf" ? formatarCpf(g.grupo) : formatarCnpj(g.grupo);
}

export const comRecorte = (periodo: string | null): string => (periodo === null ? "" : `?periodo=${encodeURIComponent(periodo)}`);

export function Pendencias() {
  const empresa = useEmpresaEmFoco();
  const [params] = useSearchParams();
  const periodo = params.get("periodo");
  const consulta = usePendencias(empresa.id, periodo);
  return (
    <div className="painel">
      <h1 className="heading">Pendências</h1>
      <ResultadoDaBusca consulta={consulta}>
        {(r) => (
          <>
            <h2 className="painel-recorte-titulo">Recorte: {r.recorte.periodo === null ? TEXTOS.todosOsPeriodos : formatarPeriodo(r.recorte.periodo)}</h2>
            <Link className="cg-link" to={`/e/${empresa.id}${comRecorte(periodo)}`}>
              Voltar à Visão geral
            </Link>
            <EstadoDoBloco servico="creditos" situacao={r.situacao.creditos} semNotas={r.grupos !== null && r.grupos.length === 0}>
              {r.grupos !== null ? (
                <section className="cg-card" aria-label="Pendente por emitente (lista)">
                  <div className="cg-card-body">
                    <div className="cg-table-wrap">
                      <table className="cg-table" aria-label={TEXTOS.pendentePorEmitente}>
                        <thead>
                          <tr>
                            <th>Emitente</th>
                            <th>Notas</th>
                            <th>Total a apropriar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.grupos.map((g) => (
                            <tr key={g.grupo}>
                              <td>
                                {g.documento === "cpf" ? <span className="cg-help">{TEXTOS.cpfDoEmitente} </span> : null}
                                <Link className="cg-rowlink" to={`/e/${empresa.id}/pendencias/${encodeURIComponent(g.grupo)}${comRecorte(periodo)}`}>
                                  {rotuloDoGrupo(g)}
                                </Link>
                              </td>
                              <td>{g.quantidade}</td>
                              <td>
                                <Dinheiro valor={g.total} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {r.totalAApropriar !== null ? (
                      <p className="cg-help">
                        {TEXTOS.aApropriar.rotulo}: <Dinheiro valor={r.totalAApropriar} />
                      </p>
                    ) : null}
                    {r.percentualNaoIdentificado !== null ? <p className="cg-help">{TEXTOS.percentual(formatarPercentual(r.percentualNaoIdentificado))}</p> : null}
                  </div>
                </section>
              ) : null}
            </EstadoDoBloco>
          </>
        )}
      </ResultadoDaBusca>
    </div>
  );
}
