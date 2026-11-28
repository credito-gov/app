# 034-login — Login por e-mail e senha, convite e acesso por empresa

- **Status:** em-review
- **Spec aprovada:** 2026-11-27, pelo responsável ("Aprovo"), sobre o commit `9c72e76`
- **US aprovada:** 2026-11-27, pelo responsável ("Aceito todas"), sobre o commit `1d2a25c`, com as recomendações de P-1 a P-13
- **Tipo:** funcionalidade (primeira com código de produto: `app/backend` e `app/web`)
- **Branch:** `feat/034-login`
- **Worktree:** `.claude/worktrees/034-login`
- **Solicitante / data:** responsável pelo produto, 2026-11-27

## História

Como dono, responsável financeiro ou contador de uma empresa cliente, quero entrar no CreditoGov com o meu e-mail e uma senha que eu mesmo defini a partir de um convite, e ver só as empresas a que tenho acesso, para consultar o crédito delas sem expor os dados a quem não deveria vê-los.

Como contador que atende várias empresas, quero entrar uma vez e escolher entre as empresas que atendo, para trabalhar na carteira sem trocar de conta.

Como equipe CreditoGov, quero cadastrar uma empresa cliente e convidar a primeira pessoa dela, para que o acesso nasça sempre de alguém que sabemos quem é, sem cadastro aberto.

## Contexto

Primeira demanda que escreve código do produto. Nenhum backend existe; as tasks 001–005 do modelo antigo continuam suspensas e **não são especificação** ([`../../tasks/`](../../tasks/README.md)). A base é a arquitetura aprovada na 031 ([`../../arquitetura/README.md`](../../arquitetura/README.md)) e o design aprovado na 032 ([`../../design/README.md`](../../design/README.md), [`../../design/design-system.md`](../../design/design-system.md)).

### O que a arquitetura já decidiu (031)

- **AD-1 / AD-2:** Node 24 + TypeScript; `app/backend` com a API em Fastify. O coletor é o segundo ponto de entrada do mesmo pacote, mas **não é construído aqui**.
- **AD-3:** `app/web`, React 19 + Vite + TypeScript, página única que só fala com a API.
- **AD-4 / AD-5:** PostgreSQL, acesso por Kysely.
- **AD-6:** tabelas compartilhadas com o identificador da empresa e segurança por linha do PostgreSQL, nas condições da AD-6 (papel de trabalho sem posse, sem `BYPASSRLS` e não superusuário; `FORCE ROW LEVEL SECURITY`; empresa fixada só por transação com `SET LOCAL` ou `set_config(..., true)`; migrações com outro papel). Entidades `empresa` (raiz do CNPJ, 8 dígitos), `usuario`, `vinculo_empresa` (o papel é decidido aqui) e `identidade`.
- **AD-7:** provedor de nuvem pendente (PD-1). Esta demanda roda local e não se amarra a provedor.
- **AD-12:** autenticação própria no backend: senha com `argon2id` por biblioteca consolidada, sessão guardada no servidor com cookie `HttpOnly` e `Secure`, `identidade` separada de `usuario`. A lista de provedores e quando entram é desta demanda.
- **Seção 8:** senha só como hash; e-mail nunca em log em texto; log só com identificador interno.
- **Seção 9 e R-3:** esta é a primeira demanda de backend e **confirma com teste** o isolamento por linha e a leitura de `numeric` como texto. Se o teste falhar, as segundas opções registradas (Drizzle; serviço de identidade gerenciado, AD-12 B) entram sem nova demanda de arquitetura, com registro no histórico da arquitetura.
- **Variáveis de ambiente propostas:** `CREDITOGOV_BANCO_URL`, `CREDITOGOV_SESSAO_SEGREDO`, `CREDITOGOV_AMBIENTE`. A Spec pode acrescentar ou ajustar nomes, registrando no histórico da arquitetura.

### O que o design já decidiu (032)

Telas aprovadas: login normal; login com "E-mail ou senha incorretos" (sem dizer qual dos dois, para não revelar se o e-mail tem conta) e botão carregando; login no celular sem conexão ("Sem conexão", "Tentar de novo"); link "Esqueci a senha"; texto "Ainda não tem acesso? Fale com a equipe CreditoGov ou com o seu contador."; painel da marca com três mensagens alternadas. Barra do topo com a empresa em foco, troca de empresa, avatar e saída da sessão. Campos de senha com mostrar/ocultar; erros ligados ao campo por `aria-describedby`.

O design **não** tem telas de aceitar convite, definir senha, redefinir senha, escolher empresa nem convidar pessoas. Elas são montadas só com os componentes e tokens do design system, sem nova rodada de design, e o responsável as confere no navegador na revisão (P-9).

### Decisões do responsável nesta demanda (2026-11-27)

- **D-1. Google e Microsoft ficam para depois.** Esta demanda entrega só e-mail e senha. Os botões "Entrar com Google" e "Entrar com Microsoft" do design saem da tela até uma demanda própria. Revê a decisão da 032 de 2026-11-25 **quanto ao momento**: o login federado continua previsto e a entidade `identidade` continua pronta para ele (AD-12). Registros a atualizar, numa task de documentação desta demanda (a Spec confirma):
  - [`../../PROJECT_CONTEXT.md`](../../PROJECT_CONTEXT.md) §3 (nova linha de decisão de 2026-11-27, citando as de 2026-08-25 e da 032), §2 (estado de "Backend, banco, autenticação"), §4 (o que existe) e §11;
  - [`../../design/README.md`](../../design/README.md), "Pontos de atenção", e [`../../design/design-system.md`](../../design/design-system.md), linha da tela de login (seção das telas) e a pendência "Provedores finais do login";
  - [`../../arquitetura/README.md`](../../arquitetura/README.md), seção 13 (histórico: lista de provedores desta demanda) e seção 11, se a Spec ajustar nomes de variáveis;
  - [`../../produto/hipoteses.md`](../../produto/hipoteses.md), "Papel do contador no sistema", resolvida por esta demanda.
- **D-2. A conta nasce por convite.** Não há cadastro aberto. A equipe CreditoGov cria a empresa e convida o titular ou o contador; quem já tem vínculo com uma empresa convida outras pessoas para ela. O convidado define a senha pelo link do convite.

### O que esta demanda entrega para a 033 (dashboard)

A US da 033 está aprovada na branch `feat/033-dashboard-indicadores` (não na `main`) e espera o login para a Spec. Esta demanda entrega a ela:

- **Sessão:** toda rota da área logada exige sessão válida; a API sabe qual usuário está na requisição.
- **Empresas do usuário:** a lista das empresas com vínculo ativo, com nome, raiz do CNPJ e papel, que alimenta a troca de empresa da barra do topo e a carteira do contador (CA-C1 a CA-C4 da 033).
- **Empresa em foco:** o mecanismo para a web dizer qual empresa está em foco, e a garantia de que a API só responde para empresa com vínculo ativo, fixando essa empresa (ou o conjunto das empresas do usuário, na carteira) na transação, como a AD-6 exige.
- **Isolamento provado:** o teste de R-3, para que as tabelas de dados fiscais da 033 e do coletor herdem a mesma regra.
- **Casca da área logada:** barra do topo com empresa em foco, troca de empresa e saída da sessão, com uma página inicial provisória no lugar do dashboard.

A 034 **não** entrega indicadores, carteira com valores nem dados fiscais.

## Critérios de aceite

"Usuário" é uma pessoa com conta; "vínculo" liga um usuário a uma empresa com um papel; "convite" é o pedido pendente de vínculo enviado a um e-mail. As respostas de P-1 a P-13 já estão nos critérios. Todo exemplo, teste e dado de desenvolvimento usa e-mails de domínio reservado para exemplo e CNPJ fictício (como `00.000.000/0001-00` do design), nunca dado real.

### Estrutura e verificação

- **CA-1:** Existem `app/backend` (API em Fastify, TypeScript, Node 24) e `app/web` (React 19 + Vite + TypeScript), cada um com `npm test`, `npm run lint` e `npm run build` passando, e com o comando de teste registrado no `AGENTS.md` e no `PROJECT_CONTEXT.md` §4, como a regra "Testes primeiro" pede para aplicação nova.
- **CA-2:** O esquema do banco é criado só por migrações versionadas, rodadas com um papel de migração que a API não usa. A API conecta com o papel de trabalho da AD-6 (sem posse das tabelas, sem `BYPASSRLS`, não superusuário).
- **CA-3:** Os testes rodam sem rede externa, sem `.env` e sem segredo real: o banco de teste é um PostgreSQL local, levantado por Docker Compose no repositório, com a versão fixada e escutando só em `127.0.0.1` (P-10) e o envio de e-mail é substituído por um adaptador em memória. Nenhum teste depende de provedor de nuvem.
- **CA-4:** Segredos e endereços (banco, segredo da sessão, endereço público da web para os links) vêm só de variável de ambiente. O repositório traz um exemplo com os nomes e sem valores; nenhum `.env`, senha, token ou credencial é commitado.

### Empresa e convite pela equipe CreditoGov

- **CA-5:** A equipe CreditoGov cria uma empresa informando a raiz do CNPJ (8 dígitos) e o nome, pelo comando administrativo `npm run admin` do `app/backend`, rodado por quem tem acesso ao banco (P-1). Raiz com formato inválido ou já cadastrada é recusada com mensagem que diz o motivo.
- **CA-6:** Pela mesma ação, a equipe convida uma pessoa para a empresa, por e-mail e com papel titular ou contador. O convite gera um link de uso único, válido por 7 dias (P-5), enviado ao e-mail pelo adaptador de envio (CA-27).
- **CA-7:** Nenhuma tela ou rota pública cria conta, empresa ou vínculo sem convite. A tela de login não tem "Criar conta"; mantém o texto "Ainda não tem acesso? Fale com a equipe CreditoGov ou com o seu contador."

### Convite por quem já tem vínculo

- **CA-8:** Um usuário com vínculo ativo numa empresa convida outra pessoa para **essa** empresa, por e-mail, com os papéis que o papel dele permite (P-2): o titular convida titular, contador e colaborador; o contador convida titular e colaborador; o colaborador não convida. Ele não consegue convidar para empresa em que não tem vínculo, nem com papel que não lhe é permitido: a API recusa, mesmo com a requisição montada à mão.
- **CA-9:** Convidar um e-mail que já tem vínculo ativo com a empresa é recusado com mensagem que diz isso a quem convida. Fora esse caso, quem convida vê sempre "Convite enviado", tenha ou não o e-mail conta no CreditoGov (P-13). Convidar de novo um e-mail com convite pendente para a mesma empresa invalida o link anterior e gera um novo.
- **CA-10:** Quem convidou e o momento do convite e da aceitação ficam registrados, sem a senha e sem o link.

### Aceitar convite e definir senha

- **CA-11:** O convidado sem conta abre o link, vê o nome da empresa e o papel, define a senha (regra de CA-14) e informa o nome. Ao concluir, a conta, a identidade de e-mail e senha e o vínculo são criados, o convite fica usado e ele entra na área logada já com sessão.
- **CA-12:** O convidado que já tem conta (por exemplo, o contador convidado para mais uma empresa) abre o link, entra com a senha que já tem e, ao aceitar, ganha o vínculo novo, sem definir outra senha. A senha dele não muda.
- **CA-13:** Link expirado, já usado, invalidado (CA-9) ou adulterado não cria conta nem vínculo; a tela diz que o convite não vale mais e orienta a pedir um novo a quem convidou.
- **CA-14:** A senha tem de 12 a 128 caracteres, sem exigência de tipos de caractere, e não pode estar na lista de senhas comuns guardada no próprio código, sem consulta a serviço externo (P-4). Senha fora da regra é recusada com mensagem no campo que diz o que falta. A senha é guardada só como hash `argon2id`; nenhuma tabela, log ou resposta guarda ou devolve a senha.

### Login

- **CA-15:** Com e-mail e senha corretos, o usuário entra e recebe a sessão (CA-19). O e-mail é comparado sem diferenciar maiúsculas e minúsculas e sem espaços nas pontas.
- **CA-16:** E-mail inexistente, senha errada, ou conta sem identidade de senha recebem a mesma resposta: o mesmo código, o mesmo corpo e a mensagem "E-mail ou senha incorretos". A verificação de hash roda também quando o e-mail não existe, para o tempo de resposta não revelar a diferença (o teste confirma que o caminho do e-mail inexistente executa a verificação).
- **CA-17:** Cinco tentativas erradas em 15 minutos, contadas por e-mail e por endereço de origem, bloqueiam novas tentativas por 15 minutos, com o aviso "Muitas tentativas. Tente de novo em alguns minutos." A contagem fica no banco, para valer com mais de uma instância da API (P-6). Enquanto o limite estiver ativo, a resposta não diz se o e-mail existe e não revela a senha certa nem se ela estava certa.
- **CA-18:** A tela de login segue o design aprovado, **sem** os botões de Google e Microsoft (D-1): campos de e-mail e senha (com mostrar/ocultar), botão em estado carregando durante o envio, alerta "E-mail ou senha incorretos", alerta "Sem conexão" com "Tentar de novo" quando a API não responde, "Esqueci a senha" e o texto de CA-7. Funciona em largura de celular e de desktop, e o painel da marca respeita `prefers-reduced-motion`.

### Sessão e logout

- **CA-19:** A sessão é guardada no servidor; o navegador recebe só um identificador aleatório num cookie `HttpOnly`, `Secure` e `SameSite`. O banco guarda o identificador só como hash. O JavaScript da página não lê o cookie.
- **CA-20:** A sessão expira por inatividade e por tempo máximo, depois de 2 horas sem uso ou 12 horas depois do login, o que vier antes. Não há "manter conectado" (P-3). Sessão expirada não dá acesso; a web leva à tela de login dizendo que a sessão expirou.
- **CA-21:** "Sair" encerra a sessão no servidor: o mesmo cookie, reapresentado, não dá mais acesso.
- **CA-22:** Ao entrar, o identificador de sessão é sempre novo (o anterior, se havia, deixa de valer). Requisições que mudam estado são protegidas contra envio a partir de outro site (a forma fica para a Spec), e o teste mostra a recusa.

### Recuperação de senha

- **CA-23:** Em "Esqueci a senha", o usuário informa o e-mail e vê sempre a mesma mensagem, exista ou não conta com ele ("Se houver uma conta com esse e-mail, enviaremos um link para criar uma nova senha"). Só quando existe conta com identidade de senha é enviado um link de uso único, válido por 1 hora (P-5).
- **CA-24:** Pelo link válido, o usuário define a nova senha (regra de CA-14). Ao concluir, o link fica usado e **todas** as sessões abertas dele são encerradas; ele entra de novo com a senha nova.
- **CA-25:** Link de recuperação expirado, já usado ou adulterado não troca a senha; a tela diz que o link não vale mais e oferece pedir outro. Pedir um link novo invalida o anterior.
- **CA-26:** Pedidos de recuperação seguem o mesmo limite de CA-17 (5 em 15 minutos, por e-mail e por origem, bloqueio de 15 minutos), sem que o limite revele se o e-mail existe.

### Envio de e-mail

- **CA-27:** O envio de e-mail (convite e recuperação) passa por uma interface de envio, sem provedor amarrado. Esta demanda traz dois adaptadores: em memória, para os testes, e local, que grava cada mensagem em arquivo numa pasta ignorada pelo git, para o desenvolvedor abrir o link. Nenhum provedor real é configurado (P-7); até ele entrar, convite e recuperação só funcionam no ambiente local.
- **CA-28:** O texto dos e-mails diz o que é o CreditoGov, quem convidou (no convite), para qual empresa, até quando o link vale e que, se a pessoa não pediu, pode ignorar. Sem promessa, número ou funcionalidade que não exista (`PROJECT_CONTEXT.md` §6).

### Papéis, empresas do usuário e empresa em foco

- **CA-29:** Cada vínculo tem um papel: `titular`, `contador` ou `colaborador` (P-2). Os três veem os mesmos dados da empresa nesta versão; diferem em convidar (CA-8) e remover vínculo (CA-34). Um usuário pode ter vínculo com várias empresas, e uma empresa com vários usuários.
- **CA-30:** A API devolve ao usuário logado só as empresas em que ele tem vínculo ativo, com nome, raiz do CNPJ formatada e papel. Nenhuma outra empresa aparece, nem por contagem.
- **CA-31:** Depois de entrar: com uma empresa, o usuário cai direto nela; com mais de uma, escolhe numa lista (a carteira com valores é da 033); sem nenhuma, vê uma mensagem que diz que ainda não tem acesso a empresa e a quem pedir, sem erro técnico.
- **CA-32:** A barra do topo mostra a empresa em foco (nome e CNPJ formatado), a troca de empresa (só com mais de uma), o avatar e "Sair", conforme o design. A página inicial é provisória e diz que o painel de créditos ainda não está disponível, sem número nem promessa de data.
- **CA-33:** Toda requisição da área logada que trata dado de empresa informa a empresa em foco, e a API confere o vínculo ativo antes de qualquer leitura. Para empresa sem vínculo ou inexistente, a resposta é a mesma, sem revelar se a empresa existe.
- **CA-34:** Removem vínculo a equipe CreditoGov, pelo `npm run admin`, e o titular, para qualquer vínculo da empresa dele; ninguém remove o último titular ativo de uma empresa (P-8). Contador e colaborador não removem vínculo. Vínculo removido deixa de dar acesso à empresa na requisição seguinte, inclusive em sessão já aberta.

### Isolamento entre empresas (R-3)

- **CA-35:** Toda tabela com dado de empresa tem o identificador da empresa e regra de segurança por linha com `FORCE ROW LEVEL SECURITY`. Um teste contra o PostgreSQL de teste, com o papel de trabalho, prova: sem empresa fixada, nenhuma linha volta; com a empresa A fixada, nenhuma linha da B volta, nem por leitura nem por escrita.
- **CA-36:** O mesmo teste prova que a empresa fixada por `SET LOCAL` ou `set_config(..., true)` não sobrevive à transação, inclusive com a mesma conexão reaproveitada pelo pool, e que o conjunto de empresas do usuário (carteira do contador) fixado na transação mostra só essas empresas.
- **CA-37:** O teste prova que o papel de trabalho não é dono das tabelas, não tem `BYPASSRLS` e não é superusuário, e falha se alguma tabela com dado de empresa estiver sem `FORCE ROW LEVEL SECURITY`.
- **CA-38:** Um teste prova que um valor `numeric` com casas decimais volta do banco pela camada de acesso (Kysely com o driver `pg`) como texto, sem perda, nunca como `number`. Se CA-35 a CA-38 não puderem ser atendidos com Kysely, a Spec registra o resultado e aplica a segunda opção da arquitetura (R-3).

### Segurança e registros

- **CA-39:** Nenhum log traz senha, hash, identificador de sessão, link ou token de convite e de recuperação, nem e-mail em texto; o log identifica o usuário pelo identificador interno (arquitetura, seção 8). Um teste confere isso nos fluxos de login, convite e recuperação.
- **CA-40:** Os registros de D-1 listados no Contexto estão atualizados em `PROJECT_CONTEXT.md`, no design, na arquitetura e em `hipoteses.md`, e o kanban reflete o status.

## Fora de escopo

- **Login federado** (Google, Microsoft, Apple, gov.br): demanda própria (D-1). A entidade `identidade` fica pronta, sem integração.
- **MFA:** fica fora desta demanda. A arquitetura lembra que, com autenticação própria, a equipe responde por ele; vira demanda própria antes de haver dado real de cliente no ar (P-11).
- Dashboard, indicadores, carteira com valores e qualquer dado fiscal (demanda 033).
- Coletor, credencial da Receita, consultas e arquivos brutos (demandas de backend seguintes). Por isso a parte do teste de isolamento sobre o **papel de agendamento** do coletor (seção 9, item 3) fica para a demanda do coletor, que cria a tabela `consulta` (P-12).
- Cadastro aberto, autocadastro de empresa, cobrança e assinatura.
- Troca de senha estando logado, troca de e-mail, edição de perfil e exclusão de conta (a recuperação de CA-23 a CA-25 cobre a troca de senha nesta versão).
- Provedor real de e-mail, domínio de envio, hospedagem, deploy e CI.
- Permissões por papel além de convidar e remover vínculo (por exemplo, o que cada papel pode ver no dashboard): todos os papéis com vínculo ativo veem os dados da empresa (P-2).
- Agrupar várias raízes de CNPJ num mesmo cliente ("Vários CNPJs por cliente", em aberto em `hipoteses.md`).
- Telas de administração para a equipe CreditoGov (o `npm run admin` basta, P-1).

## Perguntas em aberto

Respondidas pelo responsável em 2026-11-27 ("Aceito todas"): valem as recomendações abaixo, já levadas aos critérios.


- **P-1 (operação):** Como a equipe CreditoGov cria a empresa e o primeiro convite? Alternativas: (a) comando de linha de comando no `app/backend` (`npm run admin -- ...`), rodado por quem tem acesso ao banco; (b) usuário "equipe" com tela de administração na web; (c) inserção direta no banco. Recomendação: (a), porque não abre nova superfície pública nem exige papel especial na web, e é testável sem rede; a tela de administração vira demanda quando o volume pedir.
- **P-2 (papéis):** Quais papéis existem e quem convida com qual papel? Alternativas: (a) só `titular` e `contador`; titular convida titular e contador; contador convida titular e contador; (b) acrescentar `colaborador` (funcionário da empresa, por exemplo o financeiro), que vê os dados mas não convida; titular convida qualquer papel, contador convida titular e colaborador, colaborador não convida; (c) papel único, sem diferença. Recomendação: (b), porque a história inclui o "responsável financeiro" que não é titular nem contador, e o colaborador sem poder de convite limita quem espalha acesso; os três veem os mesmos dados nesta versão. Se o responsável preferir começar menor, (a).
- **P-3 (sessão):** Prazos da sessão. Alternativas: (a) 30 minutos de inatividade e 8 horas no máximo; (b) 2 horas de inatividade e 12 horas no máximo; (c) sessão longa com "manter conectado". Recomendação: (b): o dado é financeiro, mas o uso é de consulta ao longo do dia; o design não tem "manter conectado", e ele aumenta o risco em computador compartilhado.
- **P-4 (senha):** Regra da senha. Alternativas: (a) mínimo de 12 caracteres, sem exigir tipos de caractere, máximo de 128, recusando senhas de uma lista de senhas comuns embutida no código; (b) mínimo de 8 com letra, número e símbolo obrigatórios. Recomendação: (a): tamanho protege mais que composição e é mais fácil de explicar na tela; a lista é local, sem consulta a serviço externo.
- **P-5 (prazos dos links):** Validade do convite e do link de recuperação. Recomendação: convite válido por 7 dias (o convidado pode demorar a abrir) e recuperação por 1 hora (quem pede está esperando o e-mail); ambos de uso único.
- **P-6 (tentativas):** Limite de tentativas no login e nos pedidos de recuperação. Alternativas: (a) por e-mail e por endereço de origem, por exemplo 5 erros em 15 minutos bloqueiam novas tentativas daquele e-mail por 15 minutos, com a mesma mensagem genérica e aviso de "muitas tentativas, tente em alguns minutos"; (b) bloqueio da conta até a recuperação de senha; (c) sem limite nesta versão. Recomendação: (a), com o contador guardado no banco (funciona com mais de uma instância da API); (b) permite a qualquer um travar a conta de outro.
- **P-7 (e-mail):** Confirma que esta demanda não escolhe provedor de e-mail e entrega só os adaptadores em memória e local (CA-27)? Recomendação: sim; o provedor entra com a PD-1 e a hospedagem, e trocar o adaptador não muda o resto. Sem provedor, convite e recuperação só funcionam no ambiente local.
- **P-8 (remover acesso):** Quem remove um vínculo? Alternativas: (a) só a equipe CreditoGov, pela ação administrativa de P-1; (b) também o titular, para qualquer vínculo da empresa dele, exceto o último titular; (c) também o próprio usuário, saindo da empresa. Recomendação: (a) e (b): o titular precisa tirar um ex-funcionário ou trocar de contador sem depender da equipe, e a regra do último titular evita empresa sem dono. Se P-2 ficar em (c) (papel único), só (a).
- **P-9 (telas sem design):** Aceitar convite, definir e redefinir senha, escolher empresa, convidar pessoas e a lista de pessoas da empresa não têm tela aprovada na 032. Alternativas: (a) a implementação monta essas telas só com os componentes e tokens do design system, sem nova rodada no Claude Design, e o responsável confere no navegador na revisão; (b) uma rodada de design antes da Spec. Recomendação: (a): são formulários simples, e o design system já cobre campo, botão, alerta e tabela.
- **P-10 (banco local e de teste):** Como o PostgreSQL roda na máquina do desenvolvedor e nos testes? Alternativas: (a) Docker Compose no repositório, com a versão do PostgreSQL fixada, e os testes conectando nele em `127.0.0.1`; (b) PostgreSQL instalado na máquina, com instrução no README; (c) banco embutido em processo para testes. Recomendação: (a), porque fixa a versão, isola os papéis do teste de isolamento e se repete em qualquer máquina; (c) não garante o comportamento de segurança por linha e de papéis do PostgreSQL real. Requer Docker nas máquinas.
- **P-11 (MFA):** Confirma MFA fora desta demanda (Fora de escopo)? Recomendação: sim, com demanda própria antes de dado real de cliente no ar; a `identidade` não impede acrescentá-lo.
- **P-12 (escopo do teste de isolamento):** Confirma que o item 3 da seção 9 da arquitetura (papel de agendamento do coletor e a função `SECURITY DEFINER`) fica para a demanda do coletor? Recomendação: sim, porque a tabela `consulta` e a função não existem aqui; CA-35 a CA-38 cobrem os itens 1 e 2 e o `numeric`, e a demanda do coletor completa o R-3.
- **P-13 (e-mail do convite já em uso):** Quando alguém convida um e-mail que já tem conta, o convite diz isso a quem convidou? Recomendação: não; quem convida vê sempre "Convite enviado" (exceto se o e-mail já tem vínculo com a mesma empresa, CA-9, que ele já pode ver na lista de pessoas da empresa), para que o convite não sirva para descobrir quem tem conta no CreditoGov.
