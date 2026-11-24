import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach } from "vitest";

const criadas: string[] = [];

/** Pasta local temporária, removida ao fim de cada teste. */
export function pastaTemporaria(): string {
  const pasta = mkdtempSync(join(tmpdir(), "apuracao-cbs-teste-"));
  criadas.push(pasta);
  return pasta;
}

afterEach(() => {
  while (criadas.length > 0) {
    const pasta = criadas.pop() as string;
    rmSync(pasta, { recursive: true, force: true });
  }
});
