// Tipos do esquema, escritos à mão. Devem acompanhar as migrações.
import type { ColumnType, Generated } from "kysely";

export type Papel = "titular" | "contador" | "colaborador";
export type OrigemConvite = "equipe" | "usuario";
export type MotivoEncerramento = "saida" | "nova_senha";
export type TipoLimite = "login" | "recuperacao";

type Criado = ColumnType<Date, Date | undefined, Date>;
type Opcional<T> = ColumnType<T | null, T | null | undefined, T | null>;

export interface EmpresaTabela {
  id: Generated<string>;
  cnpj_raiz: string;
  nome: string;
  criada_em: Criado;
}

export interface UsuarioTabela {
  id: Generated<string>;
  nome: string;
  email_normalizado: string;
  criado_em: Criado;
}

export interface IdentidadeTabela {
  id: Generated<string>;
  usuario_id: string;
  provedor: "senha";
  sujeito: string;
  hash_senha: Opcional<string>;
  criada_em: Criado;
  senha_alterada_em: Opcional<Date>;
}

export interface VinculoEmpresaTabela {
  id: Generated<string>;
  empresa_id: string;
  usuario_id: string;
  papel: Papel;
  convite_id: Opcional<string>;
  criado_em: Criado;
  removido_em: Opcional<Date>;
  removido_por: Opcional<string>;
}

export interface ConviteTabela {
  id: Generated<string>;
  empresa_id: string;
  email_normalizado: string;
  papel: Papel;
  token_hmac: string;
  criado_por: Opcional<string>;
  origem: OrigemConvite;
  criado_em: Criado;
  expira_em: Date;
  usado_em: Opcional<Date>;
  aceito_por: Opcional<string>;
  invalidado_em: Opcional<Date>;
}

export interface SessaoTabela {
  id: Generated<string>;
  usuario_id: string;
  token_hmac: string;
  criada_em: Criado;
  ultimo_uso_em: Criado;
  expira_em: Date;
  encerrada_em: Opcional<Date>;
  motivo_encerramento: Opcional<MotivoEncerramento>;
}

export interface RecuperacaoSenhaTabela {
  id: Generated<string>;
  usuario_id: string;
  token_hmac: string;
  criada_em: Criado;
  expira_em: Date;
  usada_em: Opcional<Date>;
  invalidada_em: Opcional<Date>;
}

export interface FalhaAcessoTabela {
  id: Generated<string>;
  tipo: TipoLimite;
  chave_hmac: string;
  em: Date;
}

export interface BloqueioAcessoTabela {
  tipo: TipoLimite;
  chave_hmac: string;
  ate: Date;
}

export type ServicoConsulta = "creditos" | "debitos" | "recolhimentos" | "pagamentos";
export type EstadoConsulta =
  | "agendada"
  | "abrindo"
  | "aberta"
  | "concluida"
  | "baixada"
  | "lida"
  | "erro"
  | "expirada"
  | "credencial_invalida"
  | "servico_indisponivel"
  | "aberta_sem_tiquete";
export type SituacaoArquivo = "aceito" | "aceito_com_divergencia" | "recusado";
export type MotivoRecusa = "ilegivel" | "fora_do_schema" | "outra_empresa" | "valor_fora_do_limite";

/** numeric(20,2) volta do pg como texto; nulo quer dizer "não veio no arquivo". */
type Valor = ColumnType<string | null, string | null | undefined, string | null>;

export interface ConsultaTabela {
  id: Generated<string>;
  empresa_id: string;
  servico: ServicoConsulta;
  estado: EstadoConsulta;
  criada_em: Criado;
  concluida_em: Opcional<Date>;
  finalizada_em: Opcional<Date>;
}

export interface ArquivoBrutoTabela {
  id: Generated<string>;
  empresa_id: string;
  consulta_id: string;
  servico: "creditos" | "debitos";
  recebido_em: Date;
  tamanho: number;
  sha256: string;
  gerado_em: Opcional<string>;
  versao_schema: Opcional<string>;
  situacao: SituacaoArquivo;
  motivo_recusa: Opcional<MotivoRecusa>;
  versao_leitor: string;
  objeto: Opcional<string>;
}

interface NotaLida {
  id: Generated<string>;
  empresa_id: string;
  arquivo_id: string;
  pa: string;
  chave: string;
  documento: number;
  origem: number;
  emissao: Opcional<string>;
  registro: Opcional<string>;
  atualizacao: Opcional<string>;
}

export interface CreditoLidoTabela extends NotaLida {
  apurado: Valor;
  a_apropriar: Valor;
  apropriado: Valor;
  suspenso: Valor;
  inapropriavel: Valor;
  prescrito: Valor;
  utilizado: Valor;
  restabelecido: Valor;
  inutilizavel: Valor;
  saldo_credor: Valor;
  pedido_ressarcimento: Valor;
  excedente: Valor;
}

export interface DebitoLidoTabela extends NotaLida {
  apurado: Valor;
  extinto: Valor;
  saldo_devedor: Valor;
  suspenso: Valor;
  inexigivel: Valor;
  pgto_antecipado: Valor;
  excedente: Valor;
}

export interface Esquema {
  empresa: EmpresaTabela;
  usuario: UsuarioTabela;
  identidade: IdentidadeTabela;
  vinculo_empresa: VinculoEmpresaTabela;
  convite: ConviteTabela;
  sessao: SessaoTabela;
  recuperacao_senha: RecuperacaoSenhaTabela;
  falha_acesso: FalhaAcessoTabela;
  bloqueio_acesso: BloqueioAcessoTabela;
  consulta: ConsultaTabela;
  arquivo_bruto: ArquivoBrutoTabela;
  credito_lido: CreditoLidoTabela;
  debito_lido: DebitoLidoTabela;
}
