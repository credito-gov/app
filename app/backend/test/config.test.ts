import { describe, expect, test } from "vitest";
import { carregarConfig, ErroConfig } from "../src/config.js";

// Valores fictícios. Nenhum teste lê process.env nem .env.
const SEGREDO = "segredo-ficticio-de-teste-com-mais-de-32-bytes";
const base = (): Record<string, string> => ({
  CREDITOGOV_AMBIENTE: "local",
  CREDITOGOV_BANCO_URL: "postgres://app@127.0.0.1:5433/exemplo_app",
  CREDITOGOV_SESSAO_SEGREDO: SEGREDO,
  CREDITOGOV_WEB_URL: "http://localhost:5173",
  CREDITOGOV_EMAIL: "memoria",
});

function mensagemDoErro(env: Record<string, string | undefined>): string {
  try {
    carregarConfig(env);
  } catch (e) {
    expect(e).toBeInstanceOf(ErroConfig);
    return (e as Error).message;
  }
  throw new Error("era esperado um erro de configuração");
}

describe("config: valores válidos", () => {
  test("carrega e aplica os padrões de porta e proxy", () => {
    const c = carregarConfig(base());
    expect(c.ambiente).toBe("local");
    expect(c.email).toBe("memoria");
    expect(c.apiPorta).toBe(3000);
    expect(c.confiarProxy).toBe(0);
    expect(c.webOrigem).toBe("http://localhost:5173");
  });

  test("aceita porta e proxy informados", () => {
    const c = carregarConfig({
      ...base(),
      CREDITOGOV_API_PORTA: "4000",
      CREDITOGOV_CONFIAR_PROXY: "1",
    });
    expect(c.apiPorta).toBe(4000);
    expect(c.confiarProxy).toBe(1);
  });

  test("aceita homologacao e o adaptador arquivo", () => {
    const c = carregarConfig({
      ...base(),
      CREDITOGOV_AMBIENTE: "homologacao",
      CREDITOGOV_EMAIL: "arquivo",
    });
    expect(c.ambiente).toBe("homologacao");
    expect(c.email).toBe("arquivo");
  });
});

describe("config: obrigatórias (CA-4)", () => {
  const obrigatorias = [
    "CREDITOGOV_AMBIENTE",
    "CREDITOGOV_BANCO_URL",
    "CREDITOGOV_SESSAO_SEGREDO",
    "CREDITOGOV_WEB_URL",
    "CREDITOGOV_EMAIL",
  ];

  test.each(obrigatorias)("ausência de %s cita o nome e nenhum valor", (nome) => {
    const env = base();
    delete env[nome];
    const msg = mensagemDoErro(env);
    expect(msg).toContain(nome);
    for (const [k, v] of Object.entries(env)) {
      expect(msg, `valor de ${k}`).not.toContain(v);
    }
  });

  test("valor vazio conta como ausente", () => {
    expect(mensagemDoErro({ ...base(), CREDITOGOV_BANCO_URL: "" })).toContain(
      "CREDITOGOV_BANCO_URL",
    );
  });
});

describe("config: validações", () => {
  test("segredo com menos de 32 bytes é recusado, sem mostrar o valor", () => {
    const curto = "curto-demais-ficticio";
    const msg = mensagemDoErro({ ...base(), CREDITOGOV_SESSAO_SEGREDO: curto });
    expect(msg).toContain("CREDITOGOV_SESSAO_SEGREDO");
    expect(msg).not.toContain(curto);
  });

  test("segredo de exatamente 32 bytes é aceito", () => {
    const c = carregarConfig({ ...base(), CREDITOGOV_SESSAO_SEGREDO: "a".repeat(32) });
    expect(c.sessaoSegredo.length).toBeGreaterThanOrEqual(32);
  });

  test("ambiente fora da lista é recusado", () => {
    const msg = mensagemDoErro({ ...base(), CREDITOGOV_AMBIENTE: "staging" });
    expect(msg).toContain("CREDITOGOV_AMBIENTE");
  });

  test("producao é recusado enquanto não há adaptador real de e-mail (CA-27)", () => {
    const msg = mensagemDoErro({ ...base(), CREDITOGOV_AMBIENTE: "producao" });
    expect(msg).toContain("producao");
    expect(msg).toContain("e-mail");
  });

  test("CREDITOGOV_EMAIL aceita só arquivo e memoria", () => {
    const msg = mensagemDoErro({ ...base(), CREDITOGOV_EMAIL: "smtp" });
    expect(msg).toContain("CREDITOGOV_EMAIL");
  });

  test("porta inválida é recusada", () => {
    expect(mensagemDoErro({ ...base(), CREDITOGOV_API_PORTA: "abc" })).toContain(
      "CREDITOGOV_API_PORTA",
    );
    expect(mensagemDoErro({ ...base(), CREDITOGOV_API_PORTA: "70000" })).toContain(
      "CREDITOGOV_API_PORTA",
    );
  });

  test("proxy aceita só um inteiro maior ou igual a 0 (número de saltos)", () => {
    for (const ruim of ["talvez", "true", "false", "-1", "1.5", "1e2"]) {
      expect(mensagemDoErro({ ...base(), CREDITOGOV_CONFIAR_PROXY: ruim })).toContain(
        "CREDITOGOV_CONFIAR_PROXY",
      );
    }
    expect(carregarConfig({ ...base(), CREDITOGOV_CONFIAR_PROXY: "0" }).confiarProxy).toBe(0);
    expect(carregarConfig({ ...base(), CREDITOGOV_CONFIAR_PROXY: "2" }).confiarProxy).toBe(2);
  });

  test("URL da web inválida é recusada", () => {
    expect(mensagemDoErro({ ...base(), CREDITOGOV_WEB_URL: "não é url" })).toContain(
      "CREDITOGOV_WEB_URL",
    );
  });
});
