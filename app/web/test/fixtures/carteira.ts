// Resposta fictícia de GET /api/carteira, escrita à mão a partir de "Contratos" da Spec da 033.
// Cinco empresas, uma em cada resumo da situação. Nomes e raízes inventados; valores redondos.
import type { Carteira, LinhaDaCarteira } from "../../src/paineis/tipos";

const ids = (n: number) => `${String(n).repeat(8)}-${String(n).repeat(4)}-4${String(n).repeat(3)}-8${String(n).repeat(3)}-${String(n).repeat(12)}`;

const vazio = { aApropriar: null, apropriado: null, utilizado: null };

export const LINHA_ATUALIZADA: LinhaDaCarteira = {
  id: ids(5),
  nome: "Alfa Exemplo Ltda.",
  cnpjRaizFormatado: "31.000.001",
  papel: "contador",
  creditos: { estado: "com_dados", aApropriar: "4000.00", apropriado: "3000.00", utilizado: "2500.00" },
  situacao: { resumo: "atualizado", ultimaConcluidaEm: "2026-11-26T15:05:00.000Z", diasSemConsulta: 1 },
};

export const LINHA_FALHOU: LinhaDaCarteira = {
  id: ids(6),
  nome: "Beta Exemplo S.A.",
  cnpjRaizFormatado: "31.000.002",
  papel: "colaborador",
  creditos: { estado: "com_dados", aApropriar: "9000.00", apropriado: "7000.00", utilizado: "100.00" },
  situacao: { resumo: "falhou", ultimaConcluidaEm: "2026-11-24T12:00:00.000Z", diasSemConsulta: 3 },
};

export const LINHA_DESATUALIZADA: LinhaDaCarteira = {
  id: ids(7),
  nome: "Gama Exemplo Ltda.",
  cnpjRaizFormatado: "31.000.003",
  papel: "titular",
  creditos: { estado: "com_dados", aApropriar: "1500.50", apropriado: "800.00", utilizado: "0.00" },
  situacao: { resumo: "desatualizado", ultimaConcluidaEm: "2026-11-18T12:00:00.000Z", diasSemConsulta: 9 },
};

export const LINHA_SEM_CONSULTA: LinhaDaCarteira = {
  id: ids(8),
  nome: "Delta Exemplo Ltda.",
  cnpjRaizFormatado: "31.000.004",
  papel: "titular",
  creditos: { estado: "sem_consulta", ...vazio },
  situacao: { resumo: "sem_consulta", ultimaConcluidaEm: null, diasSemConsulta: null },
};

export const LINHA_VAZIA: LinhaDaCarteira = {
  id: ids(9),
  nome: "Épsilon Exemplo Ltda.",
  cnpjRaizFormatado: "31.000.005",
  papel: "colaborador",
  creditos: { estado: "vazio", ...vazio },
  situacao: { resumo: "atualizado", ultimaConcluidaEm: "2026-11-25T12:00:00.000Z", diasSemConsulta: 2 },
};

/** Fora da ordem alfabética de propósito: quem ordena é a tela. */
export const carteira: Carteira = {
  empresas: [LINHA_DESATUALIZADA, LINHA_VAZIA, LINHA_ATUALIZADA, LINHA_SEM_CONSULTA, LINHA_FALHOU],
};
