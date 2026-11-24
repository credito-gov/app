import { describe, expect, it } from "vitest";

describe("bloqueio de rede nos testes (CA-19)", () => {
  it("o fetch global é o bloqueador do setup", async () => {
    await expect(fetch("http://127.0.0.1:1/")).rejects.toThrow("rede bloqueada nos testes");
  });
});
