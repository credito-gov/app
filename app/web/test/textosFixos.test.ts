// Textos fixos do dashboard e da carteira ficam em src/paineis/textos.ts (seção "Textos" da Spec), para a
// varredura de palavras proibidas cobri-los (revisão B9). Os arquivos de tela não repetem esses textos.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PROIBIDAS, PROIBIDAS_RECOLHIMENTO, simples } from "./apoio/palavras";

const SRC = join(import.meta.dirname, "..", "src");
const ler = (...partes: string[]) => readFileSync(join(SRC, ...partes), "utf8");

const FIXOS: Array<[string, string[]]> = [
  ["paineis/blocos.tsx", ["Emitente</th>", ">Notas</th>", "Total a apropriar</th>", "Imposto das vendas no período.", "Parte do débito que a Receita informa como extinta.", "Saldo devedor informado pela Receita.", "(bloco)\""]],
  ["paginas/VisaoGeral.tsx", ["Recorte:"]],
  ["paginas/Pendencias.tsx", ["Recorte:", ">Pendências<", "Voltar à Visão geral", "Emitente</th>", "Total a apropriar</th>", "(lista)\""]],
  ["paginas/NotasDoGrupo.tsx", ["Voltar às pendências", "Não há notas neste grupo.", "A página pedida não existe.", "Tipo de documento</th>", "Emissão</th>", "Próxima</Link>", "Anterior</Link>"]],
  ["paginas/Carteira.tsx", ["Você ainda não tem acesso", "Não conseguimos encerrar a sessão", "Carteira de empresas"]],
];

describe("textos fixos do dashboard", () => {
  it.each(FIXOS)("%s não tem os textos fixos, que ficam em textos.ts", (arquivo, trechos) => {
    const fonte = ler(arquivo);
    for (const t of trechos) expect(fonte, `${arquivo}: ${t}`).not.toContain(t);
  });

  it("a varredura de palavras proibidas cobre esses textos (estão em textos.ts, sem palavra proibida)", () => {
    const textos = simples(ler("paineis", "textos.ts"));
    for (const p of [...PROIBIDAS, ...PROIBIDAS_RECOLHIMENTO]) expect(textos, p).not.toContain(p);
    for (const t of ["recorte:", "voltar a visao geral", "voltar as pendencias", "imposto das vendas no periodo.", "nao ha notas neste grupo."]) {
      expect(textos, t).toContain(t);
    }
  });
});
