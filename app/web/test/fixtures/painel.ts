// Respostas fictícias da API do dashboard, escritas à mão a partir de "Contratos" da Spec da 033.
// Valores redondos; CNPJ e CPF montados pelos auxiliares (nunca por extenso) e com o DV errado de propósito.
import type { BlocoDeCreditos, BlocoDeDebitos, GrupoDePendencia, NotasDoGrupo, Painel, Pendencias, SituacaoDoServico } from "../../src/paineis/tipos";

function digitos(t: string): number[] {
  return [...t].map((c) => c.charCodeAt(0) - 48);
}
function dv(base: number[]): number {
  const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const resto = base.reduce((s, d, i) => s + d * pesos[i]!, 0) % 11;
  return resto < 2 ? 0 : 11 - resto;
}
/** CNPJ de 14 dígitos com a mesma base de 12 e o último dígito errado de propósito. */
export function cnpjFicticio(base8: string, filial = "0001"): string {
  const d = digitos(`${base8}${filial}`);
  const d1 = dv(d);
  const d2 = dv([...d, d1]);
  return `${base8}${filial}${d1}${(d2 + 1) % 10}`;
}
/** CPF de 11 dígitos com o último dígito errado de propósito. */
export function cpfFicticio(base9: string): string {
  const dvCpf = (b: number[]) => {
    const r = (b.reduce((s, d, i) => s + d * (b.length + 1 - i), 0) * 10) % 11;
    return r === 10 ? 0 : r;
  };
  const d = digitos(base9);
  const d1 = dvCpf(d);
  const d2 = dvCpf([...d, d1]);
  return `${base9}${d1}${(d2 + 1) % 10}`;
}

export const CNPJ_A = cnpjFicticio("11111111");
export const CNPJ_B = cnpjFicticio("22222222");
export const CPF_C = cpfFicticio("123456789");

const sem = (o: Partial<SituacaoDoServico> = {}): SituacaoDoServico => ({
  estado: "sem_consulta",
  emAndamento: false,
  ultimaConcluidaEm: null,
  diasSemConsulta: null,
  desatualizado: false,
  falha: null,
  atualizacao: null,
  recusados: null,
  ...o,
});
const comDados = (o: Partial<SituacaoDoServico> = {}): SituacaoDoServico =>
  sem({
    estado: "com_dados",
    ultimaConcluidaEm: "2026-11-26T15:05:00.000Z",
    diasSemConsulta: 1,
    atualizacao: { de: "2026-11-01", ate: "2026-11-21" },
    ...o,
  });

const TOTAIS = { apurado: "10000.00", aApropriar: "4000.00", apropriado: "3000.00", utilizado: "2500.00", saldoCredor: "0.00" };

export const CREDITOS: Extract<BlocoDeCreditos, { semNotasNoRecorte: false }> = {
  semNotasNoRecorte: false,
  quantidadeNotas: 896,
  quantidadeComAApropriar: 887,
  totais: TOTAIS,
  outros: [],
  pendentes: {
    emitentes: [
      { grupo: CNPJ_A, documento: "cnpj", quantidade: 3, total: "1500.00" },
      { grupo: CNPJ_B, documento: "cnpj", quantidade: 2, total: "1000.00" },
      { grupo: CPF_C, documento: "cpf", quantidade: 1, total: "500.00" },
    ],
    demais: { emitentes: 120, quantidade: 400, total: "600.00" },
    naoIdentificado: { quantidade: 132, total: "300.00" },
    propriaEmpresa: { quantidade: 1, total: "100.00" },
    negativos: null,
    percentualNaoIdentificado: "7.5",
  },
  porPeriodo: [
    { periodo: "2026-10", totais: { apurado: "4000.00", aApropriar: "1500.00", apropriado: "1000.00", utilizado: "1000.00", saldoCredor: "0.00" } },
    { periodo: "2026-11", totais: { apurado: "6000.00", aApropriar: "2500.00", apropriado: "2000.00", utilizado: "1500.00", saldoCredor: "0.00" } },
  ],
  origens: [],
};

export const DEBITOS: Extract<BlocoDeDebitos, { semNotasNoRecorte: false }> = {
  semNotasNoRecorte: false,
  quantidadeNotas: 300,
  totais: { apurado: "8000.00", extinto: "3000.00", saldoDevedor: "5000.00" },
  origens: [],
};

const RECORTE = { periodo: null, periodos: ["2026-10", "2026-11"] };

export const painelCompleto: Painel = {
  recorte: RECORTE,
  situacao: { creditos: comDados(), debitos: comDados() },
  creditos: CREDITOS,
  debitos: DEBITOS,
};

export const painelSemConsulta: Painel = {
  recorte: { periodo: null, periodos: [] },
  situacao: { creditos: sem(), debitos: sem() },
  creditos: null,
  debitos: null,
};

export const painelEmAndamento: Painel = { ...painelSemConsulta, situacao: { creditos: sem({ emAndamento: true }), debitos: sem() } };

export const painelVazio: Painel = {
  recorte: { periodo: null, periodos: [] },
  situacao: {
    creditos: sem({ estado: "vazio", ultimaConcluidaEm: "2026-11-26T15:05:00.000Z", diasSemConsulta: 1 }),
    debitos: sem({ estado: "vazio", ultimaConcluidaEm: "2026-11-26T15:05:00.000Z", diasSemConsulta: 1 }),
  },
  creditos: null,
  debitos: null,
};

export const painelParcial: Painel = {
  recorte: RECORTE,
  situacao: { creditos: comDados(), debitos: sem({ falha: { em: "2026-11-27T12:00:00.000Z", tipo: "outra" } }) },
  creditos: CREDITOS,
  debitos: null,
};

export const painelFalhaComAnteriores: Painel = {
  recorte: RECORTE,
  situacao: {
    creditos: comDados({ ultimaConcluidaEm: "2026-11-24T15:05:00.000Z", diasSemConsulta: 3, falha: { em: "2026-11-27T13:00:00.000Z", tipo: "credencial" } }),
    debitos: comDados({ ultimaConcluidaEm: "2026-11-24T15:05:00.000Z", diasSemConsulta: 3 }),
  },
  creditos: CREDITOS,
  debitos: DEBITOS,
};

export const painelDesatualizado: Painel = {
  recorte: RECORTE,
  situacao: {
    creditos: comDados({ ultimaConcluidaEm: "2026-11-18T15:05:00.000Z", diasSemConsulta: 9, desatualizado: true }),
    debitos: comDados({ ultimaConcluidaEm: "2026-11-18T15:05:00.000Z", diasSemConsulta: 9, desatualizado: true }),
  },
  creditos: CREDITOS,
  debitos: DEBITOS,
};

export const painelRecusado: Painel = {
  recorte: RECORTE,
  situacao: { creditos: comDados({ recusados: { quantidade: 2, ultimoEm: "2026-11-26T12:00:00.000Z" } }), debitos: comDados() },
  creditos: CREDITOS,
  debitos: DEBITOS,
};

export const painelSoRecusado: Painel = {
  recorte: { periodo: null, periodos: [] },
  situacao: {
    creditos: sem({ estado: "sem_dados_usaveis", ultimaConcluidaEm: "2026-11-26T15:05:00.000Z", diasSemConsulta: 1, recusados: { quantidade: 1, ultimoEm: "2026-11-26T15:05:00.000Z" } }),
    debitos: sem(),
  },
  creditos: null,
  debitos: null,
};

export const painelOutrosValores: Painel = {
  recorte: RECORTE,
  situacao: { creditos: comDados(), debitos: comDados() },
  creditos: {
    ...CREDITOS,
    outros: [
      { campo: "suspenso", valor: "1000.00" },
      { campo: "prescrito", valor: "550.00" },
      { campo: "pedidoRessarcimento", valor: "300.00" },
    ],
    pendentes: { ...CREDITOS.pendentes, negativos: { quantidade: 1, total: "-155.00" } },
    origens: [
      { codigo: 20, nome: "DEVOLUCAO_POR_PCONT", quantidade: 1 },
      { codigo: 30, nome: "CANCELAMENTO_CREDITO", quantidade: 2 },
    ],
  },
  debitos: DEBITOS,
};

/** Período escolhido sem nota nos créditos e nos débitos. */
export const painelSemNotasNoPeriodo: Painel = {
  recorte: { periodo: "2026-05", periodos: ["2026-05", "2026-10", "2026-11"] },
  situacao: { creditos: comDados(), debitos: comDados() },
  creditos: { semNotasNoRecorte: true },
  debitos: { semNotasNoRecorte: true },
};

export const GRUPOS: GrupoDePendencia[] = [
  { grupo: CNPJ_A, tipo: "emitente", documento: "cnpj", quantidade: 3, total: "1500.00" },
  { grupo: CNPJ_B, tipo: "emitente", documento: "cnpj", quantidade: 2, total: "1000.00" },
  { grupo: CPF_C, tipo: "emitente", documento: "cpf", quantidade: 1, total: "500.00" },
  { grupo: "nao-identificado", tipo: "nao_identificado", quantidade: 132, total: "300.00" },
  { grupo: "propria-empresa", tipo: "propria_empresa", quantidade: 1, total: "100.00" },
];

export const pendenciasCompletas: Pendencias = {
  recorte: RECORTE,
  situacao: { creditos: comDados() },
  grupos: GRUPOS,
  totalAApropriar: "4000.00",
  percentualNaoIdentificado: "7.5",
};

export const notasDoGrupo: NotasDoGrupo = {
  grupo: "nao-identificado",
  quantidade: 132,
  total: "300.00",
  pagina: 1,
  paginas: 2,
  notas: [
    { periodo: "2026-11", chave: "1".repeat(50), documento: 91, documentoNome: "NFS-e", emissao: "2026-11-05", aApropriar: "120.00" },
    { periodo: "2026-10", chave: "2".repeat(50), documento: 91, documentoNome: "NFS-e", emissao: "2026-10-20", aApropriar: "80.50" },
  ],
};
