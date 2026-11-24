import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ErroConfig, NOMES_VARIAVEIS, lerConfig } from "../src/config.js";
import { CNPJ_BASE, ID, SEGREDO, URL_BASE, URL_TOKEN, envFicticio } from "./apoio/ficticios.js";

const OBRIGATORIAS = [
  "APURACAO_CLIENT_ID",
  "APURACAO_CLIENT_SECRET",
  "APURACAO_URL_TOKEN",
  "APURACAO_URL_BASE",
  "APURACAO_TOKEN_CREDENCIAIS",
  "APURACAO_CNPJ_BASE",
];

function erroDe(env: Record<string, string | undefined>): ErroConfig {
  try {
    lerConfig(env);
  } catch (e) {
    expect(e).toBeInstanceOf(ErroConfig);
    return e as ErroConfig;
  }
  throw new Error("era esperado um erro de configuração");
}

describe("lerConfig", () => {
  it("lê uma configuração válida com os padrões", () => {
    const c = lerConfig(envFicticio());
    expect(c).toMatchObject({
      clientId: ID,
      clientSecret: SEGREDO,
      urlToken: URL_TOKEN,
      urlBase: URL_BASE,
      tokenCredenciais: "basic",
      cnpjBase: CNPJ_BASE,
      intervaloSituacaoSegundos: 300,
      esperaMaximaMinutos: 250,
    });
    expect(c.tokenScope).toBeUndefined();
  });

  for (const nome of OBRIGATORIAS) {
    it(`${nome} ausente aparece pelo nome no erro, sem nenhum valor`, () => {
      const env = envFicticio({ [nome]: undefined });
      const e = erroDe(env);
      expect(e.message).toContain(nome);
      expect(e.variaveis).toContain(nome);
      for (const valor of Object.values(env)) {
        if (valor) expect(e.message).not.toContain(valor);
      }
    });
  }

  it("variável vazia conta como ausente", () => {
    expect(erroDe(envFicticio({ APURACAO_CLIENT_ID: "" })).variaveis).toEqual(["APURACAO_CLIENT_ID"]);
  });

  it("lista todas as variáveis com problema de uma vez", () => {
    const e = erroDe(envFicticio({ APURACAO_CLIENT_ID: undefined, APURACAO_URL_BASE: undefined }));
    expect(e.variaveis.sort()).toEqual(["APURACAO_CLIENT_ID", "APURACAO_URL_BASE"]);
  });

  it("não tem endereço padrão: sem URL de token ou de base dá erro", () => {
    expect(erroDe(envFicticio({ APURACAO_URL_TOKEN: undefined })).variaveis).toContain("APURACAO_URL_TOKEN");
    expect(erroDe(envFicticio({ APURACAO_URL_BASE: undefined })).variaveis).toContain("APURACAO_URL_BASE");
  });

  it("recusa URL http sem mostrar o valor", () => {
    const e = erroDe(envFicticio({ APURACAO_URL_TOKEN: "http://token.exemplo.invalid/segredo-na-url" }));
    expect(e.variaveis).toEqual(["APURACAO_URL_TOKEN"]);
    expect(e.message).not.toContain("segredo-na-url");
  });

  it("recusa texto que não é URL", () => {
    expect(erroDe(envFicticio({ APURACAO_URL_BASE: "isto nao e url" })).variaveis).toEqual(["APURACAO_URL_BASE"]);
  });

  it("remove a barra final da base", () => {
    expect(lerConfig(envFicticio({ APURACAO_URL_BASE: `${URL_BASE}/` })).urlBase).toBe(URL_BASE);
  });

  it("aceita só basic ou corpo", () => {
    expect(lerConfig(envFicticio({ APURACAO_TOKEN_CREDENCIAIS: "corpo" })).tokenCredenciais).toBe("corpo");
    expect(erroDe(envFicticio({ APURACAO_TOKEN_CREDENCIAIS: "outro" })).variaveis).toEqual([
      "APURACAO_TOKEN_CREDENCIAIS",
    ]);
  });

  it("CNPJ base tem de ter exatamente 8 dígitos", () => {
    expect(erroDe(envFicticio({ APURACAO_CNPJ_BASE: "1234567" })).variaveis).toEqual(["APURACAO_CNPJ_BASE"]);
    expect(erroDe(envFicticio({ APURACAO_CNPJ_BASE: "123456789" })).variaveis).toEqual(["APURACAO_CNPJ_BASE"]);
    expect(erroDe(envFicticio({ APURACAO_CNPJ_BASE: "1234567a" })).variaveis).toEqual(["APURACAO_CNPJ_BASE"]);
  });

  it("intervalo menor que 60 é recusado; o padrão é 300", () => {
    expect(erroDe(envFicticio({ APURACAO_INTERVALO_SITUACAO_SEGUNDOS: "59" })).variaveis).toEqual([
      "APURACAO_INTERVALO_SITUACAO_SEGUNDOS",
    ]);
    expect(erroDe(envFicticio({ APURACAO_INTERVALO_SITUACAO_SEGUNDOS: "abc" })).variaveis).toEqual([
      "APURACAO_INTERVALO_SITUACAO_SEGUNDOS",
    ]);
    expect(lerConfig(envFicticio({ APURACAO_INTERVALO_SITUACAO_SEGUNDOS: "60" })).intervaloSituacaoSegundos).toBe(60);
    expect(lerConfig(envFicticio({ APURACAO_INTERVALO_SITUACAO_SEGUNDOS: "" })).intervaloSituacaoSegundos).toBe(300);
  });

  it("espera máxima: padrão 250, mínimo 1", () => {
    expect(lerConfig(envFicticio()).esperaMaximaMinutos).toBe(250);
    expect(lerConfig(envFicticio({ APURACAO_ESPERA_MAXIMA_MINUTOS: "10" })).esperaMaximaMinutos).toBe(10);
    expect(erroDe(envFicticio({ APURACAO_ESPERA_MAXIMA_MINUTOS: "0" })).variaveis).toEqual([
      "APURACAO_ESPERA_MAXIMA_MINUTOS",
    ]);
  });

  it("scope vazio é o mesmo que ausente; preenchido é mantido", () => {
    expect(lerConfig(envFicticio({ APURACAO_TOKEN_SCOPE: "" })).tokenScope).toBeUndefined();
    expect(lerConfig(envFicticio({ APURACAO_TOKEN_SCOPE: "escopo-ficticio" })).tokenScope).toBe("escopo-ficticio");
  });
});

describe(".env.example", () => {
  const texto = readFileSync(join(import.meta.dirname, "..", ".env.example"), "utf8");
  const linhas = texto.split(/\r?\n/).filter((l) => /^APURACAO_[A-Z_]+=/.test(l));

  it("tem exatamente as nove variáveis que lerConfig conhece", () => {
    expect(linhas.map((l) => l.split("=")[0]).sort()).toEqual([...NOMES_VARIAVEIS].sort());
    expect(NOMES_VARIAVEIS).toHaveLength(9);
  });

  it("não traz nenhum valor", () => {
    for (const l of linhas) expect(l.endsWith("="), l).toBe(true);
  });
});

describe("sem endereço no código (CA-13)", () => {
  it("nenhum arquivo de src/ cita receitafederal.gov.br", () => {
    const achados: string[] = [];
    const varrer = (pasta: string): void => {
      for (const nome of readdirSync(pasta)) {
        const caminho = join(pasta, nome);
        if (statSync(caminho).isDirectory()) varrer(caminho);
        else if (readFileSync(caminho, "utf8").includes("receitafederal.gov.br")) achados.push(caminho);
      }
    };
    varrer(join(import.meta.dirname, "..", "src"));
    expect(achados).toEqual([]);
  });
});
