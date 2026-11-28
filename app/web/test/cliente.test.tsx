import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { definirAoPerderSessao, requisitar } from "../src/api/cliente";
import { RequerSessao, useSessao } from "../src/sessao/ProvedorSessao";
import { EMPRESA_A, SEM_SESSAO, USUARIO, json, renderizar, simularFetch } from "./auxiliar";

afterEach(() => definirAoPerderSessao(null));

describe("cliente da API", () => {
  it("manda o cabeçalho de requisição e credentials same-origin em todo método que muda estado", async () => {
    const chamadas = simularFetch(() => json(204));
    for (const metodo of ["POST", "PUT", "PATCH", "DELETE"]) {
      await requisitar(metodo, "/api/x", { corpo: { a: 1 } });
    }
    expect(chamadas).toHaveLength(4);
    for (const c of chamadas) {
      expect(c.cabecalhos.get("X-CreditoGov-Requisicao")).toBe("1");
      expect(c.init.credentials).toBe("same-origin");
    }
  });

  it("não manda o cabeçalho no GET, mas mantém credentials same-origin", async () => {
    const chamadas = simularFetch(() => json(200, {}));
    await requisitar("GET", "/api/sessao");
    expect(chamadas[0].cabecalhos.get("X-CreditoGov-Requisicao")).toBeNull();
    expect(chamadas[0].init.credentials).toBe("same-origin");
  });

  it("manda o corpo como JSON", async () => {
    const chamadas = simularFetch(() => json(200, {}));
    await requisitar("POST", "/api/sessao", { corpo: { email: "a@exemplo.com.br" } });
    expect(chamadas[0].cabecalhos.get("Content-Type")).toBe("application/json");
    expect(chamadas[0].corpo).toEqual({ email: "a@exemplo.com.br" });
  });

  it("devolve ok com o corpo", async () => {
    simularFetch(() => json(200, { valor: 1 }));
    expect(await requisitar("GET", "/api/x")).toEqual({ tipo: "ok", status: 200, dados: { valor: 1 } });
  });

  it("devolve erro tipado com o código da API", async () => {
    simularFetch(() => json(401, { erro: "credencial_invalida", mensagem: "E-mail ou senha incorretos" }));
    const r = await requisitar("POST", "/api/sessao", { corpo: {} });
    expect(r).toMatchObject({ tipo: "erro", status: 401, codigo: "credencial_invalida" });
  });

  it("fetch rejeitado vira sem_conexao", async () => {
    simularFetch(() => "rejeitar");
    expect(await requisitar("GET", "/api/x")).toEqual({ tipo: "sem_conexao" });
  });

  it.each([502, 503, 504])("resposta %i sem corpo vira sem_conexao", async (status) => {
    simularFetch(() => json(status));
    expect(await requisitar("GET", "/api/x")).toEqual({ tipo: "sem_conexao" });
  });

  it("502 com corpo de erro da API segue como erro tipado", async () => {
    simularFetch(() => json(502, { erro: "email_nao_enviado", mensagem: "x" }));
    expect(await requisitar("POST", "/api/x", { corpo: {} })).toMatchObject({
      tipo: "erro",
      status: 502,
      codigo: "email_nao_enviado",
    });
  });

  it("resposta ok com JSON ilegível vira erro resposta_invalida", async () => {
    globalThis.fetch = vi.fn(async () => new Response("<html>não é json</html>", { status: 200 })) as unknown as typeof fetch;
    const r = await requisitar("GET", "/api/x");
    expect(r).toMatchObject({ tipo: "erro", status: 200, codigo: "resposta_invalida" });
  });

  it("204 sem corpo continua ok", async () => {
    simularFetch(() => json(204));
    expect(await requisitar("DELETE", "/api/x")).toMatchObject({ tipo: "ok", status: 204 });
  });

  it("401 sessao_expirada em rota logada avisa a perda da sessão como expirada", async () => {
    simularFetch(() => json(401, { erro: "sessao_expirada", mensagem: "x" }));
    const aviso = vi.fn();
    definirAoPerderSessao(aviso);
    await requisitar("GET", "/api/empresas", { logada: true });
    expect(aviso).toHaveBeenCalledWith("expirada");
  });

  it("401 sem_sessao em rota logada avisa a perda da sessão sem motivo", async () => {
    simularFetch(() => SEM_SESSAO);
    const aviso = vi.fn();
    definirAoPerderSessao(aviso);
    await requisitar("GET", "/api/empresas", { logada: true });
    expect(aviso).toHaveBeenCalledWith("sem_sessao");
  });

  it("401 fora de rota logada não avisa", async () => {
    simularFetch(() => SEM_SESSAO);
    const aviso = vi.fn();
    definirAoPerderSessao(aviso);
    await requisitar("POST", "/api/sessao", { corpo: {} });
    expect(aviso).not.toHaveBeenCalled();
  });
});

function Sonda() {
  const { estado, entrar, sair } = useSessao();
  return (
    <div>
      <p>estado: {estado.status}</p>
      {estado.status === "logada" && <p>usuário: {estado.usuario.nome}</p>}
      <button onClick={() => void entrar("maria@exemplo.com.br", "senha-de-exemplo-1")}>entrar</button>
      <button onClick={() => void sair()}>sair</button>
    </div>
  );
}

const rotasSonda = [{ path: "/", element: <Sonda /> }];

describe("ProvedorSessao", () => {
  it("carrega GET /api/sessao e expõe usuário e empresas", async () => {
    const chamadas = simularFetch(() => json(200, { usuario: USUARIO, empresas: [EMPRESA_A] }));
    renderizar(rotasSonda, "/");
    expect(await screen.findByText("estado: logada")).toBeInTheDocument();
    expect(screen.getByText("usuário: Maria Exemplo")).toBeInTheDocument();
    expect(chamadas[0].metodo).toBe("GET");
    expect(chamadas[0].url).toBe("/api/sessao");
  });

  it("sem sessão, o estado fica anônimo", async () => {
    simularFetch(() => SEM_SESSAO);
    renderizar(rotasSonda, "/");
    expect(await screen.findByText("estado: anonima")).toBeInTheDocument();
  });

  it("entrar chama POST /api/sessao e passa a logada", async () => {
    const chamadas = simularFetch((c) =>
      c.metodo === "POST" ? json(200, { usuario: USUARIO, empresas: [EMPRESA_A] }) : SEM_SESSAO,
    );
    renderizar(rotasSonda, "/");
    await screen.findByText("estado: anonima");
    await userEvent.click(screen.getByText("entrar"));
    expect(await screen.findByText("estado: logada")).toBeInTheDocument();
    const post = chamadas.find((c) => c.metodo === "POST")!;
    expect(post.url).toBe("/api/sessao");
    expect(post.corpo).toEqual({ email: "maria@exemplo.com.br", senha: "senha-de-exemplo-1" });
  });

  it("sair chama DELETE /api/sessao e volta a anônima", async () => {
    const chamadas = simularFetch((c) =>
      c.metodo === "DELETE" ? json(204) : json(200, { usuario: USUARIO, empresas: [] }),
    );
    renderizar(rotasSonda, "/");
    await screen.findByText("estado: logada");
    await userEvent.click(screen.getByText("sair"));
    expect(await screen.findByText("estado: anonima")).toBeInTheDocument();
    const del = chamadas.find((c) => c.metodo === "DELETE")!;
    expect(del.url).toBe("/api/sessao");
    expect(del.cabecalhos.get("X-CreditoGov-Requisicao")).toBe("1");
  });

  it("401 sessao_expirada numa rota logada leva a /entrar?motivo=expirada", async () => {
    simularFetch((c) =>
      c.url === "/api/sessao"
        ? json(200, { usuario: USUARIO, empresas: [EMPRESA_A] })
        : json(401, { erro: "sessao_expirada", mensagem: "x" }),
    );
    function Dados() {
      return <button onClick={() => void requisitar("GET", "/api/empresas", { logada: true })}>buscar</button>;
    }
    const router = renderizar(
      [
        { element: <RequerSessao />, children: [{ path: "/dados", element: <Dados /> }] },
        { path: "/entrar", element: <p>tela de entrar</p> },
      ],
      "/dados",
    );
    await userEvent.click(await screen.findByText("buscar"));
    await waitFor(() => expect(router.state.location.pathname).toBe("/entrar"));
    expect(router.state.location.search).toBe("?motivo=expirada");
  });

  it("sem sessão, uma rota logada leva a /entrar sem motivo", async () => {
    simularFetch(() => SEM_SESSAO);
    const router = renderizar(
      [
        { element: <RequerSessao />, children: [{ path: "/dados", element: <p>dados</p> }] },
        { path: "/entrar", element: <p>tela de entrar</p> },
      ],
      "/dados",
    );
    await waitFor(() => expect(router.state.location.pathname).toBe("/entrar"));
    expect(router.state.location.search).toBe("");
  });
});
