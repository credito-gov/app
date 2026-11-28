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

describe("origem atrás de proxy, por endereço do proxy (CA-17, CA-26)", () => {
  test("sem a variável, X-Forwarded-For forjado não muda a chave de origem", async () => {
    ctx = await criarContexto();
    await ctx.login("a@exemplo.com.br", "senha errada qualquer", {
      ip: "10.0.0.5",
      headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2" },
    });
    const chaves = await origensGravadas(ctx);
    expect(chaves).toContain(chaveOrigem(SEGREDO, "10.0.0.5"));
    expect(chaves).not.toContain(chaveOrigem(SEGREDO, "1.1.1.1"));
    expect(chaves).not.toContain(chaveOrigem(SEGREDO, "2.2.2.2"));
  });

  test("com loopback e conexão vinda de 127.0.0.1, vale o endereço que o proxy acrescentou", async () => {
    ctx = await criarContexto({ confiarProxy: "loopback" });
    await ctx.login("a@exemplo.com.br", "senha errada qualquer", {
      ip: "127.0.0.1",
      headers: { "x-forwarded-for": "2.2.2.2" },
    });
    const chaves = await origensGravadas(ctx);
    expect(chaves).toContain(chaveOrigem(SEGREDO, "2.2.2.2"));
    expect(chaves).not.toContain(chaveOrigem(SEGREDO, "127.0.0.1"));
  });

  test("com loopback e conexão de endereço que não é loopback, o cabeçalho é ignorado", async () => {
    ctx = await criarContexto({ confiarProxy: "loopback" });
    await ctx.login("a@exemplo.com.br", "senha errada qualquer", {
      ip: "10.0.0.5",
      headers: { "x-forwarded-for": "1.1.1.1" },
    });
    const chaves = await origensGravadas(ctx);
    expect(chaves).toContain(chaveOrigem(SEGREDO, "10.0.0.5"));
    expect(chaves).not.toContain(chaveOrigem(SEGREDO, "1.1.1.1"));
  });

  test("com loopback, um cliente forjando cabeçalho atrás do proxy não escolhe a própria origem", async () => {
    ctx = await criarContexto({ confiarProxy: "loopback" });
    await ctx.login("a@exemplo.com.br", "senha errada qualquer", {
      ip: "127.0.0.1",
      headers: { "x-forwarded-for": "9.9.9.9, 2.2.2.2" },
    });
    const chaves = await origensGravadas(ctx);
    expect(chaves).toContain(chaveOrigem(SEGREDO, "2.2.2.2"));
    expect(chaves).not.toContain(chaveOrigem(SEGREDO, "9.9.9.9"));
  });

  test("com CIDR, confia só nos endereços da faixa", async () => {
    ctx = await criarContexto({ confiarProxy: "10.0.0.0/24, 192.168.1.1" });
    await ctx.login("a@exemplo.com.br", "senha errada qualquer", {
      ip: "10.0.0.5",
      headers: { "x-forwarded-for": "2.2.2.2" },
    });
    expect(await origensGravadas(ctx)).toContain(chaveOrigem(SEGREDO, "2.2.2.2"));
  });

  const CIDR_E_UNICO = "10.0.0.0/24, 192.168.1.1";

  test.each(["10.0.1.5", "192.168.1.2"])(
    "com CIDR, conexão de %s (fora da faixa e do endereço único) mantém o próprio endereço como origem",
    async (ip) => {
      ctx = await criarContexto({ confiarProxy: CIDR_E_UNICO });
      await ctx.login("a@exemplo.com.br", "senha errada qualquer", { ip, headers: { "x-forwarded-for": "2.2.2.2" } });
      const chaves = await origensGravadas(ctx);
      expect(chaves).toContain(chaveOrigem(SEGREDO, ip));
      expect(chaves).not.toContain(chaveOrigem(SEGREDO, "2.2.2.2"));
    },
  );

  test("com CIDR, conexão do endereço único 192.168.1.1 é proxy confiável: vale o endereço do cabeçalho", async () => {
    ctx = await criarContexto({ confiarProxy: CIDR_E_UNICO });
    await ctx.login("a@exemplo.com.br", "senha errada qualquer", {
      ip: "192.168.1.1",
      headers: { "x-forwarded-for": "2.2.2.2" },
    });
    const chaves = await origensGravadas(ctx);
    expect(chaves).toContain(chaveOrigem(SEGREDO, "2.2.2.2"));
    expect(chaves).not.toContain(chaveOrigem(SEGREDO, "192.168.1.1"));
  });
});
