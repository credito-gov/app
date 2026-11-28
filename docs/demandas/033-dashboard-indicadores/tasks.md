# 033-dashboard-indicadores — Tasks

- **Status:** em-implementação
- **Spec:** [`spec.md`](spec.md), aprovada em 2026-11-27 com as recomendações de P-S1 a P-S5
- **US:** [`us.md`](us.md), aprovada em 2026-11-25

> **Bloqueio: nenhuma task começa antes de a demanda 034 (login) estar mergeada na `main` e trazida para esta branch.** A sessão principal traz a `main` para `feat/033-dashboard-indicadores` e só então libera a task 1. A **task 1** confere o código real da 034 e ajusta as referências desta lista e da Spec (R-1). Se a 034 mudou algo que muda o sentido da Spec (nome de função, contrato de rota, forma da migração `0001`, papéis do banco), o Developer **para** na task 1 e devolve à sessão principal. A Spec é ajustada e aprovada de novo antes da task 2.

Tasks pequenas e ordenadas, com um commit por task. Cada task cita a seção da Spec, os CA que atende e como é verificada. A referência é a Spec aprovada. Se esta lista divergir dela, vale a Spec, e a divergência volta para a sessão principal.

**Testes primeiro:** em cada parte, a task de testes vem antes da task de código. Os testes nascem dos CA-N da [`us.md`](us.md) e **falham** quando são commitados, por falta do módulo ou do comportamento. O Developer registra a falha na mensagem do commit (quantos testes falham e por quê), e a task seguinte implementa o código até eles passarem. Todo CA-N tem pelo menos um teste (mapa no fim).

**Partes:**

| Parte | Tasks | Pode ser separada |
|---|---|---|
| Conferência da 034 | 1 | Não |
| Banco | 2–3 | Não |
| Leitura | 4–6 | Não |
| Gerador fictício | 7–8 | Não |
| Indicadores (funções puras) | 9–14 | Não |
| Cenários no `admin` | 15–16 | Não |
| API do dashboard | 17–18 | Não |
| Web do dashboard | 19–28 | Não |
| Documentação e verificação do dashboard | 29–31 | Não |
| **Carteira do contador** | 32–38 | **Sim**: se a revisão pedir, as tasks 32 a 38 viram demanda própria sem mexer nas anteriores |

## Regras para o Developer em todas as tasks

- Trabalhar só em `app/backend/`, `app/web/` e nos documentos citados nas tasks 29, 30 e 38. **Nenhuma task altera** `app/landing-page`, `app/apuracao-cbs` nem `app/painel`: do painel só se **copia** (task 4).
- **Nenhum dado real.** Raízes de empresa `00000000` e `11111111` (e outras do mesmo tipo, se precisar de mais), nomes como "Comércio Exemplo Ltda.", e-mails de `exemplo.com.br` ou `example.com`. Todo CNPJ de 14 dígitos de emitente ou de estabelecimento tem o **dígito verificador do CNPJ errado de propósito**. O dígito da **chave de acesso** é calculado certo. Isso vale para código, teste, documento e mensagem de commit.
- **Sem literal numérico longo.** A varredura da 034 (task 23 dela) recusa número de 11 dígitos ou mais em `src/` e `test/`. Chaves de acesso, CNPJs e CPFs dos testes são **montados por função auxiliar** (`test/apoio/`), nunca escritos por extenso. A única exceção é a constante `12345678901234.56` de CA-23, a mesma da 034; se a varredura não a aceitar fora do teste da 034, a exceção é acrescentada com o nome do arquivo e o motivo.
- **Sem segredo e sem rede.** Não criar `.env` nem pedir credencial. Os testes montam a configuração em código. O `test/setup.ts` das duas aplicações (da 034) continua bloqueando `fetch`. O único destino de rede é o banco de teste em `127.0.0.1:5433`. Nenhum teste chama a Receita.
- **Comandos de verificação**, sempre na pasta da aplicação (os da 034, sem comando novo de teste):
  - `app/backend`: `npm run banco:subir` (uma vez) e `npm test`, `npm run lint`, `npm run build`;
  - `app/web`: `npm test`, `npm run lint`, `npm run build`.

  Ao fim de cada task de implementação, os três passam. Numa task de testes, só os testes novos falham, e o lint passa. Sem Docker, o Developer para e devolve à sessão principal (R-6).
- **Testes da 034 que mudam:** só os que a Spec troca (a página `Inicio`, a lista de `EscolherEmpresa` e o menu "Início"). Cada mudança é dita na mensagem do commit. Nenhum outro teste da 034 é apagado ou afrouxado.
- **Antes de cada commit:** `git status` e conferir cada arquivo. Nada de `node_modules/`, `dist/`, `.local/` ou `.env`.
- **Mensagens de commit:** `test(backend): ...`, `feat(backend): ...`, `chore(backend): ...`, `test(web): ...`, `feat(web): ...`, `chore(web): ...`, `docs(033): ...`.

## Lista

| # | Task | Spec | CA | Verificação | Status |
|---|---|---|---|---|---|
| 1 | Conferir a 034 na `main` e ajustar as referências | Dependências › Da demanda 034; R-1 | — (pré-requisito de todas) | tabela de conferência preenchida; os seis comandos da 034 passam na branch | ☑ |
| 2 | Testes da migração `0002` e da transação interna | Banco; Estratégia › Isolamento | CA-20, CA-24, CA-26; AD-6 | falham (não há migração) | ☑ |
| 3 | Migração `0002_dados_fiscais`, tipos do esquema e `naEmpresaInterna` | Banco › Migração `0002`; Transação sem usuário | idem 2 | testes da task 2 passam; `npm run migrar` sobe e o `down` desfaz | ☑ |
| 4 | Dependências do backend e cópia do núcleo e dos schemas do painel | Leitura (AD-14); Implantação › Dependências | CA-23 | testes copiados passam; `app/painel` sem alteração | ☑ |
| 5 | Testes de `registrarLeitura` | Leitura; Contratos › Função de leitura | CA-20, CA-23, CA-24 | falham | ☑ |
| 6 | Validação revisada (múltiplo de 0,01 com `big.js`) e `registrarLeitura` | Leitura; DT-6 | idem 5 | testes da task 5 passam | ☑ |
| 7 | Testes do gerador fictício | Cenários fictícios › Gerador | CA-26 | falham | ☐ |
| 8 | Implementar o gerador e os nove cenários | idem 7 | idem 7 | testes da task 7 passam | ☐ |
| 9 | Testes de consolidação e de emitente | Indicadores › Consolidação; Emitente; P-S1 | CA-6, CA-7, CA-8, CA-24 | falham | ☐ |
| 10 | Implementar `consolidacao.ts` e `emitente.ts` | idem 9; DT-4 | idem 9 | testes da task 9 passam | ☐ |
| 11 | Testes de `situacaoDoServico` | Indicadores › Situação de cada serviço | CA-14 a CA-21 | falham | ☐ |
| 12 | Implementar `situacao.ts` | idem 11 | idem 11 | testes da task 11 passam | ☐ |
| 13 | Testes de `indicadoresDeCredito` e `indicadoresDeDebito` | Indicadores › Créditos; Débitos; DT-10; P-S2; P-S3 | CA-1 a CA-13, CA-23, CA-25 | falham | ☐ |
| 14 | Implementar `creditos.ts` e `debitos.ts` | idem 13 | idem 13 | testes da task 13 passam | ☐ |
| 15 | Testes de `npm run admin -- carregar-cenario` | Cenários fictícios › Comando; DT-13 | CA-16 a CA-20, CA-26 | falham | ☐ |
| 16 | Implementar `carregar-cenario` | idem 15 | idem 15 | testes da task 15 passam | ☐ |
| 17 | Testes das rotas de painel, pendências e notas | API; Contratos | CA-1 a CA-25; AD-6 | falham | ☐ |
| 18 | Implementar `paineis/dados.ts` e as três rotas | idem 17 | idem 17 | testes da task 17 passam | ☐ |
| 19 | Testes da formatação de valores e datas na web | Web › Valores e datas | CA-23 | falham | ☐ |
| 20 | Implementar `src/formatacao/` | idem 19 | idem 19 | testes da task 19 passam | ☐ |
| 21 | Testes da busca de dados | Web › Busca de dados; DT-5 | CA-12; AD-3 | falham | ☐ |
| 22 | Implementar o cliente de cache e os ganchos de busca | idem 21 | idem 21 | testes da task 21 passam | ☐ |
| 23 | Testes da Visão geral com dados | Web › Rotas e menu; Componentes; Textos | CA-1 a CA-13, CA-22, CA-25 | falham | ☐ |
| 24 | Implementar `textos.ts`, os componentes de indicadores, `VisaoGeral`, a rota e o menu | idem 23; DT-11, DT-12 | idem 23 | testes da task 23 passam | ☐ |
| 25 | Testes dos estados dos dados | Web › Componentes (`SituacaoDados`, `EstadoServico`); Textos | CA-14 a CA-22 | falham | ☐ |
| 26 | Implementar `SituacaoDados`, `EstadoServico` e os alertas | idem 25; DT-7 | idem 25 | testes da task 25 passam | ☐ |
| 27 | Testes de `Pendencias` e `NotasDoGrupo` | Web › Rotas; Componentes (`PendentePorEmitente`); P-8 | CA-9, CA-10 | falham | ☐ |
| 28 | Implementar `Pendencias` e `NotasDoGrupo` | idem 27 | idem 27 | testes da task 27 passam | ☐ |
| 29 | README do backend (cenários) e roteiro de conferência no navegador | Documentação; Estratégia › Conferência visual | CA-16 a CA-22, CA-26 | roteiro rodado pelo Developer; conferência do responsável pedida pela sessão principal | ☐ |
| 30 | `PROJECT_CONTEXT.md`, `AGENTS.md`, arquitetura §13 e `hipoteses.md` | Documentação | — | revisão; links abrem | ☐ |
| 31 | Verificação final do dashboard | Estratégia de verificação | CA-1 a CA-26 | os seis comandos passam; varreduras limpas | ☐ |
| 32 | Testes de `linhaDaCarteira` | Indicadores › Carteira; DT-8 | CA-C1, CA-C2, CA-C4 | falham | ☐ |
| 33 | Implementar `carteira.ts` | idem 32 | idem 32 | testes da task 32 passam | ☐ |
| 34 | Testes de `GET /api/carteira` | API; Contratos › `GET /api/carteira`; DT-9 | CA-C1, CA-C4; AD-6 | falham | ☐ |
| 35 | Implementar a rota da carteira | idem 34 | idem 34 | testes da task 34 passam | ☐ |
| 36 | Testes da tela `Carteira` | Web › Rotas; Componentes (`LinhaCarteira`); Textos | CA-C1 a CA-C4 | falham | ☐ |
| 37 | Implementar `Carteira` em `/empresas` | idem 36 | idem 36 | testes da task 36 passam | ☐ |
| 38 | Documentação e verificação final da carteira | Documentação; Estratégia de verificação | CA-C1 a CA-C4 | os seis comandos passam; roteiro da carteira rodado | ☐ |

## Detalhe das tasks

### 1. Conferir a 034 na `main` e ajustar as referências

**Pré-condição:** a 034 mergeada na `main` e a `main` trazida para esta branch pela sessão principal. Sem isso, a task não começa.

O Developer lê o código da 034 (sem alterar nada) e preenche, no fim deste arquivo, a seção "Conferência da 034" com uma linha por item da tabela "Dependências › Da demanda 034" da Spec: o nome esperado, o nome e o arquivo reais, e se bate. Itens a conferir, no mínimo:

- `src/banco/transacao.ts`: `naEmpresa`, `naCarteira`, `naSessaoDoUsuario`, `semUsuario`, `EmpresaNaoEncontrada`, e se existe função que fixa uma empresa por `id` sem usuário (a do `admin`, DT-7 da 034). Se existir, a task 3 a usa no lugar de `naEmpresaInterna`;
- a migração `0001`: `empresa` (com `cnpj_raiz`), `vinculo_empresa`, `app_empresas()`, `app_usuario()`, papéis `creditogov_migracao` e `creditogov_app`;
- `rotaDeEmpresa`, `request.naEmpresa`, `request.naCarteira` e a forma do erro `404 empresa_nao_encontrada`;
- o relógio injetável na fábrica do servidor e no `admin`, e como os testes montam a configuração;
- `npm run admin`: a forma de registrar um comando novo;
- o banco de teste: `test/banco/preparar.ts`, `test/banco/limpar.ts` (se a limpeza descobre tabelas sozinha ou tem lista fixa) e o teste de catálogo de CA-37 da 034;
- a varredura de literais longos (task 23 da 034) e a lista de exceções dela;
- `app/web`: `LayoutEmpresa`, `BarraTopo` (itens do `cg-topnav`), `useEmpresaEmFoco()`, `api/cliente.ts` (forma do resultado, `sem_conexao`, tratamento do `401`), `ProvedorSessao` (`sair`), `rotas.tsx`, `paginas/Inicio` e `paginas/EscolherEmpresa`, e os testes da 034 que os cobrem;
- os textos da 034 que aparecem dentro do layout do dashboard (barra do topo, menu): nenhum pode conter as palavras proibidas de CA-2. Se algum contiver, o Developer para e devolve.

**Ajuste das referências:** se um nome mudou e o sentido não, o Developer troca o nome nesta lista (não na Spec) e registra na tabela. Se o sentido mudou, ou falta uma peça de que a 033 depende, para e devolve à sessão principal.

**Verificação:** a tabela está preenchida; em `app/backend`, `npm run banco:subir`, `npm test`, `npm run lint` e `npm run build` passam; em `app/web`, `npm test`, `npm run lint` e `npm run build` passam. Commit `docs(033): conferência da 034`.

### 2. Testes da migração `0002` e da transação interna

Em `test/banco/`, com o banco de teste da 034, o papel `creditogov_app` e as empresas fictícias A e B:

- **Segurança por linha (AD-6):** com A fixada, `SELECT` nas quatro tabelas (`consulta`, `arquivo_bruto`, `credito_lido`, `debito_lido`) não traz linha de B. `INSERT` em `credito_lido` com `empresa_id` de B, com A fixada, falha. Sem empresa fixada, as quatro voltam vazias.
- **Catálogo:** o teste de CA-37 da 034 passa a ver as quatro tabelas (conferir que elas aparecem na descoberta por `empresa_id`).
- **Chave estrangeira composta:** com o papel de migração, `arquivo_bruto` de A ligado a `consulta` de B é recusado; `credito_lido` de A ligado a `arquivo_bruto` de B é recusado.
- **`CHECK`:** `consulta` em `lida` sem `concluida_em` ou sem `finalizada_em` é recusada; estado de erro sem `finalizada_em` é recusado; estado fora da lista da AD-9 é recusado; `arquivo_bruto` `recusado` sem `motivo_recusa`, ou `aceito` com `motivo_recusa`, é recusado; `consulta_id` repetido em `arquivo_bruto` é recusado.
- **Permissões (CA-26, Banco › Permissões):** `creditogov_app` não tem `UPDATE` nem `DELETE` nas quatro tabelas (consulta ao catálogo `information_schema.role_table_grants`), e tem `SELECT` e `INSERT`.
- **`numeric(20,2)` (CA-23):** `12345678901234.56` gravado em `credito_lido.apurado` volta pelo Kysely como a string `"12345678901234.56"`; campo não gravado volta `null`.
- **`down`:** depois do `down` da `0002`, as quatro tabelas não existem e as da `0001` continuam.
- **Transação interna:** `naEmpresaInterna(A, fn)` (ou a função da 034 achada na task 1) vê só A e não fixa usuário. Uma busca nos arquivos de `src/api/` não encontra importação dela.
- Se `limpar.ts` da 034 tem lista fixa de tabelas, o teste confere que as quatro novas são limpas.

**Verificação:** falham porque não há a migração.

### 3. Migração `0002_dados_fiscais`, tipos e `naEmpresaInterna`

- `src/banco/migracoes/0002_dados_fiscais.ts` (no padrão da `0001`): as quatro tabelas com as colunas, `CHECK`, `UNIQUE (id, empresa_id)`, chaves estrangeiras compostas e o índice `(empresa_id, servico, criada_em DESC)` da Spec; `ENABLE` e `FORCE ROW LEVEL SECURITY` com `empresa_id = ANY(app_empresas())` em `USING` e `WITH CHECK`; `GRANT SELECT, INSERT` ao `creditogov_app`; o `down`.
- Tipos das tabelas novas em `banco/esquema.ts`, à mão como na 034. Valores `numeric` tipados como `string | null`.
- `naEmpresaInterna(empresaId, fn)` em `transacao.ts`, só se a task 1 não achou função equivalente.
- Ajuste de `limpar.ts`, se tiver lista fixa.

**Verificação:** testes da task 2 passam; `npm run migrar` aplica a `0002` no banco local, e o `down` desfaz sem tocar na `0001`.

### 4. Dependências do backend e cópia do núcleo e dos schemas do painel

- Dependências: `big.js`, `lossless-json`, `ajv` e `ajv-formats`, nas versões do `app/painel/package.json` (e `@types/big.js` em desenvolvimento).
- Cópia para `app/backend/src/leitura/` de `json.ts`, `dinheiro.ts`, `datas.ts`, `tabelas.ts`, `empresa.ts` e `validacao.ts` de `app/painel/src/nucleo/`. Cada arquivo traz no topo a origem (`app/painel/src/nucleo/<arquivo>`) e o commit da `main` de onde veio. Só mudam os imports. `validacao.ts` é copiado como está; a revisão do `multipleOf` é da task 6.
- Cópia de `app/painel/schemas/oficiais/` (os quatro schemas e o `versoes.json`) para `app/backend/schemas/oficiais/`, **sem alteração nenhuma**. A origem e o commit ficam num `README.md` dessa pasta, porque JSON não tem comentário. A leitura carrega os schemas por caminho relativo ao pacote, e funciona em `npm test` e depois de `npm run build`.
- Cópia dos testes correspondentes (`json`, `dinheiro`, `datas`, `tabelas`, `empresa`, `validacao`) e dos auxiliares `test/apoio/dv.ts` e `construtores.ts`, adaptados à regra de literais longos (chaves e CNPJs montados pelos auxiliares). Nenhum caso de teste é retirado; os que dependem de arquivo em `fixtures/` do painel trocam o arquivo por conteúdo montado pelos construtores.
- Não se copiam a interface de pasta, o cache por nome de arquivo, o servidor HTML nem os testes deles.

**Verificação:** os testes copiados passam; `git diff --stat main -- app/painel` vazio; a diferença de cada arquivo copiado para o original é só o cabeçalho e os imports (conferida com `git diff --no-index`).

### 5. Testes de `registrarLeitura`

Em `test/leitura/`, com o banco de teste, a empresa A fixada e conteúdos montados pelos construtores (o gerador da task 8 ainda não existe):

- **Aceito (CA-23, CA-24):** um retorno de créditos válido grava `arquivo_bruto` com `situacao = 'aceito'`, `sha256` e `tamanho` do conteúdo, `gerado_em` como veio, `versao_leitor = '033.1'`, `objeto` nulo, e uma linha em `credito_lido` por nota. Campo ausente fica `null`; `12345678901234.56` volta como texto igual, sem perda. O mesmo para débitos em `debito_lido`.
- **`ni` de 14 dígitos (D-2):** aceito como no painel, com a situação que o painel dá a essa tolerância (`aceito_com_divergencia`, se for o caso).
- **Estabelecimentos (CA-24, O-24):** notas de dois estabelecimentos da raiz de A entram como de A.
- **Recusas (CA-20):** conteúdo ilegível dá `recusado`/`ilegivel` e `gerado_em` nulo; campo fora do schema dá `fora_do_schema`; `ni` de outra raiz dá `outra_empresa`; valor com 19 dígitos inteiros dá `valor_fora_do_limite`. Em todas, nenhuma linha em `credito_lido`/`debito_lido`.
- **Múltiplo de 0,01 (DT-6):** `0.1`, `10`, `1234.56` e `99999999999999.99` aceitos; `0.001` e `1.005` recusados com `fora_do_schema`; um valor que o `multipleOfPrecision: 4` do painel aceitaria por arredondamento binário é recusado aqui.
- **Lotes:** um retorno com 1.201 notas grava as 1.201.
- **Retorno da função:** `{ arquivoId, situacao, motivo?, notas }` como no contrato.
- **Log (seção 8 da arquitetura):** com o pino num destino em memória, o log traz `consultaId`, situação, motivo e quantidade, e não contém nenhuma chave, CNPJ, valor nem trecho do conteúdo usados no teste.
- **Parte pura:** `interpretarRetorno(conteudo, servico, cnpjRaiz)` devolve a situação, o motivo e as notas já lidas, sem banco. É ela que os testes de indicadores usam a partir do gerador.

**Verificação:** falham.

### 6. Validação revisada e `registrarLeitura`

- `validacao.ts` revisado: ao carregar o schema, retira o `multipleOf` só da cópia em memória e confere cada valor monetário pelo texto com `big.js` (`valor × 100` inteiro). Confere também o limite de `numeric(20,2)`. Cabeçalho do arquivo registra a revisão.
- `src/leitura/registrar.ts` com `interpretarRetorno` (pura) e `registrarLeitura` (grava), nos sete passos da Spec, em lotes de 500.
- A constante `VERSAO_LEITOR = "033.1"`.

**Verificação:** testes da task 5 passam.

### 7. Testes do gerador fictício

Em `test/ficticios/`, sem banco:

- **Determinismo:** a mesma semente e o mesmo relógio dão o mesmo conteúdo, byte a byte.
- **Formato oficial:** cada retorno gerado passa por `interpretarRetorno` como `aceito` ou `aceito_com_divergencia` (`ni` de 14 dígitos), exceto os retornos que o cenário `recusado` gera de propósito.
- **Forma observada (cenário `completo`):** entre 850 e 950 créditos em 9 períodos, com mais da metade num só; os documentos 55, 57, 62, 65 e 91 presentes, com o 91 entre 10% e 20% e chave de 50 posições; ao menos 95% com `aApropriar` > 0; `apropriado` igual a `utilizado` em toda nota que tem os dois; `saldoCredor` presente e zero; uma nota emitida pela própria raiz; débitos em 3 períodos; nenhum campo com valor zero escrito (o zero vem ausente); números com 0 a 2 casas, escritos como texto JSON.
- **Dados fictícios (CA-26):** todo CNPJ de 14 dígitos que aparece (emitente na chave, `ni`) tem o DV do CNPJ inválido; toda chave de 44 posições tem o DV da chave válido.
- **Cenários:** existem os nove da Spec (`completo`, `sem-consulta`, `em-andamento`, `vazio`, `parcial`, `falha-com-anteriores`, `desatualizado`, `recusado`, `outros-valores`). Para cada um, a descrição gerada (consultas com estado, horários relativos ao relógio e retornos) é a da tabela "Cenários fictícios". Em `completo`, a segunda consulta traz versões novas de algumas notas, com `atualizacao` mais recente. Em `outros-valores`, há `suspenso`, `prescrito` e `pedidoRessarcimento` diferentes de zero, origens 20 e 30 e uma nota com `aApropriar` negativo.
- O gerador não lê disco, rede nem `process.env`.

**Verificação:** falham.

### 8. Implementar o gerador e os nove cenários

`src/ficticios/gerador.ts` e `src/ficticios/cenarios.ts`. Os cenários são dados (lista de consultas e retornos), sem banco: quem grava é o comando da task 16. Os auxiliares de DV vêm do `test/apoio/dv.ts` copiado, movidos para `src/ficticios/` (o teste passa a importar de lá).

**Verificação:** testes da task 7 passam.

### 9. Testes de consolidação e de emitente

Em `test/indicadores/`, sem banco:

- **Consolidação (CA-24, D-5):** a identidade é (`pa`, `chave`, `documento`, `origem`). Casos: a mesma nota em duas consultas conta uma vez; vence `atualizacao` mais recente, comparada como instante, com 0, 3 e 6 casas de fração (O-15); no empate, `gerado_em` mais recente; depois `recebido_em`; depois `arquivo_id` maior. Notas de arquivo `recusado` não entram. Mesma chave com `origem` diferente são duas notas. A função serve a créditos e débitos.
- **Emitente (CA-6 a CA-8, D-4):** os casos de `emitente.test.ts` do painel, **sem** o recolhimento: CNPJ certo nos documentos 55, 57, 62 e 65; em "não identificado": documento 91, chave de 50 posições, chave de 43 ou 45, modelo das posições 21–22 diferente do documento, DV da chave errado, nota avulsa (série 890 a 899), NFC-e com série 890 ou acima, CT-e com emitente começando em `000`; emitente com a raiz da empresa, de outro estabelecimento, em "própria empresa" (CA-8).
- **Emitente CPF (P-S1, aprovada):** NF-e de série 910 ou acima com CPF na chave dá o grupo de emitente com `documento: "cpf"` e o CPF de 11 dígitos.
- Nenhuma função recebe nome, razão social ou valor para decidir o emitente (CA-7): a assinatura é só a chave, o documento e a raiz da empresa.

**Verificação:** falham.

### 10. Implementar `consolidacao.ts` e `emitente.ts`

Em `src/indicadores/`, copiados de `app/painel/src/nucleo/` com o cabeçalho de origem e as mudanças da Spec (critério final `arquivo_id`; sem recolhimento). O emitente é calculado na hora, não gravado (DT-4). Nenhum import de banco, Fastify ou `process.env`.

**Verificação:** testes da task 9 passam; uma busca em `src/indicadores/` não encontra import de `kysely`, `fastify`, `pg` nem `process.env`.

### 11. Testes de `situacaoDoServico`

Com relógio falso e listas de consultas e arquivos montadas no teste:

- **CA-14:** `ultimaConcluidaEm` é o maior `concluida_em` entre as consultas `lida`, inclusive a de arquivo recusado; `atualizacao.de` e `.ate` são a menor e a maior data das notas consolidadas, em `AAAA-MM-DD` do texto do arquivo.
- **CA-15:** 8 × 24 h exatas depois da última concluída, `desatualizado` é falso; 8 × 24 h e 1 s, verdadeiro. `diasSemConsulta` em dias inteiros. Créditos desatualizados e débitos não, e o contrário.
- **CA-16:** sem consulta `lida`, `estado = 'sem_consulta'`; com uma em `abrindo`, `aberta`, `concluida` ou `baixada`, `emAndamento` verdadeiro; com só `agendada`, falso.
- **CA-17:** consulta lida, nenhuma nota e nenhum recusado dá `vazio`.
- **CA-18:** créditos `com_dados` e débitos `sem_consulta` na mesma chamada, cada um com o seu.
- **CA-19:** a mais recente das finalizadas (pela `criada_em`) em `credencial_invalida` dá `falha.tipo = 'credencial'` com `em = finalizada_em`; `erro`, `expirada`, `servico_indisponivel` e `aberta_sem_tiquete` dão `outra`; uma falha antiga seguida de uma `lida` não é falha. Com falha e consulta lida anterior, o estado continua `com_dados`.
- **CA-20:** um arquivo recusado e nenhuma nota dá `sem_dados_usaveis`; recusados com dados aceitos dão `com_dados` e `recusados = { quantidade, ultimoEm }`.
- **CA-21:** consultas de `recolhimentos` e `pagamentos` na lista não mudam nada no resultado.

**Verificação:** falham.

### 12. Implementar `situacao.ts`

Como na Spec. O `agora` é parâmetro, nunca `new Date()` dentro do módulo.

**Verificação:** testes da task 11 passam.

### 13. Testes de `indicadoresDeCredito` e `indicadoresDeDebito`

Com notas do gerador passadas por `interpretarRetorno` e pela consolidação. Em todo cenário com dados, salvo dito:

- **CA-1:** no `completo`, cada total de I-1 a I-5 é igual à soma do campo calculada no próprio teste, nota a nota, em `big.js`, com ausente valendo zero. Saída em texto com duas casas.
- **CA-2:** a resposta tem uma lista fechada de chaves (as do contrato); não há chave de soma, diferença ou proporção entre totais. Um caso em que `apurado` ≠ `apropriado` + `aApropriar` mostra `apurado` como veio.
- **CA-3:** no `completo`, `outros` é vazio; no `outros-valores`, só os campos com soma diferente de zero, cada um em item próprio. `excedente` entra com o mesmo tratamento (P-S2, aprovada).
- **CA-5:** `quantidadeNotas` e `quantidadeComAApropriar` conferidas no `completo`.
- **CA-6:** emitentes em ordem decrescente de total, empate pelo identificador; CNPJ sem formatação.
- **CA-9:** emitentes + demais + não identificado + própria empresa + negativos = I-2, ao centavo, em todos os cenários com dados, inclusive a nota negativa de `outros-valores` (linha "negativos" só nesse cenário, DT-10). Percentual conferido à mão num caso pequeno (por exemplo, 1,00 de 3,00 dá `"33.3"`; 1,00 de 8,00 dá `"12.5"`, arredondado meio para cima), e ausente quando I-2 é zero.
- **CA-10:** com `EMITENTES_NO_BLOCO + 3` emitentes, o bloco tem 5 emitentes (P-S3, valor provisório) e "demais" com 3 emitentes, a quantidade de notas e a soma do resto.
- **CA-11:** `porPeriodo` em ordem cronológica, inclusive na virada de ano (`12/2026` antes de `01/2027`), só períodos com nota, e a soma de cada coluna igual ao total.
- **CA-12:** com recorte de um `pa`, todos os blocos só têm notas dele; recorte sem nota dá `semNotasNoRecorte: true` sem totais.
- **CA-13:** débitos com `apurado`, `extinto` e `saldoDevedor` e a quantidade; nenhuma função recebe crédito e débito juntos.
- **CA-23:** `12345678901234.56` numa nota chega ao total como texto igual.
- **CA-25:** no `outros-valores`, `origens` lista 20 e 30 com o nome da tabela oficial e a quantidade; os valores entram com o sinal como veio.

**Verificação:** falham.

### 14. Implementar `creditos.ts` e `debitos.ts`

Em `src/indicadores/`, com `big.js` e a constante `EMITENTES_NO_BLOCO = 5` exportada (P-S3; muda se a transcrição do artboard disser outro número). Base nos módulos `saldo.ts`, `pendencias.ts` e `debitos.ts` do painel, com cabeçalho de origem.

**Verificação:** testes da task 13 passam.

### 15. Testes de `carregar-cenario`

Chamando a função do comando direto, com o banco de teste, e uma vez o processo `npm run admin`, só para os códigos de saída:

- **CA-26:** com `CREDITOGOV_AMBIENTE` `homologacao` ou `producao`, para com mensagem e não grava nada; empresa que já tem consulta é recusada; cenário desconhecido é recusado com a lista dos válidos; `npm run admin` não tem comando que leia arquivo do disco (a lista de comandos é conferida).
- Cada um dos nove cenários grava as consultas no estado da tabela da Spec, e cada retorno passa por `registrarLeitura` dentro de `naEmpresaInterna`. Conferências: `sem-consulta` não grava nada; `em-andamento` grava uma consulta `aberta` sem arquivo; `recusado` grava dois `arquivo_bruto` `recusado` (`outra_empresa` e `fora_do_schema`) e nenhuma nota deles; `desatualizado` grava `concluida_em` 9 dias antes do relógio.
- A saída do comando traz só o cenário, a empresa (`id`) e as quantidades; nenhum valor, chave ou CNPJ.

**Verificação:** falham.

### 16. Implementar `carregar-cenario`

Comando novo em `src/admin/`, no padrão dos comandos da 034, com o relógio injetável.

**Verificação:** testes da task 15 passam.

### 17. Testes das rotas de painel, pendências e notas

Com `fastify.inject`, sessões da 034 e empresas carregadas pela função de `carregar-cenario`:

- **Painel (CA-1 a CA-25):** `GET /api/empresas/:id/painel` no `completo` traz os totais iguais aos das funções da task 14, todos como `string` (`typeof`); a lista de chaves do JSON é exatamente a do contrato (CA-2, CA-13: nenhuma chave que combine crédito e débito). `creditos`/`debitos` são `null` fora de `com_dados` (`sem-consulta`, `vazio`, `parcial` em débitos). O `situacao` de cada cenário é o esperado.
- **Recorte (CA-12):** sem `periodo`, todos; com `periodo=AAAA-MM`, só aquele `pa` em créditos, pendentes, evolução e débitos; período sem débito dá `semNotasNoRecorte: true` no bloco de débitos; `periodo=2026-13`, `periodo=11/2026` e `periodo=abc` dão `400 periodo_invalido`.
- **CA-21:** consultas de `recolhimentos` e `pagamentos` gravadas para a empresa não mudam a resposta.
- **Pendências (CA-9, CA-10):** `GET .../pendencias` traz todos os grupos, sem "demais", e a soma deles é `totalAApropriar`; `null` fora de `com_dados`.
- **Notas (CA-10, P-8):** `GET .../pendencias/:grupo/notas` para um CNPJ, para `propria-empresa`, `nao-identificado` e `negativos`; 100 por página, do maior para o menor, empate pela chave; a soma das notas de todas as páginas é o total do grupo; grupo sem nota dá `404 grupo_nao_encontrado`; página 0 ou além da última dá `400 pagina_invalida`; grupo fora do formato dá `404 grupo_nao_encontrado`.
- **Isolamento (AD-6):** com A e B carregadas, o usuário só de A recebe `404 empresa_nao_encontrada` nas três rotas de B, com corpo igual ao de empresa inexistente; o painel de A não tem nada de B.
- **Cabeçalhos e log:** `Cache-Control: no-store`; o log da requisição tem `usuarioId`, `empresaId` e a duração, e não contém valor, CNPJ nem chave usados no teste.

**Verificação:** falham.

### 18. Implementar `paineis/dados.ts` e as três rotas

`src/paineis/dados.ts` (leitura dentro da transação recebida), as rotas com `rotaDeEmpresa` e `request.naEmpresa`, a validação de `periodo`, `grupo` e `pagina` por JSON Schema do Fastify, e o relógio injetável.

**Verificação:** testes da task 17 passam.

### 19. Testes da formatação de valores e datas na web

Em `app/web/test/formatacao/`:

- **CA-23:** `formatarReais("1234.5")` dá `R$ 1.234,50`; `("-0.01")` dá `-R$ 0,01`; `("12345678901234.56")` dá `R$ 12.345.678.901.234,56`; `("0")` dá `R$ 0,00`; entrada que não é texto decimal lança erro.
- `compararDecimal` ordena `"-1.00"`, `"0.00"`, `"9.99"`, `"10.00"` e `"12345678901234.56"` corretamente.
- Percentual `"14.8"` dá `14,8%`.
- Instante `2026-11-26T15:05:00.000Z` dá `26/11/2026 às 12:05` em `America/Sao_Paulo`; data `2026-11-21` dá `21/11/2026`; período `2026-11` dá `11/2026`.
- **Busca no código:** os arquivos de `src/formatacao/` e `src/paineis/` não contêm `Number(`, `parseFloat` nem `parseInt`.

**Verificação:** falham.

### 20. Implementar `src/formatacao/`

`dinheiro.ts` (`formatarReais`, `compararDecimal`, percentual) só por texto, como o `formatarReais` do painel, e `datas.ts` com `Intl.DateTimeFormat` no fuso fixo.

**Verificação:** testes da task 19 passam.

### 21. Testes da busca de dados

Com `fetch` simulado:

- as chaves de cache são `['painel', empresaId, periodo]`, `['pendencias', empresaId, periodo]` e `['notas', empresaId, grupo, periodo, pagina]` (CA-12: trocar o `periodo` faz nova busca; voltar ao anterior usa o cache);
- duas empresas não compartilham cache (AD-3);
- voltar à aba não busca de novo, e dentro de 5 minutos o mesmo recorte não busca de novo;
- `sair` do `ProvedorSessao` e um `401` em qualquer busca limpam o cache (`queryClient.clear()`);
- `sem_conexao` mostra o alerta "Sem conexão" com "Tentar de novo", e o botão refaz a busca.

**Verificação:** falham.

### 22. Implementar o cliente de cache e os ganchos de busca

`@tanstack/react-query` no `app/web`; o provedor no topo das rotas; ganchos `usePainel`, `usePendencias` e `useNotasDoGrupo` sobre o `api/cliente.ts` da 034; a limpeza ligada ao `sair` e ao tratamento de `401` do cliente.

**Verificação:** testes da task 21 passam.

### 23. Testes da Visão geral com dados

Respostas da API fictícias em `test/fixtures/painel.ts`, uma por cenário, escritas à mão a partir de "Contratos" da Spec, com valores redondos e CNPJs montados pelos auxiliares. Testes de `VisaoGeral` em `/e/:empresaId`:

- **CA-1:** cada cartão de I-1 a I-5 tem o rótulo da US, a nota e o nome oficial do campo (`apurado`, `aApropriar`, `apropriado`, `utilizado`, `saldoCredor`), e o valor formatado da resposta.
- **CA-2:** `textos.ts` e o HTML renderizado de cada fixture não contêm "disponível", "indisponível", "pode usar", "confirmado", "a receber", "garantido" (busca sem diferenciar maiúsculas e acentos). Nenhum número na tela que não esteja na resposta.
- **CA-3:** sem `outros`, o bloco não existe; com `outros`, uma linha por campo, com rótulo, nome oficial e valor.
- **CA-4:** a nota de I-2 está presente; nem `textos.ts` nem a tela contêm "não recolheu", "deixou de recolher" ou "inadimplente".
- **CA-5:** "N de M notas com valor a apropriar" e a quantidade de notas no cartão de I-1.
- **CA-6 a CA-10 (bloco):** CNPJ formatado `AA.AAA.AAA/AAAA-DD`, rótulo "CPF do emitente" para `cpf` (P-S1); a ordem da resposta preservada; "Demais emitentes (N)", "Emitida pela própria empresa", "Emitente não identificado" e, só quando vier, "Notas com valor a apropriar negativo"; a frase do percentual; "Ver todos os emitentes" leva a `/pendencias` com o `periodo`.
- **CA-11:** a tabela de evolução tem uma linha por período em `MM/AAAA`, as colunas com rótulo e nome oficial e a linha "Total" igual aos cartões.
- **CA-12:** o `SeletorRecorte` lista "Todos os períodos coletados" e os períodos da resposta; escolher um muda a URL para `?periodo=AAAA-MM`; o título mostra o recorte; sem `periodo` na URL, "Todos os períodos coletados" (P-7).
- **CA-13:** o bloco "Débitos de CBS (vendas)" fica depois dos créditos, com "Débito apurado", "Já extinto" e "Em aberto", os nomes oficiais, a quantidade e a frase de saldo líquido.
- **CA-22:** o aviso de só CBS aparece.
- **CA-25:** com `origens`, o aviso lista nome, código e quantidade; sem, não aparece.
- **Menu (DT-12):** "Visão geral", "Pendências" e "Pessoas"; não há "Créditos", "Débitos", "Consultas à Receita", "Recolhimentos" nem "Pagamentos".
- O teste da 034 da página provisória (`Inicio`) é substituído por estes; o do menu "Início" passa a esperar "Visão geral".

**Verificação:** falham.

### 24. Implementar a Visão geral

`src/paineis/textos.ts` com todos os textos da tabela "Textos" da Spec (valores provisórios de P-S3 até a transcrição do artboard); os componentes `SeletorRecorte`, `CartaoApurado`, `CartaoTotal`, `OutrosValores`, `PendentePorEmitente`, `EvolucaoPorPeriodo` (tabela, DT-11), `BlocoDebitos`, `AvisoOrigens`, `AvisoSoCbs` e o `Dinheiro` (só aceita texto decimal); a página `VisaoGeral` no lugar de `Inicio`; os itens do menu. Só classes `cg-` do `bundle.css` da 034, tema claro.

**Verificação:** testes da task 23 passam.

### 25. Testes dos estados dos dados

Com as fixtures de cada cenário:

- **CA-14:** por serviço, a última consulta concluída como `DD/MM/AAAA às HH:MM` e o intervalo de `atualizacao`; a frase fixa de CA-14.
- **CA-15:** com `desatualizado`, o alerta com os dias, por serviço, no topo da página; sem, não aparece.
- **CA-16:** `sem-consulta` e `em-andamento` não têm nenhum `R$` nos blocos de créditos e débitos; "Há uma consulta em andamento." só no segundo.
- **CA-17:** `vazio` mostra a mensagem com a data e nenhum `R$ 0,00` fora da própria frase.
- **CA-18:** `parcial` mostra os números de créditos e o estado de débitos, sem zero em débitos.
- **CA-19:** `parcial` mostra a falha de débitos com "Isso não depende de você."; `falha-com-anteriores` mostra os números, a data da consulta anterior, o aviso de não atualizados e o texto de credencial (DT-7, P-S4). O texto de credencial só aparece com `tipo: "credencial"`. Nenhuma tela de estado contém código HTTP, nome de estado interno (`credencial_invalida`, `sem_consulta` etc.) nem nome de campo técnico de erro.
- **CA-20:** `recusado` mostra o aviso com a quantidade e a data; `sem_dados_usaveis` mostra "Nenhum retorno de créditos pôde ser usado." sem `R$`.
- **CA-12 e CA-18:** `semNotasNoRecorte` mostra "Nenhum crédito neste período nas consultas feitas." sem `R$`.
- **CA-21:** nenhuma tela tem "recolhimento" ou "pagamento".
- **CA-22:** o aviso de só CBS aparece em todos os estados.
- **CA-2:** a busca de palavras proibidas roda também no HTML de cada estado.

**Verificação:** falham.

### 26. Implementar `SituacaoDados`, `EstadoServico` e os alertas

Os componentes e a montagem dos alertas no topo da página, com `cg-empty` e `cg-money is-na` (design 3.6) nos estados sem dados.

**Verificação:** testes da task 25 passam.

### 27. Testes de `Pendencias` e `NotasDoGrupo`

- **CA-9 e CA-10:** `/e/:id/pendencias` lista todos os grupos da resposta, cada um com quantidade, total e link para `/e/:id/pendencias/:grupo` preservando o `periodo`; a frase do percentual.
- **P-8:** `NotasDoGrupo` mostra período (`MM/AAAA`), chave (`cg-key`), emissão (`DD/MM/AAAA`), tipo de documento (nome oficial e código) e valor a apropriar; a paginação (`cg-pager`) muda `?pagina=` e preserva o `periodo`.
- `404 grupo_nao_encontrado` e `400 pagina_invalida` mostram mensagem de usuário, sem código.
- Créditos fora de `com_dados` mostram o mesmo estado da Visão geral.
- A busca de palavras proibidas (CA-2) roda nas duas telas.

**Verificação:** falham.

### 28. Implementar `Pendencias` e `NotasDoGrupo`

As duas páginas e as rotas em `rotas.tsx`, dentro do `LayoutEmpresa`.

**Verificação:** testes da task 27 passam.

### 29. README do backend e roteiro de conferência no navegador

- **`app/backend/README.md`:** como carregar os cenários (`criar-empresa` com raiz fictícia, `convidar`, aceitar o convite pelo e-mail local, `carregar-cenario`) e o que cada cenário mostra.
- **`app/web/README.md`, "Conferência no navegador":** uma empresa por cenário, cada estado da tabela de cenários e a comparação com os artboards "Dashboard" e "Dashboard — estados dos dados", em largura de desktop e com a janela estreita (blocos empilhados).

O Developer roda o roteiro e registra o resultado no commit. A conferência que vale é a do responsável, pedida pela sessão principal antes do PR.

**Verificação:** os comandos do README rodados; roteiro rodado.

### 30. `PROJECT_CONTEXT.md`, `AGENTS.md`, arquitetura §13 e `hipoteses.md`

Como em "Documentação" da Spec, sem a carteira (ela entra na task 38):

- **`docs/PROJECT_CONTEXT.md`:** §2 (dashboard construído, só com dados fictícios até o coletor), §4 (o que existe no backend: leitura, indicadores, `carregar-cenario`; e na web) e §11 (changelog).
- **`AGENTS.md`:** só a linha de `npm run admin -- carregar-cenario` na seção "Comandos".
- **`docs/arquitetura/README.md` §13:** AD-3 (TanStack Query, DT-5), AD-6 (as quatro tabelas e as colunas mínimas de `consulta`), AD-13 (múltiplo de 0,01 com `big.js`), AD-14 (leitura copiada para o `app/backend`).
- **`docs/produto/hipoteses.md`:** P-S1 (CPF do emitente mostrado, com a pergunta de LGPD ainda aberta para advogado) e P-S2 (`excedente` em I-6, significado para o tributarista). D-5 e D-6 continuam hipóteses.

**Verificação:** revisão; links abrem.

### 31. Verificação final do dashboard

- Os seis comandos passam.
- **Varreduras:**
  - o diff da branch contra a `main` só toca `app/backend`, `app/web` e os documentos das tasks 29 e 30 (e a pasta desta demanda);
  - `app/painel`, `app/apuracao-cbs` e `app/landing-page` sem alteração;
  - nenhum `.env`, `node_modules/`, `dist/` nem `.local/` versionado;
  - nenhum teste lê `.env` nem abre conexão fora de `127.0.0.1` (CA-26);
  - a varredura de literais longos da 034 passa;
  - nenhum CNPJ de 14 dígitos com DV válido em código, teste ou documento.
- `git status` limpo.

### 32. Testes de `linhaDaCarteira`

Em `test/indicadores/`, sem banco:

- **CA-C1:** a linha traz I-2, I-3 e I-4 de todos os períodos, iguais aos de `indicadoresDeCredito` sem recorte, só com créditos em `com_dados`; nos outros estados, os valores são `null` e o estado vem no lugar.
- **CA-C2 e DT-8:** o resumo segue a prioridade `falhou`, `sem_consulta`, `desatualizado`, `atualizado`, juntando créditos e débitos (créditos atualizados e débitos com falha dão `falhou`); a data é a mais antiga das duas últimas concluídas; sem concluída num dos serviços, `null`.
- **CA-C4:** o módulo não exporta função que receba mais de uma empresa e devolva valor somado (conferência da lista de exportações).

**Verificação:** falham.

### 33. Implementar `carteira.ts`

Em `src/indicadores/`, sobre `situacaoDoServico` e `indicadoresDeCredito`.

**Verificação:** testes da task 32 passam.

### 34. Testes de `GET /api/carteira`

- **CA-C1:** um usuário com três empresas (cenários `completo`, `vazio` e `falha-com-anteriores`) recebe as três, ordenadas por nome, cada uma com os próprios valores (como `string`) e o resumo; uma empresa sem vínculo dele não aparece; um vínculo removido some.
- **DT-9 (P-S5, aprovada):** a carteira responde para qualquer papel; um titular de duas empresas recebe as duas.
- **CA-C4:** a lista de chaves da resposta é exatamente a do contrato, sem campo de total.
- **Isolamento:** a transação usa `request.naCarteira`; os dados de uma empresa de outro usuário não aparecem.
- `Cache-Control: no-store`; o log não contém valor nem CNPJ.

**Verificação:** falham.

### 35. Implementar a rota da carteira

`GET /api/carteira` com `request.naCarteira`, lendo os dados por empresa com `paineis/dados.ts` e montando cada linha com `linhaDaCarteira`.

**Verificação:** testes da task 34 passam.

### 36. Testes da tela `Carteira`

Fixture fictícia de `GET /api/carteira` com empresas em cada resumo:

- **CA-C1:** cada linha tem nome, CNPJ raiz formatado, papel (para manter o CA-31 da 034, ver P-T1), "A apropriar (pendente)", "Apropriado" e "Já utilizado" com o nome oficial no cabeçalho, selo e data. Fora de `com_dados`, os valores dão lugar ao texto do estado (`cg-money is-na`), nunca `R$ 0,00`.
- **CA-C2:** ordenação padrão por nome; por I-2 (as sem valor no fim), com `compararDecimal`; pela data da última concluída (as sem consulta primeiro); os selos "Atualizado", "Consulta falhou", "N dias sem consulta" e "Sem consulta concluída".
- **CA-C3:** o clique na linha leva a `/e/:empresaId`, e a Visão geral mostra os valores da fixture do painel daquela empresa.
- **CA-C4:** a página não tem linha, cartão nem texto de total; o subtítulo da Spec aparece.
- Sem empresa, a mensagem da 034 e "Sair" continuam. A busca de palavras proibidas (CA-2) roda na tela.
- Os testes da 034 da lista de `EscolherEmpresa` são substituídos por estes, mantendo o que o CA-31 dela exige.

**Verificação:** falham.

### 37. Implementar `Carteira` em `/empresas`

`Carteira` e `LinhaCarteira` no lugar da lista de `EscolherEmpresa`, com a chave `['carteira']` no cache, limpa como as outras.

**Verificação:** testes da task 36 passam.

### 38. Documentação e verificação final da carteira

- `docs/PROJECT_CONTEXT.md`: §2 (carteira construída) e §3 (a decisão de P-6 e DT-9).
- `app/web/README.md`: a carteira no roteiro de conferência (um usuário ligado a todas as empresas de cenário), comparada com o artboard "Carteira do contador".
- Os seis comandos passam, e as varreduras da task 31 são repetidas.

**Verificação:** comandos e varreduras; roteiro rodado; `git status` limpo.

## Mapa CA → tasks

| CA | Testes | Implementação |
|---|---|---|
| CA-1 | 13, 17, 23 | 14, 18, 24 |
| CA-2 | 13, 17, 23, 25, 27 | 14, 18, 24 |
| CA-3 | 13, 23 | 14, 24 |
| CA-4 | 23 | 24 |
| CA-5 | 13, 23 | 14, 24 |
| CA-6 | 9, 13, 23 | 10, 14, 24 |
| CA-7 | 9 | 10 |
| CA-8 | 9 | 10 |
| CA-9 | 13, 17, 23, 27 | 14, 18, 24, 28 |
| CA-10 | 13, 17, 23, 27 | 14, 18, 24, 28 |
| CA-11 | 13, 23 | 14, 24 |
| CA-12 | 13, 17, 21, 23, 25 | 14, 18, 22, 24, 26 |
| CA-13 | 13, 17, 23 | 14, 18, 24 |
| CA-14 | 11, 25 | 12, 26 |
| CA-15 | 11, 25 | 12, 26 |
| CA-16 | 11, 15, 25 | 12, 16, 26 |
| CA-17 | 11, 15, 25 | 12, 16, 26 |
| CA-18 | 11, 15, 25 | 12, 16, 26 |
| CA-19 | 11, 15, 25 | 12, 16, 26 |
| CA-20 | 2, 5, 11, 15, 25 | 3, 6, 12, 16, 26 |
| CA-21 | 11, 17, 25 | 12, 18, 26 |
| CA-22 | 23, 25 | 24, 26 |
| CA-23 | 2, 4, 5, 13, 17, 19 | 3, 4, 6, 14, 18, 20 |
| CA-24 | 2, 5, 9 | 3, 6, 10 |
| CA-25 | 13, 23 | 14, 24 |
| CA-26 | 2, 7, 15, 31 | 3, 8, 16 |
| CA-C1 | 32, 34, 36 | 33, 35, 37 |
| CA-C2 | 32, 36 | 33, 37 |
| CA-C3 | 36 | 37 |
| CA-C4 | 32, 34, 36 | 33, 35, 37 |
| Isolamento (AD-6) | 2, 17, 34 | 3, 18, 35 |

## O que fica bloqueado

- **Pela 034:** todas as tasks, de 1 a 38. Esta lista pode ser aprovada antes; a task 1 só começa com a 034 na `main` e nesta branch.
- **Pela transcrição dos artboards (P-S3 da Spec):** nada bloqueia. Os valores provisórios (5 emitentes, textos da Spec, evolução em tabela) valem até a transcrição. Se ela chegar durante a implementação, entra em `textos.ts` e em `EMITENTES_NO_BLOCO`, com os testes das tasks 13, 23, 25 e 36 ajustados no mesmo commit.
- **Pelas peças da 031 sem demanda** (coletor, armazenamento de objetos, cadastro de credencial): nada nesta lista. Os dados vêm só dos cenários fictícios.

## Perguntas em aberto

- **P-T1 (texto, só a task 36): papel na linha da carteira.** A tabela de componentes da Spec não lista o papel em `LinhaCarteira`, mas o contrato de `GET /api/carteira` traz `papel`, e o CA-31 da 034 exige nome, CNPJ raiz formatado e papel na lista de `/empresas`, que a carteira substitui. Recomendação: mostrar o papel como texto secundário abaixo do nome, como na lista da 034, para não quebrar o CA-31 dela. Se o artboard "Carteira do contador" não tiver o papel, a decisão volta ao responsável.

## Conferência da 034

Preenchida pelo Developer na task 1.

| Item da Spec | Nome esperado | Nome e arquivo reais | Bate? |
|---|---|---|---|
| Transação por empresa e carteira | `naEmpresa`, `naCarteira`, `naSessaoDoUsuario`, `semUsuario`, `EmpresaNaoEncontrada` | Iguais, em `src/banco/transacao.ts` (interface `Banco`, criada por `criarBanco`) | Sim |
| Fixação de empresa por `id`, sem usuário | `naEmpresaInterna(empresaId, fn)` (só se a 034 não tivesse) | **`naEmpresaFixada(empresaId, fn)`** em `transacao.ts`: fixa só `app.empresas`, sem usuário; usada por `admin/comandos.ts` e `convites/servico.ts`. A task 3 **não cria** `naEmpresaInterna`; onde a lista diz `naEmpresaInterna`, vale `naEmpresaFixada`. O teste de "nenhum módulo de `src/api/` importa" passa a olhar `naEmpresaFixada` fora de `src/convites/` (ver desvio no relatório) | Nome mudou, sentido igual |
| Migração `0001` | `empresa` (`cnpj_raiz`), `vinculo_empresa`, `app_empresas()`, `app_usuario()`, papéis `creditogov_migracao` e `creditogov_app` | `src/banco/migracoes/0001_inicial.ts` (nome `0001_inicial`); tabelas e funções como na Spec; papéis em `banco/init/01-papeis.sql`. Provedor estático em `src/banco/migrar.ts`: a `0002` entra lá | Sim |
| `rotaDeEmpresa`, `request.naEmpresa`, `request.naCarteira`, erro 404 | idem | `app.rotaDeEmpresa` (hook `onRequest`) em `src/api/servidor.ts`; `request.naEmpresa(fn)` com `(trx, ctx)`, `request.naCarteira(fn)`; erro `404 empresa_nao_encontrada` com `{erro, mensagem}` | Sim |
| Relógio injetável e configuração em código | relógio na fábrica e no `admin`; testes montam a configuração | `criarServidor({config, banco, email, relogio})`; `criarComandosAdmin({banco, email, relogio, config})`; `carregarConfig(env)` recebe objeto; `test/api/ajudas.ts` (`criarContexto`) monta tudo com relógio falso. `CREDITOGOV_AMBIENTE=producao` já é recusado pela configuração; `homologacao` é aceito | Sim |
| `npm run admin`: registrar comando novo | método em `ComandosAdmin` | Método em `criarComandosAdmin` (`src/admin/comandos.ts`), mais `case` e opção em `src/admin/main.ts` (`parseArgs`) e linha em `USO` | Sim |
| Banco de teste | `preparar.ts`, `limpar.ts`, teste de catálogo CA-37 | `test/banco/preparar.ts` (recria o banco e migra), `limpar.ts` com **lista fixa** `TABELAS` (a task 3 acrescenta as quatro novas) e `semear`; `test/banco/isolamento.test.ts` tem o catálogo, que descobre tabelas por `empresa_id` sozinho | Sim (lista fixa em `limpar.ts`) |
| Varredura de literais longos | exceção só de `12345678901234.56` | `test/varredura.test.ts`: recusa `\d{11,}` em `src/` e `test/`, com a exceção `12345678901234.56` **só** em `test/banco/isolamento.test.ts`. A 033 monta o valor por função auxiliar, sem pedir exceção nova | Sim |
| `app/web`: layout e hooks | `LayoutEmpresa`, `BarraTopo`, `useEmpresaEmFoco()`, `ProvedorSessao.sair` | Iguais (`componentes/`, `sessao/`). `BarraTopo` tem `NavLink` "Início" (`/e/:id`, `end`) e "Pessoas" no `cg-topnav`. `sair()` devolve `Promise<boolean>` | Sim |
| `api/cliente.ts` | resultado tipado, `sem_conexao`, `401` | `requisitar<T>(metodo, caminho, {corpo, logada})` devolve `ok`, `erro` ou `sem_conexao`; `401` com `logada` chama `definirAoPerderSessao`. `AlertaDeRede` mostra "Sem conexão" e "Tentar de novo" | Sim |
| `rotas.tsx`, `Inicio`, `EscolherEmpresa` | idem | `rotasApp`; `/empresas` = `EscolherEmpresa` (lista com nome, CNPJ raiz formatado e papel, CA-31); `/e/:empresaId` = `LayoutEmpresa` com `Inicio` (índice) e `Pessoas`. Testes da 034 em `test/areaLogada.test.tsx` | Sim |
| Textos da 034 dentro do layout e palavras de CA-2 | nenhuma palavra proibida na barra e no menu | Barra e menu ("Início", "Pessoas", "Sair", "Trocar empresa", "Carregando…", "Empresa não encontrada ou sem acesso") não têm as palavras. Fora do layout do dashboard: `Inicio.tsx` ("disponível", substituída pela 033) e `Pessoas.tsx` ("indisponível", tela da 034 que a 033 não toca; o teste de CA-2 da 033 não a renderiza) | Sim |

Comandos na branch (antes de qualquer alteração): `app/backend` com `npm run banco:subir`, `npm test` (216 passam), `npm run lint` e `npm run build`; `app/web` com `npm test` (113 passam), `npm run lint` e `npm run build`. Todos passam.

**Aprovação (2026-11-27):** o responsável aprovou as Tasks com a recomendação de P-T1 (o papel aparece como texto secundário abaixo do nome na linha da carteira). A implementação espera a 034 na `main`.
