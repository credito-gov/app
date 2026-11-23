# Hipóteses e decisões em aberto

O que o projeto assume e ainda não confirmou. Quando uma hipótese for resolvida, registre aqui a conclusão, a data e a fonte, e atualize o [`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md).

Estados: **aberta**, **confirmada**, **derrubada**.

## H1 — Fonte de dados dos créditos (aberta, bloqueia o backend)

**O que se assumiu:** uma API da Receita Federal entrega, por CNPJ, os créditos e débitos apurados.

**O que se sabe:** os manuais do Split Payment não têm essa API. A plataforma descrita é entre PSPs e governo. Ver [`../referencias/split-payment/README.md`](../referencias/split-payment/README.md).

**Alternativas a investigar:**

| Alternativa | O que entrega | O que falta descobrir |
|---|---|---|
| Portal ou serviço do governo para o contribuinte (apuração de CBS/IBS) | Crédito confirmado e pendente, na visão oficial | Se existe acesso automatizado e por terceiro autorizado; como se autentica |
| Notas fiscais de compra (XML de NF-e/NFS-e) | Crédito destacado em cada compra, com fornecedor e data | Não diz se o fornecedor recolheu. Só cobre o lado "pendente" |
| ERP da empresa (API ou exportação) | Compras, pagamentos e apuração que o ERP já fez | Varia por ERP; depende do que cada um expõe |
| Extrato do banco/PSP da empresa | Pagamentos feitos com split | Só cobre o que passou por split |

**Como resolver:** tributarista (perguntas em [`reforma-tributaria.md`](reforma-tributaria.md)) e leitura da regulamentação da apuração de CBS/IBS.

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

**O que se sabe:** números da concepção, sem teste. A landing antiga chegou a propor outro modelo (mensalidade mais taxa de sucesso) e a landing, desde a demanda 028, diz que o preço será definido antes do lançamento.

**Como resolver:** definir na conversa com os primeiros escritórios.

## H5 — Tamanho do mercado e projeções (aberta)

**O que se assumiu:** 1,5 milhão de empresas na faixa-alvo, 3 a 4 mil clientes no primeiro ano, receita de R$ 1,2 a 1,8 milhão.

**O que se sabe:** não há fonte para nenhum desses números. Não usar em material externo.

## Outras decisões em aberto

- **Vários CNPJs por cliente:** cadastros separados ou agrupados?
- **Papel do contador no sistema:** tem acesso próprio à carteira dele?
- **Stack do backend e hospedagem:** proposta na concepção, a confirmar na primeira demanda de backend.
- **Domínio próprio da landing:** hoje está em `credito-gov.vercel.app`.
