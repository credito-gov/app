# 029-poc-api-apuracao-cbs — Prova de conceito da API de apuração da CBS

- **Status:** us-em-revisão
- **Branch:** `feat/029-poc-api-apuracao-cbs`
- **Worktree:** `.claude/worktrees/029-poc-api-apuracao-cbs`
- **Solicitante / data:** responsável pelo produto, 2026-11-23

## História

Como responsável pelo CreditoGov, representante de um CNPJ no portal `consumo.tributos.gov.br`, quero rodar um comando que busca os créditos de CBS da minha empresa direto nas APIs de apuração da Receita Federal e mostra o que está a apropriar e o que já foi apropriado, por nota e por período, para confirmar na prática que essa fonte sustenta o produto e responder as dúvidas que a documentação deixa em aberto.

## Contexto

O produto mostra o crédito de CBS como caixa (`PROJECT_CONTEXT.md` §1). Ler XML de nota não diferencia o produto: "isso qualquer sistema faz". O diferencial é ler a visão oficial da Receita, que diz o que já pode ser usado e o que ainda está pendente.

A H1 foi confirmada no papel em 2026-11-23: a Receita publica as APIs de apuração da CBS ([`../../referencias/apuracao-cbs/README.md`](../../referencias/apuracao-cbs/README.md)). Ninguém as chamou ainda. Várias dúvidas só se resolvem com uma chamada real (ver [`../../produto/hipoteses.md`](../../produto/hipoteses.md), H1).

Esta é a primeira aplicação de backend do repositório. As tasks 001–005 e `docs/historico/` descrevem outra API e outras tabelas e não valem como especificação.

Restrições conhecidas da API, pela referência:

- Consulta assíncrona: abre a solicitação, acompanha a situação, pede a `urlAssinada` e baixa o arquivo JSON. O processamento pode levar até 240 minutos; depois disso a situação vira `EXPIRADA`. O arquivo fica disponível por 48 horas.
- Consulta incremental: cada chamada devolve só o que mudou desde a última solicitação concluída, limitado aos últimos 8 dias. Não há como pedir histórico. O que não for guardado se perde.
- Quatro chamadas por API e por credencial ("por dia", segundo a FAQ; o guia não diz o período).
- A documentação está em beta, com quatro versões entre setembro e novembro de 2026.

### Decisões já tomadas pelo responsável

1. **Stack:** Node.js com TypeScript. A aplicação fica em `app/<nome>`; o nome é definido na Spec (sugestão: `app/apuracao-cbs`).
2. **Ambiente:** produção restrita (ambiente de testes da Receita). Só chamadas de leitura.
3. **Fonte:** APIs de apuração da CBS da Receita Federal, não a Plataforma de Split Payment.
4. **Espera sem aviso:** a solicitação é acompanhada pela consulta de situação, sem `urlRetorno` (não há endereço público nosso).
5. **Credencial:** é do próprio responsável, gerada em "Chaves Secretas" no portal. Ele mesmo grava os valores no `.env` local; nenhum agente pede ou recebe o segredo.

### Bloqueio conhecido

O endereço do serviço de token e a URL da produção restrita não estão na documentação pública. Estão no manual de credenciais "Receita Integra", que só abre com login no portal `consumo.tributos.gov.br` (link "Manuais"). Até o responsável trazer o manual ou o trecho sobre token e ambientes, a implementação avança com dados fictícios montados a partir dos schemas oficiais (`https://docs.receitafederal.gov.br/apuracao-cbs/schemas/`), e a chamada real fica para o último passo. Nenhum endereço é inventado.

## Critérios de aceite

### Ciclo da consulta de créditos

- **CA-1:** Com o `.env` preenchido, um único comando documentado faz o ciclo completo de uma consulta de créditos na produção restrita: obtém o token (OAuth2 Client Credentials), abre a solicitação de créditos para o CNPJ base de 8 dígitos sem `urlRetorno`, acompanha a situação até `CONCLUIDA`, obtém a `urlAssinada`, baixa o arquivo e mostra o resumo do CA-7.
- **CA-2:** Durante a espera, o comando mostra o tiquete, a estimativa de tempo devolvida na abertura e cada mudança de situação. O intervalo entre consultas de situação é configurável e respeita o limite de chamadas.
- **CA-3:** Se o comando for interrompido ou o processamento demorar, é possível retomar o acompanhamento a partir do tiquete já aberto, sem abrir nova solicitação de créditos.
- **CA-4:** Situação `ERRO` ou `EXPIRADA`, token recusado, resposta de erro da API ou `urlAssinada` vencida encerram o comando com mensagem clara do que aconteceu e do que fazer, sem expor credencial ou token e sem abrir nova solicitação por conta própria.

### Arquivo e leitura

- **CA-5:** O arquivo baixado é guardado sem alteração, com data, serviço e tiquete identificáveis, numa pasta local ignorada pelo git, antes de qualquer leitura. Um arquivo já guardado pode ser lido de novo pelo comando sem chamar a API.
- **CA-6:** O arquivo é validado contra o schema oficial de retorno de créditos, numa cópia versionada com a versão e a data de leitura registradas. Arquivo que não passa na validação não é resumido como se estivesse correto: o comando mostra o que divergiu e mantém o arquivo guardado.
- **CA-7:** O resumo mostra, por documento fiscal (chave, tipo, origem, período de apuração), os valores de `apropriacao.aApropriar` e `apropriacao.apropriado`, e os totais de `aApropriar` e `apropriado` por período de apuração. Os demais valores do arquivo ficam guardados no bruto; o resumo não os interpreta.
- **CA-8:** Valores monetários são lidos e somados em decimal de precisão fixa, nunca em ponto flutuante. A soma de uma lista de valores fictícios com casas decimais bate com o total esperado ao centavo.
- **CA-9:** O resumo não chama crédito `aApropriar` de disponível; os rótulos seguem a documentação ("a apropriar", "apropriado") até a PoC dizer o que significam na prática.
- **CA-10:** Arquivo sem créditos (nada mudou no período) é tratado como resultado válido, com mensagem dizendo que a API não devolveu alterações.

### Recolhimentos (depende da P-1)

- **CA-11:** Se a P-1 for aprovada como recomendado, o mesmo comando, com opção explícita, faz o ciclo de uma consulta de recolhimentos, guarda o arquivo bruto, valida contra o schema oficial de recolhimento e mostra, por item, `niFornecedor`, `chaveDFE`, período e total.

### Segurança

- **CA-12:** Client id, segredo e token nunca aparecem em código, commit, log, saída do comando, teste, documento ou PR. A aplicação lê esses valores de um `.env` local ignorado pelo git; o repositório tem só um `.env.example` com os nomes das variáveis, sem valores.
- **CA-13:** O endereço do token e a URL base do ambiente vêm da configuração. Nenhum endereço que não esteja em documentação oficial é escrito no código ou nos documentos.
- **CA-14:** Nenhum CNPJ real e nenhum dado fiscal real em código, teste, exemplo ou documentação. Arquivos de exemplo versionados são fictícios e montados a partir dos schemas oficiais.
- **CA-15:** A aplicação só faz chamadas de leitura: token, abertura de consulta, situação e download. Não existe código para `/rad`, `/pcont` ou qualquer outro serviço que gere guia ou altere dados.

### Testes e documentação

- **CA-16:** Testes automatizados, escritos antes do código a partir destes CA, cobrem o cliente da API (token, abertura, situação, download, erros, retomada por tiquete) com respostas simuladas e a leitura do arquivo (validação, resumo, totais, decimal, arquivo vazio) com dados fictícios. Nenhum teste automatizado chama a API real; a chamada real é manual e explícita.
- **CA-17:** O comando de teste da aplicação nova e o comando da consulta real estão registrados no `AGENTS.md` e no README da aplicação, com o passo a passo para gerar a credencial e preencher o `.env`.
- **CA-18:** Lint, build e testes da aplicação nova passam.

### Respostas da prova de conceito

- **CA-19:** Depois da chamada real, `docs/referencias/apuracao-cbs/README.md` e a H1 em `docs/produto/hipoteses.md` registram, com data e sem dados reais: endereço e validade do token (endereço só se constar do manual oficial); URL da produção restrita; tempo real de processamento observado; se a consulta de situação e o download contam no limite de chamadas e qual o limite observado; o que um crédito `aApropriar` significou nos dados obtidos e se foi possível ligá-lo ao pagamento do fornecedor; se a chave da nota bastou para identificar o fornecedor; e a situação de cada divergência listada na referência (confirmada, resolvida ou não testada). O que a PoC não conseguir responder fica registrado como não respondido, com o motivo.
- **CA-20:** A versão de cada página oficial usada na implementação é conferida e a tabela "Fontes" da referência é atualizada.

## Fora de escopo

- Geração de DARF (`/rad`, `/pcont`) e qualquer chamada que não seja de leitura.
- Débitos e pagamentos (salvo decisão diferente na P-1).
- Aviso por `urlRetorno` e qualquer endereço público.
- Painel, login, banco de dados, multi-cliente, agendamento automático da consulta.
- IBS.
- Produção (beta); só produção restrita.
- Hospedagem, CI e publicação.
- Cálculo de crédito ou interpretação tributária além dos rótulos da documentação.

## Perguntas em aberto

- **P-1 (escopo):** além de créditos, quais consultas entram? Recomendação: créditos e recolhimentos. Recolhimentos trazem `niFornecedor` e `chaveDFE` e são o único jeito de testar se a chave da nota basta para achar o fornecedor e se dá para ligar crédito a pagamento; o cliente da API é o mesmo, então o custo extra é a leitura de mais um schema. Pagamentos e débitos ficam para depois: não mudam as respostas da PoC.
- **P-2 (bloqueio):** o responsável consegue trazer o manual de credenciais "Receita Integra" (PDF ou o trecho sobre token e ambientes, nunca a credencial)? Recomendação: trazer antes da Spec, para que ela já fixe as variáveis de ambiente; se não der, a Spec segue com os endereços como configuração obrigatória e a chamada real espera o manual.
- **P-3 (dados na produção restrita):** a produção restrita devolve dados da empresa ou dados de teste? Se vier vazia, a PoC não responde o significado de `aApropriar`. Recomendação: aceitar a PoC com o ciclo técnico comprovado na produção restrita e registrar as perguntas de dados como não respondidas; uma consulta em produção (beta) seria demanda nova, decidida depois.
- **P-4 (credencial):** a credencial de "Chaves Secretas" já foi gerada na versão 2.0 (depois de 28/10/2026), para o estabelecimento matriz e com o serviço "Apuração Assistida e Devolução de CBS — Produção Restrita" marcado? Recomendação: conferir antes da chamada real; chaves anteriores à 2.0 precisam ser refeitas, segundo a referência.
- **P-5 (dados reais na saída):** o resumo mostra chaves de notas reais no terminal do responsável. Pode? Recomendação: sim, só no terminal local e nos arquivos da pasta ignorada; nada disso vai para documento ou PR (CA-14, CA-19).
