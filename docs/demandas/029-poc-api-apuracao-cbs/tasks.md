# 029-poc-api-apuracao-cbs — Tasks

Pequenas, ordenadas, um commit por task. Cada task cita a seção da Spec e como será verificada. A Spec aprovada (commit `d0f405d`, com as decisões D-1 e D-2) é a referência; onde esta lista e a Spec divergirem, vale a Spec e a divergência volta para a sessão principal.

**Testes primeiro:** para cada módulo, a task de testes vem antes da task de código, e os testes dela **falham** quando são commitados (por falta do módulo ou do comportamento). A task seguinte implementa até passarem. Todo CA-N tem ao menos um teste ou uma verificação manual (mapa no fim).

**Regras para o Developer em todas as tasks:**

- Trabalhar só em `app/apuracao-cbs/` e nos documentos citados nas tasks 29 a 33. Nenhuma task toca `app/landing-page`.
- **Não chamar a API real, não pedir nem receber credencial, não criar `.env`** e não rodar `npm run consulta`. A chamada real é a task 35, manual.
- Comandos rodados em `app/apuracao-cbs`, salvo indicação: `npm test`, `npm run lint`, `npm run build`. A partir da task 10, os três passam ao fim de cada task de implementação; numa task de testes, só os testes novos falham e lint passa.
- Antes de cada commit: `git status`, conferir cada arquivo, nada de `node_modules/`, `dist/`, `.local/` ou `.env`.
- Mensagens de commit no padrão do projeto: `chore(apuracao-cbs): ...`, `test(apuracao-cbs): ...`, `feat(apuracao-cbs): ...`, `docs(029): ...`.

| # | Task | Spec | CA | Verificação | Status |
|---|---|---|---|---|---|
| 1 | Estrutura da aplicação, `.gitignore` com `.local/` e bloqueio de rede nos testes | Decisões técnicas; Aplicação nova; Pasta local; Garantias gerais | CA-12, CA-16, CA-18 | `npm install`; `npm test` (1 teste passa); `npm run lint`; `git check-ignore` | ☐ |
| 2 | `.env.example` | `.env.example`; Configuração | CA-12, CA-13, CA-17 | comandos de conferência abaixo | ☐ |
| 3 | Testes das cópias oficiais dos schemas (`sha256` = `versoes.json`) | Validação › Cópias versionadas | CA-6, CA-20 | falham (cópias ainda não existem) | ☐ |
| 4 | Baixar as quatro cópias oficiais, `versoes.json` e `.gitattributes` | Validação › Cópias versionadas | CA-6, CA-20 | testes da task 3 passam; segundo download confere | ☐ |
| 5 | Testes das fixtures fictícias | Dados fictícios | CA-14 | falham (fixtures ainda não existem) | ☐ |
| 6 | Fixtures das quatro consultas | Dados fictícios | CA-14 | testes da task 5 passam | ☐ |
| 7 | Testes de `json.ts` e `dinheiro.ts` | Leitura sem perda e dinheiro | CA-8 | falham | ☐ |
| 8 | Implementar `json.ts` e `dinheiro.ts` | Leitura sem perda e dinheiro | CA-8 | testes da task 7 passam | ☐ |
| 9 | Testes de `redacao.ts` e `config.ts` | Redação; Configuração; `.env.example` | CA-12, CA-13 | falham | ☐ |
| 10 | Implementar `redacao.ts` e `config.ts` | Redação; Configuração | CA-12, CA-13 | testes da task 9 passam; lint e build passam | ☐ |
| 11 | Testes de `servicos.ts` e `registro.ts` | Catálogo; Registro de chamadas | CA-15, CA-24, CA-25 | falham | ☐ |
| 12 | Implementar `servicos.ts` e `registro.ts` | Catálogo; Registro de chamadas | CA-15, CA-24, CA-25 | testes da task 11 passam | ☐ |
| 13 | Testes de `erros.ts` e `token.ts` | Cliente de token; Erros | CA-4, CA-12, CA-23 | falham | ☐ |
| 14 | Implementar `erros.ts` e `token.ts` | Cliente de token; Erros | CA-4, CA-12, CA-23 | testes da task 13 passam | ☐ |
| 15 | Apoio dos testes (API simulada, relógio, saída) e testes de `api.ts` | Cliente das APIs; Garantias gerais | CA-1, CA-4, CA-15, CA-16 | falham | ☐ |
| 16 | Implementar `api.ts` | Cliente das APIs | CA-1, CA-4, CA-15 | testes da task 15 passam | ☐ |
| 17 | Testes de `acompanhamento.ts` | Acompanhamento | CA-2, CA-3, CA-4 | falham | ☐ |
| 18 | Implementar `acompanhamento.ts` | Acompanhamento | CA-2, CA-3, CA-4 | testes da task 17 passam | ☐ |
| 19 | Testes de `armazenamento.ts` e `validacao.ts` | Guarda do arquivo bruto; Validação | CA-5, CA-6, CA-8 | falham | ☐ |
| 20 | Implementar `armazenamento.ts` e `validacao.ts` | Guarda do arquivo bruto; Validação | CA-5, CA-6, CA-8 | testes das tasks 3 e 19 passam | ☐ |
| 21 | **Créditos:** testes do leitor, do resumo e do comando (`cli`) | Comandos; Leitores › Créditos; Mapa CA | CA-1, CA-3, CA-5, CA-6, CA-7, CA-9, CA-10, CA-12, CA-24, CA-25 | falham | ☐ |
| 22 | **Créditos:** implementar `leitores/creditos.ts`, `saida.ts`, `cli.ts` e `main.ts` | Comandos; Leitores › Créditos | os da task 21 | testes da task 21 passam; lint e build | ☐ |
| 23 | **Recolhimentos:** testes do leitor, do resumo e do comando | Leitores › Recolhimentos | CA-1, CA-3, CA-5, CA-9, CA-10, CA-11 | falham | ☐ |
| 24 | **Recolhimentos:** implementar `leitores/recolhimentos.ts` e o resumo | Leitores › Recolhimentos | os da task 23 | testes da task 23 passam | ☐ |
| 25 | **Pagamentos:** testes do leitor, do resumo e do comando (inclui RAD com vencimento só data) | Leitores › Pagamentos; Riscos; D-1 | CA-1, CA-3, CA-5, CA-6, CA-9, CA-10, CA-21 | falham | ☐ |
| 26 | **Pagamentos:** implementar `leitores/pagamentos.ts` e o resumo | Leitores › Pagamentos | os da task 25 | testes da task 25 passam | ☐ |
| 27 | **Débitos:** testes do leitor, do resumo e do comando; rótulos das quatro consultas | Leitores › Débitos; Rótulos | CA-1, CA-3, CA-5, CA-9, CA-10, CA-22 | falham | ☐ |
| 28 | **Débitos:** implementar `leitores/debitos.ts` e o resumo; retirar o estado intermediário do `cli` | Leitores › Débitos | os da task 27 | todos os testes passam; lint e build | ☐ |
| 29 | README da aplicação com comandos, roteiro da chamada real e revogação da credencial | Roteiro da chamada real; Riscos | CA-17 | revisão contra a Spec | ☐ |
| 30 | `AGENTS.md` (comando de teste e comandos) e `.claude/fluxo.json` (`apps`) | Implantação › Mudanças no repositório | CA-17 | revisão; JSON válido | ☐ |
| 31 | `docs/PROJECT_CONTEXT.md` (§2, §4, §7, §11) | Implantação › Mudanças no repositório | — | revisão | ☐ |
| 32 | Referência `docs/referencias/apuracao-cbs/README.md`: fontes, token, ambientes e divergências já conferidos | Fontes lidas; Divergências; Documentação e configuração do repositório | CA-20 | revisão contra a Spec | ☐ |
| 33 | `docs/produto/hipoteses.md`, H1: o que já tem fonte pública | Documentação e configuração do repositório | CA-19 (parte documental) | revisão | ☐ |
| 34 | Verificação de fechamento | Estratégia de verificação › Comandos | CA-12, CA-16, CA-18 | comandos abaixo; sem commit, salvo correção | ☐ |
| 35 | **Manual — usuário + sessão principal:** chamada real e registro das respostas observadas | Roteiro da chamada real; D-1; D-2 | CA-1, CA-2, CA-3, CA-19, CA-23 | roteiro, passos 1 a 9 | ☐ |

## Detalhe das tasks

### 1. Estrutura da aplicação

Criar `app/apuracao-cbs/` com:

- `package.json`: `"name": "apuracao-cbs"`, `"private": true`, `"type": "module"`, `"engines": { "node": ">=24" }`, os cinco scripts da Spec (`build`, `lint`, `test`, `consulta`, `ler`) exatamente como na tabela "Scripts do `package.json`". Dependências de execução: `ajv`, `ajv-formats`, `big.js`, `lossless-json`. De desenvolvimento: `typescript` (`~6.0`), `@types/node` (24), `@types/big.js`, `vitest`, `oxlint`. Nenhuma outra.
- `package-lock.json` gerado pelo `npm install`.
- `tsconfig.json`: `include` só `src/`, `outDir` `dist`, `module`/`moduleResolution` `nodenext`, `strict: true`.
- `vitest.config.ts` com `setupFiles: ["test/setup.ts"]`.
- `.oxlintrc.json` (pode partir do da landing).
- `.gitignore` com a linha `.local/`.
- `test/setup.ts`: troca `globalThis.fetch` por uma função que lança "rede bloqueada nos testes".
- `test/rede.test.ts`: confere que o `fetch` global é o bloqueador (chamá-lo rejeita com essa mensagem).

Verificação:

```bash
cd app/apuracao-cbs
npm install
npm test        # 1 teste, passa
npm run lint    # sem erros
cd ../..
git check-ignore -v app/apuracao-cbs/.local/x   # aponta app/apuracao-cbs/.gitignore, regra .local/
git check-ignore -v app/apuracao-cbs/.env       # aponta a regra .env do .gitignore da raiz
git status                                      # sem node_modules/ nem dist/
```

`npm run build` ainda não é exigido (não há arquivo em `src/`); passa a ser a partir da task 10.

### 2. `.env.example`

Copiar o bloco `.env.example` da Spec, com as nove variáveis, os comentários e as fontes, **sem nenhum valor**. Verificação:

```bash
grep -cE '^APURACAO_[A-Z_]+=$' app/apuracao-cbs/.env.example   # 9
grep -nE '^APURACAO_[A-Z_]+=.+' app/apuracao-cbs/.env.example  # nada
```

Os endereços aparecem só nos comentários, cada um com a fonte. A task 9 acrescenta um teste que amarra o arquivo à configuração.

### 3. Testes das cópias oficiais

Em `test/validacao.test.ts`, um bloco "cópias oficiais" que:

- lê `schemas/oficiais/versoes.json`;
- exige exatamente quatro entradas: `credito-retorno.schema.json`, `recolhimento-retorno.schema.json`, `pagamento-retorno.schema.json`, `debito-retorno.schema.json`;
- para cada uma, exige os campos `url`, `versaoSchema`, `pagina`, `versaoPagina`, `lidoEm`, `sha256`, confere que `url` é `https://docs.receitafederal.gov.br/apuracao-cbs/schemas/<nome>` e que o SHA-256 dos bytes do arquivo (`node:crypto`, sem normalizar fim de linha) é igual ao `sha256` registrado;
- confere que cada cópia é JSON com `$schema` de Draft 2020-12.

Falha no commit porque `schemas/oficiais/` ainda não existe.

### 4. Cópias oficiais dos schemas

Baixar byte a byte, sem editar, para `app/apuracao-cbs/schemas/oficiais/`:

| Arquivo | URL | Página | Versão da página (Spec) | Versão do schema (Spec) |
|---|---|---|---|---|
| `credito-retorno.schema.json` | `https://docs.receitafederal.gov.br/apuracao-cbs/schemas/credito-retorno.schema.json` | `credito.html` | 1.3 (13/11/2026) | 1.0.0 |
| `recolhimento-retorno.schema.json` | `https://docs.receitafederal.gov.br/apuracao-cbs/schemas/recolhimento-retorno.schema.json` | `recolhimentos.html` | 1.3 (13/11/2026) | 1.0.0 |
| `pagamento-retorno.schema.json` | `https://docs.receitafederal.gov.br/apuracao-cbs/schemas/pagamento-retorno.schema.json` | `pagamentos.html` | 1.3 (13/11/2026) | 1.0.0 |
| `debito-retorno.schema.json` | `https://docs.receitafederal.gov.br/apuracao-cbs/schemas/debito-retorno.schema.json` | `debito.html` | 1.3 (13/11/2026) | 1.0.0 |

Como baixar e conferir:

```bash
cd app/apuracao-cbs/schemas/oficiais
for n in credito-retorno recolhimento-retorno pagamento-retorno debito-retorno; do
  curl -fsS -o "$n.schema.json" "https://docs.receitafederal.gov.br/apuracao-cbs/schemas/$n.schema.json"
done
sha256sum *.schema.json   # ou: node -e "const c=require('node:crypto'),f=require('node:fs');for(const n of process.argv.slice(1))console.log(c.createHash('sha256').update(f.readFileSync(n)).digest('hex'),n)" *.schema.json
```

- Gravar os hashes em `versoes.json`, uma entrada por arquivo, com `url`, `versaoSchema` (como declarada na página), `pagina`, `versaoPagina`, `lidoEm` (data do download, `AAAA-MM-DD`) e `sha256`.
- **Conferência independente:** baixar de novo as quatro URLs para uma pasta temporária fora do repositório e comparar o `sha256` com o de `versoes.json`. Os dois downloads têm de bater. Na revisão, o Reviewer repete esse segundo download.
- Abrir cada página (`credito.html` etc.) e confirmar a versão da página e a do schema. **Se alguma versão for diferente da tabela acima**, parar e informar a sessão principal: a Spec foi escrita contra essas versões.
- Se o download falhar ou for negado, parar e informar. Não reescrever o schema à mão.
- Criar `app/apuracao-cbs/.gitattributes` com `schemas/oficiais/*.json -text`, para o git não converter fim de linha no Windows e o `sha256` continuar batendo depois do checkout. É o que garante a "cópia byte a byte" da Spec.

Verificação: `npm test` com os testes da task 3 passando; `git diff --stat` mostra só os quatro schemas, `versoes.json` e `.gitattributes`.

### 5. Testes das fixtures

`test/fixtures.test.ts`:

- exige que existam os arquivos listados na task 6 (falha enquanto não existirem);
- percorre `test/fixtures/` e falha se algum valor de `niConsumidor`, `niFornecedor`, `niAdquirente` ou `niContribuinte` com 14 dígitos tiver DV de CNPJ válido, ou se alguma `chave`/`chaveDFE` não começar com `FICT`;
- falha se algum NI de 11 dígitos tiver DV de CPF válido (o schema pode aceitar CPF em `niConsumidor`);
- confere que o CNPJ base usado nas fixtures, quando aparecer, é `12345678`.

### 6. Fixtures das quatro consultas

Escritas à mão a partir dos schemas da task 4, com os dados fictícios da Spec (CNPJ base `12345678`, NIs como `12345678000100`, chaves `FICT-...`, tíquetes de texto fictício):

| Pasta | Arquivos |
|---|---|
| `test/fixtures/creditos/` | `valido.json` (dois períodos, valores com centavos, um crédito sem `aApropriar` e outro sem `apropriado`); `vazio.json` (`apuracao: []`); `invalido-obrigatorio.json` (campo obrigatório ausente); `invalido-tres-casas.json` (valor com 3 casas decimais) |
| `test/fixtures/recolhimentos/` | `valido.json` (itens com e sem `chaveDFE`, dois períodos); `vazio.json`; `invalido.json` |
| `test/fixtures/pagamentos/` | `valido.json` (um RAD com `vencimento` em `date-time` e um PCONT; um pagamento com itens de dois períodos); `vazio.json`; `rad-vencimento-data.json` (vencimento só data, como o exemplo oficial; deve falhar no schema: divergência 3) |
| `test/fixtures/debitos/` | `valido.json` (dois períodos, um débito sem `extinto`); `vazio.json`; `invalido.json` |

Os totais esperados de cada `valido.json` ficam escritos nos testes das tasks 21 a 27, calculados à mão. Verificação: testes da task 5 passam. A validade contra o schema é conferida na task 19.

### 7 e 8. `json.ts` e `dinheiro.ts`

Testes (`test/json.test.ts`, `test/dinheiro.test.ts`), conforme "Leitura sem perda e dinheiro" e o mapa (CA-8):

- `lerSemPerda`: todo número chega como o texto original (inclui `12345678901234.56` e `0.10` sem virar `0.1`);
- `valor(undefined)` = 0; `somar(["0.10","0.20"])` = `0.30`; soma de uma lista com centavos e de valores com 16 dígitos inteiros bate ao centavo;
- `formatar`: `1234.5` → `1.234,50`; negativo; zero; valor de 16 dígitos;
- um teste que procura em `src/dinheiro.ts` e `src/leitores/` por `parseFloat` e falha se achar.

Implementação na task 8. Verificação: `npm test`.

### 9 e 10. `redacao.ts` e `config.ts`

Testes (`test/redacao.test.ts`, `test/config.test.ts`):

- `criarRedator`: troca por `***` cada segredo registrado (client id, segredo, token, `urlAssinada` fictícios da Spec), inclusive mais de uma ocorrência e segredo dentro de URL;
- `lerConfig` com objeto montado no teste (nunca `process.env`): cada variável obrigatória ausente aparece **pelo nome** no erro, e o erro não contém nenhum valor fornecido; `APURACAO_URL_TOKEN` ou `APURACAO_URL_BASE` ausente dá erro (sem padrão); URL `http:` recusada; barra final da base removida; `APURACAO_TOKEN_CREDENCIAIS` só `basic` ou `corpo`; `APURACAO_CNPJ_BASE` só 8 dígitos; intervalo < 60 recusado, padrão 300; espera máxima padrão 250; `APURACAO_TOKEN_SCOPE` vazia = ausente;
- os nomes de `.env.example` são exatamente as nove variáveis que `lerConfig` conhece, todas sem valor;
- varre `src/` e falha se achar `receitafederal.gov.br` (CA-13).

Implementação na task 10. A partir daqui `npm run build` passa.

### 11 e 12. `servicos.ts` e `registro.ts`

Testes (`test/servicos.test.ts`, `test/registro.test.ts`):

- catálogo com exatamente `creditos`, `recolhimentos`, `pagamentos`, `debitos`, cada um com o caminho e o schema da tabela "Catálogo"; nome fora da lista não é encontrado (inclui `todas`);
- varre `src/` e falha se achar `/rad` ou `/pcont` como caminho (CA-15);
- `registrar` grava uma linha JSON por chamada, em acréscimo, com **exatamente** `quando`, `servico`, `tipo`, `http`, `tiquete`; `quando` com fuso local; `http: null` sem resposta; `tiquete: null` no token;
- passando objetos com token, segredo, `urlAssinada` ou corpo, nada disso chega ao arquivo;
- `contarAberturas(servico, dia)` por dia local, com total e aceitas (2xx); `pedidosDeTokenDesde(instante)`; `primeiraAbertura(tiquete)`;
- pasta local temporária por teste.

Implementação na task 12.

### 13 e 14. `erros.ts` e `token.ts`

Testes (`test/token.test.ts`, `test/erros.test.ts`), com `fetch` simulado injetado, conforme "Cliente de token" e "Erros" e o mapa (CA-23, CA-4):

- `basic`: cabeçalho `Authorization: Basic base64(urlencode(id):urlencode(segredo))`, corpo exatamente `grant_type=client_credentials`; `corpo`: corpo com os três campos e **sem** `Authorization`; `Content-Type` e `Accept` exatos; `scope` só se configurado;
- `access_token` ausente = erro; sem `expires_in`, assume 3600 e avisa; saída mostra "válido por N s", nunca o token;
- segunda execução (novo cliente, mesma pasta) reutiliza o cache sem chamar; cache a menos de 120 s do fim, de outra credencial ou de outro endereço pede novo;
- com 2 pedidos de token na última hora no registro, recusa **sem chamar** e informa o horário HH:MM em que pode pedir de novo; renovação durante espera longa respeita o limite;
- 400/401 no token: mensagem do CA-4, sem nova tentativa, informa quantos pedidos restam na hora; `descartar()` apaga o cache;
- `ErroApi` não guarda cabeçalhos, corpo enviado, token nem `urlAssinada`; mostra `codigoErro`/`mensagemErro` só de corpo JSON com esses campos; outro corpo não aparece; toda mensagem passa pelo redator; com tíquete, termina com o comando de retomada.

Implementação na task 14.

### 15 e 16. Apoio dos testes e `api.ts`

`test/apoio/`: API simulada por roteiro (sequência de respostas por chamada, registro de cada pedido feito), relógio falso, `dormir` falso que só registra a espera pedida, saída capturada, pasta temporária, config fictícia com os segredos da Spec e URLs em `exemplo.invalid`.

Testes (`test/api.test.ts`), conforme "Cliente das APIs" e o mapa:

- `abrir`: `POST {base}/{servico}/12345678` para cada uma das quatro consultas, cabeçalhos exatos, corpo exatamente `{"urlRetorno":""}`; 201 e outro 2xx aceitos com o código real registrado; sem `tiqueteSolicitacao` = erro;
- `situacao` e `linkDownload`: caminhos com `encodeURIComponent` do tíquete;
- `baixarArquivo`: GET **sem nenhum cabeçalho**, devolve os bytes;
- 400, 401, 403, 404, 429, 500 e outro código em abertura, situação e download, com a mensagem do CA-4; 401 descarta o cache do token; 404 no download = `ARQUIVO_INDISPONIVEL`; 429 mostra as aberturas do dia;
- `urlAssinadaExpiraEm` no passado não baixa; 403 ou 400 no GET do arquivo = vencida; erro de rede e tempo esgotado com `http: null` no registro;
- em todo erro, a API simulada confirma que não houve nova abertura nem novo token; a `urlAssinada` não aparece em saída, registro nem mensagem.

Implementação na task 16.

### 17 e 18. `acompanhamento.ts`

Testes (`test/acompanhamento.test.ts`), conforme "Acompanhamento" (CA-2, CA-3, CA-4):

- mostra serviço, tíquete e estimativa em minutos e segundos; `-1` = "sem estimativa"; na retomada, "estimativa não disponível na retomada";
- primeira espera `max(60, min(tEASegundos, intervalo))` com `tEASegundos > 0`, senão `intervalo`; as seguintes, `intervalo` (conferido no `dormir` falso);
- mostra a primeira situação e cada mudança, com horário, e não repete situação igual;
- `CONCLUIDA` devolve; `ERRO` e `EXPIRADA` encerram com `codigoErro` e `mensagemErro`; situação desconhecida = "situação não documentada: X";
- passada a espera máxima, para com código 1 e o comando de retomada `npm run consulta -- <servico> --tiquete <tiquete>`;
- tempo de processamento da abertura registrada até a primeira `CONCLUIDA`, inclusive na retomada.

Implementação na task 18.

### 19 e 20. `armazenamento.ts` e `validacao.ts`

Testes (`test/armazenamento.test.ts` e o restante de `test/validacao.test.ts`):

- `guardar`: bytes idênticos aos recebidos (com espaços, quebras e BOM originais); nome `AAAAMMDDTHHMMSSZ_<servico>_<tiquete>.json` em UTC; caractere fora de `[A-Za-z0-9._-]` vira `_`; não sobrescreve (`_2`, `_3`); devolve o caminho;
- `abrirGuardado`: identifica o serviço pelo nome; nome fora do padrão = código 2 com o padrão explicado;
- todas as fixtures `valido.json` e `vazio.json` das quatro consultas passam no schema da sua consulta;
- `invalido*.json` e `rad-vencimento-data.json` falham, listando até 20 divergências com `instancePath` e mensagem, **sem o valor do campo**, e o total;
- `0.07` aceito (sem falso negativo de `multipleOf`); 3 casas recusado; notação exponencial em `valorMonetario` recusada pela checagem do texto;
- JSON que não faz parse recebe o tratamento de inválido; BOM inicial não impede a leitura.

Implementação na task 20 (`Ajv2020` + `ajv-formats`, `allErrors: true`, `multipleOfPrecision: 4`, cópias de `schemas/oficiais/` sem edição).

### 21 e 22. Créditos completo

Testes (`test/creditos.test.ts`, `test/saida.test.ts`, `test/cli.test.ts`), conforme "Comandos", "Leitores › Créditos" e o mapa:

- leitor: uma linha por crédito com período, chave, tipo (código e nome), origem (código e nome), a apropriar e apropriado; omitido = 0,00; por período, quantidade e os dois totais, com os valores esperados de `creditos/valido.json`; `vazio.json` dá a mensagem do CA-10;
- resumo: cabeçalho com serviço, tíquete, `geradoEm` e caminho; não mostra `niConsumidor`; contém "a apropriar" e "apropriado"; não contém "disponível", "a pagar", "pendente" nem "confirmado";
- `cli`, com `executar(argv, deps)`:
  - ciclo completo de `creditos` simulado: token → abertura → `PENDENTE` → `EM_PROCESSAMENTO` → `CONCLUIDA` → download → arquivo → bruto guardado → validação → resumo, código 0;
  - linha "Aberturas de creditos registradas hoje: N (M aceitas)..." mostrada antes da abertura;
  - `--tiquete` não abre solicitação nem conta abertura; tíquete fora de `[A-Za-z0-9._-]{1,200}` = código 2;
  - sem consulta, nome desconhecido, dois nomes e `todas`: código 2, opções listadas, **zero chamadas** (nem token);
  - `ler` de um arquivo guardado de créditos com `fetch` que falha se chamado; não exige configuração;
  - arquivo inválido: guardado, código 3, sem resumo;
  - depois do ciclo e de cada cenário de erro, nem a saída capturada nem os arquivos de `.local/` (exceto `token.json`) contêm client id, segredo, token ou `urlAssinada` fictícios.

Implementação na task 22: `leitores/creditos.ts`, `saida.ts`, `cli.ts` e `main.ts` (carrega `.env` com `process.loadEnvFile`; sem o arquivo, mensagem "crie o .env a partir do .env.example" e código 2; lê `process.argv`; chama `process.exit`). `main.ts` não tem teste automatizado; fica mínimo.

Estado intermediário até a task 28: `recolhimentos`, `pagamentos` e `debitos` já são nomes válidos no catálogo, mas sem leitor. Enquanto não houver leitor, o comando dessas consultas não pode chegar a fazer chamada alguma (nem token); a forma de recusar é livre, e ela some na task 28.

### 23 e 24. Recolhimentos completo

Testes: leitor (`test/recolhimentos.test.ts`) com linha por item de `composicao` (`numeroDARF`, `dataArrecadacao`, período, `niFornecedor`, `chaveDFE` ou "sem chave", `total`), total por período, "Itens sem chaveDFE: N de M"; `vazio.json` (CA-10); resumo sem os rótulos proibidos; `cli`: ciclo completo de `recolhimentos`, `--tiquete` e `ler` de arquivo de recolhimentos guardado, inválido com código 3.

Implementação: `leitores/recolhimentos.ts` e a parte do resumo; recolhimentos sai do estado intermediário.

### 25 e 26. Pagamentos completo

Testes: leitor (`test/pagamentos.test.ts`) com origem pelo `tipo` (1 = "RAD (recolhimento pelo adquirente)", 2 = "PCONT (pagamento pelo contribuinte)"), `numeroDARF`, `dataArrecadacao`, linha por item de `composicao` com período e `total`; por período, total RAD, total PCONT e total geral; `vazio.json`; `cli`: ciclo completo de `pagamentos`, `--tiquete`, `ler`; **`rad-vencimento-data.json` guardado, código 3, divergência listada e nenhum resumo** (decisão D-1: não existe opção de resumir arquivo inválido).

Implementação: `leitores/pagamentos.ts` e a parte do resumo.

### 27 e 28. Débitos completo e rótulos das quatro consultas

Testes: leitor (`test/debitos.test.ts`) com período, chave, tipo, apurado, extinto (ausente = 0,00) e saldo devedor; por período, quantidade e os três totais; `vazio.json`; `cli`: ciclo completo de `debitos`, `--tiquete`, `ler`; `test/saida.test.ts`: os resumos das **quatro** consultas contêm os rótulos da documentação e nenhum de "disponível", "a pagar", "pendente", "confirmado".

Implementação: `leitores/debitos.ts` e a parte do resumo; retirar o estado intermediário da task 22 e o teste dele, se houver. Verificação: `npm test`, `npm run lint`, `npm run build` passam; o teste do ciclo completo roda para as quatro consultas.

### 29. README da aplicação

`app/apuracao-cbs/README.md`, conforme "Roteiro da chamada real" e "Riscos":

- o que a aplicação faz e o que não faz (só leitura; sem `/rad` nem `/pcont`; uma consulta por execução);
- requisitos (Node 24+), `npm install`, `npm test`, `npm run lint`, `npm run build`;
- os comandos `consulta` e `ler`, os códigos de saída e as variáveis do `.env` (só nomes);
- aviso de que `npm run consulta` chama a API real e gasta uma das 4 chamadas do dia;
- o roteiro da chamada real, passos 1 a 9 da Spec, incluindo: gerar a credencial em "Gerar Credencial de Acesso para API" e anotar o tipo marcado (D-2); preencher o `.env` **no editor**, nunca no terminal; tentar `basic` e depois `corpo`; não tentar os caminhos v1; **revogar a credencial** no portal, apagar id e segredo do `.env` e apagar `.local/token.json` ao fim;
- avisos: apagar `.local/chamadas.jsonl` zera as contagens; o token fica em `.local/token.json` por até 1 hora; arquivo de pagamentos com RAD recusado pelo schema fica guardado e sem resumo (D-1);
- o que passar à sessão depois: só códigos, tempos, contagens e "sim/não", nunca dado real.

Verificação: revisão contra a Spec; nenhum valor de credencial, CNPJ real ou endereço sem fonte.

### 30. `AGENTS.md` e `.claude/fluxo.json`

Conforme "Implantação › Mudanças no repositório":

- `AGENTS.md`, regra "Testes primeiro": registrar que o comando de teste de `app/apuracao-cbs` é `npm test`. Em "Comandos": bloco `apuracao-cbs` com `npm install`, `npm test`, `npm run lint`, `npm run build`, `npm run consulta -- <creditos|recolhimentos|pagamentos|debitos> [--tiquete <tiquete>]` e `npm run ler -- <arquivo>`, com o aviso de que `consulta` chama a API real e só roda por pedido explícito do responsável.
- `.claude/fluxo.json`: `"apps": { "landing-page": "app/landing-page", "apuracao-cbs": "app/apuracao-cbs" }`.

Verificação: `node -e "JSON.parse(require('fs').readFileSync('.claude/fluxo.json','utf8'))"` sem erro; revisão. Se a guarda negar a edição, parar e informar a sessão principal (Spec, "Implantação"); não contornar.

### 31. `docs/PROJECT_CONTEXT.md`

§2: linha da prova de conceito (`app/apuracao-cbs`, linha de comando, chamada real pendente). §4: subseção da `apuracao-cbs` (Node 24+, TypeScript, vitest, oxlint, ajv, big.js, lossless-json; comandos), mantendo "Aplicação (backend e painel) — proposta, não confirmada". §7: pasta `app/apuracao-cbs/`. §11: linha de 2026-11-24 (ou a data do commit). Verificação: revisão.

### 32. Referência da apuração da CBS

`docs/referencias/apuracao-cbs/README.md`, só com o que já foi conferido em fontes públicas (Spec, "Fontes lidas nesta etapa" e "Divergências"):

- tabela "Fontes": `situacao-solicitacao.html` 1.2 (14/10/2026); os quatro schemas de retorno 1.0.0, **incluindo `recolhimento-retorno`**, com a nota de que a versão é a declarada nas páginas e só o de créditos tem `$id`; `faq.html` sem versão; manual "Receita Integra - Documentação Técnica - Prod - v1.4" (17/07/2026), com o link do compartilhamento citado no guia; "Manual Plataforma da CBS — Versão Maio/2026" (RTC – Projeto Piloto), trazido pelo responsável, marcado como anterior à v2 e não seguido onde diverge; a data em que as cópias da task 4 foram baixadas e onde estão (`app/apuracao-cbs/schemas/oficiais/versoes.json`);
- "Não lidos": retirar o schema de recolhimentos e o manual Receita Integra; ficam os schemas de geração de DARF;
- "O que não está documentado → Token": endereço `https://api.receitafederal.gov.br/token`, validade de 1 hora e limite de 2 tokens por hora agora têm fonte (manual v1.4); scope e forma de envio das credenciais (corpo ou Basic), não;
- "Ambientes": o que o manual da Plataforma CBS diz do Ambiente Beta (13/01/2026 a dezembro/2026, DF-e reais, pagamentos simulados); a URL da produção restrita continua sem fonte; o indício do assistente do portal registrado como indício, não como fonte;
- "Divergências": acrescentar as seis da Spec (fim do prazo `ERRO` × `EXPIRADA`; `urlRetorno` ausente × `""`; vencimento RAD, já listada, agora com "o próprio exemplo oficial não passa no schema 1.0.0"; limite de chamadas em três fontes; validade do arquivo 48 h × 24 h; endereços v1 × v2), sem duplicar as que já estão. Todas com situação "não testada" até a task 35.

Nada sobre resultado de chamada real. Verificação: revisão contra a Spec; cada afirmação com fonte.

### 33. Hipóteses, H1

`docs/produto/hipoteses.md`, só o que já tem fonte pública:

- na tabela "O que continua em aberto", linha "Ambiente de teste": a URL da produção restrita segue sem fonte; o manual da Plataforma CBS descreve um Ambiente Beta até dezembro/2026;
- registrar que token (endereço, validade, limite de 2 por hora) agora tem fonte (manual Receita Integra v1.4), e que a forma de envio das credenciais não;
- em "Como resolver": a prova de conceito é a demanda 029; as respostas dependem da chamada real.

Nada sobre o significado de "a apropriar" nem sobre `chaveDFE` vazia: isso é da task 35. Verificação: revisão.

### 34. Verificação de fechamento

```bash
cd app/apuracao-cbs
npm test && npm run lint && npm run build
cd ../..
git ls-files app/apuracao-cbs | grep -E '(^|/)(\.env$|\.local/|dist/|node_modules/)'   # nada
git grep -nE 'id-ficticio-123|segredo-ficticio-456|token-ficticio-789' -- ':!app/apuracao-cbs/test'   # nada
git check-ignore -v app/apuracao-cbs/.env app/apuracao-cbs/.local/x
git status   # limpo
git diff --stat main -- app/landing-page   # nada
```

Sem commit, salvo se algo precisar de correção (nesse caso, commit da correção com a mensagem dizendo o que foi corrigido).

### 35. Manual — usuário + sessão principal: chamada real

**Não é task do Developer.** O Developer não chama a API real, não pede credencial e não cria `.env`. Esta task começa só depois da revisão aprovada e por pedido explícito do responsável, uma consulta por vez, na ordem créditos → recolhimentos → pagamentos → débitos.

- **Quem executa:** o responsável, na máquina dele, com o `.env` que ele mesmo preenche no editor, seguindo o roteiro do README (passos 1 a 9 da Spec). Primeira tentativa: URL v2 documentada com a credencial de produção restrita (D-2), `APURACAO_TOKEN_CREDENCIAIS=basic`.
- **O que volta para a sessão:** só observações sem dado real: tipo de credencial marcado no portal, códigos HTTP, `codigoErro`/`mensagemErro`, forma de envio que funcionou, `expires_in`, tempos de processamento, contagens por tipo no `.local/chamadas.jsonl`, se houve 429 e depois de quantas chamadas, quantidade de itens sem `chaveDFE`, se veio vazio ou com dados de teste, e se o arquivo de pagamentos foi recusado pelo schema.
- **O que se registra, com data** (a sessão principal aciona quem escreve; o texto segue a Spec, "Roteiro da chamada real", parágrafo final):
  - `docs/referencias/apuracao-cbs/README.md`: endereços que funcionaram e com que tipo de credencial, como **observado** (D-2); forma de envio; `expires_in`; tempo de processamento por consulta; se situação, download, arquivo e token apareceram ligados a algum 429 ou "não observado"; situação de cada divergência (confirmada, resolvida ou não testada), com a divergência 3 como **confirmada** se o arquivo de pagamentos for recusado (D-1);
  - H1 em `docs/produto/hipoteses.md`: o que "a apropriar" significou nos dados; se foi possível ligar ao pagamento do fornecedor; se a chave bastou para identificar o fornecedor; frequência de `chaveDFE` vazia; e, se o ambiente veio vazio ou só com dados de teste, cada pergunta como "não respondida", com o motivo (CA-19).
- **Encerramento:** credencial revogada, id e segredo apagados do `.env`, `.local/token.json` apagado (passo 9). Confirmado pelo responsável.
- Se D-1 se confirmar, a demanda pequena de "resumir mesmo inválido" entra no backlog do kanban.

## Mapa CA → tasks

| CA | Tasks |
|---|---|
| CA-1 | 15, 16, 21–28, 35 |
| CA-2 | 9, 10, 17, 18, 35 |
| CA-3 | 17, 18, 21–28, 35 |
| CA-4 | 13–18 |
| CA-5 | 19–28 |
| CA-6 | 3, 4, 19, 20, 21, 22, 25, 26 |
| CA-7 | 21, 22 |
| CA-8 | 7, 8, 19, 20 |
| CA-9 | 21–28 |
| CA-10 | 21–28 |
| CA-11 | 23, 24 |
| CA-12 | 1, 2, 9, 10, 13–16, 21, 22, 34 |
| CA-13 | 2, 9, 10 |
| CA-14 | 5, 6 |
| CA-15 | 11, 12, 15, 16 |
| CA-16 | 1, 15 e todas as tasks de teste |
| CA-17 | 2, 29, 30 |
| CA-18 | 10 em diante, 34 |
| CA-19 | 33 (parte documental), 35 |
| CA-20 | 3, 4, 32 |
| CA-21 | 25, 26 |
| CA-22 | 27, 28 |
| CA-23 | 13, 14, 35 |
| CA-24 | 11, 12, 21, 22 |
| CA-25 | 11, 12, 21, 22 |
