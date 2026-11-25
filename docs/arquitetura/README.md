# Arquitetura do produto CreditoGov

Documento de decisão de arquitetura da demanda [031](../demandas/031-stack-arquitetura/us.md). Cada decisão tem um identificador estável **AD-N**. Uma decisão revista depois **não é apagada**: ganha uma linha no [histórico](#13-histórico-de-decisões) dizendo qual AD a substitui.

Fontes sobre a API de apuração da CBS: [`../referencias/apuracao-cbs/README.md`](../referencias/apuracao-cbs/README.md), citada por seção, observação (O-N) ou divergência (N), sempre com a data. O que não tem fonte está em [Perguntas em aberto e pendências](#12-perguntas-em-aberto-e-pendências), nunca afirmado como fato.

## 1. Objetivo e estado

**Objetivo.** Decidir, com base em fatos, a stack, a hospedagem, o banco, a separação dos dados por empresa, a coleta agendada, a guarda da credencial de cada cliente e o lugar da autenticação do CreditoGov, dentro do modelo SaaS multi-inquilino. Com isso, as demandas de login e de dashboard (033) não refazem a base depois.

**Estado.** Decidido em 2026-11-25, pelo responsável, ao aprovar a Spec da demanda 031 ("Aprovo todas"), com as recomendações das AD-1 a AD-14. Na AD-7, o tipo de hospedagem está escolhido e o provedor está pendente da PD-1.

**Nada foi construído.** Não há aplicação nova, conta em provedor, infraestrutura nem chamada à API da Receita. As aplicações [`app/apuracao-cbs`](../../app/apuracao-cbs) e [`app/painel`](../../app/painel) não mudam.

## 2. Premissas

Decididas pelo responsável em 2026-11-25, com as palavras dele quando existem:

- **SaaS multi-inquilino.** "tem que seguir o modelo de saas". Uma única instalação, operada pelo CreditoGov, atende todas as empresas clientes por assinatura. Não há instalação por cliente nem on-premise.
- **O acesso a cada CNPJ é decidido pela Receita, pela credencial do gov.br.** "essa responsabilidade é da receita, eu poderia por exemplo 'representar' o cnpj de qualquer empresa, mas o que vai valer são as credenciais do gov.br para aquele cnpj". O CreditoGov **não verifica** representação nem procuração: usa a credencial que recebe, e o que ela permite acessar é o que vale.
- **Cada cliente informa a própria credencial.** "Cada cliente cadastrado na plataforma vai precisar informar a sua." A base é o cenário A (uma credencial por CNPJ); o cenário B (credencial de procurador que cobre vários CNPJs) fica como contingência (AD-11).
- **Email e senha como base, sem bloquear login federado.** "Pode não entrar agora, mas teria muita credibilidade se usar logins federados (google e apple), e mais ainda se der para usar o login do gov.br". O login por email e senha (decisão de 2026-08-25) continua a base; a arquitetura não impede Google, Apple nem gov.br no futuro (AD-12).
- **ERP só como possível fonte de dados.** Integração com ERP não é o modelo, nem canal de distribuição, nem forma de login.
- **`app/painel` é ferramenta interna** de validação dos dados, não a primeira versão do produto para o usuário final. O dashboard do usuário é feito do zero (AD-14).

## 3. Visão geral

Dois fluxos independentes, ligados pelo banco e pelo armazenamento de arquivos. O coletor não depende da API do produto, e a API não depende do coletor (AD-2, AD-9).

```mermaid
flowchart LR
  U[Usuario: empresa ou contador] --> W[Aplicacao web - AD-3]
  W -->|HTTPS| A[API - AD-2]
  A --> B[(PostgreSQL - AD-4)]
  C[Coletor agendado - AD-9] -->|token, abertura, situacao, download| R[API de apuracao da CBS - Receita]
  C --> F[(Armazenamento de arquivos imutavel - AD-8)]
  C --> B
  F -->|leitura e validacao| L[Leitura]
  L --> B
  K[KMS - AD-10] -.chave de dados.-> C
  A -.so cifra.-> K
```

Fluxo dos dados:

1. O usuário entra pela aplicação web, que só fala com a API. A web não acessa o banco (AD-3).
2. O cliente informa a credencial da Receita no cadastro; a API a cifra e grava, sem poder decifrá-la (AD-10).
3. O coletor, em processo próprio, abre consultas na API da Receita, acompanha a situação, baixa o arquivo e o guarda sem sobrescrever (AD-8, AD-9).
4. A leitura valida o arquivo e grava os dados lidos no banco, com a versão do leitor que os produziu (AD-8).
5. A API serve esses dados à web, isolados por empresa (AD-6).

Os componentes e as relações têm o modelo de dados conceitual na [AD-6](#ad-6--separação-dos-dados-por-empresa).

## 4. Decisões

Formato fixo de cada decisão: problema, critérios, alternativas com prós e contras, recomendação, escolha do responsável (com data), alternativas descartadas e fontes.

### AD-1 — Linguagem e runtime do backend

**Problema.** O produto precisa de uma API, de um coletor agendado e de leitura e validação dos arquivos da Receita.

**Critérios:** continuidade com o código existente; tipagem; bibliotecas de decimal exato e de JSON Schema 2020-12; equipe pequena; mesma linguagem na web.

| Alternativa | Prós | Contras |
|---|---|---|
| **A. Node 24 + TypeScript (ESM)** | As aplicações 029 e 030 já usam: leitura, validação (`ajv`, schemas oficiais), decimal (`big.js`), JSON sem perda (`lossless-json`), tolerância do `ni` e regras do emitente já escritas e testadas (`vitest`, `oxlint`). Mesma linguagem da landing e da aplicação web | Pede disciplina para não usar `number` em dinheiro (já resolvido na PoC) |
| B. Outra linguagem (Python, Go, Java, C#) | Ecossistemas maduros para backend | Reescrever o que 029 e 030 já provaram; duas linguagens no projeto |

**Recomendação:** A.

**Escolha do responsável:** A, Node 24 + TypeScript. Responsável, 2026-11-25 ("Aprovo todas").

**Descartada:** B, porque obrigaria a reescrever código já validado contra arquivos reais.

**Fontes:** [`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) §4 (o que existe em `app/apuracao-cbs` e `app/painel`); [`../referencias/apuracao-cbs/README.md`](../referencias/apuracao-cbs/README.md), O-1 a O-25 (arquivos reais lidos pelo código existente, 2026-11-24).

### AD-2 — Organização em aplicações e framework HTTP

**Problema.** Quantas aplicações novas e com qual framework a API é escrita.

**Critérios:** separar o processo da API do processo do coletor (o coletor não pode parar a API, e vice-versa); código de domínio compartilhado; validação de entrada; simplicidade.

**Organização recomendada:**

- `app/backend`: um pacote com dois pontos de entrada, `api` e `coletor`, que compartilham o código de domínio (leitura, validação, regras de crédito);
- `app/web`: a aplicação web (AD-3).

| Framework da API | Prós | Contras |
|---|---|---|
| Express (proposta da concepção) | O mais conhecido; muitas bibliotecas | Validação e tipagem por bibliotecas externas; tratamento de erro assíncrono depende da versão |
| **Fastify** | Validação de entrada e saída por JSON Schema, com `ajv`, a mesma biblioteca da PoC; tipagem TypeScript; plugins para cookie e sessão | Menos material que o Express |
| NestJS | Estrutura opinativa (módulos, injeção de dependência) | Camada a mais para uma equipe pequena; decorators |
| `node:http` puro (como o `app/painel`) | Zero dependência | Roteamento, validação, sessão e segurança escritos à mão |

**Recomendação:** organização em `app/backend` (api + coletor) e `app/web`, com Fastify na API.

**Escolha do responsável:** `app/backend` (api + coletor) e `app/web`, com Fastify na API. Responsável, 2026-11-25 ("Aprovo todas").

**Descartadas:**

- Express: a concepção não é especificação, e o Fastify já valida com o `ajv` que o projeto usa;
- NestJS: estrutura demais para o tamanho do time;
- `node:http` puro: segurança e sessão escritas à mão.

**Fontes:** [`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) §4 (proposta da concepção e o painel em `node:http`). A afirmação é sobre características gerais das bibliotecas; Fastify não foi usado no projeto (ver R-3 na [seção 12](#12-perguntas-em-aberto-e-pendências)).

### AD-3 — Aplicação web do produto

**Problema.** O framework e a forma de renderização do dashboard e das telas de cadastro. A demanda 033 aprovou a US do dashboard, com indicadores, estados e a carteira do contador (troca entre empresas). A biblioteca visual é da demanda 032.

**Critérios:**

- interação da carteira do contador (troca de empresa, filtros) sem recarregar tudo;
- não fixar biblioteca de componentes nem tokens, que são da 032;
- continuidade com a landing (React 19, Vite, TypeScript);
- hospedagem simples;
- a API como única porta dos dados.

| Alternativa | Prós | Contras |
|---|---|---|
| **A. React 19 + Vite + TypeScript, aplicação de página única consumindo a API** | Mesma base da landing; arquivos estáticos (hospedagem simples); separação limpa: a web não acessa o banco; deixa a 032 livre | Carga inicial maior que HTML do servidor; sem renderização no servidor (irrelevante numa área logada) |
| B. Next.js (React com renderização no servidor) | Renderização no servidor; rotas integradas | Um servidor Node a mais para operar; mistura camadas se acessar dados direto; mais acoplamento ao fornecedor do framework |
| C. HTML montado no servidor, sem JavaScript (como o `app/painel`) | Simples, seguro, já usado | Fraco para a carteira e os filtros do dashboard; não reaproveita a landing |
| D. React + Redux Toolkit + shadcn/ui (concepção) | Igual à A no framework | O estado do dashboard é quase todo dado vindo da API, o que não pede um estado global como o Redux; shadcn/ui é biblioteca visual e cabe à 032 |

**Recomendação:** A. Roteamento e busca de dados ficam para a Spec da implementação do dashboard, com um critério: estado vindo da API em cache por empresa, sem estado global. A biblioteca de componentes e a camada de estilo são da 032.

**Escolha do responsável:** A, React 19 + Vite + TypeScript, página única consumindo a API. Responsável, 2026-11-25 ("Aprovo todas").

**Descartadas:**

- B: um servidor a mais sem ganho numa área logada;
- C: não atende a interação da 033;
- D: Redux sem necessidade; shadcn/ui é decisão da 032.

**Fontes:** [`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) §4 (landing em React 19 e Vite; proposta da concepção); US da demanda 031, P-2 ([`us.md`](../demandas/031-stack-arquitetura/us.md)).

### AD-4 — Banco de dados

**Problema.** Onde ficam empresas, usuários, credenciais cifradas, consultas, metadados dos arquivos e dados lidos.

**Critérios:** decimal exato; isolamento por empresa no próprio banco; transações; migrações; serviço gerenciado nos provedores da AD-7.

| Alternativa | Prós | Contras |
|---|---|---|
| **A. PostgreSQL** | Tipo `numeric` exato; segurança por linha (row level security) para isolar empresas; `jsonb` se preciso; oferecido como serviço gerenciado pelos provedores da AD-7 | Exige cuidado com conexões em escala (pool) |
| B. MySQL | Também tem decimal exato e serviço gerenciado | Não tem segurança por linha nativa, então o isolamento fica só na aplicação |
| C. Banco de documentos (ex.: MongoDB) | Guarda o JSON da Receita como vem | Decimal e transações menos naturais; o JSON bruto já vai para o armazenamento de objetos (AD-8) |

**Recomendação:** A.

**Escolha do responsável:** A, PostgreSQL. Responsável, 2026-11-25 ("Aprovo todas").

**Descartadas:**

- B: perde a segunda barreira de isolamento (AD-6);
- C: o arquivo bruto não precisa estar no banco.

**Fontes:** características gerais dos bancos, sem preço. A ser confirmada com teste na primeira demanda de backend (R-3). Valores com 0 a 2 casas decimais no JSON da Receita: [`../referencias/apuracao-cbs/README.md`](../referencias/apuracao-cbs/README.md), O-13 (2026-11-24).

### AD-5 — Acesso a dados

**Problema.** Como o backend lê e escreve no PostgreSQL.

**Critérios:**

- `numeric` chega à aplicação como texto, nunca como `number`;
- funciona com a segurança por linha (fixar a empresa da transação antes das consultas);
- migrações versionadas;
- tipagem;
- SQL legível.

| Alternativa | Prós | Contras |
|---|---|---|
| TypeORM (proposta da concepção) | Conhecido; entidades com decorators | Decorators e entidades ativas escondem o SQL; fixar a empresa por transação junto com o gerenciamento de conexões dele exige cuidado |
| Prisma | Tipagem gerada; migrações | Decimal vem num tipo próprio, a converter para `big.js`; consultas fora do modelo dele ficam em SQL cru, o que também vale para fixar a empresa por transação |
| Drizzle | SQL tipado; `numeric` como texto; migrações | Projeto mais novo |
| **Kysely (construtor de consultas) + migrações dele** | SQL explícito e tipado; transação com comando de sessão simples; `numeric` como texto pelo driver `pg` | Sem modelo de entidades; os tipos do esquema são mantidos à mão ou gerados |

**Recomendação:** Kysely. Fica o SQL explícito, que combina com o isolamento por linha e com o decimal como texto.

**Escolha do responsável:** Kysely (segunda opção registrada: Drizzle). Responsável, 2026-11-25 ("Aprovo todas").

**Descartadas:**

- TypeORM: a concepção não é especificação, e o ORM esconde o SQL do isolamento;
- Prisma: conversão de decimal e SQL cru para o isolamento;
- Drizzle: alternativa aceitável, segunda opção.

**Fontes:** características gerais das bibliotecas, sem preço nem promessa de desempenho. Kysely não foi usado no projeto: a primeira demanda de backend confirma com teste o isolamento por linha e o `numeric` como texto (R-3).

### AD-6 — Separação dos dados por empresa

**Problema.** Dentro da operação única, como garantir que uma empresa nunca veja os dados de outra, sabendo que o contador vê várias.

**Critérios:** garantia mesmo com erro de programação; custo de operação com muitas empresas; migrações; consulta da carteira do contador (várias empresas numa tela).

| Alternativa | Prós | Contras |
|---|---|---|
| **A. Tabelas compartilhadas com o identificador da empresa + segurança por linha do PostgreSQL** | Uma migração para todos; a carteira consulta várias empresas numa consulta só; duas barreiras: a aplicação filtra, e o banco recusa o que não é da empresa fixada na transação | Toda tabela de dado de empresa precisa da regra de segurança, e os testes têm de provar o isolamento |
| B. Um schema por empresa | Isolamento visível | Migração repetida em cada schema; a carteira cruza schemas; o custo cresce com o número de empresas |
| C. Um banco por empresa | Isolamento máximo | Operação e custo proporcionais ao número de clientes; inviável para assinatura de PME |
| Fora do modelo: instalação por cliente, on-premise | — | **Descartada pela decisão de 2026-11-25** ("tem que seguir o modelo de saas") |

**Unidade de empresa:** a raiz do CNPJ (8 dígitos). Fonte: a API usa o CNPJ base na consulta, e um arquivo traz notas de vários estabelecimentos da mesma raiz ([`../referencias/apuracao-cbs/README.md`](../referencias/apuracao-cbs/README.md), O-24, 2026-11-24). "Vários CNPJs por cliente" (várias raízes num mesmo assinante, por exemplo um grupo) continua decisão em aberto em [`hipoteses.md`](../produto/hipoteses.md). O modelo abaixo aceita as duas respostas: o agrupamento seria uma entidade acima de `empresa`, sem mudar o isolamento.

**Contador:** um usuário com vínculos em várias empresas. A consulta da carteira fixa na transação o **conjunto** de empresas em que o usuário tem vínculo. Permissões por papel ficam para a demanda de login.

**Condições para a segurança por linha valer** (sem elas o banco não é uma segunda barreira):

- **Papel da aplicação sem posse das tabelas e sem `BYPASSRLS`**, e as tabelas com `FORCE ROW LEVEL SECURITY`. O dono da tabela e quem tem `BYPASSRLS` ignoram as regras. As migrações rodam com outro papel, que a aplicação não usa.
- **A empresa (ou o conjunto, no caso do contador) é fixada só com `SET LOCAL` ou `set_config(..., true)`, por transação.** Nunca `SET` de sessão: com pool de conexões, o valor ficaria na conexão e vazaria para a transação seguinte, de outra empresa.
- **O coletor roda sob a mesma regra:** trabalha empresa por empresa, fixando a empresa da consulta em cada transação, com o mesmo tipo de papel (sem posse e sem `BYPASSRLS`). Um papel próprio só se justifica por tarefa que precise cruzar empresas (por exemplo, achar quais consultas vencem hoje); nesse caso a justificativa e o alcance do papel ficam registrados no histórico (seção 13), e ele não lê dados de empresa.

Essas três condições entram no teste de isolamento (seção 9) e no R-3.

**Recomendação:** A, com o isolamento garantido na aplicação **e** no banco.

**Escolha do responsável:** A, tabelas compartilhadas com o identificador da empresa + segurança por linha do PostgreSQL. Responsável, 2026-11-25 ("Aprovo todas").

**Descartadas:**

- B e C: custo e operação crescem com cada cliente, e a carteira fica difícil;
- instalação por cliente e on-premise: fora do modelo SaaS (decisão de 2026-11-25).

**Fontes:** O-24 da referência, 2026-11-24; premissa de 2026-11-25 (seção 2); US da demanda 031 (CA-9 e CA-10).

#### Modelo de dados conceitual

São só as entidades e as relações que as decisões exigem, sem colunas nem migração: o esquema real é da primeira demanda de backend.

| Entidade | O que é | Relações |
|---|---|---|
| `empresa` | A unidade de inquilino: uma **raiz de CNPJ** (8 dígitos), como na API (`{cnpj}` base) e na O-24 | Tem estabelecimentos, que aparecem nos documentos; tem uma ou mais credenciais ao longo do tempo |
| `usuario` | Pessoa que entra no CreditoGov | N:N com `empresa`, por `vinculo_empresa` |
| `vinculo_empresa` | Liga usuário a empresa. O papel (titular, contador, outro) fica para a demanda de login | Um usuário com várias empresas (a carteira do contador); uma empresa com vários usuários |
| `identidade` | Forma de login de um usuário: email e senha hoje; Google, Apple ou gov.br depois (AD-12) | N:1 com `usuario` |
| `credencial_receita` | O par `client_id`/`client_secret` cifrado (AD-10), com o estado (`ativa`, `invalida`, `substituida`, `removida`) | **N:N com `empresa` por `credencial_empresa`**, restrito a 1:1 por regra no cenário A (AD-11) |
| `credencial_entrega` | Rastreio: quem informou, quando, para qual empresa e de que forma (titular ou procurador, **como declarado**, sem verificação) | Uma por entrega ou troca; imutável |
| `consulta` | Uma solicitação à API: serviço, empresa, credencial, tíquete, estado, horários e erro | Máquina de estados da AD-9 |
| `chamada_receita` | Cada chamada feita (token, abertura, situação, download, arquivo), com HTTP e horário, sem segredo | Base do orçamento do limite, como o `.local/chamadas.jsonl` da PoC |
| `arquivo_bruto` | Metadados do arquivo baixado (serviço, empresa, tíquete, `geradoEm`, hash, versão do schema, onde está) | O conteúdo fica no armazenamento de objetos (AD-8) |
| `leitura` | Dados lidos de cada arquivo (créditos, débitos e o resto), com a versão do leitor que os produziu | Reconstruível a partir dos `arquivo_bruto` (AD-8) |

Toda tabela com dado de empresa leva o identificador da empresa (AD-6).

### AD-7 — Hospedagem

**Problema.** Onde roda a operação única: API, coletor, web estática, banco, arquivos, chaves.

**Critérios:**

- custo (só com fonte);
- operação por equipe pequena;
- processo contínuo para o coletor (a espera de até 240 min é estado no banco, não processo preso, ver AD-9);
- serviço de chaves (KMS) para a credencial (AD-10);
- backup do banco e dos arquivos;
- região no Brasil.

A região no Brasil é critério de latência e de cuidado com dados. Se a lei exige ou não é pergunta para advogado (seção 8).

| Alternativa | Prós | Contras |
|---|---|---|
| **A. Nuvem grande com serviços gerenciados (AWS, Google Cloud ou Azure): contêineres gerenciados para API e coletor, PostgreSQL gerenciado, armazenamento de objetos, KMS e hospedagem estática da web** | KMS e armazenamento de objetos com bloqueio de sobrescrita no mesmo provedor; backup gerenciado; região no Brasil a confirmar na página de cada provedor | Mais conceitos para configurar; risco de custo sem limite, se não houver alerta de gasto |
| B. Plataforma como serviço simplificada (ex.: Render, Railway, Fly.io) | Deploy simples | KMS e região no Brasil não garantidos (a confirmar); a credencial pode exigir um segundo provedor só para chaves |
| C. Servidor virtual próprio com contêineres | Custo previsível | Backup, atualização, chaves e segurança ficam todos com a equipe |

**Custo estimado.** **Sem fonte.** Nenhuma página oficial de preço foi lida e citada com data nesta demanda, e nenhum valor entra sem ela. Cada linha abaixo fica "a confirmar (PD-1)" até alguém ler a página oficial de preço do provedor e registrar o endereço e a data da leitura.

| Provedor | Contêineres (API e coletor) | PostgreSQL gerenciado | Armazenamento de objetos | KMS | Região no Brasil | Fonte e data |
|---|---|---|---|---|---|---|
| AWS | a confirmar (PD-1) | a confirmar (PD-1) | a confirmar (PD-1) | a confirmar (PD-1) | a confirmar (PD-1) | sem página lida |
| Google Cloud | a confirmar (PD-1) | a confirmar (PD-1) | a confirmar (PD-1) | a confirmar (PD-1) | a confirmar (PD-1) | sem página lida |
| Azure | a confirmar (PD-1) | a confirmar (PD-1) | a confirmar (PD-1) | a confirmar (PD-1) | a confirmar (PD-1) | sem página lida |

**Recomendação:** A. O tipo (nuvem gerenciada) se decide pelos critérios não financeiros. O provedor (AWS, Google Cloud ou Azure) sai da tabela de custo com fonte (PD-1). Não há preferência técnica forte entre os três para o que esta arquitetura usa.

**Escolha do responsável:** tipo A, nuvem grande com serviços gerenciados; provedor (AWS, Google Cloud ou Azure) pendente da PD-1. Responsável, 2026-11-25 ("Aprovo todas").

**Descartadas:**

- B: guarda de chaves e região incertas;
- C: operação demais para a equipe;
- instalação por cliente e on-premise: fora do modelo SaaS (2026-11-25).

**Fontes:** o limite de 240 min de processamento vem da [referência](../referencias/apuracao-cbs/README.md), seção "Fluxo de uma consulta" (lida em 2026-11-24). Preço: nenhuma fonte (PD-1, na [seção 12](#12-perguntas-em-aberto-e-pendências)). A primeira demanda de backend roda local e não depende desta escolha (R-4).

### AD-8 — Guarda do arquivo bruto e reconstrução

**Problema.** A API não devolve histórico: cada chamada traz só o que mudou nos últimos 8 dias, e o que não for coletado a tempo se perde (referência, seção "Consulta incremental"). O arquivo perdido não volta. A regra de leitura vai mudar: o schema já diverge do arquivo real (divergência 10 da referência, confirmada em 2026-11-24), e as hipóteses D-2 a D-6 de [`hipoteses.md`](../produto/hipoteses.md) estão abertas.

**Critérios:** imutável; com backup; reprocessável; separado por empresa.

| Alternativa | Prós | Contras |
|---|---|---|
| **A. Armazenamento de objetos com sobrescrita bloqueada e versionamento; metadados e hash em `arquivo_bruto`** | Barato para arquivos grandes (o limite de leitura do painel é 200 MB; o maior arquivo real observado tem menos de 1 MB, demanda 030); imutável por configuração; backup por replicação | Dois lugares a manter coerentes (objeto e linha) |
| B. Arquivo dentro do PostgreSQL (`jsonb` ou binário) | Uma só cópia de segurança | Banco cresce com arquivos grandes; `jsonb` perde a forma original dos números |
| C. Disco do servidor (como a PoC em `.local/`) | Simples | Perde-se com o servidor; sem replicação |

**Reconstrução.** Cada linha de `leitura` guarda a versão do leitor. Quando a regra muda (schema novo, tolerância nova, D-5 confirmada), um comando relê os `arquivo_bruto` da empresa e regrava `leitura`, sem chamar a API. O arquivo é guardado **antes** de ser validado, como na PoC: arquivo recusado também fica.

**Recomendação:** A.

**Escolha do responsável:** A, armazenamento de objetos imutável + metadados em `arquivo_bruto`. Responsável, 2026-11-25 ("Aprovo todas").

**Descartadas:**

- B: o tamanho dos arquivos e a perda da forma original dos números;
- C: o arquivo se perde junto com o servidor.

**Fontes:** [referência](../referencias/apuracao-cbs/README.md), seção "Consulta incremental" e divergência 10 (2026-11-24); números com 0 a 2 casas no JSON, O-13; hipóteses D-2 a D-6 em [`hipoteses.md`](../produto/hipoteses.md).

### AD-9 — Coletor agendado

**Problema.** Consultar cada serviço de cada empresa a tempo (janela de 8 dias), dentro dos limites, aguentando até 240 min de processamento, com 48 h para baixar o arquivo e sem gastar chamada à toa. O desenho completo (ciclo, orçamento, falhas e alertas) está na [seção 5](#5-coleta-agendada).

**Critérios:** sobreviver a reinício; contar cada chamada; nunca repetir abertura sem decisão explícita; simplicidade.

| Alternativa | Prós | Contras |
|---|---|---|
| **A. Processo coletor contínuo, com fila e máquina de estados no PostgreSQL** | Estado sobrevive a reinício; a contagem do limite fica na mesma transação do estado; nenhum serviço a mais | O coletor é um processo sempre ligado |
| B. Agendador + funções sob demanda (serverless), estado no banco | Paga só pelo uso | Cada passo vira uma função, o que traz mais peças e mais acoplamento ao provedor |
| C. Fila gerenciada do provedor | Retentativas prontas | Retentativa automática pode gastar chamada do limite sem querer; estado em dois lugares |

**Recomendação:** A, com o desenho da seção 5.

**Escolha do responsável:** A, processo coletor contínuo com fila e máquina de estados no PostgreSQL. Responsável, 2026-11-25 ("Aprovo todas").

**Descartadas:**

- B: peças demais e acoplamento ao provedor;
- C: retentativa automática pode gastar o limite da Receita.

**Fontes:** [referência](../referencias/apuracao-cbs/README.md): seção "Fluxo de uma consulta" (240 min, 48 h, aviso sem autenticação), "Consulta incremental" (8 dias), "Limite de uso", divergências 1, 5, 6 e 9, "Observado na chamada real (2026-11-24)"; manual Receita Integra v1.4 (17/07/2026) para o token; notícia oficial de 09/11/2026 para os serviços novos.

### AD-10 — Guarda e ciclo da credencial da Receita

**Problema.** Cada cliente informa a própria credencial (decisão de 2026-11-25): um `client_id` e um `client_secret` que dão acesso aos dados fiscais da empresa. O ciclo e as regras de acesso estão na [seção 6](#6-credencial-da-receita).

**Critérios:**

- chave de cifra fora do banco;
- menor número de processos capazes de decifrar;
- nunca aparecer em log, tela ou erro;
- remoção definitiva quando o cliente sai.

| Alternativa | Prós | Contras |
|---|---|---|
| **A. Cifra de envelope: KMS do provedor guarda a chave mestra; cada credencial tem chave de dados própria; o banco guarda só o texto cifrado** | Chave fora do banco; permissões separadas (a API só cifra, o coletor decifra); a remoção apaga a chave de dados, o que torna ilegível o texto do banco vivo | Depende do KMS (já incluído na AD-7); a remoção não alcança backups e réplicas (ver "Remoção e backups" na seção 6) |
| B. Um segredo por cliente no gerenciador de segredos do provedor | Rotação e auditoria prontas | Custo e limite por segredo (a confirmar, PD-1); muitos segredos para administrar |
| C. Cifra na aplicação com chave em variável de ambiente | Simples | Chave junto da aplicação; quem lê a variável lê todas as credenciais |

**Recomendação:** A, com as regras da seção 6.

**Escolha do responsável:** A, cifra de envelope com KMS. Responsável, 2026-11-25 ("Aprovo todas").

**Descartadas:**

- B: custo e administração por segredo;
- C: a chave fica junto da aplicação.

**Fontes:** [referência](../referencias/apuracao-cbs/README.md), seção "Fluxo de uma consulta" (passo 1: credencial gerada pelo contribuinte ou pelo procurador digital; chaves anteriores à versão 2.0, liberada em 28/10/2026, precisam ser geradas de novo) e seção "O que não está documentado" (token: validade de 1 hora e limite de 2 por hora, manual Receita Integra v1.4).

### AD-11 — Cenários de acesso: A como base, B como contingência

**Problema.** Quantas credenciais existem por empresa e como o limite se aplica. Premissas de 2026-11-25: o acesso é decidido pela Receita; cada cliente informa a sua. O detalhe está na [seção 7](#7-cenários-de-acesso).

**Critérios:** respeitar a decisão de 2026-11-25; não refazer o modelo se o cenário B existir; não desenhar sem fonte.

| Alternativa | Prós | Contras |
|---|---|---|
| **A. Construir só o cenário A; o modelo já aceita o B** (`credencial_empresa` N:N, restrito a 1:1 por regra; orçamento contado por credencial e por CNPJ) | Atende a decisão do responsável; passar ao B é trocar uma regra, sem migração de modelo | Um pouco mais de modelo do que o A precisa |
| B. Modelar só o A (credencial como campo da empresa) | Mais simples hoje | Passar ao B exige migrar o modelo e o orçamento |
| C. Construir A e B desde já | Pronto para escritório com credencial de procurador | Desenha algo que pode não existir (sem fonte) e contraria a decisão de 2026-11-25 |

**Recomendação:** A.

**Escolha do responsável:** A, construir só o cenário A, com o modelo aceitando o B. Responsável, 2026-11-25 ("Aprovo todas").

**Descartadas:**

- B: migração futura;
- C: desenha sem fonte e contra a decisão do responsável.

**Fontes:** [referência](../referencias/apuracao-cbs/README.md), seção "O que não está documentado" (acesso por software em nome de vários contribuintes) e divergência 1 (limite de 4 chamadas, "por dia" só na FAQ); perguntas em [`hipoteses.md`](../produto/hipoteses.md), H1.

### AD-12 — Onde fica a autenticação

**Problema.** Onde ficam o login por email e senha (decisão de 2026-08-25) e a sessão. Login federado com Google, Apple ou gov.br não pode ser bloqueado depois (decisão de 2026-11-25). Tela, cadastro, recuperação de senha e permissões são da demanda de login.

**Critérios:**

- respeitar 2026-08-25: login do CreditoGov, sem credencial de ERP (um serviço gerenciado é aceitável se o usuário só vê o login do CreditoGov, P-3 da US);
- segurança da senha (guarda, MFA, recuperação);
- facilidade de acrescentar Google, Apple e gov.br;
- custo (sem fonte, ver PD-1);
- dados dos usuários no mesmo provedor e região;
- dependência de fornecedor.

| Alternativa | Prós | Contras |
|---|---|---|
| **A. Autenticação própria no backend**: senha com hash `argon2id` por biblioteca consolidada, sessão no servidor com cookie `HttpOnly` e `Secure`, entidade `identidade` separada de `usuario` | Sem custo por usuário; dados no mesmo banco e região; controle total do fluxo. O login federado entra como uma nova linha em `identidade`, por OpenID Connect (Google e Apple oferecem login federado por esse padrão aberto) | A equipe responde pela segurança da senha, pela recuperação e pelo MFA |
| B. Serviço de identidade gerenciado (ex.: Auth0, Amazon Cognito, Firebase Authentication, Clerk) com a marca do CreditoGov | Senha, MFA, recuperação e Google/Apple prontos | Custo por usuário (a confirmar, PD-1); dados de usuário fora do banco e talvez da região; trocar de fornecedor depois é caro; o gov.br dependeria do suporte do serviço (sem fonte) |
| C. Servidor de identidade próprio separado (ex.: Keycloak) | Federado e MFA prontos, sem custo por usuário | Mais um sistema para operar e atualizar; pesado para o tamanho atual |

**Efeito sobre o login federado:**

- Na A, cada provedor entra como uma integração no backend. Uma conta pode ter várias formas de login, ligadas pelo `usuario`, e a regra para ligar email e senha a uma conta Google com o mesmo email é decidida na demanda de login.
- Na B, Google e Apple vêm prontos, mas o gov.br depende do fornecedor.
- Na C, a mesma flexibilidade da A, com mais operação.
- **gov.br:** se e em que condições um software privado pode usar o login do gov.br **não tem fonte** em `docs/referencias/`. Não é afirmado aqui; é pergunta em aberto (seção 12 e [`hipoteses.md`](../produto/hipoteses.md)).

**Ligação com a demanda 032 (design system).** O desenho do login da 032 (PR credito-gov/app#33, ainda não mergeado quando esta decisão foi escrita) já mostra entrada por provedor externo, com Google e Microsoft propostos, além de email e senha, e deixa os provedores finais e o impacto na arquitetura para esta demanda. A autenticação própria com a entidade `identidade` **não bloqueia** Google, Apple, Microsoft nem gov.br: cada um é uma linha nova de identidade, sem mudar o modelo. A **lista final de provedores e quando entram é da demanda de login** ("pode não entrar agora"). Isso complementa a decisão de login do design, sem revogá-la; a recomendação aprovada não muda.

**Recomendação:** A. Respeita 2026-08-25 sem leitura ampla, não tem custo por usuário, mantém os dados de usuário no mesmo lugar e deixa a entidade `identidade` pronta para o federado. Se a demanda de login concluir que MFA e recuperação próprios pesam demais, a B fica como segunda opção registrada.

**Escolha do responsável:** A, autenticação própria no backend com a entidade `identidade` (segunda opção registrada: B). Responsável, 2026-11-25 ("Aprovo todas").

**Descartadas:**

- B: custo sem fonte, dependência do fornecedor e o gov.br incerto;
- C: operação demais para o tamanho atual.

**Fontes:** [`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) §3 (decisão de 2026-08-25); US da demanda 031, P-3; premissa de 2026-11-25 (seção 2). Características gerais dos serviços e padrões citados, sem preço. Sobre o gov.br: nenhuma fonte.

### AD-13 — Valores monetários

**Problema.** Dinheiro nunca em ponto flutuante, do banco à tela ([`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) §6).

**Critérios:** exatidão ao centavo; compatibilidade com o JSON da Receita (números com 0 a 2 casas, O-13); simplicidade.

| Alternativa | Prós | Contras |
|---|---|---|
| **A. `numeric` com 2 casas no banco; texto decimal na aplicação (`big.js`); texto decimal no JSON da API (ex.: `"1234.50"`); leitura do arquivo da Receita com `lossless-json`; a web formata a partir do texto, sem converter para `number`** | Exato em toda a cadeia; mesmas bibliotecas da PoC e do painel | Cada camada precisa respeitar a regra (testes) |
| B. Inteiro em centavos em todas as camadas | Aritmética simples | Converte na entrada e na saída; risco de passar de `Number.MAX_SAFE_INTEGER` se virar `number` no navegador |

**Recomendação:** A. Ponto de atenção herdado: a validação com `multipleOfPrecision` pode recusar por engano valores acima de alguns bilhões (limite conhecido do painel, no [handoff da 030](../handoff/SESSION-HANDOFF-2026-11-24-030.md)). A primeira demanda de backend trata isso.

**Escolha do responsável:** A, `numeric` com 2 casas e texto decimal em toda a cadeia. Responsável, 2026-11-25 ("Aprovo todas").

**Descartada:** B, pelas conversões em toda entrada e saída.

**Fontes:** [referência](../referencias/apuracao-cbs/README.md), O-13 (2026-11-24); [handoff da demanda 030](../handoff/SESSION-HANDOFF-2026-11-24-030.md).

### AD-14 — Destino de `app/apuracao-cbs` e `app/painel`

**Problema.** O que das duas aplicações passa ao produto.

**Critérios:** não mexer no que funciona (as duas ficam fora de escopo da demanda 031); reaproveitar o que já foi validado contra arquivos reais; não contrariar a decisão de que o dashboard do usuário é feito do zero.

| Alternativa | Prós | Contras |
|---|---|---|
| **A. As duas continuam como ferramentas internas (diagnóstico da API e validação dos dados); o `app/backend` começa com uma cópia revisada do código de leitura e validação** | Não mexe no que funciona; a cópia já é o precedente da 030 | Três cópias do leitor até a unificação |
| B. Extrair já um pacote compartilhado usado pelas três | Uma cópia só | Mexe nas duas aplicações (fora de escopo da US) e atrasa o backend |
| C. Evoluir `app/painel` até virar o produto | Reaproveita telas | Contraria a decisão de que o dashboard do usuário é feito do zero; HTML sem JavaScript não atende a 033 |

**O que passa ao produto, por cópia revisada:**

- schemas oficiais e `versoes.json`;
- validação com a tolerância única do `ni` (D-2);
- decimal e JSON sem perda;
- tabelas de documento e origem;
- emitente pela chave (D-4);
- consolidação de versões (D-5);
- redação de segredo.

**O que não passa:**

- a interface de linha de comando;
- o estado em `.local/`;
- a leitura de `.env`;
- o servidor HTML do painel.

**O que segue só como ferramenta:**

- `npm run consulta`, para diagnóstico manual pelo responsável;
- o painel, para conferir arquivos.

A unificação em pacote compartilhado vira item de backlog.

**Recomendação:** A.

**Escolha do responsável:** A, as duas aplicações como ferramentas internas e cópia revisada do leitor no `app/backend`. Responsável, 2026-11-25 ("Aprovo todas").

**Descartadas:**

- B: fora de escopo agora;
- C: contraria a decisão de 2026-11-25.

**Fontes:** [`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) §2 e §4 (o que existe nas duas aplicações); hipóteses D-2, D-4 e D-5 em [`hipoteses.md`](../produto/hipoteses.md); [referência](../referencias/apuracao-cbs/README.md), divergência 10 e O-16 a O-24 (2026-11-24).

## 5. Coleta agendada

Detalha a [AD-9](#ad-9--coletor-agendado). Fontes: [referência](../referencias/apuracao-cbs/README.md). Os comportamentos observados valem para um dia e uma empresa (2026-11-24): a referência manda conferir de novo antes de depender deles, e o documento manda reconferir a referência antes de cada demanda de coletor (R-2).

### Ciclo de uma consulta

Estados de `consulta`: `agendada` → `aberta` (com tíquete) → `concluida` → `baixada` → `lida`. Os estados finais de erro são `erro`, `expirada`, `credencial_invalida` e `servico_indisponivel`.

- **Tíquete.** É gravado **na mesma transação** que registra a chamada de abertura, antes de qualquer outro passo. É a mesma regra da PoC: o tíquete vale uma abertura do limite (seção "Limite de uso").
- **Espera.** Só por consulta de situação, com `urlRetorno` vazio, que foi aceito na chamada real (HTTP 201 em créditos e débitos; divergência 6; "Observado na chamada real", 2026-11-24). Intervalo mínimo de 5 minutos entre consultas de situação, o padrão da PoC. Depois de 240 min sem conclusão, a consulta vira `expirada` (seção "Fluxo de uma consulta"; divergência 5: guia e FAQ falam em "status de erro", a página de situação mostra `EXPIRADA`, e os dois são tratados como fim).
- **Por que não o aviso (`urlRetorno`).** Exige endereço público nosso e não tem assinatura nem autenticação (seção "Fluxo de uma consulta"). Se um dia for adotado, vale só como sinal para consultar a situação antes do horário, nunca como resultado.
- **Download.** Logo depois de `CONCLUIDA`, bem antes das 48 h (seção "Fluxo de uma consulta"; a divergência 7 registra 24 h no manual da Plataforma da CBS v1, que não vale onde diverge da v2). Se falhar, nova URL assinada pelo mesmo tíquete, sem nova abertura.
- **Reinício.** Ao subir, o coletor retoma as consultas `aberta` e `concluida` pelo tíquete gravado. A espera é estado no banco, não processo preso.

### Frequência e orçamento

Por empresa, por serviço, por credencial:

- **Uma abertura por dia** em cada serviço disponível (créditos e débitos), o que usa **1 das 4 chamadas** (limite por API e por credencial; "por dia" só na FAQ, divergência 1, não testada). Sobram 3 para casos decididos.
- A cadência diária deixa **7 dias de folga** dentro da janela de 8 (seção "Consulta incremental": consultar pelo menos uma vez a cada 8 dias, por serviço e por cliente).
- **Não reabrir no mesmo dia** depois de uma consulta concluída: a segunda abertura de créditos feita cerca de 2 min depois da primeira concluída respondeu HTTP 400, sem motivo conhecido ("Observado na chamada real", 2026-11-24; a divergência 1 registra a mesma observação).
- **Horários** espalhados ao longo do dia e longe da meia-noite, porque a FAQ diz que a cota reinicia à meia-noite e não diz o fuso (divergência 1; pergunta em aberto).
- **Token.** Um por ciclo da credencial, reaproveitado por 1 hora para os serviços daquela credencial, guardado cifrado (AD-10), dentro do limite de 2 por hora. Validade de 1 hora e limite de 2 por hora: manual Receita Integra v1.4 (17/07/2026), seção "O que não está documentado" da referência. O controle local conta os pedidos, como na PoC.
- **Situação e download** também ficam registrados em `chamada_receita`, porque não se sabe se contam no limite ("Observado na chamada real": nenhum HTTP 429 em 1 token, 5 aberturas, 2 situações e 2 downloads; não dá para dizer se situação e download contam, nem se abertura recusada conta).

### Falhas

Nenhuma retentativa é automática quando gasta abertura, salvo onde a tabela diz.

| Situação | Tratamento | Fonte |
|---|---|---|
| HTTP 429 | Para o serviço daquela credencial até o dia seguinte; registra o ocorrido | Limite de 4 chamadas, seção "Limite de uso"; o 429 não foi observado (divergência 1) |
| HTTP 400 na abertura, sem motivo conhecido | Não repete no dia; tenta no ciclo seguinte; no segundo dia seguido, vira alerta para a operação | "Observado na chamada real" (2026-11-24); a mensagem de erro não foi registrada |
| HTTP 404 na abertura (recolhimentos e pagamentos) | `servico_indisponivel`. Tenta uma vez por dia, porque a notícia de 09/11/2026 fala em serviços novos ainda em novembro. Se o 404 conta no limite não se sabe; 1 de 4 por dia é aceitável | Divergência 9 e O-17 (2026-11-24); notícia oficial de 09/11/2026, seção "Ambientes e novidades" |
| Situação `ERRO` ou `EXPIRADA` | Uma nova abertura no mesmo dia, se o orçamento tiver sobra (até 2 por dia por serviço, deixando 2 de reserva). Senão, no ciclo seguinte | Divergência 5; não testada |
| Recusa da credencial no token, ou "consumidor não autorizado para este NI" | Descarta o token. Uma única nova tentativa com token novo. Se repetir, a credencial vira `invalida` (a consulta termina em `credencial_invalida`), a coleta da empresa para e um alerta vai para os usuários dela (AD-10). A PoC trata o HTTP 401 da abertura como token recusado ou consumidor não autorizado: é interpretação da PoC, e o código exato desse erro não tem fonte | Seção "O que não está documentado" (erro "consumidor não autorizado para este NI") |
| Sem resposta (rede, tempo esgotado) na abertura | Fica `aberta_sem_tiquete`, tratada como chamada gasta. Não repete no dia | Decisão de arquitetura, para não gastar o limite; sem fonte sobre como a Receita conta a abertura sem resposta |
| Falha no download | Nova URL assinada pelo mesmo tíquete, até as 48 h | Seção "Fluxo de uma consulta" |

### Alertas

Para cada empresa e serviço disponível, o banco guarda a data da última consulta `lida`. A perda de dados ocorre quando passam mais de 8 dias sem coleta (seção "Consulta incremental").

| Dias sem coleta lida | Quem é avisado |
|---|---|
| 2 dias | Equipe do CreditoGov |
| 3 dias, e o problema depende do cliente (credencial inválida ou ausente) | Também os usuários com vínculo na empresa, inclusive o contador |
| 5 dias | Alerta crítico para a equipe, faltando 3 para a perda de dados |

O canal (email ou outro) e o texto ficam para a demanda que implementar o coletor.

## 6. Credencial da Receita

Detalha a [AD-10](#ad-10--guarda-e-ciclo-da-credencial-da-receita).

### Acesso

- A API recebe a credencial pelo cadastro (HTTPS), cifra e grava. **Não tem permissão de decifrar.**
- Só o coletor decifra, em memória, na hora de pedir o token.
- Ninguém na equipe vê a credencial em texto. A tela mostra só `informada em (data) por (usuário)` e o estado.

### Registro e saída

A credencial e o token são retirados de toda saída, log e erro, como faz o redator da PoC. O token fica cifrado do mesmo modo, para sobreviver a reinício sem gastar o limite de 2 por hora (manual Receita Integra v1.4; [referência](../referencias/apuracao-cbs/README.md), seção "O que não está documentado").

### Ciclo

1. **Entrega.** No cadastro da empresa, um usuário com vínculo nela informa `client_id` e `client_secret`, gerados no gov.br pelo titular ou pelo procurador (referência, seção "Fluxo de uma consulta", passo 1). O formulário diz que credenciais anteriores à v2.0 (liberada em 28/10/2026) precisam ser geradas de novo (mesma seção).
2. **Conferência.** Um pedido de token (1 dos 2 por hora) confirma que o par é válido, sem gastar abertura. A autorização para o CNPJ só se confirma na primeira abertura de créditos, que é a própria primeira coleta, feita logo após o cadastro. Não há chamada só para conferir.
3. **Troca.** A credencial nova entra como `ativa`, e a anterior vira `substituida`. A anterior é removida (chave de dados destruída, ver "Remoção e backups" abaixo) depois da primeira coleta bem-sucedida com a nova.
4. **Revogação ou invalidez.** Detectada pela coleta (tabela de falhas da [seção 5](#falhas)). A credencial vira `invalida` (e a consulta termina em `credencial_invalida`), a coleta para e os usuários são avisados para informar uma nova.
5. **Credencial anterior à v2.0.** A mensagem de recusa no token orienta gerar de novo. O CreditoGov não distingue esse caso de outra recusa, porque não há fonte sobre o formato da recusa.
6. **Saída do cliente.** A chave de dados da credencial é destruída na hora, no banco vivo (ver "Remoção e backups" abaixo). O destino dos dados fiscais e dos arquivos brutos depois da saída é pergunta de LGPD (seção 8).

### Remoção e backups

Destruir a chave de dados vale para o **banco vivo**. Um backup ou réplica feito antes da remoção ainda guarda o texto cifrado e a chave de dados cifrada, e a chave mestra do KMS continua abrindo essa chave de dados. Por isso a credencial **só some de vez quando expira o último backup que a contém**. O prazo de retenção do backup é a **janela de apagamento** da credencial: é registrado quando a primeira demanda de backend configurar o backup, e se liga à pergunta de LGPD sobre prazo de guarda depois da saída do cliente (seção 8). Não há fonte nesta demanda para dizer se esse prazo atende à lei.

Alternativa futura, sem mudar a escolha da AD-10: uma chave mestra por empresa no KMS, agendada para exclusão na saída do cliente, o que tornaria ilegíveis também as cópias antigas. Custo e limites de chaves por provedor: a confirmar (PD-1).

### Rastreio

Cada entrega ou troca grava em `credencial_entrega`:

- o usuário que informou;
- a data e a hora;
- a empresa;
- a forma declarada (titular ou procurador).

O registro é imutável e não guarda segredo. **Não é verificação de procuração:** quem decide o acesso é a Receita, pela credencial (premissa de 2026-11-25, seção 2).

## 7. Cenários de acesso

Detalha a [AD-11](#ad-11--cenários-de-acesso-a-como-base-b-como-contingência). Fonte do que não se sabe: [referência](../referencias/apuracao-cbs/README.md), seção "O que não está documentado", e as perguntas de [`hipoteses.md`](../produto/hipoteses.md), H1.

### Cenário A, a base

Cada empresa tem uma credencial ativa por vez. Cadastro, coleta, orçamento e guarda estão nas AD-9 e AD-10. O limite de 4 chamadas por API vale para a credencial daquela empresa (seção "Limite de uso"), então o número de empresas não pressiona o limite. A capacidade depende só do coletor.

### Cenário B, contingência

Só o plano entra no documento; nada é construído.

- **O que o tornaria possível:** resposta da Receita (ou de quem já integra) a duas perguntas. Uma credencial de procurador cobre vários CNPJs? O limite conta por credencial ou por credencial e CNPJ? Ambas estão abertas em `hipoteses.md` (H1).
- **Efeito do limite**, com a cadência da AD-9 e o limite "por dia" da FAQ (divergência 1, não testada):
  - **por credencial e CNPJ:** igual ao A, uma credencial atende tantos CNPJs quanto a procuração cobrir;
  - **por credencial no total:** com 4 aberturas por dia por serviço e uma consulta por CNPJ a cada 7 dias (1 dia de folga na janela de 8), uma credencial atende **no máximo 28 CNPJs por serviço** (4 por dia vezes 7 dias), sem nenhuma sobra para falha. Na prática, bem menos. É inviável para uma carteira grande sem várias credenciais.
- **Credencial que deixa de valer para um dos CNPJs** ("consumidor não autorizado para este NI"): só o vínculo `credencial_empresa` daquele CNPJ vira inválido; os outros CNPJs da mesma credencial continuam.
- **Rastreio:** o mesmo da seção 6, com o procurador como forma declarada.

### Passagem e convivência

- **Comum aos dois:** a guarda, o ciclo, o rastreio, o coletor, os arquivos e o isolamento.
- **O que muda:** a regra 1:1 de `credencial_empresa` e a chave do orçamento.
- **Convivência:** A e B convivem, com empresa de credencial própria e empresa coberta por procurador.
- **Se o B não existir ou o limite o tornar inviável:** o produto segue só com o A, e o contador orienta cada cliente a informar a credencial.

## 8. Dados sensíveis e proteção

| Dado | Em trânsito | Em repouso | Em log |
|---|---|---|---|
| Credencial da Receita | HTTPS | Cifra de envelope (AD-10) | Nunca |
| Token da Receita e URL assinada | HTTPS | Token cifrado (AD-10); URL assinada não é guardada | Nunca |
| Dados fiscais da empresa (arquivos e leitura) | HTTPS | Cifra em repouso do provedor; isolamento por empresa (AD-6) | Só contagens e identificadores internos; nenhum valor, chave de nota ou CNPJ |
| Dados pessoais de usuários (nome, email) | HTTPS | Banco cifrado em repouso; senha só como hash (AD-12) | Sem email em texto; identificador interno |
| `niConsumidor` | HTTPS | Fica no arquivo bruto; não é copiado para `leitura` sem necessidade | Nunca |

Sobre o `niConsumidor`: na primeira chamada real veio com 11 dígitos, compatível com CPF; na segunda, igual ao `ni` da empresa ([referência](../referencias/apuracao-cbs/README.md), seção "Observado na chamada real" e O-2, 2026-11-24). O que ele identifica não está documentado (pergunta em aberto).

**Perguntas para advogado**, sem afirmar regra (também em [`hipoteses.md`](../produto/hipoteses.md)):

- base legal para tratar os dados da empresa e de quem gerou a credencial;
- prazo de guarda depois da saída do cliente (inclui a janela de apagamento da credencial nos backups, seção 6);
- se a hospedagem fora do Brasil seria transferência internacional e o que ela exige;
- o tratamento do `niConsumidor` quando for CPF.

## 9. Ambientes, testes e configuração

| Ambiente | Dados | API da Receita |
|---|---|---|
| Local (desenvolvedor e agentes) | Fictícios | Simulada (servidor falso nos testes, como a PoC) |
| Homologação | Fictícios | Simulada; nenhuma credencial real |
| Produção | Reais | Real, pelo coletor |

- Testes com `vitest` e API simulada; nenhum teste chama a API real nem lê `.env` (regra do [`AGENTS.md`](../../AGENTS.md)).
- O isolamento por empresa tem teste próprio contra um PostgreSQL de teste. O teste prova as três condições da AD-6: (1) com o papel da aplicação (sem posse e sem `BYPASSRLS`, tabelas com `FORCE ROW LEVEL SECURITY`), uma consulta sem empresa fixada não devolve linha e uma com a empresa A não vê a B; (2) a empresa fixada por `SET LOCAL` ou `set_config(..., true)` não sobrevive à transação, inclusive com a mesma conexão reaproveitada pelo pool; (3) o coletor, com o seu papel, também só vê a empresa fixada.
- Chamada real fora da produção só pelo responsável, como hoje com `npm run consulta`. Agentes não pedem credencial nem criam `.env`.

### Variáveis de ambiente (só os nomes)

Os nomes são a proposta deste documento; a primeira demanda de backend pode ajustá-los, registrando a mudança no histórico.

| Variável | Para quê |
|---|---|
| `CREDITOGOV_BANCO_URL` | Endereço do PostgreSQL |
| `CREDITOGOV_ARQUIVOS_BUCKET` | Armazenamento de arquivos brutos (AD-8) |
| `CREDITOGOV_KMS_CHAVE` | Chave mestra do KMS (AD-10) |
| `CREDITOGOV_SESSAO_SEGREDO` | Segredo da sessão (AD-12) |
| `APURACAO_URL_TOKEN` e `APURACAO_URL_BASE` | Endereços da API da Receita; os mesmos nomes da PoC |
| `CREDITOGOV_AMBIENTE` | local, homologação ou produção |

**A credencial de cada cliente não é variável de ambiente:** fica no banco, cifrada (AD-10). Os valores de cada ambiente ficam no gerenciador de segredos do provedor, nunca no repositório (regra de [`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) §6).

## 10. O que a arquitetura não bloqueia

- **Antecipação** (H3 de [`hipoteses.md`](../produto/hipoteses.md), sem construir):
  - histórico por nota preservado (arquivos imutáveis, AD-8);
  - origem de cada valor rastreável até o arquivo e o tíquete;
  - isolamento e rastreio de entrega da credencial;
  - um futuro acesso de parceiro seria um tipo novo de vínculo, com autorização registrada do cliente, sobre a mesma API.

  Nada disso é construído. Se a antecipação é possível, e com quais parceiros e condições, é pergunta jurídica e comercial em aberto (H3).
- **Outra fonte de dados.** O coletor e a leitura ficam atrás de uma interface "fonte". A API da Receita é a única implementação. Um ERP (só como fonte, nunca como canal) ou o equivalente do IBS, se o Comitê Gestor publicar, entrariam como outra implementação gravando em `arquivo_bruto` e `leitura` com o identificador da fonte. A API da Receita cobre só CBS e não se sabe se o equivalente do IBS será oferecido ([referência](../referencias/apuracao-cbs/README.md), seção "O que não está documentado"). Nenhuma das duas fontes é desenhada.
- **Login federado.** A entidade `identidade` aceita Google, Apple, Microsoft e gov.br como novas formas de login do mesmo usuário (AD-12). Se o gov.br é possível para software privado não tem fonte.

## 11. Decidido aqui / fica para

| Tema | Fica para |
|---|---|
| Telas, fluxo de cadastro, recuperação de senha, MFA, papéis e permissões; login federado e a lista final de provedores | Demanda de login |
| Biblioteca de componentes, camada de estilo, tokens | Demanda 032 (design system) |
| Telas, indicadores, roteamento e busca de dados da web | Demanda 033 e a Spec da implementação do dashboard |
| Esquema real, migrações, canal e texto dos alertas | Primeira demanda de backend ou do coletor |
| Provedor de nuvem | Depois da PD-1 (preço com fonte) |
| Antecipação, compensação, guias (RAD, PCONT), cobrança | Depois da base de clientes (H3) |
| IBS, ERP | Quando houver fonte |
| Pacote compartilhado do leitor | Backlog |

## 12. Perguntas em aberto e pendências

### Perguntas em aberto

Sem fonte em `docs/referencias/`. Registradas em [`hipoteses.md`](../produto/hipoteses.md), cada uma com o efeito na arquitetura e como obter a resposta.

| Pergunta | Efeito | Onde |
|---|---|---|
| Uma credencial de procurador cobre vários CNPJs? | Se sim, o cenário B fica possível (AD-11). Se não, segue só o A | `hipoteses.md`, H1 |
| O limite de 4 chamadas é por credencial ou por credencial e CNPJ? | Efeito sobre o B: até 28 CNPJs por serviço, ou igual ao A (seção 7) | `hipoteses.md`, H1 |
| Situação e download contam no limite? Abertura recusada (400, 404) conta? Qual o fuso do reinício à meia-noite? | Orçamento da AD-9 | `hipoteses.md`, H1 |
| Qual o papel do `niConsumidor`? | Rastreio e LGPD | `hipoteses.md`, H1 |
| Um software privado pode usar o login do gov.br, e em que condições? | AD-12 e `identidade` | `hipoteses.md`, "Outras decisões em aberto" |
| LGPD (as quatro perguntas da seção 8) | Retenção, região, base legal | `hipoteses.md`, "Outras decisões em aberto" |
| Vários CNPJs por cliente: cadastros separados ou agrupados? | Entidade acima de `empresa` (AD-6) | `hipoteses.md`, "Outras decisões em aberto" |
| Qual a causa do HTTP 400 na segunda abertura de créditos? | Regra de reabertura da AD-9 | [Referência](../referencias/apuracao-cbs/README.md), "Observado na chamada real" |

### Pendências

- **PD-1 — Preço de hospedagem, banco, KMS e serviço de identidade.** Preencher a tabela de custo da AD-7 só com página oficial de preço citada com data. A tabela está "a confirmar"; o responsável, ou uma sessão com acesso, a completa antes de escolher o provedor.

### Riscos

- **R-1. Limite por credencial no cenário B.** Se o limite for por credencial no total, o B quase não ajuda: até 28 CNPJs por serviço. A base no A evita depender da resposta.
- **R-2. Serviço em beta.** Quatro versões da documentação em três meses, e recolhimentos e pagamentos com 404 (referência, divergência 9). A máquina de estados e o `servico_indisponivel` absorvem isso. Reconferir a referência antes de cada demanda de coletor.
- **R-3. Recomendações sobre bibliotecas sem prova no projeto.** Fastify e Kysely não foram usados aqui. A primeira demanda de backend confirma com um teste o isolamento por linha (com as três condições da AD-6: papel sem posse e sem `BYPASSRLS` com `FORCE ROW LEVEL SECURITY`, empresa fixada só por transação, coletor sob a mesma regra) e o `numeric` como texto. Se falhar, as segundas opções registradas (Drizzle e, para a autenticação, a B da AD-12) entram sem nova demanda de arquitetura, só com registro no histórico (seção 13).
- **R-4. Custo sem fonte.** A escolha do provedor pode ficar para depois da PD-1, sem travar a primeira demanda de backend, que roda local.
- **R-5. Sobreposição com a 033.** A 033 tem a carteira do contador. A AD-6 garante que o modelo a aceita; papéis e permissões continuam com a demanda de login.
- **R-6. Visão de produto.** O passo 4 de [`produto/visao.md`](../produto/visao.md) ("Primeira versão do painel") pode ser lido como a 030. O `PROJECT_CONTEXT.md` esclarece que a 030 é ferramenta interna; ajustar a visão fica para o responsável.

## 13. Histórico de decisões

| Data | AD | Mudança |
|---|---|---|
| 2026-11-25 | AD-1 a AD-14 | Decididas pelo responsável ao aprovar a Spec da demanda 031, com as recomendações; na AD-7, provedor pendente da PD-1. Nada construído |
