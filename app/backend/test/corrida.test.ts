import { describe, expect, test } from "vitest";
import { ehCorridaDeAceite } from "../src/convites/servico.js";

describe("ehCorridaDeAceite: só as restrições esperadas", () => {
  test.each(["usuario_email_normalizado_key", "identidade_provedor_sujeito_key", "vinculo_ativo"])(
    "23505 em %s é corrida",
    (constraint) => {
      expect(ehCorridaDeAceite({ code: "23505", constraint })).toBe(true);
    },
  );

  test("23505 em outra restrição não é corrida", () => {
    expect(ehCorridaDeAceite({ code: "23505", constraint: "convite_token_hmac_key" })).toBe(false);
    expect(ehCorridaDeAceite({ code: "23505" })).toBe(false);
  });

  test("outros códigos e valores não são corrida", () => {
    expect(ehCorridaDeAceite({ code: "23503", constraint: "vinculo_ativo" })).toBe(false);
    expect(ehCorridaDeAceite(new Error("x"))).toBe(false);
    expect(ehCorridaDeAceite(null)).toBe(false);
  });
});
