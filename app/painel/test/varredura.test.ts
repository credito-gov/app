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
