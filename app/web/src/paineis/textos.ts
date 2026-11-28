// Todos os textos fixos do dashboard e da carteira (CA-2, CA-4, CA-14 a CA-22, CA-C4).
// Valem os do artboard aprovado quando a sessão principal os transcrever (P-S3). Até lá, valem estes,
// tirados da US e do design system. Nenhum texto promete crédito nem diz o motivo de uma pendência.

export const TEXTOS = {
  titulo: "Visão geral",
  creditos: "Créditos de CBS",
  debitos: "Débitos de CBS (vendas)",
  todosOsPeriodos: "Todos os períodos coletados",
  periodo: "Período",

  // Cartões de crédito (I-1 a I-5)
  apurado: { rotulo: "Crédito apurado nas compras", campo: "apurado", nota: "Total registrado pela Receita nas notas de compra. Os valores abaixo vêm de campos separados e não se somam." },
  aApropriar: { rotulo: "A apropriar (pendente)", campo: "aApropriar", nota: "Ainda não liberado pela Receita. Ela informa o valor sem dizer o motivo." },
  apropriado: { rotulo: "Apropriado", campo: "apropriado", nota: "Liberado pela Receita. Parte ou todo pode já ter sido usado." },
  utilizado: { rotulo: "Já utilizado", campo: "utilizado", nota: "Já abateu débito de CBS da empresa." },
  saldoCredor: { rotulo: "Saldo credor não utilizado", campo: "saldoCredor", nota: "Valor que a Receita informa como saldo credor não utilizado. O significado prático está em análise." },

  // Outros valores (I-6)
  outros: "Outros valores do crédito",
  outrosNota: "Valor que a Receita informa neste campo. O significado prático está em análise.",
  rotulosDeOutros: {
    suspenso: "Suspenso",
    inapropriavel: "Inapropriável",
    prescrito: "Prescrito",
    restabelecido: "Restabelecido",
    inutilizavel: "Inutilizável",
    pedidoRessarcimento: "Pedido de ressarcimento",
    excedente: "Excedente",
  } as Record<string, string>,

  // Pendente por emitente (I-7)
  pendentePorEmitente: "Pendente por emitente",
  demais: (n: number) => `Demais emitentes (${n})`,
  propriaEmpresa: "Emitida pela própria empresa",
  naoIdentificado: "Emitente não identificado",
  negativos: "Notas com valor a apropriar negativo",
  cpfDoEmitente: "CPF do emitente",
  verTodos: "Ver todos os emitentes",
  percentual: (p: string) =>
    `${p} do valor a apropriar está em notas de emitente não identificado, como as NFS-e, cuja chave não traz o emitente num leiaute conhecido.`,
  comAApropriar: (n: number, m: number) => `${n} de ${m} notas com valor a apropriar`,
  notas: (n: number) => (n === 1 ? "1 nota" : `${n} notas`),

  // Evolução (I-8)
  evolucao: "Evolução por período",
  total: "Total",

  // Débitos (I-9)
  debitoApurado: { rotulo: "Débito apurado", campo: "apurado" },
  jaExtinto: { rotulo: "Já extinto", campo: "extinto" },
  emAberto: { rotulo: "Em aberto", campo: "saldoDevedor" },
  notaDebitos: "Imposto das vendas registrado pela Receita. O CreditoGov não calcula saldo líquido entre crédito e débito nesta versão.",

  // Avisos
  soCbs: "Só CBS. Os dados vêm da API de apuração da CBS da Receita Federal; o IBS ainda não está nessa fonte.",
  origens: (itens: string) => `Há notas com origem diferente de normal neste recorte. Os valores entram nos totais como a Receita informou: ${itens}.`,
  // Situação dos dados (CA-14 a CA-20)
  fraseDasConsultas:
    "Os números são os das consultas feitas pelo CreditoGov à API de apuração da CBS da Receita Federal. A Receita não fornece histórico anterior a essas consultas.",
  ultimaConsulta: (servico: string, instante: string, de: string | null, ate: string | null) =>
    `${servico}: última consulta concluída em ${instante}.${de !== null && ate !== null ? ` Notas atualizadas de ${de} a ${ate}.` : ""}`,
  desatualizado: (servico: string, dias: number) =>
    `${servico} sem consulta concluída há ${dias} dias. Cada consulta à Receita só devolve as alterações dos últimos 8 dias, então pode haver alteração que não foi recebida.`,
  aindaNaoConsultados: (plural: string) => `Os ${plural} ainda não foram consultados na Receita.`,
  emAndamento: "Há uma consulta em andamento.",
  vazio: (plural: string, instante: string) => `A Receita não devolveu ${plural} nas consultas feitas até ${instante}. Isto não é um saldo de R$ 0,00.`,
  falhou: (plural: string, instante: string) => `A atualização dos ${plural} falhou em ${instante}.`,
  falhaDeCredencial:
    "A Receita recusou a credencial de acesso da empresa. É preciso gerar uma nova no portal da Receita. Fale com a equipe CreditoGov para informá-la.",
  falhaSemCulpa: "Isso não depende de você.",
  numerosAnteriores: (instante: string) => `Os números abaixo são da consulta de ${instante} e não estão atualizados.`,
  recusados: (n: number, plural: string, data: string) =>
    `Há retornos da Receita que não entraram nos indicadores: ${n} de ${plural}, o mais recente em ${data}. Os números não incluem esses retornos.`,
  nenhumRetornoUsavel: (plural: string) => `Nenhum retorno de ${plural} pôde ser usado.`,
  semNotasCreditos: "Nenhum crédito neste período nas consultas feitas.",
  semNotasDebitos: "Nenhum débito neste período nas consultas feitas.",
} as const;
