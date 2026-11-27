import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Bloqueia o fetch real em todos os testes: cada teste simula o seu.
const fetchBloqueado = (async () => {
  throw new Error("rede bloqueada nos testes");
}) as unknown as typeof fetch;

beforeEach(() => {
  globalThis.fetch = fetchBloqueado;
});

afterEach(() => {
  cleanup();
});
