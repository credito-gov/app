import { parseArgs } from "node:util";
import { acompanhar } from "./acompanhamento.js";
import { criarClienteApi } from "./api.js";
import { abrirGuardado, guardar } from "./armazenamento.js";
import { ErroConfig, lerConfig } from "./config.js";
import { ErroApi, ErroUso } from "./erros.js";
import { resumirCreditos } from "./leitores/creditos.js";
import { resumirRecolhimentos } from "./leitores/recolhimentos.js";
import { criarRedator } from "./redacao.js";
import { criarRegistro } from "./registro.js";
import type { Relogio } from "./relogio.js";
import { cabecalhoDe, linhasDasDivergencias, linhasDoResumo, type Resumo } from "./saida.js";
import { buscarServico, NOMES_SERVICOS, type NomeServico } from "./servicos.js";
import type { Dormir, Saida } from "./tipos.js";
import { criarClienteToken } from "./token.js";
import { criarValidador } from "./validacao.js";

export interface DepsCli {
  env: Record<string, string | undefined>;
  fetch: typeof fetch;
  relogio: Relogio;
  dormir: Dormir;
  saida: Saida;
  pastaLocal: string;
}

const TIQUETE_VALIDO = /^[A-Za-z0-9._-]{1,200}$/;

type Leitor = (dados: unknown) => Resumo;

/** Leitor de cada consulta. Consulta sem leitor ainda não pode chamar a API. */
const LEITORES: Partial<Record<NomeServico, Leitor>> = {
  creditos: resumirCreditos,
  recolhimentos: resumirRecolhimentos,
};

const USO = [
  "Uso:",
  `  npm run consulta -- <${NOMES_SERVICOS.join("|")}> [--tiquete <tiquete>]`,
  "  npm run ler -- <arquivo guardado em .local/arquivos>",
  "Cada execução faz uma só consulta. Não existe opção que dispare todas.",
];

function escolherServico(positionals: string[]): NomeServico {
  if (positionals.length !== 1) {
    throw new ErroUso(
      positionals.length === 0
        ? "Informe a consulta a fazer."
        : "Informe uma só consulta por execução.",
    );
  }
  const servico = buscarServico(positionals[0]);
  if (!servico) throw new ErroUso(`Consulta desconhecida: ${positionals[0]}.`);
  return servico.nome;
}

function exigirLeitor(servico: NomeServico): Leitor {
  const leitor = LEITORES[servico];
  if (!leitor) throw new ErroUso(`A consulta ${servico} ainda não tem leitor nesta versão; nenhuma chamada foi feita.`);
  return leitor;
}

/** Valida o arquivo e, se estiver certo, imprime o resumo. Devolve o código de saída. */
function validarEResumir(servico: NomeServico, bytes: Uint8Array, caminho: string, saida: Saida): number {
  const resultado = criarValidador().validar(servico, bytes);
  if (!resultado.valido) {
    for (const linha of linhasDasDivergencias(caminho, resultado.total, resultado.divergencias)) saida.escrever(linha);
    return 3;
  }
  const resumo = exigirLeitor(servico)(resultado.dados);
  saida.escrever("");
  for (const linha of linhasDoResumo(cabecalhoDe(servico, resultado.dados, caminho), resumo)) saida.escrever(linha);
  return 0;
}

async function consulta(args: string[], deps: DepsCli, redator: ReturnType<typeof criarRedator>): Promise<number> {
  let parsed;
  try {
    parsed = parseArgs({ args, options: { tiquete: { type: "string" } }, allowPositionals: true, strict: true });
  } catch (e) {
    throw new ErroUso(`Argumentos inválidos: ${e instanceof Error ? e.message : "erro de leitura"}.`);
  }
  const servico = escolherServico(parsed.positionals);
  exigirLeitor(servico);
  const tiquetePedido = parsed.values.tiquete;
  if (tiquetePedido !== undefined && !TIQUETE_VALIDO.test(tiquetePedido)) {
    throw new ErroUso("Tíquete inválido: use só letras, números, ponto, hífen e sublinhado (1 a 200 caracteres).");
  }

  const config = lerConfig(deps.env);
  redator.registrar(config.clientId);
  redator.registrar(config.clientSecret);

  const { saida, relogio, pastaLocal } = deps;
  const registro = criarRegistro({ pastaLocal, relogio });
  const token = criarClienteToken({ config, fetch: deps.fetch, relogio, registro, pastaLocal, saida, redator, servico });
  const cadastro = buscarServico(servico);
  if (!cadastro) throw new ErroUso(`Consulta desconhecida: ${servico}.`);
  const api = criarClienteApi({ config, fetch: deps.fetch, token, registro, relogio, redator, servico: cadastro });

  let tiquete: string;
  let teaSegundos: number | undefined;
  if (tiquetePedido === undefined) {
    const n = registro.contarAberturas(servico, relogio.agora());
    saida.escrever(
      `Aberturas de ${servico} registradas hoje: ${n.total} (${n.aceitas} aceitas). Limite documentado: 4 por API e por credencial (FAQ: por dia).`,
    );
    const aberta = await api.abrir();
    tiquete = aberta.tiquete;
    teaSegundos = aberta.teaSegundos;
  } else {
    tiquete = tiquetePedido;
  }

  await acompanhar({ servico, tiquete, teaSegundos, config, api, registro, relogio, dormir: deps.dormir, saida, redator });

  const link = await api.linkDownload(tiquete);
  const bytes = await api.baixarArquivo(link.urlAssinada, tiquete, link.expiraEm);
  const caminho = guardar({ pastaLocal, servico, tiquete, bytes, agora: relogio.agora() });
  saida.escrever(`Arquivo guardado: ${caminho}`);
  return validarEResumir(servico, bytes, caminho, saida);
}

function ler(args: string[], deps: DepsCli): number {
  let parsed;
  try {
    parsed = parseArgs({ args, options: {}, allowPositionals: true, strict: true });
  } catch (e) {
    throw new ErroUso(`Argumentos inválidos: ${e instanceof Error ? e.message : "erro de leitura"}.`);
  }
  if (parsed.positionals.length !== 1) throw new ErroUso("Informe o caminho de um arquivo guardado.");
  const guardado = abrirGuardado(parsed.positionals[0]);
  exigirLeitor(guardado.servico);
  return validarEResumir(guardado.servico, guardado.bytes, guardado.caminho, deps.saida);
}

/** Executa o comando e devolve o código de saída (0 sucesso, 1 API/rede, 2 uso, 3 arquivo inválido). */
export async function executar(argv: string[], deps: DepsCli): Promise<number> {
  const redator = criarRedator();
  const [comando, ...resto] = argv;
  try {
    if (comando === "consulta") return await consulta(resto, deps, redator);
    if (comando === "ler") return ler(resto, deps);
    throw new ErroUso(comando === undefined ? "Informe o comando." : `Comando desconhecido: ${comando}.`);
  } catch (e) {
    if (e instanceof ErroUso) {
      deps.saida.escrever(redator.redigir(e.message));
      for (const linha of USO) deps.saida.escrever(linha);
      return e.codigoSaida;
    }
    if (e instanceof ErroConfig) {
      deps.saida.escrever(redator.redigir(e.message));
      return 2;
    }
    if (e instanceof ErroApi) {
      deps.saida.escrever(e.message);
      return e.codigoSaida;
    }
    deps.saida.escrever(redator.redigir(`Erro inesperado: ${e instanceof Error ? e.message : "falha desconhecida"}`));
    return 1;
  }
}
