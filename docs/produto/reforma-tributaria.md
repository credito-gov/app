# Reforma tributária — o que sabemos

Referência de domínio para o produto. Cada item diz de onde veio. Nada aqui substitui a validação de um tributarista, que ainda não foi feita.

## Confirmado nos manuais do repositório

Fonte: [`../referencias/split-payment/`](../referencias/split-payment/README.md).

- O crédito é do **adquirente**, pessoa jurídica no regime regular de CBS/IBS, sobre as compras que faz.
- O crédito exige duas coisas: CBS/IBS destacado no documento fiscal e **extinção do débito do fornecedor**.
- O débito pode ser extinto por split payment, por recolhimento pelo adquirente ou por outras modalidades.
- O split payment, na Fase 1, é opcional para quem origina a transação e vale só entre pessoas jurídicas.
- O vínculo entre pagamento e documento fiscal é o que permite ao governo conciliar o valor segregado e liberar o crédito.

## Conhecimento geral, a confirmar com tributarista

Fonte: Emenda Constitucional 132/2023 e Lei Complementar 214/2025, de memória. Conferir no texto da lei antes de usar em material público.

| Período | O que acontece |
|---|---|
| 2026 | Ano de teste: CBS a 0,9% e IBS a 0,1%, com compensação contra PIS/Cofins |
| 2027 | CBS passa a valer de fato; PIS e Cofins são extintos. IBS segue em alíquota de teste |
| 2029 a 2032 | ICMS e ISS diminuem gradualmente e o IBS aumenta na mesma proporção |
| 2033 | ICMS e ISS extintos; IBS integral |

- **0,9% e 0,1% são alíquotas de teste**, não as definitivas. A alíquota de referência somada de CBS e IBS ainda depende de definição; as estimativas públicas ficam acima de 26%.
- **Fornecedor no Simples Nacional ou MEI:** o crédito do adquirente tende a ser limitado ao que o fornecedor efetivamente recolhe dentro do regime, salvo opção dele pelo regime regular. A regra exata precisa ser confirmada.

## Erros dos documentos antigos

Os documentos em [`../historico/`](../historico/README.md) e parte das tasks antigas trazem afirmações que não devem ser repetidas:

- "A reforma entra em vigor em jan/2027" e "IBS substitui ICMS e ISS a partir de jan/2027". Em 2027 começa a CBS; a troca do ICMS/ISS pelo IBS vai até 2033.
- "CBS 0,9% e IBS 0,1% na compra" como se fossem as alíquotas do imposto.
- "Split Payment em abr/2027: governo valida o crédito automaticamente". Não há essa data nem essa garantia nos manuais.
- "Crédito fica disponível 30 dias após a emissão", "crédito de CBS/IBS compensa débito de ICMS antigo", "crédito prescreve" com prazos. Nenhuma tem fonte.
- "Diagnóstico retroativo de 60 meses" (texto da landing). O CBS/IBS não tem 60 meses de histórico.

## Perguntas para o tributarista

1. Onde e como a empresa consulta hoje o crédito de CBS/IBS confirmado e o pendente? Há acesso por terceiro autorizado?
2. Em que momento o crédito passa a poder ser usado: no pagamento, no fim do período de apuração, em outro marco?
3. O saldo credor pode ser ressarcido em dinheiro? Em que prazo?
4. O crédito pode ser cedido ou dado em garantia a um terceiro (base para a antecipação)?
5. Como fica o crédito em compras de fornecedor do Simples Nacional e de MEI?
6. O que acontece com o crédito quando o fornecedor não paga o imposto e não houve split?
