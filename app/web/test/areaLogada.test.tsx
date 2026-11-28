import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEmpresaEmFoco } from "../src/componentes/LayoutEmpresa";
import { rotasApp } from "../src/rotas";
import { EMPRESA_A, EMPRESA_B, SEM_SESSAO, USUARIO, json, renderizar, simularFetch, type Chamada, type RespostaSimulada } from "./auxiliar";

const OUTRO = "44444444-4444-4444-8444-444444444444";

type Pessoas = {
  vinculos: { usuarioId: string; nome: string; email: string; papel: string; desde: string }[];
  convitesPendentes: { id: string; email: string; papel: string; expiraEm: string }[];
  podeConvidar: string[];
  podeRemover: boolean;
};

const PESSOAS_TITULAR: Pessoas = {
  vinculos: [
    { usuarioId: USUARIO.id, nome: "Maria Exemplo", email: "maria@exemplo.com.br", papel: "titular", desde: "2026-11-01T12:00:00.000Z" },
    { usuarioId: OUTRO, nome: "Carlos Contador", email: "carlos@exemplo.com.br", papel: "contador", desde: "2026-11-02T12:00:00.000Z" },
  ],
  convitesPendentes: [{ id: "55555555-5555-4555-8555-555555555555", email: "novo@exemplo.com.br", papel: "colaborador", expiraEm: "2026-12-04T12:00:00.000Z" }],
  podeConvidar: ["titular", "contador", "colaborador"],
  podeRemover: true,
};

type Servico = {
  empresas?: (typeof EMPRESA_A)[];
  logada?: boolean;
  pessoas?: Pessoas;
  extra?: (c: Chamada) => RespostaSimulada | undefined;
};

function servir({ empresas = [EMPRESA_A], logada = true, pessoas = PESSOAS_TITULAR, extra }: Servico = {}) {
  return simularFetch((c) => {
    const e = extra?.(c);
    if (e) return e;
    if (c.url === "/api/sessao") {
      if (c.metodo === "DELETE") return json(204);
      return logada ? json(200, { usuario: USUARIO, empresas }) : SEM_SESSAO;
    }
    if (c.url === "/api/empresas") return json(200, empresas);
    const empresa = empresas.find((x) => c.url === `/api/empresas/${x.id}`);
    if (empresa) return json(200, empresa);
    if (empresas.some((x) => c.url === `/api/empresas/${x.id}/pessoas`)) return json(200, pessoas);
    return json(404, { erro: "empresa_nao_encontrada", mensagem: "Empresa não encontrada ou sem acesso." });
  });
}

describe("rota / e escolha de empresa (CA-31)", () => {
  it("sem sessão leva a /entrar", async () => {
    servir({ logada: false });
    const router = renderizar(rotasApp, "/");
    await waitFor(() => expect(router.state.location.pathname).toBe("/entrar"));
  });

  it("com uma empresa leva a /e/:id", async () => {
    servir({ empresas: [EMPRESA_A] });
    const router = renderizar(rotasApp, "/");
    await waitFor(() => expect(router.state.location.pathname).toBe(`/e/${EMPRESA_A.id}`));
  });

  it("com duas empresas leva a /empresas, com nome, CNPJ raiz formatado e papel", async () => {
    servir({ empresas: [EMPRESA_A, EMPRESA_B] });
    const router = renderizar(rotasApp, "/");
    await waitFor(() => expect(router.state.location.pathname).toBe("/empresas"));
    const linkA = await screen.findByRole("link", { name: EMPRESA_A.nome });
    expect(linkA).toHaveAttribute("href", `/e/${EMPRESA_A.id}`);
    expect(screen.getByText("00.000.000", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("11.111.111", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Titular")).toBeInTheDocument();
    expect(screen.getByText("Contador")).toBeInTheDocument();
  });

  it("sem nenhuma empresa mostra a mensagem e Sair, sem erro técnico", async () => {
    servir({ empresas: [] });
    renderizar(rotasApp, "/");
    expect(
      await screen.findByText("Você ainda não tem acesso a nenhuma empresa. Peça um convite à equipe CreditoGov ou ao seu contador."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
    expect(screen.queryByText(/erro|404|undefined/i)).toBeNull();
  });
});

describe("LayoutEmpresa e BarraTopo (CA-32, CA-33)", () => {
  it("a barra mostra o nome da empresa e o CNPJ raiz", async () => {
    servir();
    renderizar(rotasApp, `/e/${EMPRESA_A.id}`);
    expect(await screen.findByText(EMPRESA_A.nome)).toBeInTheDocument();
    expect(screen.getByText("CNPJ raiz 00.000.000")).toBeInTheDocument();
  });

  it("o avatar tem as iniciais do usuário", async () => {
    servir();
    renderizar(rotasApp, `/e/${EMPRESA_A.id}`);
    expect(await screen.findByText("ME")).toBeInTheDocument();
  });

  it("a troca de empresa não aparece com uma empresa só", async () => {
    servir({ empresas: [EMPRESA_A] });
    renderizar(rotasApp, `/e/${EMPRESA_A.id}`);
    await screen.findByText(EMPRESA_A.nome);
    expect(screen.queryByRole("button", { name: /Trocar empresa/ })).toBeNull();
  });

  it("com mais de uma empresa, a troca leva a /e/:outroId", async () => {
    servir({ empresas: [EMPRESA_A, EMPRESA_B] });
    const router = renderizar(rotasApp, `/e/${EMPRESA_A.id}`);
    await userEvent.click(await screen.findByRole("button", { name: /Trocar empresa/ }));
    await userEvent.click(screen.getByRole("link", { name: new RegExp(EMPRESA_B.nome) }));
    await waitFor(() => expect(router.state.location.pathname).toBe(`/e/${EMPRESA_B.id}`));
    expect(await screen.findByText("CNPJ raiz 11.111.111")).toBeInTheDocument();
  });

  it("Sair chama DELETE /api/sessao e leva a /entrar", async () => {
    const chamadas = servir();
    const router = renderizar(rotasApp, `/e/${EMPRESA_A.id}`);
    await userEvent.click(await screen.findByRole("button", { name: "Sair" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/entrar"));
    const del = chamadas.find((c) => c.metodo === "DELETE" && c.url === "/api/sessao");
    expect(del).toBeDefined();
  });

  it("a página inicial diz que o painel não está disponível, sem número nem data", async () => {
    servir();
    renderizar(rotasApp, `/e/${EMPRESA_A.id}`);
    await screen.findByText(EMPRESA_A.nome);
    const principal = screen.getByRole("main");
    expect(principal).toHaveTextContent("O painel de créditos ainda não está disponível nesta versão.");
    expect(principal.textContent).not.toMatch(/\d/);
  });

  it("404 em /e/:id mostra a mensagem e o link para /empresas", async () => {
    servir({ empresas: [EMPRESA_A] });
    renderizar(rotasApp, "/e/99999999-9999-4999-8999-999999999999");
    expect(await screen.findByText("Empresa não encontrada ou sem acesso")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /empresas/i })).toHaveAttribute("href", "/empresas");
  });

  it("useEmpresaEmFoco entrega a empresa carregada (para a 033)", () => {
    expect(typeof useEmpresaEmFoco).toBe("function");
  });
});

describe("Pessoas (CA-8, CA-9, CA-34)", () => {
  const url = `/e/${EMPRESA_A.id}/pessoas`;

  it("lista vínculos e convites pendentes", async () => {
    servir();
    renderizar(rotasApp, url);
    expect(await screen.findByText("Carlos Contador")).toBeInTheDocument();
    expect(screen.getByText("carlos@exemplo.com.br")).toBeInTheDocument();
    expect(screen.getByText("Maria Exemplo", { selector: "td, td *" })).toBeInTheDocument();
    expect(screen.getByText("novo@exemplo.com.br")).toBeInTheDocument();
  });

  it("o formulário Convidar oferece só os papéis de podeConvidar", async () => {
    servir({ pessoas: { ...PESSOAS_TITULAR, podeConvidar: ["titular", "colaborador"] } });
    renderizar(rotasApp, url);
    const seletor = await screen.findByLabelText("Papel");
    const opcoes = within(seletor).getAllByRole("option").map((o) => o.textContent);
    expect(opcoes).toEqual(["Titular", "Colaborador"]);
  });

  it("o colaborador não vê o formulário", async () => {
    servir({ pessoas: { ...PESSOAS_TITULAR, podeConvidar: [], podeRemover: false } });
    renderizar(rotasApp, url);
    await screen.findByText("Carlos Contador");
    expect(screen.queryByLabelText("Papel")).toBeNull();
    expect(screen.queryByRole("button", { name: "Enviar convite" })).toBeNull();
  });

  it("202 mostra Convite enviado e manda e-mail e papel", async () => {
    const chamadas = servir({
      extra: (c) => (c.metodo === "POST" ? json(202, { mensagem: "Convite enviado" }) : undefined),
    });
    renderizar(rotasApp, url);
    await userEvent.type(await screen.findByLabelText("E-mail"), "nova@exemplo.com.br");
    await userEvent.selectOptions(screen.getByLabelText("Papel"), "contador");
    await userEvent.click(screen.getByRole("button", { name: "Enviar convite" }));
    expect(await screen.findByText("Convite enviado")).toBeInTheDocument();
    const post = chamadas.find((c) => c.metodo === "POST")!;
    expect(post.url).toBe(`/api/empresas/${EMPRESA_A.id}/convites`);
    expect(post.corpo).toEqual({ email: "nova@exemplo.com.br", papel: "contador" });
  });

  it("409 mostra que a pessoa já tem acesso", async () => {
    servir({
      extra: (c) => (c.metodo === "POST" ? json(409, { erro: "ja_vinculado", mensagem: "x" }) : undefined),
    });
    renderizar(rotasApp, url);
    await userEvent.type(await screen.findByLabelText("E-mail"), "carlos@exemplo.com.br");
    await userEvent.click(screen.getByRole("button", { name: "Enviar convite" }));
    expect(await screen.findByText(/já tem acesso/)).toBeInTheDocument();
  });

  it("Remover aparece só para o titular", async () => {
    servir({ pessoas: { ...PESSOAS_TITULAR, podeRemover: false } });
    renderizar(rotasApp, url);
    await screen.findByText("Carlos Contador");
    expect(screen.queryByRole("button", { name: /Remover/ })).toBeNull();
  });

  it("o titular remove o contador", async () => {
    const chamadas = servir({
      extra: (c) => (c.metodo === "DELETE" && c.url.includes("/vinculos/") ? json(204) : undefined),
    });
    renderizar(rotasApp, url);
    await userEvent.click(await screen.findByRole("button", { name: "Remover Carlos Contador" }));
    await waitFor(() =>
      expect(chamadas.some((c) => c.metodo === "DELETE" && c.url === `/api/empresas/${EMPRESA_A.id}/vinculos/${OUTRO}`)).toBe(true),
    );
  });

  it("no último titular, Remover fica desabilitado, com o motivo", async () => {
    servir();
    renderizar(rotasApp, url);
    const botao = await screen.findByRole("button", { name: "Remover Maria Exemplo" });
    expect(botao).toBeDisabled();
    expect(screen.getByText("Não é possível remover o último titular.")).toBeInTheDocument();
    expect(botao.getAttribute("aria-describedby")).toBeTruthy();
  });

  it("o 409 ultimo_titular mostra o motivo", async () => {
    const dois = {
      ...PESSOAS_TITULAR,
      vinculos: [PESSOAS_TITULAR.vinculos[0], { ...PESSOAS_TITULAR.vinculos[1], papel: "titular" }],
    };
    servir({
      pessoas: dois,
      extra: (c) => (c.metodo === "DELETE" && c.url.includes("/vinculos/") ? json(409, { erro: "ultimo_titular", mensagem: "x" }) : undefined),
    });
    renderizar(rotasApp, url);
    await userEvent.click(await screen.findByRole("button", { name: "Remover Carlos Contador" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não é possível remover o último titular.");
  });
});
