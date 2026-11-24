import { afterEach, describe, expect, it } from "vitest";
import { criarCache, lerPasta } from "../src/nucleo/arquivos.js";
import { MOTIVOS } from "../src/nucleo/emitente.js";
import { montarVisao } from "../src/nucleo/visao.js";
import { urlNota as urlNotaDe } from "../src/paginas/links.js";
import {
  arquivoCreditos,
  arquivoDebitos,
  arquivoRecolhimentos,
  credito,
  debito,
  itemRecolhimento,
  montarChave,
  n,
  RAIZ,
} from "./apoio/construtores.js";
import { cnpjInvalidoDe } from "./apoio/dv.js";
import { limparPaineis, painelCom, painelCopiando, PASTA_ERROS, PASTA_FICTICIOS, type PainelDeTeste } from "./apoio/painel.js";
import { nomeArquivo } from "./apoio/pasta.js";

afterEach(limparPaineis);

const emit = (b8: string) => cnpjInvalidoDe(`${b8}0001`);
const fmt = (c: string) => `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12, 14)}`;
let seq = 0;
const chaveDe = (b8: string) => montarChave({ emitente: emit(b8), codigo: String(70000000 + ++seq) });
const CRED = nomeArquivo("creditos", "FICTL1", "20261120T101530Z");

function hrefsNota(corpo: string): string[] {
  return [...corpo.matchAll(/href="(\/creditos\/nota\?[^"]+)"/g)].map((m) => m[1].replaceAll("&amp;", "&"));
}
const linhas = (corpo: string) => (corpo.match(/class="linha-nota/g) ?? []).length;
const posicao = (corpo: string, chave: string) => corpo.indexOf(`>${chave}<`);

// ---------- lista de créditos ----------

const X = chaveDe("11223344");
const C57 = montarChave({ emitente: emit("11223344"), modelo: "57", codigo: "70999999" });
const Y = chaveDe("66778899");
const Z = "FICT-DEVOLUCAO";
const SEM = "FICT-SEM-EMITENTE";

const arquivoLista = arquivoCreditos(
  [
    ["10/2026", [credito({ chave: X, aApropriar: "10.00", emissao: "2026-10-03T10:00:00-03:00" })]],
    [
      "11/2026",
      [
        credito({ chave: C57, documento: 57, aApropriar: "2.00", emissao: "2026-11-05T10:00:00-03:00" }),
        credito({ chave: Y, apropriado: "8.00", emissao: "2026-11-04T10:00:00-03:00" }),
        credito({ chave: Z, origem: 20, aApropriar: "-1.00", emissao: "2026-11-07T10:00:00-03:00" }),
        credito({ chave: SEM, aApropriar: "7.00", emissao: "2026-11-01T10:00:00-03:00" }),
      ],
    ],
  ],
  { ni: RAIZ },
);

describe("/creditos: lista (CA-10, CA-13)", () => {
  const abrir = () => painelCom([[CRED, arquivoLista]]);

  it("colunas do CA-10, com o nome da tabela e o código ao lado", async () => {
    const { corpo } = await (await abrir()).get("/creditos");
    for (const coluna of ["Período", "Tipo de documento", "Chave", "Emissão", "Origem", "Emitente", "Apurado", "A apropriar", "Apropriado", "Utilizado"]) {
      expect(corpo).toContain(`<th>${coluna}</th>`);
    }
    expect(corpo).toContain("NF-e (55)");
    expect(corpo).toContain("CT-e (57)");
    expect(corpo).toContain("NORMAL (0)");
    expect(corpo).toContain("DEVOLUCAO_POR_PCONT (20)");
    expect(linhas(corpo)).toBe(5);
  });

  it("emitente com a indicação de onde veio, e não identificado quando for o caso", async () => {
    const { corpo } = await (await abrir()).get("/creditos");
    expect(corpo).toContain(fmt(emit("11223344")));
    expect(corpo).toContain("CNPJ do emitente, lido da chave da nota");
    expect(corpo).toContain("emitente não identificado");
  });

  it("origem diferente de normal leva a marca", async () => {
    const { corpo } = await (await abrir()).get("/creditos");
    expect(corpo).toContain("origem: DEVOLUCAO_POR_PCONT");
    expect((corpo.match(/origem: /g) ?? []).length).toBe(1);
  });

  it("filtros em formulário GET, combináveis pela URL", async () => {
    const p = await abrir();
    const { corpo } = await p.get("/creditos");
    expect(corpo).toMatch(/<form[^>]*method="get"[^>]*action="\/creditos"|<form[^>]*action="\/creditos"[^>]*method="get"/);
    for (const campo of ["pa", "documento", "emitente", "pendente", "busca", "ordem", "sentido"]) expect(corpo).toContain(`name="${campo}"`);

    expect(posicao((await p.get("/creditos?documento=57")).corpo, C57)).toBeGreaterThan(0);
    const so57 = (await p.get("/creditos?documento=57")).corpo;
    expect(linhas(so57)).toBe(1);
    expect(linhas((await p.get("/creditos?pa=10/2026")).corpo)).toBe(1);
    const pendentes = (await p.get("/creditos?pendente=1")).corpo;
    expect(linhas(pendentes)).toBe(3);
    expect(posicao(pendentes, Y)).toBe(-1);
    expect(linhas((await p.get("/creditos?emitente=nao-identificado")).corpo)).toBe(2);
    expect(linhas((await p.get(`/creditos?emitente=${emit("11223344")}&pa=11/2026`)).corpo)).toBe(1);
  });

  it("busca por trecho da chave, e aviso quando o valor é ignorado", async () => {
    const p = await abrir();
    expect(linhas((await p.get(`/creditos?busca=${Y.slice(35, 43)}`)).corpo)).toBe(1);
    const ruim = (await p.get("/creditos?busca=ab")).corpo;
    expect(ruim).toContain("A busca foi ignorada");
    expect(linhas(ruim)).toBe(5);
  });

  it("ordenação por emissão e por valor a apropriar, nos dois sentidos", async () => {
    const p = await abrir();
    const padrao = (await p.get("/creditos")).corpo;
    expect(posicao(padrao, Z)).toBeLessThan(posicao(padrao, X));
    const asc = (await p.get("/creditos?ordem=emissao&sentido=asc")).corpo;
    expect(posicao(asc, X)).toBeLessThan(posicao(asc, Z));
    const maior = (await p.get("/creditos?ordem=aApropriar&sentido=desc")).corpo;
    expect(posicao(maior, X)).toBeLessThan(posicao(maior, SEM));
    const menor = (await p.get("/creditos?ordem=aApropriar&sentido=asc")).corpo;
    expect(posicao(menor, Z)).toBeLessThan(posicao(menor, X));
  });

  it("total de notas e total a apropriar do filtro", async () => {
    const p = await abrir();
    const todas = (await p.get("/creditos")).corpo;
    expect(todas).toContain("5 notas");
    expect(todas).toContain("R$ 18,00");
    expect(todas).toContain("Página 1 de 1");
    const pendentes = (await p.get("/creditos?pendente=1")).corpo;
    expect(pendentes).toContain("3 notas");
    expect(pendentes).toContain("R$ 19,00");
  });

  it("cada chave leva ao detalhe da nota", async () => {
    const { corpo } = await (await abrir()).get("/creditos");
    const hrefs = hrefsNota(corpo);
    expect(hrefs).toHaveLength(5);
    expect(hrefs.some((h) => h.includes(`chave=${encodeURIComponent(X)}`) && h.includes("pa=10%2F2026") && h.includes("documento=55") && h.includes("origem=0"))).toBe(true);
  });
});

describe("/creditos com o fictício de volume (CA-10, DT-5)", () => {
  it("100 linhas por página, com o total de páginas", async () => {
    const p = await painelCopiando(PASTA_FICTICIOS);
    const { corpo } = await p.get("/creditos?pa=11/2026");
    expect(linhas(corpo)).toBe(100);
    const m = /Página 1 de (\d+)/.exec(corpo);
    expect(m).not.toBeNull();
    expect(parseInt(m![1], 10)).toBeGreaterThanOrEqual(9);
    const ultima = await p.get(`/creditos?pa=11/2026&pagina=${m![1]}`);
    expect(linhas(ultima.corpo)).toBeLessThanOrEqual(100);
    expect(ultima.corpo).toContain(`Página ${m![1]} de ${m![1]}`);
    const fora = await p.get("/creditos?pa=11/2026&pagina=9999");
    expect(fora.corpo).toContain(`Página ${m![1]} de ${m![1]}`);
  });

  it("os links de página mantêm os filtros", async () => {
    const p = await painelCopiando(PASTA_FICTICIOS);
    const { corpo } = await p.get("/creditos?pa=11/2026&ordem=aApropriar&sentido=asc");
    expect(corpo).toMatch(/href="\/creditos\?[^"]*pagina=2[^"]*"/);
    const link = /href="(\/creditos\?[^"]*pagina=2[^"]*)"/.exec(corpo)![1];
    expect(link).toContain("pa=11%2F2026");
    expect(link).toContain("ordem=aApropriar");
    expect(link).toContain("sentido=asc");
  });
});

// ---------- detalhe da nota ----------

const FORN_RECO = emit("55667788");
const C1 = chaveDe("11223344"); // emitente da chave: 11223344; o recolhimento diz outro
const C2 = chaveDe("66778899");
const C3 = chaveDe(RAIZ);

function notaCompleta() {
  const c = credito({
    chave: C1,
    aApropriar: "100.00",
    apropriado: "60",
    utilizado: "20.5",
    saldoCredor: "39.5",
    apurado: "160",
    extras: { apropriacao: { inapropriavel: n("3.01"), suspenso: n("2.02"), prescrito: n("4.04") }, cbs: { excedente: n("1.11") } },
  });
  const utilizacao = ((c["cbs"] as Record<string, unknown>)["apropriacao"] as Record<string, unknown>)["utilizacao"] as Record<string, unknown>;
  utilizacao["inutilizavel"] = n("5.05");
  utilizacao["restabelecido"] = n("6.06");
  (utilizacao["naoUtilizado"] as Record<string, unknown>)["pedidoRessarcimento"] = n("7.07");
  return c;
}

const arquivosDetalhe: Array<[string, unknown]> = [
  [CRED, arquivoCreditos([["11/2026", [notaCompleta(), credito({ chave: C2, aApropriar: "5.00" }), credito({ chave: C3, aApropriar: "9.00" }), credito({ chave: "FICT-SEM", aApropriar: "1.00" })]]], { ni: RAIZ })],
  [
    nomeArquivo("recolhimentos", "FICTR1", "20261120T101530Z"),
    arquivoRecolhimentos([["2026-11-10", [["99999000000000001", [itemRecolhimento({ chaveDFE: C1, niFornecedor: FORN_RECO, principal: "100.00", multa: "1.5", juros: "0.25", total: "101.75" })]]]]], { ni: RAIZ }),
  ],
  [nomeArquivo("debitos", "FICTD1", "20261120T101530Z"), arquivoDebitos([["11/2026", [debito({ chave: C3, apurado: "50.00", saldoDevedor: "50.00" })]]], { ni: RAIZ })],
];
const urlNota = (chave: string, pa = "11/2026", documento = 55, origem = 0) => `/creditos/nota?pa=${encodeURIComponent(pa)}&documento=${documento}&origem=${origem}&chave=${encodeURIComponent(chave)}`;

describe("/creditos/nota: detalhe (CA-11, CA-12)", () => {
  const abrir = () => painelCom(arquivosDetalhe);

  it("todos os campos com o nome oficial e o valor em reais", async () => {
    const { corpo } = await (await abrir()).get(urlNota(C1));
    expect(corpo).toContain(C1);
    for (const campo of [
      "origem",
      "documento",
      "chave",
      "emissao",
      "registro",
      "atualizacao",
      "apurado",
      "excedente",
      "inapropriavel",
      "suspenso",
      "prescrito",
      "aApropriar",
      "apropriado",
      "inutilizavel",
      "utilizado",
      "restabelecido",
      "saldoCredor",
      "pedidoRessarcimento",
    ]) {
      expect(corpo, campo).toContain(`<code>${campo}</code>`);
    }
    for (const v of ["R$ 160,00", "R$ 1,11", "R$ 3,01", "R$ 2,02", "R$ 4,04", "R$ 100,00", "R$ 60,00", "R$ 5,05", "R$ 20,50", "R$ 6,06", "R$ 39,50", "R$ 7,07"]) expect(corpo, v).toContain(v);
    expect(corpo).toContain("NF-e (55)");
    expect(corpo).toContain("NORMAL (0)");
  });

  it("datas de emissão, registro e atualização", async () => {
    const { corpo } = await (await abrir()).get(urlNota(C1));
    expect(corpo).toContain("02/11/2026 10:00 (-03:00)");
    expect(corpo).toContain("02/11/2026 10:05 (-03:00)");
    expect(corpo).toContain("18/11/2026 08:00 (-03:00)");
  });

  it("campo ausente aparece como não veio no arquivo", async () => {
    const { corpo } = await (await abrir()).get(urlNota(C2));
    expect(corpo).toContain("não veio no arquivo");
    expect(corpo).not.toContain("R$ 3,01");
    expect((corpo.match(/não veio no arquivo/g) ?? []).length).toBeGreaterThanOrEqual(8);
  });

  it("recolhimentos ligados pela chave, com todos os campos do item", async () => {
    const { corpo } = await (await abrir()).get(urlNota(C1));
    for (const titulo of ["Data de arrecadação", "DARF", "Período", "Vencimento", "Fornecedor", "Principal", "Multa", "Juros", "Total"]) expect(corpo).toContain(`<th>${titulo}</th>`);
    for (const v of ["10/11/2026", "99999000000000001", "20/12/2026", fmt(FORN_RECO), "R$ 100,00", "R$ 1,50", "R$ 0,25", "R$ 101,75"]) expect(corpo, v).toContain(v);
  });

  it("nota sem recolhimento ligado diz isso", async () => {
    const { corpo } = await (await abrir()).get(urlNota(C2));
    expect(corpo).toContain("Nenhum recolhimento ligado a esta nota.");
  });

  it("emitente pela chave, com a fonte", async () => {
    const { corpo } = await (await abrir()).get(urlNota(C2));
    expect(corpo).toContain(fmt(emit("66778899")));
    expect(corpo).toContain("CNPJ do emitente, lido da chave da nota");
  });

  it("emitente pelo recolhimento vale, e mostra o que a chave diz (DT-6)", async () => {
    const { corpo } = await (await abrir()).get(urlNota(C1));
    expect(corpo).toContain("CNPJ do fornecedor, informado no recolhimento");
    expect(corpo).toContain("Recolhimento e chave divergem");
    expect(corpo).toContain(fmt(emit("11223344")));
    expect(corpo).toContain(fmt(FORN_RECO));
  });

  it("emitente não identificado, com o motivo", async () => {
    const { corpo } = await (await abrir()).get(urlNota("FICT-SEM"));
    expect(corpo).toContain("emitente não identificado");
    expect(corpo).toContain("chave fora do leiaute de 44 posições");
  });

  it("emitida pela própria empresa", async () => {
    const { corpo } = await (await abrir()).get(urlNota(C3));
    expect(corpo).toContain("emitida pela própria empresa");
  });

  it("marca a chave que também aparece nos débitos, sem compensar nada (O-25)", async () => {
    const p2 = await abrir();
    const nos2 = (await p2.get(urlNota(C3))).corpo;
    expect(nos2).toContain("Esta chave também aparece nos débitos (vendas). O painel não compensa um lado com o outro.");
    expect((await p2.get(urlNota(C2))).corpo).not.toContain("também aparece nos débitos");
  });

  it("parâmetros que não acham nota dão 404", async () => {
    const p2 = await abrir();
    expect((await p2.get(urlNota("NAO-EXISTE"))).status).toBe(404);
    expect((await p2.get("/creditos/nota")).status).toBe(404);
    expect((await p2.get(urlNota(C1, "10/2026"))).status).toBe(404);
    expect((await p2.get(urlNota(C1, "11/2026", 57))).status).toBe(404);
    expect((await p2.get(urlNota(C1, "11/2026", 55, 20))).status).toBe(404);
  });
});

// ---------- pendências ----------

const A1 = chaveDe("11223344");
const A2 = chaveDe("11223344");
const B1 = chaveDe("66778899");
const PROP = chaveDe(RAIZ);
const NEG = chaveDe("11223344");
const arquivosPendencias: Array<[string, unknown]> = [
  [
    CRED,
    arquivoCreditos(
      [
        [
          "11/2026",
          [
            credito({ chave: A1, aApropriar: "10.00" }),
            credito({ chave: A2, aApropriar: "5.00" }),
            credito({ chave: B1, aApropriar: "20.00" }),
            credito({ chave: "FICT-SEM-EMITENTE", aApropriar: "7.00" }),
            credito({ chave: PROP, aApropriar: "3.00" }),
            credito({ chave: NEG, origem: 20, aApropriar: "-2.00" }),
            credito({ chave: chaveDe("44556677"), apropriado: "9.00" }),
          ],
        ],
      ],
      { ni: RAIZ },
    ),
  ],
];
const TEXTO_FIXO = "A Receita informa o valor a apropriar de cada nota, mas não informa o motivo. Esta tela não indica que o emitente deixou de recolher.";

describe("/pendencias (CA-14, CA-15)", () => {
  it("grupos por emitente, do maior total para o menor, com quantidade e total", async () => {
    const { corpo } = await (await painelCom(arquivosPendencias)).get("/pendencias");
    const ordem = [fmt(emit("66778899")), fmt(emit("11223344")), "emitente não identificado", "emitida pela própria empresa"].map((t) => corpo.indexOf(t));
    expect(ordem.every((i) => i > 0)).toBe(true);
    expect([...ordem].sort((a, b) => a - b)).toEqual(ordem);
    for (const v of ["R$ 20,00", "R$ 15,00", "R$ 7,00", "R$ 3,00"]) expect(corpo, v).toContain(v);
  });

  it("grupos fixos aparecem mesmo vazios", async () => {
    const { corpo } = await (await painelCom([[CRED, arquivoCreditos([["11/2026", [credito({ chave: B1, aApropriar: "20.00" })]]], { ni: RAIZ })]])).get("/pendencias");
    expect(corpo).toContain("emitente não identificado");
    expect(corpo).toContain("emitida pela própria empresa");
  });

  it("linha própria para notas com valor a apropriar negativo", async () => {
    const { corpo } = await (await painelCom(arquivosPendencias)).get("/pendencias");
    expect(corpo).toContain("notas com valor a apropriar negativo");
    expect(corpo).toContain("-R$ 2,00");
  });

  it("mostra que a soma dos grupos é igual ao total a apropriar do saldo", async () => {
    const p = await painelCom(arquivosPendencias);
    const { corpo } = await p.get("/pendencias");
    expect(corpo).toContain("R$ 43,00");
    expect(corpo).toContain("A soma dos grupos é igual ao total a apropriar do saldo.");
    expect((await p.get("/")).corpo).toContain("R$ 43,00");
  });

  it("diz que percentual do total a apropriar está em emitente não identificado", async () => {
    const { corpo } = await (await painelCom(arquivosPendencias)).get("/pendencias");
    expect(corpo).toContain("16,3%");
    expect(corpo).toContain("do total a apropriar está em emitente não identificado");
  });

  it("o grupo abre as notas dele", async () => {
    const p = await painelCom(arquivosPendencias);
    const lista = (await p.get("/pendencias")).corpo;
    const link = /href="(\/pendencias\?grupo=[^"]*cnpj-11223344[^"]*)"/.exec(lista);
    expect(link).not.toBeNull();
    const grupo = await p.get(link![1].replaceAll("&amp;", "&"));
    expect(grupo.status).toBe(200);
    expect(grupo.corpo).toContain(A1);
    expect(grupo.corpo).toContain(A2);
    expect(grupo.corpo).not.toContain(B1);
    expect(hrefsNota(grupo.corpo)).toHaveLength(2);
    const semId = (await p.get("/pendencias?grupo=nao-identificado")).corpo;
    expect(semId).toContain("FICT-SEM-EMITENTE");
    expect(semId).not.toContain(A1);
    expect((await p.get("/pendencias?grupo=propria-empresa")).corpo).toContain(PROP);
    expect((await p.get("/pendencias?grupo=negativas")).corpo).toContain(NEG);
  });

  it("a tela mostra as duas fontes quando o grupo tem notas do recolhimento e da chave (rodada 1, E6)", async () => {
    const pelaChaveY = chaveDe("99887766");
    const pelaChaveX = chaveDe("11223344");
    const { corpo } = await (
      await painelCom([
        [CRED, arquivoCreditos([["11/2026", [credito({ chave: pelaChaveY, aApropriar: "10.00" }), credito({ chave: pelaChaveX, aApropriar: "5.00" })]]], { ni: RAIZ })],
        [nomeArquivo("recolhimentos", "FICTR1"), arquivoRecolhimentos([["2026-11-10", [["99999000000000001", [itemRecolhimento({ chaveDFE: pelaChaveY, niFornecedor: emit("11223344") })]]]]], { ni: RAIZ })],
      ])
    ).get("/pendencias");
    expect(corpo).toContain("CNPJ do fornecedor, informado no recolhimento");
    expect(corpo).toContain("CNPJ do emitente, lido da chave da nota");
  });

  it("grupo inexistente dá 404", async () => {
    expect((await (await painelCom(arquivosPendencias)).get("/pendencias?grupo=cnpj-00000000000000")).status).toBe(404);
  });

  it("não afirma o motivo da pendência nem que o emitente deixou de recolher (CA-15)", async () => {
    const p = await painelCom(arquivosPendencias);
    for (const url of ["/pendencias", "/pendencias?grupo=nao-identificado"]) {
      const { corpo } = await p.get(url);
      const semFixo = corpo.replace(TEXTO_FIXO, "");
      expect(semFixo.toLowerCase()).not.toContain("não recolheu");
      expect(semFixo.toLowerCase()).not.toContain("deixou de recolher");
      expect(semFixo.toLowerCase()).not.toContain("inadimpl");
    }
    expect((await p.get("/pendencias")).corpo).toContain(TEXTO_FIXO);
  });

  it("sem créditos, diz que a Receita não devolveu créditos", async () => {
    const { corpo } = await (await painelCom([])).get("/pendencias");
    expect(corpo).toContain("A Receita não devolveu créditos nos arquivos lidos.");
  });
});

// ---------- varreduras de texto em todas as rotas ----------

const PROIBIDAS = ["disponível", "pode usar", "pode ser usado", "confirmado", "liberado"];

/** Uma nota de cada tipo de documento e de cada motivo ou fonte de emitente: a página de detalhe muda com eles. */
async function notasVariadas(p: PainelDeTeste): Promise<Map<string, string>> {
  const visao = montarVisao(await lerPasta(p.pasta.caminho, { cache: criarCache() }));
  const variadas = new Map<string, string>();
  for (const nota of visao.notas) {
    const e = nota.emitente.emitente;
    const tipo = `${nota.documento}|${e.motivo ?? `${e.tipo}-${e.fonte ?? ""}`}`;
    if (!variadas.has(tipo)) variadas.set(tipo, urlNotaDe(nota));
  }
  return variadas;
}

async function rotasDe(p: PainelDeTeste): Promise<string[]> {
  const urls = ["/", "/creditos", "/creditos?pa=11/2026", "/pendencias", "/pendencias?grupo=nao-identificado", "/pendencias?grupo=propria-empresa", "/arquivos", "/nao-existe"];
  const lista = (await p.get("/creditos")).corpo;
  const nota = hrefsNota(lista)[0];
  if (nota !== undefined) urls.push(nota);
  urls.push(...(await notasVariadas(p)).values());
  const textos: string[] = [];
  for (const url of urls) textos.push((await p.get(url)).corpo);
  return textos;
}

describe("nenhuma tela sugere crédito disponível (CA-8, D-3)", () => {
  for (const [nome, origens] of [
    ["os fictícios", [PASTA_FICTICIOS]],
    ["as fixtures de erro", [PASTA_ERROS]],
    ["fictícios e erros juntos (conflito de empresa)", [PASTA_FICTICIOS, PASTA_ERROS]],
  ] as const) {
    it(`em todas as rotas, com ${nome}`, async () => {
      const textos = await rotasDe(await painelCopiando(...origens));
      for (const corpo of textos) {
        const minusculo = corpo.toLowerCase();
        for (const palavra of PROIBIDAS) expect(minusculo, palavra).not.toContain(palavra);
      }
    });
  }

  it("a varredura visita notas de todos os tipos de documento e de todos os motivos de emitente não identificado dos fictícios", async () => {
    const variadas = await notasVariadas(await painelCopiando(PASTA_FICTICIOS));
    const tipos = new Set([...variadas.keys()].map((k) => k.split("|")[0]));
    expect([...tipos].sort()).toEqual(["55", "57", "62", "65", "91"].filter((d) => tipos.has(d)));
    expect(tipos.has("55")).toBe(true);
    expect(tipos.has("91")).toBe(true);
    expect(variadas.has(`91|${MOTIVOS.semLeiaute}`)).toBe(true);
    expect(variadas.size).toBeGreaterThan(tipos.size);
  });

  it("com a pasta pequena de detalhe e a de pendências", async () => {
    for (const arquivos of [arquivosDetalhe, arquivosPendencias]) {
      for (const corpo of await rotasDe(await painelCom(arquivos))) {
        for (const palavra of PROIBIDAS) expect(corpo.toLowerCase(), palavra).not.toContain(palavra);
      }
    }
  });
});

describe("todo texto vindo de arquivo é escapado (DT-10)", () => {
  const PERIGO = `<script>alert(1)</script>"'&`;
  const ESCAPADO = "&lt;script&gt;alert(1)&lt;/script&gt;&quot;&#39;&amp;";

  it("em todas as páginas", async () => {
    const p = await painelCom([[CRED, arquivoCreditos([["11/2026", [credito({ chave: PERIGO, aApropriar: "5.00" })]]], { ni: RAIZ })]]);
    for (const url of ["/", "/arquivos", "/creditos", "/pendencias", "/pendencias?grupo=nao-identificado", urlNota(PERIGO)]) {
      const { corpo, status } = await p.get(url);
      expect(status, url).toBe(200);
      expect(corpo, url).not.toContain("<script>alert");
      if (!["/", "/arquivos", "/pendencias"].includes(url)) expect(corpo, url).toContain(ESCAPADO);
    }
  });
});
