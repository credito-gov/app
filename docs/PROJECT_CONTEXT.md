# PROJECT_CONTEXT — CreditoGov

> Fonte canônica do projeto. Leia inteiro antes de mexer em qualquer coisa.
> Se uma demanda, task ou documento antigo divergir daqui, **este arquivo vale** — pare e pergunte.
> Tudo que está em `docs/historico/` e `docs/tasks/` é registro do passado, não regra.

---

## 1. O que é

O **CreditoGov** é um SaaS B2B para pequenas e médias empresas no regime regular de CBS/IBS. Ele mostra ao empresário o crédito tributário gerado pelas compras como parte do caixa: quanto existe, de qual compra veio, o que já pode ser usado e o que ainda depende do fornecedor.

Três ideias sustentam o produto. Elas vieram da concepção (ago/2026) e continuam valendo:

1. **O ERP já calcula CBS/IBS.** O CreditoGov não calcula imposto. O valor está em tratar o crédito como ativo de caixa.
2. **Crédito vem das compras; venda gera débito.** O saldo é crédito menos débito.
3. **O crédito depende do recolhimento.** O adquirente só aproveita o crédito quando o débito do fornecedor foi extinto (por split payment, recolhimento pelo adquirente ou outra modalidade). Mostrar o que está confirmado e o que está pendente, por fornecedor, é o centro do produto.

Só CBS e IBS. Tributos antigos (PIS, Cofins, ICMS, ISS, IPI) ficam fora do escopo.

Visão de produto e negócio: [`produto/visao.md`](produto/visao.md).

---

## 2. Estado real do projeto

| Parte | Situação |
|---|---|
| Landing page (`app/landing-page`) | Redesign escuro concluído e na `main` (tasks 015–027, PR #10). Texto em postura de pré-lançamento desde a demanda 028: diz que o produto está em desenvolvimento e convida para a lista de espera, sem números, depoimentos ou promessas sem base. |
| Publicação da landing | <https://credito-gov.vercel.app/> mostra a versão clara antiga. O Vercel recusa publicar a partir do repositório (organização privada no plano gratuito), então o redesign **não está no ar** |
| Prova de conceito da API de apuração da CBS (`app/apuracao-cbs`) | Demanda 029. Aplicação de linha de comando, só leitura, com as quatro consultas; implementada e testada com respostas simuladas. **Chamada real feita em 2026-11-24:** o ciclo funcionou para créditos e débitos, que vieram vazios; recolhimentos e pagamentos responderam HTTP 404. Não é o backend do produto |
| Painel local (`app/painel`) | Demanda 030. Web local, sem login, em Node/TypeScript: lê a pasta de arquivos que a `apuracao-cbs` baixa e mostra saldo de crédito (quatro totais separados), débitos à parte, lista de créditos, detalhe da nota, pendências por emitente e a lista de arquivos. Só CBS. Testado com arquivos fictícios; não chama a API. Aceita, com marca, o `ni` de 14 dígitos que os arquivos reais trazem e o schema 1.0.0 não aceita. **Ferramenta interna de validação dos dados, não a primeira versão do produto para o usuário final;** o dashboard do usuário será feito do zero (demanda 033) |
| Design system do produto (`docs/design/`) | Demanda 032. Aprovado pelo responsável em 2026-11-25: tokens (tema claro principal e escuro), componentes e telas de login, dashboard e carteira do contador, com dados fictícios. Registro em [`design/`](design/README.md), sem código de aplicação; a stack é da demanda 031 |
| Backend, banco, autenticação | Arquitetura decidida na demanda 031 ([`arquitetura/README.md`](arquitetura/README.md)). **O login foi construído (demanda 034):** `app/backend` (API, PostgreSQL, convites, empresas, recuperação de senha) e `app/web` (login e escolha de empresa), só com e-mail e senha. **O dashboard foi construído (demanda 033), só com dados fictícios até existir o coletor:** não existem ainda coletor nem credencial da Receita, e fora do ambiente local toda empresa mostra "ainda não consultados". As tasks 001–005 antigas seguem suspensas (ver §5) |
| Validação de mercado (entrevistas, contadores, tributarista) | Sem registro no repositório |

---

## 3. Decisões tomadas

| Data | Decisão |
|---|---|
| 2026-08-12 | Escopo só CBS/IBS; tributos antigos fora |
| 2026-08-12 | O produto é gestão do crédito como caixa, não cálculo de imposto |
| 2026-08-25 | Omie descartado como canal de distribuição e como forma de login |
| 2026-08-25 | Autenticação própria da plataforma (email + senha), sem credencial de ERP. **Revista em 2026-11-25:** o login passa a aceitar também provedor externo (ver abaixo) |
| 2026-08-26 | Venda direta (SaaS), com escritórios de contabilidade como canal comercial principal |
| 2026-08-26 | Antecipação com fintech/FIDC fica para depois de haver base de clientes |
| 2026-11-23 | Fonte de dados dos créditos rebaixada de premissa para **hipótese em aberto** (ver §5) |
| 2026-11-23 | Fonte de dados **confirmada para a CBS**: APIs de apuração da CBS da Receita Federal. Produto começa só com CBS |
| 2026-11-23 | Fluxo de trabalho passa a ser por demandas (US → Spec → Tasks) com subagentes; o modelo de tasks + walkthrough fica congelado |
| 2026-11-25 | Design do produto (demanda 032): tema claro é o principal, com o escuro disponível, mesmos nomes de token nos dois |
| 2026-11-25 | Design do produto (demanda 032): paleta tirada do logo (verde e azul-marinho de `docs/design/assets/`) |
| 2026-11-25 | Design do produto (demanda 032): navegação por menu no topo, sem barra lateral |
| 2026-11-25 | Design do produto (demanda 032): login com provedor externo (Google e Microsoft propostos), além de e-mail e senha. **Revê a decisão de 2026-08-25** de autenticação própria só com e-mail e senha. Continua sem credencial de ERP ou da Receita no login. Provedores finais e impacto na arquitetura ficam para a demanda 031 |
| 2026-11-25 | Demanda 031: o CreditoGov é **SaaS multi-inquilino**, uma instalação única operada por nós. Sem instalação por cliente nem on-premise |
| 2026-11-25 | Demanda 031: o acesso a cada CNPJ é decidido pela Receita, pela credencial do gov.br. O CreditoGov não verifica representação nem procuração; só registra quem entregou cada credencial |
| 2026-11-25 | Demanda 031: cada cliente informa a própria credencial da Receita (cenário A, a base). Credencial de procurador para vários CNPJs (cenário B) é contingência, sem fonte |
| 2026-11-25 | Demanda 031: email e senha continuam a base do login e a arquitetura não bloqueia login federado (Google, Apple, Microsoft e gov.br). A lista final de provedores e quando entram é da demanda de login; complementa a decisão de login da 032, sem revogá-la |
| 2026-11-25 | Demanda 031: integração com ERP não é o modelo; o ERP é, no máximo, uma possível fonte de dados |
| 2026-11-25 | Demanda 031: `app/painel` é ferramenta interna de validação dos dados, não a primeira versão do produto; o dashboard do usuário é feito do zero |
| 2026-11-25 | Demanda 031: AD-1 a AD-14 em [`arquitetura/README.md`](arquitetura/README.md). Node 24 + TypeScript (AD-1); `app/backend` (api + coletor) e `app/web`, Fastify (AD-2); React 19 + Vite, página única (AD-3); PostgreSQL (AD-4); Kysely (AD-5); tabelas compartilhadas com segurança por linha (AD-6); nuvem gerenciada, provedor pendente da PD-1 (AD-7); arquivo bruto imutável em armazenamento de objetos (AD-8); coletor contínuo com fila no banco (AD-9); cifra de envelope com KMS para a credencial (AD-10); cenário A construído, modelo aceita o B (AD-11); autenticação própria com entidade `identidade` (AD-12); decimal exato do banco à tela (AD-13); PoC e painel seguem como ferramentas, leitor copiado (AD-14) |
| 2026-11-27 | Demanda 034 (D-1): o login entrega só e-mail e senha; **Google e Microsoft ficam para demanda própria**. Revê o momento da decisão da 032 de 2026-11-25 (login com provedor externo), que por sua vez revia a de 2026-08-25. O login federado continua previsto e a entidade `identidade` está pronta para ele (AD-12) |
| 2026-11-27 | Demanda 034 (D-2): **a conta nasce por convite**, sem cadastro aberto. A equipe CreditoGov cria a empresa e convida (`npm run admin`); quem tem vínculo convida outras pessoas. Papéis por vínculo: titular, contador e colaborador; o contador tem acesso próprio em cada empresa que o convidou |

---

## 4. Stack

### Landing page — o que existe

Vite 8, React 19, TypeScript 6, Tailwind CSS v4 (plugin do Vite), lint com `oxlint`. Publicada no Vercel. Precisa de Node 20.12 ou mais novo.

```bash
cd app/landing-page
npm install
npm run dev     # http://localhost:5173
npm run lint
npm run build   # tsc -b && vite build
```

Não há testes automatizados nem CI configurado.

### Prova de conceito da API de apuração da CBS (`app/apuracao-cbs`) — o que existe

Node 24 ou mais novo, TypeScript 6 (ESM), `vitest` nos testes, `oxlint` no lint, `ajv` (JSON Schema 2020-12), `big.js` (decimal exato) e `lossless-json` (números sem perda). Linha de comando, sem servidor nem banco; o estado local fica em `.local/`, ignorado pelo git. Os testes usam respostas simuladas e dados fictícios: não chamam a API real nem leem o `.env`. Esta PoC não decide a stack do painel.

```bash
cd app/apuracao-cbs
npm install
npm test
npm run lint
npm run build
npm run consulta -- <creditos|recolhimentos|pagamentos|debitos> [--tiquete <tiquete>]   # chama a API real
npm run ler -- <arquivo>                                                                    # sem rede
```

### Painel (`app/painel`) — o que existe

Node 24 ou mais novo, TypeScript 6 (ESM), servidor `node:http` que monta o HTML no servidor, sem framework de interface, sem Vite e sem JavaScript no navegador; formulários e links com parâmetros na URL. Mesmas ferramentas da `apuracao-cbs`: `vitest`, `oxlint`, `ajv`, `big.js`, `lossless-json`. Código de leitura, validação e formatação copiado da `apuracao-cbs` (não importado). Escuta só em `127.0.0.1`, sem login, só `GET` e `HEAD`. Os testes não usam rede nem `.env`; só o teste do servidor abre um socket, em `127.0.0.1`.

```bash
cd app/painel
npm install
npm test
npm run lint
npm run build
npm run gerar-ficticios
npm start -- [--pasta <caminho>] [--porta <n>]   # http://127.0.0.1:5180/, fictícios por padrão
```

### Backend e web do login (`app/backend`, `app/web`) — o que existe

Demanda 034 (decisões de 2026-11-27). Node 24 e TypeScript; API em Fastify, PostgreSQL 18.7 local pelo Docker Compose (porta 5433, só em `127.0.0.1`, autenticação `trust` só local), Kysely, senha com `argon2id`, sessão no servidor com cookie `HttpOnly`. Só e-mail e senha; conta por convite; recuperação de senha; escolha e troca de empresa; pessoas e remoção de vínculo; isolamento por linha confirmado com teste. E-mail só em adaptadores de arquivo e memória (sem provedor). A web é React 19 + Vite, com `react-router`. Os testes não usam `.env` nem rede externa. Detalhes nos READMEs de cada pasta.

**Dashboard (demanda 033).** No backend: migração `0002` (`consulta`, `arquivo_bruto`, `credito_lido`, `debito_lido`, com segurança por linha), leitura dos retornos (`src/leitura`, cópia revisada do núcleo do painel, com o múltiplo de 0,01 conferido em `big.js`), indicadores em funções puras (`src/indicadores`: consolidação, emitente pela chave, situação de cada serviço, créditos e débitos), as rotas `/api/empresas/:id/painel`, `/pendencias` e `/pendencias/:grupo/notas`, e o comando `carregar-cenario` com nove cenários fictícios. Na web: Visão geral, Pendências e notas do grupo, com cache de busca por empresa e recorte (`@tanstack/react-query`). Valores sempre em texto decimal, nunca `Number`. A carteira do contador entra na mesma demanda, nas tasks 32 a 38. Os textos são os provisórios da Spec até a transcrição dos artboards (P-S3).

```bash
cd app/backend
npm install
npm run banco:subir   # antes dos testes
npm test
npm run lint
npm run build
npm run migrar
npm run dev
npm run admin -- <criar-empresa|convidar|empresas-do-usuario|remover-vinculo> [opções]
npm run admin -- carregar-cenario --empresa <id> --cenario <nome>   # só local, dados fictícios

cd app/web
npm install
npm run dev
npm test
npm run lint
npm run build
```

### Produto (coletor e demais partes) — decidido, não construído

Decidido em 2026-11-25 (demanda 031); só o login foi construído (acima). Detalhes, alternativas e fontes em [`arquitetura/README.md`](arquitetura/README.md).

- **Backend:** Node 24 + TypeScript, em `app/backend` com dois processos, API (Fastify) e coletor agendado.
- **Web:** `app/web`, React 19 + Vite + TypeScript, página única que consome a API.
- **Dados:** PostgreSQL com Kysely; tabelas compartilhadas e identificador da empresa, com segurança por linha; valores em `numeric` e texto decimal, nunca `number`.
- **Arquivos brutos:** armazenamento de objetos imutável, com a leitura reconstruível.
- **Credencial da Receita:** cifra de envelope com KMS; cada cliente informa a sua.
- **Autenticação:** própria no backend, com a entidade `identidade` pronta para login federado.
- **Hospedagem:** nuvem gerenciada; o provedor depende da PD-1 (preço com fonte).

A proposta da concepção (Node.js + Express + TypeORM + PostgreSQL no backend; React + Redux Toolkit + shadcn/ui no painel), item a item:

| Item | Situação |
|---|---|
| Node.js, PostgreSQL, React | Confirmados |
| Express | Descartado (AD-2): Fastify, que valida com o `ajv` que o projeto já usa |
| TypeORM | Descartado (AD-5): Kysely, com SQL explícito para o isolamento por linha |
| Redux Toolkit | Descartado (AD-3): o estado é dado da API, em cache por empresa |
| shadcn/ui | Fora desta decisão: biblioteca visual é da demanda 032 |

O desenho antigo está em [`historico/2026-08-concepcao/05_ARQUITETURA_TECNICA.md`](historico/2026-08-concepcao/05_ARQUITETURA_TECNICA.md) e **não deve ser seguido como especificação**.

---

## 5. Hipóteses e decisões em aberto

Lista completa em [`produto/hipoteses.md`](produto/hipoteses.md). As que travam desenvolvimento:

- **Fonte de dados: resolvida para a CBS.** A Receita publica as APIs de apuração da CBS (créditos, débitos e pagamentos por CNPJ, com OAuth2). Ver [`referencias/apuracao-cbs/`](referencias/apuracao-cbs/README.md). A API **não** é a Plataforma de Split Payment, que liga PSPs ao governo. Os endpoints e tabelas da concepção continuam errados e não devem ser seguidos.
- **Acesso em nome de vários clientes (risco operacional, não bloqueia o cadastro).** Cada cliente informa a própria credencial (cenário A, a base, decidido em 2026-11-25). O risco é operacional: quantas credenciais existem e como o limite de 4 chamadas vale para cada uma. O modelo para uma credencial de procurador cobrir vários CNPJs (cenário B) não está documentado. Ver [`arquitetura/README.md`](arquitetura/README.md), seção 7, e as perguntas em [`produto/hipoteses.md`](produto/hipoteses.md).
- **IBS.** A API cobre só CBS.
- **Compensar e antecipar pelo painel.** A API permite gerar a guia de recolhimento pelo adquirente (RAD); não há serviço para disparar compensação. A antecipação depende de parceiro e de entendimento jurídico sobre cessão desse crédito.
- **Preço e comissão do contador** (R$ 100/mês e 15–20% são hipóteses da concepção).

As tasks 001–005 do modelo antigo foram escritas sobre endpoints e tabelas que não correspondem à API real e seguem suspensas; o backend volta como demanda nova.

---

## 6. Regras que valem sempre

### Domínio

- Não afirmar regra tributária sem fonte. O que estiver nos manuais de `referencias/` pode ser citado com o trecho; o resto entra como "a validar com tributarista".
- Não tratar as alíquotas de teste (CBS 0,9% e IBS 0,1%) como definitivas, nem dizer que o IBS substitui ICMS/ISS em 2027. Ver [`produto/reforma-tributaria.md`](produto/reforma-tributaria.md).
- Crédito não confirmado nunca é apresentado como disponível.

### Texto público (landing, materiais)

- Não prometer integração, sincronização, garantia ou funcionalidade que não exista.
- Não publicar depoimento, logo de cliente ou número de resultado inventado.

### Código

- Valores monetários em decimal de precisão fixa, nunca ponto flutuante.
- Nunca commitar `.env`, credenciais, tokens ou certificados. Nunca registrar esses dados em log.
- Nunca commitar `node_modules/`, `dist/` nem arquivos temporários.
- Sem PR com lint ou build falhando.
- Não criar funcionalidade que não foi pedida. Decisão técnica relevante vai para a Spec da demanda, não fica implícita no código.

---

## 7. Estrutura do repositório

```
credito-gov/
├── AGENTS.md                  # regras para agentes (o CLAUDE.md só importa este)
├── README.md
├── .claude/fluxo.json         # configuração do fluxo de demandas
├── app/
│   ├── landing-page/          # landing page
│   ├── apuracao-cbs/          # prova de conceito da API de apuração da CBS (linha de comando)
│   ├── painel/                # painel local: lê os arquivos da apuracao-cbs (sem login, só CBS)
│   ├── backend/               # API do produto: login, convites, empresas (034); coletor ainda não existe
│   └── web/                   # interface do produto: login e escolha de empresa (034)
└── docs/
    ├── PROJECT_CONTEXT.md     # este arquivo
    ├── README.md              # índice da documentação
    ├── produto/               # visão, hipóteses, reforma tributária
    ├── arquitetura/           # arquitetura do produto: decisões AD-N (stack, dados, coleta, credencial, autenticação)
    ├── design/                # design system, wireframes, marca
    ├── referencias/           # material oficial de terceiros (Split Payment, API de apuração da CBS, documentos fiscais)
    ├── demandas/              # kanban, templates e uma pasta por demanda
    ├── handoff/               # registros de passagem entre sessões
    ├── tasks/                 # modelo antigo (001–027), congelado
    └── historico/             # documentos da concepção, só para consulta
```

Aplicações novas entram em `app/<nome>`.

---

## 8. Convenções

- **Idioma:** documentação, commits e PRs em português.
- **Commits:** Conventional Commits (`feat(landing): ...`, `fix(...)`, `docs(...)`, `chore(...)`, `test(...)`, `refactor(...)`).
- **Branches:** `feat/NNN-slug`, `fix/NNN-slug` ou `docs/NNN-slug`, sempre a partir de `main`. Nunca trabalhar direto na `main`.
- **Demandas:** `NNN-slug`, numeração contínua a partir de 028 (001–027 são do modelo antigo).
- **Arquivos TypeScript:** `camelCase.ts` para utilitários, `PascalCase.tsx` para componentes React.
- **Markdown:** UTF-8, nomes de arquivo em minúsculas com hífen.

O fluxo de trabalho está em [`../AGENTS.md`](../AGENTS.md).

---

## 9. Glossário

| Termo | Significado |
|---|---|
| **CBS** | Contribuição sobre Bens e Serviços, federal. Substitui PIS e Cofins |
| **IBS** | Imposto sobre Bens e Serviços, de estados e municípios. Substitui ICMS e ISS de forma gradual |
| **CGIBS** | Comitê Gestor do IBS |
| **Regime regular** | Regime em que a empresa apura débito e crédito de CBS/IBS. É o público do produto |
| **Fornecedor / Adquirente** | Quem vende e quem compra. O crédito é do adquirente |
| **Crédito tributário** | Direito do adquirente sobre o CBS/IBS das compras. Exige destaque no documento fiscal e extinção do débito do fornecedor |
| **Split payment** | Segregação e recolhimento do CBS/IBS no momento da liquidação financeira do pagamento. De adoção facultativa por quem origina a transação |
| **PSP** | Prestador de serviço de pagamento (banco, instituição de pagamento). É quem fala com a Plataforma Pública de Split Payment |
| **Documento fiscal (DF)** | Nota que origina débito e crédito e que vincula o pagamento à operação |
| **Confirmado / Pendente** | Estados de um crédito para o produto: débito do fornecedor extinto ou ainda não |
| **Canal contábil** | Escritórios de contabilidade que levam o produto à carteira de clientes |

---

## 10. Referências

| Tema | Arquivo |
|---|---|
| Visão de produto e negócio | [`produto/visao.md`](produto/visao.md) |
| Hipóteses a validar | [`produto/hipoteses.md`](produto/hipoteses.md) |
| Reforma tributária: o que sabemos | [`produto/reforma-tributaria.md`](produto/reforma-tributaria.md) |
| APIs de apuração da CBS | [`referencias/apuracao-cbs/`](referencias/apuracao-cbs/README.md) |
| Manuais do Split Payment | [`referencias/split-payment/`](referencias/split-payment/README.md) |
| Leiaute da chave dos documentos fiscais | [`referencias/documentos-fiscais/`](referencias/documentos-fiscais/README.md) |
| Arquitetura do produto | [`arquitetura/`](arquitetura/README.md) |
| Design system e wireframes | [`design/`](design/README.md) |
| Kanban de demandas | [`demandas/README.md`](demandas/README.md) |
| Tasks do modelo antigo | [`tasks/README.md`](tasks/README.md) |
| Documentos da concepção | [`historico/`](historico/README.md) |

---

## 11. Changelog

| Data | Mudança |
|---|---|
| 2026-08-25 | Versão inicial. Removida a parceria Omie como canal |
| 2026-08-26 | Go-to-market definido: SaaS direto com canal contábil |
| 2026-11-23 | Fonte de dados confirmada para a CBS (APIs de apuração da Receita); novas pendências: acesso multi-cliente e IBS |
| 2026-11-23 | Redesign da landing concluído e mergeado na `main`; registrado que o Vercel não publica a partir do repositório |
| 2026-11-23 | Reescrito na reorganização geral: estado real do projeto, API da Receita rebaixada a hipótese, stack do backend marcada como proposta, fluxo por demandas, nova estrutura de pastas |
| 2026-11-23 | Landing em postura de pré-lançamento (demanda 028) |
| 2026-11-24 | Demanda 029: criada `app/apuracao-cbs`, prova de conceito de linha de comando da API de apuração da CBS (quatro consultas, só leitura). Chamada real pendente. A stack do painel continua não decidida |
| 2026-11-24 | Chamada real da prova de conceito (demanda 029): ciclo comprovado para créditos e débitos, sem dados no retorno; recolhimentos e pagamentos indisponíveis (HTTP 404); não há URL separada de produção restrita |
| 2026-11-24 | Demanda 030: criado `app/painel`, painel local sem login que lê os arquivos da `apuracao-cbs` (saldo em quatro totais separados, débitos à parte, lista de créditos, detalhe, pendências por emitente, arquivos). Segunda chamada real (outra credencial) trouxe dados: o `ni` vem com 14 dígitos e o schema 1.0.0 exige 8, tratado no painel como divergência conhecida. Leiaute da chave dos documentos fiscais registrado em `referencias/documentos-fiscais/`. Stack do painel local: Node/TypeScript com HTML no servidor |
| 2026-11-25 | Demanda 032: design system do produto aprovado e registrado em `docs/design/` (tokens claro e escuro, componentes, telas de login, dashboard e carteira do contador, com dados fictícios). Login com provedor externo revê a decisão de autenticação de 2026-08-25. O wireframe da concepção fica superado |
| 2026-11-25 | Demanda 031: arquitetura do produto decidida em `docs/arquitetura/` (AD-1 a AD-14; nada construído). SaaS multi-inquilino; cada cliente informa a própria credencial da Receita; login federado não bloqueado; `app/painel` é ferramenta interna. Stack do backend e hospedagem resolvidas em `hipoteses.md`, com o provedor pendente da PD-1 |
| 2026-11-27 | Demanda 034: construído o login do produto. `app/backend` (Fastify, PostgreSQL local no Compose, Kysely) e `app/web` (React + Vite), só com e-mail e senha; conta por convite; papéis titular, contador e colaborador. Google e Microsoft ficam para demanda própria (D-1). Isolamento por linha e `numeric` como texto confirmados com Kysely (R-3). Lista de senhas comuns: `@zxcvbn-ts/language-common` 4.2.0, decidida pelo responsável |
| 2026-11-28 | Demanda 033: construído o dashboard, só com dados fictícios até existir o coletor: migração `0002` (consultas, arquivos e notas), leitura dos retornos, indicadores em funções puras, rotas de painel, pendências e notas, comando `carregar-cenario` e as telas Visão geral, Pendências e notas do grupo. Conferência no navegador pendente do responsável |
