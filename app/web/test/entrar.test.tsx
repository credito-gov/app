import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CampoSenha } from "../src/componentes/CampoSenha";
import { Entrar } from "../src/paginas/Entrar";
import { EMPRESA_A, EMPRESA_B, SEM_SESSAO, USUARIO, json, renderizar, simularFetch, type Chamada, type RespostaSimulada } from "./auxiliar";
import { useState } from "react";

const rotas = [
  { path: "/entrar", element: <Entrar /> },
  { path: "/e/:empresaId", element: <p>Destino da empresa</p> },
  { path: "/empresas", element: <p>Lista de empresas</p> },
  { path: "/esqueci-senha", element: <p>Tela de esqueci a senha</p> },
];

const ERRO_CREDENCIAL = json(401, { erro: "credencial_invalida", mensagem: "E-mail ou senha incorretos" });

function simular(login: (c: Chamada) => RespostaSimulada | Promise<RespostaSimulada>) {
  return simularFetch((c) => (c.metodo === "POST" && c.url === "/api/sessao" ? login(c) : SEM_SESSAO));
}

async function preencher(email = "maria@exemplo.com.br", senha = "senha-de-exemplo-1") {
  await userEvent.type(screen.getByLabelText("E-mail"), email);
  await userEvent.type(screen.getByLabelText("Senha"), senha);
}

const entrarBotao = () => screen.getByRole("button", { name: "Entrar" });

describe("Entrar: conteúdo (CA-7, CA-18)", () => {
  beforeEach(() => simular(() => ERRO_CREDENCIAL));

  it("não tem provedor externo, divisor nem criar conta", () => {
    renderizar(rotas, "/entrar");
    expect(screen.queryByText(/google/i)).toBeNull();
    expect(screen.queryByText(/microsoft/i)).toBeNull();
    expect(screen.queryByText(/ou com e-?mail/i)).toBeNull();
    expect(screen.queryByText(/criar conta/i)).toBeNull();
  });

  it("mostra os textos do formulário da Spec", () => {
    renderizar(rotas, "/entrar");
    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.getByText("Use o e-mail cadastrado no CreditoGov.")).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mostrar senha" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Esqueci a senha" })).toHaveAttribute("href", "/esqueci-senha");
    expect(
      screen.getByText("Ainda não tem acesso? Fale com a equipe CreditoGov ou com o seu contador."),
    ).toBeInTheDocument();
  });

  it("com ?motivo=expirada mostra o aviso de sessão expirada (CA-20)", () => {
    renderizar(rotas, "/entrar?motivo=expirada");
    expect(screen.getByText("Sua sessão expirou. Entre de novo.")).toBeInTheDocument();
  });

  it("com ?motivo=senha_alterada mostra o aviso de sucesso (CA-24)", () => {
    renderizar(rotas, "/entrar?motivo=senha_alterada");
    expect(screen.getByText("Senha alterada. Entre com a nova senha.")).toBeInTheDocument();
  });

  it("sem motivo não mostra aviso", () => {
    renderizar(rotas, "/entrar");
    expect(screen.queryByText("Sua sessão expirou. Entre de novo.")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("Entrar: envio (CA-15, CA-18)", () => {
  it("durante o envio o botão fica desabilitado, com indicador de carregamento", async () => {
    let liberar!: (r: RespostaSimulada) => void;
    simular(() => new Promise<RespostaSimulada>((resolve) => (liberar = resolve)));
    renderizar(rotas, "/entrar");
    await preencher();
    await userEvent.click(entrarBotao());
    const botao = await screen.findByRole("button", { name: /Entrar/ });
    expect(botao).toBeDisabled();
    expect(botao).toHaveAttribute("aria-busy", "true");
    expect(botao.querySelector(".cg-spin")).not.toBeNull();
    liberar(ERRO_CREDENCIAL);
    await waitFor(() => expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled());
  });

  it("manda e-mail e senha a POST /api/sessao", async () => {
    const chamadas = simular(() => ERRO_CREDENCIAL);
    renderizar(rotas, "/entrar");
    await preencher();
    await userEvent.click(entrarBotao());
    await screen.findByRole("alert");
    const post = chamadas.find((c) => c.metodo === "POST")!;
    expect(post.corpo).toEqual({ email: "maria@exemplo.com.br", senha: "senha-de-exemplo-1" });
  });

  it("401 mostra o alerta de credencial", async () => {
    simular(() => ERRO_CREDENCIAL);
    renderizar(rotas, "/entrar");
    await preencher();
    await userEvent.click(entrarBotao());
    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha incorretos");
  });

  it("429 mostra o aviso de muitas tentativas", async () => {
    simular(() => json(429, { erro: "muitas_tentativas", mensagem: "x" }));
    renderizar(rotas, "/entrar");
    await preencher();
    await userEvent.click(entrarBotao());
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Muitas tentativas. Tente de novo em alguns minutos.",
    );
  });

  it("fetch rejeitado mostra Sem conexão, e Tentar de novo reenvia", async () => {
    let tentativa = 0;
    const chamadas = simular(() =>
      ++tentativa === 1 ? "rejeitar" : json(200, { usuario: USUARIO, empresas: [EMPRESA_A] }),
    );
    renderizar(rotas, "/entrar");
    await preencher();
    await userEvent.click(entrarBotao());
    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent("Sem conexão");
    await userEvent.click(within(alerta).getByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByText("Destino da empresa")).toBeInTheDocument();
    expect(chamadas.filter((c) => c.metodo === "POST")).toHaveLength(2);
  });

  it("503 sem corpo em POST /api/sessao mostra Sem conexão, e não o alerta de credencial", async () => {
    simular(() => json(503));
    renderizar(rotas, "/entrar");
    await preencher();
    await userEvent.click(entrarBotao());
    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent("Sem conexão");
    expect(within(alerta).getByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
    expect(screen.queryByText("E-mail ou senha incorretos")).not.toBeInTheDocument();
  });

  it("campos vazios mostram erro de campo ligado por aria-describedby e não enviam", async () => {
    const chamadas = simular(() => ERRO_CREDENCIAL);
    renderizar(rotas, "/entrar");
    await userEvent.click(entrarBotao());
    for (const rotulo of ["E-mail", "Senha"]) {
      const campo = screen.getByLabelText(rotulo);
      expect(campo).toHaveAttribute("aria-invalid", "true");
      const ids = campo.getAttribute("aria-describedby")!.split(" ");
      const textos = ids.map((id) => document.getElementById(id)?.textContent ?? "").join(" ");
      expect(textos.trim()).not.toBe("");
    }
    expect(chamadas.filter((c) => c.metodo === "POST")).toHaveLength(0);
  });

  it("400 entrada_invalida liga a mensagem ao campo", async () => {
    simular(() =>
      json(400, { erro: "entrada_invalida", mensagem: "x", campos: [{ campo: "email", mensagem: "E-mail inválido." }] }),
    );
    renderizar(rotas, "/entrar");
    await preencher("sem-arroba", "senha-de-exemplo-1");
    await userEvent.click(entrarBotao());
    const campo = await screen.findByLabelText("E-mail");
    await waitFor(() => expect(campo).toHaveAttribute("aria-invalid", "true"));
    const id = campo.getAttribute("aria-describedby")!.split(" ").find((i) => document.getElementById(i)?.textContent === "E-mail inválido.");
    expect(id).toBeDefined();
  });

  it("sucesso com uma empresa leva a /e/:id (CA-15, CA-31)", async () => {
    simular(() => json(200, { usuario: USUARIO, empresas: [EMPRESA_A] }));
    const router = renderizar(rotas, "/entrar");
    await preencher();
    await userEvent.click(entrarBotao());
    expect(await screen.findByText("Destino da empresa")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/e/${EMPRESA_A.id}`);
  });

  it("sucesso com duas empresas leva a /empresas (CA-31)", async () => {
    simular(() => json(200, { usuario: USUARIO, empresas: [EMPRESA_A, EMPRESA_B] }));
    const router = renderizar(rotas, "/entrar");
    await preencher();
    await userEvent.click(entrarBotao());
    expect(await screen.findByText("Lista de empresas")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/empresas");
  });
});

describe("CampoSenha", () => {
  function Exemplo() {
    const [valor, setValor] = useState("");
    return <CampoSenha id="s" rotulo="Senha" valor={valor} aoMudar={setValor} autoComplete="current-password" />;
  }

  it("Mostrar senha alterna o tipo do campo", async () => {
    render(<Exemplo />);
    const campo = screen.getByLabelText("Senha");
    expect(campo).toHaveAttribute("type", "password");
    await userEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(campo).toHaveAttribute("type", "text");
    await userEvent.click(screen.getByRole("button", { name: "Ocultar senha" }));
    expect(campo).toHaveAttribute("type", "password");
  });

  it("liga a mensagem de erro e a ajuda por aria-describedby", () => {
    render(
      <CampoSenha id="s" rotulo="Senha" valor="" aoMudar={() => {}} erro="Informe a senha." ajuda="Use 12 caracteres ou mais." />,
    );
    const campo = screen.getByLabelText("Senha");
    expect(campo).toHaveAttribute("aria-invalid", "true");
    const textos = campo.getAttribute("aria-describedby")!.split(" ").map((id) => document.getElementById(id)?.textContent);
    expect(textos.join(" ")).toContain("Informe a senha.");
    expect(textos.join(" ")).toContain("Use 12 caracteres ou mais.");
  });
});
