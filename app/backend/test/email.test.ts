import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { criarEmailArquivo } from "../src/email/arquivo.js";
import { criarEnvioEmail } from "../src/email/fabrica.js";
import { criarEmailMemoria } from "../src/email/memoria.js";
import { modeloConvite, modeloRecuperacao } from "../src/email/modelos.js";

const mensagem = {
  para: "pessoa@exemplo.com.br",
  assunto: "Assunto de teste",
  texto: "Corpo de teste com https://exemplo.com.br/convite#t=abc",
};

describe("adaptador em memória (CA-27)", () => {
  test("guarda as mensagens na ordem de envio", async () => {
    const email = criarEmailMemoria();
    await email.enviar(mensagem);
    await email.enviar({ ...mensagem, para: "outra@exemplo.com.br" });
    expect(email.mensagens).toHaveLength(2);
    expect(email.mensagens[0]).toEqual(mensagem);
    expect(email.mensagens[1]?.para).toBe("outra@exemplo.com.br");
  });
});

describe("adaptador de arquivo (CA-27)", () => {
  let pasta: string;
  beforeEach(async () => {
    pasta = await mkdtemp(join(tmpdir(), "creditogov-email-"));
  });
  afterEach(async () => {
    await rm(pasta, { recursive: true, force: true });
  });

  test("grava um .txt por mensagem, criando a pasta se preciso", async () => {
    const destino = join(pasta, "emails");
    const email = criarEmailArquivo(destino);
    await email.enviar(mensagem);
    await email.enviar({ ...mensagem, assunto: "Segundo" });
    const arquivos = await readdir(destino);
    expect(arquivos).toHaveLength(2);
    expect(arquivos.every((a) => a.endsWith(".txt"))).toBe(true);
    const conteudos = await Promise.all(
      arquivos.map((a) => readFile(join(destino, a), "utf8")),
    );
    const todos = conteudos.join("\n");
    expect(todos).toContain("Para: pessoa@exemplo.com.br");
    expect(todos).toContain("Assunto: Assunto de teste");
    expect(todos).toContain("Assunto: Segundo");
    expect(todos).toContain("https://exemplo.com.br/convite#t=abc");
  });
});

describe("fábrica (CA-27)", () => {
  test("escolhe o adaptador pelo valor de CREDITOGOV_EMAIL", async () => {
    const pasta = await mkdtemp(join(tmpdir(), "creditogov-email-"));
    try {
      const memoria = criarEnvioEmail("memoria", { pastaArquivo: pasta });
      expect("mensagens" in memoria).toBe(true);

      const arquivo = criarEnvioEmail("arquivo", { pastaArquivo: pasta });
      expect("mensagens" in arquivo).toBe(false);
      await arquivo.enviar(mensagem);
      expect(await readdir(pasta)).toHaveLength(1);
    } finally {
      await rm(pasta, { recursive: true, force: true });
    }
  });
});

describe("modelo de convite (CA-28)", () => {
  // 2026-12-04T15:30:00Z = 04/12/2026 12:30 em America/Sao_Paulo (UTC-3).
  const expiraEm = new Date("2026-12-04T15:30:00Z");
  const base = {
    para: "pessoa@exemplo.com.br",
    empresaNome: "Comércio Exemplo Ltda.",
    papel: "contador" as const,
    link: "http://localhost:5173/convite#e=1&t=abc",
    expiraEm,
  };

  test("traz quem convidou (usuário), empresa, papel, link, validade e a frase de ignorar", () => {
    const m = modeloConvite({ ...base, quemConvidou: "Maria Exemplo" });
    expect(m.para).toBe("pessoa@exemplo.com.br");
    expect(m.texto).toContain("Maria Exemplo");
    expect(m.texto).toContain("Comércio Exemplo Ltda.");
    expect(m.texto).toContain("contador");
    expect(m.texto).toContain(base.link);
    expect(m.texto).toContain("válido até 04/12/2026 12:30");
    expect(m.texto).toContain("Se você não esperava este convite, ignore esta mensagem.");
    expect(m.texto).toContain("CreditoGov");
  });

  test("quando a equipe convida, diz a equipe CreditoGov", () => {
    const m = modeloConvite({ ...base, quemConvidou: null });
    expect(m.texto).toContain("a equipe CreditoGov");
  });

  test("o assunto cita a empresa", () => {
    const m = modeloConvite({ ...base, quemConvidou: null });
    expect(m.assunto).toContain("Comércio Exemplo Ltda.");
  });

  test("sem número, prazo ou promessa além da validade", () => {
    const m = modeloConvite({ ...base, quemConvidou: null });
    // Só aparecem números da data de validade e do link.
    const semPermitidos = m.texto
      .replace("04/12/2026 12:30", "")
      .replace(base.link, "");
    expect(semPermitidos).not.toMatch(/\d/);
    expect(semPermitidos.toLowerCase()).not.toMatch(
      /grátis|gratuito|garant|economi|sem custo|100%/,
    );
  });
});

describe("modelo de recuperação (CA-28)", () => {
  const base = {
    para: "pessoa@exemplo.com.br",
    link: "http://localhost:5173/redefinir-senha#t=abc",
    expiraEm: new Date("2026-12-04T15:30:00Z"),
  };

  test("traz o link, a validade de 1 hora e a frase de ignorar", () => {
    const m = modeloRecuperacao(base);
    expect(m.para).toBe("pessoa@exemplo.com.br");
    expect(m.texto).toContain(base.link);
    expect(m.texto).toContain("válido por 1 hora");
    expect(m.texto).toContain("até 04/12/2026 12:30");
    expect(m.texto).toContain(
      "Se você não pediu, ignore esta mensagem; sua senha não muda.",
    );
  });

  test("sem número além da validade e do link", () => {
    const m = modeloRecuperacao(base);
    const semPermitidos = m.texto
      .replace("04/12/2026 12:30", "")
      .replace(base.link, "")
      .replace("1 hora", "");
    expect(semPermitidos).not.toMatch(/\d/);
  });
});


describe("texto de apresentação dos modelos (PROJECT_CONTEXT §6)", () => {
  const frase = "O CreditoGov é a plataforma para acompanhar o crédito de CBS das compras da empresa.";

  test("o convite não descreve como existente o que ainda não existe", () => {
    const convite = modeloConvite({
      para: "pessoa@exemplo.com.br",
      quemConvidou: "Maria Titular",
      empresaNome: "Comércio Exemplo Ltda.",
      papel: "contador",
      link: "http://localhost:5173/convite#e=x&t=y",
      expiraEm: new Date("2026-12-08T12:00:00Z"),
    });
    expect(convite.texto).toContain(frase);
    expect(convite.texto).not.toContain("mostra o crédito");
  });
});
