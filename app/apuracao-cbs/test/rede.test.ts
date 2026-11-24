import { expect, it } from "vitest";

it("o fetch global é o bloqueador de rede", async () => {
  await expect(globalThis.fetch("https://exemplo.invalid/")).rejects.toThrow("rede bloqueada nos testes");
});
