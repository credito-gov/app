# 030-painel-primeira-versao — Primeira versão do painel: saldo, origem e pendências

- **Status:** us-em-revisão
- **Branch:** `feat/030-painel-primeira-versao`
- **Worktree:** `.claude/worktrees/030-painel-primeira-versao`
- **Solicitante / data:** responsável pelo produto, 2026-11-24

> **Pergunta bloqueante (P-1): forma do painel.** Web local sem login (alternativa A) ou backend com banco e login (alternativa B). As duas estão descritas em "Forma do painel", com custo e recomendação. Os critérios comuns valem para as duas; os critérios A-N e B-N valem só para a alternativa escolhida. Ao aprovar a US, o bloco não escolhido sai do documento. A Spec só começa depois dessa escolha.

## História

Como responsável por uma empresa no regime regular, com a credencial que eu mesmo gero no portal da Receita, quero abrir um painel que mostra o crédito de CBS das minhas compras, separado entre o que a Receita já apropriou e o que ainda está a apropriar, de qual nota e de qual fornecedor ele vem, e quais notas seguram crédito pendente, para enxergar esse crédito como parte do caixa sem abrir arquivo JSON nem terminal.

## Contexto

É o passo 4 do caminho do produto ([`../../produto/visao.md`](../../produto/visao.md)): "saldo, origem e pendências, com a fonte de dados escolhida". A fonte é a API de apuração da CBS da Receita (H1 confirmada para a CBS, [`../../produto/hipoteses.md`](../../produto/hipoteses.md)). A demanda 029 criou `app/apuracao-cbs`, que baixa os arquivos dessa API, valida contra os schemas oficiais e guarda o arquivo bruto em `.local/arquivos/`, fora do git.

### Decisões já tomadas pelo responsável

1. **Para quem:** uma empresa, um CNPJ, com a credencial que o próprio titular gera no portal. Cadastro de vários clientes fica fora (o acesso em nome de vários contribuintes não está documentado; ver H1).
2. **Forma do painel:** decidida ao aprovar esta US (P-1).
3. **Dados:** fictícios agora, reais depois. O painel é construído e demonstrado com arquivos fictícios no formato oficial, como os de `app/apuracao-cbs/test/fixtures/`. Os reais entram quando a Receita devolver créditos.

### O que restringe esta versão

- **Não se sabe o que os dados significam na prática.** Na chamada real de 2026-11-24 ([`../../referencias/apuracao-cbs/README.md`](../../referencias/apuracao-cbs/README.md), "Observado na chamada real"), créditos e débitos vieram vazios e recolhimentos e pagamentos responderam HTTP 404. Não se observou nenhum crédito `aApropriar` nem nenhum `niFornecedor`. O painel mostra os campos oficiais com os nomes oficiais e não interpreta além do que a referência sustenta.
- **O que a referência sustenta** (seção "O que vem sobre cada crédito" e "O que isso significa para o produto"):
  - por período de apuração (`pa`) e por documento: `chave`, tipo do documento, `origem`, datas de emissão, registro e atualização;
  - `apropriacao.aApropriar` "ainda não disponível para uso"; `apropriacao.apropriado` "já pode ser utilizado"; "pendente e confirmado: `aApropriar` e `apropriado`, por nota, na visão oficial";
  - o fornecedor **não vem no crédito**: vem nos recolhimentos (`niFornecedor`, com `chaveDFE` opcional) e "pode ser extraído da chave da nota" (sem fonte do leiaute em `docs/referencias/`; ver P-3);
  - **nenhum campo explica por que um crédito está a apropriar**.
- **A consulta é incremental.** Cada arquivo traz só os créditos "incluídos ou atualizados" desde a última solicitação concluída, até 8 dias. A visão da empresa é a soma de vários arquivos, e o mesmo crédito pode vir em mais de um (ver P-2).
- **Só CBS.** A API não cobre IBS.
- **Crédito não confirmado nunca é apresentado como disponível** (`PROJECT_CONTEXT.md` §6).
- **Nenhum dado real** (CNPJ, chave de nota, valor) em código, teste ou documento. Credencial nunca em chat, commit, log ou PR. Nenhum teste chama a API real. O painel não chama a API (os arquivos chegam pela `app/apuracao-cbs`).
- **Valores monetários em decimal de precisão fixa.** Campo monetário ausente vale zero, como na prova de conceito (`app/apuracao-cbs/src/dinheiro.ts`).
- **Primeira demanda de uma aplicação nova:** define o comando de teste e o registra no `AGENTS.md`.
- A stack não está decidida (`PROJECT_CONTEXT.md` §4) e é assunto da Spec. O wireframe de [`../../design/wireframes/dashboard-principal.md`](../../design/wireframes/dashboard-principal.md) é da concepção (compensação de ICMS, antecipação, projeção) e serve só de ponto de partida.

### Forma do painel (P-1)

| | **A. Web local, sem login** | **B. Backend, banco e login** |
|---|---|---|
| Como funciona | A aplicação roda na máquina do responsável, abre no navegador em endereço local e lê os arquivos de uma pasta. Cada abertura recalcula a visão a partir dos arquivos | Um servidor com banco de dados guarda os arquivos importados e os créditos consolidados. O painel exige entrar com email e senha (decisão de 2026-08-25: autenticação própria) |
| O que exige construir | Leitura e validação dos arquivos, consolidação, as três telas (saldo, origem, pendências), arquivos fictícios e testes | Tudo de A, mais: modelo do banco e migrações, importação de arquivo com controle de duplicado, autenticação (hash de senha, sessão, expiração, criação do usuário), proteção das rotas, configuração de banco e segredos, testes dessas partes |
| O que adia | Login, banco, histórico persistido fora dos arquivos, hospedagem, vários usuários | Hospedagem continua adiada (não há decisão; ver P-1b); vários clientes continuam fora |
| Riscos | Retrabalho ao passar para servidor (a leitura e a consolidação podem ser reaproveitadas; a camada de dados e o acesso, não). Só funciona na máquina de quem tem os arquivos | Modelar banco e regras de consolidação sem ter visto nenhum crédito real: o modelo pode mudar quando os dados chegarem. Mais superfície para erro de segurança, agora com dado fiscal guardado. Sem hospedagem decidida, roda também só localmente, com o custo de B e o alcance de A. Demanda bem maior e mais longa |
| O que demonstra | O valor da visão (saldo, origem, pendências) para o próprio titular | O mesmo, mais a base técnica do produto SaaS |

**Recomendação: A.** Os dados são fictícios e o significado de `aApropriar`, a identidade do crédito entre arquivos e a fonte do fornecedor ainda são perguntas abertas: um banco modelado agora tende a ser refeito. A empresa é uma só, com credencial do próprio titular, e os arquivos já ficam na máquina dele. A cobre a validação de valor (H2) com custo pequeno; B passa a valer quando houver dado real observado, decisão de hospedagem e o modelo de acesso em nome de clientes.

## Critérios de aceite

### Leitura dos arquivos (comum)

- **CA-1:** O painel lê arquivos de retorno das consultas de créditos e de recolhimentos no formato oficial (schemas 1.0.0, cópias em `app/apuracao-cbs/schemas/oficiais/`), inclusive os arquivos brutos como a `app/apuracao-cbs` os guarda, sem alteração. A origem dos arquivos é a pasta local (A-2) ou a importação (B-2).
- **CA-2:** Cada arquivo é validado contra o schema oficial do seu serviço antes de ser usado. Arquivo ilegível, de serviço não reconhecido ou que não passa no schema não entra em nenhum número; o painel lista o arquivo e o motivo, e os demais continuam sendo usados.
- **CA-3:** Todos os arquivos usados são da mesma empresa (mesmo `ni`). Se houver arquivos de mais de uma empresa, o painel não mistura: não mostra nenhum valor e diz quais arquivos divergem. (A regra de comparação depende de P-7.)
- **CA-4:** Com vários arquivos de créditos, cada crédito conta uma vez: quando o mesmo crédito aparece em mais de um arquivo, vale a versão mais recente, pela regra decidida em P-2. Os totais não mudam se o mesmo arquivo for lido duas vezes.
- **CA-5:** O painel mostra, por serviço, a data e hora de geração (`geradoEm`) do arquivo mais recente usado e quantos arquivos foram lidos, e avisa que a visão é a dos arquivos disponíveis até essa data (a consulta é incremental e não traz histórico).
- **CA-6:** Sem arquivo de créditos, ou só com arquivos com `apuracao` vazia, o painel diz que a Receita não devolveu créditos nos arquivos lidos, em vez de exibir um saldo R$ 0,00 como se fosse apurado.

### Saldo (comum)

- **CA-7:** O painel mostra o total de `apropriado` com o rótulo "Apropriado (confirmado pela Receita)" e o total de `aApropriar` com o rótulo "A apropriar (pendente)", no geral e por período de apuração (`pa`). Os dois totais ficam sempre separados e nunca somados num número só.
- **CA-8:** Nenhum valor a apropriar, suspenso, inapropriável ou prescrito é somado ao apropriado. Nenhuma tela usa "disponível", "pode usar" ou equivalente para valor a apropriar; para o apropriado, o rótulo segue a decisão de P-4.
- **CA-9:** O painel diz, na tela de saldo, que mostra só CBS e que o IBS não está na fonte de dados.

### Origem (comum)

- **CA-10:** Uma lista dos créditos mostra, por nota: período (`pa`), tipo de documento (nome da tabela oficial), chave, data de emissão, origem (nome da tabela oficial), fornecedor (CA-12), apurado, a apropriar e apropriado. A lista pode ser filtrada por período e por "só com valor a apropriar".
- **CA-11:** O detalhe de uma nota mostra todos os campos do crédito com o nome oficial (inclusive `suspenso`, `inapropriavel`, `prescrito`, `excedente`, `utilizado`, `restabelecido`, `inutilizavel`, `saldoCredor` e `pedidoRessarcimento`, quando vierem), as datas de registro e atualização, e os itens de recolhimento ligados à nota pela chave (`chaveDFE` igual à `chave`): data de arrecadação, número do DARF, período, vencimento, fornecedor, principal, multa, juros e total.
- **CA-12:** O fornecedor aparece só quando identificado pela regra decidida em P-3; nos demais casos, a nota mostra "fornecedor não identificado". O painel nunca deduz fornecedor por semelhança, nome ou valor.
- **CA-13:** Notas com origem diferente de normal (devolução, cancelamento, perecimento, nota de crédito) aparecem destacadas com o nome da origem e entram nos totais conforme a decisão de P-5.

### Pendências (comum)

- **CA-14:** Uma visão de pendências lista as notas com valor a apropriar maior que zero, agrupadas por fornecedor (com um grupo "fornecedor não identificado"), com a quantidade de notas e o total a apropriar de cada grupo, do maior para o menor. A soma dos grupos é igual ao total a apropriar do CA-7.
- **CA-15:** A visão de pendências não afirma o motivo da pendência. O texto diz que a Receita informa o valor a apropriar sem dizer o motivo, e não diz que o fornecedor deixou de recolher.

### Valores, dados e segurança (comum)

- **CA-16:** Valores monetários são lidos e somados em decimal exato, sem ponto flutuante; cada total é igual, centavo a centavo, à soma dos itens que o compõem; a exibição é em reais no padrão brasileiro (R$ 1.234,56, negativos com sinal).
- **CA-17:** A aplicação traz um conjunto versionado de arquivos fictícios, válidos contra os schemas oficiais, que permite demonstrar todos os CA: vários períodos; notas só a apropriar, só apropriadas e mistas; tipos de documento diferentes; origens diferentes de normal; o mesmo crédito em dois arquivos com valores diferentes; recolhimentos com e sem `chaveDFE`; nota com e sem fornecedor identificado; um arquivo inválido; um arquivo vazio. Chaves, NIs e números de DARF são fictícios e não correspondem a documento ou CNPJ válido; valores são inventados.
- **CA-18:** O lugar onde ficam arquivos reais é ignorado pelo git. Nenhum teste, exemplo ou documento usa dado real.
- **CA-19:** O painel não chama a API da Receita, não pede, não lê e não guarda credencial, e não lê o `.env` da `app/apuracao-cbs`.

### Aplicação (comum)

- **CA-20:** O painel é uma aplicação nova em `app/<nome>` (nome definido na Spec), com README que explica o que faz, o que não faz, como rodar com os fictícios e como apontar para os arquivos reais.
- **CA-21:** A demanda define os comandos de teste, lint e build da aplicação e os registra no `AGENTS.md` (regra de testes e seção "Comandos"), no `PROJECT_CONTEXT.md` (§2, §4 e §7) e em `.claude/fluxo.json` (`apps`).
- **CA-22:** Os testes automatizados cobrem os CA-1 a CA-19 a partir dos arquivos fictícios, sem rede e sem `.env`; teste, lint e build passam.

### Só se a escolha for A (web local, sem login)

- **CA-A1:** Um comando documentado sobe o painel na máquina do responsável e ele abre no navegador num endereço local. O painel só aceita conexão da própria máquina e não tem login.
- **CA-A2:** A pasta de arquivos é configurável. Sem configuração, o painel usa os fictícios versionados; apontar para os arquivos reais (por exemplo, `app/apuracao-cbs/.local/arquivos/`) é só configuração, sem copiar nem alterar os arquivos. Recarregar a página reflete arquivos novos na pasta.
- **CA-A3:** O painel só lê: não grava, move nem apaga nada na pasta de arquivos.

### Só se a escolha for B (backend, banco e login)

- **CA-B1:** Sem sessão válida, nenhuma tela nem rota devolve dado. O acesso é por email e senha; a senha é guardada só como hash; a sessão expira; não há cadastro aberto (o usuário é criado por comando documentado). Credenciais de teste são fictícias e nunca versionadas.
- **CA-B2:** O usuário importa arquivos pelo painel. Cada arquivo passa pela validação do CA-2; o mesmo arquivo importado de novo (mesmo `tiqueteSolicitacao`) não duplica nada; o painel mostra os arquivos importados com data e resultado.
- **CA-B3:** O banco é criado e atualizado por migrações versionadas; valores monetários ficam em tipo decimal de precisão fixa; os testes usam um banco descartável, sem dado real.
- **CA-B4:** A aplicação roda localmente com um comando documentado (banco incluído). Hospedagem fica fora desta demanda (P-1b).

## Fora de escopo

- Vários clientes ou vários CNPJs; acesso de contador à carteira.
- Chamar a API da Receita a partir do painel, agendar consultas ou rodar `npm run consulta`.
- IBS; tributos antigos.
- Débitos e pagamentos no painel (salvo decisão em contrário em P-6).
- Saldo líquido (crédito menos débito), projeção de caixa, compensação, antecipação e geração de guia (RAD, PCONT).
- Explicar o motivo da pendência ou afirmar que o fornecedor não recolheu.
- Hospedagem, domínio, publicação, CI.
- Atualizar o design system para o tema escuro (item próprio do backlog).
- Alterar a `app/apuracao-cbs`, salvo o mínimo para reaproveitar código, se a Spec justificar.

## Perguntas em aberto

As respostas de domínio (P-2 a P-5) são registradas em `docs/produto/hipoteses.md`.

- **P-1 (bloqueante): forma do painel.** A ou B, conforme a tabela acima. Recomendação: A, pelos motivos da seção "Forma do painel".
  - **P-1b (só se B):** onde roda? Recomendação: só local nesta demanda; hospedagem com dado fiscal é decisão própria (custo, LGPD, segredos).
- **P-2: identidade do crédito entre arquivos.** Nenhuma fonte diz o que identifica um crédito de um arquivo para o outro, nem se uma versão nova substitui a anterior. Recomendação: o crédito é identificado por período, chave, tipo de documento e origem; vale a versão com `atualizacao` mais recente e, no empate, a do arquivo com `geradoEm` mais recente. Registrar como hipótese a conferir no primeiro arquivo real com dados.
- **P-3: de onde vem o fornecedor.** A referência cita duas fontes: `niFornecedor` dos recolhimentos (só para notas com recolhimento pelo adquirente e `chaveDFE` preenchida; o serviço respondeu 404 em 2026-11-24) e a chave da nota (o leiaute da chave não está em `docs/referencias/`). Recomendação: usar `niFornecedor` quando houver recolhimento com a mesma chave; usar a chave só para os modelos de chave de 44 dígitos (NF-e, NFC-e, CT-e) e só se a Spec registrar a fonte oficial do leiaute em `docs/referencias/`; nos demais casos, "fornecedor não identificado". Sem a extração pela chave, a visão de pendências por fornecedor terá, na prática, quase tudo em "não identificado".
- **P-4: o que pode ser chamado de disponível.** A referência diz que `apropriado` "já pode ser utilizado", mas o schema traz dentro da apropriação a `utilizacao` (`utilizado`, `saldoCredor`): parte do apropriado pode já ter sido usada. Recomendação: nesta versão, nenhum valor recebe o rótulo "disponível"; o total principal é "Apropriado (confirmado pela Receita)" e `saldoCredor` aparece no detalhe da nota com o nome oficial, até um tributarista dizer qual valor é o saldo utilizável.
- **P-5: origens diferentes de normal e sinal dos valores.** Não há fonte sobre como devolução, cancelamento ou perecimento afetam o saldo, nem se os valores dessas linhas vêm negativos (o schema não impõe mínimo). Recomendação: somar os valores como vêm, sem inverter sinal, destacar a origem na lista e registrar como hipótese a validar com tributarista e com o primeiro arquivo real.
- **P-6: débitos no painel.** O arquivo de débitos funciona e traz `saldoDevedor`, mas "saldo = crédito menos débito" envolve regra de compensação sem fonte. Recomendação: fora desta versão; se o responsável quiser, um bloco separado com os totais de débitos, sem subtrair do crédito.
- **P-7: formato do `ni` no arquivo real.** A referência registra `ni` com 14 dígitos no arquivo real de 2026-11-24, mas os quatro schemas exigem 8 dígitos e o arquivo foi dado como válido: uma das duas anotações está errada. Recomendação: o responsável confere no arquivo guardado quantos dígitos tem o `ni` (sem colar o valor) e a referência é corrigida; o painel compara empresas pelos 8 primeiros dígitos, o que serve aos dois casos.
- **P-8: aparência.** O design system documentado é o tema claro antigo; a landing usa o tema escuro do redesign. Recomendação: seguir os tokens do tema escuro da landing, com foco em tela de computador; não bloqueia a Spec.
