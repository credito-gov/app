// Pendencias e NotasDoGrupo (CA-9, CA-10, P-8): todos os grupos de I-7 e as notas de cada um.
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { formatarReais } from "../src/formatacao/dinheiro";
import type { NotasDoGrupo, Pendencias } from "../src/paineis/tipos";
import { rotasApp } from "../src/rotas";
import { PROIBIDAS, PROIBIDAS_RECOLHIMENTO, simples } from "./apoio/palavras";
import { EMPRESA_A, USUARIO, json, renderizar, simularFetch, type RespostaSimulada } from "./auxiliar";
import { CNPJ_A, CPF_C, notasDeMesmaChave, notasDoGrupo, painelSemConsulta, pendenciasCompletas } from "./fixtures/painel";

function abrir(rota: string, pendencias: Pendencias, notas?: (url: URL) => RespostaSimulada) {
  const chamadas = simularFetch((c) => {
    if (c.url === "/api/sessao") return json(200, { usuario: USUARIO, empresas: [EMPRESA_A] });
    if (c.url === "/api/empresas") return json(200, [EMPRESA_A]);
    if (c.url === `/api/empresas/${EMPRESA_A.id}`) return json(200, EMPRESA_A);
    const u = new URL(c.url, "http://x");
    if (u.pathname === `/api/empresas/${EMPRESA_A.id}/pendencias`) return json(200, pendencias);
    if (u.pathname.startsWith(`/api/empresas/${EMPRESA_A.id}/pendencias/`) && u.pathname.endsWith("/notas")) {
      return notas ? notas(u) : json(404, { erro: "grupo_nao_encontrado", mensagem: "Não há notas neste grupo." });
    }
    return json(404, { erro: "nao_encontrado", mensagem: "Recurso não encontrado." });
  });
  const router = renderizar(rotasApp, rota);
  return { chamadas, router };
}

const cnpjFormatado = `${CNPJ_A.slice(0, 2)}.${CNPJ_A.slice(2, 5)}.${CNPJ_A.slice(5, 8)}/${CNPJ_A.slice(8, 12)}-${CNPJ_A.slice(12)}`;

describe("Pendencias: todos os grupos (CA-9, CA-10)", () => {
  it("lista todos os grupos da resposta, cada um com quantidade, total e link para as notas, preservando o período", async () => {
    abrir(`/e/${EMPRESA_A.id}/pendencias?periodo=2026-11`, pendenciasCompletas);
    const tabela = await screen.findByRole("table", { name: "Pendente por emitente" });
    const linhas = within(tabela).getAllByRole("row").slice(1);
    expect(linhas).toHaveLength(pendenciasCompletas.grupos!.length);
    expect(linhas[0]).toHaveTextContent(cnpjFormatado);
    expect(linhas[0]).toHaveTextContent(formatarReais("1500.00"));
    expect(linhas[0]).toHaveTextContent("3");
    expect(linhas[2]).toHaveTextContent("CPF do emitente");
    expect(linhas[2]).toHaveTextContent(`${CPF_C.slice(0, 3)}.`);
    expect(within(linhas[0]!).getByRole("link")).toHaveAttribute("href", `/e/${EMPRESA_A.id}/pendencias/${CNPJ_A}?periodo=2026-11`);
    expect(within(tabela).getByRole("link", { name: "Emitente não identificado" })).toHaveAttribute(
      "href",
      `/e/${EMPRESA_A.id}/pendencias/nao-identificado?periodo=2026-11`,
    );
    expect(within(tabela).getByRole("link", { name: "Emitida pela própria empresa" })).toBeInTheDocument();
  });

  it("mostra a frase do percentual e o total a apropriar", async () => {
    abrir(`/e/${EMPRESA_A.id}/pendencias`, pendenciasCompletas);
    await screen.findByRole("table", { name: "Pendente por emitente" });
    expect(
      screen.getByText("7,5% do valor a apropriar está em notas de emitente não identificado, como as NFS-e, cuja chave não traz o emitente num leiaute conhecido."),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Pendências" })).toBeInTheDocument();
    expect(document.body).toHaveTextContent(formatarReais("4000.00"));
  });

  it("créditos fora de com_dados mostram o mesmo estado da Visão geral", async () => {
    abrir(`/e/${EMPRESA_A.id}/pendencias`, {
      recorte: painelSemConsulta.recorte,
      situacao: { creditos: painelSemConsulta.situacao.creditos },
      grupos: null,
      totalAApropriar: null,
      percentualNaoIdentificado: null,
    });
    expect(await screen.findByText("Os créditos ainda não foram consultados na Receita.")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("R$");
  });

  it("o menu marca Pendências", async () => {
    abrir(`/e/${EMPRESA_A.id}/pendencias`, pendenciasCompletas);
    const menu = await screen.findByRole("navigation", { name: "Principal" });
    expect(within(menu).getByRole("link", { name: "Pendências" })).toHaveAttribute("aria-current", "page");
  });
});

describe("NotasDoGrupo (P-8)", () => {
  it("notas de mesma chave e período com origens diferentes: uma linha cada, sem key repetida, com a origem quando não é normal", async () => {
    const erros = vi.spyOn(console, "error").mockImplementation(() => {});
    abrir(`/e/${EMPRESA_A.id}/pendencias/nao-identificado`, pendenciasCompletas, () => json(200, notasDeMesmaChave));
    const tabela = await screen.findByRole("table", { name: "Notas do grupo" });
    const linhas = within(tabela).getAllByRole("row").slice(1);
    expect(linhas).toHaveLength(3);
    expect(linhas[0]).not.toHaveTextContent("NORMAL");
    expect(linhas[1]).toHaveTextContent("DEVOLUCAO_POR_PCONT (20)");
    expect(linhas[2]).toHaveTextContent("CANCELAMENTO_CREDITO (30)");
    expect(erros.mock.calls.flat().join(" ")).not.toMatch(/same key|mesma chave|unique "key"/i);
    erros.mockRestore();
  });

  const servirNotas = (u: URL) => json(200, { ...notasDoGrupo, pagina: Number(u.searchParams.get("pagina") ?? "1") } satisfies NotasDoGrupo);

  it("mostra período MM/AAAA, chave, emissão DD/MM/AAAA, tipo de documento com o código e o valor", async () => {
    abrir(`/e/${EMPRESA_A.id}/pendencias/nao-identificado`, pendenciasCompletas, servirNotas);
    const tabela = await screen.findByRole("table", { name: "Notas do grupo" });
    const linhas = within(tabela).getAllByRole("row").slice(1);
    expect(linhas).toHaveLength(2);
    expect(linhas[0]).toHaveTextContent("11/2026");
    expect(linhas[0]).toHaveTextContent("1".repeat(50));
    expect(linhas[0]!.querySelector(".cg-key")).not.toBeNull();
    expect(linhas[0]).toHaveTextContent("05/11/2026");
    expect(linhas[0]).toHaveTextContent("NFS-e (91)");
    expect(linhas[0]).toHaveTextContent(formatarReais("120.00"));
    expect(screen.getByRole("heading", { level: 1, name: "Emitente não identificado" })).toBeInTheDocument();
  });

  it("a paginação muda ?pagina= e preserva o período", async () => {
    const { router, chamadas } = abrir(`/e/${EMPRESA_A.id}/pendencias/nao-identificado?periodo=2026-11`, pendenciasCompletas, servirNotas);
    await screen.findByRole("table", { name: "Notas do grupo" });
    expect(document.body).toHaveTextContent("Página 1 de 2");
    await userEvent.click(screen.getByRole("link", { name: "Próxima" }));
    await waitFor(() => expect(router.state.location.search).toBe("?periodo=2026-11&pagina=2"));
    await waitFor(() => expect(chamadas.some((c) => c.url.includes("pagina=2") && c.url.includes("periodo=2026-11"))).toBe(true));
    expect(await screen.findByText("Página 2 de 2")).toBeInTheDocument();
  });

  it("grupo sem nota e página inválida mostram mensagem de usuário, sem código", async () => {
    abrir(`/e/${EMPRESA_A.id}/pendencias/nao-identificado`, pendenciasCompletas, () => json(404, { erro: "grupo_nao_encontrado", mensagem: "Não há notas neste grupo." }));
    expect(await screen.findByText("Não há notas neste grupo.")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/grupo_nao_encontrado|404/);
    document.body.innerHTML = "";
    abrir(`/e/${EMPRESA_A.id}/pendencias/nao-identificado?pagina=9`, pendenciasCompletas, () => json(400, { erro: "pagina_invalida", mensagem: "A página pedida não existe." }));
    expect(await screen.findByText("A página pedida não existe.")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/pagina_invalida|400/);
  });

  it("o link Voltar leva às pendências com o período", async () => {
    abrir(`/e/${EMPRESA_A.id}/pendencias/nao-identificado?periodo=2026-11`, pendenciasCompletas, servirNotas);
    await screen.findByRole("table", { name: "Notas do grupo" });
    expect(screen.getByRole("link", { name: "Voltar às pendências" })).toHaveAttribute("href", `/e/${EMPRESA_A.id}/pendencias?periodo=2026-11`);
  });
});

describe("palavras proibidas (CA-2) nas duas telas", () => {
  it("nenhuma das palavras aparece", async () => {
    const servirNotas = () => json(200, notasDoGrupo);
    for (const rota of [`/e/${EMPRESA_A.id}/pendencias`, `/e/${EMPRESA_A.id}/pendencias/nao-identificado`]) {
      abrir(rota, pendenciasCompletas, servirNotas);
      await screen.findAllByRole("table");
      const texto = simples(document.body.textContent ?? "");
      for (const p of [...PROIBIDAS, ...PROIBIDAS_RECOLHIMENTO]) expect(texto, `${rota}: ${p}`).not.toContain(p);
      document.body.innerHTML = "";
    }
  });
});
