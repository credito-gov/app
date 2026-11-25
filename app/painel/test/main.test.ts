import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { executar, lerArgumentos, PASTA_APP } from "../src/main.js";
import { iniciarServidor, type ServidorPainel } from "../src/servidor.js";
import { PASTA_FICTICIOS } from "./apoio/painel.js";

const abertos: ServidorPainel[] = [];
afterEach(async () => {
  while (abertos.length > 0) await abertos.pop()?.fechar();
});

function saidaDeTeste() {
  const log: string[] = [];
  const erro: string[] = [];
  return { log, erro, saida: { log: (t: string) => void log.push(t), erro: (t: string) => void erro.push(t) } };
}

describe("argumentos (DT-4)", () => {
  it("a pasta da aplicação é a que tem o package.json", () => {
    expect(PASTA_APP).toBe(resolve(fileURLToPath(new URL("..", import.meta.url))));
  });

  it("sem argumentos: fictícios e porta 5180", () => {
    expect(lerArgumentos([])).toEqual({ pasta: join(PASTA_APP, "dados", "ficticios"), porta: 5180 });
    expect(resolve(PASTA_FICTICIOS)).toBe(join(PASTA_APP, "dados", "ficticios"));
  });

  it("--pasta e --porta", () => {
    expect(lerArgumentos(["--pasta", "/dados/empresa", "--porta", "6001"]).porta).toBe(6001);
    expect(lerArgumentos(["--porta", "0"]).porta).toBe(0);
  });

  it("caminho absoluto fica como está; relativo é resolvido a partir da pasta da aplicação", () => {
    const absoluto = resolve(sep, "dados", "empresa");
    expect(lerArgumentos(["--pasta", absoluto]).pasta).toBe(absoluto);
    expect(lerArgumentos(["--pasta", join("..", "outra")]).pasta).toBe(resolve(PASTA_APP, "..", "outra"));
  });

  it("argumento desconhecido, sem valor ou porta inválida são erro", () => {
    expect(() => lerArgumentos(["--outra", "x"])).toThrow(/argumento/i);
    expect(() => lerArgumentos(["--pasta"])).toThrow(/--pasta/);
    expect(() => lerArgumentos(["--porta", "abc"])).toThrow(/--porta/);
    expect(() => lerArgumentos(["--porta", "70000"])).toThrow(/--porta/);
    expect(() => lerArgumentos(["--porta", "-1"])).toThrow(/--porta/);
  });
});

describe("partida (CA-A1, CA-A2)", () => {
  it("sobe, escreve o endereço e a pasta, e nenhum conteúdo de arquivo", async () => {
    const { log, saida } = saidaDeTeste();
    const r = await executar(["--porta", "0"], saida);
    expect(r.codigo).toBe(0);
    abertos.push(r.servidor!);
    const texto = log.join("\n");
    expect(texto).toContain(`http://127.0.0.1:${r.servidor!.porta}/`);
    expect(texto).toContain(join(PASTA_APP, "dados", "ficticios"));
    expect(texto).not.toContain("tiqueteSolicitacao");
    expect(texto).not.toContain("R$");
  });

  it("porta ocupada encerra com código 2 e mensagem", async () => {
    const ocupante = await iniciarServidor({ pasta: PASTA_FICTICIOS, porta: 0 });
    abertos.push(ocupante);
    const { erro, saida } = saidaDeTeste();
    const r = await executar(["--porta", String(ocupante.porta)], saida);
    expect(r.codigo).toBe(2);
    expect(r.servidor).toBeUndefined();
    expect(erro.join("\n")).toContain(String(ocupante.porta));
    expect(erro.join("\n").toLowerCase()).toContain("porta");
  });

  it("argumento inválido encerra com código 1 e diz o uso", async () => {
    const { erro, saida } = saidaDeTeste();
    const r = await executar(["--porta", "abc"], saida);
    expect(r.codigo).toBe(1);
    expect(erro.join("\n")).toContain("--pasta");
  });
});
