import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { requisitar, type DadosSessao, type Papel } from "../api/cliente";
import { ROTULO_PAPEL } from "../api/papeis";
import { Alerta } from "../componentes/Alerta";
import { AlertaDeRede, ehFalhaDeRede, type FalhaDeRede } from "../componentes/AlertaDeRede";
import { CampoTexto } from "../componentes/Campo";
import { CampoSenha } from "../componentes/CampoSenha";
import { Icone } from "../componentes/Icone";
import { PaginaCartao, REGRA_SENHA } from "../componentes/PaginaCartao";
import { useSessao } from "../sessao/ProvedorSessao";
import { destinoPosLogin } from "../sessao/destino";
import { lerFragmento, useApagarFragmento } from "../sessao/fragmento";

type Convite = {
  empresa: { nome: string; cnpjRaizFormatado: string };
  papel: Papel;
  emailMascarado: string;
  contaExistente: boolean;
};

type Carga =
  | { tipo: "carregando" }
  | { tipo: "invalido" }
  | { tipo: "erro" }
  | { tipo: "rede"; falha: FalhaDeRede }
  | { tipo: "ok"; convite: Convite };
type Erros = { nome?: string; senha?: string; confirmacao?: string };

export function AceitarConvite() {
  const { iniciarSessao } = useSessao();
  const navegar = useNavigate();
  const [{ empresaId, token }] = useState(() => {
    const f = lerFragmento();
    return { empresaId: f.get("e") ?? "", token: f.get("t") ?? "" };
  });
  const [carga, setCarga] = useState<Carga>(empresaId && token ? { tipo: "carregando" } : { tipo: "invalido" });
  const [tentativa, setTentativa] = useState(0);

  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erros, setErros] = useState<Erros>({});
  const [aviso, setAviso] = useState<"credencial" | "muitas_tentativas" | FalhaDeRede | "outro" | null>(null);
  const [enviando, setEnviando] = useState(false);

  useApagarFragmento();

  useEffect(() => {
    if (!empresaId || !token) return;
    let ativo = true;
    void requisitar<Convite>("POST", "/api/convites/consultar", { corpo: { empresaId, token } }).then((r) => {
      if (!ativo) return;
      if (r.tipo === "ok") setCarga({ tipo: "ok", convite: r.dados });
      else if (ehFalhaDeRede(r)) setCarga({ tipo: "rede", falha: r.tipo });
      else if (r.status === 410) setCarga({ tipo: "invalido" });
      else setCarga({ tipo: "erro" });
    });
    return () => {
      ativo = false;
    };
  }, [empresaId, token, tentativa]);

  if (carga.tipo === "carregando") {
    return (
      <PaginaCartao titulo="Convite">
        <p className="cg-help" role="status">
          Carregando…
        </p>
      </PaginaCartao>
    );
  }
  if (carga.tipo === "invalido") {
    return (
      <PaginaCartao titulo="Este convite não vale mais">
        <p className="entrar-subtitulo">Ele pode ter vencido ou já ter sido usado. Peça um novo convite a quem convidou.</p>
      </PaginaCartao>
    );
  }
  if (carga.tipo === "rede" || carga.tipo === "erro") {
    const tentarDeNovo = () => {
      setCarga({ tipo: "carregando" });
      setTentativa((t) => t + 1);
    };
    return (
      <PaginaCartao titulo="Convite">
        {carga.tipo === "rede" ? (
          <AlertaDeRede aoTentar={tentarDeNovo} />
        ) : (
          <Alerta
            tipo="error"
            titulo="Não foi possível carregar o convite"
            acao={
              <div>
                <button type="button" className="cg-btn cg-btn-secondary cg-btn-sm" onClick={tentarDeNovo}>
                  Tentar de novo
                </button>
              </div>
            }
          />
        )}
      </PaginaCartao>
    );
  }

  const convite = carga.convite;

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setAviso(null);
    const novos: Erros = {};
    if (!convite.contaExistente) {
      if (nome.trim() === "") novos.nome = "Informe o nome.";
      if (senha === "") novos.senha = "Informe a senha.";
      else if (senha !== confirmacao) novos.confirmacao = "As senhas não são iguais.";
    } else if (senha === "") {
      novos.senha = "Informe a senha.";
    }
    setErros(novos);
    if (Object.keys(novos).length > 0) return;

    setEnviando(true);
    const corpo: Record<string, string> = { empresaId, token, senha };
    if (!convite.contaExistente) corpo.nome = nome.trim();
    const r = await requisitar<DadosSessao>("POST", "/api/convites/aceitar", { corpo });
    setEnviando(false);

    if (r.tipo === "ok") {
      iniciarSessao(r.dados);
      navegar(destinoPosLogin(r.dados.empresas), { replace: true });
    } else if (ehFalhaDeRede(r)) setAviso(r.tipo);
    else if (r.codigo === "convite_aceito_sem_sessao") {
      // O aceite foi gravado, mas a sessão não abriu: entrar com a senha escolhida.
      navegar("/entrar?motivo=convite_aceito", { replace: true });
    } else if (r.status === 410) setCarga({ tipo: "invalido" });
    else if (r.status === 401) setAviso("credencial");
    else if (r.status === 429) setAviso("muitas_tentativas");
    else if (r.status === 400 && r.codigo === "senha_invalida") setErros({ senha: r.mensagem || REGRA_SENHA });
    else setAviso("outro");
  }

  return (
    <PaginaCartao titulo="Você foi convidado">
      <p className="pagina-cartao-dados">
        <strong>{convite.empresa.nome}</strong>
        <span className="cg-help">CNPJ raiz {convite.empresa.cnpjRaizFormatado}</span>
        <span>Papel: {ROTULO_PAPEL[convite.papel]}</span>
        {convite.contaExistente ? <span>Conta: {convite.emailMascarado}</span> : null}
      </p>
      {aviso === "credencial" ? <Alerta tipo="error" titulo="Senha incorreta. Confira a senha da sua conta." /> : null}
      {aviso === "muitas_tentativas" ? (
        <Alerta tipo="warning" titulo="Muitas tentativas. Tente de novo em alguns minutos." />
      ) : null}
      {aviso === "sem_conexao" ? <AlertaDeRede /> : null}
      {aviso === "outro" ? <Alerta tipo="error" titulo="Não foi possível aceitar o convite" /> : null}
      <form className="entrar-cartao" onSubmit={enviar} noValidate>
        {convite.contaExistente ? (
          <CampoSenha id="senha" rotulo="Senha atual" autoComplete="current-password" valor={senha} aoMudar={setSenha} erro={erros.senha} desabilitado={enviando} />
        ) : (
          <>
            <CampoTexto id="nome" rotulo="Nome" autoComplete="name" valor={nome} aoMudar={setNome} erro={erros.nome} desabilitado={enviando} />
            <CampoSenha id="senha" rotulo="Senha" autoComplete="new-password" valor={senha} aoMudar={setSenha} erro={erros.senha} ajuda={REGRA_SENHA} desabilitado={enviando} />
            <CampoSenha id="confirmacao" rotulo="Confirmar senha" autoComplete="new-password" valor={confirmacao} aoMudar={setConfirmacao} erro={erros.confirmacao} desabilitado={enviando} />
          </>
        )}
        <button type="submit" className="cg-btn cg-btn-primary cg-btn-lg cg-btn-block" disabled={enviando} aria-busy={enviando}>
          {enviando ? <Icone nome="carregando" girando /> : null}
          Aceitar convite
        </button>
      </form>
    </PaginaCartao>
  );
}
