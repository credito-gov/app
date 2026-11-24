# 030-painel-primeira-versao — Primeira versão do painel: saldo, origem e pendências

- **Status:** em-review
- **US aprovada:** 2026-11-24, pelo responsável ("Aprovo assim"), sobre a versão do commit `1c558d6`, com as recomendações de todas as perguntas (ver "Decisões na aprovação")
- **Spec aprovada:** 2026-11-24, pelo responsável ("Aprovo a Spec"), com as decisões técnicas DT-1 a DT-10 e a decisão F-2 (ver [`spec.md`](spec.md))
- **Tasks aprovadas:** 2026-11-24, pelo responsável ("Aprovo as Tasks"), sobre a versão do commit `5f68994` (ver [`tasks.md`](tasks.md))
- **Branch:** `feat/030-painel-primeira-versao`
- **Worktree:** `.claude/worktrees/030-painel-primeira-versao`
- **Solicitante / data:** responsável pelo produto, 2026-11-24

## História

Como responsável por uma empresa no regime regular, com a credencial que eu mesmo gero no portal da Receita, quero abrir um painel que mostra o crédito de CBS das minhas compras, separado entre o que a Receita ainda tem a apropriar, o que já apropriou e o que já foi utilizado, de qual nota e de qual emitente ele vem, e quais notas seguram crédito pendente, para enxergar esse crédito como parte do caixa sem abrir arquivo JSON nem terminal.

## Contexto

É o passo 4 do caminho do produto ([`../../produto/visao.md`](../../produto/visao.md)): "saldo, origem e pendências, com a fonte de dados escolhida". A fonte é a API de apuração da CBS da Receita (H1 confirmada para a CBS, [`../../produto/hipoteses.md`](../../produto/hipoteses.md)). A demanda 029 criou `app/apuracao-cbs`, que baixa os arquivos dessa API, valida contra os schemas oficiais e guarda o arquivo bruto em `.local/arquivos/`, fora do git.

### Decisões já tomadas pelo responsável

1. **Para quem:** uma empresa, um CNPJ, com a credencial que o próprio titular gera no portal. Cadastro de vários clientes fica fora (o acesso em nome de vários contribuintes não está documentado; ver H1).
2. **Forma do painel:** web local, sem login (D-1).
3. **Dados:** fictícios agora, reais depois. O painel é construído e demonstrado com arquivos fictícios no formato oficial; os reais entram por configuração da pasta de arquivos, nunca no repositório.

### O que a documentação sustenta

Da referência [`../../referencias/apuracao-cbs/README.md`](../../referencias/apuracao-cbs/README.md) ("O que vem sobre cada crédito" e "O que isso significa para o produto"):

- por período de apuração (`pa`) e por documento: `chave`, tipo do documento, `origem`, datas de emissão, registro e atualização;
- `apropriacao.aApropriar` "ainda não disponível para uso"; `apropriacao.apropriado` "já pode ser utilizado"; `utilizacao.utilizado` "já compensou débito";
- o fornecedor **não vem no crédito**: vem nos recolhimentos (`niFornecedor`, com `chaveDFE` opcional) e "pode ser extraído da chave da nota" (o leiaute da chave **não** está em `docs/referencias/`);
- **nenhum campo explica por que um crédito está a apropriar**;
- a consulta é incremental: cada arquivo traz os créditos incluídos ou atualizados desde a última solicitação concluída, limitado aos últimos 8 dias; sem solicitação concluída nos últimos 3 meses, a busca começa no primeiro dia do mês corrente; não há como pedir histórico.

### Observado no arquivo real de 2026-11-24

Chamada real de créditos feita pelo responsável em 2026-11-24, com a credencial de **outra empresa** (não a da primeira chamada, que veio vazia), API v2, schema 1.0.0. Primeira solicitação dessa credencial. É observação de **um arquivo, de um CNPJ, de um dia**; aqui só entram estrutura, códigos, contagens e proporções, sem nenhum dado real.

| # | Ponto | Observado |
|---|---|---|
| O-1 | Ciclo | Token, abertura, situação `CONCLUIDA` e download funcionaram; a estimativa devolvida foi de 8 segundos |
| O-2 | Schema | O arquivo **não passa no schema oficial por uma única divergência**: `ni` vem com 14 dígitos, e o schema exige `^\d{8}$`. `ni` e `niConsumidor` vêm iguais, com 14 dígitos. Todo o resto passa. Com validação estrita, a prova de conceito não gerou resumo |
| O-3 | Volume | 9 períodos (`pa` no formato `MM/AAAA`, de 01/2026 a 12/2026), 896 créditos; 878 num só período (11/2026), os demais com 1 a 5 cada |
| O-4 | Janela | `registro` de janeiro a novembro de 2026; toda `atualizacao` entre 2026-11-01 e 2026-11-21; arquivo gerado em 2026-11-24. A janela foi maior que 8 dias. É compatível com a regra documentada para quem não tem solicitação concluída nos últimos 3 meses (início no primeiro dia do mês), mas um arquivo não confirma a regra nem o limite de 8 dias das solicitações seguintes |
| O-5 | Origem | `origem` 0 (normal) nos 896. Nenhuma devolução, cancelamento ou perecimento |
| O-6 | Documentos | Código 55: 207; 57: 551; 62: 3; 65: 3; 91: 132. Chave de 44 dígitos nos códigos 55, 57, 62 e 65 (as posições 21–22 repetem o código do documento); chave de **50 dígitos** no código 91 |
| O-7 | Repetição | As 896 chaves são distintas no arquivo. Com um arquivo só, não se testou crédito repetido entre arquivos |
| O-8 | Campos | Por crédito, só vieram `origem`, `documento`, `chave`, `emissao`, `registro`, `atualizacao`, `cbs.apurado` e `cbs.apropriacao.{apropriado, aApropriar, utilizacao.{utilizado, naoUtilizado.saldoCredor}}`. `suspenso`, `inapropriavel`, `prescrito`, `excedente`, `restabelecido`, `inutilizavel` e `pedidoRessarcimento` não apareceram em nenhum |
| O-9 | Zero | Campo zerado vem **ausente**: `aApropriar` ausente em 9; `apropriado` e `utilizado` ausentes em 884. Exceção: `saldoCredor` vem em todos, sempre 0 |
| O-10 | Situação | 884 só com `aApropriar`; 9 só com `apropriado`; 3 com os dois. 887 dos 896 (99%) têm valor a apropriar |
| O-11 | Soma | `apurado` = `apropriado` + `aApropriar` (ausente = 0) nos 896, ao centavo |
| O-12 | Utilização | Nos 12 com `apropriado`, `apropriado` = `utilizado`, e `saldoCredor` = 0 em todos: **todo o apropriado observado já tinha sido utilizado** |
| O-13 | Valores | Nenhum negativo. Número JSON com 0, 1 ou 2 casas decimais (zeros à direita cortados) |
| O-14 | Emissão × período | `emissao` no mês do `pa` em 890; antes em 3; depois em 3 |
| O-15 | Datas | Com fuso (`-03:00`); `registro` com 3 a 6 casas de fração de segundo, `atualizacao` com 0 a 3 |
| O-16 | Emitente na chave | Nas chaves de 44 dígitos, as posições 7–20 formam 125 sequências distintas de 14 dígitos; em 1 crédito a sequência é igual ao `ni` da própria empresa. **Que essas posições sejam o CNPJ do emitente não tem fonte em `docs/referencias/`** |
| O-17 | Outros serviços | Recolhimentos respondeu **HTTP 404 de novo**, com outra credencial, com a mensagem de endereço não encontrado. Pagamentos não foi tentado. Débitos: ver O-18 a O-25 |

**Débitos, mesma credencial, mesmo dia** (schema 1.0.0, API v2):

| # | Ponto | Observado |
|---|---|---|
| O-18 | Ciclo e schema | Abertura, situação `CONCLUIDA` e download funcionaram; estimativa de 4 segundos. Mesma única divergência de schema: `ni` com 14 dígitos. `ni` e `niConsumidor` iguais entre si e aos do arquivo de créditos |
| O-19 | Volume e janela | 3 períodos (01/2026, 10/2026 e 11/2026) e 2.786 débitos: 103, 1.515 e 1.168. `atualizacao` entre 2026-11-04 e 2026-11-19 |
| O-20 | Campos | Só `origem`, `documento`, `chave`, `emissao`, `registro`, `atualizacao`, `cbs.apurado`, `cbs.extinto` e `cbs.saldoDevedor`. `suspenso`, `inexigivel` e `pgtoAntecipado` não apareceram |
| O-21 | Origem e documentos | `origem` 0 em todos. Código 55: 2.687 (chave de 44 dígitos); 91: 99 (chave de 50 dígitos). Chaves distintas |
| O-22 | Valores | `extinto` ausente quando zero (presente em 4); `saldoDevedor` presente em todos (zero em 3). `apurado` = `extinto` + `saldoDevedor` em todos, ao centavo. Nenhum negativo. 99,9% dos débitos com saldo devedor integral |
| O-23 | Emitente na chave | Nas chaves de 44 dígitos dos **débitos**, as posições 7–20 são iguais ao `ni` da empresa em 2.070, têm a mesma raiz de 8 dígitos com outro sufixo em 616 (outro estabelecimento da mesma empresa) e outra raiz em 1. Nos **créditos**, outra raiz em 763 de 764 e igual ao `ni` em 1. É evidência observada, compatível com essas posições serem o CNPJ do emitente (nas vendas, a própria empresa; nas compras, terceiros); **não substitui a fonte oficial do leiaute** |
| O-24 | Mais de um estabelecimento | Um arquivo traz notas de mais de um estabelecimento da mesma raiz, mesmo com `ni` de 14 dígitos no cabeçalho. Comparar empresas pela raiz (CA-3) é o certo |
| O-25 | Nota nos dois arquivos | Uma única chave aparece em créditos e em débitos: a nota de crédito cujo emitente é a própria empresa (O-16) |

**Consequências para esta US:**

- Validação estrita pelo schema oficial recusaria **todo** arquivo real observado até agora (D-2).
- Quase todo o crédito está a apropriar, e o pouco apropriado já foi utilizado: chamar o apropriado de "confirmado" sugere um dinheiro que não existe mais (D-3).
- Sem recolhimentos, a única fonte possível de emitente é a chave da nota. O padrão das posições 7–20 nos dois arquivos (O-23) reforça a leitura como CNPJ do emitente, mas a fonte oficial do leiaute continua faltando; e 15% das notas de crédito (código 91) têm chave de outro formato (D-4).
- Um arquivo mistura estabelecimentos da mesma raiz (O-24): a comparação de empresa pela raiz está confirmada.
- O arquivo de débitos tem a mesma forma do de créditos e quase todo débito está com saldo devedor integral (O-22). Isso informa a D-7.
- Um período pode ter quase mil notas: a lista precisa continuar utilizável com esse volume.
- Identidade do crédito entre arquivos (D-5) e origens diferentes de normal (D-6) **não puderam ser testadas**.

### Outras restrições

- **Só CBS.** A API não cobre IBS.
- **Crédito não confirmado nunca é apresentado como disponível** (`PROJECT_CONTEXT.md` §6).
- **Nenhum dado real** (CNPJ, chave de nota, DARF, valor) em código, teste ou documento. Credencial nunca em chat, commit, log ou PR. Nenhum teste chama a API real. O painel não chama a API: os arquivos chegam pela `app/apuracao-cbs`.
- **Valores monetários em decimal de precisão fixa.** Campo monetário ausente vale zero, como na prova de conceito (`app/apuracao-cbs/src/dinheiro.ts`) e como observado (O-9).
- **Primeira demanda de uma aplicação nova:** define o comando de teste e o registra no `AGENTS.md`.
- A stack não está decidida (`PROJECT_CONTEXT.md` §4) e é assunto da Spec. O wireframe de [`../../design/wireframes/dashboard-principal.md`](../../design/wireframes/dashboard-principal.md) é da concepção (compensação de ICMS, antecipação, projeção) e serve só de ponto de partida.

### Forma do painel (alternativas avaliadas; escolhida a A, D-1)

| | **A. Web local, sem login** | **B. Backend, banco e login** |
|---|---|---|
| Como funciona | A aplicação roda na máquina do responsável, abre no navegador em endereço local e lê os arquivos de uma pasta. Cada abertura recalcula a visão a partir dos arquivos | Um servidor com banco de dados guarda os arquivos importados e os créditos consolidados. O painel exige entrar com email e senha (decisão de 2026-08-25: autenticação própria) |
| O que exige construir | Leitura e validação dos arquivos, consolidação, as três telas (saldo, origem, pendências), arquivos fictícios e testes | Tudo de A, mais: modelo do banco e migrações, importação de arquivo com controle de duplicado, autenticação (hash de senha, sessão, expiração, criação do usuário), proteção das rotas, configuração de banco e segredos, testes dessas partes |
| O que adia | Login, banco, histórico persistido fora dos arquivos, hospedagem, vários usuários | Hospedagem continua adiada (não há decisão; fora desta demanda); vários clientes continuam fora |
| Riscos | Retrabalho ao passar para servidor (a leitura e a consolidação podem ser reaproveitadas; a camada de dados e o acesso, não). Só funciona na máquina de quem tem os arquivos | Modelar banco e consolidação com um único arquivo real visto e sem saber como um crédito muda entre arquivos (D-5): o modelo pode mudar. Mais superfície para erro de segurança, agora com dado fiscal guardado. Sem hospedagem decidida, roda também só localmente, com o custo de B e o alcance de A. Demanda bem maior e mais longa |
| O que demonstra | O valor da visão (saldo, origem, pendências) para o próprio titular | O mesmo, mais a base técnica do produto SaaS |

**Recomendação: A.** Já há um arquivo real com dados, mas um só: a identidade do crédito entre arquivos, as origens especiais e a fonte do emitente seguem em aberto, e um banco modelado agora tende a ser refeito. A empresa é uma só, com credencial do próprio titular, e os arquivos já ficam na máquina dele. A cobre a validação de valor (H2) com custo pequeno; B passa a valer quando houver vários arquivos reais observados, decisão de hospedagem e o modelo de acesso em nome de clientes.

## Critérios de aceite

### Leitura dos arquivos (comum)

- **CA-1:** O painel lê arquivos de retorno das consultas de créditos e de recolhimentos no formato oficial (schemas 1.0.0, cópias em `app/apuracao-cbs/schemas/oficiais/`), inclusive os arquivos brutos como a `app/apuracao-cbs` os guarda, sem alteração. Aceita os formatos observados (O-9, O-13, O-15): campos zerados ausentes, números com 0 a 2 casas decimais e datas com fuso e 0 a 6 casas de fração de segundo. A origem dos arquivos é a pasta local (CA-A2).
- **CA-2:** Cada arquivo é validado contra o schema oficial do seu serviço antes de ser usado, com uma única tolerância, a de D-2 (`ni` com 8 ou 14 dígitos), e nenhuma outra. Arquivo ilegível, de serviço não reconhecido ou com qualquer divergência fora dessa tolerância não entra em nenhum número; o painel lista o arquivo e o motivo, e os demais continuam sendo usados. Arquivo aceito com a divergência tolerada aparece marcado como "aceito com divergência conhecida do schema 1.0.0", com o nome da divergência. As cópias dos schemas oficiais não são alteradas.
- **CA-3:** Todos os arquivos usados são da mesma empresa. A comparação é pela raiz do CNPJ: os 8 primeiros dígitos de `ni`, que vem com 8 dígitos no schema e com 14 no arquivo real (O-2), e um mesmo arquivo pode trazer notas de mais de um estabelecimento da raiz (O-24). Se houver arquivos de mais de uma empresa, o painel não mistura: não mostra nenhum valor e diz quais arquivos divergem.
- **CA-4:** Com vários arquivos de créditos, cada crédito conta uma vez: quando o mesmo crédito aparece em mais de um arquivo, vale a versão mais recente, pela regra de D-5. Os totais não mudam se o mesmo arquivo for lido duas vezes.
- **CA-5:** O painel mostra, por serviço, a data e hora de geração (`geradoEm`) do arquivo mais recente usado, quantos arquivos foram lidos e o intervalo das datas de `atualizacao` dos créditos, e avisa que a visão é só a dos arquivos lidos e que a Receita não fornece histórico por esta API. O painel não afirma o tamanho da janela de cada consulta (ver O-4).
- **CA-6:** Sem arquivo de créditos, ou só com arquivos com `apuracao` vazia, o painel diz que a Receita não devolveu créditos nos arquivos lidos, em vez de exibir um saldo R$ 0,00 como se fosse apurado.

### Saldo (comum)

- **CA-7:** A tela de saldo mostra, no geral e por período de apuração (`pa`), com o nome oficial do campo ao lado do rótulo: "A apropriar (pendente)" (`aApropriar`), "Apropriado" (`apropriado`), "Já utilizado" (`utilizado`) e "Saldo credor não utilizado" (`saldoCredor`). Os totais ficam sempre separados, nunca somados num número só, e nenhum é calculado a partir dos outros: cada um é a soma do campo como veio. Nenhum rótulo usa "confirmado" (D-3).
- **CA-8:** Nenhum valor a apropriar, suspenso, inapropriável ou prescrito é somado a outro total. Nenhuma tela usa "disponível", "pode usar" ou equivalente para qualquer valor (D-3).
- **CA-9:** O painel diz, na tela de saldo, que mostra só CBS e que o IBS não está na fonte de dados.

### Origem (comum)

- **CA-10:** Uma lista dos créditos mostra, por nota: período (`pa`), tipo de documento (nome da tabela oficial), chave, data de emissão, origem (nome da tabela oficial), emitente (CA-12), apurado, a apropriar, apropriado e utilizado. A lista pode ser filtrada por período, por tipo de documento, por emitente e por "só com valor a apropriar"; pode ser ordenada por data de emissão e por valor a apropriar; e tem busca por trecho da chave. Com um período de 1.000 notas, a lista continua utilizável (a Spec define se pagina ou como limita a exibição).
- **CA-11:** O detalhe de uma nota mostra todos os campos do crédito com o nome oficial (inclusive `suspenso`, `inapropriavel`, `prescrito`, `excedente`, `restabelecido`, `inutilizavel` e `pedidoRessarcimento`, quando vierem; ausente aparece como não informado ou zero, conforme a Spec, sem distinção inventada), as datas de registro e atualização, e os itens de recolhimento ligados à nota pela chave (`chaveDFE` igual à `chave`): data de arrecadação, número do DARF, período, vencimento, fornecedor, principal, multa, juros e total.
- **CA-12:** O emitente aparece só quando identificado pela regra de D-4 (`niFornecedor` do recolhimento ligado à nota, ou a chave de 44 dígitos, conforme a fonte oficial do leiaute registrada em `docs/referencias/`), com a indicação de onde veio (recolhimento ou chave da nota). Nos demais casos, inclusive todas as notas do código 91 (chave de 50 dígitos), a nota mostra "emitente não identificado". Quando o emitente identificado tem a mesma raiz de CNPJ da empresa, a nota mostra "emitida pela própria empresa", e não um fornecedor. O painel nunca deduz emitente por semelhança, nome ou valor.
- **CA-13:** Notas com origem diferente de normal (devolução, cancelamento, perecimento, nota de crédito) aparecem destacadas com o nome da origem e entram nos totais conforme D-6 (somadas como vêm, sem inverter sinal). Notas com emissão fora do mês do período (O-14) aparecem como vêm, sem correção.

### Pendências (comum)

- **CA-14:** Uma visão de pendências lista as notas com valor a apropriar maior que zero, agrupadas por emitente, com grupos próprios para "emitente não identificado" e "emitida pela própria empresa", mostrando a quantidade de notas e o total a apropriar de cada grupo, do maior para o menor, e permitindo abrir as notas de cada grupo. A soma dos grupos é igual ao total a apropriar do CA-7. A tela diz que percentual do total a apropriar está em "emitente não identificado".
- **CA-15:** A visão de pendências não afirma o motivo da pendência. O texto diz que a Receita informa o valor a apropriar sem dizer o motivo, e não diz que o emitente deixou de recolher.

### Valores, dados e segurança (comum)

- **CA-16:** Valores monetários são lidos sem perda (inclusive números JSON com 0 ou 1 casa decimal) e somados em decimal exato, sem ponto flutuante; cada total é igual, centavo a centavo, à soma dos itens que o compõem; a exibição é em reais no padrão brasileiro (R$ 1.234,56, negativos com sinal).
- **CA-17:** A aplicação traz um conjunto versionado de arquivos fictícios, válidos contra os schemas oficiais salvo a divergência tolerada em D-2, que imita a forma observada e permite demonstrar todos os CA:
  - como no real: `ni` e `niConsumidor` iguais, com 14 dígitos; campos zerados ausentes e `saldoCredor` presente; números com 0, 1 e 2 casas; datas com fuso e frações de tamanhos diferentes; documentos 55, 57, 62, 65 com chave de 44 dígitos e 91 com chave de 50; um período concentrando quase todas as notas (centenas, para o CA-10); quase todo o crédito a apropriar, apropriações parciais, apropriado igual ao utilizado; uma nota com emitente igual à própria empresa; emissões fora do mês do período;
  - o que o real não trouxe: origens diferentes de normal; o mesmo crédito em dois arquivos com valores diferentes; recolhimentos com e sem `chaveDFE`; apropriado ainda não utilizado (`saldoCredor` maior que zero); um arquivo com `ni` de 8 dígitos; um arquivo de outra empresa; um arquivo inválido por motivo diferente do `ni`; um arquivo vazio.
  Chaves, NIs e números de DARF são fictícios e não correspondem a documento ou CNPJ válido (dígito verificador inválido, por exemplo); valores são inventados. Arquivos grandes podem ser gerados por script versionado em vez de escritos à mão.
- **CA-18:** O lugar onde ficam arquivos reais é ignorado pelo git. Nenhum teste, exemplo ou documento usa dado real.
- **CA-19:** O painel não chama a API da Receita, não pede, não lê e não guarda credencial, e não lê o `.env` da `app/apuracao-cbs`.

### Aplicação e documentação (comum)

- **CA-20:** O painel é uma aplicação nova em `app/<nome>` (nome definido na Spec), com README que explica o que faz, o que não faz, como rodar com os fictícios e como apontar para os arquivos reais.
- **CA-21:** A demanda define os comandos de teste, lint e build da aplicação e os registra no `AGENTS.md` (regra de testes e seção "Comandos"), no `PROJECT_CONTEXT.md` (§2, §4 e §7) e em `.claude/fluxo.json` (`apps`).
- **CA-22:** Os testes automatizados cobrem os CA-1 a CA-19 a partir dos arquivos fictícios, sem rede e sem `.env`; teste, lint e build passam.
- **CA-23:** A demanda registra o "Observado no arquivo real de 2026-11-24" (O-1 a O-25, sem dado real) em `docs/referencias/apuracao-cbs/README.md` (seção "Observado na chamada real" e tabela de divergências, com a divergência do `ni` entre schema e arquivo como **confirmada**) e em `docs/produto/hipoteses.md` (H1: motivo da pendência, recolhimentos, dados para observar), junto com as decisões D-2 a D-6, as de domínio (D-3 a D-6) como hipóteses a conferir.

### Débitos (D-7)

- **CA-D1:** O painel lê também arquivos de débitos, com as mesmas regras de validação, empresa, consolidação e data dos CA-1 a CA-5.
- **CA-D2:** Um bloco "Débitos de CBS (vendas)", separado do saldo de crédito, mostra no geral e por período os totais de `apurado`, `extinto` e `saldoDevedor`, com o nome oficial ao lado do rótulo. Nenhum total de débito é subtraído, somado ou comparado a total de crédito, e o bloco diz que o painel não calcula saldo líquido.
- **CA-D3:** Os fictícios incluem arquivos de débitos que imitam a forma observada (O-18 a O-22: `extinto` ausente quando zero, documentos 55 e 91, notas de mais de um estabelecimento da mesma raiz) e a nota que aparece nos dois arquivos (O-25).

### Painel local, sem login (D-1)

- **CA-A1:** Um comando documentado sobe o painel na máquina do responsável e ele abre no navegador num endereço local. O painel só aceita conexão da própria máquina e não tem login.
- **CA-A2:** A pasta de arquivos é configurável. Sem configuração, o painel usa os fictícios versionados; apontar para os arquivos reais (por exemplo, `app/apuracao-cbs/.local/arquivos/`) é só configuração, sem copiar nem alterar os arquivos. Recarregar a página reflete arquivos novos na pasta.
- **CA-A3:** O painel só lê: não grava, move nem apaga nada na pasta de arquivos.

## Fora de escopo

- Vários clientes ou vários CNPJs; acesso de contador à carteira.
- Chamar a API da Receita a partir do painel, agendar consultas ou rodar `npm run consulta`.
- IBS; tributos antigos.
- Pagamentos no painel. Dos débitos, só os totais do CA-D2: sem lista de notas de venda.
- Saldo líquido (crédito menos débito), projeção de caixa, compensação, antecipação e geração de guia (RAD, PCONT).
- Explicar o motivo da pendência ou afirmar que o emitente não recolheu.
- Nome ou razão social do emitente (só o número que vier do recolhimento ou da chave).
- **"Resumir mesmo inválido" na `app/apuracao-cbs`:** a prova de conceito continua recusando o arquivo real pelo `ni` de 14 dígitos (decisão D-1 da demanda 029). Ajustar isso é item próprio do backlog, não desta demanda; o painel trata a divergência no seu próprio leitor (D-2).
- Alterar as cópias dos schemas oficiais.
- Backend, banco de dados, login, hospedagem, domínio, publicação, CI (D-1).
- Atualizar o design system para o tema escuro (item próprio do backlog).
- Alterar a `app/apuracao-cbs`, salvo o mínimo para reaproveitar código, se a Spec justificar.

## Decisões na aprovação (2026-11-24)

O responsável aprovou a US com as recomendações de todas as perguntas. As de domínio (D-3 a D-6) são hipóteses a conferir e vão para `docs/produto/hipoteses.md` (CA-23).

- **D-1 (era P-1): forma do painel.** Alternativa A: web local, sem login, lendo uma pasta de arquivos. Backend, banco e login ficam fora; valem os CA-A1 a CA-A3.
- **D-2 (era P-2): validação do `ni`.** Tolerar só essa divergência: `ni` com 8 ou 14 dígitos (só números); todo o resto validado pelo schema oficial sem alteração; arquivo marcado como "aceito com divergência conhecida do schema 1.0.0". Rever quando a Receita publicar schema novo.
- **D-3 (era P-3): rótulos do saldo.** Quatro totais com o nome oficial: "A apropriar (pendente)", "Apropriado", "Já utilizado" e "Saldo credor não utilizado". Nenhum usa "confirmado" nem "disponível"; nenhum é calculado a partir dos outros. Qual valor é o saldo utilizável fica para tributarista.
- **D-4 (era P-4): emitente.** `niFornecedor` dos recolhimentos (pela `chaveDFE`) mais a chave de 44 dígitos (códigos 55, 57, 62 e 65), com a fonte oficial do leiaute registrada em `docs/referencias/`. **Sem essa fonte, a demanda volta ao usuário antes de seguir.** O código 91 (chave de 50 dígitos) fica "emitente não identificado". Nota cujo emitente tem a mesma raiz de CNPJ da empresa vai para o grupo "emitida pela própria empresa" e aparece nos dois lados, sem compensar; o significado fica para tributarista.
- **D-5 (era P-5): identidade do crédito entre arquivos.** Hipótese: período, chave, tipo de documento e origem; vale a versão com `atualizacao` mais recente e, no empate, a do arquivo com `geradoEm` mais recente. Conferir na segunda consulta real da mesma credencial.
- **D-6 (era P-6): origens diferentes de normal.** Hipótese: valores somados como vêm, sem inverter sinal, com a origem destacada. Conferir com tributarista e com o primeiro arquivo real que trouxer essas origens.
- **D-7 (era P-7): débitos.** Bloco separado só com totais por período (CA-D1 a CA-D3), sem lista de notas de venda e sem saldo líquido.
- **D-8 (era P-8): aparência.** Tokens do tema escuro da landing, com foco em tela de computador.

## Perguntas em aberto

Nenhuma sobre a US. A condição de D-4 (fonte oficial do leiaute da chave) é tratada na Spec.
