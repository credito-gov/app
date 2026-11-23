# 029-poc-api-apuracao-cbs — Prova de conceito da API de apuração da CBS

- **Status:** us-em-revisão
- **Branch:** `feat/029-poc-api-apuracao-cbs`
- **Worktree:** `.claude/worktrees/029-poc-api-apuracao-cbs`
- **Solicitante / data:** responsável pelo produto, 2026-11-23

## História

Como responsável pelo CreditoGov, representante de um CNPJ no portal `consumo.tributos.gov.br`, quero rodar um comando que busca os dados de apuração da CBS da minha empresa (créditos, recolhimentos, pagamentos e débitos) direto nas APIs da Receita Federal e mostra, entre outras coisas, o que está a apropriar e o que já foi apropriado, por nota e por período, para confirmar na prática que essa fonte sustenta o produto e responder as dúvidas que a documentação deixa em aberto.

## Contexto

O produto mostra o crédito de CBS como caixa (`PROJECT_CONTEXT.md` §1). Ler XML de nota não diferencia o produto: "isso qualquer sistema faz". O diferencial é ler a visão oficial da Receita, que diz o que já pode ser usado e o que ainda está pendente.

A H1 foi confirmada no papel em 2026-11-23: a Receita publica as APIs de apuração da CBS ([`../../referencias/apuracao-cbs/README.md`](../../referencias/apuracao-cbs/README.md)). Ninguém as chamou ainda. Várias dúvidas só se resolvem com uma chamada real (ver [`../../produto/hipoteses.md`](../../produto/hipoteses.md), H1).

Esta é a primeira aplicação de backend do repositório. As tasks 001–005 e `docs/historico/` descrevem outra API e outras tabelas e não valem como especificação.

Restrições conhecidas da API, pela referência e pelo manual de credenciais:

- Consulta assíncrona: abre a solicitação, acompanha a situação, pede a `urlAssinada` e baixa o arquivo JSON. O processamento pode levar até 240 minutos; depois disso a situação vira `EXPIRADA`. O arquivo fica disponível por 48 horas.
- Consulta incremental: cada chamada devolve só o que mudou desde a última solicitação concluída, limitado aos últimos 8 dias. Não há como pedir histórico. O que não for guardado se perde.
- Quatro chamadas por API e por credencial. A FAQ (pergunta 12) diz "até 4 chamadas por API, por dia e por credencial", com reinício à meia-noite; o guia (seção 7) diz "4 chamadas por credencial e por api", sem período. Nenhuma página diz se situação e download contam.
- Token OAuth 2.0 Client Credentials válido por 1 hora, com limite de 2 tokens por hora; o manual manda guardar o token em cache e reutilizá-lo.
- A documentação está em beta, com quatro versões entre setembro e novembro de 2026.

### Decisões já tomadas pelo responsável

1. **Stack:** Node.js com TypeScript. A aplicação fica em `app/<nome>`; o nome é definido na Spec (sugestão: `app/apuracao-cbs`).
2. **Ambiente:** produção restrita (ambiente de testes da Receita). Só chamadas de leitura.
3. **Fonte:** APIs de apuração da CBS da Receita Federal, não a Plataforma de Split Payment.
4. **Espera sem aviso:** a solicitação é acompanhada pela consulta de situação, sem `urlRetorno` (não há endereço público nosso).
5. **Credencial:** é do próprio responsável. Ele já tem client id e segredo; gera a credencial quando a chamada real for acontecer, grava os valores no `.env` local e a revoga depois do uso. Nenhum agente pede ou recebe o segredo; client id e segredo ficam fora de chat, commit e documento. (2026-11-23, P-4)
6. **Escopo das consultas:** entram as quatro consultas assíncronas: créditos, recolhimentos, pagamentos e débitos. A ordem de entrega é créditos → recolhimentos → pagamentos → débitos. Cada execução roda só a consulta pedida, por causa do limite de quatro chamadas por API e por credencial. (2026-11-23, P-1)
7. **Ambiente sem dados:** se a produção restrita vier vazia ou só com dados de teste, a prova de conceito é aceita com o ciclo técnico comprovado, e as perguntas sobre os dados ficam registradas como não respondidas, com o motivo. Uma consulta em produção (beta) seria demanda nova. (2026-11-23, P-3)
8. **Dados reais na saída:** o resumo pode mostrar chaves de notas reais, só no terminal local e nos arquivos da pasta ignorada pelo git. Nada disso vai para código, teste, documento ou PR. (2026-11-23, P-5)

### Token e ambiente: o que há de fonte e o que falta

Conferido pela sessão principal em 2026-11-23, em fontes públicas.

O manual de credenciais é público. O guia (`guiaapiassincrona.html`, seção 3) aponta para o compartilhamento <https://arquivos.receitafederal.gov.br/index.php/s/gn672Ad4CF8N6TK?dir=/Documentos/T%C3%A9cnicos/Receita%20Integra>, que contém "Receita Integra - Documentação Técnica - Prod - v1.4.pdf" (versão 1.4, última atualização 17/07/2026, 6 páginas). O manual diz:

- **Autenticação:** OAuth 2.0 Client Credentials (RFC 6749), com Bearer Token. A credencial é o par `client_id` e `client_secret`, gerada no serviço "Gerar Credencial de Acesso para API", em `servicos.receitafederal.gov.br` ou `consumo.tributos.gov.br`, por usuário gov.br que represente a pessoa jurídica (representante ou procurador) ou com e-CNPJ.
- **Token:** `POST https://api.receitafederal.gov.br/token`, com `client_id`, `client_secret` e `grant_type=client_credentials`. A resposta traz `access_token`. O manual mostra isso só num diagrama: **não diz** se as credenciais vão no corpo ou em Basic, nem o Content-Type, e não cita scope.
- **Validade:** 1 hora (60 minutos). **Limite de 2 tokens por hora**; o manual manda implementar cache para reutilizar o token.
- **Ambientes:** a tabela "Ambientes" do manual tem só a linha **Produção**.
- **Erros HTTP:** 400, 401 (token ausente, inválido ou expirado), 403 (sem escopo ou permissão), 404, 429 (limite excedido) e 500.

**Continua sem fonte:**

- a URL da produção restrita. Nem o manual nem as sete páginas da documentação a trazem; todas mostram só a "URL de Produção" `https://api.receitafederal.gov.br/apuracao-cbs/v2/...`;
- se o endereço do token é o mesmo na produção restrita;
- a forma exata de enviar as credenciais no pedido de token (corpo ou Basic, Content-Type).

O responsável achou outra documentação sobre o ambiente e vai trazê-la (P-2). Até lá, a implementação avança com dados fictícios montados a partir dos schemas oficiais (`https://docs.receitafederal.gov.br/apuracao-cbs/schemas/`), os endereços vêm da configuração (CA-13) e a chamada real fica para o último passo. Nenhum endereço é inventado.

Versões das páginas conferidas em 2026-11-23: guia 1.1 (14/10/2026); crédito, débito, pagamentos e recolhimentos 1.3 (13/11/2026); situação 1.2 (14/10/2026); schemas de retorno 1.0.0, incluindo `schemas/recolhimento-retorno.schema.json` (JSON Schema Draft 2020-12). A FAQ não tem versão. Nos recolhimentos, `chaveDFE` tem cardinalidade 0:1 ("retornada conforme regra do tipo de pagamento") e `niFornecedor` 1:1.

## Critérios de aceite

### Ciclo das consultas

- **CA-1:** Com o `.env` preenchido, um único comando documentado faz o ciclo completo de uma consulta na produção restrita, para a consulta escolhida entre créditos, recolhimentos, pagamentos e débitos: obtém o token (CA-23), abre a solicitação para o CNPJ base de 8 dígitos sem `urlRetorno`, acompanha a situação até `CONCLUIDA`, obtém a `urlAssinada`, baixa o arquivo e mostra o resumo da consulta (CA-7, CA-11, CA-21 ou CA-22).
- **CA-2:** Durante a espera, o comando mostra o serviço, o tiquete, a estimativa de tempo devolvida na abertura e cada mudança de situação. O intervalo entre consultas de situação é configurável e respeita o limite de chamadas.
- **CA-3:** Se o comando for interrompido ou o processamento demorar, é possível retomar o acompanhamento a partir do tiquete já aberto, para qualquer das quatro consultas, sem abrir nova solicitação.
- **CA-4:** Situação `ERRO` ou `EXPIRADA`, token recusado (401), falta de permissão (403), limite excedido (429), outra resposta de erro da API (400, 404, 500) ou `urlAssinada` vencida encerram o comando com mensagem clara do que aconteceu e do que fazer, sem expor credencial ou token e sem abrir nova solicitação nem pedir novo token por conta própria.
- **CA-24:** O comando exige que a consulta seja escolhida. Sem consulta informada, ele não chama a API e mostra as opções. Cada execução abre no máximo uma solicitação por consulta nomeada; rodar mais de uma consulta exige nomear cada uma explicitamente, e não existe opção padrão que dispare as quatro.
- **CA-25:** O comando registra, numa pasta local ignorada pelo git, cada chamada feita à API (data e hora, serviço, tipo de chamada: token, abertura, situação ou download, e código HTTP), sem token, credencial nem conteúdo da resposta, e mostra antes de abrir uma solicitação quantas aberturas daquele serviço já foram registradas no dia. O registro serve para responder se situação e download contam no limite (CA-19).

### Token

- **CA-23:** O token é obtido com OAuth 2.0 Client Credentials e reaproveitado enquanto válido: uma nova execução dentro da validade não pede outro token. O comando não pede um terceiro token dentro da mesma hora (limite de 2 por hora); nesse caso, encerra com mensagem dizendo quando poderá pedir de novo. O token nunca é gravado em log, saída do comando nem arquivo versionado; se for guardado entre execuções, fica só na pasta local ignorada pelo git.

### Arquivo e leitura

- **CA-5:** O arquivo baixado é guardado sem alteração, com data, serviço e tiquete identificáveis, numa pasta local ignorada pelo git, antes de qualquer leitura. Um arquivo já guardado, de qualquer das quatro consultas, pode ser lido de novo pelo comando sem chamar a API.
- **CA-6:** O arquivo é validado contra o schema oficial de retorno da sua consulta (`credito-retorno`, `recolhimento-retorno`, `pagamento-retorno` ou `debito-retorno`), numa cópia versionada de cada schema com a versão e a data de leitura registradas. Arquivo que não passa na validação não é resumido como se estivesse correto: o comando mostra o que divergiu e mantém o arquivo guardado.
- **CA-7 (créditos):** O resumo mostra, por documento fiscal (chave, tipo, origem, período de apuração), os valores de `apropriacao.aApropriar` e `apropriacao.apropriado`, e os totais de `aApropriar` e `apropriado` por período de apuração. Os demais valores do arquivo ficam guardados no bruto; o resumo não os interpreta.
- **CA-11 (recolhimentos):** O resumo mostra, por item, `niFornecedor`, `chaveDFE`, período e total, e o total por período. Item sem `chaveDFE` (cardinalidade 0:1 no schema) é aceito e aparece como "sem chave", e o resumo informa quantos itens vieram sem chave.
- **CA-21 (pagamentos):** O resumo mostra, por pagamento, se é do contribuinte (PCONT) ou do adquirente (RAD), o período e o valor, e o total por período, com os campos que o schema oficial de pagamentos define para isso; a Spec fixa os campos a partir do schema 1.0.0. Os demais valores ficam no bruto.
- **CA-22 (débitos):** O resumo mostra, por documento fiscal (chave, tipo, período de apuração), os valores `apurado`, `extinto` e `saldoDevedor`, e os totais desses valores por período de apuração. Os demais valores (`suspenso`, `inexigivel`, `pgtoAntecipado` e outros) ficam no bruto; o resumo não os interpreta.
- **CA-8:** Valores monetários de todas as consultas são lidos e somados em decimal de precisão fixa, nunca em ponto flutuante. A soma de uma lista de valores fictícios com casas decimais bate com o total esperado ao centavo.
- **CA-9:** O resumo não chama crédito `aApropriar` de disponível nem débito de "a pagar"; os rótulos seguem os nomes da documentação ("a apropriar", "apropriado", "saldo devedor" etc.) até a PoC dizer o que significam na prática.
- **CA-10:** Arquivo sem registros (nada mudou no período), em qualquer das quatro consultas, é tratado como resultado válido, com mensagem dizendo que a API não devolveu alterações.

Ordem de entrega: créditos, depois recolhimentos, pagamentos e débitos. As Tasks seguem essa ordem, de modo que cada consulta fique completa (cliente, guarda, validação e resumo) antes da próxima.

### Segurança

- **CA-12:** Client id, segredo e token nunca aparecem em código, commit, log, saída do comando, teste, documento ou PR. A aplicação lê client id e segredo de um `.env` local ignorado pelo git; o repositório tem só um `.env.example` com os nomes das variáveis, sem valores.
- **CA-13:** O endereço do token e a URL base do ambiente vêm da configuração, sem valor padrão no código. O `.env.example` e os documentos só citam endereços que constem de documentação oficial, com a fonte (por exemplo, o endereço de token do manual Receita Integra v1.4); a URL da produção restrita fica sem valor até haver fonte (P-2).
- **CA-14:** Nenhum CNPJ real e nenhum dado fiscal real em código, teste, exemplo ou documentação. Arquivos de exemplo versionados são fictícios e montados a partir dos schemas oficiais. Chaves de notas reais aparecem só no terminal local e nos arquivos da pasta ignorada pelo git.
- **CA-15:** A aplicação só faz chamadas de leitura: token, abertura das quatro consultas (créditos, recolhimentos, pagamentos e débitos), situação e download. Não existe código para `/rad`, `/pcont` ou qualquer outro serviço que gere guia ou altere dados.

### Testes e documentação

- **CA-16:** Testes automatizados, escritos antes do código a partir destes CA, cobrem com respostas simuladas o cliente da API (token e seu reaproveitamento, limite de 2 tokens por hora, abertura das quatro consultas, situação, download, erros HTTP, retomada por tiquete, consulta obrigatória e registro de chamadas) e, com dados fictícios, a leitura dos quatro arquivos (validação, resumo, totais, decimal, arquivo vazio, recolhimento sem `chaveDFE`). Nenhum teste automatizado chama a API real; a chamada real é manual e explícita.
- **CA-17:** O comando de teste da aplicação nova e o comando da consulta real (com a escolha da consulta) estão registrados no `AGENTS.md` e no README da aplicação, com o passo a passo para gerar a credencial em "Gerar Credencial de Acesso para API", preencher o `.env` e revogar a credencial depois do uso.
- **CA-18:** Lint, build e testes da aplicação nova passam.

### Respostas da prova de conceito

- **CA-19:** Depois das chamadas reais (uma de cada consulta, cada uma por pedido explícito), `docs/referencias/apuracao-cbs/README.md` e a H1 em `docs/produto/hipoteses.md` registram, com data e sem dados reais: a URL da produção restrita e se o endereço do token é o mesmo nela (só com fonte oficial); a forma de envio das credenciais que funcionou; a validade do token observada; o tempo real de processamento de cada consulta; se a consulta de situação, o download e o pedido de token contam no limite de chamadas e qual o limite observado (a partir do registro do CA-25); o que um crédito `aApropriar` significou nos dados obtidos e se foi possível ligá-lo ao pagamento do fornecedor pelos recolhimentos ou pagamentos; se a chave da nota bastou para identificar o fornecedor e com que frequência `chaveDFE` veio vazia; e a situação de cada divergência listada na referência (confirmada, resolvida ou não testada). Se a produção restrita vier vazia ou só com dados de teste, a PoC é aceita com o ciclo técnico (CA-1 a CA-6) comprovado, e as perguntas sobre os dados ficam registradas como não respondidas, com o motivo. O mesmo vale para qualquer outra pergunta que a PoC não conseguir responder.
- **CA-20:** A versão de cada página oficial e de cada schema usados na implementação é conferida, e a tabela "Fontes" da referência é atualizada, incluindo o manual Receita Integra v1.4 e o schema de recolhimentos.

## Fora de escopo

- Geração de DARF (`/rad`, `/pcont`) e qualquer chamada que não seja de leitura.
- Disparo das quatro consultas sem que cada uma seja pedida explicitamente.
- Aviso por `urlRetorno` e qualquer endereço público.
- Painel, login, banco de dados, multi-cliente, agendamento automático da consulta.
- IBS.
- Produção (beta); só produção restrita.
- Hospedagem, CI e publicação.
- Cálculo de crédito ou interpretação tributária além dos rótulos da documentação.

## Perguntas em aberto

- **P-2 (ambiente, parcialmente respondida em 2026-11-23):** o manual Receita Integra v1.4 já dá o endereço do token, a validade e o limite de tokens (ver "Token e ambiente"). Faltam a URL da produção restrita, se o endereço do token é o mesmo nesse ambiente e a forma de enviar as credenciais no pedido de token (corpo ou Basic, Content-Type). O responsável vai trazer a outra documentação que encontrou. Recomendação: a Spec segue com os dois endereços como configuração obrigatória e sem valor padrão, e com a forma de envio das credenciais configurável entre corpo e Basic, para que a documentação nova só mude o `.env`; a chamada real espera essa fonte.
