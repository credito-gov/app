// GET /api/carteira (CA-C1, CA-C4; DT-9; AD-6): uma linha por empresa do usuário, sem total.
import { Writable } from "node:stream";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { criarComandosAdmin } from "../../src/admin/comandos.js";
import { indicadoresDeCredito } from "../../src/indicadores/creditos.js";
import { notasDoCenario } from "../apoio/notas.js";
import { criarContexto, type Contexto } from "./ajudas.js";

let ctx: Contexto;
let linhasDeLog: string[];
const empresa: Record<string, { id: string; raiz: string; nome: string }> = {};
const usuario: Record<string, { id: string; cookie: string }> = {};

const get = (cookie: string | null) => ctx.req("GET", "/api/carteira", { cookie });
const esperadoDe = (c: string) => notasDoCenario(c, "creditos", empresa[c]!.raiz, { agora: ctx.relogio.agora(), semente: 1 });

async function novaEmpresa(admin: ReturnType<typeof criarComandosAdmin>, cenario: string, nome: string, raiz: string) {
  const id = await ctx.criarEmpresa(nome, raiz);
  empresa[cenario] = { id, raiz, nome };
  await admin.carregarCenario({ empresaId: id, cenario });
  return id;
}

async function novoUsuario(chave: string) {
  const email = `${chave}@exemplo.com.br`;
  const id = await ctx.criarUsuario(email, chave);
  usuario[chave] = { id, cookie: (await ctx.login(email)).cookie! };
  return id;
}

beforeAll(async () => {
  linhasDeLog = [];
  const stream = new Writable({
    write(chunk, _enc, cb) {
      linhasDeLog.push(String(chunk));
      cb();
    },
  });
  ctx = await criarContexto({ log: { stream } });
  const admin = criarComandosAdmin({ banco: ctx.banco, email: ctx.email, relogio: () => ctx.relogio.agora(), config: ctx.config });
  // Os nomes estão fora de ordem de propósito.
  await novaEmpresa(admin, "vazio", "Zeta Exemplo Ltda.", "31000002");
  await novaEmpresa(admin, "completo", "Beta Exemplo Ltda.", "31000001");
  await novaEmpresa(admin, "falha-com-anteriores", "Alfa Exemplo Ltda.", "31000003");
  await novaEmpresa(admin, "outros-valores", "Outra Exemplo Ltda.", "31000004");
  await novaEmpresa(admin, "sem-consulta", "Removida Exemplo Ltda.", "31000005");

  const contador = await novoUsuario("contador");
  const titular = await novoUsuario("titular");
  const dois = await novoUsuario("dois");
  await novoUsuario("sem-vinculo");
  const dono = await novoUsuario("dono-removida");
  await ctx.vincular(empresa["vazio"]!.id, contador, "contador");
  await ctx.vincular(empresa["completo"]!.id, contador, "contador");
  await ctx.vincular(empresa["falha-com-anteriores"]!.id, contador, "colaborador");
  await ctx.vincular(empresa["outros-valores"]!.id, titular, "titular");
  await ctx.vincular(empresa["completo"]!.id, dois, "titular");
  await ctx.vincular(empresa["vazio"]!.id, dois, "titular");
  await ctx.vincular(empresa["sem-consulta"]!.id, dono, "titular");
  await ctx.vincular(empresa["sem-consulta"]!.id, contador, "colaborador");
}, 120_000);

afterAll(async () => {
  await ctx?.encerrar();
});

describe("CA-C1: a carteira do usuário", () => {
  test("traz as empresas dele, ordenadas por nome, cada uma com os próprios valores como string e o resumo", async () => {
    const r = await get(usuario["contador"]!.cookie);
    expect(r.status).toBe(200);
    const nomes = r.corpo.empresas.map((e: { nome: string }) => e.nome);
    expect(nomes).toEqual(["Alfa Exemplo Ltda.", "Beta Exemplo Ltda.", "Removida Exemplo Ltda.", "Zeta Exemplo Ltda."]);
    const porId = Object.fromEntries(r.corpo.empresas.map((e: { id: string }) => [e.id, e]));

    const completo = porId[empresa["completo"]!.id];
    const i = indicadoresDeCredito(esperadoDe("completo"), empresa["completo"]!.raiz, null);
    if (i.semNotasNoRecorte) throw new Error("cenário sem notas");
    expect(completo.creditos).toEqual({
      estado: "com_dados",
      aApropriar: i.totais.aApropriar,
      apropriado: i.totais.apropriado,
      utilizado: i.totais.utilizado,
    });
    for (const v of [completo.creditos.aApropriar, completo.creditos.apropriado, completo.creditos.utilizado]) expect(typeof v).toBe("string");
    expect(completo).toMatchObject({ nome: "Beta Exemplo Ltda.", papel: "contador", cnpjRaizFormatado: "31.000.001" });
    expect(completo.situacao).toMatchObject({ resumo: "atualizado", diasSemConsulta: 1 });

    const vazio = porId[empresa["vazio"]!.id];
    expect(vazio.creditos).toEqual({ estado: "vazio", aApropriar: null, apropriado: null, utilizado: null });
    expect(vazio.papel).toBe("contador");

    const falha = porId[empresa["falha-com-anteriores"]!.id];
    expect(falha.papel).toBe("colaborador");
    expect(falha.creditos.estado).toBe("com_dados");
    expect(typeof falha.creditos.aApropriar).toBe("string");
    expect(falha.situacao.resumo).toBe("falhou");

    const semConsulta = porId[empresa["sem-consulta"]!.id];
    expect(semConsulta.creditos).toEqual({ estado: "sem_consulta", aApropriar: null, apropriado: null, utilizado: null });
    expect(semConsulta.situacao).toEqual({ resumo: "sem_consulta", ultimaConcluidaEm: null, diasSemConsulta: null });
  });

  test("uma empresa sem vínculo dele não aparece, e quem não tem vínculo recebe lista vazia", async () => {
    const r = await get(usuario["contador"]!.cookie);
    expect(r.corpo.empresas.map((e: { id: string }) => e.id)).not.toContain(empresa["outros-valores"]!.id);
    const vazia = await get(usuario["sem-vinculo"]!.cookie);
    expect(vazia.status).toBe(200);
    expect(vazia.corpo).toEqual({ empresas: [] });
  });

  test("um vínculo removido some da carteira", async () => {
    const antes = await get(usuario["contador"]!.cookie);
    expect(antes.corpo.empresas.map((e: { id: string }) => e.id)).toContain(empresa["sem-consulta"]!.id);
    const del = await ctx.req("DELETE", `/api/empresas/${empresa["sem-consulta"]!.id}/vinculos/${usuario["contador"]!.id}`, {
      cookie: usuario["dono-removida"]!.cookie,
    });
    expect(del.status).toBe(204);
    const depois = await get(usuario["contador"]!.cookie);
    expect(depois.corpo.empresas.map((e: { id: string }) => e.id)).not.toContain(empresa["sem-consulta"]!.id);
    expect(depois.corpo.empresas).toHaveLength(3);
  });

  test("sem sessão é 401", async () => {
    expect((await get(null)).status).toBe(401);
  });
});

describe("DT-9 (P-S5): qualquer papel vê a carteira", () => {
  test("um titular de duas empresas recebe as duas", async () => {
    const r = await get(usuario["dois"]!.cookie);
    expect(r.status).toBe(200);
    expect(r.corpo.empresas.map((e: { nome: string; papel: string }) => [e.nome, e.papel])).toEqual([
      ["Beta Exemplo Ltda.", "titular"],
      ["Zeta Exemplo Ltda.", "titular"],
    ]);
  });

  test("um colaborador também recebe a carteira", async () => {
    const r = await get(usuario["contador"]!.cookie);
    expect(r.corpo.empresas.some((e: { papel: string }) => e.papel === "colaborador")).toBe(true);
  });
});

describe("CA-C4: sem total", () => {
  test("a lista de chaves da resposta é exatamente a do contrato", async () => {
    const r = await get(usuario["contador"]!.cookie);
    expect(Object.keys(r.corpo)).toEqual(["empresas"]);
    for (const e of r.corpo.empresas) {
      expect(Object.keys(e).sort()).toEqual(["cnpjRaizFormatado", "creditos", "id", "nome", "papel", "situacao"]);
      expect(Object.keys(e.creditos).sort()).toEqual(["aApropriar", "apropriado", "estado", "utilizado"]);
      expect(Object.keys(e.situacao).sort()).toEqual(["diasSemConsulta", "resumo", "ultimaConcluidaEm"]);
    }
  });
});

describe("isolamento (AD-6)", () => {
  test("os dados de uma empresa de outro usuário não aparecem", async () => {
    const r = await get(usuario["titular"]!.cookie);
    expect(r.corpo.empresas).toHaveLength(1);
    expect(r.corpo.empresas[0].id).toBe(empresa["outros-valores"]!.id);
    const dele = JSON.stringify(r.corpo);
    for (const outra of ["completo", "vazio", "falha-com-anteriores"]) expect(dele).not.toContain(empresa[outra]!.id);
    const contador = await get(usuario["contador"]!.cookie);
    expect(JSON.stringify(contador.corpo)).not.toContain(empresa["outros-valores"]!.id);
  });
});

describe("cabeçalhos e log", () => {
  test("Cache-Control: no-store", async () => {
    const r = await get(usuario["contador"]!.cookie);
    expect(r.headers["cache-control"]).toBe("no-store");
  });

  test("o log não contém valor nem CNPJ", async () => {
    const antes = linhasDeLog.length;
    const r = await get(usuario["dois"]!.cookie);
    expect(r.status).toBe(200);
    const novas = linhasDeLog.slice(antes).join("");
    for (const e of Object.values(empresa)) expect(novas).not.toContain(e.raiz);
    for (const e of r.corpo.empresas) {
      for (const v of [e.creditos.aApropriar, e.creditos.apropriado, e.creditos.utilizado]) {
        if (typeof v === "string" && v !== "0.00") expect(novas).not.toContain(v);
      }
    }
  });
});
