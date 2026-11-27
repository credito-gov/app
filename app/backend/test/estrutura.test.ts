import { expect, test } from "vitest";

test("o fetch está bloqueado nos testes", async () => {
  await expect(fetch("http://127.0.0.1:1")).rejects.toThrow("rede bloqueada");
});
