// Formas das respostas da API do dashboard (Contratos da Spec da 033). Valores em texto decimal.

import type { Papel } from "../api/cliente";

export type EstadoDoServico = "sem_consulta" | "sem_dados_usaveis" | "vazio" | "com_dados";

export type SituacaoDoServico = {
  estado: EstadoDoServico;
  emAndamento: boolean;
  ultimaConcluidaEm: string | null;
  diasSemConsulta: number | null;
  desatualizado: boolean;
  falha: { em: string; tipo: "credencial" | "outra" } | null;
  atualizacao: { de: string; ate: string } | null;
  recusados: { quantidade: number; ultimoEm: string } | null;
};

export type TotaisDeCredito = {
  apurado: string;
  aApropriar: string;
  apropriado: string;
  utilizado: string;
  saldoCredor: string;
};

export type Origem = { codigo: number; nome: string; quantidade: number };

export type Pendentes = {
  emitentes: Array<{ grupo: string; documento: "cnpj" | "cpf"; quantidade: number; total: string }>;
  demais: { emitentes: number; quantidade: number; total: string } | null;
  naoIdentificado: { quantidade: number; total: string };
  propriaEmpresa: { quantidade: number; total: string };
  negativos: { quantidade: number; total: string } | null;
  percentualNaoIdentificado: string | null;
};

export type BlocoDeCreditos =
  | { semNotasNoRecorte: true }
  | {
      semNotasNoRecorte: false;
      quantidadeNotas: number;
      quantidadeComAApropriar: number;
      totais: TotaisDeCredito;
      outros: Array<{ campo: string; valor: string }>;
      pendentes: Pendentes;
      porPeriodo: Array<{ periodo: string; totais: TotaisDeCredito }>;
      origens: Origem[];
    };

export type BlocoDeDebitos =
  | { semNotasNoRecorte: true }
  | {
      semNotasNoRecorte: false;
      quantidadeNotas: number;
      totais: { apurado: string; extinto: string; saldoDevedor: string };
      origens: Origem[];
    };

export type Recorte = { periodo: string | null; periodos: string[] };

export type Painel = {
  recorte: Recorte;
  situacao: { creditos: SituacaoDoServico; debitos: SituacaoDoServico };
  creditos: BlocoDeCreditos | null;
  debitos: BlocoDeDebitos | null;
};

export type GrupoDePendencia = {
  grupo: string;
  tipo: "emitente" | "propria_empresa" | "nao_identificado" | "negativos";
  documento?: "cnpj" | "cpf";
  quantidade: number;
  total: string;
};

export type Pendencias = {
  recorte: Recorte;
  situacao: { creditos: SituacaoDoServico };
  grupos: GrupoDePendencia[] | null;
  totalAApropriar: string | null;
  percentualNaoIdentificado: string | null;
};

export type NotasDoGrupo = {
  grupo: string;
  quantidade: number;
  total: string;
  pagina: number;
  paginas: number;
  notas: Array<{ periodo: string; chave: string; documento: number; documentoNome: string; emissao: string | null; aApropriar: string }>;
};

export type ResumoDaSituacao = "atualizado" | "falhou" | "desatualizado" | "sem_consulta";

export type LinhaDaCarteira = {
  id: string;
  nome: string;
  cnpjRaizFormatado: string;
  papel: Papel;
  creditos: { estado: EstadoDoServico; aApropriar: string | null; apropriado: string | null; utilizado: string | null };
  situacao: { resumo: ResumoDaSituacao; ultimaConcluidaEm: string | null; diasSemConsulta: number | null };
};

/** Uma linha por empresa; a resposta não tem campo de total (CA-C4). */
export type Carteira = { empresas: LinhaDaCarteira[] };
