// Notas consolidadas a partir dos cenários fictícios, sem banco: a mesma passagem que a API faz
// (interpretarRetorno, depois consolidarNotas), para os testes de indicadores.
import { montarCenario, type ConsultaDeCenario } from "../../src/ficticios/cenarios.js";
import { consolidarNotas, type NotaDoBanco } from "../../src/indicadores/consolidacao.js";
import { consolidar, type DadosDaEmpresa } from "../../src/paineis/dados.js";
import { interpretarRetorno } from "../../src/leitura/registrar.js";
import { RAIZ } from "./construtores.js";

export const AGORA_DOS_TESTES = new Date("2026-11-27T15:00:00.000Z");

let sequencia = 0;

/** Uma nota de banco com valores padrão, para casos pequenos montados à mão. */
export function notaDoBanco(extra: Partial<NotaDoBanco> = {}): NotaDoBanco {
  sequencia++;
  return {
    arquivoId: `aaaaaaaa-0000-4000-8000-${String(sequencia).padStart(12, "0")}`,
    situacaoArquivo: "aceito",
    geradoEm: "2026-11-20T10:00:00.000-03:00",
    recebidoEm: new Date("2026-11-20T13:05:00.000Z"),
    pa: "11/2026",
    chave: `NOTA-${sequencia}`,
    documento: 55,
    origem: 0,
    emissao: "2026-11-02T10:00:00.000-03:00",
    registro: "2026-11-02T10:05:00.000-03:00",
    atualizacao: "2026-11-10T10:00:00-03:00",
    valores: {},
    ...extra,
  };
}

/** Notas (sem consolidar) de todas as consultas lidas do serviço, como saem do banco. */
export function notasBrutasDe(consultas: ConsultaDeCenario[], servico: "creditos" | "debitos", raiz = RAIZ): NotaDoBanco[] {
  const saida: NotaDoBanco[] = [];
  consultas.forEach((c, i) => {
    if (c.servico !== servico || c.estado !== "lida" || !c.retorno) return;
    const r = interpretarRetorno(c.retorno, servico, raiz);
    if (r.situacao === "recusado") return;
    for (const n of r.notas) {
      saida.push({
        arquivoId: `aaaaaaaa-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
        situacaoArquivo: r.situacao,
        geradoEm: r.geradoEm,
        recebidoEm: c.finalizadaEm ?? c.criadaEm,
        pa: n.pa,
        chave: n.chave,
        documento: n.documento,
        origem: n.origem,
        emissao: n.emissao,
        registro: n.registro,
        atualizacao: n.atualizacao,
        valores: n.valores,
      });
    }
  });
  return saida;
}

/** Notas consolidadas de um cenário e serviço. */
export function notasDoCenario(
  nome: string,
  servico: "creditos" | "debitos" = "creditos",
  raiz = RAIZ,
  opcoes: { agora?: Date; semente?: number } = {},
): NotaDoBanco[] {
  const consultas = montarCenario(nome, { raiz, agora: opcoes.agora ?? AGORA_DOS_TESTES, semente: opcoes.semente ?? 7 });
  return consolidarNotas(notasBrutasDe(consultas, servico, raiz));
}

/** O que a API consolida para uma empresa com uma consulta lida de créditos aceita (sem banco). */
export function consolidadoDeCreditos(notas: NotaDoBanco[], agora = AGORA_DOS_TESTES) {
  const consulta = {
    id: "00000000-0000-4000-8000-0000000000aa",
    servico: "creditos" as const,
    estado: "lida" as const,
    criadaEm: new Date(agora.getTime() - 3_600_000),
    concluidaEm: new Date(agora.getTime() - 3_000_000),
    finalizadaEm: new Date(agora.getTime() - 2_900_000),
  };
  const dados: DadosDaEmpresa = {
    raiz: RAIZ,
    consultas: [consulta],
    arquivos: [
      ...new Set(notas.map((n) => n.arquivoId)),
    ].map((id) => ({ id, consultaId: consulta.id, servico: "creditos" as const, situacao: "aceito" as const, recebidoEm: agora })),
    creditos: notas,
    debitos: [],
  };
  return consolidar(dados, agora);
}

