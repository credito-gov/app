# 031-stack-arquitetura — Spec

- **Status:** spec-aprovada
- **Spec aprovada:** 2026-11-25, pelo responsável ("Aprovo todas"), com as recomendações das AD-1 a AD-14; na AD-7, o provedor fica pendente da PD-1
- **US:** [`us.md`](us.md), aprovada em 2026-11-25 com as recomendações de P-1 a P-4

Esta demanda só produz documentação. A Spec traz cada decisão já pronta para a escolha do responsável (P-1): problema, critérios, alternativas com prós e contras, recomendação e o campo **Escolha do responsável**. Ao aprovar a Spec, o responsável preenche (ou confirma) a escolha de cada decisão. O Developer transcreve as escolhas para o documento de arquitetura e faz as atualizações em `PROJECT_CONTEXT.md` e `hipoteses.md`.

## Critérios de aceite atendidos

Todos: CA-1 a CA-21, CA-21a, CA-22, CA-22a e CA-23 a CA-29. A tabela "Rastreio dos CA" no fim desta Spec liga cada um à seção que o atende.

## Abordagem

1. **Um documento único**, `docs/arquitetura/README.md` (CA-1). Uma pasta própria deixa espaço para diagramas e para decisões futuras sem misturar com `produto/` nem com `demandas/`. A pasta tem um único arquivo, para ser lido de uma vez; cada decisão leva um identificador estável **AD-N**. Uma decisão revista depois **não é apagada**: ganha uma linha no histórico do documento dizendo qual AD a substitui.
2. **Formato fixo de cada decisão** (CA-2): problema; critérios; alternativas, numa tabela com prós e contras; recomendação; escolha do responsável, com data; alternativas descartadas e por quê; fontes. O mesmo formato é usado nesta Spec, abaixo.
3. **Fonte ou pergunta** (CA-3). Toda afirmação sobre a API de apuração da CBS cita [`../../referencias/apuracao-cbs/README.md`](../../referencias/apuracao-cbs/README.md) (seção ou observação O-N, com a data). O que não tem fonte vai para "Perguntas em aberto" do documento e para `hipoteses.md`. As afirmações sobre software (bibliotecas, bancos, provedores) descrevem só características gerais, sem preço nem promessa de desempenho. **Nenhum preço entra sem página oficial citada com data** (ver AD-7 e a pendência PD-1).
4. **Agora e depois** (CA-4). O documento termina com a tabela "Decidido aqui / fica para", que nomeia a frente de cada item: login, dashboard (033), design system (032), antecipação, IBS, ERP.
5. **Nada é construído.** Nenhuma aplicação, conta, infraestrutura ou chamada à API.

## Mudanças por camada

### Documentação (`docs/`)

| Arquivo | Mudança | CA |
|---|---|---|
| `docs/arquitetura/README.md` (novo) | O documento de arquitetura, com a estrutura da seção "Contratos" e as decisões AD-1 a AD-14 com as escolhas do responsável | CA-1 a CA-26, CA-21a, CA-22a |
| `docs/PROJECT_CONTEXT.md` | Mudanças da seção "Alterações no PROJECT_CONTEXT.md" | CA-1, CA-27 |
| `docs/produto/hipoteses.md` | Mudanças da seção "Alterações no hipoteses.md" | CA-21, CA-28 |
| `docs/README.md` | Linha nova na tabela: `arquitetura/`, "Arquitetura do produto: decisões de stack, dados, coleta, credencial e autenticação", "Sim" | CA-1 |
| `docs/demandas/README.md` | Status da 031, no ritmo do fluxo | — |

### Aplicações

Nenhuma. `app/landing-page`, `app/apuracao-cbs` e `app/painel` não mudam (fora de escopo da US).

## Contratos

### Estrutura do documento `docs/arquitetura/README.md`

1. **Objetivo e estado:** decidido em 2026-11-25 (data da aprovação da Spec), nada construído.
2. **Premissas decididas pelo responsável**, com as palavras dele (CA-21a):
   - SaaS multi-inquilino;
   - acesso a cada CNPJ decidido pela Receita, pela credencial do gov.br;
   - cada cliente informa a própria credencial;
   - email e senha como base, sem bloquear login federado;
   - ERP só como possível fonte de dados;
   - `app/painel` como ferramenta interna.
3. **Visão geral:** componentes e fluxo dos dados, em texto ou diagrama Mermaid: aplicação web → API → banco; coletor → API da Receita → armazenamento de arquivos → leitura → banco.
4. **Decisões AD-1 a AD-14**, no formato da Abordagem, item 2.
5. **Coleta agendada:** ciclo, orçamento de chamadas, falhas e alertas (CA-12 a CA-15).
6. **Credencial da Receita:** guarda, ciclo e rastreio (CA-16, CA-17, CA-21a).
7. **Cenários de acesso:** A como base, B como contingência (CA-18 a CA-20).
8. **Dados sensíveis e proteção** (CA-25).
9. **Ambientes, testes e configuração** (CA-26).
10. **O que a arquitetura não bloqueia:** antecipação, outra fonte de dados, IBS e login federado (CA-23, CA-24, CA-22a).
11. **Decidido aqui / fica para** (CA-4).
12. **Perguntas em aberto e pendências**, com link para `hipoteses.md` (CA-3, CA-21).
13. **Histórico de decisões**: data, AD e mudança.

### Modelo de dados conceitual (CA-9, CA-10, CA-11, CA-18, CA-19, CA-21a)

São só as entidades e as relações que as decisões exigem, sem colunas nem migração: o esquema real é da primeira demanda de backend.

| Entidade | O que é | Relações |
|---|---|---|
| `empresa` | A unidade de inquilino: uma **raiz de CNPJ** (8 dígitos), como na API (`{cnpj}` base) e na O-24 | Tem estabelecimentos, que aparecem nos documentos; tem uma ou mais credenciais ao longo do tempo |
| `usuario` | Pessoa que entra no CreditoGov | N:N com `empresa`, por `vinculo_empresa` |
| `vinculo_empresa` | Liga usuário a empresa. O papel (titular, contador, outro) fica para a demanda de login | Um usuário com várias empresas (a carteira do contador); uma empresa com vários usuários |
| `identidade` | Forma de login de um usuário: email e senha hoje; Google, Apple ou gov.br depois (CA-22a) | N:1 com `usuario` |
| `credencial_receita` | O par `client_id`/`client_secret` cifrado (AD-10), com o estado (`ativa`, `invalida`, `substituida`, `removida`) | **N:N com `empresa` por `credencial_empresa`**, restrito a 1:1 por regra no cenário A (AD-11) |
| `credencial_entrega` | Rastreio: quem informou, quando, para qual empresa e de que forma (titular ou procurador, **como declarado**, sem verificação) | Uma por entrega ou troca; imutável (CA-21a) |
| `consulta` | Uma solicitação à API: serviço, empresa, credencial, tíquete, estado, horários e erro | Máquina de estados da AD-9 |
| `chamada_receita` | Cada chamada feita (token, abertura, situação, download, arquivo), com HTTP e horário, sem segredo | Base do orçamento do limite, como o `.local/chamadas.jsonl` da PoC |
| `arquivo_bruto` | Metadados do arquivo baixado (serviço, empresa, tíquete, `geradoEm`, hash, versão do schema, onde está) | O conteúdo fica no armazenamento de objetos (AD-8) |
| `leitura` | Dados lidos de cada arquivo (créditos, débitos e o resto), com a versão do leitor que os produziu | Reconstruível a partir dos `arquivo_bruto` (AD-8) |

Toda tabela com dado de empresa leva o identificador da empresa (AD-6).

### Configuração (CA-26), só os nomes

Os nomes são a proposta para o documento; a primeira demanda de backend pode ajustá-los, registrando a mudança.

- `CREDITOGOV_BANCO_URL`
- `CREDITOGOV_ARQUIVOS_BUCKET`
- `CREDITOGOV_KMS_CHAVE`
- `CREDITOGOV_SESSAO_SEGREDO`
- `APURACAO_URL_TOKEN` e `APURACAO_URL_BASE` (os mesmos nomes da PoC)
- `CREDITOGOV_AMBIENTE`

A credencial de cada cliente **não** é variável de ambiente: fica no banco, cifrada (AD-10).

---

## Decisões

O formato é o mesmo em todas. **Escolha do responsável** fica em branco até a aprovação da Spec.

### AD-1 — Linguagem e runtime do backend (CA-5)

**Problema.** O produto precisa de uma API, de um coletor agendado e de leitura e validação dos arquivos da Receita.

**Critérios:** continuidade com o código existente; tipagem; bibliotecas de decimal exato e de JSON Schema 2020-12; equipe pequena; mesma linguagem na web.

| Alternativa | Prós | Contras |
|---|---|---|
| **A. Node 24 + TypeScript (ESM)** | As aplicações 029 e 030 já usam: leitura, validação (`ajv`, schemas oficiais), decimal (`big.js`), JSON sem perda (`lossless-json`), tolerância do `ni` e regras do emitente já escritas e testadas (`vitest`, `oxlint`). Mesma linguagem da landing e da aplicação web | Pede disciplina para não usar `number` em dinheiro (já resolvido na PoC) |
| B. Outra linguagem (Python, Go, Java, C#) | Ecossistemas maduros para backend | Reescrever o que 029 e 030 já provaram; duas linguagens no projeto |

**Recomendação:** A.

**Descartada:** B, porque obrigaria a reescrever código já validado contra arquivos reais.

**Escolha do responsável:** A, Node 24 + TypeScript. Responsável, 2026-11-25 ("Aprovo todas")

### AD-2 — Organização em aplicações e framework HTTP (CA-5, CA-6)

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

**Descartadas:**

- Express: a concepção não é especificação, e o Fastify já valida com o `ajv` que o projeto usa;
- NestJS: estrutura demais para o tamanho do time;
- `node:http` puro: segurança e sessão escritas à mão.

**Escolha do responsável:** `app/backend` (api + coletor) e `app/web`, com Fastify na API. Responsável, 2026-11-25 ("Aprovo todas")

### AD-3 — Aplicação web do produto (CA-5; P-2)

**Problema.** O framework e a forma de renderização do dashboard e das telas de cadastro. A 033 já aprovou a US do dashboard, com indicadores, estados e a carteira do contador (troca entre empresas). A biblioteca visual é da 032.

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

**Descartadas:**

- B: um servidor a mais sem ganho numa área logada;
- C: não atende a interação da 033;
- D: Redux sem necessidade; shadcn/ui é decisão da 032.

**Escolha do responsável:** A, React 19 + Vite + TypeScript, página única consumindo a API. Responsável, 2026-11-25 ("Aprovo todas")

### AD-4 — Banco de dados (CA-7, CA-8)

**Problema.** Onde ficam empresas, usuários, credenciais cifradas, consultas, metadados dos arquivos e dados lidos.

**Critérios:** decimal exato; isolamento por empresa no próprio banco; transações; migrações; serviço gerenciado nos provedores da AD-7.

| Alternativa | Prós | Contras |
|---|---|---|
| **A. PostgreSQL** | Tipo `numeric` exato; segurança por linha (row level security) para isolar empresas; `jsonb` se preciso; oferecido como serviço gerenciado pelos provedores da AD-7 | Exige cuidado com conexões em escala (pool) |
| B. MySQL | Também tem decimal exato e serviço gerenciado | Não tem segurança por linha nativa, então o isolamento fica só na aplicação |
| C. Banco de documentos (ex.: MongoDB) | Guarda o JSON da Receita como vem | Decimal e transações menos naturais; o JSON bruto já vai para o armazenamento de objetos (AD-8) |

**Recomendação:** A.

**Descartadas:**

- B: perde a segunda barreira de isolamento (AD-6);
- C: o arquivo bruto não precisa estar no banco.

**Escolha do responsável:** A, PostgreSQL. Responsável, 2026-11-25 ("Aprovo todas")

### AD-5 — Acesso a dados (CA-5, CA-7)

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

**Descartadas:**

- TypeORM: a concepção não é especificação, e o ORM esconde o SQL do isolamento;
- Prisma: conversão de decimal e SQL cru para o isolamento;
- Drizzle: alternativa aceitável, segunda opção.

**Escolha do responsável:** Kysely (segunda opção registrada: Drizzle). Responsável, 2026-11-25 ("Aprovo todas")

### AD-6 — Separação dos dados por empresa (CA-9, CA-10; SaaS multi-inquilino)

**Problema.** Dentro da operação única, como garantir que uma empresa nunca veja os dados de outra, sabendo que o contador vê várias.

**Critérios:** garantia mesmo com erro de programação; custo de operação com muitas empresas; migrações; consulta da carteira do contador (várias empresas numa tela).

| Alternativa | Prós | Contras |
|---|---|---|
| **A. Tabelas compartilhadas com o identificador da empresa + segurança por linha do PostgreSQL** | Uma migração para todos; a carteira consulta várias empresas numa consulta só; duas barreiras: a aplicação filtra, e o banco recusa o que não é da empresa fixada na transação | Toda tabela de dado de empresa precisa da regra de segurança, e os testes têm de provar o isolamento |
| B. Um schema por empresa | Isolamento visível | Migração repetida em cada schema; a carteira cruza schemas; o custo cresce com o número de empresas |
| C. Um banco por empresa | Isolamento máximo | Operação e custo proporcionais ao número de clientes; inviável para assinatura de PME |
| Fora do modelo: instalação por cliente, on-premise | — | **Descartada pela decisão de 2026-11-25** ("tem que seguir o modelo de saas") |

**Unidade de empresa:** a raiz do CNPJ (O-24: um arquivo traz notas de vários estabelecimentos da mesma raiz). "Vários CNPJs por cliente" (várias raízes num mesmo assinante, por exemplo um grupo) continua decisão em aberto em `hipoteses.md`. O modelo da Contratos aceita as duas respostas: o agrupamento seria uma entidade acima de `empresa`, sem mudar o isolamento.

**Contador:** um usuário com vínculos em várias empresas. A consulta da carteira fixa na transação o **conjunto** de empresas em que o usuário tem vínculo. Permissões por papel ficam para a demanda de login.

**Recomendação:** A, com o isolamento garantido na aplicação **e** no banco.

**Descartadas:**

- B e C: custo e operação crescem com cada cliente, e a carteira fica difícil;
- instalação por cliente: fora do modelo SaaS.

**Escolha do responsável:** A, tabelas compartilhadas com o identificador da empresa + segurança por linha do PostgreSQL. Responsável, 2026-11-25 ("Aprovo todas")

### AD-7 — Hospedagem (CA-8; SaaS multi-inquilino)

**Problema.** Onde roda a operação única: API, coletor, web estática, banco, arquivos, chaves.

**Critérios (CA-8):**

- custo (só com fonte);
- operação por equipe pequena;
- processo contínuo para o coletor (a espera de até 240 min é estado no banco, não processo preso, ver AD-9);
- serviço de chaves (KMS) para a credencial (AD-10);
- backup do banco e dos arquivos;
- região no Brasil.

A região no Brasil é critério de latência e de cuidado com dados. Se a lei exige ou não fica como pergunta para advogado (CA-25).

| Alternativa | Prós | Contras |
|---|---|---|
| **A. Nuvem grande com serviços gerenciados (AWS, Google Cloud ou Azure): contêineres gerenciados para API e coletor, PostgreSQL gerenciado, armazenamento de objetos, KMS e hospedagem estática da web** | KMS e armazenamento de objetos com bloqueio de sobrescrita no mesmo provedor; backup gerenciado; região no Brasil a confirmar na página de cada provedor | Mais conceitos para configurar; risco de custo sem limite, se não houver alerta de gasto |
| B. Plataforma como serviço simplificada (ex.: Render, Railway, Fly.io) | Deploy simples | KMS e região no Brasil não garantidos (a confirmar); a credencial pode exigir um segundo provedor só para chaves |
| C. Servidor virtual próprio com contêineres | Custo previsível | Backup, atualização, chaves e segurança ficam todos com a equipe |

**Custo:** **sem fonte nesta Spec.** Nenhuma página oficial de preço foi lida com data. O documento traz uma tabela "custo estimado", com a linha de cada provedor marcada "a confirmar". A pendência PD-1 diz como preencher.

**Recomendação:** A. O tipo (nuvem gerenciada) se decide agora pelos critérios não financeiros. O provedor (AWS, Google Cloud ou Azure) sai da tabela de custo com fonte (PD-1). Não há preferência técnica forte entre os três para o que esta arquitetura usa.

**Descartadas:**

- B: guarda de chaves e região incertas;
- C: operação demais para a equipe.

**Escolha do responsável:** tipo A, nuvem grande com serviços gerenciados; provedor (AWS, Google Cloud ou Azure) pendente da PD-1. Responsável, 2026-11-25 ("Aprovo todas")

### AD-8 — Guarda do arquivo bruto e reconstrução (CA-11, CA-23)

**Problema.** A API não devolve histórico (consulta incremental de 8 dias, seção "Consulta incremental" da referência). O arquivo perdido não volta. A regra de leitura vai mudar: o schema já diverge do arquivo real (divergência 10), e as hipóteses D-2 a D-6 estão abertas.

**Critérios:** imutável; com backup; reprocessável; separado por empresa.

| Alternativa | Prós | Contras |
|---|---|---|
| **A. Armazenamento de objetos com sobrescrita bloqueada e versionamento; metadados e hash em `arquivo_bruto`** | Barato para arquivos grandes (o painel aceita até 200 MB); imutável por configuração; backup por replicação | Dois lugares a manter coerentes (objeto e linha) |
| B. Arquivo dentro do PostgreSQL (`jsonb` ou binário) | Uma só cópia de segurança | Banco cresce com arquivos grandes; `jsonb` perde a forma original dos números |
| C. Disco do servidor (como a PoC em `.local/`) | Simples | Perde-se com o servidor; sem replicação |

**Reconstrução:** cada linha de `leitura` guarda a versão do leitor. Quando a regra muda (schema novo, tolerância nova, D-5 confirmada), um comando relê os `arquivo_bruto` da empresa e regrava `leitura`, sem chamar a API. O arquivo é guardado **antes** de ser validado, como na PoC: arquivo recusado também fica.

**Recomendação:** A.

**Descartadas:**

- B: o tamanho dos arquivos e a perda da forma original dos números;
- C: o arquivo se perde junto com o servidor.

**Escolha do responsável:** A, armazenamento de objetos imutável + metadados em `arquivo_bruto`. Responsável, 2026-11-25 ("Aprovo todas")

### AD-9 — Coletor agendado (CA-12 a CA-15)

**Problema.** Consultar cada serviço de cada empresa a tempo (janela de 8 dias), dentro dos limites, aguentando até 240 min de processamento, com 48 h para baixar o arquivo e sem gastar chamada à toa.

**Critérios:** sobreviver a reinício; contar cada chamada; nunca repetir abertura sem decisão explícita; simplicidade.

| Alternativa | Prós | Contras |
|---|---|---|
| **A. Processo coletor contínuo, com fila e máquina de estados no PostgreSQL** | Estado sobrevive a reinício; a contagem do limite fica na mesma transação do estado; nenhum serviço a mais | O coletor é um processo sempre ligado |
| B. Agendador + funções sob demanda (serverless), estado no banco | Paga só pelo uso | Cada passo vira uma função, o que traz mais peças e mais acoplamento ao provedor |
| C. Fila gerenciada do provedor | Retentativas prontas | Retentativa automática pode gastar chamada do limite sem querer; estado em dois lugares |

**Recomendação:** A. O desenho que o documento registra:

**Ciclo de uma consulta** (estados de `consulta`): `agendada` → `aberta` (com tíquete) → `concluida` → `baixada` → `lida`. Os estados finais de erro são `erro`, `expirada`, `credencial_invalida` e `servico_indisponivel`.

- O tíquete é gravado **na mesma transação** que registra a chamada de abertura, antes de qualquer outro passo. É a mesma regra da PoC: o tíquete vale uma abertura do limite.
- **Espera:** só por consulta de situação, com `urlRetorno` vazio, que foi aceito na chamada real (divergência 6). Intervalo mínimo de 5 minutos, o padrão da PoC. Depois de 240 min sem conclusão, a consulta vira `expirada`. O aviso por `urlRetorno` **não** é usado: exige endereço público e não tem autenticação (seção "Fluxo de uma consulta"). Se um dia for adotado, vale só como sinal para consultar a situação antes do horário, nunca como resultado.
- **Download:** logo depois de `CONCLUIDA`, bem antes das 48 h. Se falhar, nova URL assinada pelo mesmo tíquete, sem nova abertura.
- **Reinício:** ao subir, o coletor retoma as consultas `aberta` e `concluida` pelo tíquete gravado.

**Frequência e orçamento** (por empresa, por serviço, por credencial):

- Uma abertura por dia em cada serviço disponível (créditos e débitos), o que usa **1 das 4 chamadas** (limite por API e por credencial; "por dia" só na FAQ, divergência 1). Sobram 3 para casos decididos.
- A cadência diária deixa **7 dias de folga** dentro da janela de 8.
- **Não reabrir no mesmo dia** depois de uma consulta concluída: a segunda abertura feita cerca de 2 min depois da primeira respondeu HTTP 400, sem motivo conhecido.
- Horários espalhados ao longo do dia e longe da meia-noite, porque a FAQ diz que a cota reinicia à meia-noite e não diz o fuso (pergunta).
- **Token:** um por ciclo da credencial, reaproveitado por 1 hora para os serviços daquela credencial, guardado cifrado (AD-10), dentro do limite de 2 por hora (manual Receita Integra v1.4). O controle local conta os pedidos, como na PoC.
- Situação e download também ficam registrados em `chamada_receita`, porque não se sabe se contam no limite (observação da chamada real).

**Falhas** (CA-14). Nenhuma retentativa é automática quando gasta abertura, salvo onde a tabela diz:

| Situação | Tratamento |
|---|---|
| HTTP 429 | Para o serviço daquela credencial até o dia seguinte; registra o ocorrido |
| HTTP 400 na abertura, sem motivo conhecido | Não repete no dia; tenta no ciclo seguinte; no segundo dia seguido, vira alerta para a operação |
| HTTP 404 na abertura (recolhimentos e pagamentos, divergência 9) | `servico_indisponivel`. Tenta uma vez por dia, porque a notícia de 09/11/2026 fala em serviços novos ainda em novembro. Se o 404 conta no limite não se sabe; 1 de 4 por dia é aceitável |
| Situação `ERRO` ou `EXPIRADA` (divergência 5) | Uma nova abertura no mesmo dia, se o orçamento tiver sobra (até 2 por dia por serviço, deixando 2 de reserva). Senão, no ciclo seguinte |
| Recusa da credencial no token, ou "consumidor não autorizado para este NI" (a PoC trata o HTTP 401 da abertura como token recusado ou consumidor não autorizado; o código exato desse erro não tem fonte) | Descarta o token. Uma única nova tentativa com token novo. Se repetir, a credencial vira `invalida` (a consulta termina em `credencial_invalida`), a coleta da empresa para e um alerta vai para os usuários dela (AD-10) |
| Sem resposta (rede, tempo esgotado) na abertura | Fica `aberta_sem_tiquete`, tratada como chamada gasta. Não repete no dia |
| Falha no download | Nova URL assinada pelo mesmo tíquete, até as 48 h |

**Alertas** (CA-15). Para cada empresa e serviço disponível, o banco guarda a data da última consulta `lida`.

| Dias sem coleta lida | Quem é avisado |
|---|---|
| 2 dias | Equipe do CreditoGov |
| 3 dias, e o problema depende do cliente (credencial inválida ou ausente) | Também os usuários com vínculo na empresa, inclusive o contador |
| 5 dias | Alerta crítico para a equipe, faltando 3 para a perda de dados |

O canal (email ou outro) e o texto ficam para a demanda que implementar o coletor.

**Descartadas:**

- B: peças demais e acoplamento ao provedor;
- C: retentativa automática pode gastar o limite da Receita.

**Escolha do responsável:** A, processo coletor contínuo com fila e máquina de estados no PostgreSQL. Responsável, 2026-11-25 ("Aprovo todas")

### AD-10 — Guarda e ciclo da credencial da Receita (CA-16, CA-17, CA-21a)

**Problema.** Cada cliente informa a própria credencial (decisão de 2026-11-25): um `client_id` e um `client_secret` que dão acesso aos dados fiscais da empresa.

**Critérios:**

- chave de cifra fora do banco;
- menor número de processos capazes de decifrar;
- nunca aparecer em log, tela ou erro;
- remoção definitiva quando o cliente sai.

| Alternativa | Prós | Contras |
|---|---|---|
| **A. Cifra de envelope: KMS do provedor guarda a chave mestra; cada credencial tem chave de dados própria; o banco guarda só o texto cifrado** | Chave fora do banco; permissões separadas (a API só cifra, o coletor decifra); a remoção apaga a chave de dados, o que torna o texto ilegível | Depende do KMS (já incluído na AD-7) |
| B. Um segredo por cliente no gerenciador de segredos do provedor | Rotação e auditoria prontas | Custo e limite por segredo (a confirmar); muitos segredos para administrar |
| C. Cifra na aplicação com chave em variável de ambiente | Simples | Chave junto da aplicação; quem lê a variável lê todas as credenciais |

**Recomendação:** A. O documento registra as regras abaixo.

**Acesso:**

- A API recebe a credencial pelo cadastro (HTTPS), cifra e grava. **Não tem permissão de decifrar.**
- Só o coletor decifra, em memória, na hora de pedir o token.
- Ninguém na equipe vê a credencial em texto. A tela mostra só "informada em <data> por <usuário>" e o estado.

**Registro e saída:** a credencial e o token são retirados de toda saída, log e erro, como faz o redator da PoC. O token fica cifrado do mesmo modo, para sobreviver a reinício sem gastar o limite de 2 por hora.

**Ciclo** (CA-17):

1. **Entrega:** no cadastro da empresa, um usuário com vínculo nela informa `client_id` e `client_secret`, gerados no gov.br pelo titular ou pelo procurador. O formulário diz que credenciais anteriores à v2.0 (28/10/2026) precisam ser geradas de novo (seção "Fluxo de uma consulta").
2. **Conferência:** um pedido de token (1 dos 2 por hora) confirma que o par é válido, sem gastar abertura. A autorização para o CNPJ só se confirma na primeira abertura de créditos, que é a própria primeira coleta, feita logo após o cadastro. Não há chamada só para conferir.
3. **Troca:** a credencial nova entra como `ativa`, e a anterior vira `substituida`. A anterior é apagada (chave de dados destruída) depois da primeira coleta bem-sucedida com a nova.
4. **Revogação ou invalidez:** detectada pela coleta (tabela de falhas da AD-9). A credencial vira `invalida` (e a consulta termina em `credencial_invalida`), a coleta para e os usuários são avisados para informar uma nova.
5. **Credencial anterior à v2.0:** a mensagem de recusa no token orienta gerar de novo. O CreditoGov não distingue esse caso de outra recusa sem fonte para isso.
6. **Saída do cliente:** a chave de dados da credencial é destruída na hora. O destino dos dados fiscais e dos arquivos brutos depois da saída é pergunta de LGPD (CA-25).

**Rastreio** (CA-21a): cada entrega ou troca grava em `credencial_entrega`:

- o usuário que informou;
- a data e a hora;
- a empresa;
- a forma declarada (titular ou procurador).

O registro é imutável e não guarda segredo. **Não é verificação de procuração:** quem decide o acesso é a Receita, pela credencial (premissa de 2026-11-25).

**Descartadas:**

- B: custo e administração por segredo;
- C: a chave fica junto da aplicação.

**Escolha do responsável:** A, cifra de envelope com KMS. Responsável, 2026-11-25 ("Aprovo todas")

### AD-11 — Cenários de acesso: A como base, B como contingência (CA-18 a CA-21)

**Problema.** Quantas credenciais existem por empresa e como o limite se aplica. Premissas de 2026-11-25: o acesso é decidido pela Receita; cada cliente informa a sua.

| Alternativa | Prós | Contras |
|---|---|---|
| **A. Construir só o cenário A; o modelo já aceita o B** (`credencial_empresa` N:N, restrito a 1:1 por regra; orçamento contado por credencial e por CNPJ) | Atende a decisão do responsável; passar ao B é trocar uma regra, sem migração de modelo | Um pouco mais de modelo do que o A precisa |
| B. Modelar só o A (credencial como campo da empresa) | Mais simples hoje | Passar ao B exige migrar o modelo e o orçamento |
| C. Construir A e B desde já | Pronto para escritório com credencial de procurador | Desenha algo que pode não existir (sem fonte) e contraria a decisão de 2026-11-25 |

**Cenário A, a base** (CA-18). Cada empresa tem uma credencial ativa por vez. Cadastro, coleta, orçamento e guarda estão nas AD-9 e AD-10. O limite de 4 aberturas por API vale para a credencial daquela empresa, então o número de empresas não pressiona o limite. A capacidade depende só do coletor.

**Cenário B, contingência** (CA-19). Só o plano entra no documento:

- **O que o tornaria possível:** resposta da Receita (ou de quem já integra) às perguntas do CA-21. Uma credencial de procurador cobre vários CNPJs? O limite conta por credencial ou por credencial e CNPJ?
- **Efeito do limite**, com o limite "por dia" da FAQ:
  - **por credencial e CNPJ:** igual ao A, uma credencial atende tantos CNPJs quanto a procuração cobrir;
  - **por credencial no total:** duas contas. Com a cadência diária da AD-9, as 4 aberturas por dia atendem 4 CNPJs por serviço. Os 28 CNPJs por serviço só valem com uma consulta a cada 7 dias por CNPJ (1 dia de folga na janela de 8), sem nenhuma sobra para falha. Na prática, bem menos. É inviável para uma carteira grande sem várias credenciais.
- **Credencial que deixa de valer para um dos CNPJs** ("consumidor não autorizado para este NI"): só o vínculo `credencial_empresa` daquele CNPJ vira inválido; os outros CNPJs da mesma credencial continuam.
- **Rastreio:** o mesmo da AD-10, com o procurador como forma declarada.

**Passagem e convivência** (CA-20):

- **Comum aos dois:** a guarda, o ciclo, o rastreio, o coletor, os arquivos e o isolamento.
- **O que muda:** a regra 1:1 de `credencial_empresa` e a chave do orçamento.
- **Convivência:** A e B convivem, com empresa de credencial própria e empresa coberta por procurador.
- **Se o B não existir ou o limite o tornar inviável:** o produto segue só com o A, e o contador orienta cada cliente a informar a credencial.

**Recomendação:** A.

**Descartadas:**

- B: migração futura;
- C: desenha sem fonte e contra a decisão do responsável.

**Escolha do responsável:** A, construir só o cenário A, com o modelo aceitando o B. Responsável, 2026-11-25 ("Aprovo todas")

### AD-12 — Onde fica a autenticação (CA-22, CA-22a; P-3)

**Problema.** Onde ficam o login por email e senha (decisão de 2026-08-25) e a sessão. Login federado com Google, Apple ou gov.br não pode ser bloqueado depois (decisão de 2026-11-25). Tela, cadastro, recuperação de senha e permissões são da demanda de login.

**Critérios:**

- respeitar 2026-08-25: login do CreditoGov, sem credencial de ERP (P-3: um serviço gerenciado é aceitável se o usuário só vê o login do CreditoGov);
- segurança da senha (guarda, MFA, recuperação);
- facilidade de acrescentar Google, Apple e gov.br;
- custo (sem fonte, ver PD-1);
- dados dos usuários no mesmo provedor e região;
- dependência de fornecedor.

| Alternativa | Prós | Contras |
|---|---|---|
| **A. Autenticação própria no backend**: senha com hash `argon2id` por biblioteca consolidada, sessão no servidor com cookie `HttpOnly` e `Secure`, entidade `identidade` separada de `usuario` | Sem custo por usuário; dados no mesmo banco e região; controle total do fluxo. O login federado entra como uma nova linha em `identidade`, por OpenID Connect (Google e Apple oferecem login federado por esse padrão aberto) | A equipe responde pela segurança da senha, pela recuperação e pelo MFA |
| B. Serviço de identidade gerenciado (ex.: Auth0, Amazon Cognito, Firebase Authentication, Clerk) com a marca do CreditoGov | Senha, MFA, recuperação e Google/Apple prontos | Custo por usuário (a confirmar); dados de usuário fora do banco e talvez da região; trocar de fornecedor depois é caro; o gov.br dependeria do suporte do serviço (sem fonte) |
| C. Servidor de identidade próprio separado (ex.: Keycloak) | Federado e MFA prontos, sem custo por usuário | Mais um sistema para operar e atualizar; pesado para o tamanho atual |

**Efeito sobre o login federado** (CA-22a):

- Na A, cada provedor entra como uma integração no backend. Uma conta pode ter várias formas de login, ligadas pelo `usuario`, e a regra para ligar email e senha a uma conta Google com o mesmo email é decidida na demanda de login.
- Na B, Google e Apple vêm prontos, mas o gov.br depende do fornecedor.
- Na C, a mesma flexibilidade da A, com mais operação.
- **gov.br:** se e em que condições um software privado pode usar o login do gov.br **não tem fonte** em `docs/referencias/`. Vai para `hipoteses.md` (CA-21, CA-28) e não é afirmado no documento.

**Recomendação:** A. Respeita 2026-08-25 sem leitura ampla, não tem custo por usuário, mantém os dados de usuário no mesmo lugar e deixa a entidade `identidade` pronta para o federado. Se a demanda de login concluir que MFA e recuperação próprios pesam demais, a B fica como segunda opção registrada.

**Descartadas:**

- B: custo sem fonte, dependência do fornecedor e o gov.br incerto;
- C: operação demais para o tamanho atual.

**Escolha do responsável:** A, autenticação própria no backend com a entidade `identidade` (segunda opção registrada: B). Responsável, 2026-11-25 ("Aprovo todas")

### AD-13 — Valores monetários (CA-7)

**Problema.** Dinheiro nunca em ponto flutuante, do banco à tela.

**Critérios:** exatidão ao centavo; compatibilidade com o JSON da Receita (números com 0 a 2 casas, O-13); simplicidade.

| Alternativa | Prós | Contras |
|---|---|---|
| **A. `numeric` com 2 casas no banco; texto decimal na aplicação (`big.js`); texto decimal no JSON da API (ex.: `"1234.50"`); leitura do arquivo da Receita com `lossless-json`; a web formata a partir do texto, sem converter para `number`** | Exato em toda a cadeia; mesmas bibliotecas da PoC e do painel | Cada camada precisa respeitar a regra (testes) |
| B. Inteiro em centavos em todas as camadas | Aritmética simples | Converte na entrada e na saída; risco de passar de `Number.MAX_SAFE_INTEGER` se virar `number` no navegador |

**Recomendação:** A. Ponto de atenção herdado: a validação com `multipleOfPrecision` pode recusar por engano valores acima de alguns bilhões (limite conhecido do painel, no handoff da 030). A primeira demanda de backend trata isso.

**Descartada:** B, pelas conversões em toda entrada e saída.

**Escolha do responsável:** A, `numeric` com 2 casas e texto decimal em toda a cadeia. Responsável, 2026-11-25 ("Aprovo todas")

### AD-14 — Destino de `app/apuracao-cbs` e `app/painel` (CA-6, CA-27)

**Problema.** O que das duas aplicações passa ao produto.

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

**Descartadas:**

- B: fora de escopo agora;
- C: contraria a decisão de 2026-11-25.

**Escolha do responsável:** A, as duas aplicações como ferramentas internas e cópia revisada do leitor no `app/backend`. Responsável, 2026-11-25 ("Aprovo todas")

---

## Seções do documento que não são decisões

Não têm alternativas porque decorrem das decisões acima. O CA-2 vale para as AD-N.

### Dados sensíveis (CA-25)

| Dado | Em trânsito | Em repouso | Em log |
|---|---|---|---|
| Credencial da Receita | HTTPS | Cifra de envelope (AD-10) | Nunca |
| Token da Receita e URL assinada | HTTPS | Token cifrado (AD-10); URL assinada não é guardada | Nunca |
| Dados fiscais da empresa (arquivos e leitura) | HTTPS | Cifra em repouso do provedor; isolamento por empresa (AD-6) | Só contagens e identificadores internos; nenhum valor, chave de nota ou CNPJ |
| Dados pessoais de usuários (nome, email) | HTTPS | Banco cifrado em repouso; senha só como hash (AD-12) | Sem email em texto; identificador interno |
| `niConsumidor` (na primeira chamada veio com 11 dígitos, tamanho de um CPF, e a referência não diz o que é; na segunda, igual ao `ni` da empresa) | HTTPS | Fica no arquivo bruto; não é copiado para `leitura` sem necessidade | Nunca |

Perguntas para advogado, sem afirmar regra:

- base legal para tratar os dados da empresa e de quem gerou a credencial;
- prazo de guarda depois da saída do cliente;
- se a hospedagem fora do Brasil seria transferência internacional e o que ela exige;
- o tratamento do `niConsumidor` quando for CPF.

### Ambientes, testes e configuração (CA-26)

| Ambiente | Dados | API da Receita |
|---|---|---|
| Local (desenvolvedor e agentes) | Fictícios | Simulada (servidor falso nos testes, como a PoC) |
| Homologação | Fictícios | Simulada; nenhuma credencial real |
| Produção | Reais | Real, pelo coletor |

- Testes com `vitest` e API simulada; nenhum teste chama a API real nem lê `.env` (regra do `AGENTS.md`).
- O isolamento por empresa tem teste próprio contra um PostgreSQL de teste.
- Chamada real fora da produção só pelo responsável, como hoje com `npm run consulta`.
- Variáveis de ambiente: só os nomes, na seção "Configuração" dos Contratos.

### O que a arquitetura não bloqueia (CA-23, CA-24, CA-22a)

- **Antecipação** (H3, sem construir):
  - histórico por nota preservado (arquivos imutáveis, AD-8);
  - origem de cada valor rastreável até o arquivo e o tíquete;
  - isolamento e rastreio de entrega da credencial;
  - um futuro acesso de parceiro seria um tipo novo de vínculo, com autorização registrada do cliente, sobre a mesma API.
  
  Nada disso é construído.
- **Outra fonte de dados:** o coletor e a leitura ficam atrás de uma interface "fonte". A API da Receita é a única implementação. Um ERP (só como fonte, nunca como canal) ou o equivalente do IBS, se o Comitê Gestor publicar, entrariam como outra implementação gravando em `arquivo_bruto` e `leitura` com o identificador da fonte. Nenhuma das duas é desenhada.
- **Login federado:** a entidade `identidade` (AD-12).

### Decidido aqui / fica para (CA-4)

| Tema | Fica para |
|---|---|
| Telas, fluxo de cadastro, recuperação de senha, MFA, papéis e permissões; login federado | Demanda de login |
| Biblioteca de componentes, camada de estilo, tokens | 032 |
| Telas, indicadores, roteamento e busca de dados da web | 033 e a Spec da implementação do dashboard |
| Esquema real, migrações, canal e texto dos alertas | Primeira demanda de backend ou do coletor |
| Provedor de nuvem, se depender da PD-1 | Aprovação da Spec ou depois da PD-1 |
| Antecipação, compensação, guias (RAD, PCONT), cobrança | Depois da base de clientes (H3) |
| IBS, ERP | Quando houver fonte |
| Pacote compartilhado do leitor | Backlog |

## Alterações no `PROJECT_CONTEXT.md` (CA-27, CA-1)

- **§2 Estado real:**
  - linha do painel: acrescentar "Ferramenta interna de validação dos dados, **não** a primeira versão do produto para o usuário final; o dashboard do usuário será feito do zero";
  - linha "Backend, banco, autenticação": "Arquitetura decidida (demanda 031, [`arquitetura/README.md`](arquitetura/README.md)); nada construído".
- **§3 Decisões**, linhas de 2026-11-25:
  - SaaS multi-inquilino;
  - acesso a cada CNPJ decidido pela Receita, pela credencial do gov.br, sem o CreditoGov verificar procuração;
  - cada cliente informa a própria credencial (cenário A como base, B como contingência);
  - email e senha como base, sem bloquear Google, Apple e gov.br;
  - integração com ERP não é o modelo (ERP é só possível fonte de dados);
  - `app/painel` é ferramenta interna, e o dashboard é feito do zero;
  - uma linha por AD escolhida, com o resumo da escolha.
- **§4 Stack:** a subseção "Backend e painel com login — proposta, não confirmada" vira "Produto (backend, coletor e aplicação web) — decidido, não construído", com o resumo das escolhas e o link para o documento. A proposta da concepção fica citada como descartada ou confirmada, conforme as AD-2, AD-3 e AD-5.
- **§5 Em aberto:** o item "Acesso em nome de vários clientes" é reescrito como risco operacional (número de credenciais e limite), sem a frase de que bloqueia o cadastro, porque a base é o cenário A.
- **§7 Estrutura:** a pasta `docs/arquitetura/`.
- **§10 Referências:** a linha "Arquitetura do produto".
- **§11 Changelog:** uma linha de 2026-11-25 com a demanda 031.

## Alterações no `hipoteses.md` (CA-21, CA-28)

- **H1, linha "Acesso em nome de vários clientes":** reescrita com a premissa de 2026-11-25 (o acesso é decidido pela Receita pela credencial; a base é a credencial por cliente) e com as perguntas operacionais. Cada pergunta leva o efeito na arquitetura e como obter a resposta (Receita, quem já integra, portal):
  - **Uma credencial de procurador cobre vários CNPJs?** Se sim, o cenário B fica possível (AD-11). Se não, segue só o A.
  - **O limite de 4 chamadas é por credencial ou por credencial e CNPJ?** O efeito sobre o B está na AD-11: 4 CNPJs por serviço com a cadência diária, até 28 com uma consulta a cada 7 dias por CNPJ, ou igual ao A.
  - **Qual o papel do `niConsumidor`?** Ele identifica quem gerou a credencial? Isso afeta o rastreio e a LGPD.
- **H1, linha do limite**, acrescentar:
  - situação e download contam no limite?
  - abertura recusada (400, 404) conta?
  - qual o fuso do reinício à meia-noite?
- **Outras decisões em aberto:**
  - "Stack do backend e hospedagem" passa a **resolvida em 2026-11-25**, com link para `../arquitetura/README.md`. Se o provedor depender da PD-1, isso fica dito;
  - pergunta nova: "Login do gov.br: um software privado pode usar? Em que condições?", com o efeito na AD-12 e a forma de obter a resposta (documentação oficial do gov.br para integradores, a trazer para `docs/referencias/`);
  - pergunta nova: "LGPD", com as quatro perguntas para advogado da seção "Dados sensíveis".

## Riscos e decisões

- **R-1. Limite por credencial no cenário B.** Se o limite for por credencial no total, o B quase não ajuda: 4 CNPJs por serviço com a cadência diária, até 28 se cada CNPJ for consultado só a cada 7 dias. A base no A evita depender da resposta.
- **R-2. Serviço em beta.** Quatro versões da documentação em três meses, e recolhimentos e pagamentos com 404. A máquina de estados e o `servico_indisponivel` absorvem isso. O documento manda reconferir a referência antes de cada demanda de coletor.
- **R-3. Recomendações sobre bibliotecas sem prova no projeto.** Fastify e Kysely não foram usados aqui. A primeira demanda de backend confirma com um teste o isolamento por linha (papel de trabalho sem posse, sem `BYPASSRLS` e não superusuário, com `FORCE ROW LEVEL SECURITY`; empresa fixada só por transação; papel de agendamento do coletor só com `EXECUTE` na função de agendamento (cujo dono é um papel sem login, único com `BYPASSRLS`) e sem acesso direto a `consulta`, `leitura`, `arquivo_bruto` nem `credencial_receita`) e o `numeric` como texto. Se falhar, as segundas opções registradas (Drizzle e, para a autenticação, a B da AD-12) entram sem nova demanda de arquitetura, só com registro no histórico do documento.
- **R-4. Custo sem fonte.** A escolha do provedor pode ficar para depois da PD-1, sem travar a primeira demanda de backend, que roda local.
- **R-5. Sobreposição com a 033.** A 033 tem a carteira do contador. A AD-6 garante que o modelo a aceita; papéis e permissões continuam com a demanda de login.
- **R-6. Visão de produto.** O passo 4 de `produto/visao.md` ("Primeira versão do painel") pode ser lido como a 030. A US não pede mudança em `visao.md`; o `PROJECT_CONTEXT.md` esclarece. Ajustar a visão fica para o responsável.

### Pendências

- **PD-1 — Preço de hospedagem, banco, KMS e serviço de identidade.** Preencher a tabela de custo do documento só com página oficial de preço citada com data. Se o Developer não puder ler e citar a página, a tabela fica "a confirmar", e o responsável, ou uma sessão com acesso, a completa antes de escolher o provedor.

## Implantação

Nada a publicar. A demanda só altera documentação em `docs/`:

- nenhuma aplicação afetada, migration, variável de ambiente, infraestrutura, cron ou label;
- vai ao ar com o merge do PR na `main`;
- para voltar, basta reverter o commit.

Os nomes de variáveis da seção "Configuração" são proposta para demandas futuras, não configuração de agora.

## Estratégia de verificação

Não há teste automatizado: a entrega é documentação. A verificação é por checagem, e a revisão usa a tabela abaixo.

1. `git diff --name-only main...HEAD` lista só arquivos em `docs/`.
2. Para cada CA, a seção indicada na tabela "Rastreio dos CA" existe e contém o que o CA pede.
3. Cada AD-N no documento tem os sete itens do formato, e o campo de escolha está preenchido com o que o responsável aprovou.
4. **Sem dado real nem segredo (CA-29):** `git grep -nE '[0-9]{11,}' -- docs/arquitetura docs/demandas/031-stack-arquitetura` não acha CNPJ, CPF nem chave; uma busca por `client_secret=`, `Bearer ` seguido de valor e `Basic ` seguido de valor não acha segredo. As ocorrências restantes são conferidas à mão.
5. **Fontes (CA-3):** toda menção a comportamento da API leva a referência (seção, O-N ou divergência N). Nenhum preço aparece sem página e data.
6. **Links:** os links relativos novos em `PROJECT_CONTEXT.md`, `docs/README.md`, `hipoteses.md` e no documento abrem os arquivos certos.
7. `npm run lint` e `npm run build` não se aplicam: nenhuma aplicação muda.

### Rastreio dos CA

| CA | Onde é atendido |
|---|---|
| CA-1 | Abordagem 1; `docs/arquitetura/README.md`; links em `PROJECT_CONTEXT.md` e `docs/README.md` |
| CA-2 | Abordagem 2; formato das AD-1 a AD-14 |
| CA-3 | Abordagem 3; verificação 5; perguntas no `hipoteses.md` |
| CA-4 | "Decidido aqui / fica para" |
| CA-5 | AD-1, AD-2, AD-3, AD-5 |
| CA-6 | AD-2, AD-14 |
| CA-7 | AD-4, AD-5, AD-13 |
| CA-8 | AD-4, AD-7, PD-1 |
| CA-9 | AD-6; modelo conceitual |
| CA-10 | AD-6; `usuario`, `vinculo_empresa`, `empresa` |
| CA-11 | AD-8 |
| CA-12 | AD-9, "Frequência e orçamento" |
| CA-13 | AD-9, "Ciclo de uma consulta" |
| CA-14 | AD-9, "Falhas" |
| CA-15 | AD-9, "Alertas" |
| CA-16 | AD-10 |
| CA-17 | AD-10, "Ciclo" |
| CA-18 | AD-11, cenário A |
| CA-19 | AD-11, cenário B |
| CA-20 | AD-11, "Passagem e convivência" |
| CA-21 | Alterações no `hipoteses.md` (H1) |
| CA-21a | Premissas do documento; AD-10, "Rastreio"; `credencial_entrega` |
| CA-22 | AD-12 |
| CA-22a | AD-12, "Efeito sobre o login federado"; `identidade`; pergunta do gov.br |
| CA-23 | "O que a arquitetura não bloqueia"; AD-8 |
| CA-24 | "O que a arquitetura não bloqueia" (outra fonte de dados) |
| CA-25 | "Dados sensíveis" e as perguntas de LGPD |
| CA-26 | "Ambientes, testes e configuração"; Contratos, "Configuração" |
| CA-27 | Alterações no `PROJECT_CONTEXT.md` |
| CA-28 | Alterações no `hipoteses.md` |
| CA-29 | Verificação 4 |
