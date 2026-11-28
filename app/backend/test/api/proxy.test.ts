// A chave de origem do limite (CA-17, CA-26) não pode ser forjada por X-Forwarded-For.
import { afterEach, describe, expect, test } from "vitest";
import { chaveOrigem } from "../../src/autenticacao/limite.js";
import { criarContexto, SEGREDO, type Contexto } from "./ajudas.js";

let ctx: Contexto;
afterEach(async () => {
  await ctx.encerrar();
});

async function origensGravadas(c: Contexto): Promise<string[]> {
  const linhas = await c.migracao.selectFrom("falha_acesso").select("chave_hmac").execute();
  return linhas.map((l) => l.chave_hmac);
}

describe("origem atrás de proxy (CA-17, CA-26)", () => {
  test("sem confiar no proxy (0), X-Forwarded-For forjado não muda a chave de origem", async () => {
    ctx = await criarContexto({ confiarProxy: 0 });
    await ctx.login("a@exemplo.com.br", "senha errada qualquer", {
      ip: "10.0.0.5",
      headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2" },
    });
    const chaves = await origensGravadas(ctx);
    expect(chaves).toContain(chaveOrigem(SEGREDO, "10.0.0.5"));
    expect(chaves).not.toContain(chaveOrigem(SEGREDO, "1.1.1.1"));
    expect(chaves).not.toContain(chaveOrigem(SEGREDO, "2.2.2.2"));
  });

  test("padrão (sem a variável) equivale a não confiar", async () => {
    ctx = await criarContexto();
    await ctx.login("a@exemplo.com.br", "senha errada qualquer", {
      ip: "10.0.0.5",
      headers: { "x-forwarded-for": "1.1.1.1" },
    });
    expect(await origensGravadas(ctx)).toContain(chaveOrigem(SEGREDO, "10.0.0.5"));
  });

  test("com 1 salto, a chave é o endereço que o proxy acrescentou (o mais à direita)", async () => {
    ctx = await criarContexto({ confiarProxy: 1 });
    await ctx.login("a@exemplo.com.br", "senha errada qualquer", {
      ip: "10.0.0.5",
      headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2" },
    });
    const chaves = await origensGravadas(ctx);
    expect(chaves).toContain(chaveOrigem(SEGREDO, "2.2.2.2"));
    expect(chaves).not.toContain(chaveOrigem(SEGREDO, "1.1.1.1"));
    expect(chaves).not.toContain(chaveOrigem(SEGREDO, "10.0.0.5"));
  });
});
