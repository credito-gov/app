import { formatar } from "./dinheiro.js";
import type { ResumoCreditos } from "./leitores/creditos.js";
import type { ResumoDebitos } from "./leitores/debitos.js";
import type { ResumoPagamentos } from "./leitores/pagamentos.js";
import type { ResumoRecolhimentos } from "./leitores/recolhimentos.js";
import type { NomeServico } from "./servicos.js";
import type { Divergencia } from "./validacao.js";

export const MENSAGEM_SEM_ALTERACOES =
  "A API não devolveu alterações para esta consulta desde a última solicitação concluída (janela de até 8 dias, segundo a documentação).";

export interface Cabecalho {
  servico: NomeServico;
  tiquete: string;
  geradoEm: string;
  caminho: string;
}

export type Resumo = ResumoCreditos | ResumoRecolhimentos | ResumoPagamentos | ResumoDebitos;

/** Cabeçalho comum dos resumos. O niConsumidor não é mostrado (pode ser CPF). */
export function cabecalhoDe(servico: NomeServico, dados: unknown, caminho: string): Cabecalho {
  const d = dados as { tiqueteSolicitacao?: string; geradoEm?: string };
  return { servico, tiquete: d.tiqueteSolicitacao ?? "", geradoEm: d.geradoEm ?? "", caminho };
}

function linhasDeCreditos(resumo: ResumoCreditos): string[] {
  const linhas: string[] = [];
  for (const p of resumo.periodos) {
    linhas.push("", `Período ${p.pa}`);
    for (const l of p.linhas) {
      linhas.push(
        `  ${l.chave} | ${l.documento.nome} (${l.documento.codigo}) | ${l.origem.nome} (${l.origem.codigo}) | ` +
          `a apropriar ${formatar(l.aApropriar)} | apropriado ${formatar(l.apropriado)}`,
      );
    }
    linhas.push(
      `  Total do período ${p.pa}: ${p.quantidade} crédito(s) | total a apropriar ${formatar(p.totalAApropriar)} | total apropriado ${formatar(p.totalApropriado)}`,
    );
  }
  return linhas;
}

function linhasDeRecolhimentos(resumo: ResumoRecolhimentos): string[] {
  const linhas: string[] = [];
  for (const p of resumo.periodos) {
    linhas.push("", `Período ${p.pa}`);
    for (const l of p.linhas) {
      linhas.push(
        `  DARF ${l.numeroDARF} | arrecadação ${l.dataArrecadacao} | fornecedor ${l.niFornecedor} | ` +
          `${l.chaveDFE === undefined ? "sem chave" : `chave ${l.chaveDFE}`} | total ${formatar(l.total)}`,
      );
    }
    linhas.push(`  Período ${p.pa}: ${p.quantidade} item(ns) | total do período ${formatar(p.total)}`);
  }
  linhas.push("", `Itens sem chaveDFE: ${resumo.itensSemChave} de ${resumo.totalItens}`);
  return linhas;
}

function linhasDePagamentos(resumo: ResumoPagamentos): string[] {
  const linhas: string[] = [];
  for (const p of resumo.periodos) {
    linhas.push("", `Período ${p.pa}`);
    for (const l of p.linhas) {
      linhas.push(`  ${l.origem.nome} | DARF ${l.numeroDARF} | arrecadação ${l.dataArrecadacao} | total ${formatar(l.total)}`);
    }
    linhas.push(
      `  Período ${p.pa}: ${p.quantidade} item(ns) | total RAD ${formatar(p.totalRAD)} | total PCONT ${formatar(p.totalPCONT)} | total geral ${formatar(p.totalGeral)}`,
    );
  }
  return linhas;
}

function linhasDeDebitos(resumo: ResumoDebitos): string[] {
  const linhas: string[] = [];
  for (const p of resumo.periodos) {
    linhas.push("", `Período ${p.pa}`);
    for (const l of p.linhas) {
      linhas.push(
        `  ${l.chave} | ${l.documento.nome} (${l.documento.codigo}) | apurado ${formatar(l.apurado)} | extinto ${formatar(l.extinto)} | saldo devedor ${formatar(l.saldoDevedor)}`,
      );
    }
    linhas.push(
      `  Total do período ${p.pa}: ${p.quantidade} débito(s) | total apurado ${formatar(p.totalApurado)} | total extinto ${formatar(p.totalExtinto)} | total saldo devedor ${formatar(p.totalSaldoDevedor)}`,
    );
  }
  return linhas;
}

export function linhasDoResumo(cabecalho: Cabecalho, resumo: Resumo): string[] {
  const linhas = [
    `Resumo da consulta de ${cabecalho.servico}`,
    `Tíquete: ${cabecalho.tiquete}`,
    `Gerado em: ${cabecalho.geradoEm}`,
    `Arquivo: ${cabecalho.caminho}`,
  ];
  if (resumo.vazio) {
    linhas.push("", MENSAGEM_SEM_ALTERACOES);
    return linhas;
  }
  if (resumo.servico === "creditos") linhas.push(...linhasDeCreditos(resumo));
  else if (resumo.servico === "recolhimentos") linhas.push(...linhasDeRecolhimentos(resumo));
  else if (resumo.servico === "pagamentos") linhas.push(...linhasDePagamentos(resumo));
  else linhas.push(...linhasDeDebitos(resumo));
  return linhas;
}

/** Divergências do schema: caminho e mensagem, nunca o valor do campo. */
export function linhasDasDivergencias(caminhoArquivo: string, total: number, divergencias: Divergencia[]): string[] {
  const linhas = [
    `Arquivo não passou no schema oficial: ${total} divergência(s).`,
    `Mostrando ${divergencias.length} de ${total}:`,
  ];
  for (const d of divergencias) linhas.push(`  - ${d.caminho === "" ? "(raiz)" : d.caminho}: ${d.mensagem}`);
  linhas.push(`O arquivo ficou guardado, sem alterações, em: ${caminhoArquivo}`, "Nenhum resumo foi gerado.");
  return linhas;
}
