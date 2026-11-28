// linhaDaCarteira (CA-C1, CA-C2, CA-C4; DT-8): uma linha por empresa, com I-2, I-3 e I-4 e um resumo
// da situação que junta créditos e débitos. Funções puras, relógio recebido por parâmetro.
import { describe, expect, it } from "vitest";
import * as modulo from "../../src/indicadores/carteira.js";
import { linhaDaCarteira } from "../../src/indicadores/carteira.js";
import { consolidarNotas } from "../../src/indicadores/consolidacao.js";
import { indicadoresDeCredito } from "../../src/indicadores/creditos.js";
import type { ConsultaResumo, ArquivoResumo } from "../../src/indicadores/situacao.js";
import { notaDoBanco } from "../apoio/notas.js";
import { RAIZ } from "../apoio/construtores.js";

const MIN = 60_000;
const DIA = 24 * 60 * MIN;
const AGORA = new Date("2026-11-27T15:00:00.000Z");
const antes = (ms: number) => new Date(AGORA.getTime() - ms);

let n = 0;
const id = () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;

const EMPRESA = { id: id(), nome: "Comércio Exemplo Ltda.", cnpjRaizFormatado: "90.817.263", papel: "contador" as const };

function lida(servico: ConsultaResumo["servico"], concluidaEm: Date): ConsultaResumo {
  return {
    id: id(),
    servico,
    estado: "lida",
    criadaEm: new Date(concluidaEm.getTime() - 10 * MIN),
    concluidaEm,
    finalizadaEm: new Date(concluidaEm.getTime() + 5 * MIN),
  };
}
function falha(servico: ConsultaResumo["servico"], finalizadaEm: Date): ConsultaResumo {
  return { id: id(), servico, estado: "erro", criadaEm: new Date(finalizadaEm.getTime() - MIN), concluidaEm: null, finalizadaEm };
}

const creditosDe = () => [
  notaDoBanco({ valores: { apurado: "100.00", aApropriar: "30.00", apropriado: "50.00", utilizado: "20.00" } }),
  notaDoBanco({ pa: "10/2026", valores: { apurado: "200.50", aApropriar: "0.25", apropriado: "10.00" } }),
];
const debitosDe = () => [notaDoBanco({ valores: { apurado: "40.00", extinto: "10.00", saldoDevedor: "30.00" } })];

function dados(consultas: ConsultaResumo[], opcoes: { creditos?: ReturnType<typeof creditosDe>; debitos?: ReturnType<typeof debitosDe>; arquivos?: ArquivoResumo[] } = {}) {
  return {
    raiz: RAIZ,
    consultas,
    // Toda consulta lida ganha um arquivo aceito, salvo se o teste informou o arquivo dela.
    arquivos: [
      ...consultas
        .filter((c) => c.estado === "lida" && !(opcoes.arquivos ?? []).some((a) => a.consultaId === c.id))
        .map((c): ArquivoResumo => ({ id: id(), consultaId: c.id, servico: c.servico as "creditos" | "debitos", situacao: "aceito", recebidoEm: c.finalizadaEm! })),
      ...(opcoes.arquivos ?? []),
    ],
    creditos: opcoes.creditos ?? [],
    debitos: opcoes.debitos ?? [],
  };
}

describe("CA-C1: valores da linha", () => {
  it("traz I-2, I-3 e I-4 de todos os períodos, iguais aos de indicadoresDeCredito sem recorte", () => {
    const creditos = creditosDe();
    const linha = linhaDaCarteira(
      EMPRESA,
      dados([lida("creditos", antes(DIA)), lida("debitos", antes(DIA))], { creditos, debitos: debitosDe() }),
      AGORA,
    );
    const esperado = indicadoresDeCredito(consolidarNotas(creditos), RAIZ, null);
    if (esperado.semNotasNoRecorte) throw new Error("fixture sem notas");
    expect(linha.creditos).toEqual({
      estado: "com_dados",
      aApropriar: esperado.totais.aApropriar,
      apropriado: esperado.totais.apropriado,
      utilizado: esperado.totais.utilizado,
    });
    expect(linha.creditos.aApropriar).toBe("30.25");
    expect(typeof linha.creditos.apropriado).toBe("string");
  });

  it("a linha leva a identificação da empresa", () => {
    const linha = linhaDaCarteira(EMPRESA, dados([]), AGORA);
    expect(linha).toMatchObject(EMPRESA);
    expect(Object.keys(linha).sort()).toEqual(["cnpjRaizFormatado", "creditos", "id", "nome", "papel", "situacao"]);
    expect(Object.keys(linha.creditos).sort()).toEqual(["aApropriar", "apropriado", "estado", "utilizado"]);
    expect(Object.keys(linha.situacao).sort()).toEqual(["diasSemAtualizacao", "recusados", "resumo", "ultimaAceitaEm"]);
  });

  it("sem consulta lida os valores são null e o estado vem no lugar", () => {
    const linha = linhaDaCarteira(EMPRESA, dados([]), AGORA);
    expect(linha.creditos).toEqual({ estado: "sem_consulta", aApropriar: null, apropriado: null, utilizado: null });
  });

  it("consulta lida sem nota e sem arquivo recusado dá estado vazio e valores null (nunca zero)", () => {
    const linha = linhaDaCarteira(EMPRESA, dados([lida("creditos", antes(DIA)), lida("debitos", antes(DIA))]), AGORA);
    expect(linha.creditos).toEqual({ estado: "vazio", aApropriar: null, apropriado: null, utilizado: null });
  });

  it("só arquivo recusado dá sem_dados_usaveis e valores null", () => {
    const c = lida("creditos", antes(DIA));
    const arquivo: ArquivoResumo = { id: id(), consultaId: c.id, servico: "creditos", situacao: "recusado", recebidoEm: antes(DIA) };
    const linha = linhaDaCarteira(EMPRESA, dados([c, lida("debitos", antes(DIA))], { arquivos: [arquivo] }), AGORA);
    expect(linha.creditos).toEqual({ estado: "sem_dados_usaveis", aApropriar: null, apropriado: null, utilizado: null });
  });

  it("créditos com falha mas com consulta anterior mantêm os valores", () => {
    const linha = linhaDaCarteira(
      EMPRESA,
      dados([lida("creditos", antes(3 * DIA)), falha("creditos", antes(DIA)), lida("debitos", antes(DIA))], { creditos: creditosDe() }),
      AGORA,
    );
    expect(linha.creditos.estado).toBe("com_dados");
    expect(linha.creditos.aApropriar).toBe("30.25");
    expect(linha.situacao.resumo).toBe("falhou");
  });
});

describe("CA-C2 e DT-8: resumo da situação", () => {
  const resumo = (consultas: ConsultaResumo[]) => linhaDaCarteira(EMPRESA, dados(consultas, { creditos: creditosDe(), debitos: debitosDe() }), AGORA).situacao.resumo;

  it("atualizado quando os dois serviços têm consulta dentro de 8 dias e nenhuma falha", () => {
    expect(resumo([lida("creditos", antes(DIA)), lida("debitos", antes(2 * DIA))])).toBe("atualizado");
  });

  it("desatualizado se um dos dois passou de 8 dias", () => {
    expect(resumo([lida("creditos", antes(DIA)), lida("debitos", antes(9 * DIA))])).toBe("desatualizado");
    expect(resumo([lida("creditos", antes(9 * DIA)), lida("debitos", antes(DIA))])).toBe("desatualizado");
  });

  it("sem_consulta se um dos serviços nunca teve consulta concluída, mesmo com o outro desatualizado", () => {
    expect(resumo([lida("creditos", antes(DIA))])).toBe("sem_consulta");
    expect(resumo([lida("creditos", antes(9 * DIA))])).toBe("sem_consulta");
    expect(resumo([])).toBe("sem_consulta");
  });

  it("falhou vence todos: créditos atualizados e débitos com falha dão falhou", () => {
    expect(resumo([lida("creditos", antes(DIA)), falha("debitos", antes(MIN))])).toBe("falhou");
    expect(resumo([lida("creditos", antes(9 * DIA)), lida("debitos", antes(DIA)), falha("creditos", antes(MIN))])).toBe("falhou");
  });

  it("consultas de recolhimentos e pagamentos não mudam o resumo", () => {
    expect(resumo([lida("creditos", antes(DIA)), lida("debitos", antes(DIA)), falha("recolhimentos", antes(MIN)), lida("pagamentos", antes(30 * DIA))])).toBe(
      "atualizado",
    );
  });

  it("a data é a mais antiga das duas últimas concluídas, e os dias contam a partir dela", () => {
    const creditos = lida("creditos", antes(2 * DIA));
    const debitos = lida("debitos", antes(5 * DIA + 3 * 60 * MIN));
    const linha = linhaDaCarteira(EMPRESA, dados([creditos, debitos], { creditos: creditosDe() }), AGORA);
    expect(linha.situacao.ultimaAceitaEm).toBe(debitos.concluidaEm!.toISOString());
    expect(linha.situacao.diasSemAtualizacao).toBe(5);
  });

  it("sem concluída num dos serviços, a data e os dias são null", () => {
    const linha = linhaDaCarteira(EMPRESA, dados([lida("creditos", antes(DIA))], { creditos: creditosDe() }), AGORA);
    expect(linha.situacao).toMatchObject({ resumo: "sem_consulta", ultimaAceitaEm: null, diasSemAtualizacao: null });
  });

  it("aceito há 10 dias e um recusado por dia desde então: desatualizado, com a data do aceito (ajuste de 2026-11-28)", () => {
    const aceita = lida("creditos", antes(10 * DIA));
    const recusadas = Array.from({ length: 10 }, (_, i) => lida("creditos", antes((9 - i) * DIA + 2 * 60 * MIN)));
    const arquivos: ArquivoResumo[] = [
      { id: id(), consultaId: aceita.id, servico: "creditos", situacao: "aceito", recebidoEm: antes(10 * DIA) },
      ...recusadas.map((c): ArquivoResumo => ({ id: id(), consultaId: c.id, servico: "creditos", situacao: "recusado", recebidoEm: c.finalizadaEm! })),
    ];
    const linha = linhaDaCarteira(EMPRESA, dados([aceita, ...recusadas, lida("debitos", antes(DIA))], { creditos: creditosDe(), arquivos }), AGORA);
    expect(linha.situacao).toMatchObject({ resumo: "desatualizado", ultimaAceitaEm: aceita.concluidaEm!.toISOString(), diasSemAtualizacao: 10 });
    expect(linha.situacao.recusados.creditos?.quantidade).toBe(10);
    expect(linha.situacao.recusados.debitos).toBeNull();
  });

  it("um serviço só com retornos recusados: sem_consulta e data nula, sem falha", () => {
    const c = lida("creditos", antes(DIA));
    const arquivos: ArquivoResumo[] = [{ id: id(), consultaId: c.id, servico: "creditos", situacao: "recusado", recebidoEm: antes(DIA) }];
    const linha = linhaDaCarteira(EMPRESA, dados([c, lida("debitos", antes(DIA))], { arquivos }), AGORA);
    expect(linha.situacao).toMatchObject({ resumo: "sem_consulta", ultimaAceitaEm: null, diasSemAtualizacao: null });
    expect(linha.creditos.estado).toBe("sem_dados_usaveis");
  });

  it("recusados de créditos e de débitos vão para a linha (CA-20)", () => {
    const c = lida("creditos", antes(DIA));
    const d = lida("debitos", antes(DIA));
    const arquivos: ArquivoResumo[] = [
      { id: id(), consultaId: c.id, servico: "creditos", situacao: "recusado", recebidoEm: antes(DIA) },
      { id: id(), consultaId: d.id, servico: "debitos", situacao: "recusado", recebidoEm: antes(DIA) },
    ];
    const linha = linhaDaCarteira(EMPRESA, dados([c, d], { arquivos }), AGORA);
    expect(linha.situacao.recusados.creditos?.quantidade).toBe(1);
    expect(linha.situacao.recusados.debitos?.quantidade).toBe(1);
  });
});

describe("CA-C4: nada de soma entre empresas", () => {
  it("o módulo exporta só linhaDaCarteira", () => {
    expect(Object.keys(modulo)).toEqual(["linhaDaCarteira"]);
  });

  it("linhaDaCarteira recebe uma empresa por vez", () => {
    expect(linhaDaCarteira.length).toBe(3);
  });
});
