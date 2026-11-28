// situacaoDoServico (CA-14 a CA-21): o que o dashboard sabe de cada serviço, com relógio recebido.
import { describe, expect, it } from "vitest";
import {
  situacaoDoServico,
  type ArquivoResumo,
  type ConsultaResumo,
} from "../../src/indicadores/situacao.js";

const MIN = 60_000;
const DIA = 24 * 60 * MIN;
const AGORA = new Date("2026-11-27T15:00:00.000Z");
const antes = (ms: number) => new Date(AGORA.getTime() - ms);

let n = 0;
const id = () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;

function lida(servico: ConsultaResumo["servico"], concluidaEm: Date, extra: Partial<ConsultaResumo> = {}): ConsultaResumo {
  return {
    id: id(),
    servico,
    estado: "lida",
    criadaEm: new Date(concluidaEm.getTime() - 10 * MIN),
    concluidaEm,
    finalizadaEm: new Date(concluidaEm.getTime() + 5 * MIN),
    ...extra,
  };
}
function falha(servico: ConsultaResumo["servico"], estado: ConsultaResumo["estado"], finalizadaEm: Date): ConsultaResumo {
  return { id: id(), servico, estado, criadaEm: new Date(finalizadaEm.getTime() - MIN), concluidaEm: null, finalizadaEm };
}
function andamento(servico: ConsultaResumo["servico"], estado: ConsultaResumo["estado"], criadaEm = antes(30 * MIN)): ConsultaResumo {
  return { id: id(), servico, estado, criadaEm, concluidaEm: null, finalizadaEm: null };
}
function arquivo(consulta: ConsultaResumo, situacao: ArquivoResumo["situacao"], recebidoEm = new Date(consulta.finalizadaEm ?? AGORA)): ArquivoResumo {
  return { id: id(), consultaId: consulta.id, servico: consulta.servico as "creditos" | "debitos", situacao, recebidoEm };
}
const nota = (atualizacao: string) => ({ atualizacao });
const N1 = nota("2026-11-01T08:00:00-03:00");

const sit = (
  servico: "creditos" | "debitos",
  consultas: ConsultaResumo[],
  arquivos: ArquivoResumo[] = [],
  notas: { atualizacao: string | null }[] = [],
  agora = AGORA,
) => situacaoDoServico(servico, { consultas, arquivos, notas }, agora);

describe("CA-14: última consulta concluída e intervalo de atualização", () => {
  it("ultimaAceitaEm é o maior concluida_em entre as consultas lidas, em ISO UTC", () => {
    const a = lida("creditos", antes(5 * DIA));
    const b = lida("creditos", antes(2 * DIA));
    const c = lida("creditos", antes(3 * DIA));
    const r = sit("creditos", [a, b, c], [arquivo(a, "aceito"), arquivo(b, "aceito"), arquivo(c, "aceito")], [N1]);
    expect(r.ultimaAceitaEm).toBe(antes(2 * DIA).toISOString());
  });

  // Teste trocado de propósito: a versão anterior afirmava que o recusado contava; a Spec foi ajustada em 2026-11-28.
  it("a consulta lida com arquivo recusado não conta: vale a última com arquivo aceito (ajuste de 2026-11-28)", () => {
    const a = lida("creditos", antes(5 * DIA));
    const b = lida("creditos", antes(1 * DIA));
    const r = sit("creditos", [a, b], [arquivo(a, "aceito"), arquivo(b, "recusado")], [N1]);
    expect(r.ultimaAceitaEm).toBe(antes(5 * DIA).toISOString());
  });

  it("aceito_com_divergencia conta", () => {
    const a = lida("creditos", antes(2 * DIA));
    const r = sit("creditos", [a], [arquivo(a, "aceito_com_divergencia")], [N1]);
    expect(r.ultimaAceitaEm).toBe(antes(2 * DIA).toISOString());
  });

  it("retorno aceito com apuração vazia (nenhuma nota) conta", () => {
    const a = lida("creditos", antes(2 * DIA));
    const r = sit("creditos", [a], [arquivo(a, "aceito")], []);
    expect(r).toMatchObject({ estado: "vazio", ultimaAceitaEm: antes(2 * DIA).toISOString(), diasSemAtualizacao: 2 });
  });

  it("atualizacao.de e .ate são a menor e a maior data das notas, em AAAA-MM-DD do texto do arquivo", () => {
    const a = lida("creditos", antes(DIA));
    const r = sit(
      "creditos",
      [a],
      [arquivo(a, "aceito")],
      [nota("2026-11-18T08:00:00-03:00"), nota("2026-11-01T23:30:00-03:00"), nota("2026-11-21T00:10:00.123456-03:00"), nota("2026-11-05T10:00:00Z")],
    );
    expect(r.atualizacao).toEqual({ de: "2026-11-01", ate: "2026-11-21" });
  });

  it("sem notas, atualizacao é nula", () => {
    const a = lida("creditos", antes(DIA));
    expect(sit("creditos", [a], [arquivo(a, "aceito")], []).atualizacao).toBeNull();
  });

  it("o resultado é por serviço: débitos não usam as consultas de créditos", () => {
    const a = lida("creditos", antes(DIA));
    const r = sit("debitos", [a], [arquivo(a, "aceito")], []);
    expect(r.ultimaAceitaEm).toBeNull();
  });
});

describe("CA-15: desatualizado depois de mais de 8 dias", () => {
  it("8 × 24 h exatas depois da última concluída, não está desatualizado", () => {
    const a = lida("creditos", antes(8 * DIA));
    const r = sit("creditos", [a], [arquivo(a, "aceito")], [N1]);
    expect(r.desatualizado).toBe(false);
    expect(r.diasSemAtualizacao).toBe(8);
  });

  it("8 × 24 h e 1 s depois, está desatualizado", () => {
    const a = lida("creditos", antes(8 * DIA + 1000));
    const r = sit("creditos", [a], [arquivo(a, "aceito")], [N1]);
    expect(r.desatualizado).toBe(true);
    expect(r.diasSemAtualizacao).toBe(8);
  });

  it("diasSemAtualizacao é em dias inteiros", () => {
    const a = lida("creditos", antes(2 * DIA + 23 * 60 * MIN));
    expect(sit("creditos", [a], [arquivo(a, "aceito")], [N1]).diasSemAtualizacao).toBe(2);
    const b = lida("creditos", antes(30 * MIN));
    expect(sit("creditos", [b], [arquivo(b, "aceito")], [N1]).diasSemAtualizacao).toBe(0);
  });

  it("créditos desatualizados e débitos não, e o contrário", () => {
    const c = lida("creditos", antes(9 * DIA));
    const d = lida("debitos", antes(1 * DIA));
    const todas = [c, d];
    const arqs = [arquivo(c, "aceito"), arquivo(d, "aceito")];
    expect(sit("creditos", todas, arqs, [N1]).desatualizado).toBe(true);
    expect(sit("debitos", todas, arqs, [N1]).desatualizado).toBe(false);
    const c2 = lida("creditos", antes(1 * DIA));
    const d2 = lida("debitos", antes(9 * DIA));
    const arqs2 = [arquivo(c2, "aceito"), arquivo(d2, "aceito")];
    expect(sit("creditos", [c2, d2], arqs2, [N1]).desatualizado).toBe(false);
    expect(sit("debitos", [c2, d2], arqs2, [N1]).desatualizado).toBe(true);
  });

  it("sem consulta lida, não há data e não está desatualizado", () => {
    const r = sit("creditos", []);
    expect(r).toMatchObject({ diasSemAtualizacao: null, desatualizado: false, ultimaAceitaEm: null });
  });
});

describe("ajuste de 2026-11-28: recusados não escondem a falta de atualização (CA-15, CA-19)", () => {
  it("aceito há 10 dias e um recusado por dia desde então: a data é a do aceito e está desatualizado", () => {
    const aceita = lida("creditos", antes(10 * DIA));
    const recusadas = Array.from({ length: 10 }, (_, i) => lida("creditos", antes((9 - i) * DIA + 2 * 60 * MIN)));
    const arquivos = [arquivo(aceita, "aceito"), ...recusadas.map((c) => arquivo(c, "recusado"))];
    const r = sit("creditos", [aceita, ...recusadas], arquivos, [N1]);
    expect(r.ultimaAceitaEm).toBe(antes(10 * DIA).toISOString());
    expect(r.diasSemAtualizacao).toBe(10);
    expect(r.desatualizado).toBe(true);
    expect(r.recusados?.quantidade).toBe(10);
    expect(r.estado).toBe("com_dados");
  });

  it("só retornos recusados: sem_dados_usaveis, sem data nem dias, e não desatualizado", () => {
    const a = lida("creditos", antes(20 * DIA));
    const b = lida("creditos", antes(DIA));
    const r = sit("creditos", [a, b], [arquivo(a, "recusado"), arquivo(b, "recusado")], []);
    expect(r).toMatchObject({ estado: "sem_dados_usaveis", ultimaAceitaEm: null, diasSemAtualizacao: null, desatualizado: false });
  });

  it("débitos tem o mesmo comportamento (CA-20)", () => {
    const a = lida("debitos", antes(DIA));
    const r = sit("debitos", [a], [arquivo(a, "recusado")], []);
    expect(r).toMatchObject({ estado: "sem_dados_usaveis", ultimaAceitaEm: null, recusados: { quantidade: 1 } });
  });
});

describe("CA-16: sem consulta concluída e consulta em andamento", () => {
  it("sem nenhuma consulta lida, o estado é sem_consulta", () => {
    expect(sit("creditos", []).estado).toBe("sem_consulta");
    expect(sit("creditos", [falha("creditos", "erro", antes(DIA))]).estado).toBe("sem_consulta");
  });

  it.each(["abrindo", "aberta", "concluida", "baixada"] as const)("consulta em %s: emAndamento verdadeiro", (estado) => {
    const r = sit("creditos", [andamento("creditos", estado)]);
    expect(r).toMatchObject({ estado: "sem_consulta", emAndamento: true });
  });

  it("com só agendada, emAndamento é falso", () => {
    expect(sit("creditos", [andamento("creditos", "agendada")]).emAndamento).toBe(false);
  });

  it("consulta em andamento de outro serviço não conta", () => {
    expect(sit("creditos", [andamento("debitos", "aberta")]).emAndamento).toBe(false);
  });

  it("consulta lida e outra em andamento: o estado vem da lida, e emAndamento fica verdadeiro", () => {
    const a = lida("creditos", antes(DIA));
    const r = sit("creditos", [a, andamento("creditos", "aberta")], [arquivo(a, "aceito")], [N1]);
    expect(r).toMatchObject({ estado: "com_dados", emAndamento: true });
  });
});

describe("CA-17: consulta lida sem nenhuma nota", () => {
  it("consulta lida, nenhuma nota e nenhum arquivo recusado: vazio", () => {
    const a = lida("creditos", antes(DIA));
    const r = sit("creditos", [a], [arquivo(a, "aceito")], []);
    expect(r).toMatchObject({ estado: "vazio", recusados: null });
  });
});

describe("CA-18: cada serviço com o seu estado", () => {
  it("créditos com_dados e débitos sem_consulta na mesma chamada", () => {
    const a = lida("creditos", antes(DIA));
    const consultas = [a];
    const arquivos = [arquivo(a, "aceito")];
    expect(sit("creditos", consultas, arquivos, [N1]).estado).toBe("com_dados");
    expect(sit("debitos", consultas, arquivos, []).estado).toBe("sem_consulta");
  });
});

describe("CA-19: falha da última tentativa", () => {
  it("a mais recente das finalizadas em credencial_invalida dá falha de credencial, com finalizada_em", () => {
    const antiga = lida("creditos", antes(3 * DIA));
    const f = falha("creditos", "credencial_invalida", antes(2 * 60 * MIN));
    const r = sit("creditos", [antiga, f], [arquivo(antiga, "aceito")], [N1]);
    expect(r.falha).toEqual({ em: f.finalizadaEm!.toISOString(), tipo: "credencial" });
  });

  it.each(["erro", "expirada", "servico_indisponivel", "aberta_sem_tiquete"] as const)("%s dá falha do tipo outra", (estado) => {
    const f = falha("creditos", estado, antes(MIN * 90));
    expect(sit("creditos", [f]).falha).toEqual({ em: f.finalizadaEm!.toISOString(), tipo: "outra" });
  });

  it("uma falha antiga seguida de uma lida não é falha", () => {
    const f = falha("creditos", "erro", antes(5 * DIA));
    const a = lida("creditos", antes(2 * DIA));
    expect(sit("creditos", [f, a], [arquivo(a, "aceito")], [N1]).falha).toBeNull();
  });

  it("a mais recente é pela criada_em, não pela ordem da lista", () => {
    const f = falha("creditos", "erro", antes(5 * DIA));
    const a = lida("creditos", antes(2 * DIA));
    expect(sit("creditos", [a, f], [arquivo(a, "aceito")], [N1]).falha).toBeNull();
    const f2 = falha("creditos", "credencial_invalida", antes(60 * MIN));
    expect(sit("creditos", [f2, a], [arquivo(a, "aceito")], [N1]).falha?.tipo).toBe("credencial");
  });

  it("com falha e consulta lida anterior, o estado continua com_dados", () => {
    const a = lida("creditos", antes(3 * DIA));
    const f = falha("creditos", "credencial_invalida", antes(60 * MIN));
    const r = sit("creditos", [a, f], [arquivo(a, "aceito")], [N1]);
    expect(r).toMatchObject({ estado: "com_dados", falha: { tipo: "credencial" } });
  });

  it("a falha de um serviço não aparece no outro, e consulta em andamento não é falha", () => {
    const f = falha("debitos", "erro", antes(MIN * 10));
    expect(sit("creditos", [f]).falha).toBeNull();
    expect(sit("debitos", [andamento("debitos", "aberta")]).falha).toBeNull();
  });
});

describe("CA-20: arquivos recusados", () => {
  it("um arquivo recusado e nenhuma nota: sem_dados_usaveis", () => {
    const a = lida("creditos", antes(DIA));
    const r = sit("creditos", [a], [arquivo(a, "recusado")], []);
    expect(r.estado).toBe("sem_dados_usaveis");
    expect(r.recusados).toEqual({ quantidade: 1, ultimoEm: a.finalizadaEm!.toISOString() });
  });

  it("recusados com dados aceitos: com_dados e recusados com a quantidade e o mais recente", () => {
    const boa = lida("creditos", antes(4 * DIA));
    const r1 = lida("creditos", antes(3 * DIA));
    const r2 = lida("creditos", antes(1 * DIA));
    const arquivos = [arquivo(boa, "aceito"), arquivo(r1, "recusado"), arquivo(r2, "recusado")];
    const r = sit("creditos", [boa, r1, r2], arquivos, [N1]);
    expect(r.estado).toBe("com_dados");
    expect(r.recusados).toEqual({ quantidade: 2, ultimoEm: r2.finalizadaEm!.toISOString() });
  });

  it("aceito com divergência não é recusado", () => {
    const a = lida("creditos", antes(DIA));
    expect(sit("creditos", [a], [arquivo(a, "aceito_com_divergencia")], [N1]).recusados).toBeNull();
  });
});

describe("CA-21: recolhimentos e pagamentos não entram em nada", () => {
  it("consultas desses serviços na lista não mudam o resultado", () => {
    const a = lida("creditos", antes(3 * DIA));
    const base = sit("creditos", [a], [arquivo(a, "aceito")], [N1]);
    const ruido = [
      lida("recolhimentos", antes(MIN * 5)),
      lida("pagamentos", antes(MIN * 5)),
      falha("recolhimentos", "credencial_invalida", antes(MIN * 2)),
      andamento("pagamentos", "aberta"),
    ];
    expect(sit("creditos", [a, ...ruido], [arquivo(a, "aceito")], [N1])).toEqual(base);
    expect(sit("debitos", [a, ...ruido], [arquivo(a, "aceito")], []).estado).toBe("sem_consulta");
  });
});

describe("o relógio é parâmetro", () => {
  it("o resultado depende só do agora recebido", () => {
    const a = lida("creditos", new Date("2026-11-01T12:00:00Z"));
    const cedo = sit("creditos", [a], [arquivo(a, "aceito")], [N1], new Date("2026-11-05T12:00:00Z"));
    const tarde = sit("creditos", [a], [arquivo(a, "aceito")], [N1], new Date("2026-11-20T12:00:00Z"));
    expect(cedo).toMatchObject({ diasSemAtualizacao: 4, desatualizado: false });
    expect(tarde).toMatchObject({ diasSemAtualizacao: 19, desatualizado: true });
  });
});
