// Visão geral do dashboard com dados (CA-1 a CA-13, CA-22, CA-25): textos da Spec, rótulos da US e nomes oficiais.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { formatarReais } from "../src/formatacao/dinheiro";
import type { Painel } from "../src/paineis/tipos";
import { rotasApp } from "../src/rotas";
import { PROIBIDAS, PROIBIDAS_RECOLHIMENTO, simples } from "./apoio/palavras";
import { EMPRESA_A, USUARIO, json, renderizar, simularFetch } from "./auxiliar";
import { CNPJ_A, CPF_C, painelCompleto, painelOutrosValores, painelSemNotasNoPeriodo } from "./fixtures/painel";

function abrir(painel: Painel | ((periodo: string | null) => Painel), rota = `/e/${EMPRESA_A.id}`) {
  const chamadas = simularFetch((c) => {
    if (c.url === "/api/sessao") return json(200, { usuario: USUARIO, empresas: [EMPRESA_A] });
    if (c.url === "/api/empresas") return json(200, [EMPRESA_A]);
    if (c.url === `/api/empresas/${EMPRESA_A.id}`) return json(200, EMPRESA_A);
    if (c.url.startsWith(`/api/empresas/${EMPRESA_A.id}/painel`)) {
      const periodo = new URL(c.url, "http://x").searchParams.get("periodo");
      return json(200, typeof painel === "function" ? painel(periodo) : { ...painel, recorte: { ...painel.recorte, periodo } });
    }
    return json(404, { erro: "nao_encontrado", mensagem: "Recurso não encontrado." });
  });
  const router = renderizar(rotasApp, rota);
  return { chamadas, router };
}

const cartao = (rotulo: string) => screen.getByRole("group", { name: rotulo });

describe("cartões de I-1 a I-5 (CA-1)", () => {
  it("cada cartão tem o rótulo da US, a nota, o nome oficial do campo e o valor formatado", async () => {
    abrir(painelCompleto);
    await screen.findByRole("group", { name: "Crédito apurado nas compras" });
    const t = painelCompleto.creditos!.semNotasNoRecorte ? null : painelCompleto.creditos!.totais;
    const esperado: Array<[string, string, string]> = [
      ["Crédito apurado nas compras", "apurado", t!.apurado],
      ["A apropriar (pendente)", "aApropriar", t!.aApropriar],
      ["Apropriado", "apropriado", t!.apropriado],
      ["Já utilizado", "utilizado", t!.utilizado],
      ["Saldo credor não utilizado", "saldoCredor", t!.saldoCredor],
    ];
    for (const [rotulo, campo, valor] of esperado) {
      const c = cartao(rotulo);
      expect(within(c).getByText(campo)).toBeInTheDocument();
      expect(c).toHaveTextContent(formatarReais(valor));
      expect(c.querySelector(".cg-total-note")?.textContent ?? "").not.toBe("");
    }
    expect(cartao("Crédito apurado nas compras")).toHaveTextContent(
      "Total registrado pela Receita nas notas de compra. Os valores abaixo vêm de campos separados e não se somam.",
    );
  });

  it("nenhum total é derivado: não há cartão de soma, diferença ou proporção", async () => {
    abrir(painelCompleto);
    await screen.findByRole("group", { name: "Apropriado" });
    expect(within(screen.getByRole("region", { name: "Créditos de CBS" })).getAllByRole("group")).toHaveLength(5);
  });
});

describe("palavras proibidas (CA-2, CA-4)", () => {
  it("textos.ts não tem nenhuma das palavras", () => {
    const fonte = simples(readFileSync(join(import.meta.dirname, "..", "src", "paineis", "textos.ts"), "utf8"));
    for (const p of [...PROIBIDAS, ...PROIBIDAS_RECOLHIMENTO]) expect(fonte, p).not.toContain(p);
  });

  it("o HTML de um painel completo e de um com outros valores não tem nenhuma das palavras", async () => {
    for (const p of [painelCompleto, painelOutrosValores]) {
      const { unmount } = (() => {
        abrir(p);
        return { unmount: () => undefined };
      })();
      await screen.findByRole("group", { name: "Apropriado" });
      const texto = simples(document.body.textContent ?? "");
      for (const palavra of [...PROIBIDAS, ...PROIBIDAS_RECOLHIMENTO]) expect(texto, palavra).not.toContain(palavra);
      unmount();
      document.body.innerHTML = "";
    }
  });

  it("nenhum valor em reais na tela está fora da resposta", async () => {
    abrir(painelCompleto);
    await screen.findByRole("group", { name: "Apropriado" });
    const valores = new Set([...JSON.stringify(painelCompleto).matchAll(/"(-?\d+\.\d{2})"/g)].map((m) => formatarReais(m[1]!)));
    const naTela = [...(document.body.textContent ?? "").matchAll(/-?R\$ [\d.]+,\d{2}/g)].map((m) => m[0]);
    expect(naTela.length).toBeGreaterThan(10);
    for (const v of naTela) expect(valores.has(v), v).toBe(true);
  });
});

describe("nota de A apropriar e contagem de notas (CA-4, CA-5)", () => {
  it("a nota de I-2 diz que a Receita não informa o motivo", async () => {
    abrir(painelCompleto);
    await screen.findByRole("group", { name: "A apropriar (pendente)" });
    expect(cartao("A apropriar (pendente)")).toHaveTextContent("Ainda não liberado pela Receita. Ela informa o valor sem dizer o motivo.");
  });

  it("mostra N de M notas com valor a apropriar e a quantidade de notas em I-1", async () => {
    abrir(painelCompleto);
    await screen.findByRole("group", { name: "A apropriar (pendente)" });
    expect(cartao("A apropriar (pendente)")).toHaveTextContent("887 de 896 notas com valor a apropriar");
    expect(cartao("Crédito apurado nas compras")).toHaveTextContent("896 notas");
  });
});

describe("outros valores (CA-3)", () => {
  it("sem outros, o bloco não existe", async () => {
    abrir(painelCompleto);
    await screen.findByRole("group", { name: "Apropriado" });
    expect(screen.queryByText("Outros valores do crédito")).not.toBeInTheDocument();
  });

  it("com outros, uma linha por campo com rótulo, nome oficial e valor", async () => {
    abrir(painelOutrosValores);
    const bloco = await screen.findByRole("region", { name: "Outros valores do crédito" });
    for (const [rotulo, campo, valor] of [
      ["Suspenso", "suspenso", "1000.00"],
      ["Prescrito", "prescrito", "550.00"],
      ["Pedido de ressarcimento", "pedidoRessarcimento", "300.00"],
    ]) {
      const linha = within(bloco).getByText(rotulo!).closest("tr")!;
      expect(linha).toHaveTextContent(campo!);
      expect(linha).toHaveTextContent(formatarReais(valor!));
    }
    expect(bloco).toHaveTextContent("Valor que a Receita informa neste campo. O significado prático está em análise.");
    expect(within(bloco).queryByText("Inapropriável")).not.toBeInTheDocument();
  });
});

describe("pendente por emitente (CA-6 a CA-10)", () => {
  it("CNPJ formatado, CPF com rótulo próprio, na ordem da resposta, sem nome", async () => {
    abrir(painelCompleto);
    const tabela = await screen.findByRole("table", { name: "Pendente por emitente" });
    const linhas = within(tabela).getAllByRole("row").slice(1);
    const cnpj = `${CNPJ_A.slice(0, 2)}.${CNPJ_A.slice(2, 5)}.${CNPJ_A.slice(5, 8)}/${CNPJ_A.slice(8, 12)}-${CNPJ_A.slice(12)}`;
    expect(linhas[0]).toHaveTextContent(cnpj);
    expect(linhas[0]).toHaveTextContent(formatarReais("1500.00"));
    expect(linhas[0]).toHaveTextContent("3");
    expect(linhas[2]).toHaveTextContent("CPF do emitente");
    expect(linhas[2]).toHaveTextContent(`${CPF_C.slice(0, 3)}.${CPF_C.slice(3, 6)}.${CPF_C.slice(6, 9)}-${CPF_C.slice(9)}`);
  });

  it("depois dos emitentes: Demais emitentes (N), própria empresa e emitente não identificado; negativos só quando vier", async () => {
    abrir(painelCompleto);
    const tabela = await screen.findByRole("table", { name: "Pendente por emitente" });
    expect(within(tabela).getByText("Demais emitentes (120)")).toBeInTheDocument();
    expect(within(tabela).getByText("Emitida pela própria empresa")).toBeInTheDocument();
    expect(within(tabela).getByText("Emitente não identificado")).toBeInTheDocument();
    expect(within(tabela).queryByText("Notas com valor a apropriar negativo")).not.toBeInTheDocument();
  });

  it("a linha de negativos aparece quando a resposta traz", async () => {
    abrir(painelOutrosValores);
    const tabela = await screen.findByRole("table", { name: "Pendente por emitente" });
    const linha = within(tabela).getByText("Notas com valor a apropriar negativo").closest("tr")!;
    expect(linha).toHaveTextContent(formatarReais("-155.00"));
  });

  it("a frase do percentual não identificado", async () => {
    abrir(painelCompleto);
    await screen.findByRole("table", { name: "Pendente por emitente" });
    expect(
      screen.getByText("7,5% do valor a apropriar está em notas de emitente não identificado, como as NFS-e, cuja chave não traz o emitente num leiaute conhecido."),
    ).toBeInTheDocument();
  });

  it("cada linha leva às notas do grupo, e Ver todos os emitentes leva a /pendencias, com o período", async () => {
    abrir(painelCompleto, `/e/${EMPRESA_A.id}?periodo=2026-11`);
    const tabela = await screen.findByRole("table", { name: "Pendente por emitente" });
    expect(within(tabela).getByRole("link", { name: /Emitente não identificado/ })).toHaveAttribute(
      "href",
      `/e/${EMPRESA_A.id}/pendencias/nao-identificado?periodo=2026-11`,
    );
    expect(screen.getByRole("link", { name: "Ver todos os emitentes" })).toHaveAttribute("href", `/e/${EMPRESA_A.id}/pendencias?periodo=2026-11`);
  });
});

describe("evolução por período (CA-11)", () => {
  it("uma linha por período em MM/AAAA, colunas com rótulo e nome oficial e a linha Total igual aos cartões", async () => {
    abrir(painelCompleto);
    const tabela = await screen.findByRole("table", { name: "Evolução por período" });
    const linhas = within(tabela).getAllByRole("row");
    expect(linhas).toHaveLength(4);
    expect(linhas[1]).toHaveTextContent("10/2026");
    expect(linhas[2]).toHaveTextContent("11/2026");
    for (const campo of ["apurado", "aApropriar", "apropriado", "utilizado", "saldoCredor"]) expect(within(tabela).getByText(campo)).toBeInTheDocument();
    expect(linhas[3]).toHaveTextContent("Total");
    expect(linhas[3]).toHaveTextContent(formatarReais("10000.00"));
    expect(linhas[3]).toHaveTextContent(formatarReais("4000.00"));
  });
});

describe("recorte (CA-12)", () => {
  it("o seletor lista Todos os períodos coletados e os períodos da resposta; escolher muda a URL", async () => {
    const { router } = abrir(painelCompleto);
    const seletor = await screen.findByLabelText("Período");
    expect(within(seletor).getAllByRole("option").map((o) => o.textContent)).toEqual(["Todos os períodos coletados", "10/2026", "11/2026"]);
    await userEvent.selectOptions(seletor, "2026-10");
    await waitFor(() => expect(router.state.location.search).toBe("?periodo=2026-10"));
    await userEvent.selectOptions(await screen.findByLabelText("Período"), "");
    await waitFor(() => expect(router.state.location.search).toBe(""));
  });

  it("o título mostra o recorte; sem período na URL, Todos os períodos coletados (P-7)", async () => {
    abrir(painelCompleto);
    expect(await screen.findByRole("heading", { level: 2, name: /Todos os períodos coletados/ })).toBeInTheDocument();
    document.body.innerHTML = "";
    abrir(painelCompleto, `/e/${EMPRESA_A.id}?periodo=2026-11`);
    expect(await screen.findByRole("heading", { level: 2, name: /11\/2026/ })).toBeInTheDocument();
  });

  it("período sem nota mostra a mensagem no lugar dos números", async () => {
    abrir(painelSemNotasNoPeriodo, `/e/${EMPRESA_A.id}?periodo=2026-05`);
    expect(await screen.findByText("Nenhum crédito neste período nas consultas feitas.")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("R$");
  });
});

describe("débitos (CA-13)", () => {
  it("bloco separado, depois dos créditos, com os três rótulos, o nome oficial, a quantidade e a frase de saldo líquido", async () => {
    abrir(painelCompleto);
    const debitos = await screen.findByRole("region", { name: "Débitos de CBS (vendas)" });
    const creditos = screen.getByRole("region", { name: "Créditos de CBS" });
    expect(creditos.compareDocumentPosition(debitos) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    for (const [rotulo, campo, valor] of [
      ["Débito apurado", "apurado", "8000.00"],
      ["Já extinto", "extinto", "3000.00"],
      ["Em aberto", "saldoDevedor", "5000.00"],
    ]) {
      const c = within(debitos).getByRole("group", { name: rotulo });
      expect(c).toHaveTextContent(campo!);
      expect(c).toHaveTextContent(formatarReais(valor!));
    }
    expect(debitos).toHaveTextContent("300 notas");
    expect(debitos).toHaveTextContent("Imposto das vendas registrado pela Receita. O CreditoGov não calcula saldo líquido entre crédito e débito nesta versão.");
  });
});

describe("avisos (CA-22, CA-25)", () => {
  it("o aviso de só CBS aparece", async () => {
    abrir(painelCompleto);
    expect(await screen.findByText("Só CBS. Os dados vêm da API de apuração da CBS da Receita Federal; o IBS ainda não está nessa fonte.")).toBeInTheDocument();
  });

  it("com origens, o aviso lista nome, código e quantidade; sem, não aparece", async () => {
    abrir(painelOutrosValores);
    expect(
      await screen.findByText(/Há notas com origem diferente de normal neste recorte\. Os valores entram nos totais como a Receita informou: .*CANCELAMENTO_CREDITO \(30\): 2 notas/),
    ).toBeInTheDocument();
    expect(screen.getByText(/DEVOLUCAO_POR_PCONT \(20\): 1 nota/)).toBeInTheDocument();
    document.body.innerHTML = "";
    abrir(painelCompleto);
    await screen.findByRole("group", { name: "Apropriado" });
    expect(screen.queryByText(/origem diferente de normal/)).not.toBeInTheDocument();
  });
});

describe("menu (DT-12)", () => {
  it("Visão geral, Pendências e Pessoas; nenhum item de crédito, débito, consultas, recolhimentos ou pagamentos", async () => {
    abrir(painelCompleto);
    const menu = await screen.findByRole("navigation", { name: "Principal" });
    expect(within(menu).getAllByRole("link").map((l) => l.textContent)).toEqual(["Visão geral", "Pendências", "Pessoas"]);
    for (const proibido of ["Créditos", "Débitos", "Consultas à Receita", "Recolhimentos", "Pagamentos", "Início"]) {
      expect(within(menu).queryByText(proibido)).not.toBeInTheDocument();
    }
  });
});
