// Origem: app/painel/src/nucleo/saldo.ts e pendencias.ts (commit 39e4fae da main; AD-14), sobre notas do banco.
// Indicadores de crédito de um recorte (CA-1 a CA-12, CA-23, CA-25). Cada total soma só o seu campo, como veio:
// nenhum é derivado de outro (D-3). Funções puras, valores em big.js, saída em texto com duas casas.
import Big from "big.js";
import { periodoOrdenavel, type NotaDoBanco } from "./consolidacao.js";
import { noRecorte, origensDe, periodoIso, somarCampo, texto, type OrigemEmNotas } from "./comum.js";
import { lerChave } from "./emitente.js";

export { periodosDisponiveis } from "./comum.js";

/** Quantos emitentes aparecem no bloco antes de "demais emitentes" (CA-10). Provisório até a transcrição do artboard (P-S3). */
export const EMITENTES_NO_BLOCO = 5;

const CAMPOS_TOTAIS = ["apurado", "aApropriar", "apropriado", "utilizado", "saldoCredor"] as const;
/** Ordem de I-6 na tela. `excedente` entra com o mesmo tratamento (P-S2). */
const CAMPOS_OUTROS = ["suspenso", "inapropriavel", "prescrito", "restabelecido", "inutilizavel", "pedidoRessarcimento", "excedente"] as const;

export type TotaisDeCredito = Record<(typeof CAMPOS_TOTAIS)[number], string>;

export interface GrupoPendente {
  /** CNPJ de 14 caracteres, CPF de 11 dígitos, `propria-empresa`, `nao-identificado` ou `negativos`. */
  grupo: string;
  tipo: "emitente" | "propria_empresa" | "nao_identificado" | "negativos";
  documento?: "cnpj" | "cpf";
  quantidade: number;
  total: string;
}

export interface Pendentes {
  emitentes: Array<{ grupo: string; documento: "cnpj" | "cpf"; quantidade: number; total: string }>;
  demais: { emitentes: number; quantidade: number; total: string } | null;
  naoIdentificado: { quantidade: number; total: string };
  propriaEmpresa: { quantidade: number; total: string };
  negativos: { quantidade: number; total: string } | null;
  percentualNaoIdentificado: string | null;
}

export type IndicadoresDeCredito =
  | { semNotasNoRecorte: true }
  | {
      semNotasNoRecorte: false;
      quantidadeNotas: number;
      quantidadeComAApropriar: number;
      totais: TotaisDeCredito;
      outros: Array<{ campo: string; valor: string }>;
      pendentes: Pendentes;
      porPeriodo: Array<{ periodo: string; totais: TotaisDeCredito }>;
      origens: OrigemEmNotas[];
    };

function totaisDe(notas: readonly NotaDoBanco[]): TotaisDeCredito {
  const t = {} as TotaisDeCredito;
  for (const campo of CAMPOS_TOTAIS) t[campo] = texto(somarCampo(notas, campo));
  return t;
}

const aApropriarDe = (n: NotaDoBanco): Big | null => (n.valores["aApropriar"] === undefined ? null : Big(n.valores["aApropriar"]));

interface Classificada {
  chave: string;
  tipo: GrupoPendente["tipo"];
  grupo: string;
  documento?: "cnpj" | "cpf";
}

/** Grupo de uma nota com valor a apropriar: só a chave decide o emitente (CA-7). */
function classificar(n: NotaDoBanco, raiz: string, valor: Big): Classificada {
  if (valor.lt(0)) return { chave: n.chave, tipo: "negativos", grupo: "negativos" };
  const e = lerChave(n.chave, n.documento, raiz);
  if (e.tipo === "propria-empresa") return { chave: n.chave, tipo: "propria_empresa", grupo: "propria-empresa" };
  if (e.tipo === "nao-identificado" || e.numero === undefined) return { chave: n.chave, tipo: "nao_identificado", grupo: "nao-identificado" };
  return { chave: n.chave, tipo: "emitente", grupo: e.numero, documento: e.documento ?? "cnpj" };
}

/**
 * Todos os grupos de I-7, sem o corte de "demais": os emitentes em ordem do maior para o menor total (empate pelo
 * identificador) e depois os grupos especiais. Notas com valor a apropriar zero ou ausente não entram.
 */
export function agruparPendentes(notas: readonly NotaDoBanco[], raiz: string): { grupos: GrupoPendente[]; totalAApropriar: string; percentualNaoIdentificado: string | null } {
  const acumulado = new Map<string, { tipo: GrupoPendente["tipo"]; documento?: "cnpj" | "cpf"; quantidade: number; total: Big }>();
  let totalAApropriar = Big(0);
  for (const n of notas) {
    const valor = aApropriarDe(n);
    if (valor === null) continue;
    totalAApropriar = totalAApropriar.plus(valor);
    if (valor.eq(0)) continue;
    const c = classificar(n, raiz, valor);
    const atual = acumulado.get(c.grupo) ?? { tipo: c.tipo, documento: c.documento, quantidade: 0, total: Big(0) };
    atual.quantidade++;
    atual.total = atual.total.plus(valor);
    acumulado.set(c.grupo, atual);
  }
  const doGrupo = (grupo: string): GrupoPendente => {
    const g = acumulado.get(grupo);
    return { grupo, tipo: g?.tipo ?? "nao_identificado", quantidade: g?.quantidade ?? 0, total: texto(g?.total ?? Big(0)) };
  };
  const emitentes: GrupoPendente[] = [...acumulado.entries()]
    .filter(([, g]) => g.tipo === "emitente")
    .sort(([ga, a], [gb, b]) => b.total.cmp(a.total) || (ga < gb ? -1 : ga > gb ? 1 : 0))
    .map(([grupo, g]) => ({ grupo, tipo: "emitente" as const, documento: g.documento, quantidade: g.quantidade, total: texto(g.total) }));
  const grupos = [...emitentes];
  grupos.push({ ...doGrupo("nao-identificado"), tipo: "nao_identificado" });
  grupos.push({ ...doGrupo("propria-empresa"), tipo: "propria_empresa" });
  if (acumulado.has("negativos")) grupos.push({ ...doGrupo("negativos"), tipo: "negativos" });

  const naoIdentificado = acumulado.get("nao-identificado")?.total ?? Big(0);
  const percentual = totalAApropriar.gt(0) ? naoIdentificado.div(totalAApropriar).times(100).round(1, Big.roundHalfUp).toFixed(1) : null;
  return { grupos, totalAApropriar: texto(totalAApropriar), percentualNaoIdentificado: percentual };
}

function pendentesDe(notas: readonly NotaDoBanco[], raiz: string): Pendentes {
  const { grupos, percentualNaoIdentificado } = agruparPendentes(notas, raiz);
  const emitentes = grupos.filter((g) => g.tipo === "emitente");
  const especial = (tipo: GrupoPendente["tipo"]) => grupos.find((g) => g.tipo === tipo);
  const resumo = (g: GrupoPendente | undefined) => ({ quantidade: g?.quantidade ?? 0, total: g?.total ?? "0.00" });
  const resto = emitentes.slice(EMITENTES_NO_BLOCO);
  const negativos = especial("negativos");
  return {
    emitentes: emitentes.slice(0, EMITENTES_NO_BLOCO).map((g) => ({ grupo: g.grupo, documento: g.documento ?? "cnpj", quantidade: g.quantidade, total: g.total })),
    demais:
      resto.length === 0
        ? null
        : {
            emitentes: resto.length,
            quantidade: resto.reduce((t, g) => t + g.quantidade, 0),
            total: texto(resto.reduce((t, g) => t.plus(g.total), Big(0))),
          },
    naoIdentificado: resumo(especial("nao_identificado")),
    propriaEmpresa: resumo(especial("propria_empresa")),
    negativos: negativos ? resumo(negativos) : null,
    percentualNaoIdentificado,
  };
}

/** Notas de um grupo de pendentes no recorte, do maior para o menor valor a apropriar (empate pela chave). */
export function notasDoGrupo(notas: readonly NotaDoBanco[], raiz: string, recorte: string | null, grupo: string): NotaDoBanco[] {
  return noRecorte(notas, recorte)
    .filter((n) => {
      const valor = aApropriarDe(n);
      return valor !== null && !valor.eq(0) && classificar(n, raiz, valor).grupo === grupo;
    })
    .sort((a, b) => aApropriarDe(b)!.cmp(aApropriarDe(a)!) || (a.chave < b.chave ? -1 : a.chave > b.chave ? 1 : 0));
}

/** `recorte` é `AAAA-MM` ou nulo (todos os períodos coletados). */
export function indicadoresDeCredito(notas: readonly NotaDoBanco[], raizEmpresa: string, recorte: string | null): IndicadoresDeCredito {
  const doRecorte = noRecorte(notas, recorte);
  if (doRecorte.length === 0) return { semNotasNoRecorte: true };

  const outros = CAMPOS_OUTROS.map((campo) => ({ campo, valor: somarCampo(doRecorte, campo) }))
    .filter((o) => !o.valor.eq(0))
    .map((o) => ({ campo: o.campo, valor: texto(o.valor) }));

  const porPa = new Map<string, NotaDoBanco[]>();
  for (const n of doRecorte) porPa.set(n.pa, [...(porPa.get(n.pa) ?? []), n]);
  const porPeriodo = [...porPa.entries()]
    .sort(([a], [b]) => periodoOrdenavel(a).localeCompare(periodoOrdenavel(b)))
    .map(([pa, lista]) => ({ periodo: periodoIso(pa), totais: totaisDe(lista) }));

  return {
    semNotasNoRecorte: false,
    quantidadeNotas: doRecorte.length,
    quantidadeComAApropriar: doRecorte.filter((n) => aApropriarDe(n)?.gt(0)).length,
    totais: totaisDe(doRecorte),
    outros,
    pendentes: pendentesDe(doRecorte, raizEmpresa),
    porPeriodo,
    origens: origensDe(doRecorte),
  };
}
