// Varredura de app/backend (CA-39, CA-4): sem variável com valor fora do .env.example e
// sem número longo (possível CNPJ, CPF ou conta) em src/ e test/.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, test } from "vitest";

const RAIZ = join(import.meta.dirname, "..");
const IGNORAR = new Set(["node_modules", "dist", ".local", ".env"]);
const EXTENSOES = /\.(ts|js|mjs|json|sql|yaml|yml|md|example)$|^\.env\.example$|^\.gitignore$/;

function arquivos(pasta: string): string[] {
  const achados: string[] = [];
  for (const nome of readdirSync(pasta)) {
    if (IGNORAR.has(nome)) continue;
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) achados.push(...arquivos(caminho));
    else if (EXTENSOES.test(nome)) achados.push(caminho);
  }
  return achados;
}

const rel = (c: string) => relative(RAIZ, c).split(sep).join("/");
const todos = arquivos(RAIZ).filter((c) => rel(c) !== "package-lock.json");

describe("varredura do repositório", () => {
  test("só .env.example nomeia variáveis CREDITOGOV_*, e sem valor", () => {
    const comValor = /^[ \t]*(export[ \t]+)?CREDITOGOV_[A-Z_]+[ \t]*=[ \t]*\S/m;
    // o próprio arquivo de varredura tem a expressão acima como texto
    const suspeitos = todos.filter((c) => rel(c) !== "test/varredura.test.ts" && comValor.test(readFileSync(c, "utf8")));
    expect(suspeitos.map(rel)).toEqual([]);
    const exemplo = readFileSync(join(RAIZ, ".env.example"), "utf8");
    expect(exemplo).toMatch(/CREDITOGOV_BANCO_URL=\s*$/m);
    expect(comValor.test(exemplo)).toBe(false);
  });

  test(".env está no .gitignore e não há .env versionável na pasta", () => {
    expect(readFileSync(join(RAIZ, ".gitignore"), "utf8")).toMatch(/^\.env$/m);
  });

  test("nenhum número de 11 dígitos ou mais em src/ e test/, fora das constantes decimais de CA-38", () => {
    const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
    const achados: string[] = [];
    for (const c of todos) {
      const r = rel(c);
      if (!r.startsWith("src/") && !r.startsWith("test/")) continue;
      if (r === "test/varredura.test.ts") continue;
      let texto = readFileSync(c, "utf8").replace(uuid, "");
      if (r === "test/banco/isolamento.test.ts") texto = texto.replaceAll("12345678901234.56", "");
      if (/\d{11,}/.test(texto)) achados.push(r);
    }
    expect(achados).toEqual([]);
  });
});
