// Escape de HTML (DT-10, rodada 1, F4): o que vem de arquivo ou da URL nunca chega à página como marcação.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { Cru, esc, html, juntar, vazio } from "../src/paginas/html.js";
import { arquivoCreditos, credito, RAIZ } from "./apoio/construtores.js";
import { limparPaineis, painelCom } from "./apoio/painel.js";
import { nomeArquivo } from "./apoio/pasta.js";

afterEach(limparPaineis);

const PERIGO = `<script>alert(1)</script>"'&`;

describe("src/paginas/html.ts", () => {
  it("esc troca os cinco caracteres perigosos e só eles", () => {
    expect(esc(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
    expect(esc("texto comum 123 ção")).toBe("texto comum 123 ção");
    expect(esc("&amp;")).toBe("&amp;amp;");
  });

  it("html escapa o que se interpola, em conteúdo e em atributo", () => {
    expect(html`<p>${PERIGO}</p>`.texto).toBe("<p>&lt;script&gt;alert(1)&lt;/script&gt;&quot;&#39;&amp;</p>");
    expect(html`<a href="${'x" onclick="alert(1)'}">`.texto).toBe('<a href="x&quot; onclick=&quot;alert(1)">');
  });

  it("html não escapa de novo o que já é Cru, e junta listas", () => {
    const interno = html`<b>${"<i>"}</b>`;
    expect(html`<p>${interno}</p>`.texto).toBe("<p><b>&lt;i&gt;</b></p>");
    expect(html`<ul>${[html`<li>${"a<"}</li>`, "<b>"]}</ul>`.texto).toBe("<ul><li>a&lt;</li>&lt;b&gt;</ul>");
  });

  it("undefined, null e false somem; zero e texto vazio ficam", () => {
    expect(html`[${undefined}][${null}][${false}][${0}][${""}]`.texto).toBe("[][][][0][]");
  });

  it("juntar escapa os itens que não são Cru e deixa o separador como veio", () => {
    expect(juntar(["<a>", new Cru("<b>")], "<br>").texto).toBe("&lt;a&gt;<br><b>");
    expect(juntar([]).texto).toBe("");
    expect(vazio.texto).toBe("");
  });
});

describe("conteúdo hostil nas páginas", () => {
  it("nome de chave do JSON, num motivo de recusa, aparece escapado em /arquivos", async () => {
    // O número com três casas sob uma chave hostil entra no motivo pelo caminho do JSON.
    const texto = `{ "ni": "${RAIZ}", ${JSON.stringify(PERIGO)}: 1.234 }`;
    const { get } = await painelCom([[nomeArquivo("creditos", "FICTHOSTIL"), texto]]);
    const { corpo } = await get("/arquivos");
    expect(corpo).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(corpo).not.toContain("<script>alert");
    expect(corpo).toContain("recusado");
  });

  it("parâmetros hostis da URL não voltam como marcação em nenhuma rota", async () => {
    const { get } = await painelCom([[nomeArquivo("creditos", "FICTP"), arquivoCreditos([["11/2026", [credito({ chave: "FICT-A", aApropriar: "5.00" })]]], { ni: RAIZ })]]);
    const hostil = encodeURIComponent(`"><script>alert(1)</script>`);
    const urls = [
      `/creditos?emitente=${hostil}&busca=${hostil}&pa=${hostil}&documento=${hostil}&ordem=${hostil}&sentido=${hostil}&pagina=${hostil}`,
      `/pendencias?grupo=${hostil}`,
      `/creditos/nota?pa=${hostil}&documento=${hostil}&origem=${hostil}&chave=${hostil}`,
      `/${hostil}`,
    ];
    for (const url of urls) {
      const { corpo } = await get(url);
      expect(corpo, url).not.toContain("<script>alert");
      expect(corpo, url).not.toContain(`"><script`);
    }
  });

  it("emitente e busca válidos voltam nos campos do formulário só com caracteres seguros", async () => {
    const { get } = await painelCom([[nomeArquivo("creditos", "FICTP"), arquivoCreditos([["11/2026", [credito({ chave: "FICT-A", aApropriar: "5.00" })]]], { ni: RAIZ })]]);
    const { corpo } = await get("/creditos?emitente=11.222.333/0001-81&busca=fict");
    expect(corpo).toContain('name="emitente" value="11222333000181"');
    expect(corpo).toContain('name="busca" value="FICT"');
  });
});

describe("new Cru( só onde o escape é decidido", () => {
  const PASTA_SRC = fileURLToPath(new URL("../src/", import.meta.url));
  function listar(pasta: string): string[] {
    return readdirSync(pasta).flatMap((nome) => {
      const caminho = join(pasta, nome);
      return statSync(caminho).isDirectory() ? listar(caminho) : nome.endsWith(".ts") ? [caminho] : [];
    });
  }

  it("fora de html.ts e layout.ts nenhum módulo cria Cru direto", () => {
    const todos = listar(PASTA_SRC);
    expect(todos.length).toBeGreaterThan(10);
    const achados = todos
      .map((c) => ({ nome: relative(PASTA_SRC, c).replaceAll("\\", "/"), texto: readFileSync(c, "utf8") }))
      .filter(({ nome, texto }) => !["paginas/html.ts", "paginas/layout.ts"].includes(nome) && /new\s+Cru\s*\(/.test(texto))
      .map(({ nome }) => nome);
    expect(achados).toEqual([]);
  });
});
