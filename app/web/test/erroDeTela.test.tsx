// Erro inesperado na renderização de uma tela com sessão (revisão B7): o usuário vê um texto simples e
// um caminho de volta, nunca a tela técnica do roteador nem o detalhe do erro.
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { rotasApp } from "../src/rotas";
import { EMPRESA_A, USUARIO, json, renderizar, simularFetch } from "./auxiliar";
import { painelCompleto } from "./fixtures/painel";

afterEach(() => vi.restoreAllMocks());

describe("erro inesperado numa tela da área logada", () => {
  it("mostra o texto ao usuário e o caminho de volta, sem o detalhe técnico", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    // data que a tela não consegue formatar: a renderização lança
    const quebrado = { ...painelCompleto, situacao: { ...painelCompleto.situacao, creditos: { ...painelCompleto.situacao.creditos, ultimaAceitaEm: "lixo" } } };
    simularFetch((c) => {
      if (c.url === "/api/sessao") return json(200, { usuario: USUARIO, empresas: [EMPRESA_A] });
      if (c.url === "/api/empresas") return json(200, [EMPRESA_A]);
      if (c.url === `/api/empresas/${EMPRESA_A.id}`) return json(200, EMPRESA_A);
      if (c.url.startsWith(`/api/empresas/${EMPRESA_A.id}/painel`)) return json(200, quebrado);
      return json(404, { erro: "nao_encontrado", mensagem: "Recurso não encontrado." });
    });
    const router = renderizar(rotasApp, `/e/${EMPRESA_A.id}`);
    expect(await screen.findByText("Não conseguimos mostrar esta página.")).toBeInTheDocument();
    const texto = document.body.textContent ?? "";
    expect(texto).not.toMatch(/Unexpected Application Error|ISO 8601|Error:|stack|undefined/i);
    await userEvent.click(screen.getByRole("link", { name: "Voltar às empresas" }));
    expect(router.state.location.pathname).toBe("/empresas");
  });
});
