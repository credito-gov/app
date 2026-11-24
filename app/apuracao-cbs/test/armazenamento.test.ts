import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";
import { abrirGuardado, guardar } from "../src/armazenamento.js";
import { ErroUso } from "../src/erros.js";
import { pastaTemporaria } from "./apoio/pasta.js";

const AGORA = new Date(Date.UTC(2026, 10, 23, 13, 5, 30));

describe("guardar", () => {
  it("grava os bytes exatamente como chegaram (espaços, quebras e BOM)", () => {
    const pastaLocal = pastaTemporaria();
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode('{ "a":  1.10 ,\r\n\n "b": [ ] }  \n')]);
    const caminho = guardar({ pastaLocal, servico: "creditos", tiquete: "TIQ-1", bytes, agora: AGORA });
    expect([...readFileSync(caminho)]).toEqual([...bytes]);
  });

  it("nomeia com data UTC, serviço e tíquete, dentro de .local/arquivos", () => {
    const pastaLocal = pastaTemporaria();
    const caminho = guardar({ pastaLocal, servico: "pagamentos", tiquete: "TIQ-1", bytes: new Uint8Array([1]), agora: AGORA });
    expect(caminho).toBe(join(pastaLocal, "arquivos", "20261123T130530Z_pagamentos_TIQ-1.json"));
  });

  it("troca por _ o caractere do tíquete fora de [A-Za-z0-9._-]", () => {
    const pastaLocal = pastaTemporaria();
    const caminho = guardar({ pastaLocal, servico: "debitos", tiquete: "a/b c:d*é", bytes: new Uint8Array([1]), agora: AGORA });
    expect(basename(caminho)).toBe("20261123T130530Z_debitos_a_b_c_d__.json");
  });

  it("não sobrescreve: acrescenta _2, _3", () => {
    const pastaLocal = pastaTemporaria();
    const a = guardar({ pastaLocal, servico: "creditos", tiquete: "T", bytes: new Uint8Array([1]), agora: AGORA });
    const b = guardar({ pastaLocal, servico: "creditos", tiquete: "T", bytes: new Uint8Array([2]), agora: AGORA });
    const c = guardar({ pastaLocal, servico: "creditos", tiquete: "T", bytes: new Uint8Array([3]), agora: AGORA });
    expect(basename(a)).toBe("20261123T130530Z_creditos_T.json");
    expect(basename(b)).toBe("20261123T130530Z_creditos_T_2.json");
    expect(basename(c)).toBe("20261123T130530Z_creditos_T_3.json");
    expect([...readFileSync(a)]).toEqual([1]);
    expect([...readFileSync(b)]).toEqual([2]);
    expect(readdirSync(join(pastaLocal, "arquivos"))).toHaveLength(3);
  });

  it("devolve o caminho do arquivo gravado", () => {
    const pastaLocal = pastaTemporaria();
    const caminho = guardar({ pastaLocal, servico: "creditos", tiquete: "T", bytes: new Uint8Array([1]), agora: AGORA });
    expect(existsSync(caminho)).toBe(true);
  });
});

describe("abrirGuardado", () => {
  it("lê os bytes e identifica o serviço pelo nome do arquivo", () => {
    for (const servico of ["creditos", "recolhimentos", "pagamentos", "debitos"] as const) {
      const pastaLocal = pastaTemporaria();
      const caminho = guardar({ pastaLocal, servico, tiquete: "TIQ-9", bytes: new Uint8Array([7, 8, 9]), agora: AGORA });
      const lido = abrirGuardado(caminho);
      expect(lido.servico).toBe(servico);
      expect([...lido.bytes]).toEqual([7, 8, 9]);
      expect(lido.caminho).toBe(caminho);
    }
  });

  it("reconhece o arquivo com sufixo _2", () => {
    const pastaLocal = pastaTemporaria();
    guardar({ pastaLocal, servico: "creditos", tiquete: "T", bytes: new Uint8Array([1]), agora: AGORA });
    const segundo = guardar({ pastaLocal, servico: "creditos", tiquete: "T", bytes: new Uint8Array([2]), agora: AGORA });
    expect(abrirGuardado(segundo).servico).toBe("creditos");
  });

  it("nome fora do padrão: erro de uso (código 2) que explica o padrão", () => {
    const outro = join(pastaTemporaria(), "qualquer.json");
    expect(() => abrirGuardado(outro)).toThrow(ErroUso);
    try {
      abrirGuardado(outro);
    } catch (e) {
      const erro = e as ErroUso;
      expect(erro.codigoSaida).toBe(2);
      expect(erro.message).toContain("AAAAMMDDTHHMMSSZ_<servico>_<tiquete>.json");
    }
  });

  it("serviço desconhecido no nome também é erro de uso", () => {
    expect(() => abrirGuardado(join(pastaTemporaria(), "20261123T130530Z_todas_T.json"))).toThrow(ErroUso);
  });
});
