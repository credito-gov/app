import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { guardar } from "../src/armazenamento.js";
import { MENSAGEM_SEM_ALTERACOES } from "../src/saida.js";
import { RESPOSTA_TOKEN, bytesDaFixture, criarAmbienteCli, roteirizarCiclo, type AmbienteCli } from "./apoio/cli.js";
import { ID, SEGREDO, TOKEN, URL_ASSINADA, URL_BASE, URL_TOKEN } from "./apoio/ficticios.js";

/** Serviços que ainda não têm leitor nesta etapa (o estado intermediário some na task 28). */
const SEM_LEITOR = ["debitos"];

function trilha(a: AmbienteCli): string[] {
  return a.api.pedidos.map((p) => {
    if (p.url === URL_TOKEN) return `${p.metodo} TOKEN`;
    if (p.url === URL_ASSINADA) return `${p.metodo} ARQUIVO`;
    return `${p.metodo} ${p.url.replace(URL_BASE, "")}`;
  });
}

function semSegredos(a: AmbienteCli, extra: string = ""): void {
  const tudo = [a.saida.texto(), extra, ...a.arquivosLocais().map((f) => f.texto)].join("\n");
  for (const segredo of [ID, SEGREDO, TOKEN, URL_ASSINADA]) expect(tudo).not.toContain(segredo);
}

describe("consulta de créditos: ciclo completo (CA-1)", () => {
  it("token, abertura, situações, download, arquivo, bruto guardado, validação e resumo, com código 0", async () => {
    const a = criarAmbienteCli();
    const bytes = bytesDaFixture("creditos", "valido.json");
    roteirizarCiclo(a.api, { servico: "creditos", bytes });

    const codigo = await a.rodar(["consulta", "creditos"]);

    expect(codigo).toBe(0);
    expect(trilha(a)).toEqual([
      "POST TOKEN",
      "POST /creditos/12345678",
      "GET /situacao/TIQ-1",
      "GET /situacao/TIQ-1",
      "GET /situacao/TIQ-1",
      "GET /download/TIQ-1",
      "GET ARQUIVO",
    ]);
    const abertura = a.api.pedidos[1];
    expect(abertura.corpo).toBe('{"urlRetorno":""}');
    expect(abertura.cabecalhos.authorization).toBe(`Bearer ${TOKEN}`);

    const texto = a.saida.texto();
    expect(texto).toContain("token obtido");
    expect(texto).toContain("situação: PENDENTE");
    expect(texto).toContain("situação: EM_PROCESSAMENTO");
    expect(texto).toContain("situação: CONCLUIDA");
    expect(texto).toContain("Tempo de processamento: 12 min 0 s");
    expect(texto).toContain("Arquivo guardado");
    expect(texto).toContain("FICT-NFE-0001");
    expect(texto).toContain("total a apropriar 1.000,10");
    expect(texto).not.toContain("12345678000100");
    semSegredos(a);
  });

  it("guarda o arquivo bruto idêntico ao recebido, antes de ler", async () => {
    const a = criarAmbienteCli();
    const bytes = bytesDaFixture("creditos", "valido.json");
    roteirizarCiclo(a.api, { servico: "creditos", bytes });
    await a.rodar(["consulta", "creditos"]);
    const [nome] = a.guardados();
    expect(nome).toMatch(/^\d{8}T\d{6}Z_creditos_TIQ-1\.json$/);
    expect([...readFileSync(join(a.pastaLocal, "arquivos", nome))]).toEqual([...bytes]);
  });

  it("mostra quantas aberturas do serviço já foram registradas hoje, antes de abrir", async () => {
    const a = criarAmbienteCli();
    roteirizarCiclo(a.api, { servico: "creditos", bytes: bytesDaFixture("creditos", "valido.json") });
    await a.rodar(["consulta", "creditos"]);
    const texto = a.saida.texto();
    expect(texto).toContain("Aberturas de creditos registradas hoje: 0 (0 aceitas)");
    expect(texto).toContain("Limite documentado: 4 por API e por credencial");
    expect(texto.indexOf("Aberturas de creditos")).toBeLessThan(texto.indexOf("Tíquete:"));

    // segunda execução no mesmo dia, mesma pasta local
    const b = criarAmbienteCli();
    b.deps.pastaLocal = a.pastaLocal;
    roteirizarCiclo(b.api, { servico: "creditos", bytes: bytesDaFixture("creditos", "valido.json") });
    await b.rodar(["consulta", "creditos"]);
    expect(b.saida.texto()).toContain("Aberturas de creditos registradas hoje: 1 (1 aceitas)");
  });

  it("arquivo vazio é resultado válido: mensagem de sem alterações e código 0", async () => {
    const a = criarAmbienteCli();
    roteirizarCiclo(a.api, { servico: "creditos", bytes: bytesDaFixture("creditos", "vazio.json") });
    expect(await a.rodar(["consulta", "creditos"])).toBe(0);
    expect(a.saida.texto()).toContain(MENSAGEM_SEM_ALTERACOES);
  });

  it("arquivo inválido: fica guardado, código 3, divergências listadas e nenhum resumo", async () => {
    const a = criarAmbienteCli();
    const bytes = bytesDaFixture("creditos", "invalido-obrigatorio.json");
    roteirizarCiclo(a.api, { servico: "creditos", bytes });
    expect(await a.rodar(["consulta", "creditos"])).toBe(3);
    const [nome] = a.guardados();
    expect([...readFileSync(join(a.pastaLocal, "arquivos", nome))]).toEqual([...bytes]);
    const texto = a.saida.texto();
    expect(texto).toContain("não passou no schema");
    expect(texto).toContain("/apuracao/0/creditos/0");
    expect(texto).toContain(nome);
    expect(texto).not.toContain("Período 10/2026");
    expect(texto).not.toContain("total a apropriar");
    semSegredos(a);
  });
});

describe("retomada por tíquete (CA-3)", () => {
  it("--tiquete não abre solicitação nem conta abertura", async () => {
    const a = criarAmbienteCli();
    roteirizarCiclo(a.api, { servico: "creditos", bytes: bytesDaFixture("creditos", "valido.json"), tiquete: "T-9", situacoes: ["CONCLUIDA"] });
    expect(await a.rodar(["consulta", "creditos", "--tiquete", "T-9"])).toBe(0);
    expect(a.api.contar("POST", "/creditos/")).toBe(0);
    expect(trilha(a)).toEqual(["POST TOKEN", "GET /situacao/T-9", "GET /download/T-9", "GET ARQUIVO"]);
    const registro = a.arquivosLocais().find((f) => f.caminho.endsWith("chamadas.jsonl"))?.texto ?? "";
    expect(registro).not.toContain('"tipo":"abertura"');
    expect(a.saida.texto()).not.toContain("Aberturas de creditos registradas hoje");
    expect(a.saida.texto()).toContain("Estimativa: não disponível na retomada");
    expect(a.guardados()[0]).toMatch(/_creditos_T-9\.json$/);
  });

  for (const ruim of ["a b", "x".repeat(201), "t/1", "ç"]) {
    it(`tíquete fora de [A-Za-z0-9._-]{1,200} (${ruim.length > 20 ? "201 caracteres" : ruim}) é código 2, sem chamada`, async () => {
      const a = criarAmbienteCli();
      expect(await a.rodar(["consulta", "creditos", "--tiquete", ruim])).toBe(2);
      expect(a.api.pedidos).toHaveLength(0);
    });
  }

  it("--tiquete sem valor é código 2", async () => {
    const a = criarAmbienteCli();
    expect(await a.rodar(["consulta", "creditos", "--tiquete"])).toBe(2);
    expect(a.api.pedidos).toHaveLength(0);
  });
});

describe("a consulta é obrigatória e única (CA-24)", () => {
  const casos: Array<[string, string[]]> = [
    ["sem consulta", ["consulta"]],
    ["nome desconhecido", ["consulta", "rad"]],
    ["dois nomes", ["consulta", "creditos", "debitos"]],
    ["todas", ["consulta", "todas"]],
    ["sem comando", []],
    ["comando desconhecido", ["abrir"]],
    ["opção desconhecida", ["consulta", "creditos", "--todas"]],
  ];
  for (const [rotulo, argv] of casos) {
    it(`${rotulo}: código 2, lista as opções e não faz nenhuma chamada (nem token)`, async () => {
      const a = criarAmbienteCli();
      expect(await a.rodar(argv)).toBe(2);
      expect(a.api.pedidos).toHaveLength(0);
      const texto = a.saida.texto();
      for (const nome of ["creditos", "recolhimentos", "pagamentos", "debitos"]) expect(texto).toContain(nome);
      expect(a.arquivosLocais()).toHaveLength(0);
    });
  }

  for (const nome of SEM_LEITOR) {
    it(`${nome} ainda sem leitor: não chega a fazer nenhuma chamada`, async () => {
      const a = criarAmbienteCli();
      expect(await a.rodar(["consulta", nome])).toBe(2);
      expect(a.api.pedidos).toHaveLength(0);
    });
  }
});

describe("configuração", () => {
  it("variável ausente: código 2, o erro cita o nome e nenhum valor, sem chamada", async () => {
    const a = criarAmbienteCli({ APURACAO_CLIENT_ID: undefined });
    expect(await a.rodar(["consulta", "creditos"])).toBe(2);
    const texto = a.saida.texto();
    expect(texto).toContain("APURACAO_CLIENT_ID");
    expect(texto).not.toContain(SEGREDO);
    expect(a.api.pedidos).toHaveLength(0);
  });
});

describe("ler um arquivo guardado (CA-5)", () => {
  function guardado(servico: "creditos", arquivo: string) {
    const a = criarAmbienteCli();
    a.deps.env = {}; // ler não exige configuração
    const caminho = guardar({
      pastaLocal: a.pastaLocal,
      servico,
      tiquete: "TIQ-1",
      bytes: bytesDaFixture(servico, arquivo),
      agora: new Date(Date.UTC(2026, 10, 23, 13, 0, 0)),
    });
    return { a, caminho };
  }

  it("valida e resume sem rede, sem token e sem configuração", async () => {
    const { a, caminho } = guardado("creditos", "valido.json");
    let chamadas = 0;
    a.deps.fetch = (async () => {
      chamadas += 1;
      throw new Error("fetch não deveria ser chamado");
    }) as unknown as typeof fetch;
    expect(await a.rodar(["ler", caminho])).toBe(0);
    expect(chamadas).toBe(0);
    expect(a.saida.texto()).toContain("FICT-NFE-0001");
    expect(a.saida.texto()).toContain(caminho);
  });

  it("arquivo vazio: mensagem de sem alterações", async () => {
    const { a, caminho } = guardado("creditos", "vazio.json");
    expect(await a.rodar(["ler", caminho])).toBe(0);
    expect(a.saida.texto()).toContain(MENSAGEM_SEM_ALTERACOES);
  });

  it("arquivo inválido: código 3 e nenhum resumo", async () => {
    const { a, caminho } = guardado("creditos", "invalido-tres-casas.json");
    expect(await a.rodar(["ler", caminho])).toBe(3);
    expect(a.saida.texto()).toContain("não passou no schema");
    expect(a.saida.texto()).not.toContain("total a apropriar");
  });

  it("nome fora do padrão: código 2 com o padrão explicado", async () => {
    const a = criarAmbienteCli();
    expect(await a.rodar(["ler", join(a.pastaLocal, "qualquer.json")])).toBe(2);
    expect(a.saida.texto()).toContain("AAAAMMDDTHHMMSSZ_<servico>_<tiquete>.json");
  });

  it("sem caminho: código 2", async () => {
    const a = criarAmbienteCli();
    expect(await a.rodar(["ler"])).toBe(2);
  });
});

describe("erros encerram sem expor segredos (CA-4, CA-12)", () => {
  const cenarios: Array<[string, (a: AmbienteCli) => void]> = [
    ["token recusado (401)", (a) => a.api.rota("POST", "/token", { status: 401, corpo: { error: "invalid_client" } })],
    [
      "limite excedido na abertura (429)",
      (a) => {
        a.api.rota("POST", "/token", RESPOSTA_TOKEN);
        a.api.rota("POST", "/creditos/12345678", { status: 429, corpo: { codigoErro: "LIMITE", mensagemErro: "limite" } });
      },
    ],
    [
      "situação ERRO",
      (a) => {
        a.api.rota("POST", "/token", RESPOSTA_TOKEN);
        a.api.rota("POST", "/creditos/12345678", { status: 201, corpo: { tiqueteSolicitacao: "TIQ-1", tEASegundos: -1 } });
        a.api.rota("GET", "/situacao/", { status: 200, corpo: { situacao: "ERRO", codigoErro: "E1", mensagemErro: "falhou" } });
      },
    ],
    [
      "download 404",
      (a) => {
        a.api.rota("POST", "/token", RESPOSTA_TOKEN);
        a.api.rota("POST", "/creditos/12345678", { status: 201, corpo: { tiqueteSolicitacao: "TIQ-1", tEASegundos: -1 } });
        a.api.rota("GET", "/situacao/", { status: 200, corpo: { situacao: "CONCLUIDA" } });
        a.api.rota("GET", "/download/", { status: 404, corpo: { codigoErro: "ARQUIVO_INDISPONIVEL", mensagemErro: "x" } });
      },
    ],
    [
      "urlAssinada recusada (403)",
      (a) => {
        a.api.rota("POST", "/token", RESPOSTA_TOKEN);
        a.api.rota("POST", "/creditos/12345678", { status: 201, corpo: { tiqueteSolicitacao: "TIQ-1", tEASegundos: -1 } });
        a.api.rota("GET", "/situacao/", { status: 200, corpo: { situacao: "CONCLUIDA" } });
        a.api.rota("GET", "/download/", { status: 200, corpo: { urlAssinada: URL_ASSINADA } });
        a.api.rota("GET", "arquivo?assinatura", { status: 403 });
      },
    ],
  ];

  for (const [rotulo, montar] of cenarios) {
    it(`${rotulo}: código 1, mensagem clara, uma só abertura no máximo e nenhum segredo`, async () => {
      const a = criarAmbienteCli();
      montar(a);
      const codigo = await a.rodar(["consulta", "creditos"]);
      expect(codigo).toBe(1);
      expect(a.api.contar("POST", "/creditos/")).toBeLessThanOrEqual(1);
      expect(a.api.contar("POST", "/token")).toBe(1);
      expect(a.saida.texto().length).toBeGreaterThan(0);
      semSegredos(a);
    });
  }
});
