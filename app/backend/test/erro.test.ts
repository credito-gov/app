import { describe, expect, test } from "vitest";
import { migrarParaCima, ErroMigracao } from "../src/banco/migrar.js";
import * as inicial from "../src/banco/migracoes/0001_inicial.js";
import { descreverErro } from "../src/erro.js";
import { URL_MIGRACAO } from "./banco/urls.js";

describe("descreverErro (terminal do operador)", () => {
  test("traz name, code e message", () => {
    const t = descreverErro(Object.assign(new TypeError("falhou aqui"), { code: "ECONNREFUSED" }));
    expect(t).toContain("TypeError");
    expect(t).toContain("ECONNREFUSED");
    expect(t).toContain("falhou aqui");
  });

  test("aceita valor que não é Error", () => {
    expect(descreverErro("texto")).toContain("texto");
  });
});

describe("migrar: diz qual migração falhou", () => {
  test("ErroMigracao leva o nome da migração que falhou", async () => {
    const provedor = {
      async getMigrations() {
        return {
          "0001_inicial": inicial,
          "0002_falha_de_teste": {
            async up() {
              throw new Error("falha simulada");
            },
          },
        };
      },
    };
    const erro = await migrarParaCima(URL_MIGRACAO, provedor).catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ErroMigracao);
    expect((erro as ErroMigracao).migracao).toBe("0002_falha_de_teste");
  });
});
