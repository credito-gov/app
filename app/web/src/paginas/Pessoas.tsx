import { useCallback, useEffect, useState, type FormEvent } from "react";
import { requisitar, type Papel } from "../api/cliente";
import { ROTULO_PAPEL } from "../api/papeis";
import { Alerta } from "../componentes/Alerta";
import { CampoTexto, Campo } from "../componentes/Campo";
import { useEmpresaEmFoco } from "../componentes/LayoutEmpresa";

type Pessoas = {
  vinculos: { usuarioId: string; nome: string; email: string; papel: Papel; desde: string }[];
  convitesPendentes: { id: string; email: string; papel: Papel; expiraEm: string }[];
  podeConvidar: Papel[];
  podeRemover: boolean;
};

type Retorno = { tipo: "sucesso" | "aviso" | "erro"; texto: string } | null;

const MOTIVO_ULTIMO_TITULAR = "Não é possível remover o último titular.";

function data(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function Pessoas() {
  const empresa = useEmpresaEmFoco();
  const base = `/api/empresas/${empresa.id}`;
  const [dados, setDados] = useState<Pessoas | null>(null);
  const [falha, setFalha] = useState<"sem_conexao" | "outro" | null>(null);

  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState<Papel | "">("");
  const [erroEmail, setErroEmail] = useState<string | undefined>();
  const [retorno, setRetorno] = useState<Retorno>(null);
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    const r = await requisitar<Pessoas>("GET", `${base}/pessoas`, { logada: true });
    if (r.tipo === "ok") {
      setDados(r.dados);
      setFalha(null);
    } else if (r.tipo === "sem_conexao") setFalha("sem_conexao");
    else if (r.status !== 401) setFalha("outro");
  }, [base]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (falha && !dados) {
    return (
      <Alerta tipo="error" titulo={falha === "sem_conexao" ? "Sem conexão" : "Não foi possível carregar as pessoas"}>
        {falha === "sem_conexao" ? "Não conseguimos falar com o servidor. Verifique a internet." : undefined}
      </Alerta>
    );
  }
  if (!dados) {
    return (
      <p className="cg-help" role="status">
        Carregando…
      </p>
    );
  }

  const titulares = dados.vinculos.filter((v) => v.papel === "titular").length;
  const papelEscolhido = papel && dados.podeConvidar.includes(papel) ? papel : dados.podeConvidar[0];

  async function convidar(evento: FormEvent) {
    evento.preventDefault();
    setRetorno(null);
    if (email.trim() === "") {
      setErroEmail("Informe o e-mail.");
      return;
    }
    setErroEmail(undefined);
    setEnviando(true);
    const r = await requisitar("POST", `${base}/convites`, { corpo: { email: email.trim(), papel: papelEscolhido }, logada: true });
    setEnviando(false);
    if (r.tipo === "ok") {
      setRetorno({ tipo: "sucesso", texto: "Convite enviado" });
      setEmail("");
      void carregar();
    } else if (r.tipo === "sem_conexao") setRetorno({ tipo: "erro", texto: "Sem conexão" });
    else if (r.status === 409) setRetorno({ tipo: "aviso", texto: "Esta pessoa já tem acesso a esta empresa." });
    else if (r.status === 403) setRetorno({ tipo: "erro", texto: "Você não pode convidar para este papel." });
    else if (r.status === 400) setErroEmail("Informe um e-mail válido.");
    else if (r.status !== 401) setRetorno({ tipo: "erro", texto: "Não foi possível enviar o convite." });
  }

  async function remover(usuarioId: string) {
    setRetorno(null);
    const r = await requisitar("DELETE", `${base}/vinculos/${usuarioId}`, { logada: true });
    if (r.tipo === "ok") void carregar();
    else if (r.tipo === "sem_conexao") setRetorno({ tipo: "erro", texto: "Sem conexão" });
    else if (r.status === 409) setRetorno({ tipo: "erro", texto: MOTIVO_ULTIMO_TITULAR });
    else if (r.status === 403) setRetorno({ tipo: "erro", texto: "Só o titular pode remover pessoas." });
    else if (r.status !== 401) setRetorno({ tipo: "erro", texto: "Não foi possível remover o acesso." });
  }

  return (
    <div className="pessoas">
      <h1 className="heading">Pessoas</h1>

      {retorno ? <Alerta tipo={retorno.tipo === "sucesso" ? "success" : retorno.tipo === "aviso" ? "warning" : "error"} titulo={retorno.texto} /> : null}

      <section className="cg-card" aria-labelledby="titulo-vinculos">
        <div className="cg-card-head">
          <h2 className="cg-card-title" id="titulo-vinculos">
            Com acesso
          </h2>
        </div>
        <div className="cg-table-wrap">
          <table className="cg-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Papel</th>
                <th>Desde</th>
                {dados.podeRemover ? <th>Ações</th> : null}
              </tr>
            </thead>
            <tbody>
              {dados.vinculos.map((v) => {
                const ultimo = v.papel === "titular" && titulares <= 1;
                const idMotivo = `motivo-${v.usuarioId}`;
                return (
                  <tr key={v.usuarioId}>
                    <td className="is-strong">{v.nome}</td>
                    <td>{v.email}</td>
                    <td>{ROTULO_PAPEL[v.papel]}</td>
                    <td>{data(v.desde)}</td>
                    {dados.podeRemover ? (
                      <td>
                        <button
                          type="button"
                          className="cg-btn cg-btn-danger cg-btn-sm"
                          aria-label={`Remover ${v.nome}`}
                          disabled={ultimo}
                          aria-describedby={ultimo ? idMotivo : undefined}
                          onClick={() => void remover(v.usuarioId)}
                        >
                          Remover
                        </button>
                        {ultimo ? (
                          <span className="cg-help" id={idMotivo}>
                            {MOTIVO_ULTIMO_TITULAR}
                          </span>
                        ) : null}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {dados.convitesPendentes.length > 0 ? (
        <section className="cg-card" aria-labelledby="titulo-convites">
          <div className="cg-card-head">
            <h2 className="cg-card-title" id="titulo-convites">
              Convites pendentes
            </h2>
          </div>
          <div className="cg-table-wrap">
            <table className="cg-table">
              <thead>
                <tr>
                  <th>E-mail</th>
                  <th>Papel</th>
                  <th>Válido até</th>
                </tr>
              </thead>
              <tbody>
                {dados.convitesPendentes.map((c) => (
                  <tr key={c.id}>
                    <td>{c.email}</td>
                    <td>{ROTULO_PAPEL[c.papel]}</td>
                    <td>{data(c.expiraEm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {dados.podeConvidar.length > 0 ? (
        <section className="cg-card" aria-labelledby="titulo-convidar">
          <div className="cg-card-head">
            <h2 className="cg-card-title" id="titulo-convidar">
              Convidar
            </h2>
          </div>
          <form className="cg-card-body pessoas-convidar" onSubmit={convidar} noValidate>
            <CampoTexto id="convite-email" rotulo="E-mail" tipo="email" valor={email} aoMudar={setEmail} erro={erroEmail} desabilitado={enviando} />
            <Campo id="convite-papel" rotulo="Papel">
              <select
                id="convite-papel"
                className="cg-select"
                value={papelEscolhido}
                onChange={(e) => setPapel(e.target.value as Papel)}
                disabled={enviando}
              >
                {dados.podeConvidar.map((p) => (
                  <option key={p} value={p}>
                    {ROTULO_PAPEL[p]}
                  </option>
                ))}
              </select>
            </Campo>
            <button type="submit" className="cg-btn cg-btn-primary" disabled={enviando} aria-busy={enviando}>
              Enviar convite
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
