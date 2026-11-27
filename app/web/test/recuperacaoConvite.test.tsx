import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AceitarConvite } from "../src/paginas/AceitarConvite";
import { Entrar } from "../src/paginas/Entrar";
import { EsqueciSenha } from "../src/paginas/EsqueciSenha";
import { RedefinirSenha } from "../src/paginas/RedefinirSenha";
import { EMPRESA_A, SEM_SESSAO, USUARIO, json, renderizar, simularFetch, type Chamada, type RespostaSimulada } from "./auxiliar";

const TOKEN = "token-de-exemplo-abcdefghijklmnopqrstuvwxyz0123456789";
const SENHA = "uma-senha-longa-de-exemplo";

const rotas = [
  { path: "/entrar", element: <Entrar /> },
  { path: "/esqueci-senha", element: <EsqueciSenha /> },
  { path: "/redefinir-senha", element: <RedefinirSenha /> },
  { path: "/convite", element: <AceitarConvite /> },
  { path: "/e/:empresaId", element: <p>Destino da empresa</p> },
  { path: "/empresas", element: <p>Lista de empresas</p> },
];

function fragmento(caminho: string, hash: string) {
  window.history.replaceState(null, "", `${caminho}${hash}`);
}

afterEach(() => window.history.replaceState(null, "", "/"));

function simular(tratador: (c: Chamada) => RespostaSimulada) {
  return simularFetch((c) => (c.url === "/api/sessao" && c.metodo === "GET" ? SEM_SESSAO : tratador(c)));
}

function semTokenNaUrl(chamadas: Chamada[]) {
  expect(chamadas.length).toBeGreaterThan(0);
  for (const c of chamadas) expect(c.url).not.toContain(TOKEN);
}

describe("EsqueciSenha (CA-23, CA-26)", () => {
  it("depois de enviar mostra sempre a mensagem da US", async () => {
    const chamadas = simular(() => json(202, { mensagem: "qualquer" }));
    renderizar(rotas, "/esqueci-senha");
    await userEvent.type(screen.getByLabelText("E-mail"), "naoexiste@exemplo.com.br");
    await userEvent.click(screen.getByRole("button", { name: "Enviar link" }));
    expect(
      await screen.findByText(/Se houver uma conta com esse e-mail, enviaremos um link para criar uma nova senha/),
    ).toBeInTheDocument();
    const post = chamadas.find((c) => c.metodo === "POST")!;
    expect(post.url).toBe("/api/recuperacao");
    expect(post.corpo).toEqual({ email: "naoexiste@exemplo.com.br" });
  });

  it("429 mostra o aviso de muitas tentativas", async () => {
    simular(() => json(429, { erro: "muitas_tentativas", mensagem: "x" }));
    renderizar(rotas, "/esqueci-senha");
    await userEvent.type(screen.getByLabelText("E-mail"), "maria@exemplo.com.br");
    await userEvent.click(screen.getByRole("button", { name: "Enviar link" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Muitas tentativas. Tente de novo em alguns minutos.");
  });

  it("e-mail vazio mostra erro de campo e não envia", async () => {
    const chamadas = simular(() => json(202, {}));
    renderizar(rotas, "/esqueci-senha");
    await userEvent.click(screen.getByRole("button", { name: "Enviar link" }));
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("aria-invalid", "true");
    expect(chamadas.filter((c) => c.metodo === "POST")).toHaveLength(0);
  });
});

describe("RedefinirSenha (CA-14, CA-24, CA-25)", () => {
  it("lê #t=, tira o fragmento do endereço e manda o token só no corpo", async () => {
    fragmento("/redefinir-senha", `#t=${TOKEN}`);
    const espiao = vi.spyOn(window.history, "replaceState");
    const chamadas = simular(() => json(204));
    renderizar(rotas, "/redefinir-senha");
    expect(espiao).toHaveBeenCalled();
    expect(window.location.hash).toBe("");
    await userEvent.type(screen.getByLabelText("Nova senha"), SENHA);
    await userEvent.type(screen.getByLabelText("Confirmar nova senha"), SENHA);
    await userEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));
    await screen.findByText("Senha alterada. Entre com a nova senha.");
    const post = chamadas.find((c) => c.metodo === "POST")!;
    expect(post.url).toBe("/api/recuperacao/confirmar");
    expect(post.corpo).toEqual({ token: TOKEN, senha: SENHA });
    semTokenNaUrl(chamadas);
    espiao.mockRestore();
  });

  it("204 leva a /entrar com o aviso de senha alterada", async () => {
    fragmento("/redefinir-senha", `#t=${TOKEN}`);
    simular(() => json(204));
    const router = renderizar(rotas, "/redefinir-senha");
    await userEvent.type(screen.getByLabelText("Nova senha"), SENHA);
    await userEvent.type(screen.getByLabelText("Confirmar nova senha"), SENHA);
    await userEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));
    expect(await screen.findByText("Senha alterada. Entre com a nova senha.")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/entrar");
  });

  it("410 mostra que o link não vale mais e o link para pedir outro", async () => {
    fragmento("/redefinir-senha", `#t=${TOKEN}`);
    simular(() => json(410, { erro: "link_invalido", mensagem: "x" }));
    renderizar(rotas, "/redefinir-senha");
    await userEvent.type(screen.getByLabelText("Nova senha"), SENHA);
    await userEvent.type(screen.getByLabelText("Confirmar nova senha"), SENHA);
    await userEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));
    expect(await screen.findByText("Este link não vale mais")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /pedir outro/i })).toHaveAttribute("href", "/esqueci-senha");
  });

  it("sem token no endereço mostra que o link não vale mais", () => {
    simular(() => json(204));
    renderizar(rotas, "/redefinir-senha");
    expect(screen.getByText("Este link não vale mais")).toBeInTheDocument();
  });

  it("mostra a regra da senha ao lado do campo", () => {
    fragmento("/redefinir-senha", `#t=${TOKEN}`);
    simular(() => json(204));
    renderizar(rotas, "/redefinir-senha");
    const campo = screen.getByLabelText("Nova senha");
    const ajuda = document.getElementById(campo.getAttribute("aria-describedby")!.split(" ")[0])!;
    expect(ajuda).toHaveTextContent(/12 a 128 caracteres/);
  });

  it("400 senha_invalida mostra o motivo no campo", async () => {
    fragmento("/redefinir-senha", `#t=${TOKEN}`);
    simular(() =>
      json(400, { erro: "senha_invalida", mensagem: "A senha precisa ter pelo menos 12 caracteres.", regra: "tamanho_minimo" }),
    );
    renderizar(rotas, "/redefinir-senha");
    await userEvent.type(screen.getByLabelText("Nova senha"), "curta");
    await userEvent.type(screen.getByLabelText("Confirmar nova senha"), "curta");
    await userEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));
    const campo = await screen.findByLabelText("Nova senha");
    await waitFor(() => expect(campo).toHaveAttribute("aria-invalid", "true"));
    const textos = campo.getAttribute("aria-describedby")!.split(" ").map((id) => document.getElementById(id)?.textContent);
    expect(textos.join(" ")).toContain("A senha precisa ter pelo menos 12 caracteres.");
  });

  it("confirmação diferente é recusada antes do envio", async () => {
    fragmento("/redefinir-senha", `#t=${TOKEN}`);
    const chamadas = simular(() => json(204));
    renderizar(rotas, "/redefinir-senha");
    await userEvent.type(screen.getByLabelText("Nova senha"), SENHA);
    await userEvent.type(screen.getByLabelText("Confirmar nova senha"), `${SENHA}-outra`);
    await userEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));
    expect(screen.getByLabelText("Confirmar nova senha")).toHaveAttribute("aria-invalid", "true");
    expect(chamadas.filter((c) => c.metodo === "POST")).toHaveLength(0);
  });
});

const HASH_CONVITE = `#e=${EMPRESA_A.id}&t=${TOKEN}`;
const CONSULTA_SEM_CONTA = json(200, {
  empresa: { nome: EMPRESA_A.nome, cnpjRaizFormatado: EMPRESA_A.cnpjRaizFormatado },
  papel: "contador",
  emailMascarado: "m***@exemplo.com.br",
  contaExistente: false,
});
const CONSULTA_COM_CONTA = json(200, {
  empresa: { nome: EMPRESA_A.nome, cnpjRaizFormatado: EMPRESA_A.cnpjRaizFormatado },
  papel: "titular",
  emailMascarado: "m***@exemplo.com.br",
  contaExistente: true,
});

function simularConvite(consulta: RespostaSimulada, aceitar: RespostaSimulada = json(200, { usuario: USUARIO, empresas: [EMPRESA_A] })) {
  return simular((c) => (c.url === "/api/convites/consultar" ? consulta : c.url === "/api/convites/aceitar" ? aceitar : json(404, {})));
}

describe("AceitarConvite (CA-11 a CA-14)", () => {
  it("lê #e=&t=, tira o fragmento e consulta com o token só no corpo", async () => {
    fragmento("/convite", HASH_CONVITE);
    const chamadas = simularConvite(CONSULTA_SEM_CONTA);
    renderizar(rotas, "/convite");
    await screen.findByText(EMPRESA_A.nome);
    expect(window.location.hash).toBe("");
    const consulta = chamadas.find((c) => c.url === "/api/convites/consultar")!;
    expect(consulta.corpo).toEqual({ empresaId: EMPRESA_A.id, token: TOKEN });
    semTokenNaUrl(chamadas);
  });

  it("sem conta mostra empresa, papel e os campos de nome, senha e confirmação", async () => {
    fragmento("/convite", HASH_CONVITE);
    simularConvite(CONSULTA_SEM_CONTA);
    renderizar(rotas, "/convite");
    expect(await screen.findByText(EMPRESA_A.nome)).toBeInTheDocument();
    expect(screen.getByText(/CNPJ raiz 00\.000\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Contador/)).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar senha")).toBeInTheDocument();
    expect(screen.queryByLabelText("Senha atual")).toBeNull();
  });

  it("sem conta, o sucesso manda nome e senha e entra na área logada", async () => {
    fragmento("/convite", HASH_CONVITE);
    const chamadas = simularConvite(CONSULTA_SEM_CONTA);
    renderizar(rotas, "/convite");
    await userEvent.type(await screen.findByLabelText("Nome"), "Maria Exemplo");
    await userEvent.type(screen.getByLabelText("Senha"), SENHA);
    await userEvent.type(screen.getByLabelText("Confirmar senha"), SENHA);
    await userEvent.click(screen.getByRole("button", { name: "Aceitar convite" }));
    expect(await screen.findByText("Destino da empresa")).toBeInTheDocument();
    const aceitar = chamadas.find((c) => c.url === "/api/convites/aceitar")!;
    expect(aceitar.corpo).toEqual({ empresaId: EMPRESA_A.id, token: TOKEN, senha: SENHA, nome: "Maria Exemplo" });
    semTokenNaUrl(chamadas);
  });

  it("com conta mostra o e-mail mascarado e só o campo de senha atual", async () => {
    fragmento("/convite", HASH_CONVITE);
    const chamadas = simularConvite(CONSULTA_COM_CONTA);
    renderizar(rotas, "/convite");
    expect(await screen.findByText(/m\*\*\*@exemplo\.com\.br/)).toBeInTheDocument();
    expect(screen.getByLabelText("Senha atual")).toBeInTheDocument();
    expect(screen.queryByLabelText("Nome")).toBeNull();
    expect(screen.queryByLabelText("Confirmar senha")).toBeNull();
    await userEvent.type(screen.getByLabelText("Senha atual"), SENHA);
    await userEvent.click(screen.getByRole("button", { name: "Aceitar convite" }));
    await screen.findByText("Destino da empresa");
    const aceitar = chamadas.find((c) => c.url === "/api/convites/aceitar")!;
    expect(aceitar.corpo).toEqual({ empresaId: EMPRESA_A.id, token: TOKEN, senha: SENHA });
  });

  it("com conta, senha errada (401) mostra o alerta de credencial", async () => {
    fragmento("/convite", HASH_CONVITE);
    simularConvite(CONSULTA_COM_CONTA, json(401, { erro: "credencial_invalida", mensagem: "E-mail ou senha incorretos" }));
    renderizar(rotas, "/convite");
    await userEvent.type(await screen.findByLabelText("Senha atual"), "senha-errada-de-exemplo");
    await userEvent.click(screen.getByRole("button", { name: "Aceitar convite" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Senha incorreta");
  });

  it("410 na consulta mostra que o convite não vale mais e orienta a pedir outro", async () => {
    fragmento("/convite", HASH_CONVITE);
    simularConvite(json(410, { erro: "convite_invalido", mensagem: "x" }));
    renderizar(rotas, "/convite");
    expect(await screen.findByText("Este convite não vale mais")).toBeInTheDocument();
    expect(screen.getByText(/Peça um novo convite a quem convidou/)).toBeInTheDocument();
  });

  it("410 ao aceitar mostra a mesma mensagem", async () => {
    fragmento("/convite", HASH_CONVITE);
    simularConvite(CONSULTA_SEM_CONTA, json(410, { erro: "convite_invalido", mensagem: "x" }));
    renderizar(rotas, "/convite");
    await userEvent.type(await screen.findByLabelText("Nome"), "Maria Exemplo");
    await userEvent.type(screen.getByLabelText("Senha"), SENHA);
    await userEvent.type(screen.getByLabelText("Confirmar senha"), SENHA);
    await userEvent.click(screen.getByRole("button", { name: "Aceitar convite" }));
    expect(await screen.findByText("Este convite não vale mais")).toBeInTheDocument();
  });

  it("endereço sem fragmento mostra que o convite não vale mais", () => {
    simularConvite(CONSULTA_SEM_CONTA);
    renderizar(rotas, "/convite");
    expect(screen.getByText("Este convite não vale mais")).toBeInTheDocument();
  });

  it("mostra a regra da senha, o motivo do 400 no campo e recusa confirmação diferente", async () => {
    fragmento("/convite", HASH_CONVITE);
    const chamadas = simularConvite(
      CONSULTA_SEM_CONTA,
      json(400, { erro: "senha_invalida", mensagem: "A senha é muito comum.", regra: "senha_comum" }),
    );
    renderizar(rotas, "/convite");
    const senha = await screen.findByLabelText("Senha");
    const ajuda = document.getElementById(senha.getAttribute("aria-describedby")!.split(" ")[0])!;
    expect(ajuda).toHaveTextContent(/12 a 128 caracteres/);

    await userEvent.type(screen.getByLabelText("Nome"), "Maria Exemplo");
    await userEvent.type(senha, SENHA);
    await userEvent.type(screen.getByLabelText("Confirmar senha"), "outra-coisa-bem-diferente");
    await userEvent.click(screen.getByRole("button", { name: "Aceitar convite" }));
    expect(screen.getByLabelText("Confirmar senha")).toHaveAttribute("aria-invalid", "true");
    expect(chamadas.filter((c) => c.url === "/api/convites/aceitar")).toHaveLength(0);

    await userEvent.clear(screen.getByLabelText("Confirmar senha"));
    await userEvent.type(screen.getByLabelText("Confirmar senha"), SENHA);
    await userEvent.click(screen.getByRole("button", { name: "Aceitar convite" }));
    await waitFor(() => expect(screen.getByLabelText("Senha")).toHaveAttribute("aria-invalid", "true"));
    const campo = screen.getByLabelText("Senha");
    const textos = campo.getAttribute("aria-describedby")!.split(" ").map((id) => document.getElementById(id)?.textContent);
    expect(textos.join(" ")).toContain("A senha é muito comum.");
  });
});
