// Lista a pasta, identifica o serviço pelo nome e valida cada arquivo. Só usa readdir, stat e readFile (CA-A3).
import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { criarValidador, type ServicoValidavel, type SituacaoValidacao, type Validador } from "./validacao.js";

export type Servico = ServicoValidavel | "pagamentos";
export type SituacaoArquivo = SituacaoValidacao | "ignorado";

export interface ArquivoLido {
  nome: string;
  servico: Servico | null;
  situacao: SituacaoArquivo;
  motivos: string[];
  geradoEm?: string;
  /** Raiz do CNPJ: os 8 primeiros dígitos de `ni`. */
  raiz?: string;
  /** Créditos, débitos ou itens de recolhimento no arquivo. */
  quantidade?: number;
  /** Conteúdo validado, com os números como texto original (só em arquivo aceito). */
  dados?: unknown;
  tamanho: number;
  mtimeMs: number;
  /** Falha de leitura (E/S) que pode passar: o resultado não vai para o cache nem para a memória da visão. */
  transitorio?: boolean;
}

export interface ResultadoPasta {
  /** Caminho absoluto da pasta. */
  pasta: string;
  legivel: boolean;
  erro?: string;
  /** Código do erro do sistema ao listar a pasta (ENOENT, EACCES...). */
  codigoErro?: string;
  arquivos: ArquivoLido[];
}

interface EntradaCache {
  tamanho: number;
  mtimeMs: number;
  arquivo: ArquivoLido;
}

export type CachePasta = Map<string, EntradaCache>;

export function criarCache(): CachePasta {
  return new Map();
}

export interface OpcoesLeitura {
  cache?: CachePasta;
  validador?: Validador;
  lerArquivo?: (caminho: string) => Promise<Uint8Array>;
  estatistica?: (caminho: string) => Promise<{ isFile(): boolean; size: number; mtimeMs: number }>;
}

const CODIGO_DE_SISTEMA = /^E[A-Z0-9]+$/;

/** Código do erro de E/S (EBUSY, EPERM...); null para qualquer outro erro, que não é do arquivo. */
function codigoDeSistema(e: unknown): string | null {
  if (!(e instanceof Error)) return null;
  const codigo = (e as { code?: unknown }).code;
  return typeof codigo === "string" && CODIGO_DE_SISTEMA.test(codigo) ? codigo : null;
}

const PADRAO_NOME = /^\d{8}T\d{6}Z_(creditos|recolhimentos|pagamentos|debitos)_(.+?)(?:_(\d+))?\.json$/;

/** Serviço e tíquete a partir do nome no padrão da apuracao-cbs; null se o nome não segue o padrão. */
export function identificarArquivo(nome: string): { servico: Servico; tiquete: string } | null {
  const m = PADRAO_NOME.exec(nome);
  return m ? { servico: m[1] as Servico, tiquete: m[2] } : null;
}

interface Objeto {
  [chave: string]: unknown;
}

function contarItens(servico: ServicoValidavel, dados: Objeto): number {
  const apuracao = (dados.apuracao as Objeto[] | undefined) ?? [];
  let total = 0;
  for (const bloco of apuracao) {
    if (servico === "creditos") total += ((bloco.creditos as unknown[] | undefined) ?? []).length;
    else if (servico === "debitos") total += ((bloco.debitos as unknown[] | undefined) ?? []).length;
    else {
      for (const pagamento of (bloco.pagamentos as Objeto[] | undefined) ?? []) total += ((pagamento.composicao as unknown[] | undefined) ?? []).length;
    }
  }
  return total;
}

let validadorPadrao: Validador | undefined;

async function lerUm(nome: string, caminho: string, tamanho: number, mtimeMs: number, opcoes: OpcoesLeitura): Promise<ArquivoLido> {
  const base = { nome, tamanho, mtimeMs };
  const id = identificarArquivo(nome);
  if (!id) return { ...base, servico: null, situacao: "ignorado", motivos: ["nome fora do padrão da apuracao-cbs"] };
  if (id.servico === "pagamentos") return { ...base, servico: "pagamentos", situacao: "ignorado", motivos: ["serviço não usado pelo painel"] };

  const validador = opcoes.validador ?? (validadorPadrao ??= criarValidador());
  const ler = opcoes.lerArquivo ?? (async (c: string) => new Uint8Array(await readFile(c)));
  let conteudo: Uint8Array;
  try {
    conteudo = await ler(caminho);
  } catch (e) {
    const codigo = codigoDeSistema(e);
    if (codigo === null) throw e;
    return { ...base, servico: id.servico, situacao: "recusado", motivos: [`o arquivo não pôde ser lido (${codigo})`], transitorio: true };
  }
  // Só a leitura é de E/S: um erro daqui para baixo é defeito do painel e propaga.
  const r = validador.validar(id.servico, conteudo);
  if (r.situacao === "recusado") {
    const motivos = [...r.motivos];
    const restantes = (r.total ?? motivos.length) - motivos.length;
    if (restantes > 0) motivos.push(`e mais ${restantes} ${restantes === 1 ? "divergência" : "divergências"}`);
    return { ...base, servico: id.servico, situacao: "recusado", motivos };
  }

  const dados = r.dados as Objeto;
  const ni = typeof dados.ni === "string" ? dados.ni : "";
  return {
    ...base,
    servico: id.servico,
    situacao: r.situacao,
    motivos: r.motivos,
    geradoEm: typeof dados.geradoEm === "string" ? dados.geradoEm : undefined,
    raiz: ni.slice(0, 8),
    quantidade: contarItens(id.servico, dados),
    dados,
  };
}

/** Lê a pasta. Arquivo igual (nome, tamanho e data de modificação) vem do cache, sem ser relido. */
export async function lerPasta(pasta: string, opcoes: OpcoesLeitura = {}): Promise<ResultadoPasta> {
  const absoluta = resolve(pasta);
  let nomes: string[];
  try {
    nomes = (await readdir(absoluta)).filter((n) => /\.json$/i.test(n)).sort();
  } catch (e) {
    const codigo = codigoDeSistema(e);
    if (codigo === null) throw e;
    return { pasta: absoluta, legivel: false, erro: `A pasta não pôde ser lida (${codigo}): ${absoluta}`, codigoErro: codigo, arquivos: [] };
  }

  const cache = opcoes.cache;
  const estatistica = opcoes.estatistica ?? stat;
  const vistos = new Set<string>();
  const arquivos: ArquivoLido[] = [];
  for (const nome of nomes) {
    const caminho = join(absoluta, nome);
    const recusa = (motivo: string, tamanho: number, mtimeMs: number, transitorio: boolean): ArquivoLido => ({
      nome,
      servico: identificarArquivo(nome)?.servico ?? null,
      situacao: "recusado",
      motivos: [motivo],
      tamanho,
      mtimeMs,
      ...(transitorio ? { transitorio } : {}),
    });
    let info;
    try {
      info = await estatistica(caminho);
    } catch (e) {
      const codigo = codigoDeSistema(e);
      if (codigo === null) throw e;
      arquivos.push(recusa(`não foi possível obter as informações do arquivo (${codigo})`, 0, 0, true));
      continue;
    }
    if (!info.isFile()) {
      arquivos.push(recusa("a entrada não é um arquivo", info.size, info.mtimeMs, false));
      continue;
    }
    vistos.add(nome);
    const guardado = cache?.get(nome);
    if (guardado && guardado.tamanho === info.size && guardado.mtimeMs === info.mtimeMs) {
      arquivos.push(guardado.arquivo);
      continue;
    }
    const arquivo = await lerUm(nome, caminho, info.size, info.mtimeMs, opcoes);
    if (!arquivo.transitorio) cache?.set(nome, { tamanho: info.size, mtimeMs: info.mtimeMs, arquivo });
    arquivos.push(arquivo);
  }
  if (cache) for (const nome of [...cache.keys()]) if (!vistos.has(nome)) cache.delete(nome);
  return { pasta: absoluta, legivel: true, arquivos };
}
