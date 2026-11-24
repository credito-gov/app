import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { request } from "node:http";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { iniciarServidor, type ServidorPainel } from "../src/servidor.js";
import { arquivoCreditos, bytes, credito, RAIZ } from "./apoio/construtores.js";
import { PASTA_FICTICIOS } from "./apoio/painel.js";
import { nomeArquivo, pastaTemporaria, type PastaTemporaria } from "./apoio/pasta.js";

const CSP = "default-src 'none'; style-src 'self'; img-src 'self'; form-action 'self'; frame-ancestors 'none'";

interface Resp {
  status: number;
  cabecalhos: Record<string, string | string[] | undefined>;
  corpo: string;
}

function pedir(porta: number, caminho: string, opcoes: { metodo?: string; host?: string } = {}): Promise<Resp> {
  return new Promise((resolver, rejeitar) => {
    const req = request(
      { host: "127.0.0.1", port: porta, path: caminho, method: opcoes.metodo ?? "GET", headers: { Host: opcoes.host ?? `127.0.0.1:${porta}` } },
      (res) => {
        const partes: Buffer[] = [];
        res.on("data", (p: Buffer) => partes.push(p));
        res.on("end", () => resolver({ status: res.statusCode ?? 0, cabecalhos: res.headers, corpo: Buffer.concat(partes).toString("utf8") }));
      },
    );
    req.on("error", rejeitar);
    req.end();
  });
}

const abertos: ServidorPainel[] = [];
const pastas: PastaTemporaria[] = [];
afterEach(async () => {
  while (abertos.length > 0) await abertos.pop()?.fechar();
  while (pastas.length > 0) await pastas.pop()?.limpar();
});

async function subir(pasta: string, lerArquivo?: (caminho: string) => Promise<Uint8Array>): Promise<ServidorPainel> {
  const s = await iniciarServidor({ pasta, porta: 0, lerArquivo });
  abertos.push(s);
  return s;
}

async function copiaDosFicticios(): Promise<PastaTemporaria> {
  const pasta = await pastaTemporaria();
  pastas.push(pasta);
  for (const nome of readdirSync(PASTA_FICTICIOS)) await pasta.escrever(nome, readFileSync(join(PASTA_FICTICIOS, nome)));
  return pasta;
}

describe("escuta e Host (CA-A1, DT-10)", () => {
  it("escuta só em 127.0.0.1", async () => {
    const s = await subir(PASTA_FICTICIOS);
    expect(s.endereco).toBe("127.0.0.1");
    expect(s.porta).toBeGreaterThan(0);
    expect((await pedir(s.porta, "/")).status).toBe(200);
  });

  it("aceita Host 127.0.0.1:<porta> e localhost:<porta>", async () => {
    const s = await subir(PASTA_FICTICIOS);
    expect((await pedir(s.porta, "/", { host: `127.0.0.1:${s.porta}` })).status).toBe(200);
    expect((await pedir(s.porta, "/", { host: `localhost:${s.porta}` })).status).toBe(200);
  });

  it("qualquer outro Host recebe 421 (DNS rebinding)", async () => {
    const s = await subir(PASTA_FICTICIOS);
    for (const host of ["evil.example", `evil.example:${s.porta}`, "127.0.0.1", `127.0.0.1:${s.porta + 1}`, `localhost.evil.example:${s.porta}`, "0.0.0.0:80"]) {
      const r = await pedir(s.porta, "/", { host });
      expect(r.status, host).toBe(421);
      expect(r.corpo, host).not.toContain("R$");
    }
  });
});

describe("erro interno (rodada 1, grupo B)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("devolve 500 com os cabeçalhos de segurança e registra o erro e a rota em stderr, sem valores", async () => {
    const saida: string[] = [];
    vi.spyOn(process.stderr, "write").mockImplementation(((texto: string | Uint8Array) => {
      saida.push(String(texto));
      return true;
    }) as typeof process.stderr.write);
    const pasta = await copiaDosFicticios();
    const s = await subir(pasta.caminho, async () => {
      throw new TypeError("defeito simulado do painel");
    });
    const r = await pedir(s.porta, "/creditos?busca=ABCDE");
    expect(r.status).toBe(500);
    expect(r.corpo).toBe("Erro interno.");
    expect(r.cabecalhos["content-security-policy"]).toBe(CSP);
    expect(r.cabecalhos["x-content-type-options"]).toBe("nosniff");
    expect(r.cabecalhos["referrer-policy"]).toBe("no-referrer");
    expect(r.cabecalhos["cache-control"]).toBe("no-store");
    const registro = saida.join("");
    expect(registro).toContain("/creditos");
    expect(registro).toContain("TypeError");
    expect(registro).toContain("defeito simulado do painel");
    expect(registro).not.toContain("ABCDE");
    expect(registro).not.toContain("R$");
  });
});

describe("métodos (DT-10)", () => {
  it("POST, PUT, DELETE e PATCH recebem 405, com Allow", async () => {
    const s = await subir(PASTA_FICTICIOS);
    for (const metodo of ["POST", "PUT", "DELETE", "PATCH"]) {
      const r = await pedir(s.porta, "/", { metodo });
      expect(r.status, metodo).toBe(405);
      expect(r.cabecalhos["allow"], metodo).toBe("GET, HEAD");
    }
  });

  it("HEAD é aceito e não leva corpo", async () => {
    const s = await subir(PASTA_FICTICIOS);
    const r = await pedir(s.porta, "/", { metodo: "HEAD" });
    expect(r.status).toBe(200);
    expect(r.corpo).toBe("");
    expect(r.cabecalhos["content-type"]).toBe("text/html; charset=utf-8");
  });
});

describe("cabeçalhos de segurança em toda resposta (DT-10)", () => {
  it("200, 404, 405 e 421", async () => {
    const s = await subir(PASTA_FICTICIOS);
    const respostas = [
      await pedir(s.porta, "/"),
      await pedir(s.porta, "/estilo.css"),
      await pedir(s.porta, "/nao-existe"),
      await pedir(s.porta, "/", { metodo: "POST" }),
      await pedir(s.porta, "/", { host: "evil.example" }),
    ];
    expect(respostas.map((r) => r.status)).toEqual([200, 200, 404, 405, 421]);
    for (const r of respostas) {
      expect(r.cabecalhos["content-security-policy"]).toBe(CSP);
      expect(r.cabecalhos["x-content-type-options"]).toBe("nosniff");
      expect(r.cabecalhos["referrer-policy"]).toBe("no-referrer");
      expect(r.cabecalhos["cache-control"]).toBe("no-store");
    }
  });

  it("tipos de conteúdo", async () => {
    const s = await subir(PASTA_FICTICIOS);
    expect((await pedir(s.porta, "/")).cabecalhos["content-type"]).toBe("text/html; charset=utf-8");
    expect((await pedir(s.porta, "/estilo.css")).cabecalhos["content-type"]).toBe("text/css; charset=utf-8");
  });
});

describe("nenhuma rota recebe caminho de arquivo (CA-A3, DT-10)", () => {
  it("tentativas de sair da pasta ou ler arquivos não devolvem conteúdo de arquivo", async () => {
    const s = await subir(PASTA_FICTICIOS);
    for (const caminho of ["/../package.json", "/%2e%2e/package.json", "/arquivos/../../package.json", "/dados/ficticios/x.json", "/creditos/nota?chave=../../package.json", "//package.json"]) {
      const r = await pedir(s.porta, caminho);
      expect(r.corpo, caminho).not.toContain('"name": "painel"');
      expect(r.corpo, caminho).not.toContain("tiqueteSolicitacao");
    }
  });
});

describe("pasta configurável e recarga (CA-A2)", () => {
  it("arquivo novo aparece no pedido seguinte, sem reiniciar", async () => {
    const pasta = await copiaDosFicticios();
    const s = await subir(pasta.caminho);
    const antes = await pedir(s.porta, "/arquivos");
    expect(antes.corpo).not.toContain("FICTNOVO");
    await pasta.escrever(nomeArquivo("creditos", "FICTNOVO", "20261124T090000Z"), bytes(arquivoCreditos([["11/2026", [credito({ chave: "FICT-NOVA", aApropriar: "1.00" })]]], { ni: RAIZ })));
    const depois = await pedir(s.porta, "/arquivos");
    expect(depois.corpo).toContain("FICTNOVO");
  });

  it("arquivo alterado é relido", async () => {
    const pasta = await copiaDosFicticios();
    const s = await subir(pasta.caminho);
    const nome = nomeArquivo("creditos", "FICTCRED06", "20261123T090000Z");
    expect((await pedir(s.porta, "/arquivos")).corpo).not.toContain("situacao-recusado");
    await pasta.escrever(nome, "{ agora ilegível");
    expect((await pedir(s.porta, "/arquivos")).corpo).toContain("situacao-recusado");
  });

  it("pasta inexistente: o servidor sobe e as páginas dizem isso", async () => {
    const pasta = await pastaTemporaria();
    pastas.push(pasta);
    const inexistente = join(pasta.caminho, "nao-existe");
    const s = await subir(inexistente);
    const r = await pedir(s.porta, "/");
    expect(r.status).toBe(200);
    expect(r.corpo).toContain("A pasta não pôde ser lida");
    expect(readdirSync(pasta.caminho)).toEqual([]);
  });
});

describe("só lê (CA-A3)", () => {
  it("hash, tamanho e data de modificação iguais depois de percorrer todas as rotas", async () => {
    const pasta = await copiaDosFicticios();
    const instantaneo = () =>
      Object.fromEntries(
        readdirSync(pasta.caminho).map((nome) => {
          const caminho = join(pasta.caminho, nome);
          const info = statSync(caminho);
          return [nome, `${createHash("sha256").update(readFileSync(caminho)).digest("hex")}:${info.size}:${info.mtimeMs}`];
        }),
      );
    const antes = instantaneo();
    const s = await subir(pasta.caminho);
    const lista = await pedir(s.porta, "/creditos?pa=11/2026");
    const nota = /href="(\/creditos\/nota\?[^"]+)"/.exec(lista.corpo)![1].replaceAll("&amp;", "&");
    for (const url of ["/", "/creditos", "/creditos?pa=10/2026&pendente=1", nota, "/pendencias", "/pendencias?grupo=nao-identificado", "/arquivos", "/estilo.css", "/nao-existe"]) {
      await pedir(s.porta, url);
    }
    expect(instantaneo()).toEqual(antes);
    expect(readdirSync(pasta.caminho).sort()).toEqual(Object.keys(antes).sort());
  });
});

describe("desempenho com os fictícios de volume", () => {
  it("primeira carga e a lista de um período abaixo de 2 s; recarga sem mudança não relê arquivo", async () => {
    const pasta = await copiaDosFicticios();
    const lidos: string[] = [];
    const s = await subir(pasta.caminho, async (caminho) => {
      lidos.push(caminho);
      return new Uint8Array(await readFile(caminho));
    });

    let t0 = performance.now();
    expect((await pedir(s.porta, "/")).status).toBe(200);
    expect(performance.now() - t0).toBeLessThan(2000);
    const leituras = lidos.length;
    expect(leituras).toBeGreaterThanOrEqual(10);

    t0 = performance.now();
    expect((await pedir(s.porta, "/creditos?pa=11/2026")).status).toBe(200);
    expect(performance.now() - t0).toBeLessThan(2000);

    await pedir(s.porta, "/");
    await pedir(s.porta, "/pendencias");
    expect(lidos.length).toBe(leituras);
  });
});
