import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { criarClienteApi } from "../src/api.js";
import { lerConfig } from "../src/config.js";
import { ErroApi } from "../src/erros.js";
import { criarRedator } from "../src/redacao.js";
import { criarRegistro } from "../src/registro.js";
import { buscarServico, NOMES_SERVICOS, type NomeServico } from "../src/servicos.js";
import { criarClienteToken } from "../src/token.js";
import { criarApiSimulada, erroDeRede, erroDeTempo } from "./apoio/apiSimulada.js";
import { ID, SEGREDO, TOKEN, URL_ASSINADA, URL_BASE, envFicticio } from "./apoio/ficticios.js";
import { pastaTemporaria } from "./apoio/pasta.js";
import { criarRelogioFalso } from "./apoio/relogio.js";
import { criarSaidaCapturada } from "./apoio/saida.js";

const RESPOSTA_TOKEN = { status: 200, corpo: { access_token: TOKEN, expires_in: 3600 } };

function montar(nome: NomeServico = "creditos") {
  const config = lerConfig(envFicticio());
  const pastaLocal = pastaTemporaria();
  const relogio = criarRelogioFalso();
  const apiSimulada = criarApiSimulada();
  apiSimulada.rota("POST", "/token", RESPOSTA_TOKEN);
  const registro = criarRegistro({ pastaLocal, relogio });
  const saida = criarSaidaCapturada();
  const redator = criarRedator();
  const token = criarClienteToken({ config, fetch: apiSimulada.fetch, relogio, registro, pastaLocal, saida, redator, servico: nome });
  const servico = buscarServico(nome);
  if (!servico) throw new Error("serviço de teste desconhecido");
  const cliente = criarClienteApi({ config, fetch: apiSimulada.fetch, token, registro, relogio, redator, servico });
  const linhasDoRegistro = () =>
    existsSync(join(pastaLocal, "chamadas.jsonl"))
      ? readFileSync(join(pastaLocal, "chamadas.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Record<string, unknown>)
      : [];
  return { config, pastaLocal, relogio, api: apiSimulada, registro, saida, redator, token, cliente, linhasDoRegistro };
}

async function falha(promessa: Promise<unknown>): Promise<ErroApi> {
  try {
    await promessa;
  } catch (e) {
    expect(e).toBeInstanceOf(ErroApi);
    return e as ErroApi;
  }
  throw new Error("era esperado um ErroApi");
}

const CABECALHOS_JSON = {
  authorization: `Bearer ${TOKEN}`,
  "content-type": "application/json",
  accept: "application/json",
};

describe("abrir", () => {
  for (const nome of NOMES_SERVICOS) {
    it(`${nome}: POST {base}/${nome}/12345678 com cabeçalhos e corpo exatos`, async () => {
      const t = montar(nome);
      t.api.rota("POST", `/${nome}/12345678`, { status: 201, corpo: { tiqueteSolicitacao: "TIQ-1", tEASegundos: 120 } });
      await expect(t.cliente.abrir()).resolves.toEqual({ tiquete: "TIQ-1", teaSegundos: 120 });
      const pedido = t.api.pedidos.find((p) => p.url.includes(`/${nome}/`));
      expect(pedido).toBeDefined();
      expect(pedido?.url).toBe(`${URL_BASE}/${nome}/12345678`);
      expect(pedido?.metodo).toBe("POST");
      expect(pedido?.cabecalhos).toEqual(CABECALHOS_JSON);
      expect(pedido?.corpo).toBe('{"urlRetorno":""}');
      expect(pedido?.temSinal).toBe(true);
      expect(t.linhasDoRegistro().at(-1)).toMatchObject({ servico: nome, tipo: "abertura", http: 201, tiquete: "TIQ-1" });
    });
  }

  it("aceita outro 2xx e registra o código real", async () => {
    const t = montar();
    t.api.rota("POST", "/creditos/12345678", { status: 202, corpo: { tiqueteSolicitacao: "TIQ-2", tEASegundos: -1 } });
    await expect(t.cliente.abrir()).resolves.toEqual({ tiquete: "TIQ-2", teaSegundos: -1 });
    expect(t.linhasDoRegistro().at(-1)).toMatchObject({ tipo: "abertura", http: 202 });
  });

  it("sem tiqueteSolicitacao é erro", async () => {
    const t = montar();
    t.api.rota("POST", "/creditos/12345678", { status: 201, corpo: { tEASegundos: 10 } });
    const e = await falha(t.cliente.abrir());
    expect(e.message).toContain("tiqueteSolicitacao");
    expect(t.linhasDoRegistro().at(-1)).toMatchObject({ tipo: "abertura", http: 201, tiquete: null });
  });
});

describe("situacao", () => {
  it("GET {base}/situacao/{tiquete} com o tíquete codificado e só Bearer e Accept", async () => {
    const t = montar();
    t.api.rota("GET", "/situacao/", { status: 200, corpo: { situacao: "EM_PROCESSAMENTO" } });
    await expect(t.cliente.situacao("A/B C")).resolves.toEqual({ situacao: "EM_PROCESSAMENTO" });
    const pedido = t.api.pedidos.find((p) => p.metodo === "GET");
    expect(pedido?.url).toBe(`${URL_BASE}/situacao/A%2FB%20C`);
    expect(pedido?.cabecalhos).toEqual({ authorization: `Bearer ${TOKEN}`, accept: "application/json" });
    expect(pedido?.corpo).toBeUndefined();
    expect(t.linhasDoRegistro().at(-1)).toMatchObject({ tipo: "situacao", http: 200, tiquete: "A/B C" });
  });

  it("devolve codigoErro e mensagemErro quando a situação é ERRO ou EXPIRADA", async () => {
    const t = montar();
    t.api.rota("GET", "/situacao/", {
      status: 200,
      corpo: { situacao: "EXPIRADA", codigoErro: "EXPIRADA", mensagemErro: "Prazo excedido" },
    });
    await expect(t.cliente.situacao("T-1")).resolves.toEqual({
      situacao: "EXPIRADA",
      codigoErro: "EXPIRADA",
      mensagemErro: "Prazo excedido",
    });
  });

  it("resposta sem situacao é erro", async () => {
    const t = montar();
    t.api.rota("GET", "/situacao/", { status: 200, corpo: { outra: 1 } });
    const e = await falha(t.cliente.situacao("T-1"));
    expect(e.message).toContain("situacao");
  });
});

describe("linkDownload", () => {
  it("GET {base}/download/{tiquete} e devolve a urlAssinada e a validade", async () => {
    const t = montar();
    const expira = new Date(2026, 10, 23, 10, 30, 0);
    t.api.rota("GET", "/download/", { status: 200, corpo: { urlAssinada: URL_ASSINADA, urlAssinadaExpiraEm: expira.toISOString() } });
    const r = await t.cliente.linkDownload("A/B C");
    expect(r.urlAssinada).toBe(URL_ASSINADA);
    expect(r.expiraEm?.getTime()).toBe(expira.getTime());
    const pedido = t.api.pedidos.find((p) => p.url.includes("/download/"));
    expect(pedido?.url).toBe(`${URL_BASE}/download/A%2FB%20C`);
    expect(pedido?.cabecalhos).toEqual({ authorization: `Bearer ${TOKEN}`, accept: "application/json" });
    expect(t.linhasDoRegistro().at(-1)).toMatchObject({ tipo: "download", http: 200, tiquete: "A/B C" });
    expect(t.redator.redigir(`x ${URL_ASSINADA} y`)).toBe("x *** y");
  });

  it("a validade é opcional", async () => {
    const t = montar();
    t.api.rota("GET", "/download/", { status: 200, corpo: { urlAssinada: URL_ASSINADA } });
    const r = await t.cliente.linkDownload("T-1");
    expect(r.expiraEm).toBeUndefined();
  });

  it("sem urlAssinada é erro, e a mensagem não mostra o corpo", async () => {
    const t = montar();
    t.api.rota("GET", "/download/", { status: 200, corpo: { dado: "valor-qualquer" } });
    const e = await falha(t.cliente.linkDownload("T-1"));
    expect(e.message).toContain("urlAssinada");
    expect(e.message).not.toContain("valor-qualquer");
  });
});

describe("baixarArquivo", () => {
  it("GET na urlAssinada sem nenhum cabeçalho, devolvendo os bytes recebidos", async () => {
    const t = montar();
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 0x7b, 0x20, 0x0a, 0x7d]);
    t.api.rota("GET", "arquivo?assinatura", { status: 200, bytes });
    const r = await t.cliente.baixarArquivo(URL_ASSINADA, "T-1");
    expect([...r]).toEqual([...bytes]);
    const pedido = t.api.pedidos.find((p) => p.url === URL_ASSINADA);
    expect(pedido?.metodo).toBe("GET");
    expect(pedido?.cabecalhos).toEqual({});
    expect(t.api.pedidos.filter((p) => p.url === URL_ASSINADA)).toHaveLength(1);
    expect(t.linhasDoRegistro().at(-1)).toMatchObject({ tipo: "arquivo", http: 200, tiquete: "T-1" });
  });

  it("urlAssinadaExpiraEm no passado: não baixa e fala em urlAssinada vencida", async () => {
    const t = montar();
    const e = await falha(t.cliente.baixarArquivo(URL_ASSINADA, "T-1", new Date(2026, 10, 23, 9, 0, 0)));
    expect(e.motivo).toBe("url-vencida");
    expect(e.message).toContain("urlAssinada vencida");
    expect(t.api.pedidos).toHaveLength(0);
    expect(t.linhasDoRegistro()).toHaveLength(0);
  });

  for (const http of [400, 403]) {
    it(`${http} no GET do arquivo é tratado como urlAssinada vencida`, async () => {
      const t = montar();
      t.api.rota("GET", "arquivo?assinatura", { status: http, corpo: "<Error>dado do armazenamento</Error>" });
      const e = await falha(t.cliente.baixarArquivo(URL_ASSINADA, "T-1"));
      expect(e.motivo).toBe("url-vencida");
      expect(e.http).toBe(http);
      expect(e.message).not.toContain("dado do armazenamento");
      expect(e.message).toContain("--tiquete T-1");
      expect(t.linhasDoRegistro().at(-1)).toMatchObject({ tipo: "arquivo", http });
    });
  }

  it("outro código no arquivo é erro com o código HTTP", async () => {
    const t = montar();
    t.api.rota("GET", "arquivo?assinatura", { status: 500 });
    const e = await falha(t.cliente.baixarArquivo(URL_ASSINADA, "T-1"));
    expect(e.http).toBe(500);
    expect(e.tipoChamada).toBe("arquivo");
  });
});

type Operacao = {
  nome: string;
  tipo: "abertura" | "situacao" | "download";
  rota: [string, string | RegExp];
  executar: (t: ReturnType<typeof montar>) => Promise<unknown>;
};

const OPERACOES: Operacao[] = [
  { nome: "abertura", tipo: "abertura", rota: ["POST", "/creditos/12345678"], executar: (t) => t.cliente.abrir() },
  { nome: "situação", tipo: "situacao", rota: ["GET", "/situacao/"], executar: (t) => t.cliente.situacao("T-1") },
  { nome: "download", tipo: "download", rota: ["GET", "/download/"], executar: (t) => t.cliente.linkDownload("T-1") },
];

describe("erros HTTP (CA-4)", () => {
  const ESPERADO: Record<number, string> = {
    400: "HTTP 400",
    401: "Token recusado",
    403: "Sem permissão",
    429: "Limite excedido",
    500: "HTTP 500",
    418: "HTTP 418",
  };

  for (const op of OPERACOES) {
    for (const [codigo, trecho] of Object.entries(ESPERADO)) {
      it(`${op.nome} com ${codigo}: mensagem clara, sem nova abertura nem novo token`, async () => {
        const t = montar();
        t.api.rota(op.rota[0], op.rota[1], { status: Number(codigo), corpo: { codigoErro: "COD_X", mensagemErro: "Texto da API" } });
        const e = await falha(op.executar(t));
        expect(e.http).toBe(Number(codigo));
        expect(e.tipoChamada).toBe(op.tipo);
        expect(e.message).toContain(trecho);
        expect(e.message).toContain("codigoErro=COD_X");
        expect(e.message).toContain("mensagemErro=Texto da API");
        expect(t.api.contar("POST", "/token")).toBe(1);
        expect(t.api.contar("POST", "/creditos/")).toBe(op.tipo === "abertura" ? 1 : 0);
        expect(t.linhasDoRegistro().at(-1)).toMatchObject({ tipo: op.tipo, http: Number(codigo) });
      });
    }
  }

  it("404 na abertura e na situação: endereço não encontrado", async () => {
    for (const op of OPERACOES.slice(0, 2)) {
      const t = montar();
      t.api.rota(op.rota[0], op.rota[1], { status: 404 });
      const e = await falha(op.executar(t));
      expect(e.message).toContain("APURACAO_URL_BASE");
    }
  });

  it("404 no download: ARQUIVO_INDISPONIVEL", async () => {
    const t = montar();
    t.api.rota("GET", "/download/", { status: 404, corpo: { codigoErro: "ARQUIVO_INDISPONIVEL", mensagemErro: "indisponível" } });
    const e = await falha(t.cliente.linkDownload("T-1"));
    expect(e.message).toContain("ARQUIVO_INDISPONIVEL");
    expect(e.message).toContain("Arquivo indisponível");
  });

  it("401 descarta o cache do token", async () => {
    const t = montar();
    t.api.rota("POST", "/creditos/12345678", { status: 401 });
    await falha(t.cliente.abrir());
    expect(existsSync(join(t.pastaLocal, "token.json"))).toBe(false);
  });

  it("429 mostra as aberturas do dia registradas", async () => {
    const t = montar();
    t.registro.registrar({ servico: "creditos", tipo: "abertura", http: 201, tiquete: "A" });
    t.registro.registrar({ servico: "creditos", tipo: "abertura", http: 201, tiquete: "B" });
    t.api.rota("POST", "/creditos/12345678", { status: 429 });
    const e = await falha(t.cliente.abrir());
    expect(e.message).toContain("Aberturas de creditos registradas hoje: 3 (2 aceitas)");
    expect(e.message).toContain("meia-noite");
  });

  it("com tíquete, a mensagem de erro termina com o comando de retomada", async () => {
    const t = montar();
    t.api.rota("GET", "/situacao/", { status: 500 });
    const e = await falha(t.cliente.situacao("T-77"));
    expect(e.message.endsWith("npm run consulta -- creditos --tiquete T-77")).toBe(true);
  });

  it("o corpo que não é JSON de erro não aparece na mensagem", async () => {
    const t = montar();
    t.api.rota("POST", "/creditos/12345678", { status: 500, corpo: "<html>dado do gateway</html>" });
    const e = await falha(t.cliente.abrir());
    expect(e.message).not.toContain("dado do gateway");
  });
});

describe("erro de rede e tempo esgotado", () => {
  for (const op of OPERACOES) {
    it(`${op.nome}: sem resposta, http null no registro e nada repetido`, async () => {
      const t = montar();
      t.api.rota(op.rota[0], op.rota[1], { erro: erroDeRede() }, { status: 200, corpo: { tiqueteSolicitacao: "X", urlAssinada: "Y", situacao: "CONCLUIDA" } });
      const e = await falha(op.executar(t));
      expect(e.motivo).toBe("rede");
      expect(e.message).toContain("Sem resposta");
      expect(t.api.pedidos.filter((p) => p.metodo === op.rota[0] && p.url !== "" && !p.url.includes("/token"))).toHaveLength(1);
      expect(t.linhasDoRegistro().at(-1)).toMatchObject({ tipo: op.tipo, http: null });
    });

    it(`${op.nome}: tempo esgotado`, async () => {
      const t = montar();
      t.api.rota(op.rota[0], op.rota[1], { erro: erroDeTempo() });
      const e = await falha(op.executar(t));
      expect(e.motivo).toBe("tempo-esgotado");
      expect(t.linhasDoRegistro().at(-1)).toMatchObject({ tipo: op.tipo, http: null });
    });
  }

  it("arquivo: erro de rede e tempo esgotado também registram http null", async () => {
    for (const [erro, motivo] of [
      [erroDeRede(), "rede"],
      [erroDeTempo(), "tempo-esgotado"],
    ] as const) {
      const t = montar();
      t.api.rota("GET", "arquivo?assinatura", { erro });
      const e = await falha(t.cliente.baixarArquivo(URL_ASSINADA, "T-1"));
      expect(e.motivo).toBe(motivo);
      expect(t.linhasDoRegistro().at(-1)).toMatchObject({ tipo: "arquivo", http: null });
    }
  });
});

describe("segredos (CA-12)", () => {
  it("a urlAssinada, o token e as credenciais não aparecem em saída, registro nem mensagem de erro", async () => {
    const t = montar();
    t.api.rota("GET", "/download/", { status: 200, corpo: { urlAssinada: URL_ASSINADA } });
    t.api.rota("GET", "arquivo?assinatura", { status: 403, corpo: { codigoErro: "X", mensagemErro: `negado para ${URL_ASSINADA}` } });
    const { urlAssinada } = await t.cliente.linkDownload("T-1");
    const e = await falha(t.cliente.baixarArquivo(urlAssinada, "T-1"));
    const tudo = [t.saida.texto(), e.message, JSON.stringify(t.linhasDoRegistro())].join("\n");
    for (const proibido of [URL_ASSINADA, TOKEN, ID, SEGREDO]) expect(tudo).not.toContain(proibido);
  });
});
