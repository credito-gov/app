# 031-stack-arquitetura — Stack e arquitetura do produto

- **Status:** us-em-revisão
- **Branch:** `feat/031-stack-arquitetura`
- **Worktree:** `.claude/worktrees/031-stack-arquitetura`
- **Solicitante / data:** responsável pelo produto, 2026-11-25

## História

Como responsável pelo CreditoGov, quero um documento de decisão de arquitetura que compare alternativas, com prós e contras, para a stack, a hospedagem, o banco, a separação de dados por empresa, a coleta agendada da API de apuração da CBS, a guarda da credencial de cada cliente e o lugar da autenticação, dentro do modelo SaaS multi-inquilino, com cada cliente informando a própria credencial e um plano para a credencial de procurador que cubra vários CNPJs, para escolher com base em fatos e liberar as demandas de login e de dashboard sem refazer a base depois.

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
- **Multi-cliente:** existe o erro "consumidor não autorizado para este NI", ou seja, a própria API recusa a credencial que não vale para o CNPJ consultado. **Não está documentado** se uma credencial de procurador cobre vários CNPJs nem como o limite de 4 chamadas se aplica nesse caso (H1).
- **Estado local da PoC:** arquivo bruto guardado sem sobrescrever (`.local/arquivos/`), registro de chamadas (`.local/chamadas.jsonl`), cache do token (`.local/token.json`); configuração por `.env`.

### Os dois cenários do acesso multi-cliente

**Premissa decidida pelo responsável (2026-11-25):** quem decide se alguém pode consultar um CNPJ é a Receita, pela credencial gerada no gov.br pelo titular ou pelo procurador. O CreditoGov não verifica nem prova representação ou procuração: usa a credencial que recebe, e o que ela permite acessar é o que vale. Nas palavras do responsável: "essa responsabilidade é da receita, eu poderia por exemplo 'representar' o cnpj de qualquer empresa, mas o que vai valer são as credenciais do gov.br para aquele cnpj".

Por isso o maior risco da demanda não é se o software pode consultar por terceiros, e sim operacional: quantas credenciais existem e como o limite de 4 chamadas se aplica a cada uma.

**Decisão do responsável (2026-11-25):** "Cada cliente cadastrado na plataforma vai precisar informar a sua." A base é o cenário A; o cenário B fica como contingência ou otimização futura, com plano registrado e sem desenho em profundidade:

- **Cenário A — uma credencial por CNPJ (base).** Cada empresa cliente informa a própria credencial ao se cadastrar, gerada no gov.br pelo titular ou pelo procurador. Cada credencial consulta um CNPJ base.
- **Cenário B — credencial de procurador que cobre vários CNPJs (contingência futura).** Uma credencial gerada por um procurador (por exemplo, o escritório de contabilidade) que, segundo a própria Receita, dá acesso a vários CNPJs. Não se sabe se esse caso existe nem se o limite de 4 chamadas vale por credencial no total ou por credencial e CNPJ: no primeiro caso, uma credencial atenderia poucos clientes por dia.

### Decisões já tomadas que a arquitetura respeita

- Autenticação própria da plataforma, por email e senha, sem credencial de ERP (2026-08-25).
- O acesso a cada CNPJ é decidido pela Receita, pela credencial do gov.br; o CreditoGov não verifica representação nem procuração (2026-11-25, ver acima).
- **SaaS multi-inquilino (2026-11-25).** Nas palavras do responsável: "tem que seguir o modelo de saas". Uma única instalação, operada pelo CreditoGov, atende todas as empresas clientes por assinatura. Não há instalação por cliente nem on-premise.
- **Cada cliente informa a própria credencial da Receita (2026-11-25)**, ver "Os dois cenários" acima.
- **Login federado depois (2026-11-25).** Nas palavras do responsável: "Pode não entrar agora, mas teria muita credibilidade se usar logins federados (google e apple), e mais ainda se der para usar o login do gov.br". O login por email e senha continua a base; a arquitetura não pode bloquear login com Google, Apple ou gov.br no futuro. Se e como o login do gov.br pode ser usado por software privado não tem fonte em `docs/referencias/` e fica como pergunta.
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

- **CA-8:** O documento decide a hospedagem e o banco dentro do modelo SaaS multi-inquilino decidido em 2026-11-25 (uma instalação única operada pelo CreditoGov, para todas as empresas clientes). Alternativa fora desse modelo (instalação por cliente, on-premise) é descartada já com esse motivo. O documento compara as alternativas por custo (com fonte de preço e data, ou marcado como sem fonte), operação por uma equipe pequena, suporte a tarefa agendada e de longa duração (até 240 minutos por consulta), guarda de segredo, backup e região.
- **CA-9:** O documento decide como os dados de uma empresa ficam separados dos de outra dentro da operação única (por exemplo: tabela compartilhada com identificador da empresa, schema por empresa, banco por empresa), com prós e contras, e diz onde a separação é garantida (aplicação, banco ou ambos).
- **CA-10:** O modelo admite um usuário ligado a várias empresas (o contador que atende uma carteira) e uma empresa com vários usuários, sem decidir as permissões de cada papel, que ficam para a demanda de login. A decisão em aberto "vários CNPJs por cliente" é tratada como dependência ou pergunta, e o documento diz qual é a unidade de empresa (raiz do CNPJ, conforme O-24 da referência).
- **CA-11:** O documento diz como o arquivo bruto de cada consulta é guardado (sem sobrescrever, com backup e reprocessável), já que a API não devolve histórico, e como os dados lidos são reconstruídos a partir dele quando a regra de leitura mudar.

### Coleta agendada

- **CA-12:** O documento descreve a coleta por cliente e por serviço: frequência, folga em relação à janela de 8 dias, quantas das 4 chamadas cada ciclo usa e quantas sobram para nova tentativa, e reuso do token dentro do limite de 2 por hora.
- **CA-13:** O documento diz como uma consulta pendente sobrevive a reinício do processo durante as até 240 minutos de processamento, como o download é feito dentro das 48 horas, e se a espera usa consulta de situação, aviso em `urlRetorno` ou os dois. Se usar o aviso, diz como tratá-lo sabendo que ele não tem autenticação.
- **CA-14:** O documento define o tratamento de falhas sem gastar chamada à toa: limite atingido (HTTP 429), recusa sem motivo conhecido (o HTTP 400 observado), serviço indisponível (o HTTP 404 de recolhimentos e pagamentos), situação `ERRO` ou `EXPIRADA`, credencial revogada ou "consumidor não autorizado".
- **CA-15:** O documento diz como o CreditoGov percebe que um cliente está perto de ficar mais de 8 dias sem coleta e quem é avisado.

### Credencial da Receita

- **CA-16:** O documento parte da decisão de 2026-11-25 (cada cliente cadastrado informa a própria credencial) e decide onde e como a credencial de cada cliente é guardada (cifrada, com a chave fora do banco), quem e o que pode lê-la, e que ela nunca aparece em log, tela ou mensagem de erro.
- **CA-17:** O documento descreve o ciclo da credencial, a partir do cadastro da empresa cliente, que informa a própria credencial (gerada pelo titular ou pelo procurador): como ela é informada, como é conferida sem gastar chamada desnecessária, troca, revogação, credencial anterior à versão 2.0 e remoção quando o cliente sai.

### Acesso em nome de vários clientes

- **CA-18:** O documento desenha a arquitetura sobre o **cenário A** (uma credencial por CNPJ, informada pela empresa cliente), que é a base: cadastro, coleta, limite de 4 chamadas por credencial na coleta de cada cliente e guarda da credencial.
- **CA-19:** O documento registra o **cenário B** (uma credencial de procurador que cobre vários CNPJs) como contingência ou otimização futura, sem desenhá-lo em profundidade: o que o deixaria possível (respostas do CA-21), o efeito das duas leituras do limite (4 chamadas por credencial no total ou por credencial e CNPJ) sobre quantos clientes por dia uma credencial atenderia, e o que muda se a credencial deixar de valer para um dos CNPJs ("consumidor não autorizado para este NI").
- **CA-20:** O documento diz quais decisões do cenário A preservam a passagem para o B (ou a convivência dos dois) sem refazer o modelo de dados, e o que fazer se o cenário B não existir ou se o limite o tornar inviável.
- **CA-21:** As perguntas operacionais do acesso multi-cliente que não têm fonte (uma credencial de procurador cobre vários CNPJs? o limite é por credencial ou por credencial e CNPJ? qual o papel do `niConsumidor`?) e a do login (o login do gov.br pode ser usado por software privado, e em que condições?) estão em `docs/produto/hipoteses.md`, cada uma com o que muda na arquitetura conforme a resposta e como obtê-la. A legitimidade do acesso não entra como pergunta: é premissa decidida (2026-11-25).
- **CA-21a:** O documento registra a premissa de 2026-11-25: o CreditoGov não verifica representação nem procuração, e o acesso que vale é o que a credencial do gov.br permite. Para rastreio, a arquitetura guarda quem entregou cada credencial, quando e para qual empresa, sem tratar esse registro como verificação de procuração.

### Autenticação

- **CA-22:** O documento decide onde fica a autenticação (dentro do backend ou num serviço de identidade separado, próprio ou gerenciado), com prós e contras, respeitando a decisão de 2026-08-25 (email e senha próprios da plataforma, sem credencial de ERP) ou propondo de forma explícita revê-la. Tela, fluxo de cadastro, recuperação de senha e permissões ficam para a demanda de login.
- **CA-22a:** O documento mostra que a escolha do CA-22 não bloqueia login federado com Google e Apple nem com gov.br no futuro (decisão de 2026-11-25), e diz como cada alternativa (autenticação própria ou serviço gerenciado) afeta acrescentá-los, por exemplo no vínculo de mais de uma forma de login à mesma conta. Sobre o gov.br, não afirma como funciona nem se é possível em software privado sem fonte em `docs/referencias/`: o que faltar vai para a pergunta do CA-21. Nenhum login é implementado.

### O que não pode ser bloqueado

- **CA-23:** O documento mostra que a arquitetura não impede a antecipação de crédito com instituições financeiras parceiras no futuro (por exemplo: histórico por nota preservado, origem rastreável, forma de expor dados a terceiros com autorização do cliente), sem construir nada disso.
- **CA-24:** O documento trata a fonte de dados como peça substituível e diz como outra fonte (ERP, ou o equivalente do IBS se o Comitê Gestor publicar) entraria, sem desenhá-la nem tratar o ERP como canal.

### Segurança e ambientes

- **CA-25:** O documento lista os dados sensíveis (credencial, token, dados fiscais da empresa, dados pessoais de usuários e o `niConsumidor`) e a proteção de cada um em trânsito, em repouso e em log. O que depender de interpretação da LGPD vira pergunta para advogado, sem afirmar regra.
- **CA-26:** O documento diz como desenvolvimento e testes funcionam sem a API real e sem dado real (respostas simuladas, dados fictícios), coerente com as regras do `AGENTS.md`, e onde ficam as variáveis de ambiente e segredos de cada ambiente (só os nomes).

### Registros no projeto

- **CA-27:** O `PROJECT_CONTEXT.md` registra: as decisões tomadas, com data, em §3; a stack decidida em §4, no lugar da proposta não confirmada; que `app/painel` (030) é ferramenta interna de validação dos dados, **não** a primeira versão do produto para o usuário final, e que o dashboard do usuário será feito do zero; que integração com ERP não é o modelo (ERP é só possível fonte de dados); e uma linha no changelog.
- **CA-28:** O `docs/produto/hipoteses.md` registra as perguntas novas sem fonte (inclusive a do login do gov.br) e marca como resolvida a decisão em aberto "Stack do backend e hospedagem", com a data e o link para o documento.
- **CA-29:** Nenhum arquivo da demanda contém credencial, segredo, token, CNPJ real ou outro dado real de contribuinte.

## Fora de escopo

- Código, aplicação nova, infraestrutura, contas em provedor, domínio e CI.
- Chamar a API da Receita ou rodar `npm run consulta`; prova de conceito do cenário B.
- Tela, fluxo e regras do login (demanda posterior); permissões de cada papel; implementar qualquer login, inclusive federado (Google, Apple, gov.br).
- Desenho detalhado do cenário B (fica só o plano, CA-19).
- Design system (032) e dashboard (033): componentes, telas, identidade visual.
- Antecipação de crédito, compensação, geração de guia (RAD, PCONT), cobrança da assinatura e comissão do contador.
- Integração com ERP e coleta do IBS.
- Mudar `app/apuracao-cbs` ou `app/painel`.
- Regra tributária nova ou interpretação jurídica (LGPD, cessão de crédito).
- Verificar ou provar representação ou procuração do cliente: é da Receita, pela credencial (premissa de 2026-11-25).

## Perguntas em aberto

- **P-1 — Quando o responsável escolhe.** Recomendação: a Spec traz as alternativas com prós, contras e recomendação; o responsável escolhe ao aprovar a Spec; o documento final registra a escolha (CA-2).
- **P-2 — Stack da aplicação web e o design system (032).** A escolha do framework da interface afeta o design system. Recomendação: esta demanda decide o framework e a forma de renderização; a 032 decide tokens, componentes e biblioteca visual sobre ele. Se a 032 já estiver fixando biblioteca de componentes, alinhar antes da Spec.
- **P-3 — Alcance de "autenticação própria".** A decisão de 2026-08-25 exclui um serviço de identidade gerenciado? Recomendação: ler como "login do CreditoGov por email e senha, não do ERP"; um serviço gerenciado é aceitável se o usuário só vê o login do CreditoGov. O documento compara as duas formas (CA-22).
- **P-4 — Perguntar à Receita antes da Spec?** O cenário B depende de respostas operacionais (cobertura de vários CNPJs por credencial de procurador, contagem do limite) que só a Receita ou quem já integra pode dar. Recomendação: não esperar; a Spec desenha o cenário A e registra o plano do B, e o responsável leva as perguntas de CA-21 em paralelo.
