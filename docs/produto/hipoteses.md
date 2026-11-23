# Hipóteses e decisões em aberto

O que o projeto assume e ainda não confirmou. Quando uma hipótese for resolvida, registre aqui a conclusão, a data e a fonte, e atualize o [`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md).

Estados: **aberta**, **confirmada**, **derrubada**.

## H1 — Fonte de dados dos créditos (confirmada para a CBS em 2026-11-23)

**O que se assumiu:** uma API da Receita Federal entrega, por CNPJ, os créditos e débitos apurados.

**Conclusão:** existe. A Receita publica as APIs de apuração da CBS, com consulta de créditos, débitos e pagamentos por CNPJ, usando OAuth2 e credencial gerada pelo contribuinte no portal <https://consumo.tributos.gov.br/>. Cada crédito vem por documento fiscal, separado em "a apropriar" e "apropriado". Detalhes e fontes em [`../referencias/apuracao-cbs/README.md`](../referencias/apuracao-cbs/README.md).

A API não está nos manuais do Split Payment, que tratam de outra plataforma (entre PSPs e governo). A premissa da concepção estava certa na ideia; os endpoints e o funcionamento são outros.

**O que continua em aberto:**

| Ponto | Por que importa |
|---|---|
| Acesso em nome de vários clientes | A credencial é do titular do CNPJ ou de procurador digital. Não está documentado como um software consulta por muitos contribuintes. Define o cadastro de cada cliente |
| IBS | A API cobre só CBS. Não sabemos se e quando o Comitê Gestor oferecerá o equivalente |
| Fornecedor e motivo da pendência | O crédito traz a chave da nota, não o fornecedor nem o motivo de estar "a apropriar". Cruzar com a API de pagamentos (RAD) e com a chave pode resolver; a confirmar na prática |
| Limite de quatro chamadas por dia, resposta assíncrona em até 4 horas | O produto é de atualização diária, não em tempo real |
| Ambiente de teste | A URL de produção restrita não está na documentação lida |
| Serviço em beta | A documentação teve quatro versões em três meses |

**Como resolver:** prova de conceito com credencial própria, lendo as páginas que faltam; pergunta à Receita ou a quem já integra sobre o modelo de procuração.

## H2 — A empresa não enxerga o próprio crédito (aberta)

**O que se assumiu:** o empresário não sabe quanto crédito tem e isso atrapalha o caixa.

**O que se sabe:** nenhuma entrevista registrada. O governo e os ERPs podem passar a mostrar isso.

**Como resolver:** conversas com 5 a 10 empresas e 3 escritórios de contabilidade.

## H3 — Compensar e antecipar pelo painel (aberta)

**O que se assumiu:** com dois cliques a empresa compensa um débito ou antecipa o crédito com uma fintech, a 1,8% ao mês.

**O que se sabe:** compensação de créditos está fora do escopo dos manuais disponíveis. Não há parceiro, taxa, nem confirmação de que esse crédito pode ser cedido. Facile e Liber, citadas na concepção, não foram contatadas.

**Como resolver:** tributarista e advogado para a cessão; depois, conversa com parceiros financeiros.

## H4 — Preço e comissão (aberta)

**O que se assumiu:** R$ 100 por empresa por mês; 15 a 20% de comissão ao contador; cerca de 100 empresas por escritório parceiro.

**O que se sabe:** números da concepção, sem teste. A landing antiga chegou a propor outro modelo (mensalidade mais taxa de sucesso) e o redesign usa "sob consulta".

**Como resolver:** definir na conversa com os primeiros escritórios.

## H5 — Tamanho do mercado e projeções (aberta)

**O que se assumiu:** 1,5 milhão de empresas na faixa-alvo, 3 a 4 mil clientes no primeiro ano, receita de R$ 1,2 a 1,8 milhão.

**O que se sabe:** não há fonte para nenhum desses números. Não usar em material externo.

## Outras decisões em aberto

- **Vários CNPJs por cliente:** cadastros separados ou agrupados?
- **Papel do contador no sistema:** tem acesso próprio à carteira dele?
- **Stack do backend e hospedagem:** proposta na concepção, a confirmar na primeira demanda de backend.
- **Domínio próprio da landing:** hoje está em `credito-gov.vercel.app`.
