import type Big from "big.js";
import { somar, valor } from "../dinheiro.js";
import { documento, type CodigoNomeado } from "../tabelas.js";

export interface LinhaDebito {
  pa: string;
  chave: string;
  documento: CodigoNomeado;
  apurado: Big;
  extinto: Big;
  saldoDevedor: Big;
}

export interface PeriodoDebitos {
  pa: string;
  linhas: LinhaDebito[];
  quantidade: number;
  totalApurado: Big;
  totalExtinto: Big;
  totalSaldoDevedor: Big;
}

export interface ResumoDebitos {
  servico: "debitos";
  vazio: boolean;
  periodos: PeriodoDebitos[];
}

interface ArquivoDebitos {
  apuracao: Array<{
    pa: string;
    debitos: Array<{
      documento: string;
      chave: string;
      cbs: { apurado: string; extinto?: string; saldoDevedor: string };
    }>;
  }>;
}

/**
 * Resume o arquivo de débitos já validado e lido sem perda. Só apurado, extinto e saldo devedor;
 * suspenso, inexigível, pagamento antecipado e excedente ficam no arquivo bruto.
 */
export function resumirDebitos(dados: unknown): ResumoDebitos {
  const arquivo = dados as ArquivoDebitos;
  const periodos = arquivo.apuracao.map((periodo): PeriodoDebitos => {
    const linhas = periodo.debitos.map(
      (d): LinhaDebito => ({
        pa: periodo.pa,
        chave: d.chave,
        documento: documento(Number(d.documento)),
        apurado: valor(d.cbs.apurado),
        extinto: valor(d.cbs.extinto),
        saldoDevedor: valor(d.cbs.saldoDevedor),
      }),
    );
    return {
      pa: periodo.pa,
      linhas,
      quantidade: linhas.length,
      totalApurado: somar(linhas.map((l) => l.apurado)),
      totalExtinto: somar(linhas.map((l) => l.extinto)),
      totalSaldoDevedor: somar(linhas.map((l) => l.saldoDevedor)),
    };
  });
  return { servico: "debitos", vazio: periodos.length === 0, periodos };
}
