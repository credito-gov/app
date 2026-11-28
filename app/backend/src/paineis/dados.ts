// Leitura dos dados fiscais de uma empresa e montagem das respostas do dashboard (CA-1 a CA-25).
// Tudo roda dentro da transação recebida (com a empresa fixada, AD-6); os valores numeric chegam como texto.
import Big from "big.js";
import type { Trx } from "../banco/transacao.js";
import { consolidarNotas, type NotaDoBanco } from "../indicadores/consolidacao.js";
import { noRecorte, periodosDisponiveis } from "../indicadores/comum.js";
import { agruparPendentes, indicadoresDeCredito, notasDoGrupo } from "../indicadores/creditos.js";
import { indicadoresDeDebito } from "../indicadores/debitos.js";
import { situacaoDoServico, type ArquivoResumo, type ConsultaResumo, type SituacaoDoServico } from "../indicadores/situacao.js";
import { NOMES_DOCUMENTO, nomeOrigem } from "../leitura/tabelas.js";

/** Coluna do banco e nome do campo na resposta, como em registrar.ts. */
const COLUNAS_CREDITO = [
  ["apurado", "apurado"],
  ["a_apropriar", "aApropriar"],
  ["apropriado", "apropriado"],
  ["suspenso", "suspenso"],
  ["inapropriavel", "inapropriavel"],
  ["prescrito", "prescrito"],
  ["utilizado", "utilizado"],
  ["restabelecido", "restabelecido"],
  ["inutilizavel", "inutilizavel"],
  ["saldo_credor", "saldoCredor"],
  ["pedido_ressarcimento", "pedidoRessarcimento"],
  ["excedente", "excedente"],
] as const;
const COLUNAS_DEBITO = [
  ["apurado", "apurado"],
  ["extinto", "extinto"],
  ["saldo_devedor", "saldoDevedor"],
  ["suspenso", "suspenso"],
  ["inexigivel", "inexigivel"],
  ["pgto_antecipado", "pgtoAntecipado"],
  ["excedente", "excedente"],
] as const;

export interface DadosDaEmpresa {
  raiz: string;
  consultas: ConsultaResumo[];
  arquivos: ArquivoResumo[];
  /** Notas de todos os arquivos, sem consolidar. */
  creditos: NotaDoBanco[];
  debitos: NotaDoBanco[];
}

type Linha = Record<string, unknown>;

export function valoresDe(linha: Linha, colunas: ReadonlyArray<readonly [string, string]>): Record<string, string> {
  const valores: Record<string, string> = {};
  for (const [coluna, campo] of colunas) {
    const v = linha[coluna];
    if (v === null || v === undefined) continue;
    // Só texto decimal ou null: outro tipo seria valor perdido em silêncio (vira zero na tela). Sem o valor no erro.
    if (typeof v !== "string") {
      throw new Error(`Tipo inesperado na coluna ${coluna} do arquivo ${String(linha["arquivo_id"])}: ${typeof v}.`);
    }
    valores[campo] = v;
  }
  return valores;
}

/** Lê tudo o que o dashboard usa de uma empresa (que tem de estar fixada na transação). */
export async function lerDadosDaEmpresa(trx: Trx, empresaId: string): Promise<DadosDaEmpresa> {
  const empresa = await trx.selectFrom("empresa").select("cnpj_raiz").where("id", "=", empresaId).executeTakeFirstOrThrow();
  const consultas = await trx
    .selectFrom("consulta")
    .select(["id", "servico", "estado", "criada_em", "concluida_em", "finalizada_em"])
    .where("empresa_id", "=", empresaId)
    .execute();
  const arquivos = await trx
    .selectFrom("arquivo_bruto")
    .select(["id", "consulta_id", "servico", "situacao", "recebido_em", "gerado_em"])
    .where("empresa_id", "=", empresaId)
    .execute();
  const doArquivo = new Map(arquivos.map((a) => [a.id, a]));

  const notas = (linhas: Linha[], colunas: ReadonlyArray<readonly [string, string]>): NotaDoBanco[] =>
    linhas.flatMap((l) => {
      const a = doArquivo.get(l["arquivo_id"] as string);
      if (!a) return [];
      return [
        {
          arquivoId: a.id,
          situacaoArquivo: a.situacao,
          geradoEm: a.gerado_em,
          recebidoEm: a.recebido_em,
          pa: l["pa"] as string,
          chave: l["chave"] as string,
          documento: l["documento"] as number,
          origem: l["origem"] as number,
          emissao: (l["emissao"] as string | null) ?? null,
          registro: (l["registro"] as string | null) ?? null,
          atualizacao: (l["atualizacao"] as string | null) ?? null,
          valores: valoresDe(l, colunas),
        },
      ];
    });
  const creditos = await trx.selectFrom("credito_lido").selectAll().where("empresa_id", "=", empresaId).execute();
  const debitos = await trx.selectFrom("debito_lido").selectAll().where("empresa_id", "=", empresaId).execute();

  return {
    raiz: empresa.cnpj_raiz,
    consultas: consultas.map((c) => ({
      id: c.id,
      servico: c.servico,
      estado: c.estado,
      criadaEm: c.criada_em,
      concluidaEm: c.concluida_em,
      finalizadaEm: c.finalizada_em,
    })),
    arquivos: arquivos
      .filter((a) => a.servico === "creditos" || a.servico === "debitos")
      .map((a) => ({ id: a.id, consultaId: a.consulta_id, servico: a.servico, situacao: a.situacao, recebidoEm: a.recebido_em })),
    creditos: notas(creditos as Linha[], COLUNAS_CREDITO),
    debitos: notas(debitos as Linha[], COLUNAS_DEBITO),
  };
}

export interface Consolidado {
  raiz: string;
  creditos: NotaDoBanco[];
  debitos: NotaDoBanco[];
  situacao: { creditos: SituacaoDoServico; debitos: SituacaoDoServico };
}

/** Consolida as notas (D-5) e calcula a situação de cada serviço. */
export function consolidar(dados: DadosDaEmpresa, agora: Date): Consolidado {
  const creditos = consolidarNotas(dados.creditos);
  const debitos = consolidarNotas(dados.debitos);
  const base = { consultas: dados.consultas, arquivos: dados.arquivos };
  return {
    raiz: dados.raiz,
    creditos,
    debitos,
    situacao: {
      creditos: situacaoDoServico("creditos", { ...base, notas: creditos }, agora),
      debitos: situacaoDoServico("debitos", { ...base, notas: debitos }, agora),
    },
  };
}

const PERIODO = /^\d{4}-(0[1-9]|1[0-2])$/;

/** `AAAA-MM` ou nulo (todos os períodos coletados); undefined se o texto não for um período. */
export function lerPeriodo(texto: unknown): string | null | undefined {
  if (texto === undefined) return null;
  return typeof texto === "string" && PERIODO.test(texto) ? texto : undefined;
}

function recorteDe(c: Consolidado, periodo: string | null) {
  return { periodo, periodos: periodosDisponiveis([...c.creditos, ...c.debitos]) };
}

export function montarPainel(c: Consolidado, periodo: string | null) {
  return {
    recorte: recorteDe(c, periodo),
    situacao: c.situacao,
    creditos: c.situacao.creditos.estado === "com_dados" ? indicadoresDeCredito(c.creditos, c.raiz, periodo) : null,
    debitos: c.situacao.debitos.estado === "com_dados" ? indicadoresDeDebito(c.debitos, periodo) : null,
  };
}

export function montarPendencias(c: Consolidado, periodo: string | null) {
  const comDados = c.situacao.creditos.estado === "com_dados";
  const r = comDados ? agruparPendentes(noRecorte(c.creditos, periodo), c.raiz) : null;
  return {
    recorte: recorteDe(c, periodo),
    situacao: { creditos: c.situacao.creditos },
    grupos: r?.grupos ?? null,
    totalAApropriar: r?.totalAApropriar ?? null,
    percentualNaoIdentificado: r?.percentualNaoIdentificado ?? null,
  };
}

export const NOTAS_POR_PAGINA = 100;
const GRUPO = /^([0-9A-Z]{12}[0-9]{2}|[0-9]{11}|propria-empresa|nao-identificado|negativos)$/;

export type ResultadoDeNotas =
  | { tipo: "ok"; corpo: Record<string, unknown> }
  | { tipo: "grupo_nao_encontrado" }
  | { tipo: "pagina_invalida" };

export function montarNotasDoGrupo(c: Consolidado, periodo: string | null, grupo: string, paginaTexto: unknown): ResultadoDeNotas {
  if (!GRUPO.test(grupo) || c.situacao.creditos.estado !== "com_dados") return { tipo: "grupo_nao_encontrado" };
  const todas = notasDoGrupo(c.creditos, c.raiz, periodo, grupo);
  if (todas.length === 0) return { tipo: "grupo_nao_encontrado" };
  const pagina = paginaTexto === undefined ? 1 : typeof paginaTexto === "string" && /^[1-9][0-9]{0,6}$/.test(paginaTexto) ? Number(paginaTexto) : 0;
  const paginas = Math.ceil(todas.length / NOTAS_POR_PAGINA);
  if (pagina < 1 || pagina > paginas) return { tipo: "pagina_invalida" };
  const total = todas.reduce((t, n) => t.plus(n.valores["aApropriar"] ?? "0"), Big(0));
  const fatia = todas.slice((pagina - 1) * NOTAS_POR_PAGINA, pagina * NOTAS_POR_PAGINA);
  return {
    tipo: "ok",
    corpo: {
      grupo,
      quantidade: todas.length,
      total: total.toFixed(2),
      pagina,
      paginas,
      notas: fatia.map((n) => ({
        periodo: `${n.pa.slice(3)}-${n.pa.slice(0, 2)}`,
        chave: n.chave,
        documento: n.documento,
        documentoNome: NOMES_DOCUMENTO[n.documento] ?? `código ${n.documento}`,
        origem: n.origem,
        origemNome: nomeOrigem(n.origem) ?? `código ${n.origem}`,
        emissao: n.emissao === null ? null : n.emissao.slice(0, 10),
        aApropriar: n.valores["aApropriar"] ?? "0",
      })),
    },
  };
}
