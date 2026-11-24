import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { criarCache, identificarArquivo, lerPasta } from "../src/nucleo/arquivos.js";
import { arquivoCreditos, arquivoDebitos, arquivoRecolhimentos, bytes, credito, debito, itemRecolhimento, NI14 } from "./apoio/construtores.js";
import { limparPaineis, painelCom } from "./apoio/painel.js";
import { nomeArquivo, pastaTemporaria, type PastaTemporaria } from "./apoio/pasta.js";

let pasta: PastaTemporaria | undefined;
afterEach(async () => {
  await limparPaineis();
  await pasta?.limpar();
  pasta = undefined;
});

const creditos = (chave = "A1", ni = NI14) => bytes(arquivoCreditos([["11/2026", [credito({ chave, aApropriar: "10.5" })]]], { ni }));

function leitorContador() {
  const lidos: string[] = [];
  return {
    lidos,
    lerArquivo: async (caminho: string) => {
      lidos.push(caminho);
      return new Uint8Array(await readFile(caminho));
    },
  };
}

describe("serviço pelo nome do arquivo (DT-3)", () => {
  it("reconhece o padrão AAAAMMDDTHHMMSSZ_<servico>_<tiquete>[_<n>].json", () => {
    expect(identificarArquivo("20261120T101530Z_creditos_FICT1.json")).toEqual({ servico: "creditos", tiquete: "FICT1" });
    expect(identificarArquivo("20261120T101530Z_debitos_FICT1_2.json")?.servico).toBe("debitos");
    expect(identificarArquivo("20261120T101530Z_recolhimentos_FICT1.json")?.servico).toBe("recolhimentos");
    expect(identificarArquivo("20261120T101530Z_pagamentos_FICT1.json")?.servico).toBe("pagamentos");
  });

  it("nome fora do padrão ou serviço desconhecido não é identificado", () => {
    expect(identificarArquivo("creditos.json")).toBeNull();
    expect(identificarArquivo("20261120T101530Z_outro_FICT1.json")).toBeNull();
    expect(identificarArquivo("20261120T101530Z_creditos_FICT1.txt")).toBeNull();
  });
});

describe("leitura da pasta (CA-1, CA-A2)", () => {
  it("lê só os .json da pasta, sem descer em subpastas", async () => {
    pasta = await pastaTemporaria();
    await pasta.escrever(nomeArquivo("creditos", "FICT1"), creditos());
    await pasta.escrever("anotacao.txt", "nada");
    const r = await lerPasta(pasta.caminho, { cache: criarCache() });
    expect(r.legivel).toBe(true);
    expect(r.arquivos.map((a) => a.nome)).toEqual([nomeArquivo("creditos", "FICT1")]);
    const a = r.arquivos[0];
    expect(a.servico).toBe("creditos");
    expect(a.situacao).toBe("aceito-com-divergencia");
    expect(a.raiz).toBe("90817263");
    expect(a.quantidade).toBe(1);
    expect(a.geradoEm).toBe("2026-11-20T10:15:30.000-03:00");
  });

  it("não desce em subpastas", async () => {
    pasta = await pastaTemporaria();
    await pasta.escrever(nomeArquivo("creditos", "FICT1"), creditos());
    await mkdir(join(pasta.caminho, "sub"));
    await pasta.escrever(join("sub", nomeArquivo("creditos", "DENTRO")), creditos("B"));
    const r = await lerPasta(pasta.caminho, { cache: criarCache() });
    expect(r.arquivos.map((a) => a.nome)).toEqual([nomeArquivo("creditos", "FICT1")]);
  });

  it("entrada .json que não é arquivo entra na lista como recusada, sem ser lida", async () => {
    pasta = await pastaTemporaria();
    await pasta.escrever(nomeArquivo("creditos", "FICT1"), creditos());
    await mkdir(join(pasta.caminho, "pasta.json"));
    const { lidos, lerArquivo } = leitorContador();
    const r = await lerPasta(pasta.caminho, { cache: criarCache(), lerArquivo });
    const entrada = r.arquivos.find((a) => a.nome === "pasta.json");
    expect(entrada?.situacao).toBe("recusado");
    expect(entrada?.motivos.join(" ")).toContain("não é um arquivo");
    expect(lidos.some((c) => c.endsWith("pasta.json"))).toBe(false);
    expect(r.arquivos).toHaveLength(2);
  });

  it("conta a quantidade de itens por serviço", async () => {
    pasta = await pastaTemporaria();
    await pasta.escrever(nomeArquivo("debitos", "D1"), bytes(arquivoDebitos([["11/2026", [debito({ chave: "A" }), debito({ chave: "B" })]]])));
    await pasta.escrever(
      nomeArquivo("recolhimentos", "R1"),
      bytes(arquivoRecolhimentos([["2026-11-10", [["99999000000000001", [itemRecolhimento({ sequencial: 1 }), itemRecolhimento({ sequencial: 2 })]]]]])),
    );
    const r = await lerPasta(pasta.caminho, { cache: criarCache() });
    expect(Object.fromEntries(r.arquivos.map((a) => [a.servico, a.quantidade]))).toEqual({ debitos: 2, recolhimentos: 2 });
  });

  it("pagamentos fica ignorado, sem ser lido", async () => {
    pasta = await pastaTemporaria();
    await pasta.escrever(nomeArquivo("pagamentos", "P1"), "{ nem precisa ser json");
    const { lidos, lerArquivo } = leitorContador();
    const r = await lerPasta(pasta.caminho, { cache: criarCache(), lerArquivo });
    expect(r.arquivos[0].situacao).toBe("ignorado");
    expect(r.arquivos[0].motivos).toEqual(["serviço não usado pelo painel"]);
    expect(lidos).toEqual([]);
  });

  it("nome fora do padrão fica ignorado", async () => {
    pasta = await pastaTemporaria();
    await pasta.escrever("resposta.json", creditos());
    const r = await lerPasta(pasta.caminho, { cache: criarCache() });
    expect(r.arquivos[0].situacao).toBe("ignorado");
    expect(r.arquivos[0].motivos).toEqual(["nome fora do padrão da apuracao-cbs"]);
    expect(r.arquivos[0].servico).toBeNull();
  });

  it("arquivo recusado leva o motivo", async () => {
    pasta = await pastaTemporaria();
    await pasta.escrever(nomeArquivo("creditos", "RUIM"), "{ nao e json");
    const r = await lerPasta(pasta.caminho, { cache: criarCache() });
    expect(r.arquivos[0].situacao).toBe("recusado");
    expect(r.arquivos[0].motivos[0]).toContain("JSON inválido");
    expect(r.arquivos[0].dados).toBeUndefined();
  });

  it("pasta inexistente é uma situação, com o caminho, e não é criada", async () => {
    pasta = await pastaTemporaria();
    const inexistente = join(pasta.caminho, "nao-existe");
    const r = await lerPasta(inexistente, { cache: criarCache() });
    expect(r.legivel).toBe(false);
    expect(r.erro).toContain(inexistente);
    expect(r.arquivos).toEqual([]);
    expect(existsSync(inexistente)).toBe(false);
  });
});

describe("cache por nome, tamanho e data de modificação (CA-A2)", () => {
  it("segunda leitura sem mudança não relê nenhum arquivo", async () => {
    pasta = await pastaTemporaria();
    await pasta.escrever(nomeArquivo("creditos", "A"), creditos("A"));
    await pasta.escrever(nomeArquivo("creditos", "B"), creditos("B"));
    const { lidos, lerArquivo } = leitorContador();
    const cache = criarCache();
    await lerPasta(pasta.caminho, { cache, lerArquivo });
    expect(lidos).toHaveLength(2);
    const r = await lerPasta(pasta.caminho, { cache, lerArquivo });
    expect(lidos).toHaveLength(2);
    expect(r.arquivos).toHaveLength(2);
    expect(r.arquivos.every((a) => a.situacao === "aceito-com-divergencia")).toBe(true);
  });

  it("arquivo novo é lido", async () => {
    pasta = await pastaTemporaria();
    await pasta.escrever(nomeArquivo("creditos", "A"), creditos("A"));
    const { lidos, lerArquivo } = leitorContador();
    const cache = criarCache();
    await lerPasta(pasta.caminho, { cache, lerArquivo });
    await pasta.escrever(nomeArquivo("creditos", "B"), creditos("B"));
    const r = await lerPasta(pasta.caminho, { cache, lerArquivo });
    expect(lidos).toHaveLength(2);
    expect(r.arquivos).toHaveLength(2);
  });

  it("arquivo alterado (data de modificação) é relido", async () => {
    pasta = await pastaTemporaria();
    const nome = nomeArquivo("creditos", "A");
    await pasta.escrever(nome, creditos("A"));
    const { lidos, lerArquivo } = leitorContador();
    const cache = criarCache();
    await lerPasta(pasta.caminho, { cache, lerArquivo });
    await pasta.tocar(nome);
    await lerPasta(pasta.caminho, { cache, lerArquivo });
    expect(lidos).toHaveLength(2);
  });

  it("arquivo alterado (tamanho) é relido e a nova validação vale", async () => {
    pasta = await pastaTemporaria();
    const nome = nomeArquivo("creditos", "A");
    await pasta.escrever(nome, creditos("A"));
    const { lidos, lerArquivo } = leitorContador();
    const cache = criarCache();
    await lerPasta(pasta.caminho, { cache, lerArquivo });
    await pasta.escrever(nome, "{ ficou ilegível");
    const r = await lerPasta(pasta.caminho, { cache, lerArquivo });
    expect(lidos).toHaveLength(2);
    expect(r.arquivos[0].situacao).toBe("recusado");
  });

  it("arquivo removido some do resultado", async () => {
    pasta = await pastaTemporaria();
    await pasta.escrever(nomeArquivo("creditos", "A"), creditos("A"));
    const cache = criarCache();
    await lerPasta(pasta.caminho, { cache });
    await pasta.limpar();
    pasta = await pastaTemporaria();
    const r = await lerPasta(pasta.caminho, { cache });
    expect(r.arquivos).toEqual([]);
  });
});

const estatisticaDe = (tamanho = 10, mtimeMs = 1) => ({ isFile: () => true, size: tamanho, mtimeMs });
const erroDeSistema = (codigo: string) => Object.assign(new Error(`${codigo}: falha simulada`), { code: codigo });

describe("arquivo que não pôde ser lido (rodada 1, grupo A)", () => {
  it("A1: stat que falha põe o arquivo na lista como recusado, com o código do erro", async () => {
    pasta = await pastaTemporaria();
    await pasta.escrever(nomeArquivo("creditos", "A"), creditos("A"));
    await pasta.escrever(nomeArquivo("creditos", "B"), creditos("B"));
    const estatistica = async (caminho: string) => {
      if (caminho.includes("_B.json")) throw erroDeSistema("EPERM");
      return estatisticaDe();
    };
    const r = await lerPasta(pasta.caminho, { cache: criarCache(), estatistica });
    expect(r.arquivos.map((a) => a.nome)).toEqual([nomeArquivo("creditos", "A"), nomeArquivo("creditos", "B")]);
    const b = r.arquivos[1];
    expect(b.situacao).toBe("recusado");
    expect(b.servico).toBe("creditos");
    expect(b.motivos.join(" ")).toContain("EPERM");
    expect(r.arquivos[0].situacao).toBe("aceito-com-divergencia");
  });

  it("A2: falha de leitura passageira não fica no cache; os outros entram e o que falhou é aceito na segunda leitura", async () => {
    pasta = await pastaTemporaria();
    await pasta.escrever(nomeArquivo("creditos", "A"), creditos("A"));
    await pasta.escrever(nomeArquivo("creditos", "B"), creditos("B"));
    let chamadasDeB = 0;
    const lerArquivo = async (caminho: string) => {
      if (caminho.includes("_B.json") && ++chamadasDeB === 1) throw erroDeSistema("EBUSY");
      return new Uint8Array(await readFile(caminho));
    };
    const cache = criarCache();
    const primeira = await lerPasta(pasta.caminho, { cache, lerArquivo });
    expect(primeira.arquivos.map((a) => a.situacao)).toEqual(["aceito-com-divergencia", "recusado"]);
    expect(primeira.arquivos[1].motivos.join(" ")).toContain("EBUSY");
    const segunda = await lerPasta(pasta.caminho, { cache, lerArquivo });
    expect(segunda.arquivos.map((a) => a.situacao)).toEqual(["aceito-com-divergencia", "aceito-com-divergencia"]);
    expect(chamadasDeB).toBe(2);
  });

  it("A2: recusa por validação continua no cache (não relê)", async () => {
    pasta = await pastaTemporaria();
    await pasta.escrever(nomeArquivo("creditos", "RUIM"), "{ nao e json");
    const { lidos, lerArquivo } = leitorContador();
    const cache = criarCache();
    await lerPasta(pasta.caminho, { cache, lerArquivo });
    await lerPasta(pasta.caminho, { cache, lerArquivo });
    expect(lidos).toHaveLength(1);
  });

  it("A3: erro interno (sem código de sistema) propaga, não vira recusa do arquivo", async () => {
    pasta = await pastaTemporaria();
    await pasta.escrever(nomeArquivo("creditos", "A"), creditos("A"));
    const validador = {
      validar: () => {
        throw new TypeError("falha interna simulada");
      },
    };
    await expect(lerPasta(pasta.caminho, { cache: criarCache(), validador })).rejects.toThrow("falha interna simulada");
  });

  it("A3: erro do leitor sem código de sistema também propaga", async () => {
    pasta = await pastaTemporaria();
    await pasta.escrever(nomeArquivo("creditos", "A"), creditos("A"));
    const lerArquivo = async () => {
      throw new TypeError("leitor com defeito");
    };
    await expect(lerPasta(pasta.caminho, { cache: criarCache(), lerArquivo })).rejects.toThrow("leitor com defeito");
  });

  it("A4: erro ao listar a pasta traz o código do erro", async () => {
    pasta = await pastaTemporaria();
    await pasta.escrever("e-um-arquivo.txt", "x");
    const r = await lerPasta(join(pasta.caminho, "e-um-arquivo.txt"), { cache: criarCache() });
    expect(r.legivel).toBe(false);
    expect(r.erro).toMatch(/ENOTDIR|ENOENT/);
    expect(r.codigoErro).toMatch(/^E[A-Z]+$/);
    expect(r.erro).toContain(r.codigoErro);
  });

  it("A5: extensão .JSON em maiúsculas aparece na lista, como ignorada", async () => {
    pasta = await pastaTemporaria();
    await pasta.escrever("20261120T101530Z_creditos_FICT1.JSON", creditos());
    const r = await lerPasta(pasta.caminho, { cache: criarCache() });
    expect(r.arquivos).toHaveLength(1);
    expect(r.arquivos[0].situacao).toBe("ignorado");
  });

  it("A6: motivos cortados em 20 dizem quantos faltam", async () => {
    pasta = await pastaTemporaria();
    await pasta.escrever(nomeArquivo("creditos", "A"), creditos("A"));
    const validador = { validar: () => ({ situacao: "recusado" as const, motivos: Array.from({ length: 20 }, (_, i) => `divergência ${i}`), total: 25 }) };
    const r = await lerPasta(pasta.caminho, { cache: criarCache(), validador });
    expect(r.arquivos[0].motivos).toHaveLength(21);
    expect(r.arquivos[0].motivos[20]).toBe("e mais 5 divergências");
  });

  it("A6: sem corte, nenhum motivo extra", async () => {
    pasta = await pastaTemporaria();
    await pasta.escrever(nomeArquivo("creditos", "A"), "{ nao e json");
    const r = await lerPasta(pasta.caminho, { cache: criarCache() });
    expect(r.arquivos[0].motivos).toHaveLength(1);
  });
});

describe("JSON aninhado demais (rodada 2)", () => {
  const aninhado = (n: number) => `{"a":${"[".repeat(n)}${"]".repeat(n)}}`;

  for (const niveis of [2000, 3000, 10000]) {
    it(`com ${niveis} níveis, o arquivo é recusado com motivo fixo, com cache, e as rotas respondem 200`, async () => {
      const p = await painelCom([
        [nomeArquivo("creditos", "OK1"), arquivoCreditos([["11/2026", [credito({ chave: "A1", aApropriar: "10.50" })]]], { ni: NI14 })],
        [nomeArquivo("creditos", "FUNDO"), aninhado(niveis)],
      ]);
      const r = await lerPasta(p.pasta.caminho, { cache: criarCache() });
      const fundo = r.arquivos.find((a) => a.nome.includes("FUNDO"))!;
      expect(fundo.situacao).toBe("recusado");
      expect(fundo.motivos).toEqual(["o conteúdo não pôde ser verificado: estrutura aninhada demais"]);
      expect(fundo.transitorio).toBeUndefined();
      expect(r.arquivos.find((a) => a.nome.includes("OK1"))?.situacao).toBe("aceito-com-divergencia");
      for (const url of ["/", "/arquivos", "/creditos"]) expect((await p.get(url)).status, url).toBe(200);
      const arquivos = (await p.get("/arquivos")).corpo;
      expect(arquivos).toContain("estrutura aninhada demais");
      expect((await p.get("/creditos")).corpo).toContain("A1");
    });
  }

  it("erro interno que não é de E/S continua propagando", async () => {
    pasta = await pastaTemporaria();
    await pasta.escrever(nomeArquivo("creditos", "X"), creditos());
    const validador = {
      validar: () => {
        throw new TypeError("defeito do painel");
      },
    };
    await expect(lerPasta(pasta.caminho, { validador })).rejects.toThrow("defeito do painel");
  });
});
