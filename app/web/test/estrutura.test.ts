describe("estrutura", () => {
  it("bloqueia o fetch real", async () => {
    await expect(fetch("http://exemplo.com.br")).rejects.toThrow("rede bloqueada");
  });
});
