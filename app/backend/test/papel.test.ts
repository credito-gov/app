// A API e o admin não sobem com um papel que ignora a segurança por linha (CA-35).
import { afterAll, describe, expect, test } from "vitest";
import { abrirKysely } from "../src/banco/conexao.js";
import { ErroPapel, verificarPapelDoBanco } from "../src/banco/papel.js";
import { criarBanco } from "../src/banco/transacao.js";
import { URL_APP, URL_MIGRACAO, URL_SUPER } from "./banco/urls.js";

const abertos: ReturnType<typeof criarBanco>[] = [];
const banco = (url: string) => {
  const b = criarBanco(abrirKysely(url));
  abertos.push(b);
  return b;
};
afterAll(async () => {
  for (const b of abertos) await b.encerrar();
});

describe("papel do banco na subida", () => {
  test("o papel de trabalho passa", async () => {
    await expect(verificarPapelDoBanco(banco(URL_APP))).resolves.toBeUndefined();
  });

  test("o papel de migração (dono das tabelas) é recusado", async () => {
    await expect(verificarPapelDoBanco(banco(URL_MIGRACAO))).rejects.toBeInstanceOf(ErroPapel);
  });

  test("superusuário é recusado, sem citar a URL", async () => {
    const erro = await verificarPapelDoBanco(banco(URL_SUPER)).catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ErroPapel);
    expect((erro as Error).message).not.toContain("127.0.0.1");
  });
});
