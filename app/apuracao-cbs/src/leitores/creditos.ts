import type Big from "big.js";
import { somar, valor } from "../dinheiro.js";
import { documento, origem, type CodigoNomeado } from "../tabelas.js";

export interface LinhaCredito {
  pa: string;
  chave: string;
  documento: CodigoNomeado;
  origem: CodigoNomeado;
  aApropriar: Big;
  apropriado: Big;
}

export interface PeriodoCreditos {
  pa: string;
  linhas: LinhaCredito[];
  quantidade: number;
  totalAApropriar: Big;
  totalApropriado: Big;
}

export interface ResumoCreditos {
  servico: "creditos";
  vazio: boolean;
  periodos: PeriodoCreditos[];
}

interface CreditoBruto {
  origem: string;
  documento: string;
  chave: string;
  cbs: { apropriacao: { aApropriar?: string; apropriado?: string } };
}

interface ArquivoCreditos {
  apuracao: Array<{ pa: string; creditos: CreditoBruto[] }>;
}

/**
 * Resume o arquivo de créditos já validado e lido sem perda (números como texto).
 * Só mostra a apropriar e apropriado; os demais valores ficam no arquivo bruto.
 */
export function resumirCreditos(dados: unknown): ResumoCreditos {
  const arquivo = dados as ArquivoCreditos;
  const periodos = arquivo.apuracao.map((periodo): PeriodoCreditos => {
    const linhas = periodo.creditos.map(
      (c): LinhaCredito => ({
        pa: periodo.pa,
        chave: c.chave,
        documento: documento(Number(c.documento)),
        origem: origem(Number(c.origem)),
        aApropriar: valor(c.cbs.apropriacao.aApropriar),
        apropriado: valor(c.cbs.apropriacao.apropriado),
      }),
    );
    return {
      pa: periodo.pa,
      linhas,
      quantidade: linhas.length,
      totalAApropriar: somar(linhas.map((l) => l.aApropriar)),
      totalApropriado: somar(linhas.map((l) => l.apropriado)),
    };
  });
  return { servico: "creditos", vazio: periodos.length === 0, periodos };
}
