import { Link, useNavigate } from "react-router";
import { ROTULO_PAPEL } from "../api/papeis";
import { Icone } from "../componentes/Icone";
import { useSessao } from "../sessao/ProvedorSessao";

export function EscolherEmpresa() {
  const { estado, sair } = useSessao();
  const navegar = useNavigate();
  const empresas = estado.status === "logada" ? estado.empresas : [];

  async function aoSair() {
    await sair();
    navegar("/entrar", { replace: true });
  }

  return (
    <main className="pagina-cartao">
      <div className="pagina-cartao-corpo">
        <img className="pagina-cartao-logo" src="/logo.png" alt="CreditoGov" />
        {empresas.length === 0 ? (
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
            <h1 className="heading">Escolha a empresa</h1>
            <ul className="lista-empresas cg-card">
              {empresas.map((e) => (
                <li key={e.id} className="lista-empresas-item">
                  <div className="cg-company">
                    <Link className="cg-rowlink" to={`/e/${e.id}`}>
                      {e.nome}
                    </Link>
                    <span className="cg-company-meta">CNPJ raiz {e.cnpjRaizFormatado}</span>
                  </div>
                  <span className="cg-badge">{ROTULO_PAPEL[e.papel]}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        <button type="button" className="cg-btn cg-btn-secondary" onClick={() => void aoSair()}>
          Sair
        </button>
      </div>
    </main>
  );
}
