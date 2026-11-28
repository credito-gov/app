import argon2 from "argon2";
import { describe, expect, test, vi } from "vitest";
import { gerarHash, validarSenha, verificar } from "../src/autenticacao/senha.js";
import { senhasComuns } from "../src/autenticacao/senhasComuns.js";
import { gerarToken, hmacToken } from "../src/autenticacao/tokens.js";

// Custo reduzido só nos testes, para a suíte não ficar lenta.
const CUSTO_BAIXO = { memoryCost: 1024, timeCost: 1, parallelism: 1 };

describe("regra da senha (CA-14)", () => {
  test("recusa 11 caracteres, aceita 12 e 128, recusa 129", () => {
    expect(validarSenha("a".repeat(11))).toEqual({ ok: false, regra: "tamanho_minimo" });
    expect(validarSenha("ab".repeat(6))).toEqual({ ok: true });
    expect(validarSenha("abcd".repeat(32))).toEqual({ ok: true });
    expect(validarSenha("abcd".repeat(32) + "x")).toEqual({
      ok: false,
      regra: "tamanho_maximo",
    });
  });

  test("conta em pontos de código depois de NFC (composto e decomposto)", () => {
    const composto = "ação".normalize("NFC") + "ç".repeat(8); // 4 + 8 = 12
    const decomposto = composto.normalize("NFD");
    expect(decomposto.length).toBeGreaterThan(composto.length);
    expect(validarSenha(composto)).toEqual({ ok: true });
    expect(validarSenha(decomposto)).toEqual({ ok: true });
    const onze = "ação".normalize("NFC") + "ç".repeat(7);
    expect(validarSenha(onze.normalize("NFD"))).toEqual({
      ok: false,
      regra: "tamanho_minimo",
    });
  });

  test("conta pontos de código, não unidades UTF-16", () => {
    expect(validarSenha("😀".repeat(12))).toEqual({ ok: true });
    expect(validarSenha("😀".repeat(128))).toEqual({ ok: true });
    expect(validarSenha("😀".repeat(129))).toEqual({ ok: false, regra: "tamanho_maximo" });
  });

  test("recusa senha comum, com as maiúsculas trocadas, e diz a regra", () => {
    expect(senhasComuns.has("1qaz2wsx3edc")).toBe(true);
    expect(validarSenha("1qaz2wsx3edc")).toEqual({ ok: false, regra: "senha_comum" });
    expect(validarSenha("1QAZ2wsx3EDC")).toEqual({ ok: false, regra: "senha_comum" });
  });

  test("a lista só tem senhas de 12 caracteres ou mais, em minúsculas", () => {
    expect(senhasComuns.size).toBeGreaterThan(100);
    for (const s of senhasComuns) {
      expect(s.length).toBeGreaterThanOrEqual(12);
      expect(s).toBe(s.toLowerCase());
    }
  });

  test("aceita lista injetada", () => {
    const lista = new Set(["minha senha ficticia"]);
    expect(validarSenha("Minha Senha Ficticia", lista)).toEqual({
      ok: false,
      regra: "senha_comum",
    });
  });
});

describe("hash argon2id (CA-14)", () => {
  test("gerarHash devolve $argon2id$ e verificar aceita a certa e recusa a errada", async () => {
    const hash = await gerarHash("uma senha ficticia longa", CUSTO_BAIXO);
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(hash).not.toContain("uma senha ficticia longa");
    expect(await verificar(hash, "uma senha ficticia longa")).toBe(true);
    expect(await verificar(hash, "outra senha ficticia longa")).toBe(false);
  });

  test("a senha é normalizada em NFC antes do hash", async () => {
    const hash = await gerarHash("ação ficticia".normalize("NFC"), CUSTO_BAIXO);
    expect(await verificar(hash, "ação ficticia".normalize("NFD"))).toBe(true);
  });

  test("verificar não lança com hash malformado", async () => {
    expect(await verificar("isto-nao-e-hash", "qualquer senha ficticia")).toBe(false);
  });
});

describe("tokens (CA-19)", () => {
  test("32 bytes em base64url, diferentes entre si", () => {
    const a = gerarToken();
    const b = gerarToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(Buffer.from(a, "base64url")).toHaveLength(32);
  });

  test("HMAC é determinístico, muda com outro segredo e difere do token", () => {
    const token = gerarToken();
    const s1 = "segredo-ficticio-numero-um-com-32-bytes!!";
    const s2 = "segredo-ficticio-numero-dois-com-32-bytes";
    expect(hmacToken(s1, token)).toBe(hmacToken(s1, token));
    expect(hmacToken(s1, token)).not.toBe(hmacToken(s2, token));
    expect(hmacToken(s1, token)).not.toBe(token);
    expect(hmacToken(s1, token)).not.toBe(hmacToken(s1, gerarToken()));
  });
});

describe("verificar: só o formato inválido vira false", () => {
  test("hash de formato inválido avisa o chamador e devolve false", async () => {
    let avisou = 0;
    expect(await verificar("isto-nao-e-hash", "qualquer senha ficticia", () => avisou++)).toBe(false);
    expect(avisou).toBe(1);
  });

  test("outro erro do argon2 é relançado", async () => {
    const hash = await gerarHash("uma senha ficticia longa", CUSTO_BAIXO);
    const espiao = vi.spyOn(argon2, "verify").mockRejectedValueOnce(new Error("sem memória"));
    await expect(verificar(hash, "uma senha ficticia longa")).rejects.toThrow("sem memória");
    espiao.mockRestore();
  });
});
