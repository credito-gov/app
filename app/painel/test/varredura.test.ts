import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// fileURLToPath decodifica espaços e acentos do caminho; `.pathname` deixaria `%20` e a varredura passaria vazia.
const PASTA_SRC = fileURLToPath(new URL("../src/", import.meta.url));

function listarTs(pasta: string): string[] {
  if (!existsSync(pasta)) return [];
  const saida: string[] = [];
  for (const nome of readdirSync(pasta)) {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) saida.push(...listarTs(caminho));
    else if (nome.endsWith(".ts")) saida.push(caminho);
  }
  return saida;
}

const arquivos = listarTs(PASTA_SRC).map((caminho) => ({
  nome: relative(PASTA_SRC, caminho).replaceAll("\\", "/"),
  texto: readFileSync(caminho, "utf8"),
}));

function ocorrencias(padrao: RegExp, filtro: (nome: string) => boolean = () => true): string[] {
  const achados: string[] = [];
  for (const { nome, texto } of arquivos) {
    if (!filtro(nome)) continue;
    texto.split(/\r?\n/).forEach((linha, i) => {
      if (padrao.test(linha)) achados.push(`${nome}:${i + 1}: ${linha.trim()}`);
    });
  }
  return achados;
}

describe("varredura do código: o painel não usa rede nem credencial (CA-19)", () => {
  // Guarda contra a varredura vazia: sem arquivos varridos, todas as asserções abaixo passariam à toa.
  it("src/ tem código para varrer", () => {
    expect(arquivos.length).toBeGreaterThan(10);
    expect(arquivos.map((a) => a.nome)).toContain("nucleo/dinheiro.ts");
    expect(arquivos.map((a) => a.nome)).toContain("servidor.ts");
  });

  const proibidos: Array<[string, RegExp]> = [
    ["process.env", /process\.env/],
    ["fetch(", /\bfetch\s*\(/],
    ["node:https", /node:https/],
    ["node:net", /node:net/],
    ["node:tls", /node:tls/],
    ["node:dgram", /node:dgram/],
    ["arquivo .env", /\.env\b/],
    ["endereço da Receita", /receitafederal\.gov\.br/],
    ["pasta .local da apuracao-cbs", /apuracao-cbs\/\.local/],
  ];
  for (const [nome, padrao] of proibidos) {
    it(`nenhuma ocorrência de ${nome}`, () => {
      expect(ocorrencias(padrao)).toEqual([]);
    });
  }

  it("node:http só aparece em src/servidor.ts", () => {
    expect(ocorrencias(/node:http\b/, (nome) => nome !== "servidor.ts")).toEqual([]);
  });
});

describe("varredura do código: o painel só lê (CA-A3)", () => {
  const escrita: Array<[string, RegExp]> = [
    ["writeFile", /\bwriteFile/],
    ["appendFile", /\bappendFile/],
    ["rename", /\brename/],
    ["unlink", /\bunlink/],
    ["rm(", /\brm\s*\(/],
    ["rmdir", /\brmdir/],
    ["mkdir", /\bmkdir/],
    ["copyFile", /\bcopyFile/],
    ["createWriteStream", /\bcreateWriteStream/],
  ];
  for (const [nome, padrao] of escrita) {
    it(`nenhuma ocorrência de ${nome}`, () => {
      expect(ocorrencias(padrao)).toEqual([]);
    });
  }
});

describe("varredura do código: valores monetários sem ponto flutuante (CA-16)", () => {
  it("nenhum parseFloat em src/", () => {
    expect(ocorrencias(/\bparseFloat\b/)).toEqual([]);
  });
  it("nenhum Number( em src/nucleo/", () => {
    expect(ocorrencias(/\bNumber\s*\(/, (nome) => nome.startsWith("nucleo/"))).toEqual([]);
  });
  it("toFixed só em src/nucleo/dinheiro.ts, sobre Big", () => {
    expect(ocorrencias(/\.toFixed\b/, (nome) => nome !== "nucleo/dinheiro.ts")).toEqual([]);
  });
});

// Lista de permissão (rodada 1, F5): o que o painel pode importar é exatamente isto. Módulo novo ou nome novo
// de node:fs exige mudar este teste de propósito, e não passa despercebido como numa lista de proibição.
describe("varredura do código: lista de permissão de módulos e de nomes importados (CA-19, CA-A3)", () => {
  interface Importacao {
    arquivo: string;
    modulo: string;
    nomes: string[];
  }

  function importacoes(): Importacao[] {
    const achados: Importacao[] = [];
    for (const { nome, texto } of arquivos) {
      for (const m of texto.matchAll(/^import\s+(?:type\s+)?([^;]*?)\s*from\s+"([^"]+)"/gm)) {
        const nomes = [...m[1].matchAll(/[A-Za-z_$][\w$]*/g)].map((x) => x[0]).filter((x) => x !== "type" && x !== "as");
        achados.push({ arquivo: nome, modulo: m[2], nomes });
      }
    }
    return achados;
  }

  const externos = () => importacoes().filter((i) => !i.modulo.startsWith("."));
  const nomesDe = (modulo: string) => [...new Set(externos().filter((i) => i.modulo === modulo).flatMap((i) => i.nomes))].sort();

  it("os módulos externos importados em src/ são exatamente os esperados", () => {
    expect([...new Set(externos().map((i) => i.modulo))].sort()).toEqual(
      ["ajv-formats", "ajv/dist/2020.js", "big.js", "lossless-json", "node:fs", "node:fs/promises", "node:http", "node:path", "node:url"].sort(),
    );
  });

  it("de node:fs vem só readFileSync e de node:fs/promises só readdir, readFile e stat", () => {
    expect(nomesDe("node:fs")).toEqual(["readFileSync"]);
    expect(nomesDe("node:fs/promises")).toEqual(["readFile", "readdir", "stat"]);
  });

  it("de node:http vêm só createServer e os tipos da requisição e da resposta, e só em servidor.ts", () => {
    expect(nomesDe("node:http")).toEqual(["IncomingMessage", "ServerResponse", "createServer"]);
    expect(externos().filter((i) => i.modulo === "node:http").map((i) => i.arquivo)).toEqual(["servidor.ts"]);
    expect(ocorrencias(/\bcreateServer\b/, (nome) => nome !== "servidor.ts")).toEqual([]);
  });

  it("node:path e node:url trazem só os nomes de caminho", () => {
    expect(nomesDe("node:path")).toEqual(["join", "resolve"]);
    expect(nomesDe("node:url")).toEqual(["fileURLToPath", "pathToFileURL"]);
  });

  it("não há import dinâmico nem require em src/", () => {
    expect(ocorrencias(/\bimport\s*\(/)).toEqual([]);
    expect(ocorrencias(/\brequire\s*\(/)).toEqual([]);
  });
});
