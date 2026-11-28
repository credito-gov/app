// Busca de dados do dashboard (AD-3, DT-5; CA-12): cache por empresa e recorte, sem estado global.
import { QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import {
  criarClienteDeCache,
  ResultadoDaBusca,
  useNotasDoGrupo,
  usePainel,
  usePendencias,
} from "../src/paineis/busca";
import { ProvedorSessao, useSessao } from "../src/sessao/ProvedorSessao";
import { EMPRESA_A, EMPRESA_B, USUARIO, json, simularFetch, type Chamada, type RespostaSimulada } from "./auxiliar";

const painelDe = (c: Chamada) => c.url.includes("/painel");

function servir(extra: (c: Chamada) => RespostaSimulada | undefined = () => undefined) {
  return simularFetch((c) => {
    const e = extra(c);
    if (e) return e;
    if (c.url === "/api/sessao") {
      if (c.metodo === "DELETE") return json(204);
      return json(200, { usuario: USUARIO, empresas: [EMPRESA_A, EMPRESA_B] });
    }
    return json(200, { rotulo: c.url });
  });
}

function Painel({ empresa, periodo = null }: { empresa: string; periodo?: string | null }) {
  const q = usePainel(empresa, periodo);
  return <ResultadoDaBusca consulta={q}>{(d: { rotulo: string }) => <p>dados {d.rotulo}</p>}</ResultadoDaBusca>;
}

function montar(filho: React.ReactNode, cliente = criarClienteDeCache()) {
  render(
    <QueryClientProvider client={cliente}>
      <ProvedorSessao>{filho}</ProvedorSessao>
    </QueryClientProvider>,
  );
  return cliente;
}

const chamadasDoPainel = (chamadas: Chamada[]) => chamadas.filter(painelDe).length;

describe("chaves de cache (AD-3)", () => {
  it("painel, pendências e notas têm as chaves da Spec, com empresa e recorte", async () => {
    servir();
    function Tudo() {
      usePainel(EMPRESA_A.id, null);
      usePendencias(EMPRESA_A.id, "2026-11");
      useNotasDoGrupo(EMPRESA_A.id, "nao-identificado", "2026-11", 2);
      return null;
    }
    const cliente = montar(<Tudo />);
    await waitFor(() => expect(cliente.getQueryCache().getAll()).toHaveLength(3));
    const chaves = cliente.getQueryCache().getAll().map((q) => q.queryKey);
    expect(chaves).toContainEqual(["painel", EMPRESA_A.id, null]);
    expect(chaves).toContainEqual(["pendencias", EMPRESA_A.id, "2026-11"]);
    expect(chaves).toContainEqual(["notas", EMPRESA_A.id, "nao-identificado", "2026-11", 2]);
  });

  it("as buscas vão às rotas da API, com o recorte e a página na URL", async () => {
    const chamadas = servir();
    function Tudo() {
      usePainel(EMPRESA_A.id, null);
      usePendencias(EMPRESA_A.id, "2026-11");
      useNotasDoGrupo(EMPRESA_A.id, "nao-identificado", "2026-11", 2);
      return null;
    }
    montar(<Tudo />);
    await waitFor(() => expect(chamadas.filter((c) => c.url.startsWith("/api/empresas/")).length).toBe(3));
    const urls = chamadas.map((c) => c.url);
    expect(urls).toContain(`/api/empresas/${EMPRESA_A.id}/painel`);
    expect(urls).toContain(`/api/empresas/${EMPRESA_A.id}/pendencias?periodo=2026-11`);
    expect(urls).toContain(`/api/empresas/${EMPRESA_A.id}/pendencias/nao-identificado/notas?periodo=2026-11&pagina=2`);
    expect(chamadas.filter((c) => c.url.startsWith("/api/empresas/")).every((c) => c.metodo === "GET")).toBe(true);
  });
});

describe("recorte e empresa (CA-12, AD-3)", () => {
  it("trocar o período faz nova busca; voltar ao anterior usa o cache", async () => {
    const chamadas = servir();
    function Troca() {
      const [p, setP] = useState<string | null>(null);
      return (
        <>
          <button onClick={() => setP("2026-11")}>nov</button>
          <button onClick={() => setP(null)}>todos</button>
          <Painel empresa={EMPRESA_A.id} periodo={p} />
        </>
      );
    }
    montar(<Troca />);
    await screen.findByText(`dados /api/empresas/${EMPRESA_A.id}/painel`);
    expect(chamadasDoPainel(chamadas)).toBe(1);
    await userEvent.click(screen.getByText("nov"));
    await screen.findByText(`dados /api/empresas/${EMPRESA_A.id}/painel?periodo=2026-11`);
    expect(chamadasDoPainel(chamadas)).toBe(2);
    await userEvent.click(screen.getByText("todos"));
    await screen.findByText(`dados /api/empresas/${EMPRESA_A.id}/painel`);
    expect(chamadasDoPainel(chamadas)).toBe(2);
  });

  it("duas empresas não compartilham cache", async () => {
    const chamadas = servir();
    const cliente = montar(
      <>
        <Painel empresa={EMPRESA_A.id} />
        <Painel empresa={EMPRESA_B.id} />
      </>,
    );
    await screen.findByText(`dados /api/empresas/${EMPRESA_A.id}/painel`);
    await screen.findByText(`dados /api/empresas/${EMPRESA_B.id}/painel`);
    expect(chamadasDoPainel(chamadas)).toBe(2);
    const chaves = cliente.getQueryCache().getAll().map((q) => JSON.stringify(q.queryKey));
    expect(new Set(chaves).size).toBe(2);
  });
});

describe("quando busca de novo", () => {
  it("o dado vale por 5 minutos e voltar à aba não busca de novo", async () => {
    const chamadas = servir();
    const cliente = montar(<Painel empresa={EMPRESA_A.id} />);
    await screen.findByText(`dados /api/empresas/${EMPRESA_A.id}/painel`);
    const padrao = cliente.getDefaultOptions().queries;
    expect(padrao?.staleTime).toBe(5 * 60_000);
    expect(padrao?.refetchOnWindowFocus).toBe(false);
    act(() => {
      window.dispatchEvent(new Event("focus"));
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await new Promise((r) => setTimeout(r, 30));
    expect(chamadasDoPainel(chamadas)).toBe(1);
  });

  it("outro componente com o mesmo recorte, dentro de 5 minutos, não busca de novo", async () => {
    const chamadas = servir();
    function Dois() {
      const [mostrar, setMostrar] = useState(false);
      return (
        <>
          <button onClick={() => setMostrar(true)}>outro</button>
          <Painel empresa={EMPRESA_A.id} />
          {mostrar ? <Painel empresa={EMPRESA_A.id} /> : null}
        </>
      );
    }
    montar(<Dois />);
    await screen.findByText(`dados /api/empresas/${EMPRESA_A.id}/painel`);
    await userEvent.click(screen.getByText("outro"));
    await waitFor(() => expect(screen.getAllByText(`dados /api/empresas/${EMPRESA_A.id}/painel`)).toHaveLength(2));
    expect(chamadasDoPainel(chamadas)).toBe(1);
  });
});

describe("o cache não sobrevive à sessão (AD-3)", () => {
  function Sair() {
    const { sair } = useSessao();
    return <button onClick={() => void sair()}>sair</button>;
  }

  it("sair da sessão limpa o cache", async () => {
    servir();
    const cliente = montar(
      <>
        <Sair />
        <Painel empresa={EMPRESA_A.id} />
      </>,
    );
    await screen.findByText(`dados /api/empresas/${EMPRESA_A.id}/painel`);
    expect(cliente.getQueryCache().getAll().length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText("sair"));
    await waitFor(() => expect(cliente.getQueryCache().getAll()).toHaveLength(0));
  });

  it("um 401 em qualquer busca limpa o cache", async () => {
    servir((c) => (c.url.includes(EMPRESA_B.id) ? json(401, { erro: "sessao_expirada", mensagem: "Sua sessão expirou." }) : undefined));
    const cliente = montar(
      <>
        <Painel empresa={EMPRESA_A.id} />
      </>,
    );
    await screen.findByText(`dados /api/empresas/${EMPRESA_A.id}/painel`);
    expect(cliente.getQueryCache().getAll().length).toBe(1);
    function Outra() {
      usePainel(EMPRESA_B.id, null);
      return null;
    }
    render(
      <QueryClientProvider client={cliente}>
        <Outra />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(cliente.getQueryCache().find({ queryKey: ["painel", EMPRESA_A.id, null] })).toBeUndefined());
  });
});

describe("falhas de busca", () => {
  it("sem_conexao mostra o alerta Sem conexão, e Tentar de novo refaz a busca", async () => {
    let ligado = false;
    const chamadas = servir((c) => (painelDe(c) && !ligado ? "rejeitar" : undefined));
    montar(<Painel empresa={EMPRESA_A.id} />);
    expect(await screen.findByText("Sem conexão")).toBeInTheDocument();
    expect(chamadasDoPainel(chamadas)).toBe(1);
    ligado = true;
    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    await screen.findByText(`dados /api/empresas/${EMPRESA_A.id}/painel`);
    expect(chamadasDoPainel(chamadas)).toBe(2);
    expect(screen.queryByText("Sem conexão")).not.toBeInTheDocument();
  });

  it("não tenta de novo sozinho: a pessoa decide", async () => {
    const chamadas = servir((c) => (painelDe(c) ? "rejeitar" : undefined));
    montar(<Painel empresa={EMPRESA_A.id} />);
    await screen.findByText("Sem conexão");
    await new Promise((r) => setTimeout(r, 50));
    expect(chamadasDoPainel(chamadas)).toBe(1);
  });

  it("erro da API mostra mensagem de usuário, sem código", async () => {
    servir((c) => (painelDe(c) ? json(500, { erro: "erro_interno", mensagem: "Algo deu errado. Tente de novo." }) : undefined));
    montar(<Painel empresa={EMPRESA_A.id} />);
    expect(await screen.findByText("Não foi possível carregar os dados")).toBeInTheDocument();
    expect(screen.queryByText(/erro_interno/)).not.toBeInTheDocument();
  });
});
