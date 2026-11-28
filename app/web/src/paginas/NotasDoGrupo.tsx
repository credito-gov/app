// Notas de um grupo de pendentes (P-8): período, chave, emissão, tipo de documento e valor a apropriar,
// 100 por página, do maior para o menor valor. O período é preservado na paginação.
import { Link, useParams, useSearchParams } from "react-router";
import { useEmpresaEmFoco } from "../componentes/LayoutEmpresa";
import { formatarData, formatarPeriodo } from "../formatacao/datas";
import { formatarCnpj, formatarCpf } from "../formatacao/documento";
import { Dinheiro } from "../paineis/blocos";
import { ErroDeBusca, ResultadoDaBusca, useNotasDoGrupo } from "../paineis/busca";
import { TEXTOS } from "../paineis/textos";
import { comRecorte } from "./Pendencias";

function tituloDoGrupo(grupo: string): string {
  if (grupo === "nao-identificado") return TEXTOS.naoIdentificado;
  if (grupo === "propria-empresa") return TEXTOS.propriaEmpresa;
  if (grupo === "negativos") return TEXTOS.negativos;
  return /^\d{11}$/.test(grupo) ? `${TEXTOS.cpfDoEmitente} ${formatarCpf(grupo)}` : formatarCnpj(grupo);
}

export function NotasDoGrupo() {
  const empresa = useEmpresaEmFoco();
  const { grupo = "" } = useParams();
  const [params] = useSearchParams();
  const periodo = params.get("periodo");
  const bruta = params.get("pagina") ?? "1";
  const pagina = /^[1-9][0-9]{0,6}$/.test(bruta) ? inteiroDe(bruta) : 0;
  const consulta = useNotasDoGrupo(empresa.id, grupo, periodo, pagina);
  const voltar = `/e/${empresa.id}/pendencias${comRecorte(periodo)}`;
  const paraPagina = (n: number) => `?${periodo === null ? "" : `periodo=${encodeURIComponent(periodo)}&`}pagina=${n}`;

  const erro = consulta.isError && consulta.error instanceof ErroDeBusca ? consulta.error : null;
  const mensagem = erro?.codigo === "grupo_nao_encontrado" ? "Não há notas neste grupo." : erro?.codigo === "pagina_invalida" ? "A página pedida não existe." : null;

  return (
    <div className="painel">
      <h1 className="heading">{tituloDoGrupo(grupo)}</h1>
      <Link className="cg-link" to={voltar}>
        Voltar às pendências
      </Link>
      {mensagem !== null ? (
        <div className="cg-empty">
          <p className="cg-empty-text">{mensagem}</p>
        </div>
      ) : (
        <ResultadoDaBusca consulta={consulta}>
          {(r) => (
            <section className="cg-card" aria-label="Notas do grupo (bloco)">
              <div className="cg-card-body">
                <div className="cg-table-wrap">
                  <table className="cg-table" aria-label="Notas do grupo">
                    <thead>
                      <tr>
                        <th>Período</th>
                        <th>Chave</th>
                        <th>Emissão</th>
                        <th>Tipo de documento</th>
                        <th>{TEXTOS.aApropriar.rotulo}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.notas.map((n) => (
                        <tr key={`${n.periodo}-${n.chave}`}>
                          <td>{formatarPeriodo(n.periodo)}</td>
                          <td>
                            <span className="cg-key">{n.chave}</span>
                          </td>
                          <td>{n.emissao === null ? "" : formatarData(n.emissao)}</td>
                          <td>{`${n.documentoNome} (${n.documento})`}</td>
                          <td>
                            <Dinheiro valor={n.aApropriar} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <nav className="cg-pager" aria-label="Paginação">
                  {r.pagina > 1 ? <Link to={paraPagina(r.pagina - 1)}>Anterior</Link> : null}
                  <span>{`Página ${r.pagina} de ${r.paginas}`}</span>
                  {r.pagina < r.paginas ? <Link to={paraPagina(r.pagina + 1)}>Próxima</Link> : null}
                </nav>
              </div>
            </section>
          )}
        </ResultadoDaBusca>
      )}
    </div>
  );
}

/** Inteiro de um texto de dígitos já conferido, sem parseInt nem Number. */
function inteiroDe(texto: string): number {
  let n = 0;
  for (const c of texto) n = n * 10 + (c.charCodeAt(0) - 48);
  return n;
}
