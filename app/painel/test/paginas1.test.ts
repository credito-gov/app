import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { montarVisao } from "../src/nucleo/visao.js";
import { paginaDeErro } from "../src/paginas/erro.js";
import { criarPainel } from "../src/rotas.js";
import { afterEach, describe, expect, it } from "vitest";
import { arquivoCreditos, arquivoDebitos, bytes, credito, debito, NI14, NI14_OUTRA, RAIZ, montarChave } from "./apoio/construtores.js";
import { cnpjInvalidoDe } from "./apoio/dv.js";
import { limparPaineis, painelCom, painelCopiando, painelSemPasta, PASTA_ERROS, PASTA_FICTICIOS } from "./apoio/painel.js";
import { nomeArquivo, pastaTemporaria } from "./apoio/pasta.js";

afterEach(limparPaineis);

const CRED = nomeArquivo("creditos", "FICTP1", "20261120T101530Z");
const DEB = nomeArquivo("debitos", "FICTP1", "20261120T101530Z");
const chave = (b8: string, i: number) => montarChave({ emitente: cnpjInvalidoDe(`${b8}0001`), codigo: String(60000000 + i) });

// Pasta pequena, de totais conhecidos à mão. ni de 8 dígitos: sem aviso de divergência.
const creditosP1 = arquivoCreditos(
  [
    [
      "11/2026",
      [
        credito({ chave: chave("11223344", 1), aApropriar: "1000.00" }),
        credito({ chave: chave("11223344", 2), aApropriar: "234.56" }),
        credito({ chave: chave("66778899", 3), apropriado: "50", utilizado: "20", saldoCredor: "30" }),
      ],
    ],
    ["10/2026", [credito({ chave: chave("66778899", 4), aApropriar: "10.5" })]],
  ],
  { ni: RAIZ },
);
const debitosP1 = arquivoDebitos([["11/2026", [debito({ chave: chave("11223344", 5), apurado: "800.00", extinto: "300.00", saldoDevedor: "500.00" })]]], { ni: RAIZ });

const P1: Array<[string, unknown]> = [
  [CRED, creditosP1],
  [DEB, debitosP1],
];

describe("layout comum (CA-5, CA-2)", () => {
  it("cabeçalho com o nome do painel, a raiz formatada e a data dos dados", async () => {
    const { get } = await painelCom(P1);
    const r = await get("/");
    expect(r.status).toBe(200);
    expect(r.tipo).toBe("text/html; charset=utf-8");
    expect(r.corpo).toContain("Painel de crédito de CBS");
    expect(r.corpo).toContain("90.817.263");
    expect(r.corpo).toContain("Dados gerados em 20/11/2026 10:15 (-03:00)");
  });

  it("links de navegação e folha de estilo, sem script", async () => {
    const { get } = await painelCom(P1);
    const r = await get("/");
    for (const href of ["/", "/creditos", "/pendencias", "/arquivos"]) expect(r.corpo).toContain(`href="${href}"`);
    expect(r.corpo).toContain('href="/estilo.css"');
    expect(r.corpo.toLowerCase()).not.toContain("<script");
  });

  it("sem arquivo recusado nem divergência, não há aviso", async () => {
    const { get } = await painelCom(P1);
    expect((await get("/")).corpo).not.toContain('class="aviso-arquivos"');
  });

  it("com arquivo aceito com divergência, avisa e liga para /arquivos", async () => {
    const { get } = await painelCom([[CRED, arquivoCreditos([["11/2026", [credito({ aApropriar: "1" })]]], { ni: NI14 })]]);
    const r = await get("/");
    expect(r.corpo).toContain('class="aviso-arquivos"');
    expect(r.corpo).toMatch(/class="aviso-arquivos"[\s\S]*href="\/arquivos"/);
  });

  it("com arquivo recusado, avisa e liga para /arquivos", async () => {
    const { get } = await painelCom([...P1, [nomeArquivo("creditos", "FICTRUIM"), "{ ilegível"]]);
    for (const url of ["/", "/arquivos"]) expect((await get(url)).corpo).toContain('class="aviso-arquivos"');
  });
});

describe("aviso do cabeçalho com as contagens separadas (rodada 1, C2)", () => {
  const aviso = (corpo: string) => /<div class="aviso-arquivos">([\s\S]*?)<\/div>/.exec(corpo)?.[1] ?? "";

  it("diz quantos recusados, ignorados e aceitos com divergência conhecida", async () => {
    const { get } = await painelCom([
      [CRED, arquivoCreditos([["11/2026", [credito({ aApropriar: "1" })]]], { ni: NI14 })],
      [nomeArquivo("creditos", "FICTRUIM"), "{ ilegível"],
      ["resposta.json", "{}"],
    ]);
    const texto = aviso((await get("/")).corpo);
    expect(texto).toContain("1 arquivo recusado");
    expect(texto).toContain("não entra nos totais");
    expect(texto).toContain("1 arquivo ignorado");
    expect(texto).toContain("1 arquivo aceito com divergência conhecida");
    expect(texto).toContain('href="/arquivos"');
  });

  it("no plural, e sem falar do que não existe", async () => {
    const { get } = await painelCom([
      [CRED, arquivoCreditos([["11/2026", [credito({ aApropriar: "1" })]]], { ni: NI14 })],
      [DEB, arquivoDebitos([["11/2026", [debito({ apurado: "1" })]]], { ni: NI14 })],
    ]);
    const texto = aviso((await get("/")).corpo);
    expect(texto).toContain("2 arquivos aceitos com divergência conhecida");
    expect(texto).not.toContain("recusado");
    expect(texto).not.toContain("ignorado");
  });

  it("só arquivo recusado: o aviso fala em recusa, não em divergência conhecida", async () => {
    const { get } = await painelCom([...P1, [nomeArquivo("creditos", "FICTRUIM"), "{ ilegível"], [nomeArquivo("debitos", "FICTRUIM2"), "{ ilegível"]]);
    const texto = aviso((await get("/")).corpo);
    expect(texto).toContain("2 arquivos recusados");
    expect(texto).not.toContain("divergência conhecida");
  });

  it("arquivo ignorado também acende o aviso", async () => {
    const { get } = await painelCom([...P1, ["resposta.json", "{}"]]);
    const texto = aviso((await get("/")).corpo);
    expect(texto).toContain("1 arquivo ignorado");
  });
});

describe("estado vazio com arquivo que não entrou (rodada 1, C1)", () => {
  const RUIM = nomeArquivo("creditos", "FICTRUIM");
  const naoEntrou = /class="vazio">[^<]*arquivo de créditos que não entrou[\s\S]*?href="\/arquivos"/;

  it("créditos recusados: a tela não atribui o vazio à Receita e liga para /arquivos", async () => {
    const { get } = await painelCom([[RUIM, "{ ilegível"]]);
    for (const url of ["/", "/creditos", "/pendencias"]) {
      const corpo = (await get(url)).corpo;
      expect(corpo, url).toMatch(naoEntrou);
      expect(corpo, url).not.toContain("A Receita não devolveu créditos");
    }
  });

  it("créditos aceitos mas vazios ao lado de um recusado: também não atribui à Receita", async () => {
    const { get } = await painelCom([
      [CRED, { ...arquivoCreditos([], { ni: RAIZ }), apuracao: [] }],
      [nomeArquivo("creditos", "FICTRUIM", "20261121T101530Z"), "{ ilegível"],
    ]);
    const corpo = (await get("/")).corpo;
    expect(corpo).toMatch(naoEntrou);
    expect(corpo).not.toContain("A Receita não devolveu créditos");
  });

  it("vários arquivos: plural", async () => {
    const { get } = await painelCom([[RUIM, "{ ilegível"], [nomeArquivo("creditos", "FICTRUIM2"), "{ ilegível"]]);
    expect((await get("/")).corpo).toContain("2 arquivos de créditos que não entraram");
  });

  it("sem arquivo de créditos, ou só com créditos vazios, continua dizendo que a Receita não devolveu", async () => {
    const casos: Array<Array<[string, unknown]>> = [
      [],
      [[CRED, { ...arquivoCreditos([], { ni: RAIZ }), apuracao: [] }]],
      [[DEB, debitosP1], [nomeArquivo("debitos", "FICTRUIM"), "{ ilegível"]],
    ];
    for (const arquivos of casos) {
      const corpo = (await (await painelCom(arquivos)).get("/")).corpo;
      expect(corpo).toContain("A Receita não devolveu créditos nos arquivos lidos.");
    }
  });

  it("débitos recusados: o bloco de débitos não diz que não há débito", async () => {
    const { get } = await painelCom([[CRED, creditosP1], [nomeArquivo("debitos", "FICTRUIM"), "{ ilegível"]]);
    const corpo = (await get("/")).corpo;
    expect(corpo).not.toContain("Nenhum débito nos arquivos lidos.");
    expect(corpo).toMatch(/arquivo de débitos que não entrou[\s\S]*?href="\/arquivos"/);
  });

  it("sem arquivo de débitos, segue dizendo que não há débito", async () => {
    const { get } = await painelCom([[CRED, creditosP1]]);
    expect((await get("/")).corpo).toContain("Nenhum débito nos arquivos lidos.");
  });
});

describe("arquivo recusado ao lado de um válido (CA-2, rodada 1, E5)", () => {
  it("os totais do saldo e das pendências são só os do arquivo válido", async () => {
    const recusado = arquivoCreditos([["11/2026", [credito({ chave: "FICT-RECUSADA", aApropriar: "999.123" })]]], { ni: RAIZ });
    const sozinho = await painelCom(P1);
    const junto = await painelCom([...P1, [nomeArquivo("creditos", "FICTRUIM", "20261121T101530Z"), recusado]]);
    const bloco = (corpo: string) => /<h2>Crédito de CBS \(compras\)<\/h2>[\s\S]*?<\/section>/.exec(corpo)?.[0] ?? "";

    const saldo = (await junto.get("/")).corpo;
    expect(bloco(saldo)).toContain("R$ 1.245,06");
    expect(bloco(saldo)).toBe(bloco((await sozinho.get("/")).corpo));
    expect(saldo).not.toContain("999");
    expect(saldo).toContain("1 arquivo recusado");
    expect((await junto.get("/creditos")).corpo).not.toContain("FICT-RECUSADA");
    const pendencias = (await junto.get("/pendencias")).corpo;
    expect(pendencias).toContain("R$ 1.245,06");
    expect(pendencias).not.toContain("999");
  });
});

describe("saldo na página inicial (CA-7, CA-9, CA-D2)", () => {
  it("os quatro rótulos da D-3, com o nome do campo ao lado", async () => {
    const { corpo } = await (await painelCom(P1)).get("/");
    for (const [rotulo, campo] of [
      ["A apropriar (pendente)", "aApropriar"],
      ["Apropriado", "apropriado"],
      ["Já utilizado", "utilizado"],
      ["Saldo credor não utilizado", "saldoCredor"],
    ]) {
      expect(corpo).toContain(rotulo);
      expect(corpo).toContain(`<code>${campo}</code>`);
    }
  });

  it("totais gerais e por período no padrão brasileiro, conferidos à mão", async () => {
    const { corpo } = await (await painelCom(P1)).get("/");
    expect(corpo).toContain("R$ 1.245,06"); // a apropriar geral: 1.000 + 234,56 + 10,50
    expect(corpo).toContain("R$ 1.234,56"); // a apropriar em 11/2026
    expect(corpo).toContain("R$ 10,50"); // a apropriar em 10/2026
    expect(corpo).toContain("R$ 50,00"); // apropriado
    expect(corpo).toContain("R$ 20,00"); // utilizado
    expect(corpo).toContain("R$ 30,00"); // saldo credor
    expect(corpo.indexOf(">10/2026<")).toBeGreaterThan(0);
    expect(corpo.indexOf(">10/2026<")).toBeLessThan(corpo.indexOf(">11/2026<"));
  });

  it("diz que mostra só CBS e que o IBS não está na fonte", async () => {
    const { corpo } = await (await painelCom(P1)).get("/");
    expect(corpo).toContain("Só CBS: o IBS não está na fonte de dados.");
  });

  it("bloco de débitos separado, com o texto de não haver saldo líquido", async () => {
    const { corpo } = await (await painelCom(P1)).get("/");
    expect(corpo).toContain("Débitos de CBS (vendas)");
    expect(corpo).toContain("Débitos das vendas, mostrados à parte. O painel não calcula saldo líquido entre crédito e débito.");
    for (const [rotulo, campo] of [
      ["Apurado", "apurado"],
      ["Extinto", "extinto"],
      ["Saldo devedor", "saldoDevedor"],
    ]) {
      expect(corpo).toContain(rotulo);
      expect(corpo).toContain(`<code>${campo}</code>`);
    }
    expect(corpo).toContain("R$ 800,00");
    expect(corpo).toContain("R$ 300,00");
    expect(corpo).toContain("R$ 500,00");
    expect(corpo.indexOf("Débitos de CBS (vendas)")).toBeGreaterThan(corpo.indexOf("Saldo credor não utilizado"));
  });

  it("nenhum valor de crédito aparece dentro do bloco de débitos", async () => {
    const { corpo } = await (await painelCom(P1)).get("/");
    const bloco = corpo.slice(corpo.indexOf("Débitos de CBS (vendas)"));
    expect(bloco).not.toContain("R$ 1.245,06");
    expect(bloco).not.toContain("saldoCredor");
  });
});

describe("data dos dados (CA-5)", () => {
  it("por serviço: geração mais recente, quantidade de arquivos e intervalo de atualização", async () => {
    const { corpo } = await (await painelCom([
      [CRED, creditosP1],
      [nomeArquivo("creditos", "FICTP2", "20261121T101530Z"), arquivoCreditos([["11/2026", [credito({ chave: "OUTRA", aApropriar: "1", atualizacao: "2026-11-19T09:00:00-03:00" })]]], { ni: RAIZ, geradoEm: "2026-11-21T10:15:30.000-03:00" })],
      [DEB, debitosP1],
    ])).get("/");
    expect(corpo).toContain("21/11/2026 10:15 (-03:00)");
    expect(corpo).toContain("2 arquivos");
    expect(corpo).toContain("1 arquivo");
    expect(corpo).toContain("18/11/2026 08:00 (-03:00)"); // menor atualização
    expect(corpo).toContain("19/11/2026 09:00 (-03:00)"); // maior atualização
  });

  it("avisa que a visão é só a dos arquivos lidos, sem afirmar o tamanho da janela", async () => {
    for (const url of ["/", "/arquivos"]) {
      const { corpo } = await (await painelCom(P1)).get(url);
      expect(corpo, url).toContain("A visão é só a dos arquivos lidos. A Receita não fornece histórico por esta API.");
      expect(corpo, url).not.toContain("8 dias");
    }
  });
});

describe("estado vazio (CA-6)", () => {
  it("pasta só com arquivo de créditos vazio", async () => {
    const { corpo } = await (await painelCom([[CRED, { ...arquivoCreditos([], { ni: RAIZ }), apuracao: [] }]])).get("/");
    expect(corpo).toContain("A Receita não devolveu créditos nos arquivos lidos.");
    expect(corpo).not.toContain("R$ 0,00");
    expect(corpo).not.toContain("A apropriar (pendente)");
  });

  it("pasta sem nenhum arquivo", async () => {
    const { corpo } = await (await painelCom([])).get("/");
    expect(corpo).toContain("A Receita não devolveu créditos nos arquivos lidos.");
    expect(corpo).not.toContain("R$ 0,00");
  });

  it("sem créditos, o bloco de débitos continua", async () => {
    const { corpo } = await (await painelCom([[DEB, debitosP1]])).get("/");
    expect(corpo).toContain("A Receita não devolveu créditos nos arquivos lidos.");
    expect(corpo).toContain("Débitos de CBS (vendas)");
  });
});

describe("/arquivos (CA-2, CA-3, CA-5)", () => {
  it("cada arquivo com a situação e o motivo", async () => {
    const { get } = await painelCopiando(PASTA_ERROS);
    const { corpo } = await get("/arquivos");
    for (const nome of ["FICTOUTRA01", "FICTINVAL01", "FICTILEG01", "FICTPAG01", "resposta-sem-padrao.json"]) expect(corpo).toContain(nome);
    expect(corpo).toContain("recusado");
    expect(corpo).toContain("JSON inválido");
    expect(corpo).toContain("ignorado: serviço não usado pelo painel");
    expect(corpo).toContain("ignorado: nome fora do padrão da apuracao-cbs");
  });

  it("marca a divergência conhecida do schema com o nome da divergência", async () => {
    const { corpo } = await (await painelCom([[CRED, arquivoCreditos([["11/2026", [credito()]]], { ni: NI14 })]])).get("/arquivos");
    expect(corpo).toContain("aceito com divergência conhecida do schema 1.0.0");
    expect(corpo).toContain("ni com 14 dígitos (o schema exige 8)");
  });

  it("arquivo sem divergência aparece como aceito, com a raiz e a quantidade", async () => {
    const { corpo } = await (await painelCom(P1)).get("/arquivos");
    expect(corpo).toContain("90.817.263");
    expect(corpo).toMatch(/aceito(?! com)/);
  });

  it("versões substituídas por serviço", async () => {
    const dobrado: Array<[string, unknown]> = [...P1, [nomeArquivo("creditos", "FICTP9", "20261122T101530Z"), creditosP1]];
    const { corpo } = await (await painelCom(dobrado)).get("/arquivos");
    expect(corpo).toContain("Versões substituídas na consolidação");
    expect(corpo).toContain("Créditos: 4");
    expect(corpo).toContain("Débitos: 0");
  });

  it("a lista usa só o nome do arquivo e escapa o que vem de fora", async () => {
    const { corpo } = await (await painelCom([[nomeArquivo("creditos", "FICT&X'Y"), "{ ilegível"]])).get("/arquivos");
    expect(corpo).toContain("FICT&amp;X&#39;Y");
    expect(corpo).not.toContain("FICT&X'Y");
  });
});

describe("conflito entre empresas (CA-3)", () => {
  const arquivos: Array<[string, unknown]> = [
    [nomeArquivo("creditos", "FICTA", "20261120T101530Z"), arquivoCreditos([["11/2026", [credito({ aApropriar: "77.77" })]]], { ni: NI14 })],
    [nomeArquivo("creditos", "FICTB", "20261121T101530Z"), arquivoCreditos([["11/2026", [credito({ chave: "OUTRA", aApropriar: "88.88" })]]], { ni: NI14_OUTRA })],
  ];

  it("todas as rotas, menos /arquivos e /estilo.css, mostram só o erro e os divergentes, sem valor", async () => {
    const { get } = await painelCom(arquivos);
    for (const url of ["/", "/creditos", "/pendencias", "/creditos/nota?pa=11/2026&documento=55&origem=0&chave=OUTRA"]) {
      const r = await get(url);
      expect(r.corpo, url).toContain("Arquivos de mais de uma empresa");
      expect(r.corpo, url).toContain("FICTA");
      expect(r.corpo, url).toContain("FICTB");
      expect(r.corpo, url).toContain("90.817.263");
      expect(r.corpo, url).toContain("55.443.322");
      expect(r.corpo, url).not.toContain("R$");
      expect(r.corpo, url).not.toContain("77,77");
    }
  });

  it("/arquivos continua mostrando a lista, com a raiz de cada arquivo", async () => {
    const { corpo } = await (await painelCom(arquivos)).get("/arquivos");
    expect(corpo).toContain("Arquivos de mais de uma empresa");
    expect(corpo).toContain("55.443.322");
    expect(corpo).toContain("FICTA");
  });

  it("arquivo recusado de outra empresa não gera conflito", async () => {
    const { corpo } = await (await painelCom([...P1, [nomeArquivo("creditos", "FICTZ", "20261122T101530Z"), { ...arquivoCreditos([["11/2026", [credito({ origem: 7 })]]], { ni: NI14_OUTRA }) }]])).get("/");
    expect(corpo).not.toContain("Arquivos de mais de uma empresa");
  });
});

describe("pasta ilegível", () => {
  it("todas as páginas dizem que a pasta não pôde ser lida, com o caminho", async () => {
    const inexistente = join(PASTA_FICTICIOS, "..", "nao-existe-nesta-pasta");
    const { get } = painelSemPasta(inexistente);
    for (const url of ["/", "/creditos", "/pendencias", "/arquivos"]) {
      const r = await get(url);
      expect(r.status, url).toBe(200);
      expect(r.corpo, url).toContain("A pasta não pôde ser lida");
      expect(r.corpo, url).toContain("nao-existe-nesta-pasta");
      expect(r.corpo, url).not.toContain("R$");
    }
  });
});

describe("pasta ilegível: o código do erro orienta (rodada 1, A4)", () => {
  const visaoComErro = (codigoErro: string) =>
    montarVisao({ pasta: "/x", legivel: false, erro: `A pasta não pôde ser lida (${codigoErro}): /x`, codigoErro, arquivos: [] });

  it("permissão negada não manda conferir o caminho", () => {
    const corpo = paginaDeErro(visaoComErro("EACCES"), "Saldo", "/")!;
    expect(corpo).toContain("EACCES");
    expect(corpo).toContain("permiss");
    expect(corpo).not.toContain("Confira o caminho");
  });

  it("pasta inexistente manda conferir o caminho", () => {
    const corpo = paginaDeErro(visaoComErro("ENOENT"), "Saldo", "/")!;
    expect(corpo).toContain("ENOENT");
    expect(corpo).toContain("Confira o caminho");
  });
});

describe("falha passageira de leitura não vira recusa permanente (rodada 1, A2)", () => {
  it("a segunda requisição lê de novo o arquivo que falhou", async () => {
    const pasta = await pastaTemporaria();
    try {
      await pasta.escrever(CRED, bytes(creditosP1));
      let chamadas = 0;
      const lerArquivo = async (caminho: string) => {
        if (++chamadas === 1) throw Object.assign(new Error("EBUSY"), { code: "EBUSY" });
        return new Uint8Array(await readFile(caminho));
      };
      const painel = criarPainel({ pasta: pasta.caminho, lerArquivo });
      const primeira = await painel.tratar({ metodo: "GET", url: "/arquivos" });
      expect(primeira.corpo).toContain("EBUSY");
      const segunda = await painel.tratar({ metodo: "GET", url: "/arquivos" });
      expect(segunda.corpo).not.toContain("EBUSY");
      expect(segunda.corpo).toContain("aceito");
    } finally {
      await pasta.limpar();
    }
  });
});

describe("rotas e estilo (D-8)", () => {
  it("rota inexistente é 404", async () => {
    const { get } = await painelCom(P1);
    const r = await get("/nao-existe");
    expect(r.status).toBe(404);
    expect(r.tipo).toBe("text/html; charset=utf-8");
    expect(r.corpo).toContain("Página não encontrada");
  });

  it("/estilo.css com o tipo text/css e as cores do tema escuro", async () => {
    const { get } = await painelCom(P1);
    const r = await get("/estilo.css");
    expect(r.status).toBe(200);
    expect(r.tipo).toBe("text/css; charset=utf-8");
    for (const cor of ["#060a13", "#0e1524", "#111827", "#1e293b", "#e2e8f0", "#94a3b8", "#64748b", "#10b981", "#047857", "#fbbf24"]) expect(r.corpo).toContain(cor);
    expect(r.corpo).toContain("Inter");
    expect(r.corpo).toContain("system-ui");
    expect(r.corpo).not.toMatch(/@import|url\(\s*["']?https?:/);
  });
});

describe("a pasta padrão de fictícios (CA-17)", () => {
  it("a página inicial abre com totais e o aviso de divergência conhecida", async () => {
    const { get } = await painelCopiando(PASTA_FICTICIOS);
    const r = await get("/");
    expect(r.status).toBe(200);
    expect(r.corpo).toContain("A apropriar (pendente)");
    expect(r.corpo).toContain("Débitos de CBS (vendas)");
    expect(r.corpo).toContain('class="aviso-arquivos"');
    expect(r.corpo).not.toContain("Arquivos de mais de uma empresa");
  });
});
