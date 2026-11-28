// Os nove cenários fictícios da 033 (CA-16 a CA-20, CA-26): dados puros, sem banco.
// Quem grava é o comando `carregar-cenario`. Cada consulta traz o estado, os horários (relativos ao relógio
// recebido) e, se foi lida, o retorno no formato oficial.
import type { EstadoConsulta } from "../banco/esquema.js";
import {
  gerarCreditos,
  gerarDebitos,
  notaEspecial,
  serializarRetorno,
  serializarVazio,
  versoesNovas,
  type NotaGerada,
  type ParametrosGerador,
} from "./gerador.js";

const MIN = 60_000;
const DIA = 24 * 60 * MIN;

export const CENARIOS = [
  "completo",
  "sem-consulta",
  "em-andamento",
  "vazio",
  "parcial",
  "falha-com-anteriores",
  "desatualizado",
  "recusado",
  "outros-valores",
] as const;

export type NomeCenario = (typeof CENARIOS)[number];

export interface ConsultaDeCenario {
  servico: "creditos" | "debitos";
  estado: EstadoConsulta;
  criadaEm: Date;
  concluidaEm: Date | null;
  finalizadaEm: Date | null;
  /** Só nas consultas `lida`: o arquivo como a Receita o devolveria. */
  retorno: Uint8Array | null;
}

export interface ParametrosCenario {
  /** Raiz do CNPJ da empresa que recebe o cenário. */
  raiz: string;
  /** O relógio: todo horário do cenário é relativo a ele. */
  agora: Date;
  semente: number;
}

/** Outra raiz fictícia, para o retorno que a leitura recusa por ser de outra empresa. */
const OUTRA_RAIZ = "55443322";

const antes = (agora: Date, ms: number): Date => new Date(agora.getTime() - ms);

/** Uma consulta lida: concluída em `concluidaEm`, finalizada cinco minutos depois. */
function lida(servico: "creditos" | "debitos", concluidaEm: Date, retorno: Uint8Array): ConsultaDeCenario {
  return {
    servico,
    estado: "lida",
    criadaEm: new Date(concluidaEm.getTime() - 10 * MIN),
    concluidaEm,
    finalizadaEm: new Date(concluidaEm.getTime() + 5 * MIN),
    retorno,
  };
}

function falhou(servico: "creditos" | "debitos", estado: EstadoConsulta, finalizadaEm: Date): ConsultaDeCenario {
  return { servico, estado, criadaEm: new Date(finalizadaEm.getTime() - 2 * MIN), concluidaEm: null, finalizadaEm, retorno: null };
}

export function montarCenario(nome: string, p: ParametrosCenario): ConsultaDeCenario[] {
  const base = (ref: Date): ParametrosGerador => ({ raiz: p.raiz, semente: p.semente, ref });
  const cab = (ref: Date, tiquete: string, raiz = p.raiz) => ({ raiz, ref, tiquete });
  /** Retorno de créditos e de débitos de uma consulta concluída em `quando`. */
  const dados = (quando: Date, qtdCreditos: number, qtdDebitos: number) => {
    const ref = new Date(quando.getTime() + 5 * MIN);
    return {
      creditos: lida("creditos", quando, serializarRetorno("creditos", cab(ref, "FICTCRED"), gerarCreditos(base(ref), qtdCreditos))),
      debitos: lida("debitos", quando, serializarRetorno("debitos", cab(ref, "FICTDEB"), gerarDebitos(base(ref), qtdDebitos))),
    };
  };

  switch (nome) {
    case "completo": {
      const primeira = antes(p.agora, 8 * DIA);
      const segunda = antes(p.agora, DIA);
      const refA = new Date(primeira.getTime() + 5 * MIN);
      const refB = new Date(segunda.getTime() + 5 * MIN);
      const creditosA = gerarCreditos(base(refA), 900);
      const debitosA = gerarDebitos(base(refA), 300);
      return [
        lida("creditos", primeira, serializarRetorno("creditos", cab(refA, "FICTCRED1"), creditosA)),
        lida("creditos", segunda, serializarRetorno("creditos", cab(refB, "FICTCRED2"), versoesNovas(creditosA, refB, 40, p.semente + 1))),
        lida("debitos", primeira, serializarRetorno("debitos", cab(refA, "FICTDEB1"), debitosA)),
        lida("debitos", segunda, serializarRetorno("debitos", cab(refB, "FICTDEB2"), versoesNovas(debitosA, refB, 20, p.semente + 2))),
      ];
    }
    case "sem-consulta":
      return [];
    case "em-andamento":
      return [{ servico: "creditos", estado: "aberta", criadaEm: antes(p.agora, 30 * MIN), concluidaEm: null, finalizadaEm: null, retorno: null }];
    case "vazio": {
      const quando = antes(p.agora, DIA);
      const ref = new Date(quando.getTime() + 5 * MIN);
      return [
        lida("creditos", quando, serializarVazio(cab(ref, "FICTCRED"))),
        lida("debitos", quando, serializarVazio(cab(ref, "FICTDEB"))),
      ];
    }
    case "parcial": {
      const d = dados(antes(p.agora, DIA), 120, 0);
      return [d.creditos, falhou("debitos", "erro", antes(p.agora, 3 * 60 * MIN))];
    }
    case "falha-com-anteriores": {
      const d = dados(antes(p.agora, 3 * DIA), 120, 60);
      return [d.creditos, d.debitos, falhou("creditos", "credencial_invalida", antes(p.agora, 2 * 60 * MIN))];
    }
    case "desatualizado": {
      const d = dados(antes(p.agora, 9 * DIA), 120, 60);
      return [d.creditos, d.debitos];
    }
    case "recusado": {
      const quando = antes(p.agora, DIA);
      const ref = new Date(quando.getTime() + 5 * MIN);
      const boas = gerarCreditos(base(ref), 120);
      const deOutra = serializarRetorno("creditos", cab(ref, "FICTCREDX", OUTRA_RAIZ), gerarCreditos({ ...base(ref), raiz: OUTRA_RAIZ }, 10));
      const semChave: NotaGerada[] = gerarCreditos(base(ref), 3).map((n, i) => (i === 0 ? { ...n, semChave: true } : n));
      const deDebitos = serializarRetorno("debitos", cab(ref, "FICTDEB"), gerarDebitos(base(ref), 60));
      return [
        lida("creditos", antes(p.agora, 2 * DIA), serializarRetorno("creditos", cab(new Date(antes(p.agora, 2 * DIA).getTime() + 5 * MIN), "FICTCRED"), boas)),
        lida("creditos", new Date(quando.getTime() - 60 * MIN), deOutra),
        lida("creditos", quando, serializarRetorno("creditos", cab(ref, "FICTCREDY"), semChave)),
        lida("debitos", quando, deDebitos),
      ];
    }
    case "outros-valores": {
      const quando = antes(p.agora, DIA);
      const ref = new Date(quando.getTime() + 5 * MIN);
      const g = base(ref);
      const especiais = [
        notaEspecial(g, 1, { cbs: { apurado: 5000, aApropriar: 5000, suspenso: 1000 } }),
        notaEspecial(g, 2, { cbs: { apurado: 3000, aApropriar: 3000, prescrito: 550 } }),
        notaEspecial(g, 3, { cbs: { apurado: 4000, aApropriar: 4000, pedidoRessarcimento: 300 } }),
        notaEspecial(g, 4, { origem: 20, cbs: { apurado: 700, aApropriar: 700 } }),
        notaEspecial(g, 5, { origem: 30, cbs: { apurado: 200, aApropriar: -1550 } }),
      ];
      const notas = [...gerarCreditos(g, 150), ...especiais];
      return [lida("creditos", quando, serializarRetorno("creditos", cab(ref, "FICTCRED"), notas))];
    }
    default:
      throw new Error(`Cenário desconhecido: ${nome}. Os válidos são: ${CENARIOS.join(", ")}.`);
  }
}
