// Estados dos dados (CA-14 a CA-22): cada serviço mostra o seu estado, sem número inventado e sem zero.
import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Painel } from "../src/paineis/tipos";
import { rotasApp } from "../src/rotas";
import { PROIBIDAS, PROIBIDAS_RECOLHIMENTO, simples } from "./apoio/palavras";
import { EMPRESA_A, USUARIO, json, renderizar, simularFetch } from "./auxiliar";
import {
  painelCompleto,
  painelDesatualizado,
  painelEmAndamento,
  painelFalhaComAnteriores,
  painelOutrosValores,
  painelParcial,
  painelDebitosRecusado,
  painelDebitosSoRecusado,
  painelRecusadoDesatualizado,
  painelRecusado,
  painelSemConsulta,
  painelSoRecusado,
  painelVazio,
} from "./fixtures/painel";

const TODOS: Array<[string, Painel]> = [
  ["completo", painelCompleto],
  ["sem-consulta", painelSemConsulta],
  ["em-andamento", painelEmAndamento],
  ["vazio", painelVazio],
  ["parcial", painelParcial],
  ["falha-com-anteriores", painelFalhaComAnteriores],
  ["desatualizado", painelDesatualizado],
  ["recusado", painelRecusado],
  ["so-recusado", painelSoRecusado],
  ["debitos-recusado", painelDebitosRecusado],
  ["debitos-so-recusado", painelDebitosSoRecusado],
  ["recusado-desatualizado", painelRecusadoDesatualizado],
  ["outros-valores", painelOutrosValores],
];

async function abrir(painel: Painel) {
  simularFetch((c) => {
    if (c.url === "/api/sessao") return json(200, { usuario: USUARIO, empresas: [EMPRESA_A] });
    if (c.url === "/api/empresas") return json(200, [EMPRESA_A]);
    if (c.url === `/api/empresas/${EMPRESA_A.id}`) return json(200, EMPRESA_A);
    if (c.url.startsWith(`/api/empresas/${EMPRESA_A.id}/painel`)) return json(200, painel);
    return json(404, { erro: "nao_encontrado", mensagem: "Recurso não encontrado." });
  });
  renderizar(rotasApp, `/e/${EMPRESA_A.id}`);
  await screen.findByRole("heading", { level: 2, name: /Recorte:/ });
}
const creditos = () => screen.getByRole("region", { name: "Créditos de CBS" });
const debitos = () => screen.getByRole("region", { name: "Débitos de CBS (vendas)" });

const FRASE_CA14 =
  "Os números são os das consultas feitas pelo CreditoGov à API de apuração da CBS da Receita Federal. A Receita não fornece histórico anterior a essas consultas.";

describe("CA-14: última consulta que entrou nos indicadores e intervalo de atualização", () => {
  it("por serviço, a data e hora da última consulta concluída e o intervalo das notas, mais a frase fixa", async () => {
    await abrir(painelCompleto);
    expect(await screen.findByText("Créditos: última consulta que entrou nos indicadores em 26/11/2026 às 12:05. Notas atualizadas de 01/11/2026 a 21/11/2026.")).toBeInTheDocument();
    expect(screen.getByText("Débitos: última consulta que entrou nos indicadores em 26/11/2026 às 12:05. Notas atualizadas de 01/11/2026 a 21/11/2026.")).toBeInTheDocument();
    expect(screen.getByText(FRASE_CA14)).toBeInTheDocument();
  });
});

describe("CA-15: alerta de dados desatualizados, por serviço, no topo", () => {
  it("com desatualizado, o alerta traz os dias, e vem antes dos blocos", async () => {
    await abrir(painelDesatualizado);
    const c = await screen.findByText("Créditos sem atualização há 9 dias. Cada consulta à Receita só devolve as alterações dos últimos 8 dias, então pode haver alteração que não foi recebida.");
    const d = screen.getByText("Débitos sem atualização há 9 dias. Cada consulta à Receita só devolve as alterações dos últimos 8 dias, então pode haver alteração que não foi recebida.");
    expect(c.compareDocumentPosition(creditos()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(d).toBeInTheDocument();
  });

  it("sem desatualizado, o alerta não aparece", async () => {
    await abrir(painelCompleto);
    expect(screen.queryByText(/sem atualização há/)).not.toBeInTheDocument();
  });
});

describe("CA-16: sem consulta concluída e em andamento", () => {
  it("sem-consulta e em-andamento não têm nenhum R$ nos blocos", async () => {
    for (const p of [painelSemConsulta, painelEmAndamento]) {
      await abrir(p);
      expect(await screen.findByText("Os créditos ainda não foram consultados na Receita.")).toBeInTheDocument();
      expect(creditos().textContent).not.toContain("R$");
      expect(debitos().textContent).not.toContain("R$");
      document.body.innerHTML = "";
    }
  });

  it("Há uma consulta em andamento só no cenário em andamento", async () => {
    await abrir(painelEmAndamento);
    expect(await within(creditos()).findByText("Há uma consulta em andamento.")).toBeInTheDocument();
    expect(within(debitos()).queryByText("Há uma consulta em andamento.")).not.toBeInTheDocument();
    document.body.innerHTML = "";
    await abrir(painelSemConsulta);
    expect(screen.queryByText("Há uma consulta em andamento.")).not.toBeInTheDocument();
  });
});

describe("CA-17: consulta lida sem nenhum crédito", () => {
  it("mostra a mensagem com a data e nenhum R$ 0,00 fora da própria frase", async () => {
    await abrir(painelVazio);
    const frase = "A Receita não devolveu créditos nas consultas feitas até 26/11/2026 às 12:05. Isto não é um saldo de R$ 0,00.";
    expect(await screen.findByText(frase)).toBeInTheDocument();
    const resto = (creditos().textContent ?? "").replace(frase, "");
    expect(resto).not.toContain("R$");
  });
});

describe("CA-18 e CA-19: um serviço por vez, falha com e sem números anteriores", () => {
  it("parcial: números de créditos, estado de débitos e a falha de débitos, sem zero em débitos", async () => {
    await abrir(painelParcial);
    expect(creditos()).toHaveTextContent("R$ 10.000,00");
    expect(await within(debitos()).findByText("Os débitos ainda não foram consultados na Receita.")).toBeInTheDocument();
    expect(debitos().textContent).not.toContain("R$");
    // O texto da falha aparece no topo e também dentro do bloco de débitos (revisão B2): são duas ocorrências.
    expect(screen.getAllByText("A atualização dos débitos falhou em 27/11/2026 às 09:00.")).toHaveLength(2);
    expect(screen.getAllByText("Isso não depende de você.")).toHaveLength(2);
    expect(screen.queryByText(/credencial de acesso/)).not.toBeInTheDocument();
  });

  it("falha-com-anteriores: números, data da consulta anterior, aviso de não atualizados e texto de credencial", async () => {
    await abrir(painelFalhaComAnteriores);
    expect(await screen.findByText("A atualização dos créditos falhou em 27/11/2026 às 10:00.")).toBeInTheDocument();
    expect(
      screen.getByText("A Receita recusou a credencial de acesso da empresa. É preciso gerar uma nova no portal da Receita. Fale com a equipe CreditoGov para informá-la."),
    ).toBeInTheDocument();
    expect(screen.getByText("Os números abaixo são da consulta de 24/11/2026 às 12:05 e não estão atualizados.")).toBeInTheDocument();
    expect(creditos()).toHaveTextContent("R$ 10.000,00");
    expect(screen.queryByText("Isso não depende de você.")).not.toBeInTheDocument();
  });

  it("nenhuma tela de estado tem código HTTP, nome de estado interno nem nome técnico de erro", async () => {
    for (const [nome, p] of TODOS) {
      await abrir(p);
      const texto = document.body.textContent ?? "";
      expect(texto, nome).not.toMatch(/credencial_invalida|sem_consulta|com_dados|sem_dados_usaveis|erro_interno|servico_indisponivel|aberta_sem_tiquete|(?<![\d.,])(401|403|404|500|502)(?![\d.,])/);
      document.body.innerHTML = "";
    }
  });
});

describe("CA-20: retornos recusados", () => {
  it("com dados aceitos, o aviso traz a quantidade e a data do mais recente", async () => {
    await abrir(painelRecusado);
    expect(
      await screen.findByText("Há retornos da Receita que não entraram nos indicadores: 2 de créditos, o mais recente em 26/11/2026. Os números não incluem esses retornos."),
    ).toBeInTheDocument();
    expect(creditos()).toHaveTextContent("R$ 10.000,00");
  });

  it("um retorno recusado sozinho: Nenhum retorno de créditos pôde ser usado, sem R$", async () => {
    await abrir(painelSoRecusado);
    expect(await within(creditos()).findByText("Nenhum retorno de créditos pôde ser usado.")).toBeInTheDocument();
    expect(creditos().textContent).not.toContain("R$");
  });
});

describe("CA-21, CA-22 e CA-2 em todos os estados", () => {
  it("nenhuma tela fala de recolhimento ou pagamento, e todas têm o aviso de só CBS", async () => {
    for (const [nome, p] of TODOS) {
      await abrir(p);
      const texto = simples(document.body.textContent ?? "");
      expect(texto, nome).not.toContain("recolhimento");
      expect(texto, nome).not.toContain("pagamento");
      expect(screen.getByText(/^Só CBS\./), nome).toBeInTheDocument();
      document.body.innerHTML = "";
    }
  });

  it("nenhuma palavra proibida no HTML de nenhum estado", async () => {
    for (const [nome, p] of TODOS) {
      await abrir(p);
      const texto = simples(document.body.textContent ?? "");
      for (const palavra of [...PROIBIDAS, ...PROIBIDAS_RECOLHIMENTO]) expect(texto, `${nome}: ${palavra}`).not.toContain(palavra);
      document.body.innerHTML = "";
    }
  });
});

describe("a página não quebra com o painel ainda carregando", () => {
  it("mostra Carregando enquanto a busca não volta", async () => {
    simularFetch((c) => {
      if (c.url === "/api/sessao") return json(200, { usuario: USUARIO, empresas: [EMPRESA_A] });
      if (c.url === "/api/empresas") return json(200, [EMPRESA_A]);
      if (c.url === `/api/empresas/${EMPRESA_A.id}`) return json(200, EMPRESA_A);
      return new Promise<never>(() => undefined);
    });
    renderizar(rotasApp, `/e/${EMPRESA_A.id}`);
    await waitFor(() => expect(screen.getAllByText("Carregando…").length).toBeGreaterThan(0));
  });
});

describe("ajuste de 2026-11-28: a data e o aviso de desatualizado usam só o aceito (CA-14, CA-15, CA-19)", () => {
  it("aceito há 10 dias e recusados desde então: aviso de 10 dias, data do aceito e aviso de recusados", async () => {
    await abrir(painelRecusadoDesatualizado);
    expect(
      await screen.findByText(
        "Créditos sem atualização há 10 dias. Cada consulta à Receita só devolve as alterações dos últimos 8 dias, então pode haver alteração que não foi recebida.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Créditos: última consulta que entrou nos indicadores em 16\/11\/2026 às 12:05/)).toBeInTheDocument();
    expect(screen.getByText(/10 de créditos/)).toBeInTheDocument();
  });

  it("os números anteriores citam a data do último aceito", async () => {
    const p: Painel = {
      ...painelFalhaComAnteriores,
      situacao: {
        ...painelFalhaComAnteriores.situacao,
        creditos: { ...painelFalhaComAnteriores.situacao.creditos, ultimaAceitaEm: "2026-11-20T15:05:00.000Z" },
      },
    };
    await abrir(p);
    expect(await screen.findByText("Os números abaixo são da consulta de 20/11/2026 às 12:05 e não estão atualizados.")).toBeInTheDocument();
  });
});

describe("CA-18 e CA-19: com falha, o bloco sem números mostra a falha e a ação (revisão B2)", () => {
  it("débitos ainda não consultados e com falha: o próprio bloco traz o título da falha e a ação", async () => {
    await abrir(painelParcial);
    expect(await within(debitos()).findByText("A atualização dos débitos falhou em 27/11/2026 às 09:00.")).toBeInTheDocument();
    expect(within(debitos()).getByText("Isso não depende de você.")).toBeInTheDocument();
  });

  it("falha de credencial em bloco vazio ou sem dados usáveis: título e ação de credencial dentro do bloco", async () => {
    const falha = { em: "2026-11-27T13:00:00.000Z", tipo: "credencial" as const };
    for (const p of [
      { ...painelVazio, situacao: { ...painelVazio.situacao, creditos: { ...painelVazio.situacao.creditos, falha } } },
      { ...painelSoRecusado, situacao: { ...painelSoRecusado.situacao, creditos: { ...painelSoRecusado.situacao.creditos, falha } } },
      { ...painelSemConsulta, situacao: { ...painelSemConsulta.situacao, creditos: { ...painelSemConsulta.situacao.creditos, falha } } },
    ] as Painel[]) {
      await abrir(p);
      expect(await within(creditos()).findByText("A atualização dos créditos falhou em 27/11/2026 às 10:00.")).toBeInTheDocument();
      expect(within(creditos()).getByText(/Fale com a equipe CreditoGov para informá-la./)).toBeInTheDocument();
      document.body.innerHTML = "";
    }
  });
});

describe("CA-20 em débitos: retorno de débitos recusado", () => {
  it("com débitos aceitos, o aviso aparece no bloco de débitos e não no de créditos", async () => {
    await abrir(painelDebitosRecusado);
    expect(
      await within(debitos()).findByText("Há retornos da Receita que não entraram nos indicadores: 2 de débitos, o mais recente em 25/11/2026. Os números não incluem esses retornos."),
    ).toBeInTheDocument();
    expect(within(creditos()).queryByText(/não entraram nos indicadores/)).not.toBeInTheDocument();
  });

  it("sem_dados_usaveis em débitos: Nenhum retorno de débitos pôde ser usado, sem R$, e créditos com números", async () => {
    await abrir(painelDebitosSoRecusado);
    expect(await within(debitos()).findByText("Nenhum retorno de débitos pôde ser usado.")).toBeInTheDocument();
    expect(debitos().textContent).not.toContain("R$");
    expect(creditos()).toHaveTextContent("R$ 10.000,00");
  });
});
