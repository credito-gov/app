// Leitura dos retornos da Receita (AD-8, AD-14; demanda 033). `interpretarRetorno` é pura:
// valida o conteúdo e devolve a situação, o motivo e as notas. `registrarLeitura` grava o resultado
// dentro de uma transação com a empresa fixada. O coletor, quando existir, chama a mesma função.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { Trx } from "../banco/transacao.js";
import type { MotivoRecusa } from "../banco/esquema.js";
import { raizDe } from "./empresa.js";
import { criarValidador, MOTIVO_ILEGIVEL, type ServicoValidavel, type Validador } from "./validacao.js";

/** Versão do leitor, gravada em cada arquivo (AD-8). */
export const VERSAO_LEITOR = "033.1";

export type ServicoLido = "creditos" | "debitos";
export type SituacaoLeitura = "aceito" | "aceito_com_divergencia" | "recusado";

/** Uma nota (crédito ou débito) como veio: valores em texto decimal, só os campos presentes. */
export interface NotaInterpretada {
  pa: string;
  chave: string;
  documento: number;
  origem: number;
  emissao: string;
  registro: string;
  atualizacao: string;
  valores: Record<string, string>;
}

export interface Interpretacao {
  situacao: SituacaoLeitura;
  motivo?: MotivoRecusa;
  /** `geradoEm` como veio; nulo se o conteúdo não foi lido até aí. */
  geradoEm: string | null;
  versaoSchema: string | null;
  notas: NotaInterpretada[];
}

/** Campo de valor, caminho dentro de `cbs` e coluna do banco. */
const CAMPOS: Record<ServicoLido, ReadonlyArray<readonly [string, string[]]>> = {
  creditos: [
    ["apurado", ["apurado"]],
    ["excedente", ["excedente"]],
    ["aApropriar", ["apropriacao", "aApropriar"]],
    ["apropriado", ["apropriacao", "apropriado"]],
    ["suspenso", ["apropriacao", "suspenso"]],
    ["inapropriavel", ["apropriacao", "inapropriavel"]],
    ["prescrito", ["apropriacao", "prescrito"]],
    ["inutilizavel", ["apropriacao", "utilizacao", "inutilizavel"]],
    ["utilizado", ["apropriacao", "utilizacao", "utilizado"]],
    ["restabelecido", ["apropriacao", "utilizacao", "restabelecido"]],
    ["saldoCredor", ["apropriacao", "utilizacao", "naoUtilizado", "saldoCredor"]],
    ["pedidoRessarcimento", ["apropriacao", "utilizacao", "naoUtilizado", "pedidoRessarcimento"]],
  ],
  debitos: [
    ["apurado", ["apurado"]],
    ["excedente", ["excedente"]],
    ["inexigivel", ["inexigivel"]],
    ["suspenso", ["suspenso"]],
    ["pgtoAntecipado", ["pgtoAntecipado"]],
    ["extinto", ["extinto"]],
    ["saldoDevedor", ["saldoDevedor"]],
  ],
};

const snake = (campo: string): string => campo.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

const ARQUIVO_VERSAO: Record<ServicoLido, string> = {
  creditos: "credito-retorno.schema.json",
  debitos: "debito-retorno.schema.json",
};

let versoes: Record<string, { versaoSchema?: string }> | undefined;
function versaoDoSchema(servico: ServicoLido): string | null {
  versoes ??= JSON.parse(readFileSync(new URL("../../schemas/oficiais/versoes.json", import.meta.url), "utf8"));
  return versoes?.[ARQUIVO_VERSAO[servico]]?.versaoSchema ?? null;
}

let validadorPadrao: Validador | undefined;

interface Objeto {
  [chave: string]: unknown;
}

function lerNotas(servico: ServicoLido, dados: Objeto): NotaInterpretada[] {
  const lista = servico === "creditos" ? "creditos" : "debitos";
  const notas: NotaInterpretada[] = [];
  for (const bloco of (dados["apuracao"] as Objeto[] | undefined) ?? []) {
    for (const item of (bloco[lista] as Objeto[] | undefined) ?? []) {
      const valores: Record<string, string> = {};
      for (const [campo, caminho] of CAMPOS[servico]) {
        let atual: unknown = item["cbs"];
        for (const parte of caminho) atual = (atual as Objeto | undefined)?.[parte];
        if (typeof atual === "string") valores[campo] = atual;
      }
      notas.push({
        pa: bloco["pa"] as string,
        chave: item["chave"] as string,
        documento: Number(item["documento"]),
        origem: Number(item["origem"]),
        emissao: item["emissao"] as string,
        registro: item["registro"] as string,
        atualizacao: item["atualizacao"] as string,
        valores,
      });
    }
  }
  return notas;
}

/** Parte pura da leitura: sem banco, sem rede, sem log. */
export function interpretarRetorno(conteudo: Uint8Array, servico: ServicoLido, cnpjRaiz: string): Interpretacao {
  validadorPadrao ??= criarValidador();
  const r = validadorPadrao.validar(servico as ServicoValidavel, conteudo);
  const recusa = (motivo: MotivoRecusa, geradoEm: string | null): Interpretacao => ({
    situacao: "recusado",
    motivo,
    geradoEm,
    versaoSchema: motivo === "ilegivel" ? null : versaoDoSchema(servico),
    notas: [],
  });

  if (r.situacao === "recusado") {
    if (r.motivos[0] === MOTIVO_ILEGIVEL) return recusa("ilegivel", null);
    return recusa(r.foraDoLimite ? "valor_fora_do_limite" : "fora_do_schema", null);
  }
  const dados = r.dados as Objeto;
  const geradoEm = typeof dados["geradoEm"] === "string" ? dados["geradoEm"] : null;
  const ni = typeof dados["ni"] === "string" ? dados["ni"] : "";
  if (raizDe(ni) !== cnpjRaiz) return recusa("outra_empresa", geradoEm);
  return {
    situacao: r.situacao === "aceito" ? "aceito" : "aceito_com_divergencia",
    geradoEm,
    versaoSchema: versaoDoSchema(servico),
    notas: lerNotas(servico, dados),
  };
}

export interface LogLeitura {
  info(objeto: object, mensagem?: string): void;
}

export interface DadosLeitura {
  consultaId: string;
  servico: ServicoLido;
  conteudo: Uint8Array;
  recebidoEm: Date;
  /** Endereço no armazenamento de objetos (AD-8), a partir do coletor. */
  objeto?: string;
  /** Só recebe consultaId, situação, motivo e quantidade. Nunca valor, chave, CNPJ ou trecho do conteúdo. */
  log?: LogLeitura;
}

export interface ResultadoLeitura {
  arquivoId: string;
  situacao: SituacaoLeitura;
  motivo?: MotivoRecusa;
  notas: number;
}

const LOTE = 500;

/** Valida e grava o retorno de uma consulta da empresa fixada na transação. Não muda o estado da consulta. */
export async function registrarLeitura(tx: Trx, dados: DadosLeitura): Promise<ResultadoLeitura> {
  const { consultaId, servico, conteudo, recebidoEm } = dados;
  const consulta = await tx
    .selectFrom("consulta")
    .innerJoin("empresa", "empresa.id", "consulta.empresa_id")
    .select(["consulta.empresa_id as empresaId", "empresa.cnpj_raiz as cnpjRaiz"])
    .where("consulta.id", "=", consultaId)
    .where("consulta.servico", "=", servico)
    .executeTakeFirst();
  if (!consulta) throw new Error("Consulta não encontrada para a empresa fixada.");

  const sha256 = createHash("sha256").update(conteudo).digest("hex");
  const r = interpretarRetorno(conteudo, servico, consulta.cnpjRaiz);

  const arquivo = await tx
    .insertInto("arquivo_bruto")
    .values({
      empresa_id: consulta.empresaId,
      consulta_id: consultaId,
      servico,
      recebido_em: recebidoEm,
      tamanho: conteudo.length,
      sha256,
      gerado_em: r.geradoEm,
      versao_schema: r.versaoSchema,
      situacao: r.situacao,
      motivo_recusa: r.motivo ?? null,
      versao_leitor: VERSAO_LEITOR,
      objeto: dados.objeto ?? null,
    })
    .returning("id")
    .executeTakeFirstOrThrow();

  const tabela = servico === "creditos" ? "credito_lido" : "debito_lido";
  for (let i = 0; i < r.notas.length; i += LOTE) {
    const linhas = r.notas.slice(i, i + LOTE).map((nota) => {
      const linha: Record<string, unknown> = {
        empresa_id: consulta.empresaId,
        arquivo_id: arquivo.id,
        pa: nota.pa,
        chave: nota.chave,
        documento: nota.documento,
        origem: nota.origem,
        emissao: nota.emissao,
        registro: nota.registro,
        atualizacao: nota.atualizacao,
      };
      for (const [campo, valor] of Object.entries(nota.valores)) linha[snake(campo)] = valor;
      return linha;
    });
    await tx.insertInto(tabela).values(linhas as never).execute();
  }

  dados.log?.info(
    { evento: "leitura_registrada", consultaId, situacao: r.situacao, motivo: r.motivo ?? null, notas: r.notas.length },
    "leitura_registrada",
  );
  return {
    arquivoId: arquivo.id,
    situacao: r.situacao,
    ...(r.motivo ? { motivo: r.motivo } : {}),
    notas: r.notas.length,
  };
}
