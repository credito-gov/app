// Uma linha da carteira (CA-C1 a CA-C3): nome, CNPJ raiz e papel, os três valores com o estado no lugar
// quando não há número, selo de situação (design 3.4) e a data da última consulta. Nada soma empresas (CA-C4).
import type { MouseEvent } from "react";
import { Link, useNavigate } from "react-router";
import { ROTULO_PAPEL } from "../api/papeis";
import { formatarInstante } from "../formatacao/datas";
import { Dinheiro } from "./blocos";
import { TEXTOS } from "./textos";
import type { LinhaDaCarteira } from "./tipos";

const T = TEXTOS.carteira;

function Selo({ situacao }: { situacao: LinhaDaCarteira["situacao"] }) {
  const resumo = situacao.resumo;
  switch (resumo) {
    case "atualizado":
      return <span className="cg-badge cg-badge-brand">{T.selos.atualizado}</span>;
    case "falhou":
      return <span className="cg-badge cg-badge-danger">{T.selos.falhou}</span>;
    case "sem_consulta":
      return <span className="cg-badge cg-badge-info">{T.selos.sem_consulta}</span>;
    case "desatualizado":
      return <span className="cg-badge cg-badge-pending">{T.selos.desatualizado(situacao.diasSemAtualizacao ?? 0)}</span>;
    default: {
      // Resumo novo no servidor que a tela ainda não conhece: selo neutro, nunca "Atualizado".
      const _exaustivo: never = resumo;
      void _exaustivo;
      return <span className="cg-badge cg-badge-info">{T.selos.sem_consulta}</span>;
    }
  }
}

/** O valor, ou o texto do estado quando a Receita não devolveu número (nunca R$ 0,00 inventado). */
function Valor({ valor, estado }: { valor: string | null; estado: LinhaDaCarteira["creditos"]["estado"] }) {
  if (valor !== null) return <Dinheiro valor={valor} />;
  const texto = estado === "com_dados" ? T.estados.sem_dados_usaveis : T.estados[estado];
  return <span className="cg-money is-na">{texto}</span>;
}

export function LinhaCarteira({ linha }: { linha: LinhaDaCarteira }) {
  const navegar = useNavigate();
  const destino = `/e/${linha.id}`;
  // O clique em qualquer parte da linha leva à empresa; o link do nome já navega sozinho.
  const aoClicar = (e: MouseEvent<HTMLTableRowElement>) => {
    if ((e.target as HTMLElement).closest("a")) return;
    navegar(destino);
  };
  const c = linha.creditos;
  return (
    <tr className="carteira-linha" onClick={aoClicar}>
      <td>
        <div className="cg-company">
          <Link className="cg-rowlink" to={destino}>
            {linha.nome}
          </Link>
          <span className="cg-company-meta">{T.cnpjRaiz(linha.cnpjRaizFormatado)}</span>
          <span className="cg-company-meta">{ROTULO_PAPEL[linha.papel]}</span>
        </div>
      </td>
      <td className="is-num">
        <Valor valor={c.aApropriar} estado={c.estado} />
      </td>
      <td className="is-num">
        <Valor valor={c.apropriado} estado={c.estado} />
      </td>
      <td className="is-num">
        <Valor valor={c.utilizado} estado={c.estado} />
      </td>
      <td>
        <Selo situacao={linha.situacao} />
        {linha.situacao.recusados.creditos !== null || linha.situacao.recusados.debitos !== null ? (
          <span className="cg-company-meta">{T.recusados}</span>
        ) : null}
      </td>
      <td>{linha.situacao.ultimaAceitaEm === null ? T.semData : formatarInstante(linha.situacao.ultimaAceitaEm)}</td>
    </tr>
  );
}
