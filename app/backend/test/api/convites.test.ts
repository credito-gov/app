import { sql } from "kysely";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { criarContexto, MIN, SENHA_BOA, type Contexto } from "./ajudas.js";

const DIA = 24 * 60 * MIN;

let ctx: Contexto;
let A: string;
let B: string;
let titA: string;
let colA: string;
// cookies de sessão
let cTitA: string;
let cContA: string;
let cColA: string;

async function entrar(email: string, empresa: string | null, papel: "titular" | "contador" | "colaborador", nome = "Pessoa Exemplo") {
  const id = await ctx.criarUsuario(email, nome);
  if (empresa) await ctx.vincular(empresa, id, papel);
  const r = await ctx.login(email);
  return { id, cookie: r.cookie! };
}

beforeEach(async () => {
  ctx = await criarContexto();
  A = await ctx.criarEmpresa("Comércio Exemplo Ltda.", "11111111");
  B = await ctx.criarEmpresa("Indústria Exemplo S.A.", "22222222");
  const t = await entrar("titular-a@exemplo.com.br", A, "titular", "Maria Titular");
  const c = await entrar("contador-a@exemplo.com.br", A, "contador", "Carlos Contador");
  const k = await entrar("colaborador-a@exemplo.com.br", A, "colaborador", "Carla Colaboradora");
  titA = t.id;
  colA = k.id;
  cTitA = t.cookie;
  cContA = c.cookie;
  cColA = k.cookie;
});
afterEach(async () => {
  await ctx.encerrar();
});

const convidar = (empresa: string, cookie: string, email: string, papel: string, extra: object = {}) =>
  ctx.req("POST", `/api/empresas/${empresa}/convites`, { cookie, corpo: { email, papel, ...extra } });

/** Link do último e-mail enviado. */
function ultimoLink(): { empresaId: string; token: string } {
  const msg = ctx.email.mensagens.at(-1)!;
  const m = /#e=([0-9a-f-]{36})&t=([A-Za-z0-9_-]+)/.exec(msg.texto)!;
  return { empresaId: m[1]!, token: m[2]! };
}

const consultar = (l: { empresaId: string; token: string }) =>
  ctx.req("POST", "/api/convites/consultar", { corpo: l });
const aceitar = (l: { empresaId: string; token: string }, extra: object, opcoes: { cookie?: string } = {}) =>
  ctx.req("POST", "/api/convites/aceitar", { corpo: { ...l, ...extra }, ...opcoes });

async function convitesDe(empresa: string) {
  return ctx.migracao.transaction().execute(async (trx) => {
    await sql`select set_config('app.empresas', ${`{${empresa}}`}, true)`.execute(trx);
    return (await sql<Record<string, any>>`select * from convite order by criado_em, id`.execute(trx)).rows;
  });
}
const contar = async (tabela: string) =>
  Number((await sql<{ n: string }>`select count(*)::text as n from ${sql.table(tabela)}`.execute(ctx.migracao)).rows[0]?.n);

describe("quem pode convidar (CA-8)", () => {
  const tabela: [string, "titular" | "contador" | "colaborador", boolean][] = [
    ["titular", "titular", true],
    ["titular", "contador", true],
    ["titular", "colaborador", true],
    ["contador", "titular", true],
    ["contador", "contador", false],
    ["contador", "colaborador", true],
    ["colaborador", "titular", false],
    ["colaborador", "contador", false],
    ["colaborador", "colaborador", false],
  ];

  test.each(tabela)("%s convida %s: %s", async (quem, convidado, permitido) => {
    const cookie = { titular: cTitA, contador: cContA, colaborador: cColA }[quem]!;
    const r = await convidar(A, cookie, `novo-${quem}-${convidado}@exemplo.com.br`, convidado);
    if (permitido) {
      expect(r.status).toBe(202);
      expect(r.corpo).toEqual({ mensagem: "Convite enviado" });
      expect(ctx.email.mensagens).toHaveLength(1);
    } else {
      expect(r.status).toBe(403);
      expect(r.corpo.erro).toBe("papel_nao_permitido");
      expect(ctx.email.mensagens).toHaveLength(0);
      expect(await convitesDe(A)).toHaveLength(0);
    }
  });

  test("o e-mail diz quem convidou, a empresa e o papel", async () => {
    await convidar(A, cTitA, "novo@exemplo.com.br", "contador");
    const msg = ctx.email.mensagens[0]!;
    expect(msg.para).toBe("novo@exemplo.com.br");
    expect(msg.texto).toContain("Maria Titular");
    expect(msg.texto).toContain("Comércio Exemplo Ltda.");
    expect(msg.texto).toContain("contador");
  });

  test("convite para empresa em que o usuário não tem vínculo dá 404", async () => {
    const r = await convidar(B, cTitA, "novo@exemplo.com.br", "colaborador");
    expect(r.status).toBe(404);
    expect(r.corpo.erro).toBe("empresa_nao_encontrada");
    expect(ctx.email.mensagens).toHaveLength(0);
  });

  test("papel forjado no corpo não muda a permissão", async () => {
    const r = await convidar(A, cColA, "novo@exemplo.com.br", "colaborador", { meuPapel: "titular", papelDoUsuario: "titular" });
    expect(r.status).toBe(403);
    const r2 = await convidar(A, cContA, "outro@exemplo.com.br", "contador", { meuPapel: "titular" });
    expect(r2.status).toBe(403);
  });

  test("papel inexistente e e-mail inválido dão 400 entrada_invalida", async () => {
    const r = await convidar(A, cTitA, "novo@exemplo.com.br", "administrador");
    expect(r.status).toBe(400);
    expect(r.corpo.erro).toBe("entrada_invalida");
    const r2 = await convidar(A, cTitA, "isto-nao-e-email", "colaborador");
    expect(r2.status).toBe(400);
    expect(r2.corpo.campos.map((c: { campo: string }) => c.campo)).toContain("email");
  });

  test("sem sessão dá 401", async () => {
    const r = await ctx.req("POST", `/api/empresas/${A}/convites`, { corpo: { email: "novo@exemplo.com.br", papel: "colaborador" } });
    expect(r.status).toBe(401);
  });
});

describe("convite repetido e e-mail com ou sem conta (CA-9)", () => {
  test("e-mail com vínculo ativo dá 409 ja_vinculado", async () => {
    const r = await convidar(A, cTitA, "contador-a@exemplo.com.br", "colaborador");
    expect(r.status).toBe(409);
    expect(r.corpo.erro).toBe("ja_vinculado");
    expect(ctx.email.mensagens).toHaveLength(0);
  });

  test("segundo convite para o mesmo e-mail invalida o primeiro", async () => {
    await convidar(A, cTitA, "novo@exemplo.com.br", "colaborador");
    const antigo = ultimoLink();
    await convidar(A, cTitA, "novo@exemplo.com.br", "contador");
    const novo = ultimoLink();
    expect(novo.token).not.toBe(antigo.token);
    expect((await consultar(antigo)).status).toBe(410);
    const ok = await consultar(novo);
    expect(ok.status).toBe(200);
    expect(ok.corpo.papel).toBe("contador");
  });

  test("e-mail com conta e sem conta recebem respostas idênticas", async () => {
    await ctx.criarUsuario("ja-tem-conta@exemplo.com.br");
    const com = await convidar(A, cTitA, "ja-tem-conta@exemplo.com.br", "colaborador");
    const sem = await convidar(A, cTitA, "sem-conta@exemplo.com.br", "colaborador");
    expect(com.status).toBe(202);
    expect(sem.status).toBe(202);
    expect(com.corpo).toEqual(sem.corpo);
  });

  test("vínculo removido não impede novo convite", async () => {
    await ctx.migracao.transaction().execute(async (trx) => {
      await sql`select set_config('app.empresas', ${`{${A}}`}, true)`.execute(trx);
      await sql`update vinculo_empresa set removido_em = now() where usuario_id = ${colA}`.execute(trx);
    });
    expect((await convidar(A, cTitA, "colaborador-a@exemplo.com.br", "colaborador")).status).toBe(202);
  });
});

describe("registro do convite (CA-10)", () => {
  test("grava quem convidou, origem, datas e nenhum token", async () => {
    await convidar(A, cTitA, "novo@exemplo.com.br", "colaborador");
    const link = ultimoLink();
    const [c] = await convitesDe(A);
    expect(c!["criado_por"]).toBe(titA);
    expect(c!["origem"]).toBe("usuario");
    expect(c!["criado_em"]).toBeInstanceOf(Date);
    expect(c!["usado_em"]).toBeNull();
    expect(c!["aceito_por"]).toBeNull();
    expect(JSON.stringify(c)).not.toContain(link.token);
    expect(c!["expira_em"].getTime() - c!["criado_em"].getTime()).toBe(7 * DIA);

    const r = await aceitar(link, { nome: "Nova Pessoa", senha: SENHA_BOA });
    expect(r.status).toBe(200);
    const [depois] = await convitesDe(A);
    expect(depois!["usado_em"]).toBeInstanceOf(Date);
    expect(depois!["aceito_por"]).toBe(r.corpo.usuario.id);
    expect(JSON.stringify(depois)).not.toContain(link.token);
  });
});

describe("aceitar sem conta (CA-11)", () => {
  test("consultar mostra empresa, papel, e-mail mascarado e contaExistente false", async () => {
    await convidar(A, cTitA, "novo@exemplo.com.br", "contador");
    const r = await consultar(ultimoLink());
    expect(r.status).toBe(200);
    expect(r.corpo).toEqual({
      empresa: { nome: "Comércio Exemplo Ltda.", cnpjRaizFormatado: "11.111.111" },
      papel: "contador",
      emailMascarado: "n***@exemplo.com.br",
      contaExistente: false,
    });
    expect(r.texto).not.toContain("novo@exemplo.com.br");
  });

  test("aceitar com nome e senha cria usuário, identidade e vínculo, marca o convite e devolve o cookie", async () => {
    await convidar(A, cTitA, "novo@exemplo.com.br", "contador");
    const link = ultimoLink();
    const usuarios = await contar("usuario");
    const r = await aceitar(link, { nome: "Nova Pessoa", senha: SENHA_BOA });
    expect(r.status).toBe(200);
    expect(r.cookie).toBeTruthy();
    expect(r.corpo.usuario.nome).toBe("Nova Pessoa");
    expect(r.corpo.empresas).toEqual([
      { id: A, nome: "Comércio Exemplo Ltda.", cnpjRaiz: "11111111", cnpjRaizFormatado: "11.111.111", papel: "contador" },
    ]);
    expect(await contar("usuario")).toBe(usuarios + 1);
    const ident = await sql<{ provedor: string; sujeito: string; hash_senha: string }>`
      select provedor, sujeito, hash_senha from identidade where sujeito = 'novo@exemplo.com.br'`.execute(ctx.migracao);
    expect(ident.rows[0]?.provedor).toBe("senha");
    expect(ident.rows[0]?.hash_senha.startsWith("$argon2id$")).toBe(true);
    // a sessão devolvida funciona e a senha entra no login
    expect((await ctx.req("GET", "/api/sessao", { cookie: r.cookie })).status).toBe(200);
    expect((await ctx.login("novo@exemplo.com.br")).status).toBe(200);
    // o link não vale de novo
    expect((await consultar(link)).status).toBe(410);
  });

  test("sem nome, o servidor pede o campo nome", async () => {
    await convidar(A, cTitA, "novo@exemplo.com.br", "contador");
    const r = await aceitar(ultimoLink(), { senha: SENHA_BOA });
    expect(r.status).toBe(400);
    expect(r.corpo.erro).toBe("entrada_invalida");
    expect(r.corpo.campos.map((c: { campo: string }) => c.campo)).toContain("nome");
  });
});

describe("aceitar com conta (CA-12)", () => {
  async function conviteParaContador() {
    const r = await convidar(B, (await entrar("titular-b@exemplo.com.br", B, "titular")).cookie, "contador-a@exemplo.com.br", "contador");
    expect(r.status).toBe(202);
    return ultimoLink();
  }

  test("o contador com conta aceita o convite da outra empresa com a senha atual, sem mudar o hash", async () => {
    const link = await conviteParaContador();
    const consulta = await consultar(link);
    expect(consulta.corpo.contaExistente).toBe(true);
    expect(consulta.corpo.emailMascarado).toBe("c***@exemplo.com.br");
    const antes = (await sql<{ hash_senha: string }>`select hash_senha from identidade where sujeito = 'contador-a@exemplo.com.br'`.execute(ctx.migracao)).rows[0]!.hash_senha;

    const r = await aceitar(link, { senha: SENHA_BOA });
    expect(r.status).toBe(200);
    const depois = (await sql<{ hash_senha: string }>`select hash_senha from identidade where sujeito = 'contador-a@exemplo.com.br'`.execute(ctx.migracao)).rows[0]!.hash_senha;
    expect(depois).toBe(antes);
    expect(r.corpo.empresas.map((e: { id: string }) => e.id).sort()).toEqual([A, B].sort());
    const sessao = await ctx.req("GET", "/api/sessao", { cookie: r.cookie });
    expect(sessao.corpo.empresas.map((e: { id: string }) => e.id).sort()).toEqual([A, B].sort());
  });

  test("depois de ter o vínculo removido, aceitar um convite novo funciona (CA-12)", async () => {
    const titularB = await entrar("titular-b@exemplo.com.br", B, "titular");
    const primeiro = await convidar(B, titularB.cookie, "contador-a@exemplo.com.br", "contador");
    expect(primeiro.status).toBe(202);
    expect((await aceitar(ultimoLink(), { senha: SENHA_BOA })).status).toBe(200);
    const alvo = (await sql<{ id: string }>`select id from usuario where email_normalizado = 'contador-a@exemplo.com.br'`.execute(ctx.migracao)).rows[0]!.id;
    expect((await ctx.req("DELETE", `/api/empresas/${B}/vinculos/${alvo}`, { cookie: titularB.cookie })).status).toBe(204);

    expect((await convidar(B, titularB.cookie, "contador-a@exemplo.com.br", "contador")).status).toBe(202);
    const deNovo = await aceitar(ultimoLink(), { senha: SENHA_BOA });
    expect(deNovo.status).toBe(200);
    expect(deNovo.corpo.empresas.map((e: { id: string }) => e.id)).toContain(B);
  });

  test("aceitar com um cookie anterior válido troca a sessão: a antiga deixa de valer (CA-22)", async () => {
    const link = await conviteParaContador();
    const antigo = (await ctx.login("contador-a@exemplo.com.br")).cookie!;
    expect((await ctx.req("GET", "/api/sessao", { cookie: antigo })).status).toBe(200);
    const r = await aceitar(link, { senha: SENHA_BOA }, { cookie: antigo });
    expect(r.status).toBe(200);
    expect(r.cookie).toBeTruthy();
    expect(r.cookie).not.toBe(antigo);
    expect((await ctx.req("GET", "/api/sessao", { cookie: antigo })).status).toBe(401);
    expect((await ctx.req("GET", "/api/sessao", { cookie: r.cookie })).status).toBe(200);
  });

  test("senha errada dá 401 credencial_invalida, não consome o convite e conta no limite", async () => {
    const link = await conviteParaContador();
    const r = await aceitar(link, { senha: "senha errada ficticia" });
    expect(r.status).toBe(401);
    expect(r.corpo.erro).toBe("credencial_invalida");
    expect((await consultar(link)).status).toBe(200);
    for (let i = 0; i < 4; i++) await aceitar(link, { senha: "senha errada ficticia" });
    const bloqueado = await aceitar(link, { senha: SENHA_BOA });
    expect(bloqueado.status).toBe(429);
    expect(bloqueado.corpo.erro).toBe("muitas_tentativas");
  });
});

describe("convite que não vale (CA-13)", () => {
  async function novoConvite() {
    await convidar(A, cTitA, "novo@exemplo.com.br", "colaborador");
    return ultimoLink();
  }
  async function semEfeito(link: { empresaId: string; token: string }) {
    const antes = [await contar("usuario"), await contar("identidade"), await contar("vinculo_empresa")];
    for (const r of [await consultar(link), await aceitar(link, { nome: "Nova Pessoa", senha: SENHA_BOA })]) {
      expect(r.status).toBe(410);
      expect(r.corpo.erro).toBe("convite_invalido");
    }
    expect([await contar("usuario"), await contar("identidade"), await contar("vinculo_empresa")]).toEqual(antes);
  }

  test("vencido (7 dias e 1 segundo)", async () => {
    const link = await novoConvite();
    ctx.relogio.avancar(7 * DIA + 1000);
    await semEfeito(link);
  });

  test("no último instante ainda vale", async () => {
    const link = await novoConvite();
    ctx.relogio.avancar(7 * DIA - 1000);
    expect((await consultar(link)).status).toBe(200);
  });

  test("usado", async () => {
    const link = await novoConvite();
    expect((await aceitar(link, { nome: "Nova Pessoa", senha: SENHA_BOA })).status).toBe(200);
    await semEfeito(link);
  });

  test("invalidado por um convite novo", async () => {
    const link = await novoConvite();
    await convidar(A, cTitA, "novo@exemplo.com.br", "contador");
    await semEfeito(link);
  });

  test("token alterado", async () => {
    const link = await novoConvite();
    const t = link.token;
    await semEfeito({ ...link, token: (t[0] === "a" ? "b" : "a") + t.slice(1) });
  });

  test("empresaId de outra empresa", async () => {
    const link = await novoConvite();
    await semEfeito({ ...link, empresaId: B });
  });

  test("empresaId que não é uuid dá o mesmo 410", async () => {
    const link = await novoConvite();
    const r = await consultar({ ...link, empresaId: "abc" });
    expect(r.status).toBe(410);
    expect(r.corpo.erro).toBe("convite_invalido");
  });

  test("a resposta é a mesma em todos os casos", async () => {
    const link = await novoConvite();
    const a = await consultar({ ...link, token: "x".repeat(43) });
    const b = await consultar({ ...link, empresaId: B });
    expect(a.corpo).toEqual(b.corpo);
  });
});

describe("senha do convite (CA-14)", () => {
  test("11 caracteres dão 400 senha_invalida com a regra, e o convite continua valendo", async () => {
    await convidar(A, cTitA, "novo@exemplo.com.br", "colaborador");
    const link = ultimoLink();
    const curta = "a1b2c3d4e5f";
    const usuarios = await contar("usuario");
    const r = await aceitar(link, { nome: "Nova Pessoa", senha: curta });
    expect(r.status).toBe(400);
    expect(r.corpo.erro).toBe("senha_invalida");
    expect(r.corpo.regra).toBe("tamanho_minimo");
    expect(typeof r.corpo.mensagem).toBe("string");
    expect(r.corpo.mensagem.length).toBeGreaterThan(0);
    expect(r.texto).not.toContain(curta);
    expect(await contar("usuario")).toBe(usuarios);
    expect((await consultar(link)).status).toBe(200);
  });

  test("senha comum dá 400 senha_invalida com a regra senha_comum", async () => {
    await convidar(A, cTitA, "novo@exemplo.com.br", "colaborador");
    const r = await aceitar(ultimoLink(), { nome: "Nova Pessoa", senha: "1qaz2wsx3edc" });
    expect(r.status).toBe(400);
    expect(r.corpo.regra).toBe("senha_comum");
  });

  test("senha longa demais dá 400 senha_invalida tamanho_maximo", async () => {
    await convidar(A, cTitA, "novo@exemplo.com.br", "colaborador");
    const r = await aceitar(ultimoLink(), { nome: "Nova Pessoa", senha: "abcd".repeat(33) });
    expect(r.status).toBe(400);
    expect(r.corpo.erro).toBe("senha_invalida");
    expect(r.corpo.regra).toBe("tamanho_maximo");
  });
});
