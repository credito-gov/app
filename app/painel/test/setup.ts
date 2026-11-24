// Bloqueia a rede em todos os testes: todo cliente recebe o fetch por injeção.
globalThis.fetch = (async () => {
  throw new Error("rede bloqueada nos testes");
}) as unknown as typeof fetch;
