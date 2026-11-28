// Rotas do dashboard (CA-1 a CA-25; AD-6): painel, pendências e notas de um grupo,
// com sessões da 034 e empresas carregadas pela função do carregar-cenario.
import { Writable } from "node:stream";
import Big from "big.js";
import { sql } from "kysely";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { criarComandosAdmin } from "../../src/admin/comandos.js";
import { indicadoresDeCredito, agruparPendentes } from "../../src/indicadores/creditos.js";
import { indicadoresDeDebito } from "../../src/indicadores/debitos.js";
import { periodosDisponiveis } from "../../src/indicadores/comum.js";
import { registrarLeitura } from "../../src/leitura/registrar.js";
import { semear } from "../banco/limpar.js";
import { notasDoCenario } from "../apoio/notas.js";
import { criarContexto, type Contexto, type Resposta } from "./ajudas.js";

const CENARIOS = [
  "completo",
  "sem-consulta",
  "em-andamento",
  "vazio",
  "parcial",
  "falha-com-anteriores",
  "desatualizado",
  "recusado",
  "outros-valores",
] as const;
type Cenario = (typeof CENARIOS)[number];

let ctx: Contexto;
let linhasDeLog: string[];
const empresa = {} as Record<Cenario, { id: string; raiz: string }>;
let cookieDeTodas: string;
let usuarioDeTodas: string;
let cookieSoCompleto: string;
let cookieSemVinculo: string;

const get = (url: string, cookie: string | null = cookieDeTodas) => ctx.req("GET", url, { cookie });
const painel = (c: Cenario, query = "") => get(`/api/empresas/${empresa[c].id}/painel${query}`);
const esperadoDe = (c: Cenario, servico: "creditos" | "debitos" = "creditos") =>
  notasDoCenario(c, servico, empresa[c].raiz, { agora: ctx.relogio.agora(), semente: 1 });

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
  usuarioDeTodas = await ctx.criarUsuario("todas@exemplo.com.br");
  const soCompleto = await ctx.criarUsuario("so-completo@exemplo.com.br");
  await ctx.criarUsuario("sem-vinculo@exemplo.com.br");
  let i = 0;
  for (const c of CENARIOS) {
    i++;
    const raiz = `3100000${i}`;
    const id = await ctx.criarEmpresa(`Empresa ${c} Exemplo`, raiz);
    empresa[c] = { id, raiz };
    await ctx.vincular(id, usuarioDeTodas, "titular");
    if (c === "completo") await ctx.vincular(id, soCompleto, "colaborador");
    await admin.carregarCenario({ empresaId: id, cenario: c });
  }
  cookieDeTodas = (await ctx.login("todas@exemplo.com.br")).cookie!;
  cookieSoCompleto = (await ctx.login("so-completo@exemplo.com.br")).cookie!;
  cookieSemVinculo = (await ctx.login("sem-vinculo@exemplo.com.br")).cookie!;
}, 120_000);

afterAll(async () => {
  await ctx?.encerrar();
});

describe("GET /api/empresas/:id/painel no cenário completo (CA-1, CA-2, CA-5, CA-13, CA-23)", () => {
  test("os totais são os das funções de indicadores, todos como string", async () => {
    const r = await painel("completo");
    expect(r.status).toBe(200);
    const creditos = indicadoresDeCredito(esperadoDe("completo"), empresa["completo"].raiz, null);
    const debitos = indicadoresDeDebito(esperadoDe("completo", "debitos"), null);
    expect(r.corpo.creditos).toEqual(creditos);
    expect(r.corpo.debitos).toEqual(debitos);
    for (const v of Object.values(r.corpo.creditos.totais)) expect(typeof v).toBe("string");
    for (const v of Object.values(r.corpo.debitos.totais)) expect(typeof v).toBe("string");
  });

  test("a lista de chaves é exatamente a do contrato, sem campo que combine crédito e débito", async () => {
    const r = await painel("completo");
    expect(Object.keys(r.corpo).sort()).toEqual(["creditos", "debitos", "recorte", "situacao"]);
    expect(Object.keys(r.corpo.recorte).sort()).toEqual(["periodo", "periodos"]);
    expect(Object.keys(r.corpo.situacao).sort()).toEqual(["creditos", "debitos"]);
    expect(Object.keys(r.corpo.situacao.creditos).sort()).toEqual(
      ["atualizacao", "desatualizado", "diasSemAtualizacao", "emAndamento", "estado", "falha", "recusados", "ultimaAceitaEm"].sort(),
    );
    expect(Object.keys(r.corpo.creditos).sort()).toEqual(
      ["origens", "outros", "pendentes", "porPeriodo", "quantidadeComAApropriar", "quantidadeNotas", "semNotasNoRecorte", "totais"].sort(),
    );
    expect(Object.keys(r.corpo.debitos).sort()).toEqual(["origens", "quantidadeNotas", "semNotasNoRecorte", "totais"]);
  });

  test("a situação traz a última consulta concluída, os dias e o intervalo de atualização", async () => {
    const r = await painel("completo");
    const s = r.corpo.situacao.creditos;
    expect(s).toMatchObject({ estado: "com_dados", emAndamento: false, desatualizado: false, diasSemAtualizacao: 1, falha: null, recusados: null });
    expect(s.ultimaAceitaEm).toBe(new Date(ctx.relogio.agora().getTime() - 24 * 60 * 60_000).toISOString());
    expect(s.atualizacao.de).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(s.atualizacao.ate >= s.atualizacao.de).toBe(true);
  });

  test("o recorte lista os períodos coletados em ordem cronológica", async () => {
    const r = await painel("completo");
    const periodos = periodosDisponiveis([...esperadoDe("completo"), ...esperadoDe("completo", "debitos")]);
    expect(r.corpo.recorte).toEqual({ periodo: null, periodos });
    expect([...periodos].sort()).toEqual(periodos);
  });

  test("a resposta é a mesma de qualquer papel e vem com Cache-Control: no-store", async () => {
    const r = await get(`/api/empresas/${empresa["completo"].id}/painel`, cookieSoCompleto);
    expect(r.status).toBe(200);
    expect(r.corpo).toEqual((await painel("completo")).corpo);
    expect(r.headers["cache-control"]).toBe("no-store");
  });
});

describe("estados dos dados na resposta (CA-14 a CA-20)", () => {
  test("sem-consulta: créditos e débitos nulos, estado sem_consulta", async () => {
    const r = await painel("sem-consulta");
    expect(r.corpo.creditos).toBeNull();
    expect(r.corpo.debitos).toBeNull();
    expect(r.corpo.situacao.creditos).toMatchObject({ estado: "sem_consulta", ultimaAceitaEm: null, diasSemAtualizacao: null });
    expect(r.corpo.recorte).toEqual({ periodo: null, periodos: [] });
  });

  test("em-andamento: créditos sem_consulta e emAndamento verdadeiro; débitos sem andamento", async () => {
    const r = await painel("em-andamento");
    expect(r.corpo.situacao.creditos).toMatchObject({ estado: "sem_consulta", emAndamento: true });
    expect(r.corpo.situacao.debitos).toMatchObject({ estado: "sem_consulta", emAndamento: false });
    expect(r.corpo.creditos).toBeNull();
  });

  test("vazio: estado vazio e blocos nulos, com a data da última consulta", async () => {
    const r = await painel("vazio");
    expect(r.corpo.situacao.creditos.estado).toBe("vazio");
    expect(r.corpo.situacao.creditos.ultimaAceitaEm).not.toBeNull();
    expect(r.corpo.creditos).toBeNull();
    expect(r.corpo.debitos).toBeNull();
  });

  test("parcial: créditos com dados e débitos nulos, com a falha de débitos", async () => {
    const r = await painel("parcial");
    expect(r.corpo.situacao.creditos.estado).toBe("com_dados");
    expect(r.corpo.creditos.semNotasNoRecorte).toBe(false);
    expect(r.corpo.situacao.debitos).toMatchObject({ estado: "sem_consulta", falha: { tipo: "outra" } });
    expect(r.corpo.debitos).toBeNull();
  });

  test("falha-com-anteriores: números continuam, com a falha de credencial", async () => {
    const r = await painel("falha-com-anteriores");
    expect(r.corpo.situacao.creditos).toMatchObject({ estado: "com_dados", falha: { tipo: "credencial" }, diasSemAtualizacao: 3, desatualizado: false });
    expect(r.corpo.creditos.semNotasNoRecorte).toBe(false);
    expect(r.corpo.situacao.debitos.falha).toBeNull();
  });

  test("desatualizado: os dois serviços com 9 dias", async () => {
    const r = await painel("desatualizado");
    for (const s of ["creditos", "debitos"]) expect(r.corpo.situacao[s]).toMatchObject({ desatualizado: true, diasSemAtualizacao: 9 });
  });

  test("recusado: créditos com dados e os dois retornos recusados avisados", async () => {
    const r = await painel("recusado");
    expect(r.corpo.situacao.creditos.estado).toBe("com_dados");
    expect(r.corpo.situacao.creditos.recusados).toMatchObject({ quantidade: 2 });
    expect(r.corpo.situacao.creditos.recusados.ultimoEm).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test("recusado: a data de créditos é a do último arquivo aceito, não a do recusado (ajuste de 2026-11-28)", async () => {
    const r = await painel("recusado");
    const s = r.corpo.situacao.creditos;
    expect(s.ultimaAceitaEm).toBe(new Date(ctx.relogio.agora().getTime() - 2 * 24 * 60 * 60_000).toISOString());
    expect(s.diasSemAtualizacao).toBe(2);
  });

  test("os nomes antigos da situação não existem mais", async () => {
    const r = await painel("completo");
    for (const s of ["creditos", "debitos"]) {
      expect(r.corpo.situacao[s]).not.toHaveProperty("ultimaConcluidaEm");
      expect(r.corpo.situacao[s]).not.toHaveProperty("diasSemConsulta");
    }
  });

  test("retorno de débitos recusado: débitos em sem_dados_usaveis, com o aviso, e créditos intactos (CA-20)", async () => {
    const id = await ctx.criarEmpresa("Empresa debitos recusados Exemplo", "31000099");
    await ctx.vincular(id, usuarioDeTodas, "titular");
    const admin = criarComandosAdmin({ banco: ctx.banco, email: ctx.email, relogio: () => ctx.relogio.agora(), config: ctx.config });
    await admin.carregarCenario({ empresaId: id, cenario: "vazio" });
    await ctx.banco.naEmpresaFixada(id, async (trx) => {
      const c = await trx
        .insertInto("consulta")
        .values({
          empresa_id: id,
          servico: "debitos",
          estado: "lida",
          criada_em: new Date(ctx.relogio.agora().getTime() - 60_000),
          concluida_em: new Date(ctx.relogio.agora().getTime() - 50_000),
          finalizada_em: new Date(ctx.relogio.agora().getTime() - 40_000),
        })
        .returning("id")
        .executeTakeFirstOrThrow();
      await registrarLeitura(trx, { consultaId: c.id, servico: "debitos", conteudo: new TextEncoder().encode("isto não é json"), recebidoEm: ctx.relogio.agora(), log: { info() {}, warn() {} } });
    });
    const r = await get(`/api/empresas/${id}/painel`);
    expect(r.status).toBe(200);
    expect(r.corpo.situacao.debitos.estado).toBe("sem_dados_usaveis");
    expect(r.corpo.situacao.debitos.recusados).toMatchObject({ quantidade: 1 });
    expect(r.corpo.situacao.creditos.recusados).toBeNull();
    expect(r.corpo.debitos).toBeNull();
  });

  test("outros-valores: só os campos diferentes de zero e as origens 20 e 30 (CA-3, CA-25)", async () => {
    const r = await painel("outros-valores");
    expect(r.corpo.creditos.outros.map((o: { campo: string }) => o.campo)).toEqual(["suspenso", "prescrito", "pedidoRessarcimento"]);
    expect(r.corpo.creditos.origens.map((o: { codigo: number }) => o.codigo)).toEqual([20, 30]);
    expect(r.corpo.creditos.pendentes.negativos).toEqual({ quantidade: 1, total: "-15.50" });
  });
});

describe("recorte por período (CA-12)", () => {
  test("com periodo=AAAA-MM, créditos, pendentes, evolução e débitos só têm aquele período", async () => {
    const r = await painel("completo", "?periodo=2026-10");
    expect(r.status).toBe(200);
    expect(r.corpo.recorte.periodo).toBe("2026-10");
    expect(r.corpo.recorte.periodos.length).toBeGreaterThan(1);
    expect(r.corpo.creditos).toEqual(indicadoresDeCredito(esperadoDe("completo"), empresa["completo"].raiz, "2026-10"));
    expect(r.corpo.debitos).toEqual(indicadoresDeDebito(esperadoDe("completo", "debitos"), "2026-10"));
    expect(r.corpo.creditos.porPeriodo.map((p: { periodo: string }) => p.periodo)).toEqual(["2026-10"]);
  });

  test("período sem débito dá semNotasNoRecorte no bloco de débitos, sem totais", async () => {
    const r = await painel("completo", "?periodo=2026-05");
    expect(r.status).toBe(200);
    expect(r.corpo.creditos.semNotasNoRecorte).toBe(false);
    expect(r.corpo.debitos).toEqual({ semNotasNoRecorte: true });
  });

  test.each(["2026-13", "11/2026", "abc", "2026-1", "2026-00", ""])("periodo=%s dá 400 periodo_invalido", async (p) => {
    const r = await painel("completo", `?periodo=${encodeURIComponent(p)}`);
    expect(r.status).toBe(400);
    expect(r.corpo.erro).toBe("periodo_invalido");
  });
});

describe("recolhimentos e pagamentos não mudam nada (CA-21)", () => {
  test("consultas desses serviços gravadas para a empresa deixam as respostas iguais", async () => {
    const id = empresa["desatualizado"].id;
    const urls = [`/api/empresas/${id}/painel`, `/api/empresas/${id}/pendencias`];
    const antes = await Promise.all(urls.map((u) => get(u)));
    await semear(ctx.migracao, [id], async (trx) => {
      const agora = ctx.relogio.agora();
      await sql`insert into consulta (empresa_id, servico, estado, criada_em, concluida_em, finalizada_em) values
        (${id}, 'recolhimentos', 'lida', ${agora}, ${agora}, ${agora}),
        (${id}, 'pagamentos', 'lida', ${agora}, ${agora}, ${agora}),
        (${id}, 'recolhimentos', 'credencial_invalida', ${agora}, null, ${agora}),
        (${id}, 'pagamentos', 'aberta', ${agora}, null, null)`.execute(trx);
    });
    const depois = await Promise.all(urls.map((u) => get(u)));
    depois.forEach((d, i) => expect(d.corpo).toEqual(antes[i]!.corpo));
  });
});

describe("GET /api/empresas/:id/pendencias (CA-9, CA-10)", () => {
  test("traz todos os grupos, sem demais, e a soma deles é totalAApropriar", async () => {
    for (const c of ["completo", "outros-valores"] as const) {
      const r = await get(`/api/empresas/${empresa[c].id}/pendencias`);
      expect(r.status).toBe(200);
      expect(Object.keys(r.corpo).sort()).toEqual(["grupos", "percentualNaoIdentificado", "recorte", "situacao", "totalAApropriar"]);
      expect(Object.keys(r.corpo.situacao)).toEqual(["creditos"]);
      const esperado = agruparPendentes(esperadoDe(c), empresa[c].raiz);
      expect(r.corpo.grupos).toEqual(esperado.grupos);
      expect(r.corpo.totalAApropriar).toBe(esperado.totalAApropriar);
      const soma = r.corpo.grupos.reduce((t: Big, g: { total: string }) => t.plus(g.total), Big(0)).toFixed(2);
      expect(soma).toBe(r.corpo.totalAApropriar);
      expect(r.corpo.grupos.length).toBeGreaterThan(5);
      expect(r.corpo.grupos.every((g: { grupo: string }) => g.grupo !== "demais")).toBe(true);
    }
  });

  test("fora de com_dados, grupos é nulo", async () => {
    for (const c of ["sem-consulta", "vazio", "em-andamento"] as const) {
      const r = await get(`/api/empresas/${empresa[c].id}/pendencias`);
      expect(r.status).toBe(200);
      expect(r.corpo.grupos).toBeNull();
      expect(r.corpo.totalAApropriar).toBeNull();
    }
  });

  test("o recorte vale também aqui, e periodo inválido dá 400", async () => {
    const r = await get(`/api/empresas/${empresa["completo"].id}/pendencias?periodo=2026-10`);
    expect(r.corpo.recorte.periodo).toBe("2026-10");
    expect(r.corpo.totalAApropriar).toBe(agruparPendentes(esperadoDe("completo").filter((n) => n.pa === "10/2026"), empresa["completo"].raiz).totalAApropriar);
    expect((await get(`/api/empresas/${empresa["completo"].id}/pendencias?periodo=xx`)).status).toBe(400);
  });
});

describe("GET /api/empresas/:id/pendencias/:grupo/notas (CA-10, P-8)", () => {
  const notasUrl = (c: Cenario, grupo: string, query = "") => `/api/empresas/${empresa[c].id}/pendencias/${grupo}/notas${query}`;

  test("o grupo não identificado tem mais de uma página: 100 por página, do maior para o menor, empate pela chave", async () => {
    const p1 = await get(notasUrl("completo", "nao-identificado"));
    expect(p1.status).toBe(200);
    expect(Object.keys(p1.corpo).sort()).toEqual(["grupo", "notas", "pagina", "paginas", "quantidade", "total"]);
    expect(p1.corpo).toMatchObject({ grupo: "nao-identificado", pagina: 1 });
    expect(p1.corpo.paginas).toBeGreaterThan(1);
    expect(p1.corpo.notas).toHaveLength(100);
    expect(Object.keys(p1.corpo.notas[0]).sort()).toEqual(["aApropriar", "chave", "documento", "documentoNome", "emissao", "origem", "origemNome", "periodo"]);
    expect(p1.corpo.notas[0]).toMatchObject({ documento: 91, documentoNome: "NFS-e" });
    expect(p1.corpo.notas[0].emissao).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(p1.corpo.notas[0].periodo).toMatch(/^\d{4}-\d{2}$/);

    const todas: Array<{ aApropriar: string; chave: string }> = [];
    for (let pagina = 1; pagina <= p1.corpo.paginas; pagina++) {
      const r = await get(notasUrl("completo", "nao-identificado", `?pagina=${pagina}`));
      todas.push(...r.corpo.notas);
    }
    expect(todas).toHaveLength(p1.corpo.quantidade);
    for (let i = 1; i < todas.length; i++) {
      const c = Big(todas[i - 1]!.aApropriar).cmp(todas[i]!.aApropriar);
      expect(c === 1 || (c === 0 && todas[i - 1]!.chave < todas[i]!.chave)).toBe(true);
    }
    const soma = todas.reduce((t, n) => t.plus(n.aApropriar), Big(0)).toFixed(2);
    expect(soma).toBe(p1.corpo.total);
    const grupos = (await get(`/api/empresas/${empresa["completo"].id}/pendencias`)).corpo.grupos as Array<{ grupo: string; total: string; quantidade: number }>;
    const doGrupo = grupos.find((g) => g.grupo === "nao-identificado")!;
    expect(p1.corpo).toMatchObject({ total: doGrupo.total, quantidade: doGrupo.quantidade });
  });

  test("um CNPJ de emitente, propria-empresa e negativos", async () => {
    const grupos = (await get(`/api/empresas/${empresa["outros-valores"].id}/pendencias`)).corpo.grupos as Array<{ grupo: string; tipo: string; total: string }>;
    const cnpj = grupos.find((g) => g.tipo === "emitente")!;
    expect(cnpj.grupo).toMatch(/^[0-9A-Z]{12}[0-9]{2}$/);
    const rc = await get(notasUrl("outros-valores", cnpj.grupo));
    expect(rc.status).toBe(200);
    expect(rc.corpo.total).toBe(cnpj.total);
    const rn = await get(notasUrl("outros-valores", "negativos"));
    expect(rn.corpo).toMatchObject({ total: "-15.50", quantidade: 1 });
    const rp = await get(notasUrl("completo", "propria-empresa"));
    expect(rp.corpo.quantidade).toBe(1);
  });

  test("grupo sem nota no recorte e grupo fora do formato dão 404 grupo_nao_encontrado", async () => {
    for (const g of ["negativos", "9".repeat(14), "abc", "1234567890"]) {
      const r = await get(notasUrl("completo", g));
      expect(r.status, g).toBe(404);
      expect(r.corpo.erro, g).toBe("grupo_nao_encontrado");
    }
  });

  test("página 0, além da última e que não é número dão 400 pagina_invalida", async () => {
    const p1 = await get(notasUrl("completo", "nao-identificado"));
    for (const q of ["?pagina=0", `?pagina=${p1.corpo.paginas + 1}`, "?pagina=abc", "?pagina=-1"]) {
      const r = await get(notasUrl("completo", "nao-identificado", q));
      expect(r.status, q).toBe(400);
      expect(r.corpo.erro, q).toBe("pagina_invalida");
    }
  });

  test("o recorte por período vale para as notas do grupo", async () => {
    const r = await get(notasUrl("completo", "nao-identificado", "?periodo=2026-10"));
    expect(r.status).toBe(200);
    expect(r.corpo.notas.every((n: { periodo: string }) => n.periodo === "2026-10")).toBe(true);
  });

  test("fora de com_dados, o grupo não existe (404)", async () => {
    expect((await get(notasUrl("vazio", "nao-identificado"))).status).toBe(404);
  });
});

describe("isolamento entre empresas (AD-6)", () => {
  test("o usuário só de A recebe 404 empresa_nao_encontrada nas três rotas de B, igual ao de empresa inexistente", async () => {
    const urls = (id: string) => [`/api/empresas/${id}/painel`, `/api/empresas/${id}/pendencias`, `/api/empresas/${id}/pendencias/nao-identificado/notas`];
    const inexistente = "11111111-1111-4111-8111-111111111111";
    for (let i = 0; i < 3; i++) {
      const deB = await get(urls(empresa["outros-valores"].id)[i]!, cookieSoCompleto);
      const nada = await get(urls(inexistente)[i]!, cookieSoCompleto);
      expect(deB.status).toBe(404);
      expect(deB.corpo.erro).toBe("empresa_nao_encontrada");
      expect(deB.corpo).toEqual(nada.corpo);
    }
  });

  test("o painel de A não tem nada de B", async () => {
    const r = await get(`/api/empresas/${empresa["completo"].id}/painel`, cookieSoCompleto);
    expect(r.corpo.creditos).toEqual(indicadoresDeCredito(esperadoDe("completo"), empresa["completo"].raiz, null));
    expect(r.corpo.creditos.outros).toEqual([]);
    expect(r.corpo.creditos.pendentes.negativos).toBeNull();
  });

  test("sem sessão é 401, e sem vínculo nenhum é 404", async () => {
    expect((await get(`/api/empresas/${empresa["completo"].id}/painel`, null)).status).toBe(401);
    const r = await get(`/api/empresas/${empresa["completo"].id}/painel`, cookieSemVinculo);
    expect(r.status).toBe(404);
    expect(r.corpo.erro).toBe("empresa_nao_encontrada");
  });
});

describe("log das requisições", () => {
  test("traz usuarioId, empresaId e a duração, e nenhum valor, CNPJ nem chave", async () => {
    const antes = linhasDeLog.length;
    const r: Resposta = await painel("completo");
    expect(r.status).toBe(200);
    await get(`/api/empresas/${empresa["completo"].id}/pendencias`);
    const novas = linhasDeLog.slice(antes);
    const registros = novas.map((l) => JSON.parse(l) as Record<string, unknown>);
    const eventos = registros.filter((x) => x["evento"] === "painel_consultado");
    expect(eventos.length).toBeGreaterThanOrEqual(1);
    for (const e of eventos) {
      expect(e).toMatchObject({ usuarioId: usuarioDeTodas, empresaId: empresa["completo"].id });
      expect(typeof e["duracaoMs"]).toBe("number");
    }
    const tudo = novas.join("");
    const notas = esperadoDe("completo");
    expect(tudo).not.toContain(empresa["completo"].raiz);
    for (const n of notas.slice(0, 50)) expect(tudo).not.toContain(n.chave);
    for (const v of Object.values((r.corpo.creditos as { totais: Record<string, string> }).totais)) {
      if (v !== "0.00") expect(tudo).not.toContain(v);
    }
  });
});
