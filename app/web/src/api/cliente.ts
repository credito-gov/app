// Cliente da API: fetch com o cabeçalho de proteção, credentials same-origin e
// erros tipados. A 033 usa este mesmo cliente.

export type Papel = "titular" | "contador" | "colaborador";

export type Empresa = {
  id: string;
  nome: string;
  cnpjRaiz: string;
  cnpjRaizFormatado: string;
  papel: Papel;
};

export type Usuario = { id: string; nome: string };

export type DadosSessao = { usuario: Usuario; empresas: Empresa[] };

export type CampoInvalido = { campo: string; mensagem: string };

export type Resultado<T> =
  | { tipo: "ok"; status: number; dados: T }
  | {
      tipo: "erro";
      status: number;
      codigo: string;
      mensagem: string;
      campos?: CampoInvalido[];
      regra?: string;
    }
  // fetch que lança erro de rede, ou 502, 503 e 504 do proxy (sem o corpo de erro da API).
  | { tipo: "sem_conexao" };

export type MotivoPerda = "expirada" | "sem_sessao";

type AoPerderSessao = (motivo: MotivoPerda) => void;

let aoPerderSessao: AoPerderSessao | null = null;

export function definirAoPerderSessao(tratador: AoPerderSessao | null): void {
  aoPerderSessao = tratador;
}

const METODOS_SEGUROS = new Set(["GET", "HEAD", "OPTIONS"]);

type Opcoes = {
  corpo?: unknown;
  // Rota que exige sessão: um 401 de sessão avisa o ProvedorSessao.
  logada?: boolean;
};

export async function requisitar<T = unknown>(
  metodo: string,
  caminho: string,
  opcoes: Opcoes = {},
): Promise<Resultado<T>> {
  const cabecalhos: Record<string, string> = {};
  if (!METODOS_SEGUROS.has(metodo.toUpperCase())) cabecalhos["X-CreditoGov-Requisicao"] = "1";
  const init: RequestInit = { method: metodo, credentials: "same-origin", headers: cabecalhos };
  if (opcoes.corpo !== undefined) {
    cabecalhos["Content-Type"] = "application/json";
    init.body = JSON.stringify(opcoes.corpo);
  }

  let resposta: Response;
  try {
    resposta = await fetch(caminho, init);
  } catch {
    return { tipo: "sem_conexao" };
  }
  let corpo: unknown = undefined;
  let ilegivel = false;
  try {
    const texto = await resposta.text();
    if (texto) corpo = JSON.parse(texto);
  } catch {
    corpo = undefined;
    ilegivel = true;
  }

  // 502, 503 e 504 sem o corpo de erro da API vêm do proxy (API parada): sem conexão. A API
  // também responde 502 (email_nao_enviado), e esse segue como erro tipado.
  if (
    (resposta.status === 502 || resposta.status === 503 || resposta.status === 504) &&
    typeof (corpo as { erro?: unknown } | undefined)?.erro !== "string"
  ) {
    return { tipo: "sem_conexao" };
  }

  if (resposta.ok) {
    // Resposta de sucesso que não é JSON (página de erro de proxy, por exemplo) não é sucesso.
    if (ilegivel && resposta.status !== 204) {
      return { tipo: "erro", status: resposta.status, codigo: "resposta_invalida", mensagem: "" };
    }
    return { tipo: "ok", status: resposta.status, dados: corpo as T };
  }

  const erro = (corpo ?? {}) as Record<string, unknown>;
  const codigo = typeof erro.erro === "string" ? erro.erro : "erro_desconhecido";
  if (opcoes.logada && resposta.status === 401) {
    if (codigo === "sessao_expirada") aoPerderSessao?.("expirada");
    else if (codigo === "sem_sessao") aoPerderSessao?.("sem_sessao");
  }
  return {
    tipo: "erro",
    status: resposta.status,
    codigo,
    mensagem: typeof erro.mensagem === "string" ? erro.mensagem : "",
    campos: Array.isArray(erro.campos) ? (erro.campos as CampoInvalido[]) : undefined,
    regra: typeof erro.regra === "string" ? erro.regra : undefined,
  };
}
