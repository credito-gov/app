# 033-dashboard-indicadores — Spec

- **Status:** spec-em-revisão
- **US:** [`us.md`](us.md), aprovada em 2026-11-25 com as recomendações de P-1 a P-9
- **Base:** [`../../arquitetura/README.md`](../../arquitetura/README.md) (AD-1 a AD-14), [`../../design/design-system.md`](../../design/design-system.md) e a Spec aprovada da demanda 034 (login), que está no worktree `.claude/worktrees/034-login` e ainda não tem código na `main`

## Critérios de aceite atendidos

Todos os CA da US: CA-1 a CA-26 e CA-C1 a CA-C4. A carteira do contador entra nesta entrega (decisão de P-6, abaixo). Nenhum CA fica adiado.

Dois CA só são **demonstrados com dados fictícios** até existir o coletor (ver "Dependências"), porque nada grava consultas reais antes dele:

- CA-16, na parte "consulta em andamento";
- CA-19, na parte da credencial recusada.

A regra de tela de cada um fica pronta e testada nesta demanda.

## Abordagem

O dashboard é construído sobre o que a demanda 034 deixa pronto: `app/backend` (Fastify, Kysely, PostgreSQL com segurança por linha) e `app/web` (React 19, Vite, `react-router`), com a sessão, a empresa em foco no caminho da URL e o auxiliar `rotaDeEmpresa`. A 033 acrescenta três coisas.

1. **O lado de leitura dos dados fiscais no banco.** A migração `0002` cria `consulta`, `arquivo_bruto`, `credito_lido` e `debito_lido`, os nomes do modelo conceitual da AD-6, só com as colunas de que o dashboard precisa. É o contrato que o coletor vai preencher. A 033 traz também o módulo de **leitura**, a cópia revisada do leitor do `app/painel` prevista na AD-14: validação pelo schema oficial com a tolerância única do `ni` (D-2), conferência da empresa pela raiz, decimal sem perda e gravação das notas. O coletor, quando existir, chama a mesma função depois do download.
2. **Os indicadores, calculados em funções puras.** A consolidação de versões (D-5), o emitente pela chave (D-4) e as somas em `big.js` ficam em módulos sem banco nem rede, testados à parte. A API carrega as linhas da empresa fixada na transação, chama essas funções e devolve os valores como texto decimal (AD-13).
3. **As telas.** O dashboard substitui a página inicial provisória da 034 em `/e/:empresaId`. Há ainda a lista completa de emitentes com valor a apropriar, a lista das notas de um grupo (P-8) e a carteira, que substitui a lista simples de `/empresas`. A busca de dados usa cache por empresa e recorte (AD-3), sem estado global.

Para os dados existirem sem coletor e sem a Receita, um comando local (`npm run admin -- carregar-cenario`) monta retornos fictícios, no formato oficial e com a forma observada nos arquivos reais, e os passa pela mesma leitura. Ele grava as consultas no estado de cada cenário (sem consulta, em andamento, vazia, com falha, desatualizada, com retorno recusado). Os testes usam o mesmo gerador. Nenhum teste lê `.env`, usa rede externa ou dado real.

As decisões de domínio continuam as da US: os totais ficam separados e nunca são derivados uns dos outros (D-3); o emitente sai só da chave (D-4); cada nota conta uma vez (D-5); origens diferentes de normal entram como vêm (D-6). Nenhuma regra de CBS/IBS nova entra nesta Spec.

## Decisão sobre P-6: a carteira do contador entra nesta entrega

**Decisão:** CA-C1 a CA-C4 são implementados nesta demanda.

**Motivos:**

- **O bloqueio citado em P-6 não pesa mais sobre a carteira.** A P-6 condicionava a visão do contador a duas coisas: o acesso de um software em nome de vários contribuintes (H1) e o papel do contador no sistema. A primeira foi tratada pela 031: o cenário A é a base (cada empresa informa a própria credencial, AD-11), e o contador não precisa de credencial de procurador para ver a carteira. A segunda foi resolvida pela 034: o contador é um usuário com vínculo próprio em cada empresa que o convidou (CA-29 e D-2 da US da 034), e a API já fixa o conjunto de empresas do usuário na transação (`naCarteira`).
- **A carteira não depende do cenário B.** O B mudaria só a forma da coleta, não o que a carteira mostra.
- **O desenho existe.** A 032 aprovou a tela "Carteira do contador".
- **O custo é pequeno.** A carteira usa o mesmo cálculo de I-2, I-3, I-4 e I-10 do dashboard, aplicado a cada empresa.
- **Não há regra tributária envolvida.**

**Quem vê a carteira.** Todo usuário com vínculo ativo em mais de uma empresa, qualquer que seja o papel. A 034 decidiu que titular, contador e colaborador veem os mesmos dados (CA-29 dela). Restringir a carteira ao papel `contador` seria regra nova. Isso fica registrado como DT-9, e a pergunta P-S5 confirma.

**Risco aceito:** com muitas empresas, a carteira lê todas as notas de todas elas (ver R-2). As tasks da carteira ficam por último, para que possam virar demanda própria sem mexer no resto, se a revisão pedir.

## Dependências

### Da demanda 034 (login), que precisa estar na `main` antes da primeira task de código desta

A 033 **assume** que estes itens existem como a Spec aprovada da 034 os descreve. Se as Tasks ou a revisão da 034 mudarem algum deles, esta Spec é ajustada antes da implementação.

| Item da 034 | O que a 033 usa |
|---|---|
| `app/backend` com Fastify, Kysely, `compose.yaml`, papéis `creditogov_migracao` e `creditogov_app`, `npm run migrar` e a migração `0001` | A migração `0002` desta demanda vem depois da `0001` e usa as tabelas `empresa` e `vinculo_empresa` e as funções `app_empresas()` e `app_usuario()` |
| `src/banco/transacao.ts`: `naEmpresa`, `naCarteira` e a fixação direta da empresa usada pelo `admin` (DT-7 da 034) | Toda leitura de dado fiscal passa por elas. Se a 034 não exportar a fixação sem usuário, a 033 acrescenta `naEmpresaInterna(empresaId, fn)` no mesmo arquivo (ver "Banco") |
| `rotaDeEmpresa`, com `request.naEmpresa(fn)` e `request.naCarteira(fn)` | As rotas `/api/empresas/:empresaId/painel`, `/pendencias` e `/api/carteira` |
| `GET /api/sessao`, `GET /api/empresas` e `GET /api/empresas/:empresaId` | A carteira parte da lista de empresas, e o dashboard parte da empresa em foco |
| Relógio injetável, configuração em código nos testes, logger com redação | Cálculo de "dias sem consulta" e testes com relógio falso |
| `npm run admin` (`criar-empresa`, `convidar`) | O comando `carregar-cenario` entra no mesmo `admin` |
| Banco de teste (`globalSetup`, limpeza com o papel de migração) e o teste de catálogo de CA-37 da 034 | As quatro tabelas novas entram sozinhas no teste de catálogo, porque têm `empresa_id` |
| `app/web`: `LayoutEmpresa`, `BarraTopo`, `TrocaEmpresa`, `useEmpresaEmFoco()`, `api/cliente.ts` (com `sem_conexao` e `sessao_expirada`), `ProvedorSessao`, `tokens.css` e `bundle.css` copiados, rotas `/`, `/empresas` e `/e/:empresaId` | O dashboard troca a página `Inicio` e a lista de `/empresas`, e acrescenta itens ao menu |
| Comandos de teste do `app/backend` e do `app/web` registrados no `AGENTS.md` pela 034 | A 033 usa os mesmos comandos. Não é a primeira demanda dessas aplicações e não registra comando de teste novo |

**Fica bloqueado até a 034 estar na `main`:** toda task de código desta demanda. As tasks podem ser escritas e aprovadas antes. A implementação começa depois do merge da 034 nesta branch.

### Da arquitetura (031) que ainda não tem código

| Peça da 031 | Situação | O que a 033 assume | O que fica bloqueado até ela existir |
|---|---|---|---|
| **Coletor** (AD-9): abre as consultas na Receita, acompanha a situação, baixa o arquivo e chama a leitura | Sem demanda aberta | Ele grava em `consulta` os estados da AD-9 e, para cada consulta `lida`, chama `registrarLeitura` (seção "Leitura") com o conteúdo baixado. A coluna de horário `concluida_em` é o instante em que a Receita informou `CONCLUIDA`. A demanda do coletor pode acrescentar colunas (tíquete, credencial, erro técnico), mas não muda o sentido das colunas desta Spec sem ajustar o dashboard | Dados reais no dashboard. Fora do ambiente local, toda empresa mostra o estado de CA-16 ("ainda não consultados") |
| **Armazenamento de objetos imutável** (AD-8) | Sem demanda | `arquivo_bruto` guarda os metadados (hash, tamanho, `geradoEm`, situação da leitura). A coluna `objeto` (endereço no armazenamento) fica nula nesta demanda | Guarda do arquivo bruto e reconstrução da leitura a partir dele (comando de releitura) |
| **Credencial da Receita** (AD-10) e o cadastro dela | Sem demanda | Nada. O dashboard só lê o estado `credencial_invalida` da consulta | O texto de CA-19 para credencial recusada aponta para a equipe CreditoGov, porque não há tela de cadastro de credencial. Quando ela existir, o texto passa a apontar para a tela (DT-7) |
| **Alertas** da seção 5 da arquitetura (2, 3 e 5 dias) | Sem demanda | Nada: o aviso de CA-15 é só na tela | Avisos por e-mail (fora de escopo na US) |
| **Hospedagem** (AD-7, PD-1) | Provedor pendente | Tudo roda local | Deploy |

## Mudanças por camada

### Banco (`app/backend/src/banco`)

#### Migração `0002_dados_fiscais` (CA-14 a CA-20, CA-24, CA-26)

Mesmo padrão da `0001` da 034: Kysely `Migrator`, papel de migração, `uuid` com `gen_random_uuid()`, `timestamptz`, `CHECK` nos domínios. Tem `down`, que apaga as quatro tabelas.

| Tabela | Colunas | Observações | CA |
|---|---|---|---|
| `consulta` | `id`, `empresa_id`, `servico` (`creditos`, `debitos`, `recolhimentos`, `pagamentos`), `estado` (os da AD-9: `agendada`, `abrindo`, `aberta`, `concluida`, `baixada`, `lida`, `erro`, `expirada`, `credencial_invalida`, `servico_indisponivel`, `aberta_sem_tiquete`), `criada_em`, `concluida_em` (nulo), `finalizada_em` (nulo) | `CHECK`: `lida` exige `concluida_em` e `finalizada_em`; os estados de erro exigem `finalizada_em`. `UNIQUE (id, empresa_id)`, para a chave estrangeira composta. Índice `(empresa_id, servico, criada_em DESC)` | CA-14 a CA-19 |
| `arquivo_bruto` | `id`, `empresa_id`, `consulta_id` (`UNIQUE`), `servico`, `recebido_em`, `tamanho`, `sha256` (`char(64)`), `gerado_em` (texto como veio, nulo se ilegível), `versao_schema` (nulo), `situacao` (`aceito`, `aceito_com_divergencia`, `recusado`), `motivo_recusa` (nulo; `ilegivel`, `fora_do_schema`, `outra_empresa`, `valor_fora_do_limite`), `versao_leitor`, `objeto` (nulo nesta demanda) | Chave estrangeira composta `(consulta_id, empresa_id)` → `consulta (id, empresa_id)`: um arquivo nunca aponta para consulta de outra empresa. `CHECK`: `motivo_recusa` preenchido se e só se `situacao = 'recusado'`. Sem detalhe técnico da recusa: a mensagem do validador pode conter valores do arquivo (seção 8 da arquitetura) | CA-20 |
| `credito_lido` | `id`, `empresa_id`, `arquivo_id`, `pa` (`char(7)`, `MM/AAAA` como veio), `chave`, `documento` (`smallint`), `origem` (`smallint`), `emissao`, `registro` e `atualizacao` (texto como veio), e um `numeric(20,2)` nulo por campo de valor: `apurado`, `a_apropriar`, `apropriado`, `suspenso`, `inapropriavel`, `prescrito`, `utilizado`, `restabelecido`, `inutilizavel`, `saldo_credor`, `pedido_ressarcimento`, `excedente` | Nulo quer dizer "não veio no arquivo" e vale zero na soma (CA-23). Uma linha por nota de cada arquivo aceito: as versões repetidas ficam todas, e a consolidação é na leitura (D-5). Chave estrangeira composta `(arquivo_id, empresa_id)` → `arquivo_bruto` | CA-1, CA-3, CA-23 a CA-25 |
| `debito_lido` | Como `credito_lido`, com `apurado`, `extinto`, `saldo_devedor`, `suspenso`, `inexigivel`, `pgto_antecipado` e `excedente` | | CA-13 |

- **Segurança por linha:** `ENABLE` e `FORCE ROW LEVEL SECURITY` nas quatro tabelas, com a regra `empresa_id = ANY(app_empresas())` em `USING` e `WITH CHECK`. O teste de catálogo da 034 (CA-37 dela) passa a cobri-las sozinho.
- **Permissões do `creditogov_app`:** só `SELECT` e `INSERT` nas quatro tabelas. `UPDATE` em `consulta` fica para a demanda do coletor, que muda estados. Não há `DELETE`: o carregador de cenários recusa empresa que já tem consulta (ver "Cenários fictícios").
- **Por que `numeric(20,2)`:** cabe qualquer valor de até 18 dígitos inteiros com 2 casas, e os valores observados têm de 0 a 2 casas (O-13). Valor maior ou com mais casas recusa o arquivo inteiro (`valor_fora_do_limite` ou `fora_do_schema`), em vez de arredondar.

#### Transação sem usuário para o `admin` e o futuro coletor

Se a 034 já exportar uma função que fixa uma empresa por `id` sem usuário (a do `admin`), a 033 a usa. Se não, a 033 acrescenta `naEmpresaInterna(empresaId, fn)` em `transacao.ts`: fixa `app.empresas = {empresaId}` com `set_config(..., true)` e não fixa usuário. Um teste confirma que nenhum módulo de `src/api/` a importa: só `src/admin/` e, no futuro, o coletor.

### Leitura (`app/backend/src/leitura`, nova; AD-14)

Cópia revisada de `app/painel/src/nucleo/` (`json.ts`, `validacao.ts`, `dinheiro.ts`, `datas.ts`, `tabelas.ts`, `empresa.ts`) e de `app/painel/schemas/oficiais/` (os quatro schemas e o `versoes.json`, sem alteração nenhuma nos arquivos). Cada arquivo copiado traz no topo a origem e o commit. A interface de pasta, o cache por nome de arquivo e o servidor HTML do painel não são copiados.

**Função `registrarLeitura(tx, { consultaId, servico, conteudo, recebidoEm, objeto? })`**, chamada dentro de uma transação com a empresa fixada:

1. Calcula o `sha256` e o tamanho do conteúdo.
2. Lê o JSON sem perda (`lossless-json`). Se não conseguir ler, a situação é `recusado` com o motivo `ilegivel`.
3. Valida contra o schema oficial do serviço, com a tolerância única do `ni` de 14 dígitos (D-2), como no painel. Qualquer outra divergência dá `recusado` com o motivo `fora_do_schema`.
4. **Múltiplo de 0,01 sem ponto flutuante** (AD-13, ponto de atenção herdado do painel). Ao carregar o schema, a validação de `multipleOf` sai do `ajv`, só em memória, e passa a ser feita sobre o texto de cada valor monetário com `big.js` (`valor × 100` tem de ser inteiro). O resultado é o mesmo do schema, sem o limite do `multipleOfPrecision`. Valor que não cabe em `numeric(20,2)` dá `recusado` com `valor_fora_do_limite`.
5. Confere a empresa: a raiz do `ni` (8 primeiros dígitos) tem de ser igual à `cnpj_raiz` da empresa fixada. Se não for, dá `recusado` com `outra_empresa` (CA-20). Notas de outros estabelecimentos da mesma raiz são da mesma empresa (CA-24, O-24).
6. Grava a linha de `arquivo_bruto`. Se o arquivo foi aceito, grava também as notas em `credito_lido` ou `debito_lido`, em lotes de 500, com os valores como texto decimal. Campo ausente fica nulo.
7. Registra no log só o `consultaId`, a situação, o motivo e a quantidade de notas. Nunca valor, chave, CNPJ ou trecho do arquivo (seção 8 da arquitetura).

A função não muda o estado da consulta: isso é do coletor, ou do carregador de cenários nesta demanda. `versao_leitor` é uma constante (`"033.1"`), gravada no arquivo e nas notas (AD-8).

### Indicadores (`app/backend/src/indicadores`, novo, funções puras)

Nenhum módulo daqui importa banco, Fastify ou `process.env`. Valores em `big.js`, saída em texto com duas casas (`"1234.50"`).

#### Consolidação (CA-24, D-5)

Cópia da regra do painel. A identidade de uma nota é (`pa`, `chave`, `documento`, `origem`). Entre as versões da mesma identidade, vence:

1. a de `atualizacao` mais recente, comparada como instante, com qualquer quantidade de casas de fração (O-15);
2. no empate, a do arquivo com `gerado_em` mais recente;
3. no empate, a do arquivo com `recebido_em` mais recente;
4. persistindo o empate, a do `arquivo_id` maior.

O último critério substitui o "nome de arquivo" do painel, que não existe aqui. Só entram arquivos `aceito` e `aceito_com_divergencia`. A mesma função serve a créditos e débitos.

#### Emitente (CA-6 a CA-8, D-4)

Cópia de `lerChave` do painel, **sem o recolhimento**: a API de recolhimentos responde 404, e CA-7 manda usar só a chave. Mantém tudo o que o painel faz:

- só os documentos 55, 57, 62 e 65;
- a chave de 44 posições no leiaute;
- o modelo das posições 21–22 igual ao documento;
- o dígito verificador;
- as exceções de série registradas em [`../../referencias/documentos-fiscais/`](../../referencias/documentos-fiscais/README.md): nota avulsa (série 890 a 899), série de emitente CPF, NFC-e com série 890 ou acima e CT-e com emitente começando em `000`.

O resultado é um de quatro grupos:

| Grupo | Quando | Identificador do grupo |
|---|---|---|
| Emitente | CNPJ lido da chave, com raiz diferente da empresa | os 14 caracteres do CNPJ |
| Emitida pela própria empresa | CNPJ lido da chave com a mesma raiz da empresa (CA-8) | `propria-empresa` |
| Emitente não identificado | Qualquer outra nota: documento 91 e os demais sem leiaute, chave fora do leiaute, exceções (CA-7) | `nao-identificado` |
| Emitente CPF | NF-e de série 910 ou acima com CPF na chave, como no painel | o CPF. **Depende de P-S1**: se a resposta for não, essas notas vão para "emitente não identificado" |

O emitente é calculado na hora da consulta, a partir da chave guardada, e não é gravado. Assim, uma mudança na regra vale na hora, sem regravar notas. Nunca há nome, razão social ou dedução por semelhança (CA-6, CA-7).

#### Situação de cada serviço (CA-14 a CA-20)

`situacaoDoServico(consultas, arquivos, notasConsolidadas, agora)` devolve, para créditos e para débitos:

- **`ultimaConcluidaEm`**: o maior `concluida_em` entre as consultas `lida`. Uma consulta lida com arquivo recusado também conta: o retorno foi recebido, só não entrou nos números (o aviso de CA-20 cuida disso);
- **`emAndamento`**: se há consulta em `abrindo`, `aberta`, `concluida` ou `baixada`;
- **`falha`**: se a consulta mais recente entre as finalizadas (`lida` ou estado de erro, pela `criada_em`) terminou em erro. Traz o horário (`finalizada_em`) e o tipo: `credencial` para `credencial_invalida`, `outra` para `erro`, `expirada`, `servico_indisponivel` e `aberta_sem_tiquete`;
- **`diasSemConsulta`** e **`desatualizado`**: dias inteiros desde `ultimaConcluidaEm`, e se passaram mais de 8 × 24 horas (CA-15, P-9);
- **`atualizacao`**: a menor e a maior data de `atualizacao` entre as notas consolidadas de todos os períodos (CA-14), com a data como veio no arquivo;
- **`recusados`**: a quantidade de arquivos `recusado` do serviço e o `recebido_em` do mais recente (CA-20);
- **`estado`** do bloco:

| Estado | Quando | CA |
|---|---|---|
| `sem_consulta` | Nenhuma consulta lida | CA-16 |
| `sem_dados_usaveis` | Há consulta lida, nenhuma nota consolidada e algum arquivo recusado | CA-20 |
| `vazio` | Há consulta lida, nenhuma nota consolidada e nenhum arquivo recusado | CA-17 |
| `com_dados` | Há nota consolidada | CA-1 em diante |

`falha`, `desatualizado` e `recusados` se somam a qualquer estado, e cada bloco mostra o seu (CA-18). Consultas de `recolhimentos` e `pagamentos` não entram em nada (CA-21).

#### Créditos no recorte (CA-1 a CA-12, CA-23, CA-25)

`indicadoresDeCredito(notas, raizEmpresa, recorte)`, sobre as notas consolidadas do recorte (todas, ou só as do `pa` escolhido):

- **Totais** I-1 a I-5: a soma de cada campo, com ausente valendo zero. Nenhum total é derivado de outro (CA-1, CA-2).
- **Outros valores** (I-6): para `suspenso`, `inapropriavel`, `prescrito`, `restabelecido`, `inutilizavel` e `pedidoRessarcimento` (e `excedente`, se P-S2 confirmar), a soma de cada um. Só entram na resposta os campos com soma diferente de zero (CA-3).
- **Contagens:** a quantidade de notas e a quantidade com `aApropriar` maior que zero (CA-5).
- **Pendentes** (I-7):
  - as notas com `aApropriar` maior que zero, agrupadas pelo emitente;
  - para cada grupo, a quantidade e o total, com os emitentes em ordem do maior para o menor total e, no empate, pelo identificador;
  - os grupos "não identificado", "própria empresa" e, se existirem, "notas com valor a apropriar negativo" ficam à parte da ordem;
  - o percentual de I-2 que está em "não identificado", com uma casa e meio para cima, só quando I-2 for maior que zero (CA-9);
  - com o limite `EMITENTES_NO_BLOCO` (P-S3), os primeiros emitentes vão no bloco e o resto vira "demais emitentes", com a quantidade de emitentes, a quantidade de notas e a soma (CA-10).
- **A soma fecha com I-2** (CA-9). Emitentes, demais, não identificado, própria empresa e negativos somam exatamente I-2. Para isso, as notas com `aApropriar` **negativo** (possíveis em origens diferentes de normal, que nunca vieram, D-6) entram numa linha "Notas com valor a apropriar negativo", mostrada só quando existe. É o que a DT-9 da 030 fazia. Sem essa linha, CA-6 (só valores maiores que zero) e CA-9 (soma igual a I-2) se contradiriam. Um teste confere a igualdade em todos os cenários.
- **Por período** (I-8): os totais I-1 a I-5 de cada `pa` com nota no recorte, em ordem cronológica (ano, depois mês). A soma de cada coluna é igual ao total geral (CA-11).
- **Origens** (CA-25): para cada `origem` diferente de 0 no recorte, o código, o nome da tabela oficial (`tabelas.ts`, decisão F-2 da 030) e a quantidade de notas. Os valores entram nos totais como vieram, sem inverter sinal (D-6).

#### Débitos no recorte (CA-13, CA-25)

`indicadoresDeDebito(notas, recorte)`: a quantidade de notas, as somas de `apurado`, `extinto` e `saldoDevedor` e as origens diferentes de normal. Nenhuma função compara ou combina débito com crédito.

#### Carteira (CA-C1, CA-C2, CA-C4)

`linhaDaCarteira(empresa, dadosDaEmpresa, agora)` traz I-2, I-3 e I-4 de todos os períodos e um **resumo da situação** que junta créditos e débitos (DT-8):

- a prioridade é `falhou`, depois `sem_consulta`, depois `desatualizado`, depois `atualizado`;
- a data é a mais antiga das duas últimas consultas concluídas;
- sem nenhuma consulta concluída num dos serviços, a data é nula.

Os valores só aparecem com créditos em `com_dados`. Nos outros estados, a linha leva o estado no lugar dos valores. Não existe função que some valores de empresas diferentes (CA-C4).

### API (`app/backend/src/api`)

Rotas novas, todas com a sessão da 034, o `rotaDeEmpresa` e respostas em JSON. Detalhes em "Contratos".

| Rota | Transação | CA |
|---|---|---|
| `GET /api/empresas/:empresaId/painel?periodo=AAAA-MM` | `request.naEmpresa` | CA-1 a CA-25 |
| `GET /api/empresas/:empresaId/pendencias?periodo=` | `request.naEmpresa` | CA-9, CA-10 |
| `GET /api/empresas/:empresaId/pendencias/:grupo/notas?periodo=&pagina=` | `request.naEmpresa` | CA-10, P-8 |
| `GET /api/carteira` | `request.naCarteira` | CA-C1 a CA-C4 |

- **Leitura do banco** (`src/paineis/dados.ts`): `consulta` dos serviços `creditos` e `debitos`, `arquivo_bruto` e as notas dos arquivos aceitos, sempre dentro da transação recebida. Os valores `numeric` chegam como texto (CA-38 da 034).
- **Recorte:** sem `periodo`, todos os períodos coletados (P-7). Com `periodo`, só esse `pa`. Um `periodo` fora do formato `AAAA-MM` dá `400 periodo_invalido`. Um período válido sem nota em um dos serviços dá, nesse bloco, `semNotasNoRecorte: true`, nunca zero (CA-12, CA-18).
- **Relógio:** `agora` vem do relógio injetável da API (CA-15).
- **Log:** só os identificadores (`usuarioId`, `empresaId`) e a duração. Nenhum valor, CNPJ ou chave.
- `Cache-Control: no-store`, como as outras rotas de `/api` da 034.

### Cenários fictícios (`app/backend/src/ficticios` e `src/admin`)

**Gerador** (`src/ficticios/gerador.ts`, determinístico e com relógio recebido). Monta retornos no formato oficial (`tiqueteSolicitacao`, `ni` com 14 dígitos, como nos arquivos reais, `niConsumidor`, `geradoEm`, `apuracao`), com a raiz da empresa recebida e números escritos como texto JSON com 0 a 2 casas. O cenário de volume imita a forma observada (O-3 a O-16, O-18 a O-25), sem nenhum dado real:

- cerca de 900 créditos em 9 períodos, quase todos num só;
- documentos 55, 57, 62, 65 e 91 (perto de 15% de 91, com chave de 50 posições);
- cerca de 99% com valor a apropriar, e o apropriado igual ao utilizado;
- `saldoCredor` presente e zero;
- uma nota emitida pela própria empresa;
- débitos em 3 períodos;
- campo zerado ausente.

Os CNPJs dos emitentes são fictícios, com dígito verificador do CNPJ propositalmente errado, como nos fictícios da 030. O dígito da **chave** é calculado certo, para a leitura identificar o emitente.

**Comando** `npm run admin -- carregar-cenario --empresa <id> --cenario <nome>`:

- só roda com `CREDITOGOV_AMBIENTE=local`, senão para com mensagem;
- recusa empresa que já tem consulta;
- grava as consultas no estado do cenário e passa cada retorno por `registrarLeitura`, dentro de `naEmpresaInterna`;
- não há comando que importe arquivo do disco. Assim, o caminho para um arquivo real entrar no banco local não existe (CA-26).

| Cenário | O que grava | Estado que mostra |
|---|---|---|
| `completo` | Créditos e débitos de volume, em duas consultas por serviço, a segunda com versões novas de algumas notas (D-5) e concluída ontem | CA-1 a CA-14 |
| `sem-consulta` | Nada | CA-16 |
| `em-andamento` | Uma consulta de créditos em `aberta` e nenhuma concluída | CA-16, em andamento |
| `vazio` | Consultas lidas com `apuracao` vazia nos dois serviços | CA-17 |
| `parcial` | Créditos com dados; débitos só com uma consulta em `erro` | CA-18, CA-19 |
| `falha-com-anteriores` | Dados de 3 dias atrás; a última tentativa de créditos em `credencial_invalida`, hoje | CA-19 |
| `desatualizado` | Última consulta concluída há 9 dias nos dois serviços | CA-15 |
| `recusado` | Dados aceitos, mais um retorno de outra raiz e um fora do schema | CA-20 |
| `outros-valores` | Notas com `suspenso`, `prescrito` e `pedidoRessarcimento` diferentes de zero, origens 20 e 30, e uma nota com `aApropriar` negativo | CA-3, CA-9, CA-25 |

O mesmo gerador alimenta os testes.

### Web (`app/web/src`)

#### Rotas e menu

| Rota | Tela | Substitui (034) | CA |
|---|---|---|---|
| `/e/:empresaId?periodo=AAAA-MM` | `VisaoGeral` (o dashboard) | `Inicio`, a página provisória | CA-1 a CA-25 |
| `/e/:empresaId/pendencias?periodo=` | `Pendencias`: todos os grupos de I-7, cada um levando às suas notas | — | CA-10 |
| `/e/:empresaId/pendencias/:grupo?periodo=&pagina=` | `NotasDoGrupo`: período, chave (`cg-key`), emissão, tipo de documento (nome oficial e código) e valor a apropriar, 100 por página (`cg-pager`), do maior para o menor valor | — | CA-10, P-8 |
| `/empresas` | `Carteira`, com a mensagem da 034 para quem não tem empresa | A lista de `EscolherEmpresa` | CA-C1 a CA-C4 |

- **Menu do topo** (`cg-topnav`): "Visão geral", "Pendências" e "Pessoas" (da 034). Os itens "Créditos", "Débitos" e "Consultas à Receita" do design ficam fora até existirem as telas (P-8). Não aparece item que leve a uma tela vazia. Recolhimentos e pagamentos não têm item (CA-21).
- O recorte fica na URL: o link de cada grupo e a troca de página preservam o `periodo`.

#### Busca de dados (AD-3, DT-5)

`@tanstack/react-query`:

- chaves `['painel', empresaId, periodo]`, `['pendencias', empresaId, periodo]`, `['notas', empresaId, grupo, periodo, pagina]` e `['carteira']`;
- `staleTime` de 5 minutos e sem nova busca ao voltar à aba, porque o dado muda uma vez por dia;
- `queryClient.clear()` ao sair da sessão e ao receber `401`, para os dados de uma pessoa não ficarem na memória da aba quando outra entrar;
- as chamadas passam pelo `api/cliente.ts` da 034; `sem_conexao` mostra o alerta "Sem conexão" com "Tentar de novo", como no login.

#### Valores e datas (CA-23)

- `src/formatacao/dinheiro.ts` formata o texto decimal da API (`"1234.50"`) como `R$ 1.234,50`, e o negativo como `-R$ 1.234,50`, **só por manipulação de texto**, sem `Number`, `parseFloat` nem aritmética. É a mesma regra de `formatarReais` do painel.
- `compararDecimal(a, b)`, também por texto, ordena a carteira por I-2.
- O percentual vem da API em texto (`"14.8"`) e é exibido como `14,8%`.
- Valor ausente por estado nunca é formatado: o componente `Dinheiro` só aceita texto decimal, e os estados sem dados usam `cg-money is-na` com o texto do estado (design 3.6).
- Horários de consulta: instantes da API exibidos como `DD/MM/AAAA às HH:MM` no fuso `America/Sao_Paulo`. As datas de `atualizacao` vêm como `AAAA-MM-DD`, do texto do arquivo, e são exibidas como `DD/MM/AAAA`.
- Período: `MM/AAAA` na tela.

#### Componentes (classes `cg-` da 032, só tema claro, como na 034)

| Componente | Conteúdo | CA |
|---|---|---|
| `SeletorRecorte` | `cg-select` com "Todos os períodos coletados" e cada `MM/AAAA` disponível, em ordem cronológica. Mostra o recorte atual no título da página | CA-12 |
| `SituacaoDados` | Para créditos e para débitos: a última consulta concluída e o intervalo de `atualizacao`, mais a frase fixa de CA-14. Os alertas de CA-15, CA-19 e CA-20 aparecem por serviço, no topo da página, enquanto durar a situação | CA-14, CA-15, CA-19, CA-20 |
| `CartaoApurado` | `cg-total is-xl` "Crédito apurado nas compras" (`apurado`), com a quantidade de notas e a frase de que os valores abaixo vêm de campos separados e não se somam | CA-1, CA-2, CA-5 |
| `CartaoTotal` × 4 | `cg-total`: rótulo, valor, nome oficial em `cg-total-field` e a nota do design 3.3. No "A apropriar (pendente)": cor `pending`, ícone de relógio, a nota de CA-4 e "N de M notas com valor a apropriar" | CA-1, CA-2, CA-4, CA-5 |
| `OutrosValores` | Só existe se a API mandar algum campo. Uma linha por campo, com rótulo, nome oficial e valor | CA-3 |
| `PendentePorEmitente` | `cg-table` com o CNPJ formatado (`AA.AAA.AAA/AAAA-DD`), a quantidade e o total, os maiores primeiro, e depois "Demais emitentes (N)", "Emitida pela própria empresa", "Emitente não identificado" (selo neutro com interrogação) e, se houver, "Notas com valor a apropriar negativo". Cada linha leva às notas do grupo; "Ver todos os emitentes" leva a `/pendencias`. Abaixo, a frase do percentual não identificado | CA-6 a CA-10 |
| `EvolucaoPorPeriodo` | `cg-table`: uma linha por período, colunas I-1 a I-5 com rótulo e nome oficial, mais a linha "Total" igual aos cartões | CA-11 |
| `BlocoDebitos` | `cg-card` "Débitos de CBS (vendas)" separado e abaixo dos créditos: "Débito apurado" (`apurado`), "Já extinto" (`extinto`), "Em aberto" (`saldoDevedor`), a quantidade de notas e a frase de saldo líquido | CA-13 |
| `AvisoOrigens` | `cg-inline-note` no bloco de créditos ou de débitos, se a API mandar origens | CA-25 |
| `AvisoSoCbs` | Aviso permanente no rodapé do conteúdo | CA-22 |
| `EstadoServico` | `cg-empty` no lugar dos números de um serviço em `sem_consulta`, `vazio` ou `sem_dados_usaveis`, ou em período sem nota | CA-16 a CA-18, CA-20 |
| `LinhaCarteira` | Nome e CNPJ raiz, A apropriar (pendente), Apropriado e Já utilizado (cada coluna com o nome oficial no cabeçalho), selo de situação (design 3.4) e data. A linha leva a `/e/:empresaId` | CA-C1 a CA-C3 |

A carteira ordena por nome (padrão), por I-2 (as empresas sem valor vão para o fim) e pela data da última consulta concluída (as sem consulta concluída vão primeiro), com `cg-sort`. Não há linha, cartão nem rodapé de total (CA-C4).

Dashboard em largura de desktop, como o design (D-6 da 032). Em tela estreita, os blocos se empilham, sem desenho próprio para celular.

#### Textos (CA-2, CA-4, CA-14 a CA-22)

Todos os textos fixos do dashboard e da carteira ficam em `src/paineis/textos.ts`. Valem os do artboard aprovado quando a sessão principal os transcrever (P-S3). Até lá, valem estes, tirados da US e do design system:

| Onde | Texto |
|---|---|
| Nota de I-2 (CA-4) | "Ainda não liberado pela Receita. Ela informa o valor sem dizer o motivo." |
| Nota de I-1 | "Total registrado pela Receita nas notas de compra. Os valores abaixo vêm de campos separados e não se somam." |
| Notas de I-3, I-4 e I-5 | As do design 3.3 |
| Outros valores (I-6) | Rótulos "Suspenso", "Inapropriável", "Prescrito", "Restabelecido", "Inutilizável", "Pedido de ressarcimento" (e "Excedente", P-S2), cada um com a nota "Valor que a Receita informa neste campo. O significado prático está em análise." |
| Percentual (CA-9) | "N% do valor a apropriar está em notas de emitente não identificado, como as NFS-e, cuja chave não traz o emitente num leiaute conhecido." |
| Débitos (CA-13) | "Imposto das vendas registrado pela Receita. O CreditoGov não calcula saldo líquido entre crédito e débito nesta versão." |
| Situação (CA-14) | "Os números são os das consultas feitas pelo CreditoGov à API de apuração da CBS da Receita Federal. A Receita não fornece histórico anterior a essas consultas." |
| Desatualizado (CA-15) | "Créditos sem consulta concluída há N dias. Cada consulta à Receita só devolve as alterações dos últimos 8 dias, então pode haver alteração que não foi recebida." (e o mesmo para débitos) |
| Sem consulta (CA-16) | "Os créditos ainda não foram consultados na Receita." e, com consulta em andamento, "Há uma consulta em andamento." |
| Vazio (CA-17) | "A Receita não devolveu créditos nas consultas feitas até DD/MM/AAAA às HH:MM. Isto não é um saldo de R$ 0,00." |
| Período sem nota (CA-12) | "Nenhum crédito neste período nas consultas feitas." |
| Falha (CA-19) | Título "A atualização dos créditos falhou em DD/MM/AAAA às HH:MM." Credencial: "A Receita recusou a credencial de acesso da empresa. É preciso gerar uma nova no portal da Receita. Fale com a equipe CreditoGov para informá-la." Outros: "Isso não depende de você." Com números anteriores: "Os números abaixo são da consulta de DD/MM/AAAA às HH:MM e não estão atualizados." |
| Recusado (CA-20) | "Há retornos da Receita que não entraram nos indicadores: N de créditos, o mais recente em DD/MM/AAAA. Os números não incluem esses retornos." Em `sem_dados_usaveis`: "Nenhum retorno de créditos pôde ser usado." |
| Só CBS (CA-22) | "Só CBS. Os dados vêm da API de apuração da CBS da Receita Federal; o IBS ainda não está nessa fonte." |
| Origens (CA-25) | "Há notas com origem diferente de normal neste recorte. Os valores entram nos totais como a Receita informou: CANCELAMENTO_CREDITO (30): 2 notas." |
| Carteira (CA-C4) | Título "Empresas". Subtítulo "Valores de cada empresa como a Receita informou. Valores de empresas diferentes não se somam." Selos: "Atualizado", "Consulta falhou", "N dias sem consulta", "Sem consulta concluída" |

Nenhum texto usa "disponível", "indisponível", "pode usar", "confirmado", "a receber", "garantido", "não recolheu", "deixou de recolher" ou "inadimplente". "Indisponível" também fica de fora porque contém "disponível", e o teste de CA-2 procura a palavra.

### Documentação

Numa task própria, no fim:

- **`docs/PROJECT_CONTEXT.md`**:
  - §2: o dashboard e a carteira construídos, só com dados fictícios até o coletor;
  - §3: a decisão de P-6;
  - §4: o "o que existe" do backend (leitura, indicadores, `carregar-cenario`) e da web;
  - §11: changelog.
- **`AGENTS.md`**: na seção "Comandos", só a linha de `npm run admin -- carregar-cenario`. A regra de testes não muda: os comandos são os da 034.
- **`docs/arquitetura/README.md`**, seção 13 (histórico):
  - AD-3: busca de dados com TanStack Query (DT-5);
  - AD-6: as quatro tabelas e as colunas mínimas de `consulta`;
  - AD-13: o múltiplo de 0,01 conferido com `big.js` no lugar do `multipleOfPrecision`;
  - AD-14: a leitura copiada para o `app/backend`.
- **`docs/produto/hipoteses.md`**: o resultado de P-S1 e P-S2, se forem respondidas; D-5 e D-6 continuam hipóteses.
- **`app/backend/README.md`**: como carregar os cenários e abrir cada estado.

## Contratos

Valores em texto decimal com duas casas (`"1234.50"`). Instantes em ISO 8601 UTC. Datas de nota em `AAAA-MM-DD`, tiradas do texto do arquivo. Período na API e na URL como `AAAA-MM`, na tela como `MM/AAAA`. Erros na forma da 034 (`{erro, mensagem}`). Empresa sem vínculo dá `404 empresa_nao_encontrada`, pela 034 (CA-33 dela).

### `GET /api/empresas/:empresaId/painel?periodo=AAAA-MM`

```json
{
  "recorte": { "periodo": null, "periodos": ["2026-10", "2026-11"] },
  "situacao": {
    "creditos": {
      "estado": "com_dados",
      "emAndamento": false,
      "ultimaConcluidaEm": "2026-11-26T12:00:00.000Z",
      "diasSemConsulta": 1,
      "desatualizado": false,
      "falha": null,
      "atualizacao": { "de": "2026-11-01", "ate": "2026-11-21" },
      "recusados": null
    },
    "debitos": { "estado": "sem_consulta", "emAndamento": true, "ultimaConcluidaEm": null, "diasSemConsulta": null, "desatualizado": false, "falha": null, "atualizacao": null, "recusados": null }
  },
  "creditos": {
    "semNotasNoRecorte": false,
    "quantidadeNotas": 896,
    "quantidadeComAApropriar": 887,
    "totais": { "apurado": "0.00", "aApropriar": "0.00", "apropriado": "0.00", "utilizado": "0.00", "saldoCredor": "0.00" },
    "outros": [{ "campo": "suspenso", "valor": "10.00" }],
    "pendentes": {
      "emitentes": [{ "grupo": "11111111000111", "documento": "cnpj", "quantidade": 3, "total": "0.00" }],
      "demais": { "emitentes": 120, "quantidade": 400, "total": "0.00" },
      "naoIdentificado": { "quantidade": 132, "total": "0.00" },
      "propriaEmpresa": { "quantidade": 1, "total": "0.00" },
      "negativos": null,
      "percentualNaoIdentificado": "14.8"
    },
    "porPeriodo": [{ "periodo": "2026-11", "totais": { "apurado": "0.00", "aApropriar": "0.00", "apropriado": "0.00", "utilizado": "0.00", "saldoCredor": "0.00" } }],
    "origens": [{ "codigo": 30, "nome": "CANCELAMENTO_CREDITO", "quantidade": 2 }]
  },
  "debitos": null
}
```

- `situacao.<servico>.falha`: `null` ou `{ "em": "<instante>", "tipo": "credencial" | "outra" }`. `recusados`: `null` ou `{ "quantidade": n, "ultimoEm": "<instante>" }`.
- `creditos` e `debitos` são `null` quando o estado do serviço não é `com_dados`. Com `semNotasNoRecorte: true`, os demais campos do bloco não vêm.
- `debitos`, quando há dados: `{ semNotasNoRecorte, quantidadeNotas, totais: { apurado, extinto, saldoDevedor }, origens }`.
- O campo `documento` do emitente é `cnpj` ou `cpf` (P-S1). O CNPJ vai sem formatação, e a web formata.
- Não há campo de soma entre crédito e débito, nem entre totais de crédito (CA-2, CA-13).
- Respostas: `200`; `400 periodo_invalido`; `404 empresa_nao_encontrada`. CA-1 a CA-25.

### `GET /api/empresas/:empresaId/pendencias?periodo=`

`200 { recorte, situacao: { creditos }, grupos, totalAApropriar, percentualNaoIdentificado }`. `grupos` traz todos os emitentes, sem "demais", e depois os grupos especiais: `[{ grupo, tipo: "emitente" | "propria_empresa" | "nao_identificado" | "negativos", documento?, quantidade, total }]`. Com créditos fora de `com_dados`, `grupos` é `null`. CA-9, CA-10.

### `GET /api/empresas/:empresaId/pendencias/:grupo/notas?periodo=&pagina=`

`:grupo` é um CNPJ de 14 caracteres (`[0-9A-Z]{12}[0-9]{2}`), um CPF de 11 dígitos (P-S1), `propria-empresa`, `nao-identificado` ou `negativos`. `200 { grupo, quantidade, total, pagina, paginas, notas: [{ periodo, chave, documento, documentoNome, emissao, aApropriar }] }`, 100 por página, do maior para o menor `aApropriar` e, no empate, pela chave. Grupo sem nota no recorte dá `404 grupo_nao_encontrado`. Página fora do intervalo dá `400 pagina_invalida`. CA-10, P-8.

### `GET /api/carteira`

`200 { empresas: [{ id, nome, cnpjRaizFormatado, papel, creditos: { estado, aApropriar, apropriado, utilizado }, situacao: { resumo: "atualizado" | "falhou" | "desatualizado" | "sem_consulta", ultimaConcluidaEm, diasSemConsulta } }] }`, ordenadas por nome. Os três valores são `null` fora de `com_dados`. A resposta não tem campo de total. CA-C1 a CA-C4.

### Função de leitura (contrato com o coletor)

```ts
registrarLeitura(tx, {
  consultaId: string;          // consulta da empresa fixada, do serviço informado
  servico: "creditos" | "debitos";
  conteudo: Uint8Array;        // o arquivo como baixado
  recebidoEm: Date;
  objeto?: string;             // endereço no armazenamento de objetos (AD-8), a partir do coletor
}): Promise<{ arquivoId: string; situacao: "aceito" | "aceito_com_divergencia" | "recusado"; motivo?: MotivoRecusa; notas: number }>
```

CA-20, CA-23, CA-24.

## Riscos e decisões

Decisões técnicas desta Spec (DT-N), para aprovação junto com ela:

- **DT-1 — A 033 cria o lado de leitura dos dados fiscais** (as quatro tabelas e `registrarLeitura`), e o coletor só o preenche. Sem isso, o dashboard não teria de onde ler, e CA-20 e CA-24 dependem do leitor. A US deixa fora "fazer as consultas, agendá-las e guardar os retornos". Isso continua fora: não há chamada à Receita, agendamento nem armazenamento de objetos. A alternativa, esperar a demanda do coletor, bloquearia a 033 inteira.
- **DT-2 — Todas as versões gravadas e consolidação na leitura**, em vez de gravar só a nota vencedora. Mantém a leitura reconstruível (AD-8) e deixa a D-5 trocável sem migração.
- **DT-3 — Indicadores em TypeScript com `big.js`, e não em SQL.** As regras (D-4, D-5, grupos, a linha de negativos) já existem testadas no painel e ficam em funções puras, testáveis sem banco. O custo é ler todas as notas da empresa a cada requisição (R-2).
- **DT-4 — Emitente calculado na consulta, não gravado.** Uma mudança na regra (P-S1, leiaute da NFS-e) vale sem regravar.
- **DT-5 — `@tanstack/react-query` para a busca de dados**, que cumpre o critério da AD-3 (cache por empresa e recorte, sem estado global). A alternativa, um cache próprio num contexto React, reescreveria invalidação, estados de carregamento e nova tentativa.
- **DT-6 — Validação do múltiplo de 0,01 fora do `ajv`**, com `big.js` sobre o texto. Trata o ponto de atenção da AD-13 sem mudar o arquivo do schema oficial.
- **DT-7 — Texto de credencial recusada aponta para a equipe CreditoGov** enquanto não houver cadastro de credencial. Nunca pede que a credencial seja mandada por e-mail ou mensagem.
- **DT-8 — Situação única por empresa na carteira:** a pior entre créditos e débitos, com a data mais antiga. Uma linha por empresa, como no design, sem esconder um serviço com problema.
- **DT-9 — A carteira aparece para qualquer usuário com mais de uma empresa**, porque os três papéis veem os mesmos dados (034, CA-29). Ver P-S5.
- **DT-10 — Linha "Notas com valor a apropriar negativo"** em I-7, só quando existir, para CA-6 e CA-9 valerem juntos. Mesma solução da DT-9 da 030.
- **DT-11 — Evolução por período como tabela**, sem gráfico. A US não pede gráfico, e a tabela mostra o valor exato com o nome oficial. Se o artboard tiver gráfico, a P-S3 decide.
- **DT-12 — Menu sem "Créditos", "Débitos" e "Consultas à Receita"** até as telas existirem.
- **DT-13 — Sem comando para importar arquivo do disco.** Os dados locais só vêm do gerador fictício (CA-26), o que fecha o caminho para um arquivo real entrar no banco de desenvolvimento.

Riscos:

- **R-1. A 034 pode mudar na implementação.** Os nomes `naEmpresa`, `naCarteira`, `rotaDeEmpresa`, `useEmpresaEmFoco` e a migração `0001` são os da Spec aprovada. A primeira task da 033 confere o código da 034 já na `main` e ajusta as referências.
- **R-2. Volume.** Cada requisição lê todas as notas da empresa, e a carteira lê as de todas as empresas do usuário. Com os volumes observados (cerca de 900 créditos e 2.800 débitos por arquivo, e um arquivo novo por dia), cabe com folga numa versão inicial. Se a carteira crescer, as somas passam para SQL numa demanda própria, com o mesmo contrato da API. Não há número de limite com fonte: o teste de volume usa o cenário `completo`.
- **R-3. O coletor pode precisar de outra forma em `consulta`.** As colunas mínimas desta Spec seguem a AD-9. Se a demanda do coletor mudar o sentido de `concluida_em` ou dos estados, ela ajusta `situacaoDoServico` e os testes.
- **R-4. D-5 e D-6 são hipóteses** (`hipoteses.md`). Se a segunda consulta real derrubar alguma, o efeito fica em `consolidacao.ts` e em `creditos.ts`, com testes próprios.
- **R-5. Textos do artboard fora do repositório** (P-S3), como na 034.
- **R-6. Docker** é obrigatório para os testes de banco, como na 034 (R-1 dela).

## Implantação

**Não há deploy nesta demanda.** O provedor depende da PD-1 (AD-7), e não há coletor: fora da máquina local, o dashboard só mostraria "ainda não consultados".

- **Apps afetadas:** `app/backend` e `app/web`, criadas pela 034. `app/landing-page`, `app/apuracao-cbs` e `app/painel` não mudam (a leitura é copiada, não importada).
- **Migration:** sim, a `0002_dados_fiscais`, com as tabelas `consulta`, `arquivo_bruto`, `credito_lido` e `debito_lido`, as regras de segurança por linha e as permissões. Depende da `0001` da 034. Roda com `npm run migrar`, com o papel de migração.
- **Compatibilidade:** a `0002` só acrescenta tabelas e não muda as da 034. A web troca `Inicio` e a lista de `/empresas`; nenhuma outra aplicação usa essas rotas.
- **Variáveis de ambiente:** nenhuma nova. `carregar-cenario` usa `CREDITOGOV_AMBIENTE`, que já existe, e recusa rodar fora de `local`.
- **Dependências novas:** `big.js`, `lossless-json`, `ajv` e `ajv-formats` no `app/backend` (as mesmas do painel); `@tanstack/react-query` no `app/web`.
- **Outros efeitos:** nenhum cron, DNS, Keycloak ou serviço externo.
- **Antes:** a 034 na `main` e nesta branch; `npm run banco:subir` e `npm run migrar`. **Depois, local:** `npm run admin -- criar-empresa` (uma empresa por cenário, com raiz fictícia), `convidar`, aceitar o convite pelo e-mail local e `npm run admin -- carregar-cenario`.
- **Como voltar:** o `down` da `0002` apaga as quatro tabelas, sem tocar nas da 034; localmente, `npm run banco:apagar`. Não há nada publicado para desfazer.

## Estratégia de verificação

### Comandos

Os da 034:

- **`app/backend`:** `npm run banco:subir`, depois `npm test`, `npm run lint` e `npm run build`;
- **`app/web`:** `npm test`, `npm run lint` e `npm run build`.

Nenhum teste lê `.env`, chama a Receita ou usa dado real. Os retornos vêm do gerador fictício. Os testes de indicadores, leitura e formatação não usam banco. Os de rota e de isolamento usam o banco de teste local da 034.

**Conferência visual** no navegador, em largura de desktop, com um usuário ligado a uma empresa de cada cenário: cada estado da tabela de cenários, a carteira com todas elas e a comparação com os artboards "Dashboard", "Dashboard — estados dos dados" e "Carteira do contador".

### CA por teste

| CA | Como se prova |
|---|---|
| CA-1 | Teste de indicadores: no cenário `completo`, cada total de I-1 a I-5 é igual à soma do campo calculada no próprio teste, nota a nota, em `big.js`. Teste da web: cada cartão tem o rótulo, a nota e o nome oficial |
| CA-2 | Teste: a resposta do painel não tem campo derivado (lista fechada de chaves no JSON). Teste de texto: `textos.ts` e o HTML renderizado de cada cenário não contêm nenhuma palavra proibida (sem diferenciar maiúsculas e acentos) |
| CA-3 | Teste: `completo` não manda `outros`, e a web não renderiza o bloco; `outros-valores` manda só os campos diferentes de zero, cada um em linha própria com o nome oficial |
| CA-4 | Teste da web: a nota de I-2 está presente. Teste de texto: nenhuma das expressões de recolhimento proibidas |
| CA-5 | Teste: a quantidade de notas e a quantidade com `aApropriar > 0` conferidas no cenário `completo` |
| CA-6 | Teste: os emitentes vêm em ordem decrescente de total, com desempate estável; a web formata o CNPJ e não mostra nome |
| CA-7 | Testes de `lerChave` (copiados do painel): documento 91, chave de 50 posições, modelo divergente, DV errado e cada exceção de série, todos em "não identificado"; CNPJ certo nos documentos 55, 57, 62 e 65 |
| CA-8 | Teste: nota com o emitente da mesma raiz da empresa e de outro estabelecimento entra em "própria empresa" |
| CA-9 | Teste em todos os cenários com dados: a soma de todos os grupos é igual a I-2 ao centavo, inclusive com a nota negativa de `outros-valores`; o percentual é conferido à mão num caso pequeno |
| CA-10 | Teste: com `EMITENTES_NO_BLOCO + 3` emitentes, o bloco tem o limite mais "demais emitentes" com a soma do resto. `/pendencias` lista todos os grupos, e as notas de um grupo somam o total dele, com a paginação de 100 |
| CA-11 | Teste: os períodos em ordem cronológica (inclusive a virada de ano), só os que têm nota, e a soma de cada coluna igual ao total |
| CA-12 | Teste da API: com `periodo`, todos os blocos (créditos, pendentes, evolução, débitos) só têm notas daquele `pa`; período sem débito dá `semNotasNoRecorte`; `periodo` malformado dá `400`. Teste da web: o seletor muda a URL e o título mostra o recorte |
| CA-13 | Teste: o bloco de débitos tem os três rótulos com o nome oficial e a frase de saldo líquido; a resposta não tem campo que combine crédito e débito |
| CA-14 | Teste de `situacaoDoServico`: `ultimaConcluidaEm` e o intervalo de `atualizacao` por serviço. Teste da web: a frase de CA-14 está presente |
| CA-15 | Testes com relógio falso: 8 dias exatos não avisam; 8 dias e 1 segundo avisam; o aviso é por serviço |
| CA-16 | Testes: `sem-consulta` e `em-andamento` não renderizam nenhum `R$` nos blocos; a mensagem de em andamento aparece só no segundo |
| CA-17 | Teste: `vazio` mostra a mensagem com a data e nenhum `R$ 0,00` fora da própria frase |
| CA-18 | Teste: `parcial` mostra os números de créditos e o estado de débitos, sem zero |
| CA-19 | Testes: `parcial` (falha sem dados anteriores) e `falha-com-anteriores` (números visíveis, data e aviso de desatualizado); o texto de credencial só no tipo `credencial`; nenhum código HTTP ou nome de estado interno na tela |
| CA-20 | Testes de leitura: ilegível, fora do schema, outra raiz e valor fora do limite gravam `recusado` com o motivo e nenhuma nota. Teste de tela: `recusado` mostra o aviso com a quantidade; um retorno recusado sozinho dá `sem_dados_usaveis` |
| CA-21 | Teste: consultas de `recolhimentos` e `pagamentos` gravadas no banco não mudam nenhuma resposta; a web não tem texto sobre elas |
| CA-22 | Teste da web: o aviso de só CBS aparece em todos os estados |
| CA-23 | Testes: `formatarReais("1234.5")`, `("-0.01")`, `("12345678901234.56")` e `("0")`; leitura de `12345678901234.56` sem perda até a resposta da API (`typeof === "string"`); uma busca no código de `src/formatacao` e `src/paineis` da web não encontra `Number(`, `parseFloat` nem `parseInt` |
| CA-24 | Testes de consolidação: a mesma nota em duas consultas conta uma vez, e vale a versão de `atualizacao` mais recente, depois `gerado_em`, `recebido_em` e `arquivo_id`. Notas de dois estabelecimentos da mesma raiz entram na mesma empresa |
| CA-25 | Teste: `outros-valores` lista as origens 20 e 30 com o nome oficial e a quantidade, e os valores entram com o sinal como veio |
| CA-26 | Revisão e teste: nenhum teste lê `.env` nem abre conexão fora de `127.0.0.1`; todo CNPJ de 14 dígitos gerado tem DV inválido; `carregar-cenario` recusa ambiente diferente de `local` e empresa com consulta; não há comando de importação de arquivo |
| CA-C1 | Teste da API: a carteira de um usuário com três empresas (cenários `completo`, `vazio` e `falha-com-anteriores`) tem as três, cada uma com os próprios valores e situação; uma empresa sem vínculo não aparece |
| CA-C2 | Testes da web: ordenação por I-2 e por data, com as sem valor e as sem consulta nos lugares definidos; os selos de falha, sem consulta e dias sem consulta |
| CA-C3 | Teste da web: o clique na linha leva a `/e/:empresaId`, e o dashboard mostra os mesmos valores da API para aquela empresa |
| CA-C4 | Teste: a resposta não tem campo de total; a página não tem linha nem texto de total |
| Isolamento (AD-6) | Teste de banco: com as empresas A e B carregadas, o painel de A não traz nada de B; `INSERT` em `credito_lido` com `empresa_id` de B, com A fixada, falha; a chave estrangeira composta recusa arquivo de A ligado a consulta de B; `naEmpresaInterna` não é importada por `src/api/` |

## Perguntas em aberto

Para o responsável, na aprovação desta Spec:

- **P-S1 (escopo): emitente CPF.** Na NF-e de série 910 ou acima, a chave traz o CPF do emitente (pessoa física; fonte em `documentos-fiscais/`). O painel da 030 mostrava esse CPF. CA-6 fala em "CNPJ". Mostrar o CPF formatado como emitente, ou mandar essas notas para "emitente não identificado"? Recomendação: mostrar o CPF formatado, com o rótulo "CPF do emitente". É o mesmo dado que a empresa já tem na própria nota de compra, fica isolado na empresa e nunca vai a log. A pergunta de LGPD sobre CPF que já está em `hipoteses.md` continua aberta para advogado.
- **P-S2 (escopo): campo `excedente`.** O schema de créditos e o de débitos têm `cbs.excedente`, que não está na lista de I-6 e não veio nos arquivos reais (O-8, O-20). Ele entra em I-6? Recomendação: sim, com o mesmo tratamento dos outros campos (só aparece com valor diferente de zero, com o nome oficial e a nota neutra). Assim, nenhum valor informado pela Receita fica fora da tela sem aviso. O significado dele vai para o tributarista junto com P-1 e P-4.
- **P-S3 (texto e design): artboards do dashboard.** Os artboards "Dashboard", "Dashboard — estados dos dados" e "Carteira do contador" são privados e não estão no repositório. Quantos emitentes aparecem no bloco antes de "demais emitentes" (CA-10)? Quais são os textos exatos? A evolução por período é tabela ou gráfico? Recomendação: a sessão principal transcreve os textos e o número de emitentes, como fez na P-S1 da 034, e a task de textos usa a transcrição. Até lá valem os textos da seção "Textos", `EMITENTES_NO_BLOCO = 5` e a tabela (DT-11).
- **P-S4 (texto): credencial recusada.** Até haver cadastro de credencial, o texto de CA-19 diz "Fale com a equipe CreditoGov para informá-la" (DT-7). Serve? Recomendação: sim. A alternativa seria não dizer o que fazer, o que contraria CA-19.
- **P-S5 (produto): quem vê a carteira.** Todo usuário com mais de uma empresa, ou só quem tem papel `contador` em alguma delas? Recomendação: todos, porque a 034 decidiu que os três papéis veem os mesmos dados, e um titular de duas empresas também precisa escolher entre elas (DT-9).

Continuam abertas para o tributarista, sem bloquear a Spec, com as recomendações aprovadas na US: P-1 (qual valor é o crédito utilizável), P-2 (saldo líquido), P-3 (quando o a apropriar passa a apropriado) e P-4 (significado do saldo credor e do pedido de ressarcimento). As respostas vão para `docs/produto/hipoteses.md`. Nenhuma regra de CBS/IBS nova foi escrita nesta Spec.
