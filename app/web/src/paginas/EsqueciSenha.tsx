import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { requisitar } from "../api/cliente";
import { Alerta } from "../componentes/Alerta";
import { AlertaDeRede, ehFalhaDeRede, type FalhaDeRede } from "../componentes/AlertaDeRede";
import { CampoTexto } from "../componentes/Campo";
import { Icone } from "../componentes/Icone";
import { PaginaCartao } from "../componentes/PaginaCartao";

type Estado = "formulario" | "enviado" | "muitas_tentativas" | "erro" | FalhaDeRede;

export function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | undefined>();
  const [estado, setEstado] = useState<Estado>("formulario");
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento?: FormEvent) {
    evento?.preventDefault();
    if (email.trim() === "") {
      setErro("Informe o e-mail.");
      return;
    }
    setErro(undefined);
    setEnviando(true);
    const r = await requisitar("POST", "/api/recuperacao", { corpo: { email: email.trim() } });
    setEnviando(false);
    if (ehFalhaDeRede(r)) setEstado(r.tipo);
    else if (r.tipo === "erro" && r.status === 429) setEstado("muitas_tentativas");
    else if (r.tipo === "ok" && r.status === 202) setEstado("enviado");
    else setEstado("erro");
  }

  if (estado === "enviado") {
    return (
      <PaginaCartao titulo="Esqueci a senha">
        <Alerta tipo="success" titulo="Se houver uma conta com esse e-mail, enviaremos um link para criar uma nova senha." />
        <Link className="cg-link" to="/entrar">
          Voltar para entrar
        </Link>
      </PaginaCartao>
    );
  }

  return (
    <PaginaCartao titulo="Esqueci a senha" subtitulo="Informe o e-mail cadastrado no CreditoGov.">
      {estado === "muitas_tentativas" ? (
        <Alerta tipo="warning" titulo="Muitas tentativas. Tente de novo em alguns minutos." />
      ) : null}
      {estado === "sem_conexao" ? (
        <AlertaDeRede aoTentar={() => void enviar()} />
      ) : null}
      {estado === "erro" ? (
        <Alerta
          tipo="error"
          titulo="Não foi possível enviar o link. Tente de novo."
          acao={
            <div>
              <button type="button" className="cg-btn cg-btn-secondary cg-btn-sm" onClick={() => void enviar()}>
                Tentar de novo
              </button>
            </div>
          }
        />
      ) : null}
      <form className="entrar-cartao" onSubmit={enviar} noValidate>
        <CampoTexto id="email" rotulo="E-mail" tipo="email" autoComplete="username" valor={email} aoMudar={setEmail} erro={erro} desabilitado={enviando} />
        <button type="submit" className="cg-btn cg-btn-primary cg-btn-lg cg-btn-block" disabled={enviando} aria-busy={enviando}>
          {enviando ? <Icone nome="carregando" girando /> : null}
          Enviar link
        </button>
        <Link className="cg-link" to="/entrar">
          Voltar para entrar
        </Link>
      </form>
    </PaginaCartao>
  );
}
