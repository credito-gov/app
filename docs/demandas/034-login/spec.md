# 034-login — Spec

- **Status:** spec-aprovada
- **Spec aprovada:** 2026-11-27, pelo responsável ("Aprovo"), sobre o commit `9c72e76`, com DT-1 a DT-12 e as respostas de P-S1 e P-S2
- **US:** [`us.md`](us.md), aprovada em 2026-11-27 ("Aceito todas"), com as respostas de P-1 a P-13
- **Base:** [`../../arquitetura/README.md`](../../arquitetura/README.md) (AD-1 a AD-6, AD-12, seções 8 e 9, R-3) e [`../../design/design-system.md`](../../design/design-system.md)

## Critérios de aceite atendidos

Todos os CA da US: CA-1 a CA-40. Da arquitetura, ficam para depois o item 3 do teste de isolamento da seção 9 (papel de agendamento do coletor, P-12) e o login federado (D-1).

## Abordagem

Duas aplicações novas. **`app/backend`** é um pacote Node 24 + TypeScript (ESM) com a API em Fastify (o ponto de entrada `api`; o `coletor` fica para a demanda dele), Kysely com o driver `pg` sobre PostgreSQL, e um comando administrativo (`npm run admin`). **`app/web`** é uma página única em React 19 + Vite + TypeScript que só fala com a API em `/api`. As duas usam `vitest` e `oxlint`, como as aplicações que já existem.

A autenticação é própria (AD-12): senha com hash `argon2id`; sessão guardada no servidor, com o identificador num cookie `HttpOnly`, `Secure` e `SameSite=Strict`. O banco guarda só um HMAC dos tokens (sessão, convite e recuperação). `usuario` e `identidade` ficam separados: hoje existe só a identidade `senha`, e Google, Microsoft ou gov.br entram depois como novas linhas, sem mudar o modelo (D-1).

O isolamento segue a AD-6. As tabelas com dado de empresa têm `empresa_id`, segurança por linha e `FORCE ROW LEVEL SECURITY`. A API conecta com o papel de trabalho (sem posse das tabelas, sem `BYPASSRLS`, não superusuário), e cada transação fixa com `set_config(..., true)` o usuário e o conjunto de empresas permitido. **A empresa em foco vai no caminho da URL** (`/api/empresas/:empresaId/...`, e `/e/:empresaId/...` na web), nunca na sessão. Toda rota com empresa passa por um único auxiliar, que confere o vínculo ativo e fixa a empresa antes de qualquer leitura. A 033 usa o mesmo auxiliar.

O PostgreSQL local e o de teste sobem por Docker Compose, com a versão fixada e escutando só em `127.0.0.1` (P-10). Os testes do backend rodam contra esse banco, sem rede externa e sem `.env`. O envio de e-mail passa por uma interface, com dois adaptadores: em memória (testes) e arquivo (desenvolvimento local). Não há provedor real (P-7).

## Mudanças por camada

### Banco (`app/backend/banco`, `app/backend/src/banco`)

#### Docker Compose e papéis (CA-2, CA-3, P-10)

- `app/backend/compose.yaml`: um serviço `postgres` com a imagem oficial numa **tag exata** (versão 18; o Developer confere a tag publicada mais recente da série e a fixa, sem `latest`), porta `127.0.0.1:5433:5432` e volume nomeado. Autenticação `trust` (`POSTGRES_HOST_AUTH_METHOD=trust`), aceitável só porque a porta está presa ao `127.0.0.1` da máquina: não há senha em arquivo nenhum (ver Riscos).
- `app/backend/banco/init/01-papeis.sql`: roda uma vez, como superusuário do contêiner, na criação do volume. Cria:
  - `creditogov_migracao`: `LOGIN`, `NOBYPASSRLS`, não superusuário, dono das tabelas. Usado só pelas migrações;
  - `creditogov_app`: `LOGIN`, `NOBYPASSRLS`, não superusuário, sem posse de nenhuma tabela. Usado pela API e pelo `npm run admin`;
  - o banco `creditogov` (desenvolvimento), com dono `creditogov_migracao`.
  O banco de teste é recriado pelos testes (ver Estratégia de verificação).
- Scripts no `package.json`: `banco:subir` (`docker compose up -d --wait`), `banco:parar`, `banco:apagar` (`docker compose down -v`, apaga o volume local) e `migrar`.

Nesta demanda não há papel com `BYPASSRLS` nem função `SECURITY DEFINER`. O papel dono da função de agendamento (AD-6) nasce com o coletor (P-12).

#### Migrações (CA-2)

Migrações do Kysely (`Migrator` com `FileMigrationProvider`; na implementação, provedor estático, ver DT-14), em TypeScript, em `src/banco/migracoes/`, numeradas (`0001_...`). `npm run migrar` conecta por `CREDITOGOV_BANCO_MIGRACAO_URL`. A migração inicial:

1. cria as funções `app_usuario()` e `app_empresas()`, que leem `current_setting('app.usuario_id', true)` e `current_setting('app.empresas', true)` e devolvem `uuid` e `uuid[]`. Sem valor fixado, devolvem `NULL` e `'{}'`, e as regras não deixam passar nenhuma linha;
2. cria as tabelas do modelo de dados (abaixo);
3. liga `ENABLE` e `FORCE ROW LEVEL SECURITY` e cria as regras nas tabelas com `empresa_id`;
4. concede ao `creditogov_app` só o necessário (`SELECT`, `INSERT`, `UPDATE` e, onde há, `DELETE`), sem `TRUNCATE`, `REFERENCES` nem `TRIGGER`, e `EXECUTE` nas duas funções.

#### Modelo de dados

Tipos: `uuid` gerado pelo banco (`gen_random_uuid()`), datas em `timestamptz`, texto em `text` com `CHECK` de tamanho.

| Tabela | Colunas principais | Segurança por linha | CA |
|---|---|---|---|
| `empresa` | `id`, `cnpj_raiz` (`char(8)`, só dígitos, `UNIQUE`), `nome` (1 a 200), `criada_em` | Sim: `id = ANY(app_empresas())` em leitura e escrita | CA-5, CA-30 |
| `usuario` | `id`, `nome` (1 a 120), `email_normalizado` (`UNIQUE`), `criado_em` | Não: não é dado de empresa (seção 8 da arquitetura) | CA-11, CA-15 |
| `identidade` | `id`, `usuario_id`, `provedor` (`CHECK` em `'senha'` por ora), `sujeito` (o e-mail normalizado, na senha), `hash_senha` (nulo para provedor externo), `criada_em`, `senha_alterada_em`; `UNIQUE (provedor, sujeito)` | Não | CA-14, CA-15, D-1 |
| `vinculo_empresa` | `id`, `empresa_id`, `usuario_id`, `papel` (`CHECK` em `titular`, `contador`, `colaborador`), `convite_id`, `criado_em`, `removido_em`, `removido_por` (nulo quando a equipe removeu); índice único parcial `(empresa_id, usuario_id) WHERE removido_em IS NULL` | Sim. Leitura: `empresa_id = ANY(app_empresas()) OR usuario_id = app_usuario()`. Escrita: só `empresa_id = ANY(app_empresas())` | CA-29, CA-30, CA-34 |
| `convite` | `id`, `empresa_id`, `email_normalizado`, `papel`, `token_hmac` (`UNIQUE`), `criado_por` (nulo quando a equipe convidou), `origem` (`equipe` ou `usuario`), `criado_em`, `expira_em`, `usado_em`, `aceito_por`, `invalidado_em` | Sim: `empresa_id = ANY(app_empresas())` | CA-6, CA-9, CA-10, CA-13 |
| `sessao` | `id`, `usuario_id`, `token_hmac` (`UNIQUE`), `criada_em`, `ultimo_uso_em`, `expira_em` (`criada_em` + 12 h), `encerrada_em`, `motivo_encerramento` (`saida`, `nova_senha`) | Não | CA-19 a CA-22, CA-24 |
| `recuperacao_senha` | `id`, `usuario_id`, `token_hmac` (`UNIQUE`), `criada_em`, `expira_em` (+1 h), `usada_em`, `invalidada_em` | Não | CA-23 a CA-25 |
| `falha_acesso` | `id`, `tipo` (`login`, `recuperacao`), `chave_hmac`, `em`; índice `(tipo, chave_hmac, em)` | Não | CA-17, CA-26 |
| `bloqueio_acesso` | `tipo`, `chave_hmac`, `ate`; chave primária `(tipo, chave_hmac)` | Não | CA-17, CA-26 |

Nenhuma tabela guarda senha em texto, token em texto ou CNPJ completo. `chave_hmac` é o HMAC do e-mail normalizado ou do endereço de origem, e não o valor em si.

#### Transação com empresa fixada (CA-33, CA-35, CA-36)

`src/banco/transacao.ts` oferece três funções. São a única porta da API ao banco:

- `naSessaoDoUsuario(usuarioId, fn)`: abre a transação e fixa `app.usuario_id`. Com isso, `vinculo_empresa` mostra só os vínculos desse usuário e as outras tabelas com empresa não mostram nada;
- `naEmpresa(usuarioId, empresaId, fn)`: abre a transação, fixa `app.usuario_id`, confere que há vínculo ativo do usuário com `empresaId` e só então fixa `app.empresas = {empresaId}`. Sem vínculo, lança `EmpresaNaoEncontrada`, que vira a mesma resposta para empresa inexistente e para empresa sem vínculo (CA-33);
- `naCarteira(usuarioId, fn)`: fixa `app.empresas` com o conjunto das empresas com vínculo ativo (carteira do contador, para a 033).

Todas usam `set_config(nome, valor, true)` dentro da transação do Kysely (`db.transaction().execute`), nunca `SET` de sessão. Há ainda uma `semUsuario(fn)`, para login, recuperação e consulta de convite, que não fixa nada. Fora dessas funções, nenhum módulo recebe a instância do Kysely.

### API (`app/backend/src/api`)

#### Estrutura

```
app/backend/
  compose.yaml
  banco/init/01-papeis.sql
  src/
    api/          servidor Fastify, rotas, plugin de sessão, proteção contra requisição de outro site
    admin/        comando npm run admin
    autenticacao/ senha, tokens, limite de tentativas, sessão
    convites/     criação, consulta e aceitação
    empresas/     empresas do usuário, pessoas, remoção de vínculo
    email/        interface e adaptadores (memória, arquivo), modelos de texto
    banco/        conexão, transações, migrações, tipos do esquema
    config.ts     leitura e validação das variáveis de ambiente
    registro.ts   logger com redação
  test/
```

`config.ts` lê `process.env` uma vez e valida: valor obrigatório ausente impede a API de iniciar, com mensagem que diz o nome da variável e nunca o valor (CA-4). Os testes montam a configuração direto em código, com valores fictícios, sem `.env` (CA-3). `npm run dev` usa `node --env-file-if-exists=.env`, então o `.env` local é opcional e nunca é commitado.

#### Senha (CA-14, P-4)

- `argon2id` pela biblioteca `argon2` (node-argon2), com os parâmetros padrão dela. Nos testes, o custo cai por configuração, para não deixar a suíte lenta.
- Regra: de 12 a 128 caracteres, contados em pontos de código Unicode depois de normalizar em NFC, sem exigência de tipos de caractere, e fora da lista de senhas comuns. A lista vem da dependência `@zxcvbn-ts/language-common` (MIT), filtrada em tempo de execução por `src/autenticacao/senhasComuns.ts`, sem consulta a serviço externo (DT-17). A comparação ignora maiúsculas e minúsculas. A resposta de recusa diz qual regra falhou: tamanho mínimo, tamanho máximo ou senha comum.

#### Tokens (CA-6, CA-19, CA-23)

Todo token tem 32 bytes de `crypto.randomBytes`, codificados em base64url. O banco guarda `HMAC-SHA-256(CREDITOGOV_SESSAO_SEGREDO, token)`, e a comparação é por igualdade desse valor. O segredo precisa ter pelo menos 32 bytes, senão a API não inicia.

Os links vão no **fragmento** da URL da web, que o navegador não manda ao servidor nem põe no `Referer`:

- convite: `<CREDITOGOV_WEB_URL>/convite#e=<empresaId>&t=<token>`;
- recuperação: `<CREDITOGOV_WEB_URL>/redefinir-senha#t=<token>`.

A web lê o fragmento, apaga-o do endereço (`history.replaceState`) e manda o token à API **no corpo** de um `POST`. Assim, token nenhum aparece em URL de requisição nem em log (CA-39).

#### Sessão (CA-19 a CA-22, P-3)

Implementação própria em `src/autenticacao/sessao.ts`, sem `@fastify/session`, porque a sessão precisa ficar no banco, com HMAC e encerramento em massa.

- **Cookie** `cg_sessao`: `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/api` e `Max-Age` de 12 h, via `@fastify/cookie`, sem assinatura (o valor já é aleatório).
- **Validade:** a sessão vale se não foi encerrada, se `agora < expira_em` (12 h depois do login) e se `agora < ultimo_uso_em + 2 h`. `ultimo_uso_em` é atualizado no máximo uma vez por minuto. Não há "manter conectado".
- **Login:** cria sempre uma sessão nova. Se a requisição trouxe um cookie de sessão válido, essa sessão é encerrada antes (CA-22).
- **Saída:** marca `encerrada_em` e devolve o cookie vencido (CA-21).
- **Nova senha:** encerra todas as sessões abertas do usuário (CA-24).
- **Recusa:** cookie ausente, desconhecido ou encerrado dá `401 sem_sessao`; sessão que venceu por tempo dá `401 sessao_expirada`. A web usa esse código para dizer que a sessão expirou (CA-20).

#### Proteção contra requisição de outro site (CA-22)

Três barreiras:

1. o cookie é `SameSite=Strict`;
2. todo método que muda estado (`POST`, `PUT`, `PATCH`, `DELETE`) exige o cabeçalho `X-CreditoGov-Requisicao: 1`. Um formulário de outro site não consegue enviá-lo, e um `fetch` de outra origem dispara uma verificação prévia, que a API não autoriza: não há CORS configurado;
3. quando a requisição traz `Origin`, ele tem de ser igual à origem de `CREDITOGOV_WEB_URL`.

Se qualquer barreira falhar, a resposta é `403 origem_recusada`.

A API também responde com `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff` e `Cache-Control: no-store` nas rotas de `/api`.

#### Limite de tentativas (CA-17, CA-26, P-6)

`src/autenticacao/limite.ts`, com relógio injetável para os testes.

- **Chaves:** `HMAC(e-mail normalizado)` e `HMAC(endereço de origem)`, contadas em separado e por tipo (`login` ou `recuperacao`). O endereço de origem é `request.ip`. `CREDITOGOV_CONFIAR_PROXY` é a lista dos endereços de proxy confiáveis, passada ao `trustProxy` do Fastify. Vazia ou ausente, a API não confia em proxy nenhum (DT-18).
- **Login:** antes de verificar a senha, se alguma das duas chaves tem `bloqueio_acesso.ate > agora`, a resposta é `429 muitas_tentativas` ("Muitas tentativas. Tente de novo em alguns minutos."), sem verificar a senha. Cada falha grava uma linha em `falha_acesso` para as duas chaves. Ao chegar a 5 falhas nos últimos 15 minutos numa chave, ela fica bloqueada por 15 minutos (`ate = agora + 15 min`). O login certo apaga as falhas da chave do e-mail. As tentativas feitas durante o bloqueio não o prolongam.
- **Recuperação:** cada pedido conta como uma ocorrência, exista ou não a conta, com a mesma regra de 5 em 15 minutos e bloqueio de 15 minutos. Como a contagem não depende de a conta existir, o limite não revela nada.
- **Limpeza:** as linhas de `falha_acesso` com mais de 24 h são apagadas durante a própria gravação. Não há tarefa agendada.

#### Login sem revelar o e-mail (CA-15, CA-16)

O e-mail é normalizado assim: sem espaços nas pontas, em NFC, em minúsculas. Se não há identidade `senha` para esse e-mail, a API verifica a senha recebida contra um hash fictício gerado na inicialização, com os mesmos parâmetros, e descarta o resultado. A resposta de erro é sempre `401 {"erro":"credencial_invalida","mensagem":"E-mail ou senha incorretos"}`. O teste injeta um verificador espião e confirma que ele roda no caminho do e-mail inexistente (CA-16).

#### Convites (CA-6, CA-8 a CA-13, P-2, P-5, P-13)

- **Quem pode convidar** (tabela em `src/convites/permissoes.ts`): o titular convida titular, contador e colaborador; o contador convida titular e colaborador; o colaborador não convida. A equipe, pelo `admin`, convida titular ou contador. A API confere a permissão pelo papel do vínculo ativo, lido do banco, e nunca por um dado vindo do cliente.
- **Criação:** dentro de `naEmpresa`. Se o e-mail já tem vínculo ativo com a empresa, a resposta é `409 ja_vinculado`. Se há convite pendente para o mesmo e-mail e a mesma empresa, ele é invalidado (`invalidado_em`) e nasce um novo. Em qualquer outro caso, a resposta é `202 {"mensagem":"Convite enviado"}`, tenha o e-mail conta ou não (P-13). O convite vale 7 dias.
- **Consulta pelo link:** o link traz o `empresaId`. A API fixa essa empresa na transação **sem usuário**, procura o convite pelo HMAC do token e só o aceita se não estiver usado, invalidado nem vencido. Esta é a única leitura de dado de empresa autorizada por token, e não por vínculo. Ela fica restrita à empresa do link e ao convite daquele token. Em qualquer falha, a resposta é `410 convite_invalido` (CA-13).
- **Aceitação, sem conta:** cria `usuario`, `identidade` e `vinculo_empresa`, marca o convite como usado e abre a sessão, tudo numa transação só (CA-11).
- **Aceitação, com conta:** verifica a senha da identidade do e-mail do convite, com o mesmo limite de tentativas do login. Cria o vínculo, marca o convite e abre a sessão. A senha não muda (CA-12).
- **Registro:** quem convidou (`criado_por` e `origem`), `criado_em`, `usado_em` e `aceito_por` ficam no convite (CA-10).

#### Remoção de vínculo (CA-34, P-8)

Dentro de `naEmpresa`, só o titular remove. A API trava com `SELECT ... FOR UPDATE` os vínculos ativos de titular da empresa e recusa com `409 ultimo_titular` se a remoção deixaria a empresa sem titular. A remoção marca `removido_em` e `removido_por`, sem apagar a linha. Como `naEmpresa` confere o vínculo a cada requisição, o acesso termina na requisição seguinte, mesmo com a sessão aberta.

#### Comando administrativo (CA-5, CA-6, CA-34, P-1)

`npm run admin -- <comando>`, com `CREDITOGOV_BANCO_URL` (o papel de trabalho; nenhum papel especial). Cada comando fixa a empresa na transação, como a API:

| Comando | Faz | CA |
|---|---|---|
| `criar-empresa --cnpj-raiz <8 dígitos> --nome <nome>` | Gera o `id`, fixa-o na transação e grava. Aceita a raiz com ou sem pontuação. Raiz inválida ou já cadastrada é recusada com o motivo. Imprime o `id` | CA-5 |
| `convidar --empresa <id> --email <e-mail> --papel <titular\|contador>` | Cria o convite com origem `equipe` e manda o e-mail pelo adaptador | CA-6 |
| `empresas-do-usuario --email <e-mail>` | Lista `id`, nome e papel das empresas com vínculo do usuário (para reencontrar um `id`) | CA-5 |
| `remover-vinculo --empresa <id> --email <e-mail>` | Remove o vínculo, com a mesma regra do último titular | CA-34 |

A saída não imprime token, link nem hash. O link do convite sai só no e-mail, que no ambiente local é um arquivo (CA-27).

#### E-mail (CA-27, CA-28, P-7)

- **Interface:** `EnvioEmail.enviar({ para, assunto, texto })`.
- **Adaptadores:** `memoria`, que guarda as mensagens num vetor que os testes leem, e `arquivo`, que grava um `.txt` por mensagem em `app/backend/.local/emails/`, ignorado pelo git. A escolha é por `CREDITOGOV_EMAIL` (`arquivo` ou `memoria`). Com `CREDITOGOV_AMBIENTE=producao`, a API não inicia, porque não há adaptador real (P-7).
- **Textos:** os dois modelos, em `src/email/modelos.ts`, seguem CA-28:
  - convite: o que é o CreditoGov em uma frase (o mesmo vocabulário da landing, sem promessa), quem convidou (nome do usuário, ou "a equipe CreditoGov"), o nome da empresa, o papel, o link, a validade ("válido até DD/MM/AAAA HH:MM", no fuso `America/Sao_Paulo`) e "Se você não esperava este convite, ignore esta mensagem.";
  - recuperação: o link, a validade de 1 hora e "Se você não pediu, ignore esta mensagem; sua senha não muda."

#### Logs (CA-39)

Pino, o logger do Fastify:

- `redact` em `req.headers.cookie`, `req.headers.authorization` e `res.headers["set-cookie"]`;
- sem registrar corpo de requisição nem de resposta;
- os eventos próprios (`login_ok`, `login_recusado`, `convite_criado`, `convite_aceito`, `recuperacao_pedida`, `senha_redefinida`, `vinculo_removido`, `sessao_encerrada`) levam só `usuarioId`, `empresaId` e `conviteId` (`uuid`), nunca e-mail, CNPJ, token, link ou hash;
- `login_recusado` não leva identificador de usuário, para o log não revelar se a conta existe.

### Web (`app/web`)

#### Estrutura e ferramentas (CA-1, CA-18, P-9)

- React 19, Vite e TypeScript, com o mesmo `oxlint` da landing. Rotas com `react-router` (modo de biblioteca, `createBrowserRouter`). Testes com `vitest`, `jsdom` e `@testing-library/react`, com o `fetch` simulado.
- **Estilo:** `tokens.css` e `bundle.css` copiados de `docs/design/tokens/` para `src/estilo/`, com um comentário de origem no topo. As classes são as `cg-` do design system, e não há outra biblioteca visual. Só o tema claro (`data-theme="claro"`), sem seletor de tema (P-S2).
- **Fonte e logo:** Inter servida pelo próprio app (`@fontsource-variable/inter`), sem chamada ao Google Fonts. Logo copiado de `docs/design/assets/logo.png` para `public/`.
- **Desenvolvimento:** `npm run dev` em `http://localhost:5173`, com proxy do Vite de `/api` para a API em `http://127.0.0.1:3000`. Mesma origem: o cookie vale sem CORS.

```
app/web/src/
  main.tsx, rotas.tsx
  api/cliente.ts            fetch com cabeçalho X-CreditoGov-Requisicao, credentials same-origin, erros tipados
  sessao/ProvedorSessao.tsx sessão atual (GET /api/sessao), entrar, sair
  paginas/                  Entrar, EsqueciSenha, RedefinirSenha, AceitarConvite, EscolherEmpresa, Inicio, Pessoas
  componentes/              BarraTopo, TrocaEmpresa, PainelMarca, CampoSenha, Alerta, LayoutEmpresa
  estilo/                   tokens.css, bundle.css, app.css
```

#### Cliente da API (CA-18, CA-20)

`api/cliente.ts` devolve um resultado tipado:

- `ok`;
- `erro` com o código da API;
- `sem_conexao`, quando o `fetch` lança erro de rede ou a resposta é 502, 503 ou 504 do proxy. Uma resposta 502 com corpo de erro tipado da API (`{erro}`, por exemplo `email_nao_enviado`) é erro tipado, não `sem_conexao` (DT-19).

Um `401` com `sessao_expirada` ou `sem_sessao` em rota logada leva a `/entrar?motivo=expirada` ou a `/entrar`. A 033 usa este cliente. A biblioteca de cache por empresa (AD-3) é decisão da Spec dela.

#### Telas e rotas

| Rota | Tela | CA |
|---|---|---|
| `/` | Redireciona: sem sessão, para `/entrar`; com sessão, como em CA-31 | CA-31 |
| `/entrar` | Login do design **sem** Google e Microsoft: painel da marca, e-mail, senha com mostrar/ocultar, botão "Entrar" com estado carregando, alerta "E-mail ou senha incorretos", alerta "Sem conexão" com "Tentar de novo", alerta de muitas tentativas, "Esqueci a senha" e "Ainda não tem acesso? Fale com a equipe CreditoGov ou com o seu contador." Com `?motivo=expirada`, um alerta de informação "Sua sessão expirou. Entre de novo." Não há "Criar conta" | CA-7, CA-15 a CA-18, CA-20 |
| `/esqueci-senha` | Campo de e-mail. Depois de enviar, sempre a mensagem de CA-23 | CA-23, CA-26 |
| `/redefinir-senha#t=` | Nova senha e confirmação, com a regra de CA-14 explicada ao lado do campo. Se o link não vale, "Este link não vale mais" e um link para pedir outro. Ao concluir, vai para `/entrar` com "Senha alterada. Entre com a nova senha." (alerta de sucesso) | CA-24, CA-25 |
| `/convite#e=&t=` | Mostra a empresa (nome e CNPJ raiz) e o papel. Sem conta: nome, senha e confirmação. Com conta: o e-mail do convite, mascarado, e o campo de senha atual. Se o convite não vale, a mensagem de CA-13 | CA-11 a CA-14 |
| `/empresas` | Com várias empresas, a lista (nome, CNPJ raiz formatado, papel), cada uma levando a `/e/:empresaId`. Sem nenhuma, "Você ainda não tem acesso a nenhuma empresa. Peça um convite à equipe CreditoGov ou ao seu contador." e "Sair" | CA-31 |
| `/e/:empresaId` | `LayoutEmpresa` com `BarraTopo` e a página inicial provisória: "O painel de créditos ainda não está disponível nesta versão.", sem número nem data | CA-32 |
| `/e/:empresaId/pessoas` | Pessoas com vínculo (nome, e-mail, papel, desde quando) e convites pendentes (e-mail, papel, validade). Formulário "Convidar" só com os papéis permitidos ao usuário. "Remover" só para o titular, desabilitado no último titular com o motivo | CA-8, CA-9, CA-34 |
| `/e/:empresaId` com empresa sem vínculo | "Empresa não encontrada ou sem acesso" e o link para `/empresas` | CA-33 |

- **`BarraTopo`:** `cg-appbar` com o logo, `cg-topnav` (por ora "Início" e "Pessoas"), a empresa em foco (`cg-company-name` e `cg-company-meta` com "CNPJ raiz 11.111.111"), a troca de empresa (`cg-company-switch`, só com mais de uma empresa, levando a `/e/:outraId` pela lista de `GET /api/empresas`), `cg-avatar` com as iniciais e "Sair" (CA-32).
- **`PainelMarca`** (P-S1): textos do artboard "Login" do canvas da 032, lidos pela sessão principal em 2026-11-27. Cada mensagem tem título, subtítulo e um cartão ilustrativo montado com componentes do design system:

  | # | Título | Subtítulo | Cartão |
  |---|---|---|---|
  | 1 | "Veja o crédito de CBS das suas compras, nota a nota." | "Quanto a Receita registrou nas notas de compra da sua empresa, num só lugar." | "Crédito apurado nas compras", um valor fictício, "896 notas de compra" e o selo "Exemplo fictício" |
  | 2 | "Saiba o que ainda está a apropriar e de quem vem." | "O crédito que a Receita ainda não liberou, agrupado pelo emitente de cada nota." | "A apropriar, por emitente", com CNPJs fictícios do tipo `22.222.222/0001-22`, a linha "Emitente não identificado" e o selo "Exemplo fictício" |
  | 3 | "Saiba até quando cada número está atualizado." | "Os dados vêm da API de apuração da CBS da Receita Federal. O IBS ainda não está nessa fonte." | "Créditos atualizados em <data>", "Consulta à API de apuração da CBS da Receita" e o selo "Só CBS" |

  Os valores e a data dos cartões são fictícios, fixos no código e iguais aos do artboard (P-S3, resolvida em 2026-11-28; valores em DT-13). A troca é a cada 6 segundos. Ela pausa sob o ponteiro e com o foco, e não acontece sozinha com `prefers-reduced-motion: reduce`. Os pontos são `button` com `aria-label` "Mensagem N de 3" e `aria-current` na mensagem atual. O texto fica numa região `aria-live="polite"`.
- **Formulário de login** (P-S1): os textos seguem o artboard: "Entrar", "E-mail", "Senha", "Mostrar senha", "Esqueci a senha" e "Ainda não tem acesso? Fale com a equipe CreditoGov ou com o seu contador.". **Ajuste decorrente de D-1:**
  - o subtítulo do artboard, "Use a conta da sua empresa ou o e-mail cadastrado no CreditoGov.", fala dos provedores que saíram e passa a ser "Use o e-mail cadastrado no CreditoGov.";
  - o divisor "ou com e-mail" sai junto com os botões de Google e Microsoft.

  Não é texto novo nem promessa: é a retirada do que se referia aos provedores.

### Documentação (CA-1, CA-40)

Numa task própria, no fim:

- **`AGENTS.md`:** regra "Testes primeiro" e seção "Comandos" com o `app/backend` (`npm run banco:subir` antes de `npm test`; `migrar`, `admin`, `dev`) e o `app/web` (`npm test`, `lint`, `build`, `dev`). Agentes não apontam o backend para banco que não seja o local.
- **`docs/PROJECT_CONTEXT.md`:**
  - §2: "Backend, banco, autenticação" passa a dizer que o login foi construído (034) e que o coletor e os dados fiscais não existem;
  - §3: decisão de 2026-11-27, que Google e Microsoft ficam para demanda própria, a conta nasce por convite e os papéis são titular, contador e colaborador; revê o momento da decisão da 032 e cita as de 2026-08-25 e 2026-11-25;
  - §4: "o que existe" do backend e da web;
  - §7: as duas pastas novas;
  - §11: linha no changelog.
- **`docs/design/README.md`** (Pontos de atenção) e **`docs/design/design-system.md`** (tela de login na seção 4 e item da seção 7): os botões de provedor externo saem até demanda própria; as telas novas da 034 usam só componentes do design system (P-9).
- **`docs/arquitetura/README.md`**, seção 13 (histórico):
  - a lista de provedores da AD-12 é só a senha por ora (D-1);
  - as variáveis novas (`CREDITOGOV_BANCO_MIGRACAO_URL`, `CREDITOGOV_WEB_URL`, `CREDITOGOV_EMAIL`, `CREDITOGOV_CONFIAR_PROXY`, `CREDITOGOV_API_PORTA`) e o uso de `CREDITOGOV_SESSAO_SEGREDO` como chave de HMAC dos tokens;
  - o resultado de R-3 (CA-35 a CA-38).
- **`docs/produto/hipoteses.md`:** "Papel do contador no sistema" resolvido. O contador tem acesso próprio, por vínculo, a cada empresa que o convidou.
- `app/backend/README.md` e `app/web/README.md`: como subir, migrar, criar empresa, convidar e abrir o e-mail local.

## Contratos

Todas as rotas ficam sob `/api` e usam JSON. Os erros têm a forma `{"erro": "<codigo>", "mensagem": "<texto para o usuário>"}`. A validação de entrada é por JSON Schema do Fastify, e um campo inválido dá `400 entrada_invalida`, com `campos: [{campo, mensagem}]`. A empresa é representada assim:

```json
{ "id": "uuid", "nome": "Comércio Exemplo Ltda.", "cnpjRaiz": "11111111", "cnpjRaizFormatado": "11.111.111", "papel": "titular" }
```

### Sem sessão

| Método e rota | Entrada | Respostas | CA |
|---|---|---|---|
| `POST /api/sessao` | `{email, senha}` | `200 {usuario: {id, nome}, empresas: Empresa[]}` com `Set-Cookie`; `401 credencial_invalida`; `429 muitas_tentativas` | CA-15 a CA-17, CA-19, CA-22 |
| `POST /api/recuperacao` | `{email}` | `202 {mensagem}` sempre; `429 muitas_tentativas` | CA-23, CA-26 |
| `POST /api/recuperacao/confirmar` | `{token, senha}` | `204`, encerrando todas as sessões; `400 senha_invalida {regra}`; `410 link_invalido` | CA-24, CA-25 |
| `POST /api/convites/consultar` | `{empresaId, token}` | `200 {empresa: {nome, cnpjRaizFormatado}, papel, emailMascarado, contaExistente}`; `410 convite_invalido` | CA-11 a CA-13 |
| `POST /api/convites/aceitar` | `{empresaId, token, senha, nome?}` (`nome` exigido sem conta) | `200` como `POST /api/sessao`; `400 senha_invalida`; `401 credencial_invalida` (conta existente, senha errada); `410 convite_invalido`; `429` | CA-11 a CA-14 |

`contaExistente` só é mostrado a quem tem o token, que chegou ao próprio e-mail. Quem convida não recebe essa informação (P-13).

### Com sessão (exigem o cookie; os métodos que mudam estado exigem `X-CreditoGov-Requisicao: 1`)

| Método e rota | Entrada | Respostas | CA |
|---|---|---|---|
| `GET /api/sessao` | — | `200 {usuario: {id, nome}, empresas: Empresa[]}`; `401 sem_sessao` ou `sessao_expirada` | CA-19, CA-20, CA-30 |
| `DELETE /api/sessao` | — | `204` com o cookie vencido | CA-21 |
| `GET /api/empresas` | — | `200 Empresa[]`, só com vínculo ativo, ordenadas por nome | CA-30, CA-31 |
| `GET /api/empresas/:empresaId` | — | `200 Empresa`; `404 empresa_nao_encontrada` | CA-32, CA-33 |
| `GET /api/empresas/:empresaId/pessoas` | — | `200 {vinculos: [{usuarioId, nome, email, papel, desde}], convitesPendentes: [{id, email, papel, expiraEm}], podeConvidar: Papel[], podeRemover: boolean}`; `404` | CA-8, CA-9, CA-34 |
| `POST /api/empresas/:empresaId/convites` | `{email, papel}` | `202 {mensagem: "Convite enviado"}`; `403 papel_nao_permitido`; `409 ja_vinculado`; `404` | CA-8 a CA-10 |
| `DELETE /api/empresas/:empresaId/vinculos/:usuarioId` | — | `204`; `403 papel_nao_permitido`; `409 ultimo_titular`; `404` | CA-34 |

Qualquer rota com empresa sem vínculo ativo, inexistente ou com `:empresaId` que não é `uuid` responde `404 {"erro":"empresa_nao_encontrada","mensagem":"Empresa não encontrada ou sem acesso."}` (CA-33). Qualquer método que muda estado sem o cabeçalho ou com `Origin` diferente responde `403 origem_recusada` (CA-22).

### O que a 033 consome

- **Sessão e empresas:** `GET /api/sessao` e `GET /api/empresas`, nas formas acima. `papel` vem em cada empresa, e a carteira do contador (CA-C1 da 033) parte dessa lista.
- **Rotas de dado de empresa:** sempre sob `/api/empresas/:empresaId/...`, com o auxiliar `rotaDeEmpresa`. É um gancho do Fastify (`onRequest` na implementação, DT-16) que exige sessão, valida o `uuid` e expõe `request.naEmpresa(fn)`, que chama `naEmpresa(usuarioId, empresaId, fn)`. A carteira fica sob `/api/carteira/...`, com `request.naCarteira(fn)`. Nenhuma rota recebe a instância do Kysely de outro jeito.
- **Tabelas novas com dado de empresa** (créditos, débitos, consultas): coluna `empresa_id`, `ENABLE` e `FORCE ROW LEVEL SECURITY`, e regra `empresa_id = ANY(app_empresas())`. O teste de CA-37 descobre sozinho, pelo catálogo, toda tabela com coluna `empresa_id` e falha se faltar `FORCE` ou regra. As tabelas novas já entram na verificação.
- **Web:** `LayoutEmpresa` em `/e/:empresaId/*`, com `BarraTopo`, a troca de empresa e o `useEmpresaEmFoco()` (a `Empresa` atual, carregada de `GET /api/empresas/:empresaId`). A 033 troca a página inicial provisória pelo dashboard em `/e/:empresaId`, acrescenta os itens do menu do design (Visão geral, Créditos, Pendências, Débitos, Consultas à Receita) e troca `/empresas` pela carteira com valores. O cliente `api/cliente.ts` e os estados `sem_conexao` e `sessao_expirada` valem para as telas dela.

## Riscos e decisões

Decisões técnicas desta Spec (DT-N), para aprovação junto com ela:

- **DT-1 — Empresa em foco no caminho, não na sessão.** Cada aba pode ter uma empresa, a URL diz qual dado está na tela e a API confere o vínculo a cada requisição (CA-33, CA-34). A alternativa (empresa em foco guardada na sessão) cria estado no servidor e mistura abas.
- **DT-2 — Sessão própria em vez de `@fastify/session`.** A sessão precisa ficar no banco com HMAC, e a nova senha precisa encerrar todas as sessões do usuário (CA-24). O plugin guardaria o identificador de outro jeito e exigiria um armazenamento adaptado de qualquer forma.
- **DT-3 — HMAC dos tokens com `CREDITOGOV_SESSAO_SEGREDO`, e tokens de link no fragmento da URL.** O banco sozinho não basta para usar um token vazado, e nenhum token passa em URL de requisição ou log (CA-39).
- **DT-4 — Proteção contra requisição de outro site** com `SameSite=Strict`, o cabeçalho obrigatório e a conferência de `Origin`, sem token anti-CSRF em formulário: a web é uma página única de mesma origem.
- **DT-5 — `vinculo_empresa` visível também pelo próprio usuário.** É o que permite listar as empresas dele antes de fixar qualquer empresa. A escrita continua presa à empresa fixada.
- **DT-6 — Convite lido pelo token, com a empresa do link fixada.** Evita papel com `BYPASSRLS` ou função `SECURITY DEFINER` nesta demanda. O `empresaId` é um `uuid` sem significado: o link não traz o CNPJ.
- **DT-7 — `npm run admin` com o papel de trabalho e a empresa por `id`.** Não cria exceção ao "sem `BYPASSRLS`" da AD-6. Custo: a equipe guarda o `id` impresso por `criar-empresa`. Se ele se perder antes do primeiro vínculo, a empresa não pode ser recriada com a mesma raiz. Para reencontrar o `id`, há `empresas-do-usuario`. Se isso pesar na operação, uma demanda futura cria a consulta por raiz com o papel sem login da AD-6.
- **DT-8 — `argon2` (node-argon2).** Biblioteca consolidada (AD-12) com binário pronto para Windows, Linux e macOS. Se a instalação falhar em alguma máquina do projeto, a troca por `@node-rs/argon2` (mesmo algoritmo, mesmo formato de hash) é registrada na Spec, sem mudar os CA.
- **DT-9 — Contagem de tentativas no banco** (P-6), que vale para mais de uma instância da API e sobrevive a reinício.
- **DT-10 — `react-router` na web.** As telas desta demanda precisam de rotas. A busca de dados com cache por empresa fica para a Spec da 033 (AD-3).
- **DT-11 — Estilos copiados de `docs/design/tokens/`**, e não importados de fora de `app/web`: o build do Vite fica dentro da aplicação, como a cópia do leitor na AD-14. Se o design mudar, a cópia é atualizada na demanda que mudar o design.
- **DT-12 — Banco local com autenticação `trust`, preso a `127.0.0.1`.** Assim não há senha em arquivo nenhum (regra da demanda). Fora da máquina local, os papéis têm senha, guardada só no gerenciador de segredos (Implantação).

Riscos:

- **R-1. Docker obrigatório** para `npm test` do backend e para o desenvolvimento (P-10). Sem Docker, os testes que usam banco falham na preparação, com a mensagem "Banco de teste indisponível: rode `npm run banco:subir`". Eles **não** são pulados em silêncio. Os testes sem banco (senha, tokens, limite com relógio falso, e-mail, textos) rodam mesmo assim.
- **R-2. Cookie `Secure` em `http://localhost`.** Chrome, Edge e Firefox aceitam cookie `Secure` em `localhost`. Se algum navegador usado na conferência não aceitar, o login não se mantém no desenvolvimento. A correção seria servir o Vite por HTTPS local, não relaxar o `Secure`.
- **R-3 da arquitetura.** Se CA-35 a CA-38 falharem com Kysely, a task registra o resultado e a Spec passa para o Drizzle (segunda opção), com nova aprovação.
- **R-4. Tempo de resposta.** O hash fictício (CA-16) iguala o trabalho principal, mas não garante tempo idêntico. O teste confirma que a verificação roda e não mede tempo, que seria instável.
- **R-5. Lista de senhas comuns.** Ela depende de fonte pública e licença. Se o Developer não achar fonte com licença clara, a task para e pergunta.
- **R-6. Texto do painel da marca fora do repositório.** As três mensagens aprovadas vêm do artifact privado da 032 e foram transcritas nesta Spec (P-S1). A task de documentação as registra também em `docs/design/design-system.md`, para o repositório não depender do artifact.

### Notas de implementação (2026-11-28)

Desvios técnicos registrados depois da implementação e da rodada de correção 1, a pedido do Reviewer. Não mudam nenhum CA nem o que foi aprovado em DT-1 a DT-12.

- **DT-13 — Valores dos cartões do painel da marca (P-S3).** A sessão principal os leu no artboard "Login" aprovado da 032:
  - cartão 1: "R$ 52.121,58" e "896 notas de compra";
  - cartão 2: `22.222.222/0001-22` com R$ 14.320,10, `33.333.333/0001-33` com R$ 9.870,45 e "Emitente não identificado" com R$ 7.950,30;
  - cartão 3: "Créditos atualizados em 24/11/2026, 08:12".

  São todos fictícios, com o selo da Spec.
- **DT-14 — Provedor de migrações estático.** Um provedor que importa as migrações explicitamente substitui o `FileMigrationProvider`, porque funciona igual em `src` (testes) e em `dist` (build), sem depender de caminho de arquivo. O `Migrator` é importado de `kysely/migration`.
- **DT-15 — `naEmpresaFixada` em `transacao.ts`.** É uma função a mais, que fixa uma empresa sem conferir vínculo. Só dois pontos a usam: a consulta e a aceitação de convite pelo token (DT-6) e o `npm run admin` (DT-7). Nenhuma rota com sessão a usa; essas passam por `naEmpresa`.
- **DT-16 — `rotaDeEmpresa` como `onRequest`**, não `preHandler`. A conferência de sessão e de empresa acontece antes da leitura do corpo. O contrato para a 033 não muda: `request.naEmpresa(fn)` e `request.naCarteira(fn)`.
- **DT-17 — Lista de senhas comuns por dependência.** O responsável decidiu em 2026-11-27 usar `@zxcvbn-ts/language-common` 4.2.0 (licença MIT). A lista é filtrada em tempo de execução: 12 caracteres ou mais, depois de NFC, em minúsculas, o que dá 308 senhas. A lista é local, sem consulta a serviço externo. O CA-14 da US descreve a lista desse jeito desde a 035 (redação alinhada).
- **DT-18 — `CREDITOGOV_CONFIAR_PROXY` como lista de endereços.** Era um booleano. Na rodada de correção 1 passou a ser um número de saltos, e na rodada 2 (2026-11-28) passou a ser uma lista separada por vírgula de IPs, CIDRs ou dos nomes `loopback`, `linklocal` e `uniquelocal`, passada direto ao `trustProxy` do Fastify. Vazia ou ausente, que é o padrão, a API não confia em proxy nenhum e usa o endereço da conexão. No desenvolvimento, com o proxy do Vite (`xfwd: true`), o valor é `loopback`. **Motivo da troca:** com contagem de saltos, quem fala direto com a API consegue forjar a origem pelo `X-Forwarded-For` (o Fastify recusa a contagem de saltos por segurança). Com a lista, só o cabeçalho vindo de um proxy listado é considerado.
- **DT-19 — Falhas de envio de e-mail e de sessão:**
  - **recuperação:** a resposta continua o mesmo `202`, e o log registra `email_falhou` sem e-mail. Assim a falha não revela se a conta existe (CA-23);
  - **convite:** responde `502 email_nao_enviado`, e quem convida sabe que o convite não chegou;
  - **aceite de convite:** se a gravação foi confirmada e a abertura da sessão falhou, responde `500 convite_aceito_sem_sessao`, e a web orienta a entrar pelo login;
  - **web:** vale o que foi aprovado em "Cliente da API". 502, 503 e 504 sem corpo de erro tipado da API viram `sem_conexao` ("Sem conexão"). Um 502 com corpo `{erro}`, como `email_nao_enviado`, continua erro tipado. O estado `servidor_indisponivel`, criado na rodada de correção 1, foi removido na rodada 2 (2026-11-28).
- **DT-20 — Um só convite pendente por empresa e e-mail.** A migração `0001` cria o índice único parcial `convite_pendente_unico`, e `criarConvite` usa `pg_advisory_xact_lock` por empresa e e-mail, para dois convites simultâneos não ficarem pendentes juntos (CA-9).
- **DT-21 — Recusa de papel com privilégio.** A API e o `npm run admin` conferem o papel conectado ao iniciar. Não sobem se ele for superusuário, tiver `BYPASSRLS` ou for dono de alguma tabela (AD-6, CA-2, CA-37).
- **DT-22 — Raiz fictícia `33333333`** (na 034 era `22222222`, antes do mapeamento da 035) acrescentada às de teste, para casos com três empresas. As três são `11111111`, `22222222` e `33333333`.

Riscos novos:

- **R-7. Lista de endereços do proxy errada.** Atrás de proxy, `CREDITOGOV_CONFIAR_PROXY` precisa listar exatamente os endereços dos proxies confiáveis. Se faltar o proxy, todos os acessos parecem vir dele, e a chave de origem do limite fica compartilhada, de modo que um usuário bloqueia os outros. Se a lista for ampla demais e incluir endereços de onde o cliente consegue falar direto com a API, ele forja a origem pelo `X-Forwarded-For` e escapa do limite por origem.
- **R-8. A raiz `00000000` não é fictícia.** Ela foi adotada como fictícia no design (032) e na US, mas é a raiz de um CNPJ real. Ficou nesta demanda para não divergir do design aprovado. A troca nos testes, nos dados de exemplo e no design foi feita na 035 (`docs/demandas/035-correcoes-034/bug.md`), pelo mapeamento `00000000`→`11111111`, `11111111`→`22222222` e `22222222`→`33333333`. Os exemplos deste documento já seguem esse mapeamento.

## Implantação

**Não há deploy nesta demanda:** o provedor de nuvem depende da PD-1 (AD-7), e não há provedor de e-mail (P-7). Tudo roda na máquina local. O que segue serve para quem for colocar no ar na demanda de hospedagem.

- **Apps afetadas:** `app/backend` (nova) e `app/web` (nova). `app/landing-page`, `app/apuracao-cbs` e `app/painel` não mudam.
- **Migration:** sim. `0001` cria funções, tabelas, regras de segurança por linha e permissões. Roda com `npm run migrar`, com o papel de migração. Antes dela, os papéis `creditogov_migracao` e `creditogov_app` têm de existir com os atributos de `banco/init/01-papeis.sql`, criados por quem administra o PostgreSQL (localmente, o próprio Compose).
- **Compatibilidade:** não há versão anterior. Nenhuma outra aplicação lê este banco nem chama esta API.
- **Variáveis de ambiente** (só os nomes; `app/backend/.env.example` traz os nomes sem valor):
  - `CREDITOGOV_AMBIENTE`: `local`, `homologacao` ou `producao`;
  - `CREDITOGOV_BANCO_URL`: o papel de trabalho;
  - `CREDITOGOV_BANCO_MIGRACAO_URL`: o papel de migração, usado só por `npm run migrar`;
  - `CREDITOGOV_SESSAO_SEGREDO`: chave do HMAC dos tokens, com pelo menos 32 bytes;
  - `CREDITOGOV_WEB_URL`: origem pública da web, usada nos links e na conferência de `Origin`;
  - `CREDITOGOV_EMAIL`: `arquivo` ou `memoria`;
  - `CREDITOGOV_API_PORTA`: padrão `3000`. A API escuta em `127.0.0.1`;
  - `CREDITOGOV_CONFIAR_PROXY`: lista separada por vírgula de IPs, CIDRs ou `loopback`, `linklocal` e `uniquelocal`; vazia por padrão, sem confiar em proxy nenhum (DT-18).

  A `app/web` não tem variável: chama `/api` na mesma origem.
- **Outros efeitos:** Docker Compose local com volume `creditogov-banco` e porta `127.0.0.1:5433`. E-mails locais em `app/backend/.local/emails/`. Sem cron, DNS, Keycloak ou serviço externo.
- **Para ir ao ar** (demanda futura):
  - web e API na mesma origem, atrás de HTTPS, com `/api` encaminhado à API;
  - `CREDITOGOV_CONFIAR_PROXY` com os endereços exatos dos proxies confiáveis à frente da API (DT-18 e R-7);
  - papéis com senha e sem `trust`;
  - segredo gerado e guardado no gerenciador de segredos;
  - um adaptador de e-mail real. Sem ele, a API recusa iniciar em `producao`.
- **Antes:** `npm run banco:subir` e `npm run migrar`. **Depois:** `npm run admin -- criar-empresa` e `convidar` para o primeiro acesso, com dados fictícios no ambiente local.
- **Riscos para ir ao ar:** R-7 (lista de endereços do proxy errada) e R-8 (a raiz `00000000`, real, foi trocada na 035).
- **Como voltar:** localmente, `npm run banco:apagar` apaga o volume. Não há nada publicado para desfazer.

## Estratégia de verificação

### Comandos

- **`app/backend`:** `npm run banco:subir`, depois `npm test`, `npm run lint` e `npm run build`.
- **`app/web`:** `npm test`, `npm run lint` e `npm run build`.

Nenhum teste lê `.env`, chama serviço externo ou usa dado real. Os e-mails dos testes são de `exemplo.com.br` ou `example.com`, e as raízes de CNPJ são `11111111`, `22222222` e `33333333` (DT-22; ver R-8, trocada na 035).

**Banco de teste:** o `globalSetup` do vitest do backend conecta como superusuário do contêiner local, só para apagar e recriar o banco `creditogov_teste` (dono `creditogov_migracao`), e roda as migrações com o papel de migração. Os testes usam o papel `creditogov_app`, e cada arquivo de teste limpa as tabelas com o papel de migração antes de começar. As URLs de teste são fixas no código, apontando para `127.0.0.1:5433` sem senha, e podem ser trocadas por `CREDITOGOV_BANCO_TESTE_URL` se a porta mudar.

### CA por teste

| CA | Como se prova |
|---|---|
| CA-1 | `npm test`, `lint` e `build` passam nas duas aplicações; `AGENTS.md` e `PROJECT_CONTEXT.md` §4 conferidos na revisão |
| CA-2 | Teste: `creditogov_app` não é dono de nenhuma tabela (`pg_tables.tableowner`), e as migrações rodaram com `creditogov_migracao` |
| CA-3 | Revisão: nenhum teste lê `.env` ou abre conexão fora de `127.0.0.1`; adaptador de e-mail em memória em todos os testes |
| CA-4 | Teste de `config.ts`: variável obrigatória ausente impede a API de iniciar e a mensagem cita o nome, não o valor. `git ls-files` sem `.env`; `.env.example` só com nomes |
| CA-5 | Testes do `admin`: cria com raiz pontuada e sem pontuação; recusa raiz inválida e repetida, com motivo |
| CA-6 | Teste do `admin convidar`: um e-mail no adaptador com o link, o convite gravado com origem `equipe` e validade de 7 dias (relógio falso) |
| CA-7 | Teste: não há rota pública de criação de conta ou de empresa (lista de rotas do Fastify). Teste da web: a tela de login não tem "Criar conta" e tem o texto de acesso |
| CA-8 | Testes da API, um por papel × papel convidado (tabela de P-2), e convite para empresa sem vínculo (`404`), com a requisição montada à mão |
| CA-9 | Testes: `409 ja_vinculado`; segundo convite pendente invalida o primeiro (o link antigo dá `410`); resposta igual para e-mail com e sem conta |
| CA-10 | Teste: `criado_por`, `origem`, `criado_em`, `usado_em` e `aceito_por` gravados; nenhuma coluna com o token em texto |
| CA-11 | Teste da API: aceitar sem conta cria usuário, identidade e vínculo, marca o convite e devolve o cookie. Teste da web: o formulário com nome e senha |
| CA-12 | Teste: o contador com conta aceita o segundo convite com a senha atual; o hash da senha não muda; ele passa a ter duas empresas em `GET /api/empresas` |
| CA-13 | Testes: convite vencido (relógio falso, 7 dias e 1 segundo), usado, invalidado, com token alterado e com `empresaId` de outra empresa, todos com `410` e sem criar linha |
| CA-14 | Testes unitários da regra (11, 12, 128 e 129 caracteres; senha da lista com maiúsculas trocadas; caracteres acentuados contados depois de NFC); teste de que `hash_senha` começa por `$argon2id$`; busca nas respostas e nos logs pela senha usada no teste: nenhuma ocorrência |
| CA-15 | Teste: login com `" Pessoa@Exemplo.com.br "` funciona para a conta `pessoa@exemplo.com.br` |
| CA-16 | Teste: e-mail inexistente e senha errada dão status e corpo idênticos; o verificador espião foi chamado nos dois casos |
| CA-17 | Testes com relógio falso: 5 falhas → a 6ª tentativa dá `429` mesmo com a senha certa; passados 15 minutos, entra; a contagem por origem bloqueia e-mails diferentes vindos do mesmo endereço; resposta de bloqueio igual para e-mail com e sem conta |
| CA-18 | Testes da web: sem os botões de Google e Microsoft; botão desabilitado e com indicador durante o envio; alerta de credencial; `fetch` rejeitado → "Sem conexão" e "Tentar de novo" reenvia; `matchMedia` com `reduce` → o painel não troca sozinho. Conferência visual no navegador, em largura de celular e de desktop (P-9) |
| CA-19 | Teste: o `Set-Cookie` tem `HttpOnly`, `Secure`, `SameSite=Strict` e `Path=/api`; o banco tem o HMAC, diferente do valor do cookie |
| CA-20 | Testes com relógio falso: 2 h sem uso → `401 sessao_expirada`; com uso a cada 30 min, 12 h depois do login → `401 sessao_expirada`. Teste da web: `401 sessao_expirada` → `/entrar?motivo=expirada` com o alerta |
| CA-21 | Teste: depois de `DELETE /api/sessao`, o mesmo cookie dá `401` |
| CA-22 | Testes: o cookie muda a cada login e o anterior deixa de valer; `POST` sem o cabeçalho, ou com `Origin` de outro site, dá `403 origem_recusada` |
| CA-23 | Testes: resposta idêntica para e-mail com e sem conta; e-mail enviado só no primeiro caso, com validade de 1 hora |
| CA-24 | Teste: com duas sessões abertas, a confirmação da nova senha encerra as duas, o link fica usado e o login com a senha nova funciona |
| CA-25 | Testes: link vencido (1 h e 1 s), usado, alterado e substituído por um pedido novo, todos com `410` e a senha inalterada |
| CA-26 | Teste com relógio falso: o 6º pedido em 15 minutos dá `429`, igual para e-mail com e sem conta |
| CA-27 | Testes: adaptador em memória; adaptador de arquivo numa pasta temporária do teste; a API recusa iniciar com `producao` |
| CA-28 | Teste dos modelos: o texto tem quem convidou, a empresa, a validade e a frase de "ignore"; revisão do texto contra o §6 |
| CA-29 | Teste: um usuário com vínculo em duas empresas e uma empresa com três usuários de papéis diferentes |
| CA-30 | Teste: o usuário vê só as empresas com vínculo ativo; uma empresa de outro usuário não aparece; o vínculo removido some |
| CA-31 | Testes da web: uma empresa → `/e/:id`; duas → `/empresas`; nenhuma → a mensagem sem erro técnico |
| CA-32 | Testes da web: a barra com nome e CNPJ raiz; a troca de empresa ausente com uma empresa; "Sair" chama `DELETE /api/sessao`; a página inicial sem número |
| CA-33 | Teste: `GET /api/empresas/<id de outra empresa>` e `GET /api/empresas/<uuid inexistente>` dão respostas idênticas (`404`) |
| CA-34 | Testes: titular remove contador; contador e colaborador recebem `403`; último titular dá `409`; com a sessão do removido aberta, a requisição seguinte à empresa dá `404`; o `admin remover-vinculo` segue a mesma regra |
| CA-35 | Teste de isolamento com `creditogov_app`, direto no banco: sem `app.empresas`, `SELECT` em `empresa`, `convite` e `vinculo_empresa` volta vazio; com A fixada, nenhuma linha de B volta; `INSERT` e `UPDATE` com `empresa_id` de B falham ou não afetam nenhuma linha |
| CA-36 | Teste: num pool de uma conexão só, a transação 1 fixa A e termina, e a transação 2, na mesma conexão, sem fixar nada, não vê A (`current_setting` vazio); `naCarteira` com A e B não mostra C |
| CA-37 | Teste no catálogo: `rolsuper`, `rolbypassrls` falsos e nenhuma posse para `creditogov_app`; a tabela `empresa` e toda tabela com coluna `empresa_id` têm `relrowsecurity` e `relforcerowsecurity` verdadeiros e ao menos uma regra |
| CA-38 | Teste: `SELECT 12345678901234.56::numeric(20,2)` pelo Kysely devolve a string `"12345678901234.56"` (`typeof === "string"`) |
| CA-39 | Teste: com um destino de log em memória, os fluxos de login (certo e errado), convite, aceitação e recuperação não deixam no log o e-mail, a senha, o token, o link, o HMAC nem o valor do cookie usados no teste |
| CA-40 | Revisão: os arquivos da seção "Documentação" atualizados; kanban com o status |

## Perguntas em aberto

Respondidas em 2026-11-27, na aprovação da Spec:

- **P-S1 (texto): resolvida.** Valem os textos aprovados do artboard "Login" (`project/Main.dc.html`) do canvas da 032 (<https://claude.ai/artifact/Xj5Mwa2tH2hRGDX7bZWbRg>), lidos pela sessão principal e transcritos em "Telas e rotas" (`PainelMarca` e formulário de login). A proposta que estava nesta Spec foi descartada. O subtítulo do formulário muda por causa de D-1, e o divisor "ou com e-mail" sai.
- **P-S2 (tema): resolvida.** Só o tema claro nesta demanda, sem seletor. O seletor fica para uma demanda própria ou para a 033.
- **P-S3 (valores dos cartões): resolvida em 2026-11-28.** A sessão principal leu os valores fictícios no artboard "Login" aprovado da 032. Eles estão em DT-13.
