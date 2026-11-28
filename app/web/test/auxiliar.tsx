import { render } from "@testing-library/react";
import { vi } from "vitest";
import { createBrowserRouter, createMemoryRouter, RouterProvider, type RouteObject } from "react-router";
import { ProvedorSessao } from "../src/sessao/ProvedorSessao";

export type RespostaSimulada = { status: number; corpo?: unknown } | "rejeitar";
export type Chamada = { metodo: string; url: string; corpo: unknown; cabecalhos: Headers; init: RequestInit };
type Tratador = (chamada: Chamada) => RespostaSimulada | Promise<RespostaSimulada>;

export function json(status: number, corpo?: unknown): RespostaSimulada {
  return { status, corpo };
}

// Instala um fetch simulado e devolve a lista de chamadas feitas.
export function simularFetch(tratador: Tratador) {
  const chamadas: Chamada[] = [];
  globalThis.fetch = vi.fn(async (entrada: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(entrada);
    let corpo: unknown = undefined;
    if (typeof init.body === "string") corpo = JSON.parse(init.body);
    const chamada: Chamada = {
      metodo: (init.method ?? "GET").toUpperCase(),
      url,
      corpo,
      cabecalhos: new Headers(init.headers),
      init,
    };
    chamadas.push(chamada);
    const r = await tratador(chamada);
    if (r === "rejeitar") throw new TypeError("Failed to fetch");
    if (r.status === 204 || r.corpo === undefined) return new Response(null, { status: r.status });
    return new Response(JSON.stringify(r.corpo), {
      status: r.status,
      headers: { "Content-Type": "application/json" },
    });
  }) as unknown as typeof fetch;
  return chamadas;
}

export const EMPRESA_A = {
  id: "11111111-1111-4111-8111-111111111111",
  nome: "Comércio Exemplo Ltda.",
  cnpjRaiz: "11111111",
  cnpjRaizFormatado: "11.111.111",
  papel: "titular",
};
export const EMPRESA_B = {
  id: "22222222-2222-4222-8222-222222222222",
  nome: "Indústria Exemplo S.A.",
  cnpjRaiz: "22222222",
  cnpjRaizFormatado: "22.222.222",
  papel: "contador",
};
export const USUARIO = { id: "33333333-3333-4333-8333-333333333333", nome: "Maria Exemplo" };

export const SEM_SESSAO = json(401, { erro: "sem_sessao", mensagem: "Entre para continuar." });

// Roteador do navegador (usa window.location e window.history, como em produção).
export function renderizarNavegador(rotas: RouteObject[]) {
  const router = createBrowserRouter(rotas);
  render(
    <ProvedorSessao>
      <RouterProvider router={router} />
    </ProvedorSessao>,
  );
  return router;
}

export function renderizar(rotas: RouteObject[], rota: string) {
  const router = createMemoryRouter(rotas, { initialEntries: [rota] });
  render(
    <ProvedorSessao>
      <RouterProvider router={router} />
    </ProvedorSessao>,
  );
  return router;
}
