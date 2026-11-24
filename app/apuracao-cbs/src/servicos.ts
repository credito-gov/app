/** Lista fechada das consultas. Não existe outro serviço no código. */
export interface Servico {
  nome: NomeServico;
  /** Segmento do caminho: POST {base}/{caminho}/{cnpj}. */
  caminho: string;
  /** Arquivo em schemas/oficiais/. */
  schema: string;
}

export const NOMES_SERVICOS = ["creditos", "recolhimentos", "pagamentos", "debitos"] as const;
export type NomeServico = (typeof NOMES_SERVICOS)[number];

export const SERVICOS: readonly Servico[] = [
  { nome: "creditos", caminho: "creditos", schema: "credito-retorno.schema.json" },
  { nome: "recolhimentos", caminho: "recolhimentos", schema: "recolhimento-retorno.schema.json" },
  { nome: "pagamentos", caminho: "pagamentos", schema: "pagamento-retorno.schema.json" },
  { nome: "debitos", caminho: "debitos", schema: "debito-retorno.schema.json" },
];

export function buscarServico(nome: string): Servico | undefined {
  return SERVICOS.find((s) => s.nome === nome);
}
