// Visão geral (dashboard) da empresa em foco: I-1 a I-9 do recorte escolhido (CA-1 a CA-25).
import { useSearchParams } from "react-router";
import { formatarPeriodo } from "../formatacao/datas";
import { useEmpresaEmFoco } from "../componentes/LayoutEmpresa";
import { AvisoOrigens, AvisoSoCbs, BlocoDebitos, CartoesDeCredito, EvolucaoPorPeriodo, OutrosValores, PendentePorEmitente } from "../paineis/blocos";
import { ResultadoDaBusca, usePainel } from "../paineis/busca";
import { TEXTOS } from "../paineis/textos";
import type { Painel } from "../paineis/tipos";
import { EstadoDoBloco, SituacaoDosDados } from "../paineis/situacao";

function SeletorRecorte({ painel, aoEscolher }: { painel: Painel; aoEscolher: (periodo: string | null) => void }) {
  const atual = painel.recorte.periodo;
  const periodos = atual !== null && !painel.recorte.periodos.includes(atual) ? [...painel.recorte.periodos, atual].sort() : painel.recorte.periodos;
  return (
    <div className="painel-recorte">
      <label className="cg-label" htmlFor="recorte-periodo">
        {TEXTOS.periodo}
      </label>
      <select id="recorte-periodo" className="cg-select" value={atual ?? ""} onChange={(e) => aoEscolher(e.target.value === "" ? null : e.target.value)}>
        <option value="">{TEXTOS.todosOsPeriodos}</option>
        {periodos.map((p) => (
          <option key={p} value={p}>
            {formatarPeriodo(p)}
          </option>
        ))}
      </select>
    </div>
  );
}

export function VisaoGeral() {
  const empresa = useEmpresaEmFoco();
  const [params, setParams] = useSearchParams();
  const periodo = params.get("periodo");
  const consulta = usePainel(empresa.id, periodo);

  const escolher = (novo: string | null) => {
    const proximo = new URLSearchParams(params);
    if (novo === null) proximo.delete("periodo");
    else proximo.set("periodo", novo);
    setParams(proximo);
  };

  return (
    <div className="painel">
      <h1 className="heading">{TEXTOS.titulo}</h1>
      <ResultadoDaBusca consulta={consulta}>
        {(painel) => {
          const recorte = painel.recorte.periodo === null ? TEXTOS.todosOsPeriodos : formatarPeriodo(painel.recorte.periodo);
          return (
            <>
              <h2 className="painel-recorte-titulo">{TEXTOS.tela.recorte} {recorte}</h2>
              <SeletorRecorte painel={painel} aoEscolher={escolher} />
              <SituacaoDosDados situacao={painel.situacao} />
              <section className="painel-bloco" aria-label={TEXTOS.creditos}>
                <h3 className="cg-card-title">{TEXTOS.creditos}</h3>
                <EstadoDoBloco servico="creditos" situacao={painel.situacao.creditos} semNotas={painel.creditos?.semNotasNoRecorte === true}>
                  {painel.creditos && !painel.creditos.semNotasNoRecorte ? (
                    <>
                      <CartoesDeCredito creditos={painel.creditos} />
                      <AvisoOrigens origens={painel.creditos.origens} />
                      <OutrosValores outros={painel.creditos.outros} />
                      <PendentePorEmitente pendentes={painel.creditos.pendentes} empresaId={empresa.id} periodo={painel.recorte.periodo} />
                      <EvolucaoPorPeriodo creditos={painel.creditos} />
                    </>
                  ) : null}
                </EstadoDoBloco>
              </section>
              <section className="painel-bloco" aria-label={TEXTOS.debitos}>
                <h3 className="cg-card-title">{TEXTOS.debitos}</h3>
                <EstadoDoBloco servico="debitos" situacao={painel.situacao.debitos} semNotas={painel.debitos?.semNotasNoRecorte === true}>
                  {painel.debitos && !painel.debitos.semNotasNoRecorte ? (
                    <>
                      <BlocoDebitos debitos={painel.debitos} />
                      <AvisoOrigens origens={painel.debitos.origens} />
                      <p className="cg-help">{TEXTOS.notaDebitos}</p>
                    </>
                  ) : null}
                </EstadoDoBloco>
              </section>
              <AvisoSoCbs />
            </>
          );
        }}
      </ResultadoDaBusca>
    </div>
  );
}
