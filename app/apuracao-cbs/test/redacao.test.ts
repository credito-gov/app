import { describe, expect, it } from "vitest";
import { criarRedator } from "../src/redacao.js";
import { ID, SEGREDO, TOKEN, URL_ASSINADA } from "./apoio/ficticios.js";

describe("criarRedator", () => {
  it("troca por *** cada segredo registrado", () => {
    const r = criarRedator();
    r.registrar(ID);
    r.registrar(SEGREDO);
    r.registrar(TOKEN);
    r.registrar(URL_ASSINADA);
    const texto = `id=${ID} segredo=${SEGREDO} token=${TOKEN} url=${URL_ASSINADA}`;
    const saida = r.redigir(texto);
    expect(saida).toBe("id=*** segredo=*** token=*** url=***");
  });

  it("troca todas as ocorrências do mesmo segredo", () => {
    const r = criarRedator();
    r.registrar(TOKEN);
    expect(r.redigir(`${TOKEN} e de novo ${TOKEN}`)).toBe("*** e de novo ***");
  });

  it("troca segredo que está dentro de uma URL", () => {
    const r = criarRedator();
    r.registrar("assinatura-ficticia-abc");
    expect(r.redigir("https://exemplo.invalid/a?x=assinatura-ficticia-abc&y=1")).toBe("https://exemplo.invalid/a?x=***&y=1");
  });

  it("não altera texto sem segredo e ignora segredo vazio", () => {
    const r = criarRedator();
    r.registrar("");
    r.registrar(TOKEN);
    expect(r.redigir("nada a esconder aqui")).toBe("nada a esconder aqui");
  });

  it("troca primeiro o segredo mais longo quando um contém o outro", () => {
    const r = criarRedator();
    r.registrar("abc");
    r.registrar("abcdef");
    expect(r.redigir("abcdef")).toBe("***");
  });

  it("segredos registrados depois também valem", () => {
    const r = criarRedator();
    expect(r.redigir(TOKEN)).toBe(TOKEN);
    r.registrar(TOKEN);
    expect(r.redigir(TOKEN)).toBe("***");
  });
});
