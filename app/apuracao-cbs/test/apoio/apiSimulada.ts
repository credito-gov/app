// API simulada por roteiro: cada rota tem uma fila de respostas, consumidas na ordem.
// Registra cada pedido feito, para as asserções. Nenhuma rede é usada.

export interface RespostaSimulada {
  status?: number;
  /** Objeto vira JSON; texto é enviado como está. */
  corpo?: unknown;
  /** Bytes brutos (arquivo baixado). Têm precedência sobre `corpo`. */
  bytes?: Uint8Array;
  /** Faz o fetch rejeitar (rede, tempo esgotado). */
  erro?: Error;
}

export interface PedidoRegistrado {
  metodo: string;
  url: string;
  /** Nomes em minúsculas. */
  cabecalhos: Record<string, string>;
  corpo: string | undefined;
  temSinal: boolean;
}

interface Rota {
  metodo: string;
  casa: (url: string) => boolean;
  fila: RespostaSimulada[];
}

export function erroDeRede(mensagem = "falha de rede simulada"): Error {
  return new TypeError(mensagem);
}

export function erroDeTempo(): Error {
  const e = new Error("tempo esgotado simulado");
  e.name = "TimeoutError";
  return e;
}

export function criarApiSimulada() {
  const rotas: Rota[] = [];
  const pedidos: PedidoRegistrado[] = [];

  const fetchSimulado = async (entrada: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = typeof entrada === "string" ? entrada : entrada instanceof URL ? entrada.href : entrada.url;
    const metodo = (init?.method ?? "GET").toUpperCase();
    const cabecalhos: Record<string, string> = {};
    const h = init?.headers;
    if (h) {
      const pares: Array<[string, string]> =
        h instanceof Headers ? [...h.entries()] : Array.isArray(h) ? (h as Array<[string, string]>) : Object.entries(h);
      for (const [k, v] of pares) cabecalhos[k.toLowerCase()] = String(v);
    }
    pedidos.push({
      metodo,
      url,
      cabecalhos,
      corpo: typeof init?.body === "string" ? init.body : undefined,
      temSinal: init?.signal !== undefined && init?.signal !== null,
    });

    const rota = rotas.find((r) => r.metodo === metodo && r.casa(url));
    if (!rota) throw new Error(`API simulada: sem rota para ${metodo} ${url}`);
    const resposta = rota.fila.shift();
    if (!resposta) throw new Error(`API simulada: roteiro esgotado para ${metodo} ${url}`);
    if (resposta.erro) throw resposta.erro;

    const status = resposta.status ?? 200;
    if (resposta.bytes) return new Response(resposta.bytes as BodyInit, { status });
    if (resposta.corpo === undefined) return new Response(null, { status: status === 204 ? 204 : status });
    const texto = typeof resposta.corpo === "string" ? resposta.corpo : JSON.stringify(resposta.corpo);
    return new Response(texto, { status });
  };

  return {
    fetch: fetchSimulado as typeof fetch,
    pedidos,
    /** Acrescenta respostas, em ordem, para as chamadas que casam com método e URL. */
    rota(metodo: string, casa: string | RegExp, ...respostas: RespostaSimulada[]) {
      const funcao = typeof casa === "string" ? (u: string) => u.includes(casa) : (u: string) => casa.test(u);
      const existente = rotas.find((r) => r.metodo === metodo.toUpperCase() && r.casa.toString() === funcao.toString());
      if (existente) existente.fila.push(...respostas);
      else rotas.push({ metodo: metodo.toUpperCase(), casa: funcao, fila: [...respostas] });
    },
    /** Quantos pedidos foram feitos (opcionalmente só os que casam). */
    contar(metodo?: string, casa?: string | RegExp): number {
      return pedidos.filter((p) => {
        if (metodo && p.metodo !== metodo.toUpperCase()) return false;
        if (casa === undefined) return true;
        return typeof casa === "string" ? p.url.includes(casa) : casa.test(p.url);
      }).length;
    },
  };
}

export type ApiSimulada = ReturnType<typeof criarApiSimulada>;
