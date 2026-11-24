import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { guardar } from "../../src/armazenamento.js";
import { MENSAGEM_SEM_ALTERACOES } from "../../src/saida.js";
import type { NomeServico } from "../../src/servicos.js";
import { bytesDaFixture, criarAmbienteCli, roteirizarCiclo, type AmbienteCli } from "./cli.js";
import { BASE64_CREDENCIAIS, ID, QUERY_ASSINADA, SEGREDO, TOKEN, URL_ASSINADA, URL_BASE, URL_TOKEN } from "./ficticios.js";

export function trilha(a: AmbienteCli): string[] {
  return a.api.pedidos.map((p) => {
    if (p.url === URL_TOKEN) return `${p.metodo} TOKEN`;
    if (p.url === URL_ASSINADA) return `${p.metodo} ARQUIVO`;
    return `${p.metodo} ${p.url.replace(URL_BASE, "")}`;
  });
}

export function semSegredos(a: AmbienteCli): void {
  const tudo = [a.saida.texto(), ...a.arquivosLocais().map((f) => f.texto)].join("\n");
  for (const segredo of [ID, SEGREDO, TOKEN, URL_ASSINADA, QUERY_ASSINADA, BASE64_CREDENCIAIS]) expect(tudo).not.toContain(segredo);
}

/**
 * Testes do comando para uma consulta, a partir das fixtures: ciclo completo, retomada por tíquete,
 * releitura de arquivo guardado, arquivo vazio e arquivo inválido.
 */
export function descreverCicloDaConsulta(
  servico: NomeServico,
  opcoes: {
    /** Trechos que o resumo do arquivo valido.json tem de mostrar. */
    esperado: string[];
    /** Trecho que só existe no resumo (para provar que o inválido não gera resumo). */
    marcaDeResumo: string;
    /** Arquivos inválidos da fixture que têm de dar código 3. */
    invalidos: string[];
    /** Trechos de cada arquivo inválido que a lista de divergências tem de conter. */
    divergencia?: string;
  },
): void {
  describe(`consulta de ${servico}: comando completo`, () => {
    it("ciclo completo: token, abertura, situações, download, arquivo, guarda, validação e resumo (código 0)", async () => {
      const a = criarAmbienteCli();
      const bytes = bytesDaFixture(servico, "valido.json");
      roteirizarCiclo(a.api, { servico, bytes });
      expect(await a.rodar(["consulta", servico])).toBe(0);
      expect(trilha(a)).toEqual([
        "POST TOKEN",
        `POST /${servico}/12345678`,
        "GET /situacao/TIQ-1",
        "GET /situacao/TIQ-1",
        "GET /situacao/TIQ-1",
        "GET /download/TIQ-1",
        "GET ARQUIVO",
      ]);
      expect(a.api.pedidos[1].corpo).toBe('{"urlRetorno":""}');
      const texto = a.saida.texto();
      expect(texto).toContain(`Aberturas de ${servico} registradas hoje: 0 (0 aceitas)`);
      expect(texto).toContain("situação: CONCLUIDA");
      for (const trecho of opcoes.esperado) expect(texto, trecho).toContain(trecho);
      const [nome] = a.guardados();
      expect(nome).toMatch(new RegExp(`^\\d{8}T\\d{6}Z_${servico}_TIQ-1\\.json$`));
      expect([...readFileSync(join(a.pastaLocal, "arquivos", nome))]).toEqual([...bytes]);
      semSegredos(a);
    });

    it("--tiquete não abre solicitação nem conta abertura", async () => {
      const a = criarAmbienteCli();
      roteirizarCiclo(a.api, { servico, bytes: bytesDaFixture(servico, "valido.json"), tiquete: "T-9", situacoes: ["CONCLUIDA"] });
      expect(await a.rodar(["consulta", servico, "--tiquete", "T-9"])).toBe(0);
      expect(a.api.contar("POST", `/${servico}/`)).toBe(0);
      expect(trilha(a)).toEqual(["POST TOKEN", "GET /situacao/T-9", "GET /download/T-9", "GET ARQUIVO"]);
      const registro = a.arquivosLocais().find((f) => f.caminho.endsWith("chamadas.jsonl"))?.texto ?? "";
      expect(registro).not.toContain('"tipo":"abertura"');
      expect(a.saida.texto()).not.toContain("registradas hoje");
      for (const trecho of opcoes.esperado) expect(a.saida.texto(), trecho).toContain(trecho);
    });

    it("ler: valida e resume um arquivo guardado, sem rede, sem token e sem configuração", async () => {
      const a = criarAmbienteCli();
      a.deps.env = {};
      let chamadas = 0;
      a.deps.fetch = (async () => {
        chamadas += 1;
        throw new Error("fetch não deveria ser chamado");
      }) as unknown as typeof fetch;
      const caminho = guardar({
        pastaLocal: a.pastaLocal,
        servico,
        tiquete: "TIQ-1",
        bytes: bytesDaFixture(servico, "valido.json"),
        agora: new Date(Date.UTC(2026, 10, 23, 13, 0, 0)),
      });
      expect(await a.rodar(["ler", caminho])).toBe(0);
      expect(chamadas).toBe(0);
      for (const trecho of opcoes.esperado) expect(a.saida.texto(), trecho).toContain(trecho);
    });

    it("arquivo sem registros: resultado válido, mensagem de sem alterações e código 0", async () => {
      const a = criarAmbienteCli();
      roteirizarCiclo(a.api, { servico, bytes: bytesDaFixture(servico, "vazio.json") });
      expect(await a.rodar(["consulta", servico])).toBe(0);
      expect(a.saida.texto()).toContain(MENSAGEM_SEM_ALTERACOES);
      expect(a.saida.texto()).not.toContain(opcoes.marcaDeResumo);
    });

    for (const invalido of opcoes.invalidos) {
      it(`${invalido} fica guardado, dá código 3, lista a divergência e não gera resumo`, async () => {
        const a = criarAmbienteCli();
        const bytes = bytesDaFixture(servico, invalido);
        roteirizarCiclo(a.api, { servico, bytes });
        expect(await a.rodar(["consulta", servico])).toBe(3);
        const [nome] = a.guardados();
        expect([...readFileSync(join(a.pastaLocal, "arquivos", nome))]).toEqual([...bytes]);
        const texto = a.saida.texto();
        expect(texto).toContain("não passou no schema");
        expect(texto).toContain(nome);
        if (opcoes.divergencia) expect(texto).toContain(opcoes.divergencia);
        expect(texto).not.toContain(opcoes.marcaDeResumo);
        semSegredos(a);
      });

      it(`ler ${invalido} também dá código 3 e não gera resumo`, async () => {
        const a = criarAmbienteCli();
        a.deps.env = {};
        const caminho = guardar({
          pastaLocal: a.pastaLocal,
          servico,
          tiquete: "TIQ-1",
          bytes: bytesDaFixture(servico, invalido),
          agora: new Date(Date.UTC(2026, 10, 23, 13, 0, 0)),
        });
        expect(await a.rodar(["ler", caminho])).toBe(3);
        expect(a.saida.texto()).not.toContain(opcoes.marcaDeResumo);
      });
    }
  });
}
