import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { guardar } from "../src/armazenamento.js";
import { pastaTemporaria } from "./apoio/pasta.js";

vi.mock("node:fs", async (original) => {
  const real = await original<typeof import("node:fs")>();
  // Simula a corrida: a checagem prévia não enxerga o arquivo final que outro processo criou em seguida.
  return { ...real, existsSync: vi.fn((c: string) => (String(c).endsWith(".json") ? false : real.existsSync(c))) };
});

describe("guardar: nome final surge entre a checagem e a publicação", () => {
  it("o arquivo existente fica intacto e o novo sai com sufixo", () => {
    const pastaLocal = pastaTemporaria();
    const agora = new Date(Date.UTC(2026, 10, 23, 13, 5, 30));
    const primeiro = guardar({ pastaLocal, servico: "creditos", tiquete: "T", bytes: new Uint8Array([1]), agora });
    writeFileSync(primeiro, new Uint8Array([9])); // conteúdo do outro processo
    const segundo = guardar({ pastaLocal, servico: "creditos", tiquete: "T", bytes: new Uint8Array([2]), agora });
    expect(basename(segundo)).toBe("20261123T130530Z_creditos_T_2.json");
    expect([...readFileSync(primeiro)]).toEqual([9]);
    expect([...readFileSync(segundo)]).toEqual([2]);
    expect(readdirSync(join(pastaLocal, "arquivos")).sort()).toEqual(["20261123T130530Z_creditos_T.json", "20261123T130530Z_creditos_T_2.json"]);
  });
});
