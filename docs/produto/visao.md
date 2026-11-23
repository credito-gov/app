# CreditoGov — visão de produto e negócio

Documento único de produto. Substitui o relatório executivo, o plano de negócio, o modelo de negócio e o kanban de sprints da concepção, que estão em [`../historico/`](../historico/README.md).

Aqui só entra o que está **decidido**. O que depende de validação está em [`hipoteses.md`](hipoteses.md).

## Problema

Com o CBS e o IBS, toda compra de uma empresa do regime regular gera crédito. Esse crédito só vale quando o imposto do fornecedor foi de fato recolhido. O empresário enxerga o imposto destacado na nota, mas não sabe:

- quanto de crédito já está confirmado e quanto depende de fornecedor que ainda não recolheu;
- de quais compras e de quais fornecedores vem o crédito pendente;
- como esse saldo afeta o caixa das próximas semanas.

O ERP calcula o imposto de cada nota. Ele não mostra o crédito como dinheiro a receber nem acompanha o que ficou pendente.

## Para quem

- **Usuário:** dono ou responsável financeiro de pequena e média empresa no regime regular de CBS/IBS.
- **Primeiro segmento:** comércio e varejo, que compram muito e têm caixa apertado. Indústria pequena vem depois; serviços por último.
- **Quem leva o produto ao cliente:** o contador. Um escritório de contabilidade atende dezenas de empresas e já tem a confiança delas.

## O que o produto faz

1. **Saldo de crédito**, separado em confirmado e pendente, de CBS e de IBS.
2. **Origem de cada crédito**: a compra, a nota e o fornecedor.
3. **Pendências por fornecedor**: quem ainda não recolheu e quanto isso segura de crédito.
4. **Projeção de caixa**: o que deve ser confirmado nas próximas semanas, com base nas compras já feitas.

Ficam para depois, e dependem de validação: compensar débito e antecipar crédito a partir do painel.

## O que o produto não faz

- Não calcula CBS/IBS nem emite nota. Isso é do ERP.
- Não trata PIS, Cofins, ICMS, ISS ou IPI.
- Não substitui o contador.

## Modelo de negócio

- **Receita:** assinatura mensal por empresa, cobrada direto pelo CreditoGov.
- **Canal:** parcerias com escritórios de contabilidade, com comissão recorrente por cliente ativo.
- **Mais adiante:** comissão sobre antecipação de crédito com fintech ou FIDC, a negociar quando houver base de clientes.
- **Descartado:** distribuição via Omie ou outro ERP. ERP pode vir a ser fonte de dados, não canal.

Preço, comissão, tamanho de mercado e projeções financeiras da concepção não têm fonte e estão tratados como hipóteses.

## Caminho até o produto

Sem datas, porque as da concepção já passaram e dependiam de premissas não confirmadas.

1. **Validar o domínio.** Levar as perguntas de [`reforma-tributaria.md`](reforma-tributaria.md) a um tributarista e decidir a fonte de dados.
2. **Validar o problema.** Conversar com empresas e com escritórios de contabilidade. Registrar o resultado em `hipoteses.md`.
3. **Fechar a landing.** Terminar o redesign e tirar do ar o que é placeholder ou promessa sem base.
4. **Primeira versão do painel.** Saldo, origem e pendências, com a fonte de dados escolhida.
5. **Primeiro escritório parceiro** usando com a carteira dele.

O andamento de cada passo fica no [kanban de demandas](../demandas/README.md).
