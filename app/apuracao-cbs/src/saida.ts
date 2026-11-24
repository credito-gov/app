import { formatar } from "./dinheiro.js";
import type { ResumoCreditos } from "./leitores/creditos.js";
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

export type Resumo = ResumoCreditos;

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
  linhas.push(...linhasDeCreditos(resumo));
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
