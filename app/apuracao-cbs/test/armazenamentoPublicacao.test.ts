import * as fs from "node:fs";
import { basename, join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { guardar } from "../src/armazenamento.js";
import { ErroGravacao } from "../src/erros.js";
import { pastaTemporaria } from "./apoio/pasta.js";

vi.mock("node:fs", async (original) => {
  const real = await original<typeof import("node:fs")>();
  return {
    ...real,
    linkSync: vi.fn(real.linkSync),
    copyFileSync: vi.fn(real.copyFileSync),
    rmSync: vi.fn(real.rmSync),
    existsSync: vi.fn(real.existsSync),
  };
});

const real = await vi.importActual<typeof import("node:fs")>("node:fs");
const agora = new Date(Date.UTC(2026, 10, 23, 13, 5, 30));
const erro = (code: string) => Object.assign(new Error(code), { code });

beforeEach(() => {
  vi.mocked(fs.linkSync).mockImplementation(real.linkSync);
  vi.mocked(fs.copyFileSync).mockImplementation(real.copyFileSync);
  vi.mocked(fs.rmSync).mockImplementation(real.rmSync);
  vi.mocked(fs.existsSync).mockImplementation(real.existsSync);
});

describe("guardar: publicação", () => {
  it("volume sem hard link: guarda por cópia, com conteúdo idêntico", () => {
    for (const code of ["EPERM", "ENOTSUP"]) {
      const pastaLocal = pastaTemporaria();
      vi.mocked(fs.linkSync).mockImplementation(() => {
        throw erro(code);
      });
      const caminho = guardar({ pastaLocal, servico: "creditos", tiquete: "T", bytes: new Uint8Array([1, 2, 3]), agora });
      expect([...real.readFileSync(caminho)]).toEqual([1, 2, 3]);
      expect(real.readdirSync(join(pastaLocal, "arquivos"))).toEqual(["20261123T130530Z_creditos_T.json"]);
    }
  });

  it("sem hard link e nome final ocupado: existente intacto, novo com sufixo", () => {
    const pastaLocal = pastaTemporaria();
    vi.mocked(fs.linkSync).mockImplementation(() => {
      throw erro("EPERM");
    });
    const primeiro = guardar({ pastaLocal, servico: "creditos", tiquete: "T", bytes: new Uint8Array([1]), agora });
    real.writeFileSync(primeiro, new Uint8Array([9]));
    // a checagem prévia não enxerga o arquivo final: a cópia exclusiva é que encontra o nome ocupado
    vi.mocked(fs.existsSync).mockImplementation(((c: string) => (String(c).endsWith(".json") ? false : real.existsSync(c))) as never);
    const segundo = guardar({ pastaLocal, servico: "creditos", tiquete: "T", bytes: new Uint8Array([2]), agora });
    expect(basename(segundo)).toBe("20261123T130530Z_creditos_T_2.json");
    expect([...real.readFileSync(primeiro)]).toEqual([9]);
    expect([...real.readFileSync(segundo)]).toEqual([2]);
  });

  it("falha ao remover o .parcial depois de publicar: devolve o caminho e o arquivo está completo", () => {
    const pastaLocal = pastaTemporaria();
    vi.mocked(fs.rmSync).mockImplementation(((c: string, o?: object) => {
      if (String(c).endsWith(".parcial")) throw erro("EBUSY");
      return real.rmSync(c, o);
    }) as never);
    const caminho = guardar({ pastaLocal, servico: "creditos", tiquete: "T", bytes: new Uint8Array([4, 5]), agora });
    expect(basename(caminho)).toBe("20261123T130530Z_creditos_T.json");
    expect([...real.readFileSync(caminho)]).toEqual([4, 5]);
  });

  it("falha no meio da cópia: nenhum arquivo com nome canônico e erro de gravação", () => {
    const pastaLocal = pastaTemporaria();
    vi.mocked(fs.linkSync).mockImplementation(() => {
      throw erro("EPERM");
    });
    vi.mocked(fs.copyFileSync).mockImplementation(((origem: string, destino: string) => {
      real.writeFileSync(destino, real.readFileSync(origem).subarray(0, 1)); // cópia truncada
      throw erro("ENOSPC");
    }) as never);
    let e: unknown;
    try {
      guardar({ pastaLocal, servico: "creditos", tiquete: "T", bytes: new Uint8Array([1, 2, 3]), agora });
    } catch (x) {
      e = x;
    }
    expect(e).toBeInstanceOf(ErroGravacao);
    expect((e as ErroGravacao).codigo).toBe("ENOSPC");
    expect(real.readdirSync(join(pastaLocal, "arquivos")).filter((n) => n.endsWith(".json"))).toEqual([]);
  });
});
