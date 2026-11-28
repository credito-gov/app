import { randomUUID } from "node:crypto";
import { sql } from "kysely";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { criarContexto, MIN, type Contexto } from "./ajudas.js";

const DIA = 24 * 60 * MIN;

let ctx: Contexto;
let A: string;
let B: string;
const u: Record<string, { id: string; cookie: string }> = {};

async function entrar(chave: string, empresas: [string, "titular" | "contador" | "colaborador"][], nome = chave) {
  const email = `${chave}@exemplo.com.br`;
  const id = await ctx.criarUsuario(email, nome);
  for (const [empresa, papel] of empresas) await ctx.vincular(empresa, id, papel);
  const r = await ctx.login(email);
  u[chave] = { id, cookie: r.cookie! };
}

beforeEach(async () => {
  ctx = await criarContexto();
  // A: titular, contador e colaborador. B: um titular. "multi" tem vínculo em A e B.
  A = await ctx.criarEmpresa("Comércio Exemplo Ltda.", "00000000");
  B = await ctx.criarEmpresa("Indústria Exemplo S.A.", "11111111");
  await entrar("titular", [[A, "titular"]], "Maria Titular");
  await entrar("contador", [[A, "contador"]], "Carlos Contador");
  await entrar("colaborador", [[A, "colaborador"]], "Carla Colaboradora");
  await entrar("titularb", [[B, "titular"]], "Beto Titular");
  await entrar("multi", [[B, "contador"], [A, "colaborador"]], "Marta Multi");
});
afterEach(async () => {
  await ctx.encerrar();
});

const get = (url: string, quem: string) => ctx.req("GET", url, { cookie: u[quem]!.cookie });
const remover = (empresa: string, quem: string, alvo: string) =>
  ctx.req("DELETE", `/api/empresas/${empresa}/vinculos/${alvo}`, { cookie: u[quem]!.cookie });

describe("empresas do usuário (CA-29, CA-30)", () => {
  test("usuário com vínculo em duas empresas vê as duas, por nome, com a raiz formatada e o papel", async () => {
    const r = await get("/api/empresas", "multi");
    expect(r.status).toBe(200);
    expect(r.corpo).toEqual([
      { id: A, nome: "Comércio Exemplo Ltda.", cnpjRaiz: "00000000", cnpjRaizFormatado: "00.000.000", papel: "colaborador" },
      { id: B, nome: "Indústria Exemplo S.A.", cnpjRaiz: "11111111", cnpjRaizFormatado: "11.111.111", papel: "contador" },
    ]);
  });

  test("a empresa de outro usuário não aparece, nem por contagem", async () => {
    const r = await get("/api/empresas", "titular");
    expect(r.corpo.map((e: { id: string }) => e.id)).toEqual([A]);
    expect(r.texto).not.toContain(B);
    expect(r.texto).not.toContain("Indústria");
  });

  test("o vínculo removido some", async () => {
    expect((await remover(A, "titular", u["contador"]!.id)).status).toBe(204);
    const r = await get("/api/empresas", "contador");
    expect(r.status).toBe(200);
    expect(r.corpo).toEqual([]);
  });

  test("sem sessão dá 401", async () => {
    expect((await ctx.req("GET", "/api/empresas")).status).toBe(401);
  });
});

describe("empresa em foco (CA-33)", () => {
  test("GET /api/empresas/:id devolve a empresa com o papel do usuário", async () => {
    const r = await get(`/api/empresas/${A}`, "titular");
    expect(r.status).toBe(200);
    expect(r.corpo).toEqual({
      id: A,
      nome: "Comércio Exemplo Ltda.",
      cnpjRaiz: "00000000",
      cnpjRaizFormatado: "00.000.000",
      papel: "titular",
    });
  });

  test("empresa de outro, inexistente e id inválido dão o mesmo 404, com corpo idêntico", async () => {
    const deOutra = await get(`/api/empresas/${B}`, "titular");
    const inexistente = await get(`/api/empresas/${randomUUID()}`, "titular");
    const invalido = await get("/api/empresas/abc", "titular");
    for (const r of [deOutra, inexistente, invalido]) {
      expect(r.status).toBe(404);
      expect(r.corpo).toEqual({ erro: "empresa_nao_encontrada", mensagem: "Empresa não encontrada ou sem acesso." });
    }
    expect(deOutra.texto).toBe(inexistente.texto);
    expect(deOutra.texto).toBe(invalido.texto);
  });

  test("a mesma regra vale para pessoas e remoção", async () => {
    expect((await get(`/api/empresas/${B}/pessoas`, "titular")).status).toBe(404);
    expect((await get("/api/empresas/abc/pessoas", "titular")).status).toBe(404);
    expect((await remover(B, "titular", u["titularb"]!.id)).status).toBe(404);
  });

  test("sem sessão dá 401, antes de qualquer 404", async () => {
    expect((await ctx.req("GET", `/api/empresas/${A}`)).status).toBe(401);
  });
});

describe("pessoas da empresa (CA-8, CA-9, CA-34)", () => {
  test("traz os vínculos ativos, com nome, e-mail, papel e desde", async () => {
    const r = await get(`/api/empresas/${A}/pessoas`, "titular");
    expect(r.status).toBe(200);
    const porNome = Object.fromEntries(r.corpo.vinculos.map((v: { nome: string }) => [v.nome, v]));
    expect(Object.keys(porNome).sort()).toEqual(["Carla Colaboradora", "Carlos Contador", "Maria Titular", "Marta Multi"]);
    expect(porNome["Carlos Contador"]).toEqual({
      usuarioId: u["contador"]!.id,
      nome: "Carlos Contador",
      email: "contador@exemplo.com.br",
      papel: "contador",
      desde: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
  });

  test("não mostra vínculo removido", async () => {
    await remover(A, "titular", u["contador"]!.id);
    const r = await get(`/api/empresas/${A}/pessoas`, "titular");
    expect(r.corpo.vinculos.map((v: { nome: string }) => v.nome)).not.toContain("Carlos Contador");
  });

  test("traz os convites pendentes e só eles", async () => {
    const convidar = (email: string) =>
      ctx.req("POST", `/api/empresas/${A}/convites`, { cookie: u["titular"]!.cookie, corpo: { email, papel: "colaborador" } });
    await convidar("pendente@exemplo.com.br");
    await convidar("trocado@exemplo.com.br");
    await convidar("trocado@exemplo.com.br"); // invalida o anterior
    const r = await get(`/api/empresas/${A}/pessoas`, "titular");
    const emails = r.corpo.convitesPendentes.map((c: { email: string }) => c.email).sort();
    expect(emails).toEqual(["pendente@exemplo.com.br", "trocado@exemplo.com.br"]);
    expect(r.corpo.convitesPendentes[0]).toEqual({
      id: expect.any(String),
      email: expect.any(String),
      papel: "colaborador",
      expiraEm: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
    ctx.relogio.avancar(7 * DIA + 1000);
    // vencidos saem (a sessão de teste também venceu: entra de novo)
    const novo = await ctx.login("titular@exemplo.com.br");
    const depois = await ctx.req("GET", `/api/empresas/${A}/pessoas`, { cookie: novo.cookie });
    expect(depois.corpo.convitesPendentes).toEqual([]);
  });

  test.each([
    ["titular", ["titular", "contador", "colaborador"], true],
    ["contador", ["titular", "colaborador"], false],
    ["colaborador", [], false],
  ] as const)("podeConvidar e podeRemover de %s", async (quem, convida, remove) => {
    const r = await get(`/api/empresas/${A}/pessoas`, quem);
    expect(r.corpo.podeConvidar).toEqual(convida);
    expect(r.corpo.podeRemover).toBe(remove);
  });
});

describe("remoção de vínculo (CA-34)", () => {
  test("o titular remove o contador (204), sem apagar a linha", async () => {
    const r = await remover(A, "titular", u["contador"]!.id);
    expect(r.status).toBe(204);
    const linhas = await ctx.banco.naEmpresa(u["titular"]!.id, A, (trx) =>
      trx.selectFrom("vinculo_empresa").select(["removido_em", "removido_por"]).where("usuario_id", "=", u["contador"]!.id).execute(),
    );
    expect(linhas).toHaveLength(1);
    expect(linhas[0]!.removido_em).toBeInstanceOf(Date);
    expect(linhas[0]!.removido_por).toBe(u["titular"]!.id);
  });

  test("contador e colaborador recebem 403", async () => {
    for (const quem of ["contador", "colaborador"]) {
      const r = await remover(A, quem, u["multi"]!.id);
      expect(r.status).toBe(403);
      expect(r.corpo.erro).toBe("papel_nao_permitido");
    }
    expect((await get(`/api/empresas/${A}/pessoas`, "titular")).corpo.vinculos).toHaveLength(4);
  });

  test("o último titular não sai: 409 ultimo_titular", async () => {
    const r = await remover(A, "titular", u["titular"]!.id);
    expect(r.status).toBe(409);
    expect(r.corpo.erro).toBe("ultimo_titular");
    expect((await get(`/api/empresas/${A}`, "titular")).status).toBe(200);
  });

  test("com dois titulares, um pode sair", async () => {
    await entrar("titular2", [[A, "titular"]], "Tânia Titular");
    expect((await remover(A, "titular", u["titular2"]!.id)).status).toBe(204);
    expect((await remover(A, "titular", u["titular"]!.id)).status).toBe(409);
  });

  test("com a sessão do removido aberta, a requisição seguinte à empresa dá 404", async () => {
    expect((await get(`/api/empresas/${A}`, "contador")).status).toBe(200);
    await remover(A, "titular", u["contador"]!.id);
    const r = await get(`/api/empresas/${A}`, "contador");
    expect(r.status).toBe(404);
    expect(r.corpo.erro).toBe("empresa_nao_encontrada");
    expect((await get(`/api/empresas/${A}/pessoas`, "contador")).status).toBe(404);
  });

  test("alvo sem vínculo ativo ou id inválido dá 404 vinculo_nao_encontrado", async () => {
    const semVinculo = await remover(A, "titular", u["titularb"]!.id);
    expect(semVinculo.status).toBe(404);
    expect(semVinculo.corpo.erro).toBe("vinculo_nao_encontrado");
    const invalido = await remover(A, "titular", "abc");
    expect(invalido.status).toBe(404);
    expect(invalido.corpo.erro).toBe("vinculo_nao_encontrado");
  });

  test("duas remoções simultâneas dos dois únicos titulares deixam pelo menos um", async () => {
    const C = await ctx.criarEmpresa("Serviços Exemplo ME", "00000002");
    await entrar("x", [[C, "titular"]]);
    await entrar("y", [[C, "titular"]]);
    const [r1, r2] = await Promise.all([remover(C, "x", u["y"]!.id), remover(C, "y", u["x"]!.id)]);
    const status = [r1.status, r2.status].sort();
    expect(status[0]).toBe(204);
    expect([404, 409]).toContain(status[1]);
    const ativos = await ctx.migracao.transaction().execute(async (trx) => {
      await sql`select set_config('app.empresas', ${`{${C}}`}, true)`.execute(trx);
      return (await sql<{ n: string }>`select count(*)::text as n from vinculo_empresa where papel = 'titular' and removido_em is null`.execute(trx)).rows[0]!.n;
    });
    expect(ativos).toBe("1");
  });
});
