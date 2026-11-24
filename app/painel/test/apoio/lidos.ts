// Monta ArquivoLido a partir de objetos fictícios, sem passar pela pasta (os testes de arquivos.ts cobrem a pasta).
import type { ArquivoLido, Servico, SituacaoArquivo } from "../../src/nucleo/arquivos.js";
import { lerSemPerda } from "../../src/nucleo/json.js";
import { serializar } from "./construtores.js";

export function lido(nome: string, servico: Servico, objeto: unknown, situacao: SituacaoArquivo = "aceito"): ArquivoLido {
  const dados = lerSemPerda(serializar(objeto)) as { ni: string; geradoEm: string };
  return {
    nome,
    servico,
    situacao,
    motivos: [],
    geradoEm: dados.geradoEm,
    raiz: dados.ni.slice(0, 8),
    quantidade: 0,
    dados,
    tamanho: 0,
    mtimeMs: 0,
  };
}
