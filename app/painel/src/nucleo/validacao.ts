// Lógica copiada de app/apuracao-cbs/src/validacao.ts (commit c3d8c56, DT-2): ajv 2020-12 sobre as cópias dos
// schemas oficiais e checagem, no texto original, de no máximo duas casas e sem notação exponencial.
// Acrescenta a tolerância do `ni` (D-2) como filtro sobre os erros, sem tocar no schema.
import { readFileSync } from "node:fs";
import { Ajv2020 } from "ajv/dist/2020.js";
import formatosModulo, { type FormatsPlugin } from "ajv-formats";
import { isLosslessNumber, parse as parseLossless } from "lossless-json";
import { analisarData } from "./datas.js";
import { lerSemPerda } from "./json.js";

// ajv-formats é CommonJS: no ESM do Node o plugin útil vem em .default.
const adicionarFormatos = ((formatosModulo as unknown as { default?: FormatsPlugin }).default ?? formatosModulo) as unknown as FormatsPlugin;

export type ServicoValidavel = "creditos" | "recolhimentos" | "debitos";

const ARQUIVO_SCHEMA: Readonly<Record<ServicoValidavel, string>> = {
  creditos: "credito-retorno.schema.json",
  recolhimentos: "recolhimento-retorno.schema.json",
  debitos: "debito-retorno.schema.json",
};

/** Texto da divergência tolerada (D-2). */
export const MOTIVO_NI = "ni com 14 dígitos (o schema exige 8)";

export type SituacaoValidacao = "aceito" | "aceito-com-divergencia" | "recusado";

export interface ResultadoValidacao {
  situacao: SituacaoValidacao;
  /** Vazio se aceito; o texto da divergência tolerada; ou até 20 divergências se recusado. */
  motivos: string[];
  /** Total de divergências encontradas (só quando recusado). */
  total?: number;
  /** Conteúdo com os números como texto original (só quando aceito). */
  dados?: unknown;
}

export interface Validador {
  validar(servico: ServicoValidavel, bytes: Uint8Array): ResultadoValidacao;
}

const MAXIMO_LISTADO = 20;
/** Campos inteiros do schema; os demais números são valores monetários. */
const CAMPOS_INTEIROS = new Set(["origem", "documento", "tipo", "sequencial"]);

/** Checagem exata no texto original: no máximo duas casas decimais e sem notação exponencial. */
function checarNumeros(valor: unknown, caminho: string, chave: string, saida: string[]): void {
  if (isLosslessNumber(valor)) {
    const texto = valor.value;
    if (/[eE]/.test(texto)) {
      saida.push(`${caminho}: número em notação exponencial; esperado decimal com até duas casas`);
    } else if (!CAMPOS_INTEIROS.has(chave)) {
      const decimais = texto.split(".")[1];
      if (decimais !== undefined && decimais.length > 2) {
        saida.push(`${caminho}: valor monetário com mais de duas casas decimais`);
      }
    }
    return;
  }
  if (Array.isArray(valor)) {
    valor.forEach((item, i) => checarNumeros(item, `${caminho}/${i}`, chave, saida));
  } else if (valor !== null && typeof valor === "object") {
    for (const [k, v] of Object.entries(valor)) checarNumeros(v, `${caminho}/${k}`, k, saida);
  }
}

/** Campos de data e hora que o painel compara e exibe (o schema só confere o formato `date-time`). */
const CAMPOS_DATA_HORA = new Set(["geradoEm", "atualizacao", "emissao", "registro"]);

/** O schema aceita formas de data-hora que o painel não lê (fuso sem dois-pontos, t e z minúsculos, espaço no lugar do T...). */
function checarDatas(valor: unknown, caminho: string, chave: string, saida: string[]): void {
  if (typeof valor === "string") {
    if (CAMPOS_DATA_HORA.has(chave) && analisarData(valor) === null) {
      saida.push(`${caminho}: data que o painel não consegue ler (esperado aaaa-mm-ddThh:mm:ss, com fração opcional de até 9 dígitos, e Z ou ±hh:mm)`);
    }
    return;
  }
  if (Array.isArray(valor)) {
    valor.forEach((item, i) => checarDatas(item, `${caminho}/${i}`, chave, saida));
  } else if (valor !== null && typeof valor === "object") {
    for (const [k, v] of Object.entries(valor)) checarDatas(v, `${caminho}/${k}`, k, saida);
  }
}

export function criarValidador(): Validador {
  const ajv = new Ajv2020({ allErrors: true, multipleOfPrecision: 4 });
  adicionarFormatos(ajv);

  const validadores = new Map<ServicoValidavel, ReturnType<typeof ajv.compile>>();
  const doServico = (nome: ServicoValidavel) => {
    let v = validadores.get(nome);
    if (!v) {
      const schema = JSON.parse(readFileSync(new URL(`../../schemas/oficiais/${ARQUIVO_SCHEMA[nome]}`, import.meta.url), "utf8")) as object;
      v = ajv.compile(schema);
      validadores.set(nome, v);
    }
    return v;
  };

  return {
    validar(servico, bytes) {
      // O BOM inicial é removido pelo TextDecoder.
      const texto = new TextDecoder("utf-8").decode(bytes);
      let objeto: unknown;
      try {
        objeto = JSON.parse(texto);
      } catch {
        return { situacao: "recusado", motivos: ["JSON inválido: o arquivo não pôde ser lido"], total: 1 };
      }

      const validar = doServico(servico);
      const erros = validar(objeto) ? [] : (validar.errors ?? []);
      const ni = (objeto as { ni?: unknown } | null)?.ni;
      // Tolerância (D-2): só `ni`, só a regra `pattern`, só 14 dígitos.
      const tolerado = (e: { instancePath: string; keyword: string }) =>
        e.instancePath === "/ni" && e.keyword === "pattern" && typeof ni === "string" && /^\d{14}$/.test(ni);
      const naoTolerados = erros.filter((e) => !tolerado(e));
      const divergencias: string[] = naoTolerados.map((e) => `${e.instancePath || "/"}: ${e.message ?? "divergência do schema"}`);
      checarNumeros(parseLossless(texto), "", "", divergencias);
      checarDatas(objeto, "", "", divergencias);

      if (divergencias.length > 0) {
        return { situacao: "recusado", motivos: divergencias.slice(0, MAXIMO_LISTADO), total: divergencias.length };
      }
      const dados = lerSemPerda(texto);
      return erros.length > 0 ? { situacao: "aceito-com-divergencia", motivos: [MOTIVO_NI], dados } : { situacao: "aceito", motivos: [], dados };
    },
  };
}
