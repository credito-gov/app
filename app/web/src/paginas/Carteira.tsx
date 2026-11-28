// Carteira do contador em /empresas (CA-C1 a CA-C4): uma linha por empresa, com os valores de cada uma
// como a Receita informou. Não há total, nem soma, entre empresas diferentes.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Alerta } from "../componentes/Alerta";
import { Icone } from "../componentes/Icone";
import { compararDecimal } from "../formatacao/dinheiro";
import { LinhaCarteira } from "../paineis/LinhaCarteira";
import { ResultadoDaBusca, useCarteira } from "../paineis/busca";
import { TEXTOS } from "../paineis/textos";
import type { LinhaDaCarteira } from "../paineis/tipos";
import { useSessao } from "../sessao/ProvedorSessao";

const T = TEXTOS.carteira;
const colacao = new Intl.Collator("pt-BR");

type Coluna = "nome" | "aApropriar" | "consulta";
type Direcao = "ascending" | "descending";
type Ordem = { coluna: Coluna; direcao: Direcao };

/** Direção da primeira ordenação de cada coluna: nome do A ao Z, maior pendente primeiro, consulta mais antiga primeiro. */
const PRIMEIRA: Record<Coluna, Direcao> = { nome: "ascending", aApropriar: "descending", consulta: "ascending" };

function ordenar(linhas: readonly LinhaDaCarteira[], { coluna, direcao }: Ordem): LinhaDaCarteira[] {
  const fator = direcao === "ascending" ? 1 : -1;
  const porNome = (a: LinhaDaCarteira, b: LinhaDaCarteira) => colacao.compare(a.nome, b.nome);
  return [...linhas].sort((a, b) => {
    if (coluna === "nome") return fator * porNome(a, b);
    if (coluna === "aApropriar") {
      const x = a.creditos.aApropriar;
      const y = b.creditos.aApropriar;
      // as empresas sem valor ficam sempre no fim
      if (x === null || y === null) return x === y ? porNome(a, b) : x === null ? 1 : -1;
      return fator * compararDecimal(x, y) || porNome(a, b);
    }
    // sem consulta concluída conta como a mais antiga: vem primeiro na ordem crescente
    const x = a.situacao.ultimaConcluidaEm ?? "";
    const y = b.situacao.ultimaConcluidaEm ?? "";
    return fator * (x < y ? -1 : x > y ? 1 : 0) || porNome(a, b);
  });
}

function Cabecalho({
  coluna,
  ordem,
  aoOrdenar,
  children,
  campo,
}: {
  coluna: Coluna;
  ordem: Ordem;
  aoOrdenar: (c: Coluna) => void;
  children: string;
  campo?: string;
}) {
  const ativa = ordem.coluna === coluna;
  return (
    <th aria-sort={ativa ? ordem.direcao : undefined}>
      <button type="button" className={ativa ? "cg-sort is-active" : "cg-sort"} onClick={() => aoOrdenar(coluna)}>
        {children}
      </button>
      {campo ? <span className="cg-total-field"> {campo}</span> : null}
    </th>
  );
}

export function Carteira() {
  const { sair } = useSessao();
  const navegar = useNavigate();
  const consulta = useCarteira();
  const [ordem, setOrdem] = useState<Ordem>({ coluna: "nome", direcao: "ascending" });
  const [erroSaida, setErroSaida] = useState(false);

  const aoOrdenar = (coluna: Coluna) =>
    setOrdem((o) =>
      o.coluna === coluna ? { coluna, direcao: o.direcao === "ascending" ? "descending" : "ascending" } : { coluna, direcao: PRIMEIRA[coluna] },
    );

  async function aoSair() {
    setErroSaida(false);
    if (await sair()) navegar("/entrar", { replace: true });
    else setErroSaida(true);
  }

  const linhas = useMemo(() => (consulta.data ? ordenar(consulta.data.empresas, ordem) : []), [consulta.data, ordem]);

  return (
    <main className="pagina-carteira">
      <div className="pagina-carteira-corpo">
        <img className="pagina-cartao-logo" src="/logo.png" alt="CreditoGov" />
        {erroSaida ? <Alerta tipo="error" titulo="Não conseguimos encerrar a sessão no servidor. Tente de novo." /> : null}
        <ResultadoDaBusca consulta={consulta}>
          {(r) =>
            r.empresas.length === 0 ? (
              <div className="cg-empty">
                <span className="cg-empty-icon">
                  <Icone nome="predio" grande />
                </span>
                <p className="cg-empty-text">
                  Você ainda não tem acesso a nenhuma empresa. Peça um convite à equipe CreditoGov ou ao seu contador.
                </p>
              </div>
            ) : (
              <>
                <h1 className="heading">{T.titulo}</h1>
                <p className="cg-help">{T.subtitulo}</p>
                <section className="cg-card" aria-label="Carteira de empresas">
                  <div className="cg-table-wrap">
                    <table className="cg-table" aria-label={T.titulo}>
                      <thead>
                        <tr>
                          <Cabecalho coluna="nome" ordem={ordem} aoOrdenar={aoOrdenar}>
                            {T.colunaEmpresa}
                          </Cabecalho>
                          <Cabecalho coluna="aApropriar" ordem={ordem} aoOrdenar={aoOrdenar} campo={TEXTOS.aApropriar.campo}>
                            {TEXTOS.aApropriar.rotulo}
                          </Cabecalho>
                          <th>
                            {TEXTOS.apropriado.rotulo} <span className="cg-total-field">{TEXTOS.apropriado.campo}</span>
                          </th>
                          <th>
                            {TEXTOS.utilizado.rotulo} <span className="cg-total-field">{TEXTOS.utilizado.campo}</span>
                          </th>
                          <th>{T.colunaSituacao}</th>
                          <Cabecalho coluna="consulta" ordem={ordem} aoOrdenar={aoOrdenar}>
                            {T.colunaConsulta}
                          </Cabecalho>
                        </tr>
                      </thead>
                      <tbody>
                        {linhas.map((l) => (
                          <LinhaCarteira key={l.id} linha={l} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )
          }
        </ResultadoDaBusca>
        <button type="button" className="cg-btn cg-btn-secondary" onClick={() => void aoSair()}>
          Sair
        </button>
      </div>
    </main>
  );
}
