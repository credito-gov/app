// Linha da carteira de uma empresa (CA-C1, CA-C2; DT-8): I-2, I-3 e I-4 de todos os períodos e um resumo
// da situação que junta créditos e débitos. Função pura, uma empresa por vez: não há função que some
// valores de empresas diferentes (CA-C4). O relógio chega por parâmetro.
import type { Papel } from "../banco/esquema.js";
import { consolidarNotas, type NotaDoBanco } from "./consolidacao.js";
import { indicadoresDeCredito } from "./creditos.js";
import { situacaoDoServico, type ArquivoResumo, type ConsultaResumo, type EstadoDoServico } from "./situacao.js";

const DIA_MS = 24 * 60 * 60_000;

export interface EmpresaDaCarteira {
  id: string;
  nome: string;
  cnpjRaizFormatado: string;
  papel: Papel;
}

/** Os dados lidos de uma empresa, sem consolidar (a mesma forma de `DadosDaEmpresa`). */
export interface DadosParaCarteira {
  raiz: string;
  consultas: readonly ConsultaResumo[];
  arquivos: readonly ArquivoResumo[];
  creditos: readonly NotaDoBanco[];
  debitos: readonly NotaDoBanco[];
}

export type ResumoDaSituacao = "atualizado" | "falhou" | "desatualizado" | "sem_consulta";

export interface LinhaDaCarteira extends EmpresaDaCarteira {
  creditos: { estado: EstadoDoServico; aApropriar: string | null; apropriado: string | null; utilizado: string | null };
  situacao: { resumo: ResumoDaSituacao; ultimaConcluidaEm: string | null; diasSemConsulta: number | null };
}

export function linhaDaCarteira(empresa: EmpresaDaCarteira, dados: DadosParaCarteira, agora: Date): LinhaDaCarteira {
  const creditos = consolidarNotas(dados.creditos);
  const debitos = consolidarNotas(dados.debitos);
  const base = { consultas: dados.consultas, arquivos: dados.arquivos };
  const sCreditos = situacaoDoServico("creditos", { ...base, notas: creditos }, agora);
  const sDebitos = situacaoDoServico("debitos", { ...base, notas: debitos }, agora);

  let valores: { aApropriar: string; apropriado: string; utilizado: string } | null = null;
  if (sCreditos.estado === "com_dados") {
    const i = indicadoresDeCredito(creditos, dados.raiz, null);
    if (!i.semNotasNoRecorte) valores = { aApropriar: i.totais.aApropriar, apropriado: i.totais.apropriado, utilizado: i.totais.utilizado };
  }

  const concluidas = [sCreditos.ultimaConcluidaEm, sDebitos.ultimaConcluidaEm];
  const semConcluida = concluidas.some((c) => c === null);
  const maisAntiga = semConcluida ? null : (concluidas as string[]).reduce((m, c) => (c < m ? c : m));

  const resumo: ResumoDaSituacao =
    sCreditos.falha !== null || sDebitos.falha !== null
      ? "falhou"
      : semConcluida
        ? "sem_consulta"
        : sCreditos.desatualizado || sDebitos.desatualizado
          ? "desatualizado"
          : "atualizado";

  return {
    id: empresa.id,
    nome: empresa.nome,
    cnpjRaizFormatado: empresa.cnpjRaizFormatado,
    papel: empresa.papel,
    creditos: {
      estado: sCreditos.estado,
      aApropriar: valores?.aApropriar ?? null,
      apropriado: valores?.apropriado ?? null,
      utilizado: valores?.utilizado ?? null,
    },
    situacao: {
      resumo,
      ultimaConcluidaEm: maisAntiga,
      diasSemConsulta: maisAntiga === null ? null : Math.floor((agora.getTime() - new Date(maisAntiga).getTime()) / DIA_MS),
    },
  };
}
