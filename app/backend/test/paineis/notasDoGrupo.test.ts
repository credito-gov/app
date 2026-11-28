// Notas de um grupo (revisão, item B5): a identidade da nota é (período, chave, documento, origem),
// então a resposta traz o que distingue duas notas de mesma chave.
import { describe, expect, it } from "vitest";
import { consolidarNotas } from "../../src/indicadores/consolidacao.js";
import { consolidar, montarNotasDoGrupo, type DadosDaEmpresa } from "../../src/paineis/dados.js";
import { notaDoBanco } from "../apoio/notas.js";
import { RAIZ } from "../apoio/construtores.js";

const AGORA = new Date("2026-11-27T15:00:00.000Z");

function consolidado(notas: ReturnType<typeof notaDoBanco>[]) {
  const consulta = {
    id: "00000000-0000-4000-8000-0000000000aa",
    servico: "creditos" as const,
    estado: "lida" as const,
    criadaEm: new Date(AGORA.getTime() - 3_600_000),
    concluidaEm: new Date(AGORA.getTime() - 3_000_000),
    finalizadaEm: new Date(AGORA.getTime() - 2_900_000),
  };
  const dados: DadosDaEmpresa = {
    raiz: RAIZ,
    consultas: [consulta],
    arquivos: [
      ...new Set(notas.map((n) => n.arquivoId)),
    ].map((id) => ({ id, consultaId: consulta.id, servico: "creditos" as const, situacao: "aceito" as const, recebidoEm: AGORA })),
    creditos: notas,
    debitos: [],
  };
  return consolidar(dados, AGORA);
}

describe("montarNotasDoGrupo traz a origem e o documento de cada nota", () => {
  const mesmaChave = { chave: "SEM-LEIAUTE-1", pa: "11/2026", documento: 55 };
  const notas = [
    notaDoBanco({ ...mesmaChave, origem: 0, valores: { aApropriar: "10.00" } }),
    notaDoBanco({ ...mesmaChave, origem: 20, valores: { aApropriar: "7.00" } }),
    notaDoBanco({ ...mesmaChave, origem: 30, valores: { aApropriar: "5.00" } }),
  ];

  it("duas ou mais notas de mesma chave e período, de origens diferentes, saem distinguíveis", () => {
    const c = consolidado(notas);
    expect(consolidarNotas(notas)).toHaveLength(3); // premissa: a consolidação mantém as três
    const r = montarNotasDoGrupo(c, null, "nao-identificado", undefined);
    if (r.tipo !== "ok") throw new Error(`esperava ok, veio ${r.tipo}`);
    expect(r.corpo.notas).toHaveLength(3);
    expect(r.corpo.notas.map((n) => n.origem)).toEqual([0, 20, 30]);
    expect(r.corpo.notas.map((n) => n.origemNome)).toEqual(["NORMAL", "DEVOLUCAO_POR_PCONT", "CANCELAMENTO_CREDITO"]);
    const identidades = r.corpo.notas.map((n) => `${n.periodo}|${n.chave}|${n.documento}|${n.origem}`);
    expect(new Set(identidades).size).toBe(3);
  });

  it("a ordem é estável: valor decrescente, depois chave, documento e origem", () => {
    const iguais = [
      notaDoBanco({ chave: "X", documento: 55, origem: 30, valores: { aApropriar: "5.00" } }),
      notaDoBanco({ chave: "X", documento: 55, origem: 20, valores: { aApropriar: "5.00" } }),
      notaDoBanco({ chave: "X", documento: 57, origem: 0, valores: { aApropriar: "5.00" } }),
    ];
    const r = montarNotasDoGrupo(consolidado(iguais), null, "nao-identificado", undefined);
    if (r.tipo !== "ok") throw new Error("esperava ok");
    expect(r.corpo.notas.map((n) => [n.documento, n.origem])).toEqual([
      [55, 20],
      [55, 30],
      [57, 0],
    ]);
  });
});
