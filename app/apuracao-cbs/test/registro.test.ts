import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { criarRegistro } from "../src/registro.js";
import { pastaTemporaria } from "./apoio/pasta.js";
import { SEGREDO, TOKEN, URL_ASSINADA } from "./apoio/ficticios.js";

function novo(agora: Date) {
  const pastaLocal = pastaTemporaria();
  let atual = agora;
  const registro = criarRegistro({ pastaLocal, relogio: { agora: () => atual } });
  return {
    pastaLocal,
    registro,
    em(d: Date) {
      atual = d;
    },
    linhas: () =>
      readFileSync(join(pastaLocal, "chamadas.jsonl"), "utf8")
        .split("\n")
        .filter(Boolean),
  };
}

describe("registrar", () => {
  it("grava uma linha JSON por chamada, em acréscimo, com exatamente cinco campos", () => {
    const t = novo(new Date(2026, 10, 23, 14, 25, 30, 123));
    t.registro.registrar({ servico: "creditos", tipo: "token", http: 200, tiquete: null });
    t.registro.registrar({ servico: "creditos", tipo: "abertura", http: 201, tiquete: "TIQ-1" });
    const linhas = t.linhas();
    expect(linhas).toHaveLength(2);
    const primeira = JSON.parse(linhas[0]) as Record<string, unknown>;
    expect(Object.keys(primeira)).toEqual(["quando", "servico", "tipo", "http", "tiquete"]);
    expect(primeira).toMatchObject({ servico: "creditos", tipo: "token", http: 200, tiquete: null });
    expect(JSON.parse(linhas[1])).toMatchObject({ tipo: "abertura", http: 201, tiquete: "TIQ-1" });
  });

  it("grava quando em ISO 8601 com o fuso local", () => {
    const instante = new Date(2026, 10, 23, 14, 25, 30, 123);
    const t = novo(instante);
    t.registro.registrar({ servico: "debitos", tipo: "situacao", http: 200, tiquete: "T" });
    const { quando } = JSON.parse(t.linhas()[0]) as { quando: string };
    expect(quando).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2}$/);
    expect(new Date(quando).getTime()).toBe(instante.getTime());
    expect(quando.startsWith("2026-11-23T14:25:30.123")).toBe(true);
  });

  it("aceita http null quando não houve resposta", () => {
    const t = novo(new Date(2026, 10, 23, 10, 0, 0));
    t.registro.registrar({ servico: "pagamentos", tipo: "arquivo", http: null, tiquete: "T" });
    expect(JSON.parse(t.linhas()[0])).toMatchObject({ http: null });
  });

  it("não deixa token, segredo, urlAssinada nem corpo chegarem ao arquivo", () => {
    const t = novo(new Date(2026, 10, 23, 10, 0, 0));
    const entrada = {
      servico: "creditos",
      tipo: "download",
      http: 200,
      tiquete: "T-1",
      token: TOKEN,
      segredo: SEGREDO,
      urlAssinada: URL_ASSINADA,
      corpo: { urlAssinada: URL_ASSINADA, apuracao: [] },
      situacao: "CONCLUIDA",
    };
    t.registro.registrar(entrada as never);
    const bruto = readFileSync(join(t.pastaLocal, "chamadas.jsonl"), "utf8");
    for (const proibido of [TOKEN, SEGREDO, URL_ASSINADA, "apuracao", "CONCLUIDA", "corpo"]) {
      expect(bruto).not.toContain(proibido);
    }
    expect(Object.keys(JSON.parse(bruto) as object)).toEqual(["quando", "servico", "tipo", "http", "tiquete"]);
  });

  it("cria a pasta local se ela não existir e não cria arquivo sem chamada", () => {
    const pastaLocal = join(pastaTemporaria(), "ainda", "nao", "existe");
    const registro = criarRegistro({ pastaLocal, relogio: { agora: () => new Date() } });
    expect(existsSync(join(pastaLocal, "chamadas.jsonl"))).toBe(false);
    registro.registrar({ servico: "creditos", tipo: "token", http: 200, tiquete: null });
    expect(existsSync(join(pastaLocal, "chamadas.jsonl"))).toBe(true);
  });
});

describe("contarAberturas", () => {
  it("conta por serviço e por dia local, com total e aceitas (2xx)", () => {
    const t = novo(new Date(2026, 10, 22, 23, 59, 0));
    t.registro.registrar({ servico: "creditos", tipo: "abertura", http: 201, tiquete: "A" }); // ontem
    t.em(new Date(2026, 10, 23, 0, 1, 0));
    t.registro.registrar({ servico: "creditos", tipo: "abertura", http: 201, tiquete: "B" });
    t.em(new Date(2026, 10, 23, 9, 0, 0));
    t.registro.registrar({ servico: "creditos", tipo: "abertura", http: 429, tiquete: null });
    t.registro.registrar({ servico: "creditos", tipo: "situacao", http: 200, tiquete: "B" }); // não é abertura
    t.registro.registrar({ servico: "debitos", tipo: "abertura", http: 201, tiquete: "C" }); // outro serviço
    t.em(new Date(2026, 10, 23, 23, 59, 59));
    t.registro.registrar({ servico: "creditos", tipo: "abertura", http: null, tiquete: null });

    expect(t.registro.contarAberturas("creditos", new Date(2026, 10, 23, 12, 0, 0))).toEqual({ total: 3, aceitas: 1 });
    expect(t.registro.contarAberturas("creditos", new Date(2026, 10, 22, 12, 0, 0))).toEqual({ total: 1, aceitas: 1 });
    expect(t.registro.contarAberturas("debitos", new Date(2026, 10, 23, 12, 0, 0))).toEqual({ total: 1, aceitas: 1 });
    expect(t.registro.contarAberturas("recolhimentos", new Date(2026, 10, 23, 12, 0, 0))).toEqual({
      total: 0,
      aceitas: 0,
    });
  });

  it("sem arquivo de registro, tudo é zero", () => {
    const t = novo(new Date());
    expect(t.registro.contarAberturas("creditos", new Date())).toEqual({ total: 0, aceitas: 0 });
    expect(t.registro.pedidosDeTokenDesde(new Date(0))).toEqual([]);
    expect(t.registro.primeiraAbertura("X")).toBeUndefined();
  });

  it("vale também para outra instância sobre a mesma pasta", () => {
    const t = novo(new Date(2026, 10, 23, 9, 0, 0));
    t.registro.registrar({ servico: "creditos", tipo: "abertura", http: 201, tiquete: "A" });
    const outra = criarRegistro({ pastaLocal: t.pastaLocal, relogio: { agora: () => new Date() } });
    expect(outra.contarAberturas("creditos", new Date(2026, 10, 23, 12, 0, 0)).total).toBe(1);
  });
});

describe("pedidosDeTokenDesde", () => {
  it("devolve os instantes dos pedidos de token a partir do limite, com qualquer resultado", () => {
    const t = novo(new Date(2026, 10, 23, 9, 0, 0));
    t.registro.registrar({ servico: "creditos", tipo: "token", http: 401, tiquete: null });
    t.em(new Date(2026, 10, 23, 9, 30, 0));
    t.registro.registrar({ servico: "creditos", tipo: "token", http: 200, tiquete: null });
    t.registro.registrar({ servico: "creditos", tipo: "abertura", http: 201, tiquete: "A" });
    t.em(new Date(2026, 10, 23, 10, 10, 0));
    t.registro.registrar({ servico: "debitos", tipo: "token", http: null, tiquete: null });

    const desde = t.registro.pedidosDeTokenDesde(new Date(2026, 10, 23, 9, 15, 0));
    expect(desde.map((d) => d.getTime())).toEqual([
      new Date(2026, 10, 23, 9, 30, 0).getTime(),
      new Date(2026, 10, 23, 10, 10, 0).getTime(),
    ]);
    expect(t.registro.pedidosDeTokenDesde(new Date(2026, 10, 23, 8, 0, 0))).toHaveLength(3);
  });
});

describe("primeiraAbertura", () => {
  it("devolve o horário do primeiro registro de abertura do tíquete", () => {
    const t = novo(new Date(2026, 10, 23, 9, 0, 0));
    t.registro.registrar({ servico: "creditos", tipo: "abertura", http: 201, tiquete: "T-1" });
    t.em(new Date(2026, 10, 23, 9, 5, 0));
    t.registro.registrar({ servico: "creditos", tipo: "situacao", http: 200, tiquete: "T-1" });
    t.registro.registrar({ servico: "creditos", tipo: "abertura", http: 201, tiquete: "T-2" });

    expect(t.registro.primeiraAbertura("T-1")?.getTime()).toBe(new Date(2026, 10, 23, 9, 0, 0).getTime());
    expect(t.registro.primeiraAbertura("T-2")?.getTime()).toBe(new Date(2026, 10, 23, 9, 5, 0).getTime());
    expect(t.registro.primeiraAbertura("T-3")).toBeUndefined();
  });
});

describe("registro ilegível e gravação que falha", () => {
  const valida = (extra: string) =>
    `{"quando":"2026-11-23T09:00:00.000-03:00","servico":"creditos","tipo":"abertura","http":201,"tiquete":"T-1"}
${extra}`;

  function com(conteudo: string) {
    const pastaLocal = pastaTemporaria();
    writeFileSync(join(pastaLocal, "chamadas.jsonl"), conteudo);
    const avisos: string[] = [];
    const registro = criarRegistro({
      pastaLocal,
      relogio: { agora: () => new Date(2026, 10, 23, 10, 0, 0) },
      avisar: (t) => avisos.push(t),
    });
    return { pastaLocal, registro, avisos };
  }

  it("linha malformada: não lança, avisa com o número da linha e conta como abertura feita", () => {
    const t = com(valida("{isto nao e json\n"));
    const dia = new Date(2026, 10, 23, 12, 0, 0);
    expect(t.registro.contarAberturas("creditos", dia)).toEqual({ total: 2, aceitas: 1 });
    expect(t.avisos).toHaveLength(1);
    expect(t.avisos[0]).toContain("linha 2");
    expect(t.registro.contarAberturas("debitos", dia)).toEqual({ total: 1, aceitas: 0 });
    expect(t.avisos).toHaveLength(1); // cada linha avisa uma só vez
  });

  it("quando inválido: avisa, conta como chamada feita e a primeiraAbertura ignora a linha", () => {
    const t = com('{"quando":"ontem","servico":"creditos","tipo":"abertura","http":201,"tiquete":"T-7"}\n');
    expect(t.registro.contarAberturas("creditos", new Date(2026, 10, 23, 12, 0, 0))).toEqual({ total: 1, aceitas: 1 });
    expect(t.registro.primeiraAbertura("T-7")).toBeUndefined();
    expect(t.avisos[0]).toContain("linha 1");
  });

  it("linha ilegível conta como pedido de token no instante atual (modo conservador)", () => {
    const t = com("{lixo\n");
    const desde = t.registro.pedidosDeTokenDesde(new Date(2026, 10, 23, 9, 0, 0));
    expect(desde.map((d) => d.getTime())).toEqual([new Date(2026, 10, 23, 10, 0, 0).getTime()]);
  });

  it("primeiraAbertura nunca lança com linha ilegível no meio", () => {
    const t = com(valida("{lixo\n"));
    expect(t.registro.primeiraAbertura("T-1")?.getTime()).toBe(new Date("2026-11-23T09:00:00.000-03:00").getTime());
  });

  it("registrar não lança se a gravação falhar: avisa uma só vez com o código", () => {
    const t = com("");
    rmSync(join(t.pastaLocal, "chamadas.jsonl"));
    mkdirSync(join(t.pastaLocal, "chamadas.jsonl"));
    expect(() => t.registro.registrar({ servico: "creditos", tipo: "abertura", http: 201, tiquete: "T-1" })).not.toThrow();
    expect(() => t.registro.registrar({ servico: "creditos", tipo: "situacao", http: 200, tiquete: "T-1" })).not.toThrow();
    expect(t.avisos).toHaveLength(1);
    expect(t.avisos[0]).toMatch(/E[A-Z]+/);
    expect(t.avisos[0]).toContain("não foi possível gravar o registro");
  });

  it("verificarEscrita cria a pasta e o arquivo, e falha com mensagem clara se não der", () => {
    const pastaLocal = join(pastaTemporaria(), "nova");
    const registro = criarRegistro({ pastaLocal, relogio: { agora: () => new Date() } });
    expect(() => registro.verificarEscrita()).not.toThrow();
    expect(existsSync(join(pastaLocal, "chamadas.jsonl"))).toBe(true);

    const ruim = pastaTemporaria();
    mkdirSync(join(ruim, "chamadas.jsonl"));
    const r2 = criarRegistro({ pastaLocal: ruim, relogio: { agora: () => new Date() } });
    expect(() => r2.verificarEscrita()).toThrow(/chamadas\.jsonl.*Nenhuma chamada foi feita/s);
  });
});
