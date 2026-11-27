// Bloqueia o fetch em todos os testes. O único destino de rede permitido é o
// banco de teste em 127.0.0.1:5433, que não passa pelo fetch.
globalThis.fetch = (async () => {
  throw new Error("rede bloqueada nos testes");
}) as unknown as typeof fetch;
