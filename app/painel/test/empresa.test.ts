import { describe, expect, it } from "vitest";
import { raizDe, verificarEmpresa } from "../src/nucleo/empresa.js";
import { arquivoCreditos, arquivoDebitos, credito, debito, NI14, NI14_OUTRA, RAIZ } from "./apoio/construtores.js";
import { lido } from "./apoio/lidos.js";

const cred = (nome: string, ni: string) => lido(nome, "creditos", arquivoCreditos([["11/2026", [credito()]]], { ni }));

describe("raiz do CNPJ (CA-3)", () => {
  it("ni de 8 e de 14 dígitos têm a mesma raiz", () => {
    expect(raizDe("90817263")).toBe(RAIZ);
    expect(raizDe(NI14)).toBe(RAIZ);
  });

  it("ni fora de 8 ou 14 dígitos não tem raiz", () => {
    expect(raizDe("9081726")).toBeNull();
    expect(raizDe("9081726300018")).toBeNull();
    expect(raizDe("9081726A")).toBeNull();
  });
});

describe("conflito entre empresas (CA-3, O-24)", () => {
  it("um arquivo com ni de 8 e outro com 14 dígitos da mesma raiz não geram conflito", () => {
    const r = verificarEmpresa([cred("a.json", "90817263"), cred("b.json", NI14)]);
    expect(r.conflito).toBe(false);
    expect(r.raiz).toBe(RAIZ);
  });

  it("estabelecimentos diferentes da mesma raiz não geram conflito", () => {
    const outro = `${RAIZ}000255`;
    const r = verificarEmpresa([cred("a.json", NI14), cred("b.json", outro)]);
    expect(r.conflito).toBe(false);
  });

  it("serviços diferentes entram na mesma comparação", () => {
    const d = lido("d.json", "debitos", arquivoDebitos([["11/2026", [debito()]]], { ni: NI14_OUTRA }));
    const r = verificarEmpresa([cred("a.json", NI14), d]);
    expect(r.conflito).toBe(true);
  });

  it("duas raízes geram conflito, com os arquivos e a raiz de cada um", () => {
    const r = verificarEmpresa([cred("a.json", NI14), cred("b.json", NI14_OUTRA), cred("c.json", "90817263")]);
    expect(r.conflito).toBe(true);
    expect(r.raiz).toBeUndefined();
    expect(r.grupos).toEqual([
      { raiz: "55443322", arquivos: ["b.json"] },
      { raiz: RAIZ, arquivos: ["a.json", "c.json"] },
    ]);
  });

  it("arquivo recusado ou ignorado não entra na comparação", () => {
    const recusado = { ...cred("b.json", NI14_OUTRA), situacao: "recusado" as const };
    const ignorado = { ...cred("c.json", NI14_OUTRA), situacao: "ignorado" as const };
    const r = verificarEmpresa([cred("a.json", NI14), recusado, ignorado]);
    expect(r.conflito).toBe(false);
    expect(r.raiz).toBe(RAIZ);
  });

  it("aceito com divergência entra na comparação", () => {
    const r = verificarEmpresa([cred("a.json", NI14), { ...cred("b.json", NI14_OUTRA), situacao: "aceito-com-divergencia" }]);
    expect(r.conflito).toBe(true);
  });

  it("sem arquivo aceito não há raiz nem conflito", () => {
    expect(verificarEmpresa([])).toEqual({ conflito: false, grupos: [] });
  });
});
