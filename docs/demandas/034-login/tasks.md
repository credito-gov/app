# 034-login — Tasks

- **Status:** em-implementação
- **Spec:** [`spec.md`](spec.md), aprovada em 2026-11-27 ("Aprovo") sobre o commit `9c72e76`, com DT-1 a DT-12, P-S1 e P-S2

Tasks pequenas e ordenadas, com um commit por task. Cada task cita a seção da Spec, os CA que atende e como é verificada. A referência é a Spec aprovada; se esta lista divergir dela, vale a Spec, e a divergência volta para a sessão principal.

**Testes primeiro:** em cada parte, a task de testes vem antes da task de código. Os testes nascem dos CA-N da [`us.md`](us.md) e **falham** quando são commitados, por falta do módulo ou do comportamento. O Developer registra a falha na mensagem do commit (quantos testes falham e por quê), e a task seguinte implementa o código até eles passarem. Todo CA-N tem pelo menos um teste ou uma verificação de documento (mapa no fim).

**Regras para o Developer em todas as tasks:**

- Trabalhar só em `app/backend/`, `app/web/` e nos documentos citados nas tasks 36 e 37. **Nenhuma task altera** `app/landing-page`, `app/apuracao-cbs` nem `app/painel`. De `docs/design/` só se **copia** (tokens, `bundle.css`, logo); ele só muda na task 37.
- **Nenhum dado real:** e-mails só de `exemplo.com.br` ou `example.com`, raízes de CNPJ `00000000` e `11111111`, nomes como "Comércio Exemplo Ltda.". Isso vale para código, teste, documento e mensagem de commit.
- **Sem segredo:** não criar `.env` nem pedir credencial. O `.env.example` só traz nomes. Os testes montam a configuração em código, com valores fictícios. O backend só aponta para o PostgreSQL local do Compose.
- **Rede:** o `test/setup.ts` das duas aplicações bloqueia `fetch` para fora; o único destino de rede permitido é o banco de teste em `127.0.0.1:5433`. A web não abre socket nos testes: o `fetch` é simulado.
- **Comandos de verificação**, sempre na pasta da aplicação:
  - `app/backend`: `npm run banco:subir` (uma vez) e `npm test`, `npm run lint`, `npm run build`;
  - `app/web`: `npm test`, `npm run lint`, `npm run build`.

  Ao fim de cada task de implementação, os três passam. Numa task de testes, só os testes novos falham, e o lint passa.
- **Antes de cada commit:** `git status` e conferir cada arquivo. Nada de `node_modules/`, `dist/`, `.local/` ou `.env`.
- **Mensagens de commit:** `chore(backend): ...`, `test(backend): ...`, `feat(backend): ...`, `chore(web): ...`, `test(web): ...`, `feat(web): ...`, `docs(034): ...`.
- **R-3:** se os testes da task 5 não passarem com Kysely depois da task 6, o Developer **para** e devolve à sessão principal com o resultado. A troca pelo Drizzle exige nova aprovação da Spec.

| # | Task | Spec | CA | Verificação | Status |
|---|---|---|---|---|---|
| 1 | Estrutura do `app/backend` | Abordagem; API › Estrutura; Implantação | CA-1, CA-3, CA-4 | `npm install`; `npm test` (1 teste passa); lint; build; `git check-ignore` | ☑ |
| 2 | Docker Compose, papéis e scripts `banco:*` | Banco › Docker Compose e papéis; DT-12 | CA-2, CA-3 | `npm run banco:subir`; atributos dos papéis conferidos | ☐ |
| 3 | Testes de `config.ts` | API › Estrutura; E-mail | CA-4, CA-27 | falham | ☑ |
| 4 | Implementar `config.ts` | idem 3 | idem 3 | testes da task 3 passam | ☑ |
| 5 | `globalSetup` do banco de teste e testes de isolamento, catálogo e `numeric` | Banco; Estratégia › Banco de teste; R-3 | CA-2, CA-35 a CA-38 | falham (não há migração) | ☐ |
| 6 | Migração `0001`, `npm run migrar` e `banco/transacao.ts` | Banco › Migrações; Modelo de dados; Transação com empresa fixada; DT-5 | idem 5 | testes da task 5 passam | ☐ |
| 7 | Testes de senha e tokens | API › Senha; Tokens; DT-3, DT-8 | CA-14, CA-19 | falham | ☑ |
| 8 | Implementar `senha.ts`, `senhasComuns.ts` e `tokens.ts` | idem 7 | idem 7 | testes da task 7 passam | ☑ |
| 9 | Testes do limite de tentativas | API › Limite de tentativas; DT-9 | CA-17, CA-26 | falham | ☐ |
| 10 | Implementar `limite.ts` | idem 9 | idem 9 | testes da task 9 passam | ☐ |
| 11 | Testes do e-mail (adaptadores e modelos) | API › E-mail | CA-27, CA-28 | falham | ☑ |
| 12 | Implementar `email/` | idem 11 | idem 11 | testes da task 11 passam | ☑ |
| 13 | Testes do servidor, da sessão e do login | API › Sessão; Proteção contra requisição de outro site; Login sem revelar o e-mail; Contratos › Sem sessão e Com sessão | CA-7, CA-15 a CA-17, CA-19 a CA-22 | falham | ☐ |
| 14 | Implementar o servidor Fastify, o plugin de sessão, a proteção de origem, os cabeçalhos, `registro.ts` e as rotas `/api/sessao` | idem 13; DT-2, DT-4 | idem 13 | testes da task 13 passam | ☐ |
| 15 | Testes do `npm run admin` | API › Comando administrativo; DT-7 | CA-5, CA-6, CA-34 | falham | ☐ |
| 16 | Implementar `admin/` | idem 15 | idem 15 | testes da task 15 passam | ☐ |
| 17 | Testes de convites | API › Convites; Contratos; DT-6 | CA-8 a CA-14 | falham | ☐ |
| 18 | Implementar `convites/` e as rotas de convite | idem 17 | idem 17 | testes da task 17 passam | ☐ |
| 19 | Testes de empresas, pessoas, remoção e empresa em foco | API › Remoção de vínculo; Transação; Contratos › Com sessão; O que a 033 consome; DT-1 | CA-29, CA-30, CA-33, CA-34 | falham | ☐ |
| 20 | Implementar `empresas/`, o `rotaDeEmpresa` e as rotas de empresa | idem 19 | idem 19 | testes da task 19 passam | ☐ |
| 21 | Testes de recuperação de senha | API › Tokens; Sessão; Contratos › Sem sessão | CA-23 a CA-26 | falham | ☐ |
| 22 | Implementar a recuperação de senha | idem 21 | idem 21 | testes da task 21 passam | ☐ |
| 23 | Testes de logs e varredura de segredos | API › Logs; Estratégia › CA-39 | CA-14, CA-39 | falham, ou passam com falha provocada registrada | ☐ |
| 24 | Ajustar a redação dos logs e o script `dev` | idem 23 | idem 23 | testes da task 23 passam; `npm run dev` sobe | ☐ |
| 25 | Estrutura do `app/web` | Web › Estrutura e ferramentas; DT-10, DT-11 | CA-1, CA-3 | `npm install`; `npm test` (1 teste passa); lint; build | ☑ |
| 26 | Testes do cliente da API e do `ProvedorSessao` | Web › Cliente da API | CA-18, CA-20 | falham | ☐ |
| 27 | Implementar `api/cliente.ts` e `sessao/ProvedorSessao.tsx` | idem 26 | idem 26 | testes da task 26 passam | ☑ |
| 28 | Testes de `Entrar`, `PainelMarca` e `CampoSenha` | Web › Telas e rotas (`/entrar`, `PainelMarca`, formulário de login) | CA-7, CA-15 a CA-18, CA-20 | falham | ☐ |
| 29 | Implementar `Entrar`, `PainelMarca`, `CampoSenha` e `Alerta` | idem 28 | idem 28 | testes da task 28 passam | ☐ |
| 30 | Testes de `EsqueciSenha`, `RedefinirSenha` e `AceitarConvite` | Web › Telas e rotas; API › Tokens (fragmento) | CA-11 a CA-14, CA-23 a CA-25 | falham | ☐ |
| 31 | Implementar `EsqueciSenha`, `RedefinirSenha` e `AceitarConvite` | idem 30 | idem 30 | testes da task 30 passam | ☐ |
| 32 | Testes de `/`, `EscolherEmpresa`, `LayoutEmpresa`, `BarraTopo`, `TrocaEmpresa`, `Inicio` e `Pessoas` | Web › Telas e rotas; O que a 033 consome | CA-8, CA-9, CA-31 a CA-34 | falham | ☐ |
| 33 | Implementar essas telas e a rota `/` | idem 32 | idem 32 | testes da task 32 passam | ☐ |
| 34 | Roteiro de conferência no navegador | Estratégia › CA-18; P-9 | CA-18, CA-31, CA-32 | roteiro escrito; conferência feita pelo responsável | ☐ |
| 35 | READMEs de `app/backend` e `app/web` | Documentação | CA-1, CA-40 | revisão; comandos do README rodados | ☐ |
| 36 | `AGENTS.md` e `docs/PROJECT_CONTEXT.md` | Documentação | CA-1, CA-40 | revisão; links abrem | ☐ |
| 37 | Design, arquitetura §13 e `hipoteses.md` | Documentação; R-6 | CA-40 | revisão; links abrem | ☐ |
| 38 | Verificação final | Estratégia de verificação | todos | os seis comandos passam; varreduras limpas; `git status` limpo | ☐ |

## Detalhe das tasks

### 1. Estrutura do `app/backend`

`package.json`:

- `"type": "module"` e `engines.node >= 24`;
- scripts `build` (`tsc -p tsconfig.json`), `lint` (`oxlint`), `test` (`vitest run`), `dev` (`node --env-file-if-exists=.env` sobre o build da API), `migrar` e `admin`. Os dois últimos ficam como stub que falha com "não implementado" até as tasks 6 e 16.

Dependências da Spec: `fastify`, `@fastify/cookie`, `kysely`, `pg`, `argon2` e `pino`, que vem com o Fastify. Desenvolvimento: `typescript ~6.0`, `@types/node`, `@types/pg`, `vitest`, `oxlint`.

Arquivos:

- `tsconfig.json` (ESM, `strict`) e `vitest.config.ts` com `setupFiles: test/setup.ts`. O setup bloqueia `fetch` para qualquer destino;
- `.gitignore` com `node_modules/`, `dist/`, `.local/` e `.env`;
- `.env.example` com os nomes da Spec (Implantação), todos vazios;
- um teste trivial;
- pastas vazias da estrutura da Spec (com `.gitkeep` só onde for preciso).

**Verificação:** `npm install`; `npm test`, com 1 teste passando; `npm run lint`; `npm run build`; `git check-ignore .local/x .env dist/x` lista os três.

### 2. Docker Compose, papéis e scripts `banco:*`

- `compose.yaml`: imagem `postgres` numa tag exata da série 18. Confira a tag publicada e registre na mensagem do commit; nunca `latest`. Use `POSTGRES_HOST_AUTH_METHOD=trust`, porta `127.0.0.1:5433:5432`, volume `creditogov-banco` e o `banco/init/` montado em `/docker-entrypoint-initdb.d`.
- `banco/init/01-papeis.sql`: cria `creditogov_migracao` e `creditogov_app` (`LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB`) e o banco `creditogov`, com dono `creditogov_migracao`. O `creditogov_app` recebe `CONNECT`.
- Scripts `banco:subir` (`docker compose up -d --wait`), `banco:parar` e `banco:apagar` (`docker compose down -v`).

**Verificação:** `npm run banco:subir`; com `docker compose exec`, `psql` mostra os dois papéis sem `rolsuper` e sem `rolbypassrls`; `npm run banco:apagar` e `banco:subir` recriam tudo. Sem Docker, o Developer para e devolve à sessão principal (R-1).

### 3. Testes de `config.ts`

Casos:

- cada variável obrigatória ausente impede o carregamento, com uma mensagem que contém o **nome** da variável e não contém o valor de nenhuma outra variável fornecida;
- `CREDITOGOV_SESSAO_SEGREDO` com menos de 32 bytes é recusado;
- `CREDITOGOV_AMBIENTE` aceita só `local`, `homologacao` e `producao`;
- `producao` é recusado enquanto não houver adaptador real de e-mail (CA-27);
- `CREDITOGOV_EMAIL` aceita só `arquivo` e `memoria`;
- valores padrão de `CREDITOGOV_API_PORTA` (3000) e de `CREDITOGOV_CONFIAR_PROXY` (desligado).

Os testes passam um objeto de ambiente fictício. Não leem `process.env` real nem `.env`.

### 4. Implementar `config.ts`

Leitura e validação como na Spec. O módulo exporta uma função que recebe o objeto de ambiente: o `process.env` só entra no ponto de entrada.

### 5. `globalSetup` do banco de teste e testes de isolamento, catálogo e `numeric`

**`test/banco/preparar.ts`** (o `globalSetup`):

- conecta como superusuário do contêiner em `127.0.0.1:5433` (URL fixa no código, sem senha; `CREDITOGOV_BANCO_TESTE_URL` pode trocá-la);
- apaga e cria `creditogov_teste`, com dono `creditogov_migracao`, e concede `CONNECT` ao `creditogov_app`;
- roda as migrações com o papel de migração;
- sem banco, falha com "Banco de teste indisponível: rode `npm run banco:subir`".

Auxiliar `test/banco/limpar.ts`: apaga os dados das tabelas com o papel de migração. Como as tabelas têm `FORCE`, ele usa `TRUNCATE`, que a segurança por linha não filtra.

**`test/banco/isolamento.test.ts`**, com o papel `creditogov_app` e dados fictícios das empresas A, B e C:

- **CA-35:** sem `app.empresas`, `SELECT` em `empresa`, `vinculo_empresa` e `convite` volta vazio. Com A fixada, nenhuma linha de B volta. `INSERT` com `empresa_id` de B falha. `UPDATE` e `DELETE` em linha de B afetam 0 linhas.
- **CA-36:** com um pool de uma conexão só, a transação 1 fixa A e termina. A transação 2, sem fixar nada, vê `current_setting('app.empresas', true)` vazio e nenhuma linha. `naCarteira` com vínculos em A e B não mostra C. `naSessaoDoUsuario` mostra os vínculos do usuário e nenhum de outro usuário.
- **CA-37 e CA-2:** no catálogo, `creditogov_app` tem `rolsuper` e `rolbypassrls` falsos e não é dono de nenhuma tabela. `empresa` e toda tabela com coluna `empresa_id` (descobertas por `information_schema.columns`) têm `relrowsecurity` e `relforcerowsecurity` verdadeiros e pelo menos uma regra em `pg_policies`. As tabelas pertencem a `creditogov_migracao`.
- **CA-38:** `SELECT 12345678901234.56::numeric(20,2)` pelo Kysely devolve a string `"12345678901234.56"`.

**Verificação:** falham porque não há migração nem `transacao.ts`.

### 6. Migração `0001`, `npm run migrar` e `banco/transacao.ts`

- A migração `0001` cria funções, tabelas, índices, regras de segurança por linha e permissões, como em "Banco › Migrações" e "Modelo de dados". `app_usuario()` e `app_empresas()` são `STABLE`, com `search_path` fixo.
- `npm run migrar` usa o `Migrator` do Kysely com `CREDITOGOV_BANCO_MIGRACAO_URL`.
- `transacao.ts` traz `naSessaoDoUsuario`, `naEmpresa`, `naCarteira` e `semUsuario`, com `set_config(..., true)`, e a classe `EmpresaNaoEncontrada`.
- Tipos do esquema escritos à mão, em `banco/esquema.ts`.

**Verificação:** testes da task 5 passam. Se não passarem com Kysely, aplica-se a regra de R-3 (topo).

### 7. Testes de senha e tokens

- **CA-14:**
  - a regra recusa 11 caracteres, aceita 12 e 128, recusa 129;
  - conta em pontos de código depois de NFC, com caso acentuado composto e decomposto;
  - recusa uma senha da lista com as maiúsculas trocadas;
  - a recusa diz qual regra falhou;
  - `gerarHash` devolve texto que começa por `$argon2id$`, e `verificar` aceita a senha certa e recusa a errada.
- **CA-19:** o token tem 32 bytes em base64url; dois tokens são diferentes; o HMAC é determinístico para o mesmo segredo, muda com outro segredo e é diferente do token.
- O verificador de hash é injetável, para o espião de CA-16 na task 13.

### 8. Implementar `senha.ts`, `senhasComuns.ts` e `tokens.ts`

- **`senhasComuns.ts`:** lista tirada de uma fonte pública com licença que permita o uso. O cabeçalho registra a origem (URL), a licença, a data e o filtro aplicado (por exemplo, só as de 12 caracteres ou mais, em minúsculas). Sem fonte com licença clara, o Developer **para** e pergunta (R-5).
- **`argon2`:** usa os parâmetros padrão da biblioteca. Os testes reduzem o custo por configuração. Se a instalação falhar no Windows, a troca por `@node-rs/argon2` (DT-8) é registrada no commit e na Spec, pela sessão principal.

### 9. Testes do limite de tentativas

Com relógio falso e o banco de teste:

- **CA-17:**
  - 5 falhas na chave do e-mail bloqueiam, e a 6ª dá `bloqueado` mesmo antes de verificar a senha;
  - 15 minutos depois do bloqueio, libera;
  - tentativas durante o bloqueio não o prolongam;
  - a chave de origem bloqueia e-mails diferentes vindos do mesmo endereço;
  - o sucesso apaga as falhas da chave do e-mail;
  - a chave gravada é o HMAC, não o e-mail.
- **CA-26:** 5 pedidos de recuperação em 15 minutos bloqueiam o 6º, exista ou não a conta.
- Limpeza: as linhas com mais de 24 h somem na gravação seguinte.

### 10. Implementar `limite.ts`

Como na Spec, com o relógio injetado e as tabelas `falha_acesso` e `bloqueio_acesso`.

### 11. Testes do e-mail

- **CA-27:**
  - o adaptador `memoria` guarda as mensagens;
  - o adaptador `arquivo` grava um `.txt` por mensagem numa pasta temporária criada pelo teste, nunca em `.local/`;
  - a fábrica escolhe pelo valor de `CREDITOGOV_EMAIL`.
- **CA-28:**
  - o modelo de convite contém quem convidou (usuário ou "a equipe CreditoGov"), o nome da empresa, o papel, o link, "válido até DD/MM/AAAA HH:MM" em `America/Sao_Paulo` e a frase de "ignore";
  - o de recuperação contém o link, a validade de 1 hora e "Se você não pediu, ignore esta mensagem; sua senha não muda.";
  - os textos não contêm número, prazo ou promessa além desses.

### 12. Implementar `email/`

Interface `EnvioEmail`, os dois adaptadores, a fábrica e `modelos.ts`.

### 13. Testes do servidor, da sessão e do login

Com `fastify.inject`, sem socket, e o banco de teste. Dados criados direto pelo auxiliar de teste.

- **CA-15:** `" Pessoa@Exemplo.com.br "` entra na conta `pessoa@exemplo.com.br`; a resposta traz `usuario` e `empresas`.
- **CA-16:** e-mail inexistente e senha errada dão o mesmo status (401) e o mesmo corpo; o espião do verificador foi chamado nos dois casos.
- **CA-17:** pela rota, a 6ª tentativa dá `429 muitas_tentativas`, com a mensagem da Spec, também com a senha certa e também para e-mail inexistente.
- **CA-19:** o `Set-Cookie` tem `cg_sessao`, `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/api` e `Max-Age=43200`; a tabela `sessao` guarda o HMAC, diferente do valor do cookie.
- **CA-20:**
  - 2 h sem uso dão `401 sessao_expirada`;
  - com uso a cada 30 min, 12 h depois do login dão `401 sessao_expirada`;
  - sem cookie, `401 sem_sessao`;
  - `ultimo_uso_em` não muda em duas requisições com menos de 1 minuto entre elas.
- **CA-21:** depois de `DELETE /api/sessao`, o mesmo cookie dá `401`, e a resposta vence o cookie.
- **CA-22:**
  - login com cookie válido anterior encerra a sessão anterior e devolve um valor novo;
  - `POST /api/sessao` sem `X-CreditoGov-Requisicao` dá `403 origem_recusada`;
  - com `Origin: https://outro.example.com`, `403`;
  - a resposta não traz cabeçalho CORS.
- **CA-7** (API): a lista de rotas registradas (`printRoutes` ou o gancho `onRoute`) não tem rota pública que crie usuário, empresa ou vínculo, além de `POST /api/convites/aceitar`.
- **Cabeçalhos:** `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff` e `Cache-Control: no-store` em `/api`.

### 14. Implementar o servidor e a sessão

- `api/servidor.ts`: fábrica que recebe a configuração, o relógio, o envio de e-mail e o verificador, o que facilita os testes, e escuta em `127.0.0.1`.
- `autenticacao/sessao.ts` e o plugin que põe `request.usuario` nas rotas com sessão.
- Proteção de origem num gancho `onRequest`, e os cabeçalhos de segurança.
- `registro.ts`: pino com a redação da Spec.
- Rotas `POST`, `GET` e `DELETE` de `/api/sessao`, com JSON Schema de entrada e o erro `400 entrada_invalida`.
- Ponto de entrada `src/api/main.ts`.

### 15. Testes do `npm run admin`

Os testes chamam as funções dos comandos direto, com o banco de teste e o adaptador em memória, e uma vez o processo pelo `npm run admin`, só para conferir os códigos de saída.

- **CA-5:**
  - `criar-empresa` aceita `00000000` e `00.000.000`, grava e imprime o `id`;
  - recusa raiz com 7 dígitos ou com letras, e raiz repetida, com mensagem que diz o motivo.
- **CA-6:**
  - `convidar` com `titular` ou `contador` gera um e-mail com o link no formato da Spec;
  - o convite fica com origem `equipe`, `criado_por` nulo e validade de 7 dias;
  - `colaborador` é recusado para a equipe;
  - a saída do comando não contém token nem link.
- `empresas-do-usuario` lista as empresas do usuário e nenhuma outra.
- **CA-34** (admin): `remover-vinculo` remove o contador e recusa o último titular.

### 16. Implementar `admin/`

`src/admin/main.ts`, com os quatro comandos e o papel de trabalho, usando `naEmpresa`, `naSessaoDoUsuario` ou a fixação direta da empresa nova, como na DT-7.

### 17. Testes de convites

Pela API, com sessões de titular, contador e colaborador nas empresas A e B:

- **CA-8:** a tabela completa de P-2 (3 papéis de quem convida × 3 papéis convidados), com `202` ou `403 papel_nao_permitido`. Convite para B por quem só tem A dá `404`. O `papel` forjado no corpo não muda a permissão.
- **CA-9:**
  - e-mail com vínculo ativo dá `409 ja_vinculado`;
  - segundo convite para o mesmo e-mail invalida o primeiro (consultar o link antigo dá `410`);
  - e-mails com conta e sem conta recebem respostas idênticas (`202 "Convite enviado"`).
- **CA-10:** `criado_por`, `origem`, `criado_em`, `usado_em` e `aceito_por` gravados; nenhuma coluna contém o token.
- **CA-11:** consultar devolve empresa, papel, `emailMascarado` e `contaExistente: false`. Aceitar com nome e senha cria usuário, identidade e vínculo, marca o convite e devolve o cookie.
- **CA-12:** o contador com conta na A aceita o convite da B com a senha atual. `hash_senha` não muda, e `GET /api/empresas` lista A e B. A senha errada dá `401 credencial_invalida` e conta no limite.
- **CA-13:** convite vencido (7 dias e 1 segundo), usado, invalidado, com token alterado e com o `empresaId` de outra empresa: todos dão `410 convite_invalido` e nenhuma linha nova.
- **CA-14:** aceitar com senha de 11 caracteres dá `400 senha_invalida` com a regra.

### 18. Implementar `convites/`

`permissoes.ts`, criação, consulta e aceitação. As rotas são `POST /api/empresas/:empresaId/convites`, `POST /api/convites/consultar` e `POST /api/convites/aceitar`. O envio de e-mail acontece depois de a transação gravar.

### 19. Testes de empresas, pessoas, remoção e empresa em foco

- **CA-29:** um usuário com vínculo em duas empresas; uma empresa com titular, contador e colaborador.
- **CA-30:** `GET /api/empresas` traz só as empresas com vínculo ativo, ordenadas por nome, com `cnpjRaizFormatado` `00.000.000`. A empresa de outro usuário não aparece. O vínculo removido some.
- **CA-33:** `GET /api/empresas/<id de B>` por quem só tem A, `GET /api/empresas/<uuid inexistente>` e `GET /api/empresas/abc` dão o mesmo `404 empresa_nao_encontrada`, com corpo idêntico.
- **CA-34:**
  - o titular remove o contador (`204`);
  - contador e colaborador recebem `403`;
  - o último titular dá `409 ultimo_titular`;
  - com a sessão do removido aberta, a requisição seguinte à empresa dá `404`;
  - duas remoções simultâneas dos dois únicos titulares deixam pelo menos um.
- `GET /api/empresas/:empresaId/pessoas` traz vínculos, convites pendentes, `podeConvidar` conforme o papel e `podeRemover` só para o titular.

### 20. Implementar `empresas/` e `rotaDeEmpresa`

O `preHandler` `rotaDeEmpresa` expõe `request.naEmpresa` e `request.naCarteira` (O que a 033 consome). Também entram as rotas `GET /api/empresas`, `GET /api/empresas/:empresaId`, `GET .../pessoas` e `DELETE .../vinculos/:usuarioId`, com o `FOR UPDATE` dos titulares.

### 21. Testes de recuperação de senha

- **CA-23:** `POST /api/recuperacao` dá o mesmo `202` e a mesma mensagem para e-mail com e sem conta. O e-mail sai só no primeiro caso, com validade de 1 hora.
- **CA-24:** com duas sessões abertas, `confirmar` com o token válido dá `204`, encerra as duas sessões (`motivo_encerramento = nova_senha`) e marca o link como usado. O login com a senha nova funciona, e com a antiga não.
- **CA-25:** link vencido (1 h e 1 s), usado, alterado e substituído por um pedido novo: todos dão `410 link_invalido`, e o hash da senha não muda.
- **CA-26:** pela rota, o 6º pedido em 15 minutos dá `429`, também para e-mail inexistente.

### 22. Implementar a recuperação de senha

Rotas `POST /api/recuperacao` e `POST /api/recuperacao/confirmar`, com a tabela `recuperacao_senha`, o limite e o encerramento das sessões.

### 23. Testes de logs e varredura de segredos

- **CA-39:** com o pino escrevendo num destino em memória, os fluxos rodam: login certo, login errado, convite, consulta e aceitação de convite, recuperação e confirmação, e remoção. O log inteiro não pode conter, como texto, o e-mail, a senha, o token, o link, o HMAC nem o valor do cookie usados no teste. Também confere que `login_recusado` não leva `usuarioId`.
- **CA-14:** a mesma busca nas respostas JSON, pela senha.
- **Varredura do repositório** (`app/backend`, sem `node_modules`): nenhum arquivo além de `.env.example` define variável `CREDITOGOV_*` com valor; nenhum número de 11 dígitos ou mais em `src/` e `test/`, fora das constantes numéricas de teste da task 5.

Se os testes passarem sem ajuste, o Developer provoca uma falha (por exemplo, retirando a redação do cookie), registra a falha no commit e desfaz a provocação.

### 24. Ajustar a redação dos logs e o script `dev`

Ajustes até a task 23 passar. Além disso, `npm run dev` com o banco local e um `.env` que o próprio desenvolvedor cria, sem commitar: a API sobe em `127.0.0.1:3000`.

### 25. Estrutura do `app/web`

- Vite com React 19 e TypeScript, mais `react-router`, `@fontsource-variable/inter`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event` e `oxlint`.
- Scripts `dev`, `build` (`tsc -b && vite build`), `lint` e `test`.
- `vite.config.ts` com o proxy de `/api` para `http://127.0.0.1:3000`, e `server.host` em `localhost`.
- `src/estilo/tokens.css` e `bundle.css` copiados de `docs/design/tokens/`, com o comentário de origem e o commit de onde vieram. `public/logo.png` copiado de `docs/design/assets/`.
- `index.html` com `data-theme="claro"` e `lang="pt-BR"`.
- `test/setup.ts` bloqueia o `fetch` real.
- `.gitignore` com `node_modules/` e `dist/`.
- Um teste trivial.

### 26. Testes do cliente da API e do `ProvedorSessao`

- O cliente manda `X-CreditoGov-Requisicao: 1` em todo método que muda estado e `credentials: "same-origin"`.
- `fetch` rejeitado e respostas 502, 503 e 504 viram `sem_conexao` (CA-18).
- `401 sessao_expirada` em rota logada leva a `/entrar?motivo=expirada`, e `401 sem_sessao` a `/entrar` (CA-20).
- O `ProvedorSessao` carrega `GET /api/sessao`, expõe `entrar` e `sair`, e `sair` chama `DELETE /api/sessao`.

### 27. Implementar `api/cliente.ts` e `sessao/ProvedorSessao.tsx`

Como na Spec.

### 28. Testes de `Entrar`, `PainelMarca` e `CampoSenha`

- **CA-18 e CA-7:**
  - não há botão nem texto de Google ou Microsoft, nem o divisor "ou com e-mail", nem "Criar conta";
  - aparecem os textos do formulário da Spec: "Entrar", "Use o e-mail cadastrado no CreditoGov.", "E-mail", "Senha", "Mostrar senha", "Esqueci a senha" e "Ainda não tem acesso? Fale com a equipe CreditoGov ou com o seu contador.".
- **CA-18:**
  - durante o envio, o botão fica desabilitado e com o indicador de carregamento;
  - o `401` mostra o alerta "E-mail ou senha incorretos";
  - o `fetch` rejeitado mostra "Sem conexão", e "Tentar de novo" reenvia;
  - o `429` mostra "Muitas tentativas. Tente de novo em alguns minutos.";
  - os erros de campo ficam ligados por `aria-describedby`;
  - "Mostrar senha" alterna o tipo do campo.
- **CA-20:** `/entrar?motivo=expirada` mostra "Sua sessão expirou. Entre de novo.".
- **CA-15:** o sucesso leva ao destino de CA-31 (simulado aqui com uma empresa).
- **`PainelMarca`:**
  - os três títulos e subtítulos exatos da Spec;
  - com temporizador falso, troca em 6 s;
  - não troca com o ponteiro em cima nem com o foco dentro;
  - com `matchMedia("(prefers-reduced-motion: reduce)")` verdadeiro, não troca sozinho;
  - os pontos têm `aria-label` "Mensagem N de 3" e `aria-current` na mensagem atual, e o clique troca a mensagem;
  - a região tem `aria-live="polite"`;
  - os cartões 1 e 2 têm o selo "Exemplo fictício", e o 3 tem "Só CBS".

### 29. Implementar `Entrar`, `PainelMarca`, `CampoSenha` e `Alerta`

As classes `cg-` vêm do `bundle.css`. Os cartões do `PainelMarca` usam os valores e a data fictícios definidos em P-S3 (ver Perguntas em aberto), fixos no código. Leiaute em duas colunas no desktop; no celular, o painel da marca acima ou recolhido, conforme o artboard descrito na Spec.

### 30. Testes de `EsqueciSenha`, `RedefinirSenha` e `AceitarConvite`

- **Fragmento:** as páginas leem `#t=` e `#e=&t=`, chamam `history.replaceState` para tirar o fragmento do endereço e mandam o token só no corpo do `POST`. O teste confere que nenhuma chamada a `fetch` tem o token na URL.
- **CA-23:** depois de enviar, sempre a mensagem da US, também com resposta da API para e-mail inexistente.
- **CA-24:** com o `204`, vai para `/entrar` com "Senha alterada. Entre com a nova senha.".
- **CA-25:** `410` mostra "Este link não vale mais" e o link para pedir outro.
- **CA-11:** convite sem conta mostra empresa, papel e os campos de nome, senha e confirmação; o sucesso entra na área logada.
- **CA-12:** convite com conta mostra o e-mail mascarado e só o campo de senha atual.
- **CA-13:** `410` mostra a mensagem de convite que não vale mais e a orientação de pedir outro a quem convidou.
- **CA-14:** a regra da senha aparece ao lado do campo, o `400 senha_invalida` mostra o motivo no campo, e confirmação diferente da senha é recusada antes do envio.

### 31. Implementar `EsqueciSenha`, `RedefinirSenha` e `AceitarConvite`

Como na Spec.

### 32. Testes de `/`, `EscolherEmpresa`, `LayoutEmpresa`, `BarraTopo`, `TrocaEmpresa`, `Inicio` e `Pessoas`

- **CA-31:** `/` sem sessão leva a `/entrar`. Com uma empresa, leva a `/e/:id`; com duas, a `/empresas` com a lista (nome, CNPJ raiz formatado, papel). Sem nenhuma, mostra a mensagem da Spec e "Sair", sem erro técnico.
- **CA-32:**
  - a barra mostra o nome e "CNPJ raiz 00.000.000";
  - a troca de empresa aparece só com mais de uma empresa e leva a `/e/:outroId`;
  - o avatar tem as iniciais;
  - "Sair" chama `DELETE /api/sessao` e leva a `/entrar`;
  - a página inicial diz "O painel de créditos ainda não está disponível nesta versão." e não contém número nem data.
- **CA-33:** o `404` em `/e/:id` mostra "Empresa não encontrada ou sem acesso" e o link para `/empresas`.
- **CA-8:** o formulário "Convidar" oferece só os papéis de `podeConvidar`, e o colaborador não vê o formulário.
- **CA-9:** o `409` mostra que a pessoa já tem acesso; o `202` mostra "Convite enviado".
- **CA-34:** "Remover" aparece só para o titular, desabilitado no último titular, com o motivo; o `409` mostra o motivo.

### 33. Implementar essas telas e a rota `/`

`LayoutEmpresa`, com o `useEmpresaEmFoco()` exportado para a 033, `BarraTopo`, `TrocaEmpresa`, `EscolherEmpresa`, `Inicio`, `Pessoas` e `rotas.tsx`.

### 34. Roteiro de conferência no navegador

`app/web/README.md` ganha a seção "Conferência no navegador", com dados fictícios:

1. subir o banco e migrar;
2. com `npm run admin`, criar duas empresas fictícias e convidar um titular e um contador;
3. abrir o convite pelo arquivo em `app/backend/.local/emails/`;
4. conferir login, erro, sem conexão (parar a API), muitas tentativas, recuperação, aceitar convite com e sem conta, escolha e troca de empresa, pessoas, remoção e sair;
5. repetir em largura de celular (por volta de 375 px) e de desktop, e com `prefers-reduced-motion` ligado.

O Developer roda o roteiro e registra o resultado no commit. A conferência visual que vale (P-9) é a do responsável, pedida pela sessão principal antes do PR.

### 35. READMEs de `app/backend` e `app/web`

- **Backend:**
  - requisitos (Node 24, Docker);
  - `banco:subir`, `migrar`, `dev`, `admin` (os quatro comandos) e `test`;
  - as variáveis, só os nomes, com a explicação de cada uma;
  - onde ficam os e-mails locais;
  - o aviso de que a autenticação `trust` é só local.
- **Web:** `dev` com o proxy, `test`, `lint`, `build` e a conferência da task 34.

### 36. `AGENTS.md` e `docs/PROJECT_CONTEXT.md`

- **`AGENTS.md`:**
  - na regra "Testes primeiro", o `app/backend` (demanda 034) testa com `npm test` (vitest), com `npm run banco:subir` antes, contra o PostgreSQL local do Compose, sem `.env` e sem rede externa; o `app/web` (034) testa com `npm test` (vitest e jsdom), sem rede;
  - na seção "Comandos", os blocos das duas aplicações;
  - a frase: "Agentes só apontam o backend para o banco local do Compose e não criam `.env`."
- **`PROJECT_CONTEXT.md`:**
  - §2: o login foi construído (034); não existem ainda coletor, credencial nem dados fiscais;
  - §3: a decisão de 2026-11-27 (Google e Microsoft para demanda própria, revendo o momento da decisão da 032 e citando as de 2026-08-25 e 2026-11-25; conta nasce por convite; papéis titular, contador e colaborador);
  - §4: o que existe no backend e na web, com os comandos;
  - §7: as pastas `app/backend` e `app/web`;
  - §11: a linha de 2026-11-27.

### 37. Design, arquitetura §13 e `hipoteses.md`

- **`docs/design/README.md`, Pontos de atenção:** os botões de provedor externo e o divisor "ou com e-mail" saíram do login até demanda própria (D-1). O subtítulo passou a ser "Use o e-mail cadastrado no CreditoGov.". As telas novas da 034 usam só componentes do design system (P-9).
- **`docs/design/design-system.md`:**
  - na seção 4, a linha "Login" sem Google e Microsoft e com o subtítulo novo;
  - os três textos do painel da marca da Spec (R-6), para o repositório não depender do artifact;
  - na seção 7, troca de "Provedores finais do login...: demanda 031" pela decisão da 034.
- **`docs/arquitetura/README.md` §13 (histórico), uma linha por mudança:**
  - AD-12: a lista de provedores é só a senha por ora (D-1);
  - seção 9: as variáveis novas e o uso de `CREDITOGOV_SESSAO_SEGREDO` como chave de HMAC;
  - R-3: o resultado (isolamento e `numeric` confirmados com Kysely; o item 3 fica com o coletor).
- **`docs/produto/hipoteses.md`:** "Papel do contador no sistema" resolvido: acesso próprio, por vínculo, em cada empresa que o convidou.

### 38. Verificação final

- **Comandos:** em `app/backend`, `npm run banco:subir`, `npm test`, `npm run lint` e `npm run build`; em `app/web`, `npm test`, `npm run lint` e `npm run build`. Tudo passa.
- **Varreduras:**
  - o diff da branch contra a `main` só toca `app/backend`, `app/web` e os documentos das tasks 36 e 37;
  - nenhum `.env`, `node_modules/`, `dist/` nem `.local/` versionado;
  - nenhum número de 11 dígitos ou mais em documento, fora da constante decimal `12345678901234.56` de CA-38;
  - nenhum e-mail fora de `exemplo.com.br` e `example.com`;
  - nenhum segredo.
- **Por fim:** os links dos documentos abrem e o `git status` está limpo.

## Mapa CA → tasks

| CA | Testes | Implementação |
|---|---|---|
| CA-1 | 1, 25, 38 | 1, 25, 35, 36 |
| CA-2 | 5 | 2, 6 |
| CA-3 | 1, 5, 25 | 1, 2, 25 |
| CA-4 | 3, 23 | 1, 4 |
| CA-5 | 15 | 16 |
| CA-6 | 15 | 16, 18 |
| CA-7 | 13, 28 | 14, 29 |
| CA-8 | 17, 32 | 18, 33 |
| CA-9 | 17, 32 | 18, 33 |
| CA-10 | 17 | 18 |
| CA-11, CA-12, CA-13 | 17, 30 | 18, 31 |
| CA-14 | 7, 17, 23, 30 | 8, 18, 31 |
| CA-15, CA-16 | 13, 28 | 14, 29 |
| CA-17 | 9, 13, 28 | 10, 14, 29 |
| CA-18 | 26, 28, 34 | 27, 29 |
| CA-19 | 7, 13 | 8, 14 |
| CA-20 | 13, 26, 28 | 14, 27, 29 |
| CA-21, CA-22 | 13 | 14 |
| CA-23, CA-24, CA-25 | 21, 30 | 22, 31 |
| CA-26 | 9, 21 | 10, 22 |
| CA-27 | 3, 11 | 4, 12 |
| CA-28 | 11 | 12 |
| CA-29, CA-30 | 19 | 20 |
| CA-31, CA-32 | 32, 34 | 33 |
| CA-33 | 19, 32 | 6, 20, 33 |
| CA-34 | 15, 19, 32 | 16, 20, 33 |
| CA-35 a CA-38 | 5 | 6 |
| CA-39 | 23 | 14, 24 |
| CA-40 | 38 | 35, 36, 37 |

## Perguntas em aberto

- **P-S3 (valores dos cartões do painel da marca):** a Spec tem os títulos, subtítulos e selos do artboard "Login", mas não o valor fictício do cartão 1, os CNPJs e valores fictícios do cartão 2 (quantas linhas) nem a data do cartão 3. Alternativas: (a) a sessão principal lê esses valores no artboard e os passa ao Developer antes da task 29; (b) o Developer usa valores fictícios fixos e visivelmente de exemplo: no cartão 1, R$ 12.345,67; no cartão 2, três linhas (`11.111.111/0001-11`, `22.222.222/0001-22` e "Emitente não identificado"), com valores redondos; no cartão 3, a data 25/11/2026, a da aprovação do design. Recomendação: (a), para ficar igual ao design aprovado; (b) só se o artifact não estiver à mão, com conferência do responsável na task 34. A task 29 é a única que depende desta resposta.
