import { existsSync, readdirSync, writeFileSync as escreverDeVerdade } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { guardar } from "../src/armazenamento.js";
import { ErroGravacao } from "../src/erros.js";
import { pastaTemporaria } from "./apoio/pasta.js";

vi.mock("node:fs", async (original) => {
  const real = await original<typeof import("node:fs")>();
  return { ...real, writeFileSync: vi.fn(real.writeFileSync) };
});

const { writeFileSync } = await import("node:fs");

describe("guardar: falha no meio da escrita (D)", () => {
  it("não deixa arquivo com o nome canônico nem sobra de .parcial; o erro traz caminho e código", () => {
    const pastaLocal = pastaTemporaria();
    vi.mocked(writeFileSync).mockImplementationOnce(((caminho: string, dados: Uint8Array) => {
      escreverDeVerdade(caminho, dados.slice(0, 2)); // escrita pela metade
      throw Object.assign(new Error("disco cheio"), { code: "ENOSPC" });
    }) as never);

    let erro: unknown;
    try {
      guardar({
        pastaLocal,
        servico: "creditos",
        tiquete: "TIQ-1",
        bytes: new Uint8Array([1, 2, 3, 4]),
        agora: new Date(Date.UTC(2026, 10, 23, 13, 0, 0)),
      });
    } catch (e) {
      erro = e;
    }
    expect(erro).toBeInstanceOf(ErroGravacao);
    const e = erro as ErroGravacao;
    expect(e.codigo).toBe("ENOSPC");
    expect(e.message).toContain("ENOSPC");
    expect(e.message).toContain("20261123T130000Z_creditos_TIQ-1.json");
    expect(e.message).toContain("48 h");
    const pasta = join(pastaLocal, "arquivos");
    expect(existsSync(pasta) ? readdirSync(pasta) : []).toEqual([]);
  });
});
