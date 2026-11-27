import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { requisitar } from "../api/cliente";
import { Alerta } from "../componentes/Alerta";
import { CampoSenha } from "../componentes/CampoSenha";
import { Icone } from "../componentes/Icone";
import { PaginaCartao, REGRA_SENHA } from "../componentes/PaginaCartao";
import { apagarFragmento, lerFragmento } from "../sessao/fragmento";

export function RedefinirSenha() {
  const navegar = useNavigate();
  const [token] = useState(() => lerFragmento().get("t") ?? "");
  const [linkInvalido, setLinkInvalido] = useState(token === "");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erroSenha, setErroSenha] = useState<string | undefined>();
  const [erroConfirmacao, setErroConfirmacao] = useState<string | undefined>();
  const [aviso, setAviso] = useState<"muitas_tentativas" | "sem_conexao" | "outro" | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    apagarFragmento();
  }, []);

  if (linkInvalido) {
    return (
      <PaginaCartao titulo="Este link não vale mais">
        <p className="entrar-subtitulo">Ele pode ter vencido ou já ter sido usado. Peça um link novo.</p>
        <Link className="cg-btn cg-btn-primary" to="/esqueci-senha">
          Pedir outro link
        </Link>
      </PaginaCartao>
    );
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setAviso(null);
    setErroSenha(undefined);
    setErroConfirmacao(undefined);
    if (senha === "") {
      setErroSenha("Informe a nova senha.");
      return;
    }
    if (senha !== confirmacao) {
      setErroConfirmacao("As senhas não são iguais.");
      return;
    }
    setEnviando(true);
    const r = await requisitar("POST", "/api/recuperacao/confirmar", { corpo: { token, senha } });
    setEnviando(false);
    if (r.tipo === "ok") navegar("/entrar?motivo=senha_alterada", { replace: true });
    else if (r.tipo === "sem_conexao") setAviso("sem_conexao");
    else if (r.status === 410) setLinkInvalido(true);
    else if (r.status === 400 && r.codigo === "senha_invalida") setErroSenha(r.mensagem || REGRA_SENHA);
    else if (r.status === 429) setAviso("muitas_tentativas");
    else setAviso("outro");
  }

  return (
    <PaginaCartao titulo="Nova senha">
      {aviso === "sem_conexao" ? (
        <Alerta tipo="error" titulo="Sem conexão">
          Não conseguimos falar com o servidor. Verifique a internet.
        </Alerta>
      ) : null}
      {aviso === "muitas_tentativas" ? (
        <Alerta tipo="warning" titulo="Muitas tentativas. Tente de novo em alguns minutos." />
      ) : null}
      {aviso === "outro" ? <Alerta tipo="error" titulo="Não foi possível salvar a nova senha" /> : null}
      <form className="entrar-cartao" onSubmit={enviar} noValidate>
        <CampoSenha id="senha" rotulo="Nova senha" autoComplete="new-password" valor={senha} aoMudar={setSenha} erro={erroSenha} ajuda={REGRA_SENHA} desabilitado={enviando} />
        <CampoSenha id="confirmacao" rotulo="Confirmar nova senha" autoComplete="new-password" valor={confirmacao} aoMudar={setConfirmacao} erro={erroConfirmacao} desabilitado={enviando} />
        <button type="submit" className="cg-btn cg-btn-primary cg-btn-lg cg-btn-block" disabled={enviando} aria-busy={enviando}>
          {enviando ? <Icone nome="carregando" girando /> : null}
          Salvar nova senha
        </button>
      </form>
    </PaginaCartao>
  );
}
