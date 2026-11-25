# 031-stack-arquitetura — Stack e arquitetura do produto

- **Status:** us-em-revisão
- **Branch:** `feat/031-stack-arquitetura`
- **Worktree:** `.claude/worktrees/031-stack-arquitetura`
- **Solicitante / data:** responsável pelo produto, 2026-11-25

## História

Como responsável pelo CreditoGov, quero um documento de decisão de arquitetura que compare alternativas, com prós e contras, para a stack, a hospedagem, o banco, a separação de dados por empresa, a coleta agendada da API de apuração da CBS, a guarda da credencial de cada cliente e o lugar da autenticação, e que funcione tanto se um software puder consultar a API por vários contribuintes quanto se não puder, para escolher com base em fatos e liberar as demandas de login e de dashboard sem refazer a base depois.

## Contexto

O CreditoGov é um SaaS para PMEs no regime regular acompanharem o crédito de CBS das compras como dinheiro a receber ([`../../produto/visao.md`](../../produto/visao.md)). O modelo é painel por assinatura, com o contador como canal. A antecipação com instituições financeiras fica para depois (H3 aberta). Integração com ERP não é o modelo: o ERP é, no máximo, uma possível fonte de dados.

Concluídas: landing (028), prova de conceito da API de apuração da CBS com chamada real (029, `app/apuracao-cbs`) e painel local (030, `app/painel`). As duas aplicações usam Node 24 e TypeScript, sem servidor público, sem banco e sem login. O `PROJECT_CONTEXT.md` §4 guarda uma proposta da concepção (Node.js, Express, TypeORM e PostgreSQL no backend; React, Redux Toolkit e shadcn/ui no painel), **não confirmada**, e diz que a stack seria decidida na primeira demanda de backend. Esta é essa demanda.

**A entrega é documentação, não código.** Um documento de decisão de arquitetura em `docs/` (formato e caminho exatos ficam para a Spec), mais as atualizações em `PROJECT_CONTEXT.md` e `produto/hipoteses.md`. Nenhuma aplicação, infraestrutura ou conta é criada.

### O que a referência e a prova de conceito já mostram

De [`../../referencias/apuracao-cbs/README.md`](../../referencias/apuracao-cbs/README.md) e do código de `app/apuracao-cbs`:

- **Credencial:** gerada no portal pelo contribuinte ou por seu procurador digital, válida para o estabelecimento matriz. É um par `client_id` e `client_secret` (OAuth2 Client Credentials). Chaves anteriores à versão 2.0 precisam ser geradas de novo.
- **Token:** validade de 1 hora e limite de 2 por hora (manual Receita Integra v1.4). A PoC guarda o token em cache local, controla o limite de 2 por hora num registro local de chamadas e retira credencial e token de toda saída e log.
- **Consulta assíncrona:** abertura devolve um tíquete; a espera é por consulta de situação ou por aviso em `urlRetorno` (endereço HTTPS nosso, **sem assinatura nem autenticação**); o download dá uma URL assinada válida por 48 horas. O processamento pode levar até 240 minutos e depois expira.
- **Incremental:** cada chamada traz só o que mudou desde a última solicitação concluída, limitado a 8 dias; não há histórico. O que não for coletado a tempo se perde.
- **Limite:** 4 chamadas por API e por credencial; a FAQ diz "por dia", o guia não diz o período (divergência 1, não testada).
- **Observado em 2026-11-24:** segunda abertura de créditos cerca de dois minutos depois da primeira concluída respondeu HTTP 400, sem motivo conhecido; recolhimentos e pagamentos responderam HTTP 404 com duas credenciais; o arquivo traz `ni` com 14 dígitos, contra 8 no schema 1.0.0; `niConsumidor` identifica quem consome a credencial.
- **Multi-cliente:** existe o erro "consumidor não autorizado para este NI", mas o modelo de procuração para um software consultar por vários contribuintes **não está documentado** (H1).
- **Estado local da PoC:** arquivo bruto guardado sem sobrescrever (`.local/arquivos/`), registro de chamadas (`.local/chamadas.jsonl`), cache do token (`.local/token.json`); configuração por `.env`.

### Os dois cenários do acesso multi-cliente

O maior risco da demanda. A arquitetura precisa funcionar nos dois, ou ter um plano para cada um:

- **Cenário A — credencial por cliente.** Cada empresa (ou o procurador dela) gera a própria credencial e a entrega ao CreditoGov. Cada credencial consulta um CNPJ base.
- **Cenário B — credencial de terceiro com procuração.** Uma credencial de terceiro (do escritório de contabilidade ou do próprio CreditoGov) consulta vários CNPJs, com procuração de cada contribuinte. Não se sabe se o limite de 4 chamadas vale por credencial no total ou por credencial e CNPJ: no primeiro caso, uma credencial atenderia poucos clientes por dia.

### Decisões já tomadas que a arquitetura respeita

- Autenticação própria da plataforma, por email e senha, sem credencial de ERP (2026-08-25).
- Venda direta, com escritórios de contabilidade como canal (2026-08-26).
- Antecipação com fintech ou FIDC fica para depois de haver base de clientes (2026-08-26).
- Fonte de dados da CBS: APIs de apuração da Receita; o produto começa só com CBS (2026-11-23).

### Frentes paralelas

- **032 (design system do produto)** e **033 (história do dashboard)** correm em outras sessões. Esta demanda não decide nada delas; o que depender delas ou as afetar entra como dependência.
- **Login** e **implementação do dashboard** esperam esta demanda.

## Critérios de aceite

### Entrega e formato das decisões

- **CA-1:** Existe um documento de decisão de arquitetura em `docs/`, ligado a partir do `PROJECT_CONTEXT.md` e do índice `docs/README.md`.
- **CA-2:** Cada decisão do documento traz: o problema, pelo menos duas alternativas, prós e contras de cada uma contra critérios declarados, a recomendação, a alternativa escolhida pelo responsável (com data) e por que as outras foram descartadas.
- **CA-3:** Toda afirmação sobre a API de apuração da CBS ou sobre regra tributária cita a fonte em `docs/referencias/` ou o observado registrado lá, com a data. O que não tiver fonte aparece como pergunta em aberto, nunca como fato.
- **CA-4:** O documento separa o que é decidido agora do que fica para demandas posteriores, nomeando a demanda ou frente (login, dashboard, 032, 033, antecipação).

### Stack

- **CA-5:** O documento decide a stack do backend e da aplicação web do produto, avaliando pelo menos a continuidade com o que já existe (Node 24 e TypeScript das aplicações 029 e 030) e a proposta da concepção (Express, TypeORM, PostgreSQL, React, Redux Toolkit, shadcn/ui), que sai confirmada ou descartada com motivo.
- **CA-6:** O documento diz o que acontece com `app/apuracao-cbs` e `app/painel`: o que é aproveitado (código, regras de leitura e validação, tolerância do `ni`), o que segue só como ferramenta e o que não passa ao produto.
- **CA-7:** O documento diz como valores monetários são representados do banco à tela, em decimal de precisão fixa, nunca em ponto flutuante.

### Hospedagem, banco e separação por empresa

- **CA-8:** O documento decide a hospedagem e o banco, comparando alternativas por custo (com fonte de preço e data, ou marcado como sem fonte), operação por uma equipe pequena, suporte a tarefa agendada e de longa duração (até 240 minutos por consulta), guarda de segredo, backup e região.
- **CA-9:** O documento decide como os dados de uma empresa ficam separados dos de outra (por exemplo: tabela compartilhada com identificador da empresa, schema por empresa, banco por empresa), com prós e contras, e diz onde a separação é garantida (aplicação, banco ou ambos).
- **CA-10:** O modelo admite um usuário ligado a várias empresas (o contador que atende uma carteira) e uma empresa com vários usuários, sem decidir as permissões de cada papel, que ficam para a demanda de login. A decisão em aberto "vários CNPJs por cliente" é tratada como dependência ou pergunta, e o documento diz qual é a unidade de empresa (raiz do CNPJ, conforme O-24 da referência).
- **CA-11:** O documento diz como o arquivo bruto de cada consulta é guardado (sem sobrescrever, com backup e reprocessável), já que a API não devolve histórico, e como os dados lidos são reconstruídos a partir dele quando a regra de leitura mudar.

### Coleta agendada

- **CA-12:** O documento descreve a coleta por cliente e por serviço: frequência, folga em relação à janela de 8 dias, quantas das 4 chamadas cada ciclo usa e quantas sobram para nova tentativa, e reuso do token dentro do limite de 2 por hora.
- **CA-13:** O documento diz como uma consulta pendente sobrevive a reinício do processo durante as até 240 minutos de processamento, como o download é feito dentro das 48 horas, e se a espera usa consulta de situação, aviso em `urlRetorno` ou os dois. Se usar o aviso, diz como tratá-lo sabendo que ele não tem autenticação.
- **CA-14:** O documento define o tratamento de falhas sem gastar chamada à toa: limite atingido (HTTP 429), recusa sem motivo conhecido (o HTTP 400 observado), serviço indisponível (o HTTP 404 de recolhimentos e pagamentos), situação `ERRO` ou `EXPIRADA`, credencial revogada ou "consumidor não autorizado".
- **CA-15:** O documento diz como o CreditoGov percebe que um cliente está perto de ficar mais de 8 dias sem coleta e quem é avisado.

### Credencial da Receita

- **CA-16:** O documento decide onde e como a credencial de cada cliente é guardada (cifrada, com a chave fora do banco), quem e o que pode lê-la, e que ela nunca aparece em log, tela ou mensagem de erro.
- **CA-17:** O documento descreve o ciclo da credencial: como o cliente ou o procurador a entrega, como é conferida sem gastar chamada desnecessária, troca, revogação, credencial anterior à versão 2.0 e remoção quando o cliente sai.

### Acesso em nome de vários clientes

- **CA-18:** O documento descreve como a arquitetura funciona no **cenário A** (uma credencial por cliente): cadastro, coleta, limite por credencial e guarda da credencial.
- **CA-19:** O documento descreve como a arquitetura funciona no **cenário B** (uma credencial de terceiro para vários CNPJs): de quem é a credencial, como a procuração entra no cadastro, e como a coleta se comporta nas duas leituras do limite (4 chamadas por credencial no total ou por credencial e CNPJ), incluindo quantos clientes por dia cada leitura permite.
- **CA-20:** O documento diz o que é comum aos dois cenários, o que muda, como passar de A para B (ou conviver com os dois) sem refazer o modelo de dados, e o que fazer se nenhum dos dois se mostrar viável.
- **CA-21:** As perguntas do acesso multi-cliente que não têm fonte (modelo de procuração, contagem do limite no cenário B, papel do `niConsumidor`) estão em `docs/produto/hipoteses.md`, cada uma com o que muda na arquitetura conforme a resposta e como obtê-la.

### Autenticação

- **CA-22:** O documento decide onde fica a autenticação (dentro do backend ou num serviço de identidade separado, próprio ou gerenciado), com prós e contras, respeitando a decisão de 2026-08-25 (email e senha próprios da plataforma, sem credencial de ERP) ou propondo de forma explícita revê-la. Tela, fluxo de cadastro, recuperação de senha e permissões ficam para a demanda de login.

### O que não pode ser bloqueado

- **CA-23:** O documento mostra que a arquitetura não impede a antecipação de crédito com instituições financeiras parceiras no futuro (por exemplo: histórico por nota preservado, origem rastreável, forma de expor dados a terceiros com autorização do cliente), sem construir nada disso.
- **CA-24:** O documento trata a fonte de dados como peça substituível e diz como outra fonte (ERP, ou o equivalente do IBS se o Comitê Gestor publicar) entraria, sem desenhá-la nem tratar o ERP como canal.

### Segurança e ambientes

- **CA-25:** O documento lista os dados sensíveis (credencial, token, dados fiscais da empresa, dados pessoais de usuários e o `niConsumidor`) e a proteção de cada um em trânsito, em repouso e em log. O que depender de interpretação da LGPD vira pergunta para advogado, sem afirmar regra.
- **CA-26:** O documento diz como desenvolvimento e testes funcionam sem a API real e sem dado real (respostas simuladas, dados fictícios), coerente com as regras do `AGENTS.md`, e onde ficam as variáveis de ambiente e segredos de cada ambiente (só os nomes).

### Registros no projeto

- **CA-27:** O `PROJECT_CONTEXT.md` registra: as decisões tomadas, com data, em §3; a stack decidida em §4, no lugar da proposta não confirmada; que `app/painel` (030) é ferramenta interna de validação dos dados, **não** a primeira versão do produto para o usuário final, e que o dashboard do usuário será feito do zero; que integração com ERP não é o modelo (ERP é só possível fonte de dados); e uma linha no changelog.
- **CA-28:** O `docs/produto/hipoteses.md` registra as perguntas novas sem fonte e marca como resolvida a decisão em aberto "Stack do backend e hospedagem", com a data e o link para o documento.
- **CA-29:** Nenhum arquivo da demanda contém credencial, segredo, token, CNPJ real ou outro dado real de contribuinte.

## Fora de escopo

- Código, aplicação nova, infraestrutura, contas em provedor, domínio e CI.
- Chamar a API da Receita ou rodar `npm run consulta`; prova de conceito do cenário B.
- Tela, fluxo e regras do login (demanda posterior); permissões de cada papel.
- Design system (032) e dashboard (033): componentes, telas, identidade visual.
- Antecipação de crédito, compensação, geração de guia (RAD, PCONT), cobrança da assinatura e comissão do contador.
- Integração com ERP e coleta do IBS.
- Mudar `app/apuracao-cbs` ou `app/painel`.
- Regra tributária nova ou interpretação jurídica (LGPD, procuração, cessão de crédito).

## Perguntas em aberto

- **P-1 — Quando o responsável escolhe.** Recomendação: a Spec traz as alternativas com prós, contras e recomendação; o responsável escolhe ao aprovar a Spec; o documento final registra a escolha (CA-2).
- **P-2 — Stack da aplicação web e o design system (032).** A escolha do framework da interface afeta o design system. Recomendação: esta demanda decide o framework e a forma de renderização; a 032 decide tokens, componentes e biblioteca visual sobre ele. Se a 032 já estiver fixando biblioteca de componentes, alinhar antes da Spec.
- **P-3 — Alcance de "autenticação própria".** A decisão de 2026-08-25 exclui um serviço de identidade gerenciado? Recomendação: ler como "login do CreditoGov por email e senha, não do ERP"; um serviço gerenciado é aceitável se o usuário só vê o login do CreditoGov. O documento compara as duas formas (CA-22).
- **P-4 — Perguntar à Receita antes da Spec?** O cenário B depende de resposta que só a Receita ou quem já integra pode dar. Recomendação: não esperar; a Spec desenha os dois cenários e o responsável leva as perguntas de CA-21 em paralelo.
