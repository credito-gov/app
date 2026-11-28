// Falhas e lacunas da web (correção 1 da revisão da 034). Sem rede: o fetch é simulado.
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LayoutEmpresa, useEmpresaEmFoco } from "../src/componentes/LayoutEmpresa";
import { rotasApp } from "../src/rotas";
import { RequerSessao } from "../src/sessao/ProvedorSessao";
import { AceitarConvite } from "../src/paginas/AceitarConvite";
import { EsqueciSenha } from "../src/paginas/EsqueciSenha";
import { RedefinirSenha } from "../src/paginas/RedefinirSenha";
import { EMPRESA_A, EMPRESA_B, SEM_SESSAO, USUARIO, json, renderizar, renderizarNavegador, simularFetch, type Chamada, type RespostaSimulada } from "./auxiliar";

const TOKEN = "token-de-exemplo-abcdefghijklmnopqrstuvwxyz0123456789";
const SENHA = "uma-senha-longa-de-exemplo";
const OUTRO = "44444444-4444-4444-8444-444444444444";
const INDISPONIVEL = /O serviço está indisponível no momento\. Tente em alguns minutos\./;

type Pessoas = {
  vinculos: { usuarioId: string; nome: string; email: string; papel: string; desde: string }[];
  convitesPendentes: { id: string; email: string; papel: string; expiraEm: string }[];
  podeConvidar: string[];
  podeRemover: boolean;
};

const MARIA = { usuarioId: USUARIO.id, nome: "Maria Exemplo", email: "maria@exemplo.com.br", papel: "titular", desde: "2026-11-01T12:00:00.000Z" };
const CARLOS = { usuarioId: OUTRO, nome: "Carlos Contador", email: "carlos@exemplo.com.br", papel: "contador", desde: "2026-11-02T12:00:00.000Z" };
const DOIS_TITULARES: Pessoas = {
  vinculos: [MARIA, { ...CARLOS, papel: "titular" }],
  convitesPendentes: [],
  podeConvidar: ["titular", "contador", "colaborador"],
  podeRemover: true,
};
const PESSOAS: Pessoas = { ...DOIS_TITULARES, vinculos: [MARIA, CARLOS] };

function servir(opcoes: { empresas?: (typeof EMPRESA_A)[]; pessoas?: () => Pessoas; extra?: (c: Chamada) => RespostaSimulada | undefined } = {}) {
  const { empresas = [EMPRESA_A], pessoas = () => PESSOAS, extra } = opcoes;
  return simularFetch((c) => {
    const e = extra?.(c);
    if (e) return e;
    if (c.url === "/api/sessao") return c.metodo === "DELETE" ? json(204) : json(200, { usuario: USUARIO, empresas });
    if (c.url === "/api/empresas") return json(200, empresas);
    const empresa = empresas.find((x) => c.url === `/api/empresas/${x.id}`);
    if (empresa) return json(200, empresa);
    if (empresas.some((x) => c.url === `/api/empresas/${x.id}/pessoas`)) return json(200, pessoas());
    return json(404, { erro: "empresa_nao_encontrada", mensagem: "Empresa não encontrada ou sem acesso." });
  });
}

const ERRO_500 = json(500, { erro: "erro_interno", mensagem: "Algo deu errado. Tente de novo." });

function fragmento(caminho: string, hash: string) {
  window.history.replaceState(null, "", `${caminho}${hash}`);
}
afterEach(() => window.history.replaceState(null, "", "/"));

describe("sessão inicial (CA-19, CA-20)", () => {
  it("sessao_expirada no GET inicial leva a /entrar?motivo=expirada com o aviso", async () => {
    simularFetch(() => json(401, { erro: "sessao_expirada", mensagem: "Sua sessão expirou. Entre de novo." }));
    const router = renderizar(rotasApp, "/empresas");
    await waitFor(() => expect(router.state.location.pathname).toBe("/entrar"));
    expect(router.state.location.search).toBe("?motivo=expirada");
    expect(await screen.findByText("Sua sessão expirou. Entre de novo.")).toBeInTheDocument();
  });

  it("só 401 vira anônima: erro 500 mostra Tentar de novo e não manda para /entrar", async () => {
    let chamadas = 0;
    simularFetch((c) => {
      if (c.url === "/api/sessao") return ++chamadas === 1 ? ERRO_500 : json(200, { usuario: USUARIO, empresas: [] });
      return json(200, []);
    });
    const router = renderizar(rotasApp, "/empresas");
    await userEvent.click(await screen.findByRole("button", { name: "Tentar de novo" }));
    expect(router.state.location.pathname).toBe("/empresas");
    expect(await screen.findByText(/Você ainda não tem acesso a nenhuma empresa/)).toBeInTheDocument();
  });

  it("sem conexão no GET inicial também mostra Tentar de novo", async () => {
    simularFetch(() => "rejeitar");
    const router = renderizar(rotasApp, "/empresas");
    expect(await screen.findByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/empresas");
  });

  it("503 no GET inicial mostra que o serviço está indisponível", async () => {
    simularFetch(() => json(503));
    renderizar(rotasApp, "/empresas");
    expect(await screen.findByText(INDISPONIVEL)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
  });
});

describe("sair (CA-21)", () => {
  it("se o servidor não encerra a sessão, avisa e não finge o logout", async () => {
    servir({ extra: (c) => (c.metodo === "DELETE" && c.url === "/api/sessao" ? ERRO_500 : undefined) });
    const router = renderizar(rotasApp, `/e/${EMPRESA_A.id}`);
    await userEvent.click(await screen.findByRole("button", { name: "Sair" }));
    expect(await screen.findByText("Não conseguimos encerrar a sessão no servidor. Tente de novo.")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/e/${EMPRESA_A.id}`);
  });

  it("sem conexão ao sair, na escolha de empresa, também avisa e fica", async () => {
    servir({
      empresas: [EMPRESA_A, EMPRESA_B],
      extra: (c) => (c.metodo === "DELETE" && c.url === "/api/sessao" ? "rejeitar" : undefined),
    });
    const router = renderizar(rotasApp, "/empresas");
    await userEvent.click(await screen.findByRole("button", { name: "Sair" }));
    expect(await screen.findByText("Não conseguimos encerrar a sessão no servidor. Tente de novo.")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/empresas");
  });
});

describe("escolha de empresa (CA-30)", () => {
  it("recarrega GET /api/empresas ao abrir, em vez de usar só a lista do login", async () => {
    simularFetch((c) => {
      if (c.url === "/api/sessao") return json(200, { usuario: USUARIO, empresas: [EMPRESA_A, EMPRESA_B] });
      if (c.url === "/api/empresas") return json(200, [EMPRESA_B]); // o vínculo com A foi removido depois do login
      return json(404, {});
    });
    renderizar(rotasApp, "/empresas");
    expect(await screen.findByRole("link", { name: EMPRESA_B.nome })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("link", { name: EMPRESA_A.nome })).toBeNull());
  });
});

describe("LayoutEmpresa (CA-32, CA-33)", () => {
  it("só 404 vira empresa não encontrada; 500 mostra Tentar de novo", async () => {
    let chamadas = 0;
    servir({ extra: (c) => (c.url === `/api/empresas/${EMPRESA_A.id}` ? (++chamadas === 1 ? ERRO_500 : json(200, EMPRESA_A)) : undefined) });
    renderizar(rotasApp, `/e/${EMPRESA_A.id}`);
    expect(await screen.findByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
    expect(screen.queryByText("Empresa não encontrada ou sem acesso")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByText("CNPJ raiz 00.000.000")).toBeInTheDocument();
  });

  it("503 mostra que o serviço está indisponível", async () => {
    servir({ extra: (c) => (c.url === `/api/empresas/${EMPRESA_A.id}` ? json(503) : undefined) });
    renderizar(rotasApp, `/e/${EMPRESA_A.id}`);
    expect(await screen.findByText(INDISPONIVEL)).toBeInTheDocument();
  });

  it("se GET /api/empresas falha, registra console.error e segue só com a empresa em foco", async () => {
    const erro = vi.spyOn(console, "error").mockImplementation(() => undefined);
    servir({ empresas: [EMPRESA_A, EMPRESA_B], extra: (c) => (c.url === "/api/empresas" ? ERRO_500 : undefined) });
    renderizar(rotasApp, `/e/${EMPRESA_A.id}`);
    expect(await screen.findByText("CNPJ raiz 00.000.000")).toBeInTheDocument();
    expect(erro).toHaveBeenCalled();
    erro.mockRestore();
  });

  it("useEmpresaEmFoco, dentro do LayoutEmpresa, entrega o id e o papel da empresa carregada", async () => {
    function Sonda() {
      const e = useEmpresaEmFoco();
      return <p>foco: {e.id} {e.papel}</p>;
    }
    servir({ empresas: [EMPRESA_B] });
    renderizar(
      [{ element: <RequerSessao />, children: [{ path: "/e/:empresaId", element: <LayoutEmpresa />, children: [{ index: true, element: <Sonda /> }] }] }],
      `/e/${EMPRESA_B.id}`,
    );
    expect(await screen.findByText(`foco: ${EMPRESA_B.id} contador`)).toBeInTheDocument();
  });
});

describe("Pessoas (CA-8, CA-9, CA-34)", () => {
  const url = `/e/${EMPRESA_A.id}/pessoas`;

  it("convite com e-mail que não saiu (502) mostra a mensagem e recarrega a lista", async () => {
    const chamadas = servir({
      extra: (c) =>
        c.metodo === "POST"
          ? json(502, { erro: "email_nao_enviado", mensagem: "O convite foi criado, mas o e-mail não saiu. Tente reenviar." })
          : undefined,
    });
    renderizar(rotasApp, url);
    await userEvent.type(await screen.findByLabelText("E-mail"), "nova@exemplo.com.br");
    await userEvent.click(screen.getByRole("button", { name: "Enviar convite" }));
    expect(await screen.findByText("O convite foi criado, mas o e-mail não saiu. Tente reenviar.")).toBeInTheDocument();
    await waitFor(() => expect(chamadas.filter((c) => c.metodo === "GET" && c.url.endsWith("/pessoas"))).toHaveLength(2));
  });

  it("400 mostra a mensagem do campo que o servidor mandou", async () => {
    servir({
      extra: (c) =>
        c.metodo === "POST"
          ? json(400, { erro: "entrada_invalida", mensagem: "x", campos: [{ campo: "email", mensagem: "E-mail inválido." }] })
          : undefined,
    });
    renderizar(rotasApp, url);
    await userEvent.type(await screen.findByLabelText("E-mail"), "nova@exemplo.com.br");
    await userEvent.click(screen.getByRole("button", { name: "Enviar convite" }));
    const campo = screen.getByLabelText("E-mail");
    await waitFor(() => expect(campo).toHaveAttribute("aria-invalid", "true"));
    const textos = campo.getAttribute("aria-describedby")!.split(" ").map((id) => document.getElementById(id)?.textContent);
    expect(textos.join(" ")).toContain("E-mail inválido.");
  });

  it("a falha ao carregar tem o botão Tentar de novo", async () => {
    let chamadas = 0;
    servir({ extra: (c) => (c.url.endsWith("/pessoas") ? (++chamadas === 1 ? ERRO_500 : json(200, PESSOAS)) : undefined) });
    renderizar(rotasApp, url);
    await userEvent.click(await screen.findByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByText("Carlos Contador")).toBeInTheDocument();
  });

  it("depois de remover, a pessoa some da lista recarregada", async () => {
    let removido = false;
    servir({
      pessoas: () => (removido ? { ...PESSOAS, vinculos: [MARIA] } : PESSOAS),
      extra: (c) => {
        if (c.metodo === "DELETE" && c.url.includes("/vinculos/")) {
          removido = true;
          return json(204);
        }
        return undefined;
      },
    });
    renderizar(rotasApp, url);
    await userEvent.click(await screen.findByRole("button", { name: "Remover Carlos Contador" }));
    await waitFor(() => expect(screen.queryByText("Carlos Contador")).toBeNull());
    expect(screen.getByText("Maria Exemplo", { selector: "td, td *" })).toBeInTheDocument();
  });

  it("se o titular remove o próprio vínculo, vai para /empresas, com a lista atualizada", async () => {
    let saiu = false;
    servir({
      empresas: [EMPRESA_A],
      pessoas: () => DOIS_TITULARES,
      extra: (c) => {
        if (c.metodo === "DELETE" && c.url.endsWith(`/vinculos/${USUARIO.id}`)) {
          saiu = true;
          return json(204);
        }
        if (saiu && c.url === "/api/empresas") return json(200, []);
        return undefined;
      },
    });
    const router = renderizar(rotasApp, url);
    await userEvent.click(await screen.findByRole("button", { name: "Remover Maria Exemplo" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/empresas"));
    expect(await screen.findByText(/Você ainda não tem acesso a nenhuma empresa/)).toBeInTheDocument();
  });
});

describe("EsqueciSenha (CA-23)", () => {
  function simular(tratador: (c: Chamada) => RespostaSimulada) {
    return simularFetch((c) => (c.url === "/api/sessao" && c.metodo === "GET" ? SEM_SESSAO : tratador(c)));
  }
  const rotas = [{ path: "/esqueci-senha", element: <EsqueciSenha /> }];

  it("só 202 vira enviado: 500 mostra o erro e o botão Tentar de novo", async () => {
    let posts = 0;
    simular(() => (++posts === 1 ? ERRO_500 : json(202, { mensagem: "x" })));
    renderizar(rotas, "/esqueci-senha");
    await userEvent.type(screen.getByLabelText("E-mail"), "maria@exemplo.com.br");
    await userEvent.click(screen.getByRole("button", { name: "Enviar link" }));
    expect(await screen.findByText("Não foi possível enviar o link. Tente de novo.")).toBeInTheDocument();
    expect(screen.queryByText(/Se houver uma conta/)).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByText(/Se houver uma conta com esse e-mail/)).toBeInTheDocument();
  });

  it("503 mostra que o serviço está indisponível", async () => {
    simular(() => json(503));
    renderizar(rotas, "/esqueci-senha");
    await userEvent.type(screen.getByLabelText("E-mail"), "maria@exemplo.com.br");
    await userEvent.click(screen.getByRole("button", { name: "Enviar link" }));
    expect(await screen.findByText(INDISPONIVEL)).toBeInTheDocument();
  });
});

describe("AceitarConvite (CA-11 a CA-14)", () => {
  const HASH = `#e=${EMPRESA_A.id}&t=${TOKEN}`;
  const CONSULTA = json(200, {
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

  function simular(consulta: RespostaSimulada | (() => RespostaSimulada), aceitar?: RespostaSimulada) {
    return simularFetch((c) => {
      if (c.url === "/api/convites/consultar") return typeof consulta === "function" ? consulta() : consulta;
      if (c.url === "/api/convites/aceitar") return aceitar ?? json(200, { usuario: USUARIO, empresas: [EMPRESA_A] });
      if (c.url === "/api/sessao" && c.metodo === "GET") return SEM_SESSAO;
      if (c.url === "/api/empresas") return json(200, [EMPRESA_A]);
      if (c.url === `/api/empresas/${EMPRESA_A.id}`) return json(200, EMPRESA_A);
      return json(404, {});
    });
  }

  async function preencherSemConta() {
    await userEvent.type(await screen.findByLabelText("Nome"), "Maria Exemplo");
    await userEvent.type(screen.getByLabelText("Senha"), SENHA);
    await userEvent.type(screen.getByLabelText("Confirmar senha"), SENHA);
    await userEvent.click(screen.getByRole("button", { name: "Aceitar convite" }));
  }

  it("só 410 na consulta vira convite que não vale mais; 500 mostra Tentar de novo", async () => {
    fragmento("/convite", HASH);
    let consultas = 0;
    simular(() => (++consultas === 1 ? ERRO_500 : CONSULTA));
    renderizar([{ path: "/convite", element: <AceitarConvite /> }], "/convite");
    const botao = await screen.findByRole("button", { name: "Tentar de novo" });
    expect(screen.queryByText("Este convite não vale mais")).toBeNull();
    await userEvent.click(botao);
    expect(await screen.findByText(EMPRESA_A.nome)).toBeInTheDocument();
  });

  it("503 na consulta mostra que o serviço está indisponível", async () => {
    fragmento("/convite", HASH);
    simular(json(503));
    renderizar([{ path: "/convite", element: <AceitarConvite /> }], "/convite");
    expect(await screen.findByText(INDISPONIVEL)).toBeInTheDocument();
  });

  it("convite_aceito_sem_sessao leva a /entrar com o aviso de convite aceito", async () => {
    fragmento("/convite", HASH);
    simular(
      CONSULTA,
      json(500, { erro: "convite_aceito_sem_sessao", mensagem: "Convite aceito. Entre com seu e-mail e senha." }),
    );
    const router = renderizar(rotasApp, "/convite");
    await preencherSemConta();
    await waitFor(() => expect(router.state.location.pathname).toBe("/entrar"));
    expect(await screen.findByText("Convite aceito. Entre com seu e-mail e senha.")).toBeInTheDocument();
  });

  it("com as rotas reais, aceitar sem conta leva à área logada da empresa (CA-11)", async () => {
    fragmento("/convite", HASH);
    simular(CONSULTA);
    const router = renderizar(rotasApp, "/convite");
    await preencherSemConta();
    await waitFor(() => expect(router.state.location.pathname).toBe(`/e/${EMPRESA_A.id}`));
    expect(await screen.findByText("CNPJ raiz 00.000.000")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("O painel de créditos ainda não está disponível nesta versão.");
  });

  it("com as rotas reais, aceitar com conta leva à área logada da empresa (CA-12)", async () => {
    fragmento("/convite", HASH);
    simular(CONSULTA_COM_CONTA);
    const router = renderizar(rotasApp, "/convite");
    await userEvent.type(await screen.findByLabelText("Senha atual"), SENHA);
    await userEvent.click(screen.getByRole("button", { name: "Aceitar convite" }));
    await waitFor(() => expect(router.state.location.pathname).toBe(`/e/${EMPRESA_A.id}`));
    expect(await screen.findByText("CNPJ raiz 00.000.000")).toBeInTheDocument();
  });
});

describe("fragmento do endereço (CA-14)", () => {
  it("limpa o fragmento pelo roteador, sem apagar o estado do histórico (redefinir senha)", async () => {
    fragmento("/redefinir-senha", `#t=${TOKEN}`);
    simularFetch((c) => (c.url === "/api/sessao" ? SEM_SESSAO : json(204)));
    renderizarNavegador([{ path: "/redefinir-senha", element: <RedefinirSenha /> }]);
    await waitFor(() => expect(window.location.hash).toBe(""));
    expect(window.history.state).not.toBeNull();
    expect(window.history.state.key).toBeDefined();
  });

  it("limpa o fragmento pelo roteador, sem apagar o estado do histórico (convite)", async () => {
    fragmento("/convite", `#e=${EMPRESA_A.id}&t=${TOKEN}`);
    simularFetch((c) => (c.url === "/api/sessao" ? SEM_SESSAO : json(410, { erro: "convite_invalido", mensagem: "x" })));
    renderizarNavegador([{ path: "/convite", element: <AceitarConvite /> }]);
    await waitFor(() => expect(window.location.hash).toBe(""));
    expect(window.history.state).not.toBeNull();
    expect(window.history.state.key).toBeDefined();
  });
});
