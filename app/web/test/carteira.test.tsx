// Carteira em /empresas (CA-C1 a CA-C4; P-T1): uma linha por empresa, sem total, com ordenação e selos.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { formatarReais } from "../src/formatacao/dinheiro";
import { rotasApp } from "../src/rotas";
import { PROIBIDAS, PROIBIDAS_RECOLHIMENTO, simples } from "./apoio/palavras";
import { SEM_SESSAO, USUARIO, json, renderizar, simularFetch } from "./auxiliar";
import {
  carteira,
  LINHA_ATUALIZADA,
  LINHA_COM_RECUSADOS,
  LINHA_FALHOU,
  LINHA_SO_RECUSADOS,
} from "./fixtures/carteira";
import { painelCompleto, painelOutrosValores } from "./fixtures/painel";
import type { Carteira } from "../src/paineis/tipos";

const SUBTITULO = "Valores de cada empresa como a Receita informou. Valores de empresas diferentes não se somam.";

const comoEmpresa = (l: (typeof carteira.empresas)[number]) => ({
  id: l.id,
  nome: l.nome,
  cnpjRaiz: l.cnpjRaizFormatado.replaceAll(".", ""),
  cnpjRaizFormatado: l.cnpjRaizFormatado,
  papel: l.papel,
});

function abrir(resposta: Carteira | "rejeitar" | { status: number } = carteira, rota = "/empresas", logada = true) {
  const empresas = (resposta === "rejeitar" || "status" in resposta ? carteira : resposta).empresas.map(comoEmpresa);
  const chamadas = simularFetch((c) => {
    if (c.url === "/api/sessao") return logada ? json(200, { usuario: USUARIO, empresas }) : SEM_SESSAO;
    if (c.url === "/api/carteira") {
      if (resposta === "rejeitar") return "rejeitar";
      if ("status" in resposta) return json(resposta.status, { erro: "interno", mensagem: "Erro." });
      return json(200, resposta);
    }
    const dela = empresas.find((e) => c.url === `/api/empresas/${e.id}`);
    if (dela) return json(200, dela);
    const doPainel = empresas.find((e) => c.url.startsWith(`/api/empresas/${e.id}/painel`));
    if (doPainel) return json(200, doPainel.id === LINHA_ATUALIZADA.id ? painelCompleto : painelOutrosValores);
    return json(404, { erro: "empresa_nao_encontrada", mensagem: "Empresa não encontrada ou sem acesso." });
  });
  const router = renderizar(rotasApp, rota);
  return { chamadas, router };
}

const linhas = () => within(screen.getByRole("table", { name: "Empresas" })).getAllByRole("row").slice(1);
const nomesNaOrdem = () => linhas().map((l) => (l.textContent ?? "").match(/(Alfa|Beta|Gama|Delta|Épsilon) Exemplo/)![1]);
const linhaDe = (nome: string) => linhas().find((l) => l.textContent?.includes(nome))!;
const cabecalho = (rotulo: string | RegExp) => within(screen.getByRole("table", { name: "Empresas" })).getByRole("button", { name: rotulo });

describe("CA-C1: uma linha por empresa", () => {
  it("cada linha tem nome, CNPJ raiz formatado, papel abaixo do nome (P-T1), os três valores, selo e data", async () => {
    abrir();
    await screen.findByRole("table", { name: "Empresas" });
    expect(linhas()).toHaveLength(5);
    const a = linhaDe("Alfa Exemplo");
    expect(a).toHaveTextContent("Alfa Exemplo Ltda.");
    expect(a).toHaveTextContent("CNPJ raiz 31.000.001");
    expect(a).toHaveTextContent("Contador");
    expect(a).toHaveTextContent(formatarReais("4000.00"));
    expect(a).toHaveTextContent(formatarReais("3000.00"));
    expect(a).toHaveTextContent(formatarReais("2500.00"));
    expect(a).toHaveTextContent("Atualizado");
    expect(a).toHaveTextContent("26/11/2026 às 12:05");
    // o papel é texto secundário do bloco do nome, como na lista da 034
    expect(within(a).getByText("Contador").closest(".cg-company")).not.toBeNull();
    expect(linhaDe("Beta Exemplo")).toHaveTextContent("Colaborador");
    expect(linhaDe("Gama Exemplo")).toHaveTextContent("Titular");
  });

  it("o cabeçalho de cada coluna de valor traz o nome oficial do campo", async () => {
    abrir();
    const tabela = await screen.findByRole("table", { name: "Empresas" });
    const cab = within(tabela).getAllByRole("columnheader");
    const texto = cab.map((c) => c.textContent ?? "").join("|");
    expect(texto).toContain("A apropriar (pendente)");
    expect(texto).toContain("aApropriar");
    expect(texto).toContain("Apropriado");
    expect(texto).toContain("apropriado");
    expect(texto).toContain("Já utilizado");
    expect(texto).toContain("utilizado");
  });

  it("fora de com_dados os valores dão lugar ao texto do estado, em cg-money is-na, nunca R$ 0,00", async () => {
    abrir();
    await screen.findByRole("table", { name: "Empresas" });
    const semConsulta = linhaDe("Delta Exemplo");
    expect(semConsulta).not.toHaveTextContent("R$");
    expect(semConsulta.querySelectorAll(".cg-money.is-na").length).toBeGreaterThanOrEqual(1);
    expect(within(semConsulta).getAllByText("Ainda não consultado").length).toBeGreaterThanOrEqual(1);
    const vazia = linhaDe("Épsilon Exemplo");
    expect(vazia).not.toHaveTextContent("R$");
    expect(vazia.querySelectorAll(".cg-money.is-na").length).toBeGreaterThanOrEqual(1);
    expect(within(vazia).getAllByText("Nenhum crédito nas consultas").length).toBeGreaterThanOrEqual(1);
  });

  it("um valor zero verdadeiro de uma empresa com dados continua como R$ 0,00", async () => {
    abrir();
    await screen.findByRole("table", { name: "Empresas" });
    expect(linhaDe("Gama Exemplo")).toHaveTextContent("R$ 0,00");
  });
});

describe("CA-C2: selos, datas e ordenação", () => {
  it("os selos: Atualizado, Consulta falhou, N dias sem atualização e Sem dados nos indicadores", async () => {
    abrir();
    await screen.findByRole("table", { name: "Empresas" });
    expect(linhaDe("Alfa Exemplo")).toHaveTextContent("Atualizado");
    expect(linhaDe("Beta Exemplo")).toHaveTextContent("Consulta falhou");
    expect(linhaDe("Gama Exemplo")).toHaveTextContent("9 dias sem atualização");
    expect(linhaDe("Delta Exemplo")).toHaveTextContent("Sem dados nos indicadores");
    expect(linhaDe("Beta Exemplo")).toHaveTextContent("24/11/2026 às 09:00");
  });

  it("a ordenação padrão é por nome", async () => {
    abrir();
    await screen.findByRole("table", { name: "Empresas" });
    expect(nomesNaOrdem()).toEqual(["Alfa", "Beta", "Delta", "Épsilon", "Gama"]);
    expect(screen.getByRole("columnheader", { name: /Empresa/ })).toHaveAttribute("aria-sort", "ascending");
  });

  it("clicar em Empresa de novo inverte a ordem por nome", async () => {
    abrir();
    await screen.findByRole("table", { name: "Empresas" });
    await userEvent.click(cabecalho(/^Empresa/));
    expect(nomesNaOrdem()).toEqual(["Gama", "Épsilon", "Delta", "Beta", "Alfa"]);
  });

  it("por A apropriar: o maior primeiro, com as sem valor no fim, e de novo o menor primeiro, ainda com as sem valor no fim", async () => {
    abrir();
    await screen.findByRole("table", { name: "Empresas" });
    await userEvent.click(cabecalho(/A apropriar/));
    expect(nomesNaOrdem()).toEqual(["Beta", "Alfa", "Gama", "Delta", "Épsilon"]);
    expect(screen.getByRole("columnheader", { name: /A apropriar/ })).toHaveAttribute("aria-sort", "descending");
    await userEvent.click(cabecalho(/A apropriar/));
    expect(nomesNaOrdem()).toEqual(["Gama", "Alfa", "Beta", "Delta", "Épsilon"]);
    expect(screen.getByRole("columnheader", { name: /A apropriar/ })).toHaveAttribute("aria-sort", "ascending");
  });

  it("pela última atualização (ultimaAceitaEm): a mais antiga primeiro, e as sem data antes de todas", async () => {
    abrir();
    await screen.findByRole("table", { name: "Empresas" });
    await userEvent.click(cabecalho(/Última atualização/));
    expect(nomesNaOrdem()).toEqual(["Delta", "Gama", "Beta", "Épsilon", "Alfa"]);
  });
});

describe("CA-C3: a linha leva à empresa", () => {
  it("o nome é um link para /e/:empresaId", async () => {
    abrir();
    await screen.findByRole("table", { name: "Empresas" });
    expect(within(linhaDe("Alfa Exemplo")).getByRole("link", { name: "Alfa Exemplo Ltda." })).toHaveAttribute("href", `/e/${LINHA_ATUALIZADA.id}`);
  });

  it("o clique em qualquer parte da linha leva a /e/:empresaId, e a Visão geral mostra os valores daquela empresa", async () => {
    const { router } = abrir();
    await screen.findByRole("table", { name: "Empresas" });
    await userEvent.click(within(linhaDe("Alfa Exemplo")).getByText(formatarReais("2500.00")));
    await waitFor(() => expect(router.state.location.pathname).toBe(`/e/${LINHA_ATUALIZADA.id}`));
    const t = painelCompleto.creditos!.semNotasNoRecorte ? null : painelCompleto.creditos!.totais;
    const cartao = await screen.findByRole("group", { name: "Crédito apurado nas compras" });
    expect(cartao).toHaveTextContent(formatarReais(t!.apurado));
  });

  it("o clique na linha de outra empresa mostra a Visão geral dela", async () => {
    const { router } = abrir();
    await screen.findByRole("table", { name: "Empresas" });
    await userEvent.click(within(linhaDe("Beta Exemplo")).getByRole("link", { name: "Beta Exemplo S.A." }));
    await waitFor(() => expect(router.state.location.pathname).toBe(`/e/${LINHA_FALHOU.id}`));
    expect(await screen.findByRole("region", { name: "Outros valores do crédito" })).toBeInTheDocument();
  });
});

describe("CA-C4: nada de total", () => {
  it("o subtítulo da Spec aparece e o título é Empresas", async () => {
    abrir();
    expect(await screen.findByRole("heading", { level: 1, name: "Empresas" })).toBeInTheDocument();
    expect(screen.getByText(SUBTITULO)).toBeInTheDocument();
  });

  it("a página não tem linha, cartão nem texto de total, nem rodapé de tabela", async () => {
    abrir();
    const tabela = await screen.findByRole("table", { name: "Empresas" });
    expect(tabela.querySelector("tfoot")).toBeNull();
    expect(document.querySelector(".cg-total")).toBeNull();
    expect(screen.queryByRole("group")).toBeNull();
    expect(simples(document.body.textContent ?? "")).not.toMatch(/\btotal\b|\bsoma\b|\bsomando\b/);
    // cada valor em reais na tela é de uma linha da resposta, nenhum é a soma de duas
    const daResposta = new Set(carteira.empresas.flatMap((e) => [e.creditos.aApropriar, e.creditos.apropriado, e.creditos.utilizado]).filter((v): v is string => v !== null).map(formatarReais));
    const naTela = [...(document.body.textContent ?? "").matchAll(/-?R\$ [\d.]+,\d{2}/g)].map((m) => m[0]);
    expect(naTela.length).toBeGreaterThan(0);
    for (const v of naTela) expect(daResposta.has(v), v).toBe(true);
  });
});

describe("estados da página e palavras proibidas (CA-2)", () => {
  it("sem nenhuma empresa mostra a mensagem da 034 e Sair, sem erro técnico", async () => {
    abrir({ empresas: [] });
    expect(
      await screen.findByText("Você ainda não tem acesso a nenhuma empresa. Peça um convite à equipe CreditoGov ou ao seu contador."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
    expect(screen.queryByText(/erro|404|undefined/i)).toBeNull();
  });

  it("sem conexão mostra o alerta com Tentar de novo, e o botão busca de novo", async () => {
    const { chamadas } = abrir("rejeitar");
    expect(await screen.findByText("Sem conexão")).toBeInTheDocument();
    const antes = chamadas.filter((c) => c.url === "/api/carteira").length;
    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    await waitFor(() => expect(chamadas.filter((c) => c.url === "/api/carteira").length).toBeGreaterThan(antes));
  });

  it("Sair continua disponível com a carteira na tela", async () => {
    abrir();
    await screen.findByRole("table", { name: "Empresas" });
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
  });

  it("a página busca só GET /api/carteira, uma vez, com a chave de cache da carteira", async () => {
    const { chamadas } = abrir();
    await screen.findByRole("table", { name: "Empresas" });
    expect(chamadas.filter((c) => c.url === "/api/carteira")).toHaveLength(1);
    expect(chamadas.filter((c) => c.url === "/api/carteira").every((c) => c.metodo === "GET")).toBe(true);
  });

  it("nem os textos nem o HTML da carteira têm as palavras proibidas", async () => {
    const fonte = simples(readFileSync(join(import.meta.dirname, "..", "src", "paineis", "textos.ts"), "utf8"));
    abrir();
    await screen.findByRole("table", { name: "Empresas" });
    const texto = simples(document.body.textContent ?? "");
    for (const p of [...PROIBIDAS, ...PROIBIDAS_RECOLHIMENTO]) {
      expect(texto, p).not.toContain(p);
      expect(fonte, p).not.toContain(p);
    }
  });

  it("as cinco linhas da fixture cobrem os quatro resumos", () => {
    expect(new Set(carteira.empresas.map((e) => e.situacao.resumo))).toEqual(new Set(["atualizado", "falhou", "desatualizado", "sem_consulta"]));
  });
});

describe("ajuste de 2026-11-28 e CA-20: retornos recusados na carteira", () => {
  const comRecusados: Carteira = { empresas: [LINHA_COM_RECUSADOS, LINHA_SO_RECUSADOS] };

  it("aceito há 10 dias com recusados desde então: 10 dias sem atualização, data do aceito e aviso de retornos não usados", async () => {
    abrir(comRecusados);
    await screen.findByRole("table", { name: "Empresas" });
    const l = linhaDe("Zeta Exemplo");
    expect(l).toHaveTextContent("10 dias sem atualização");
    expect(l).not.toHaveTextContent("Atualizado");
    expect(l).toHaveTextContent("16/11/2026");
    expect(l).toHaveTextContent("Há retornos da Receita que não entraram nos indicadores");
  });

  it("só retornos recusados (créditos e débitos): selo neutro 'Sem dados nos indicadores', nunca 'Atualizado', com o aviso", async () => {
    abrir(comRecusados);
    await screen.findByRole("table", { name: "Empresas" });
    const l = linhaDe("Ômega Exemplo");
    expect(l).toHaveTextContent("Sem dados nos indicadores");
    expect(l).not.toHaveTextContent("Atualizado");
    expect(l).toHaveTextContent("Há retornos da Receita que não entraram nos indicadores");
    expect(l.textContent).not.toContain("R$");
  });

  it("empresa sem recusados não mostra o aviso", async () => {
    abrir();
    await screen.findByRole("table", { name: "Empresas" });
    expect(screen.queryByText(/não entraram nos indicadores/)).toBeNull();
  });
});
