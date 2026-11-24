import { readFileSync } from "node:fs";
import { Ajv2020 } from "ajv/dist/2020.js";
import formatosModulo, { type FormatsPlugin } from "ajv-formats";
import { isLosslessNumber, parse as parseLossless } from "lossless-json";
import { lerSemPerda } from "./json.js";
import { buscarServico, type NomeServico } from "./servicos.js";

// ajv-formats e CommonJS: no ESM do Node o plugin util vem em .default.
const adicionarFormatos = ((formatosModulo as unknown as { default?: FormatsPlugin }).default ?? formatosModulo) as unknown as FormatsPlugin;

export interface Divergencia {
  caminho: string;
  mensagem: string;
}

export type ResultadoValidacao =
  | { valido: true; dados: unknown }
  | { valido: false; total: number; divergencias: Divergencia[] };

export interface Validador {
  validar(servico: NomeServico, bytes: Uint8Array): ResultadoValidacao;
}

const MAXIMO_LISTADO = 20;
/** Campos inteiros do schema; os demais números são valores monetários. */
const CAMPOS_INTEIROS = new Set(["origem", "documento", "tipo", "sequencial"]);

/** Checagem exata no texto original: no máximo duas casas decimais e sem notação exponencial. */
function checarNumeros(valor: unknown, caminho: string, chave: string, saida: Divergencia[]): void {
  if (isLosslessNumber(valor)) {
    const texto = valor.value;
    if (/[eE]/.test(texto)) {
      saida.push({ caminho, mensagem: "número em notação exponencial; esperado decimal com até duas casas" });
    } else if (!CAMPOS_INTEIROS.has(chave)) {
      const decimais = texto.split(".")[1];
      if (decimais !== undefined && decimais.length > 2) {
        saida.push({ caminho, mensagem: "valor monetário com mais de duas casas decimais" });
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

export function criarValidador(): Validador {
  const ajv = new Ajv2020({ allErrors: true, multipleOfPrecision: 4 });
  adicionarFormatos(ajv);

  const validadores = new Map<NomeServico, ReturnType<typeof ajv.compile>>();
  const doServico = (nome: NomeServico) => {
    let v = validadores.get(nome);
    if (!v) {
      const servico = buscarServico(nome);
      if (!servico) throw new Error(`serviço desconhecido: ${nome}`);
      const schema = JSON.parse(readFileSync(new URL(`../schemas/oficiais/${servico.schema}`, import.meta.url), "utf8")) as object;
      v = ajv.compile(schema);
      validadores.set(nome, v);
    }
    return v;
  };

  return {
    validar(servico, bytes) {
      // O BOM inicial é removido pelo TextDecoder, só para a leitura.
      const texto = new TextDecoder("utf-8").decode(bytes);
      let objeto: unknown;
      try {
        objeto = JSON.parse(texto);
      } catch {
        return { valido: false, total: 1, divergencias: [{ caminho: "", mensagem: "JSON inválido: o arquivo não pôde ser lido" }] };
      }

      const todas: Divergencia[] = [];
      const validar = doServico(servico);
      if (!validar(objeto)) {
        for (const e of validar.errors ?? []) todas.push({ caminho: e.instancePath, mensagem: e.message ?? "divergência do schema" });
      }
      checarNumeros(parseLossless(texto), "", "", todas);

      if (todas.length > 0) {
        return { valido: false, total: todas.length, divergencias: todas.slice(0, MAXIMO_LISTADO) };
      }
      return { valido: true, dados: lerSemPerda(texto) };
    },
  };
}
