// Situação de cada serviço (CA-14 a CA-21): o que o dashboard sabe de créditos ou de débitos.
// Função pura: o relógio chega por parâmetro. Consultas de recolhimentos e pagamentos não entram (CA-21).
import type { EstadoConsulta, SituacaoArquivo } from "../banco/esquema.js";
import { instante } from "../leitura/datas.js";

const DIA_MS = 24 * 60 * 60_000;
/** Cada consulta só devolve as alterações dos últimos 8 dias (CA-15, P-9). */
const LIMITE_DESATUALIZADO_MS = 8 * DIA_MS;

export type ServicoDoPainel = "creditos" | "debitos";

export interface ConsultaResumo {
  id: string;
  servico: "creditos" | "debitos" | "recolhimentos" | "pagamentos";
  estado: EstadoConsulta;
  criadaEm: Date;
  concluidaEm: Date | null;
  finalizadaEm: Date | null;
}

export interface ArquivoResumo {
  id: string;
  consultaId: string;
  servico: ServicoDoPainel;
  situacao: SituacaoArquivo;
  recebidoEm: Date;
}

export type EstadoDoServico = "sem_consulta" | "sem_dados_usaveis" | "vazio" | "com_dados";

export interface SituacaoDoServico {
  estado: EstadoDoServico;
  emAndamento: boolean;
  /** A última consulta lida cujo arquivo entrou nos indicadores (aceito ou aceito com divergência). */
  ultimaAceitaEm: string | null;
  diasSemAtualizacao: number | null;
  desatualizado: boolean;
  falha: { em: string; tipo: "credencial" | "outra" } | null;
  atualizacao: { de: string; ate: string } | null;
  recusados: { quantidade: number; ultimoEm: string } | null;
}

export interface EntradaDaSituacao {
  consultas: readonly ConsultaResumo[];
  arquivos: readonly ArquivoResumo[];
  /** Notas já consolidadas do serviço. */
  notas: ReadonlyArray<{ atualizacao: string | null }>;
}

const EM_ANDAMENTO: ReadonlySet<EstadoConsulta> = new Set(["abrindo", "aberta", "concluida", "baixada"]);
const ERROS: ReadonlySet<EstadoConsulta> = new Set(["erro", "expirada", "credencial_invalida", "servico_indisponivel", "aberta_sem_tiquete"]);

function intervaloDeAtualizacao(notas: EntradaDaSituacao["notas"]): { de: string; ate: string } | null {
  let menor: { ns: bigint; texto: string } | null = null;
  let maior: { ns: bigint; texto: string } | null = null;
  for (const n of notas) {
    if (!n.atualizacao) continue;
    const ns = instante(n.atualizacao);
    if (ns === null) continue;
    if (menor === null || ns < menor.ns) menor = { ns, texto: n.atualizacao };
    if (maior === null || ns > maior.ns) maior = { ns, texto: n.atualizacao };
  }
  return menor && maior ? { de: menor.texto.slice(0, 10), ate: maior.texto.slice(0, 10) } : null;
}

export function situacaoDoServico(servico: ServicoDoPainel, entrada: EntradaDaSituacao, agora: Date): SituacaoDoServico {
  const consultas = entrada.consultas.filter((c) => c.servico === servico);
  const arquivos = entrada.arquivos.filter((a) => a.servico === servico);

  const lidas = consultas.filter((c) => c.estado === "lida" && c.concluidaEm !== null);
  // Só conta a consulta lida cujo arquivo entrou nos números (ajuste de 2026-11-28): o recusado não atualiza nada.
  const aceitas = new Set(arquivos.filter((a) => a.situacao !== "recusado").map((a) => a.consultaId));
  const ultima = lidas
    .filter((c) => aceitas.has(c.id))
    .reduce<Date | null>((maior, c) => (maior === null || c.concluidaEm! > maior ? c.concluidaEm : maior), null);
  const decorrido = ultima === null ? null : agora.getTime() - ultima.getTime();

  const finalizadas = consultas.filter((c) => c.finalizadaEm !== null);
  const maisRecente = finalizadas.reduce<ConsultaResumo | null>((m, c) => (m === null || c.criadaEm > m.criadaEm ? c : m), null);
  const falha =
    maisRecente !== null && ERROS.has(maisRecente.estado)
      ? { em: maisRecente.finalizadaEm!.toISOString(), tipo: (maisRecente.estado === "credencial_invalida" ? "credencial" : "outra") as "credencial" | "outra" }
      : null;

  const recusados = arquivos.filter((a) => a.situacao === "recusado");
  const ultimoRecusado = recusados.reduce<Date | null>((m, a) => (m === null || a.recebidoEm > m ? a.recebidoEm : m), null);

  const estado: EstadoDoServico =
    lidas.length === 0 ? "sem_consulta" : entrada.notas.length > 0 ? "com_dados" : recusados.length > 0 ? "sem_dados_usaveis" : "vazio";

  return {
    estado,
    emAndamento: consultas.some((c) => EM_ANDAMENTO.has(c.estado)),
    ultimaAceitaEm: ultima === null ? null : ultima.toISOString(),
    diasSemAtualizacao: decorrido === null ? null : Math.floor(decorrido / DIA_MS),
    desatualizado: decorrido !== null && decorrido > LIMITE_DESATUALIZADO_MS,
    falha,
    atualizacao: intervaloDeAtualizacao(entrada.notas),
    recusados: ultimoRecusado === null ? null : { quantidade: recusados.length, ultimoEm: ultimoRecusado.toISOString() },
  };
}
