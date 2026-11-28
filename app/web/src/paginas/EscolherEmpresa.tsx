import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { requisitar, type Empresa } from "../api/cliente";
import { ROTULO_PAPEL } from "../api/papeis";
import { Alerta } from "../componentes/Alerta";
import { AlertaDeRede, ehFalhaDeRede, type FalhaDeRede } from "../componentes/AlertaDeRede";
import { Icone } from "../componentes/Icone";
import { useSessao } from "../sessao/ProvedorSessao";

export function EscolherEmpresa() {
  const { estado, sair, atualizarEmpresas } = useSessao();
  const navegar = useNavigate();
  const empresas = estado.status === "logada" ? estado.empresas : [];
  const [carga, setCarga] = useState<{ tipo: "carregando" } | { tipo: "ok" } | { tipo: "erro" } | { tipo: "rede"; falha: FalhaDeRede }>({
    tipo: "carregando",
  });
  const [tentativa, setTentativa] = useState(0);
  const [erroSaida, setErroSaida] = useState(false);

  // A lista gravada no login pode estar velha (um vínculo removido, um convite aceito):
  // ao abrir, pergunta de novo ao servidor.
  useEffect(() => {
    let ativo = true;
    void requisitar<Empresa[]>("GET", "/api/empresas", { logada: true }).then((r) => {
      if (!ativo) return;
      if (r.tipo === "ok") {
        atualizarEmpresas(r.dados);
        setCarga({ tipo: "ok" });
      } else if (ehFalhaDeRede(r)) setCarga({ tipo: "rede", falha: r.tipo });
      else if (r.status !== 401) setCarga({ tipo: "erro" });
    });
    return () => {
      ativo = false;
    };
  }, [tentativa, atualizarEmpresas]);

  async function aoSair() {
    setErroSaida(false);
    if (await sair()) navegar("/entrar", { replace: true });
    else setErroSaida(true);
  }

  const tentarDeNovo = () => {
    setCarga({ tipo: "carregando" });
    setTentativa((t) => t + 1);
  };

  return (
    <main className="pagina-cartao">
      <div className="pagina-cartao-corpo">
        <img className="pagina-cartao-logo" src="/logo.png" alt="CreditoGov" />
        {erroSaida ? <Alerta tipo="error" titulo="Não conseguimos encerrar a sessão no servidor. Tente de novo." /> : null}
        {carga.tipo === "carregando" ? (
          <p className="cg-help" role="status">
            Carregando…
          </p>
        ) : carga.tipo === "rede" ? (
          <AlertaDeRede aoTentar={tentarDeNovo} />
        ) : carga.tipo === "erro" ? (
          <Alerta
            tipo="error"
            titulo="Não foi possível carregar as empresas"
            acao={
              <div>
                <button type="button" className="cg-btn cg-btn-secondary cg-btn-sm" onClick={tentarDeNovo}>
                  Tentar de novo
                </button>
              </div>
            }
          />
        ) : empresas.length === 0 ? (
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
