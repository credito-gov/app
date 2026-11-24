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
}

export interface ResultadoPasta {
  /** Caminho absoluto da pasta. */
  pasta: string;
  legivel: boolean;
  erro?: string;
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
  const r = validador.validar(id.servico, await ler(caminho));
  if (r.situacao === "recusado") return { ...base, servico: id.servico, situacao: "recusado", motivos: r.motivos };

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
    nomes = (await readdir(absoluta)).filter((n) => n.endsWith(".json")).sort();
  } catch {
    return { pasta: absoluta, legivel: false, erro: `A pasta não pôde ser lida: ${absoluta}`, arquivos: [] };
  }

  const cache = opcoes.cache;
  const vistos = new Set<string>();
  const arquivos: ArquivoLido[] = [];
  for (const nome of nomes) {
    const caminho = join(absoluta, nome);
    let info;
    try {
      info = await stat(caminho);
    } catch {
      continue;
    }
    if (!info.isFile()) continue;
    vistos.add(nome);
    const guardado = cache?.get(nome);
    if (guardado && guardado.tamanho === info.size && guardado.mtimeMs === info.mtimeMs) {
      arquivos.push(guardado.arquivo);
      continue;
    }
    let arquivo: ArquivoLido;
    try {
      arquivo = await lerUm(nome, caminho, info.size, info.mtimeMs, opcoes);
    } catch {
      arquivo = {
        nome,
        servico: identificarArquivo(nome)?.servico ?? null,
        situacao: "recusado",
        motivos: ["o arquivo não pôde ser lido"],
        tamanho: info.size,
        mtimeMs: info.mtimeMs,
      };
    }
    cache?.set(nome, { tamanho: info.size, mtimeMs: info.mtimeMs, arquivo });
    arquivos.push(arquivo);
  }
  if (cache) for (const nome of [...cache.keys()]) if (!vistos.has(nome)) cache.delete(nome);
  return { pasta: absoluta, legivel: true, arquivos };
}
