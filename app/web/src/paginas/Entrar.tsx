import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import type { Resultado, DadosSessao } from "../api/cliente";
import { Alerta } from "../componentes/Alerta";
import { AlertaDeRede, ehFalhaDeRede, type FalhaDeRede } from "../componentes/AlertaDeRede";
import { CampoTexto } from "../componentes/Campo";
import { CampoSenha } from "../componentes/CampoSenha";
import { Icone } from "../componentes/Icone";
import { PainelMarca } from "../componentes/PainelMarca";
import { useSessao } from "../sessao/ProvedorSessao";
import { destinoPosLogin } from "../sessao/destino";

type Falha = "credencial" | "muitas_tentativas" | FalhaDeRede | "outro" | null;

export function Entrar() {
  const { entrar } = useSessao();
  const navegar = useNavigate();
  const [params] = useSearchParams();
  const motivo = params.get("motivo");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erros, setErros] = useState<{ email?: string; senha?: string }>({});
  const [falha, setFalha] = useState<Falha>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento?: FormEvent) {
    evento?.preventDefault();
    const novos: { email?: string; senha?: string } = {};
    if (email.trim() === "") novos.email = "Informe o e-mail.";
    if (senha === "") novos.senha = "Informe a senha.";
    setErros(novos);
    setFalha(null);
    if (novos.email || novos.senha) return;

    setEnviando(true);
    const r: Resultado<DadosSessao> = await entrar(email.trim(), senha);
    setEnviando(false);

    if (r.tipo === "ok") {
      navegar(destinoPosLogin(r.dados.empresas), { replace: true });
    } else if (ehFalhaDeRede(r)) {
      setFalha(r.tipo);
    } else if (r.status === 401) {
      setFalha("credencial");
    } else if (r.status === 429) {
      setFalha("muitas_tentativas");
    } else if (r.status === 400 && r.campos?.length) {
      const doServidor: { email?: string; senha?: string } = {};
      for (const c of r.campos) {
        if (c.campo === "email") doServidor.email = c.mensagem;
        if (c.campo === "senha") doServidor.senha = c.mensagem;
      }
      setErros(doServidor);
    } else {
      setFalha("outro");
    }
  }

  return (
    <div className="entrar">
      <PainelMarca />
      <main className="entrar-formulario">
        <form className="entrar-cartao" onSubmit={enviar} noValidate>
          <h1 className="heading">Entrar</h1>
          <p className="entrar-subtitulo">Use o e-mail cadastrado no CreditoGov.</p>

          {motivo === "expirada" ? <Alerta tipo="info" titulo="Sua sessão expirou. Entre de novo." /> : null}
          {motivo === "convite_aceito" ? (
            <Alerta tipo="success" titulo="Convite aceito. Entre com seu e-mail e senha." />
          ) : null}
          {motivo === "senha_alterada" ? (
            <Alerta tipo="success" titulo="Senha alterada. Entre com a nova senha." />
          ) : null}
          {falha === "credencial" ? <Alerta tipo="error" titulo="E-mail ou senha incorretos" /> : null}
          {falha === "muitas_tentativas" ? (
            <Alerta tipo="warning" titulo="Muitas tentativas. Tente de novo em alguns minutos." />
          ) : null}
          {falha === "outro" ? (
            <Alerta tipo="error" titulo="Não foi possível entrar">
              Tente de novo em alguns instantes.
            </Alerta>
          ) : null}
          {falha === "sem_conexao" ? (
            <AlertaDeRede aoTentar={() => void enviar()} />
          ) : null}

          <CampoTexto
            id="email"
            rotulo="E-mail"
            tipo="email"
            autoComplete="username"
            valor={email}
            aoMudar={setEmail}
            erro={erros.email}
            desabilitado={enviando}
          />
          <CampoSenha
            id="senha"
            rotulo="Senha"
            autoComplete="current-password"
            valor={senha}
            aoMudar={setSenha}
            erro={erros.senha}
            desabilitado={enviando}
          />

          <div className="entrar-esqueci">
            <Link className="cg-link" to="/esqueci-senha">
              Esqueci a senha
            </Link>
          </div>

          <button type="submit" className="cg-btn cg-btn-primary cg-btn-lg cg-btn-block" disabled={enviando} aria-busy={enviando}>
            {enviando ? <Icone nome="carregando" girando /> : null}
            Entrar
          </button>

          <p className="entrar-acesso">
            Ainda não tem acesso? Fale com a equipe CreditoGov ou com o seu contador.
          </p>
        </form>
      </main>
    </div>
  );
}
