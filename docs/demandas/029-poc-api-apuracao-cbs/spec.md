# 029-poc-api-apuracao-cbs — Spec

## Critérios de aceite atendidos

Todos os CA do `us.md`: CA-1 a CA-25. O mapa CA → verificação está em "Estratégia de verificação".

CA-1, CA-19 e parte do CA-2, CA-3 e CA-23 só se comprovam com a chamada real, que é manual e o último passo (roteiro abaixo). Se a produção restrita vier vazia ou só com dados de teste, vale a regra do CA-19: ciclo técnico comprovado e perguntas sobre os dados registradas como não respondidas.

## Fontes lidas nesta etapa

Conferidas em 2026-11-23. A implementação usa só o que está aqui; onde as fontes divergem, vale a mais nova (v2) e a divergência vai para a referência (CA-19).

| Fonte | Versão | O que se tirou |
|---|---|---|
| `docs.receitafederal.gov.br/apuracao-cbs/guiaapiassincrona.html` | 1.1, 14/10/2026 | Fluxo; sem webhook, enviar `urlRetorno` como `""`; abertura aceita com HTTP 201; arquivo por GET na `urlAssinada` sem Bearer e sem cabeçalhos; `urlAssinada` é segredo temporário (não gravar em log); limite "4 chamadas por credencial e por api" no "endpoint de solicitação" |
| `credito.html`, `recolhimentos.html`, `pagamentos.html`, `debito.html` | 1.3, 13/11/2026 | `POST {base}/{servico}/{cnpj}`, `Content-Type: application/json`, corpo `{"urlRetorno":""}`; resposta `tiqueteSolicitacao` e `tEASegundos` (-1 = sem estimativa); erros com `codigoErro` e `mensagemErro`; campos dos arquivos; valores zero opcionais omitidos (créditos e débitos) |
| `situacao-solicitacao.html` | 1.2, 14/10/2026 | `GET {base}/situacao/{tiquete}`, `Accept: application/json`; `PENDENTE`, `EM_PROCESSAMENTO`, `CONCLUIDA`, `ERRO`, `EXPIRADA`; em `ERRO`/`EXPIRADA` vêm `codigoErro` e `mensagemErro` |
| `download.html` | 1.0, 13/10/2026 | `GET {base}/download/{tiquete}`; 200 com `urlAssinada` e, quando houver, `urlAssinadaExpiraEm`; 401 `NAO_AUTORIZADO`, 404 `ARQUIVO_INDISPONIVEL`, 500 `ERRO_INTERNO` |
| `faq.html` | sem versão | Pergunta 12: "Apis de solicitação [...] Até 4 chamadas por API, por dia e por credencial", reinício à meia-noite; pergunta 11: após 240 min "passa para status de erro" |
| `schemas/credito-retorno.schema.json`, `recolhimento-retorno.schema.json`, `pagamento-retorno.schema.json`, `debito-retorno.schema.json` | 1.0.0 (declarada nas páginas; os arquivos não trazem versão), Draft 2020-12 | Estrutura e tipos; `valorMonetario` = `number` com `multipleOf: 0.01`; só o de créditos tem `$id` |
| Manual "Receita Integra - Documentação Técnica - Prod - v1.4" | 1.4, 17/07/2026 | Token `POST https://api.receitafederal.gov.br/token`, `client_id`, `client_secret`, `grant_type=client_credentials`; validade 1 h; 2 tokens por hora; tabela de ambientes só com "Produção"; erros 400/401/403/404/429/500. Não diz corpo ou Basic |
| "Manual Plataforma da CBS — Versão Maio/2026" (RTC – Projeto Piloto), trazido pelo responsável | maio/2026 | Ambiente Beta de 13/01/2026 a dezembro/2026, DF-e reais, pagamentos simulados; token no mesmo endereço, "Entradas: [user] clientID e clientSecret", até 1 hora; descreve a API **v1** (`/rtc/apuracao-cbs/v1/{cnpj}`, `/rtc/download/v1/{tiquete}`, 2 chamadas/dia, 8 downloads/dia, arquivo por 24 h). Anterior à v2: não é seguido onde diverge |

Indício a confirmar, não fonte: o assistente do portal disse ao responsável que a "URL da API de testes" para token é `https://api.receitafederal.gov.br/token` e citou os caminhos v1.

### Divergências encontradas, a registrar na referência

Somam-se às quatro já listadas em `docs/referencias/apuracao-cbs/README.md`:

1. **Fim do prazo de processamento:** guia (seção 5) e FAQ (11) dizem que a solicitação passa para "status de erro"; a página de situação mostra `EXPIRADA` com `codigoErro: "EXPIRADA"`. A aplicação trata os dois como fim (CA-4).
2. **`urlRetorno` ausente ou vazia:** guia e FAQ mandam enviar `""`; as páginas das consultas (4.4) dizem "sem esse campo, consulte a situação". A aplicação envia `{"urlRetorno":""}`, como no exemplo "sem webhook" das páginas.
3. **Vencimento nos pagamentos RAD** (já listada): página e exemplo oficial usam data (`"2026-09-20"`); o schema 1.0.0 (`composicaoRAD.vencimento`) exige `date-time`. **O próprio exemplo oficial não passa no schema.** Ver "Riscos" e a pergunta P-6.
4. **Limite de chamadas:** guia "4 por credencial e por api" no endpoint de solicitação; FAQ "por API, por dia e por credencial" e só nas APIs de solicitação; manual da Plataforma CBS (v1) "2 chamadas por dia" na solicitação e "8 chamadas por dia" no download.
5. **Validade do arquivo:** 48 h na v2; 24 h no manual da Plataforma CBS (v1).
6. **Endereços:** o manual da Plataforma CBS traz `/rtc/apuracao-cbs/v1/{cnpj}` e `/rtc/download/v1/{tiquete}`, com webhook no corpo; a v2 usa `/apuracao-cbs/v2/{servico}/{cnpj}`, situação e download separados. Vale a v2.

## Abordagem

Uma aplicação de linha de comando em Node.js com TypeScript, `app/apuracao-cbs`, sem servidor, sem banco e sem estado além de uma pasta local ignorada pelo git (`.local/`). Ela faz o ciclo assíncrono da v2 documentada para **uma** consulta por execução, escolhida pelo nome: token (com cache e limite), abertura sem `urlRetorno`, acompanhamento pela situação, `urlAssinada`, download, guarda do arquivo bruto, validação pelo schema oficial e resumo no terminal.

Toda E/S passa por dependências injetadas (`fetch`, relógio, espera, saída, pasta local, variáveis de ambiente). Os testes trocam essas dependências por simulações; nenhum teste toca a rede nem lê o `.env`. Só o ponto de entrada (`src/main.ts`) carrega o `.env`, lê `process.argv` e chama `process.exit`.

Endereços (token e base) e a forma de enviar as credenciais vêm do `.env`, obrigatórios e sem valor padrão no código (CA-13). Quando a outra documentação do ambiente chegar (P-2), muda só o `.env`.

Valores monetários nunca passam por `number`: o arquivo é lido com um parser que mantém o texto original de cada número, e as somas são feitas em decimal exato (CA-8).

## Decisões técnicas

| Decisão | Escolha | Por quê |
|---|---|---|
| Nome da aplicação | `app/apuracao-cbs` | Nome da API na documentação; sugerido na US |
| Node | `>=24` em `engines` (24 e 26 são LTS em nov/2026; a máquina do responsável tem 26) | `fetch`, `AbortSignal.timeout`, `process.loadEnvFile` e `util.parseArgs` nativos |
| Módulos | ESM (`"type": "module"`), TypeScript `~6.0` (mesma da landing), `module`/`moduleResolution` `nodenext`, `strict` | Padrão do repositório |
| HTTP | `fetch` nativo, injetado | Sem dependência; fácil de simular |
| `.env` | `process.loadEnvFile(caminho)` em `main.ts`, com mensagem clara se o arquivo não existir | Sem `dotenv`; controle da mensagem |
| Argumentos | `util.parseArgs` nativo | Sem dependência |
| JSON Schema 2020-12 | `ajv` (classe `Ajv2020` de `ajv/dist/2020`) + `ajv-formats` (`date`, `date-time`), opções `allErrors: true`, `multipleOfPrecision: 4` | Validador de referência para 2020-12. `multipleOfPrecision` evita falso negativo de `multipleOf: 0.01` em ponto flutuante (ex.: 0,07); a checagem exata de casas decimais é feita à parte (abaixo) |
| Leitura sem perda dos números | `lossless-json`, `parse(texto, null, (s) => s)`: todo número chega como o texto original | `JSON.parse` converte `number(18,2)` em `double`, que não guarda 18 dígitos. Alternativa rejeitada: `reviver` com `context.source` do `JSON.parse` (tipagem incerta no TypeScript) |
| Decimal | `big.js` | Adição exata, sem precisão máxima (o `decimal.js` arredonda somas à precisão configurada) |
| Testes | `vitest` (`vitest run`) | TypeScript sem passo de build, `expect` e simulações prontos |
| Lint | `oxlint`, como na landing | Consistência |
| Build | `tsc -p tsconfig.json` para `dist/` | Verificação de tipos e saída executável |
| Fixtures | Arquivos JSON fictícios em `test/fixtures/`, escritos à mão a partir dos schemas | CA-14, CA-16 |

Versões das dependências: a estável atual na instalação, registrada no `package-lock.json`. Dependências de execução: `ajv`, `ajv-formats`, `big.js`, `lossless-json`. De desenvolvimento: `typescript`, `@types/node` (24), `@types/big.js`, `vitest`, `oxlint`. Nada além disso sem passar pela Spec.

## Mudanças por camada

### Aplicação nova (`app/apuracao-cbs`)

```text
app/apuracao-cbs/
├── package.json, package-lock.json
├── tsconfig.json            # só src/, saída em dist/
├── vitest.config.ts         # setupFiles: test/setup.ts
├── .oxlintrc.json
├── .gitignore               # .local/
├── .env.example
├── README.md
├── schemas/oficiais/
│   ├── credito-retorno.schema.json
│   ├── recolhimento-retorno.schema.json
│   ├── pagamento-retorno.schema.json
│   ├── debito-retorno.schema.json
│   └── versoes.json
├── src/
│   ├── main.ts              # entrada: carrega .env, argv, exit
│   ├── cli.ts               # executar(argv, deps): comandos consulta e ler
│   ├── config.ts            # lerConfig(env)
│   ├── servicos.ts          # catálogo fechado das quatro consultas
│   ├── token.ts             # cliente de token: cache e limite
│   ├── api.ts               # abertura, situação, download, arquivo
│   ├── acompanhamento.ts    # laço da situação
│   ├── erros.ts             # ErroApi e mensagens do CA-4
│   ├── registro.ts          # .local/chamadas.jsonl
│   ├── armazenamento.ts     # guarda e leitura do bruto
│   ├── validacao.ts         # ajv com as cópias oficiais
│   ├── json.ts              # parse sem perda
│   ├── dinheiro.ts          # big.js: leitura, soma, formatação
│   ├── redacao.ts           # mascara segredos em qualquer texto de saída
│   ├── saida.ts             # impressão dos resumos
│   └── leitores/
│       ├── creditos.ts
│       ├── recolhimentos.ts
│       ├── pagamentos.ts
│       └── debitos.ts
└── test/
    ├── setup.ts             # bloqueia a rede
    ├── apoio/               # API simulada, relógio falso, saída capturada
    ├── fixtures/{creditos,recolhimentos,pagamentos,debitos}/*.json
    └── *.test.ts
```

Arquivos em `camelCase.ts` (`PROJECT_CONTEXT.md` §8).

### Documentação e configuração do repositório

- `AGENTS.md`, `.claude/fluxo.json`, `docs/PROJECT_CONTEXT.md`: ver "Implantação".
- `docs/referencias/apuracao-cbs/README.md`: tabela "Fontes" com as versões acima, incluindo os dois manuais, a página de situação (1.2), o schema de recolhimentos e a FAQ sem versão; retirar "Não lidos" o que foi lido; corrigir "O que não está documentado → Token" (endereço, validade e limite agora têm fonte; scope e forma de envio, não); acrescentar as divergências 1 a 6 (CA-20). Depois da chamada real, o que o CA-19 pede.
- `docs/produto/hipoteses.md`, H1: resultado da chamada real (CA-19).

## Contratos

### Comandos (CA-1, CA-3, CA-5, CA-17, CA-24)

Rodados em `app/apuracao-cbs`. `consulta` e `ler` refazem o build antes de executar.

```bash
npm run consulta                                 # sem consulta: lista as opções e sai (código 2), nenhuma chamada
npm run consulta -- creditos                     # ciclo completo de uma consulta
npm run consulta -- recolhimentos
npm run consulta -- pagamentos
npm run consulta -- debitos
npm run consulta -- creditos --tiquete <tiquete> # retoma sem abrir nova solicitação (situação → download)
npm run ler -- .local/arquivos/<arquivo>.json    # valida e resume um arquivo guardado, sem rede nem token
```

Scripts do `package.json`:

| Script | Comando |
|---|---|
| `build` | `tsc -p tsconfig.json` |
| `lint` | `oxlint` |
| `test` | `vitest run` |
| `consulta` | `npm run build && node dist/main.js consulta` |
| `ler` | `npm run build && node dist/main.js ler` |

Regras do `consulta` (CA-24):

- Aceita exatamente um nome entre `creditos`, `recolhimentos`, `pagamentos`, `debitos`. Nenhum nome, nome desconhecido, mais de um nome ou qualquer apelido como `todas` encerra com código 2, lista as opções e não faz chamada alguma (nem token).
- Uma execução abre no máximo uma solicitação. Rodar as quatro exige quatro execuções, cada uma nomeada.
- Com `--tiquete`, não há abertura: o comando vai direto ao acompanhamento. O tíquete é aceito só com `[A-Za-z0-9._-]{1,200}`.

Códigos de saída: `0` sucesso (inclusive arquivo sem alterações); `1` erro da API, da situação ou de rede; `2` uso incorreto ou configuração inválida; `3` arquivo não passou no schema.

### Configuração: `config.ts` (CA-12, CA-13)

`lerConfig(env: Record<string, string | undefined>): Config`. Lança erro de configuração listando os **nomes** das variáveis ausentes ou inválidas, nunca os valores.

| Variável | Obrigatória | Regra |
|---|---|---|
| `APURACAO_CLIENT_ID` | sim | não vazia |
| `APURACAO_CLIENT_SECRET` | sim | não vazia |
| `APURACAO_URL_TOKEN` | sim, sem padrão | URL `https:` |
| `APURACAO_URL_BASE` | sim, sem padrão | URL `https:`; barra final removida |
| `APURACAO_TOKEN_CREDENCIAIS` | sim, sem padrão | `basic` ou `corpo` |
| `APURACAO_TOKEN_SCOPE` | não | se preenchida, vai como `scope` no pedido de token; vazia, não vai |
| `APURACAO_CNPJ_BASE` | sim | `^\d{8}$` |
| `APURACAO_INTERVALO_SITUACAO_SEGUNDOS` | não | inteiro ≥ 60; padrão 300 |
| `APURACAO_ESPERA_MAXIMA_MINUTOS` | não | inteiro ≥ 1; padrão 250 (prazo oficial de 240 min mais margem) |

`APURACAO_TOKEN_SCOPE` existe porque o manual lista o erro 403 "sem escopo" e não diz se há scope; assim a chamada real não depende de mudar código.

`main.ts` carrega `app/apuracao-cbs/.env` com `process.loadEnvFile`. Sem o arquivo: mensagem "crie o .env a partir do .env.example" e código 2. `ler` não exige `.env`.

### `.env.example` (CA-12, CA-13, CA-17)

Só nomes e comentários, sem valores. Os endereços aparecem só em comentário, com a fonte:

```dotenv
# Credencial gerada em "Gerar Credencial de Acesso para API" (consumo.tributos.gov.br).
# Preencha no editor, nunca no terminal. Revogue a credencial depois do uso.
APURACAO_CLIENT_ID=
APURACAO_CLIENT_SECRET=

# Endereço do token. Fonte: manual "Receita Integra - Documentação Técnica - Prod - v1.4" (17/07/2026)
# e "Manual Plataforma da CBS" (maio/2026): https://api.receitafederal.gov.br/token
# Não há fonte de um endereço próprio da produção restrita.
APURACAO_URL_TOKEN=

# URL base das APIs. Fonte: "URL de Produção" das páginas de docs.receitafederal.gov.br/apuracao-cbs/ (v2, 1.3 de 13/11/2026):
# https://api.receitafederal.gov.br/apuracao-cbs/v2
# A URL da produção restrita não consta da documentação lida.
APURACAO_URL_BASE=

# Forma de enviar client id e segredo no pedido de token: basic (cabeçalho Authorization) ou corpo
# (application/x-www-form-urlencoded). A documentação não diz qual; ver o roteiro no README.
APURACAO_TOKEN_CREDENCIAIS=

# Opcional. A documentação não cita scope.
APURACAO_TOKEN_SCOPE=

# CNPJ base, 8 dígitos.
APURACAO_CNPJ_BASE=

# Opcionais. Intervalo entre consultas de situação (mínimo 60, padrão 300) e espera máxima (padrão 250).
APURACAO_INTERVALO_SITUACAO_SEGUNDOS=
APURACAO_ESPERA_MAXIMA_MINUTOS=
```

### Pasta local e `.gitignore` (CA-5, CA-12, CA-23, CA-25)

Tudo o que a aplicação grava fica em `app/apuracao-cbs/.local/`:

| Caminho | Conteúdo |
|---|---|
| `.local/arquivos/` | arquivos brutos baixados |
| `.local/chamadas.jsonl` | registro de chamadas |
| `.local/token.json` | cache do token |

`app/apuracao-cbs/.gitignore` contém `.local/`. O `.gitignore` da raiz já ignora `.env`, `.env.local`, `node_modules/` e `dist/` em qualquer pasta; não muda. A pasta local é parâmetro injetado (`pastaLocal`), e os testes usam uma pasta temporária.

### Catálogo das consultas: `servicos.ts` (CA-15, CA-24)

Lista fechada, sem outro caminho no código:

| Nome | Abertura | Schema | Leitor |
|---|---|---|---|
| `creditos` | `POST {base}/creditos/{cnpj}` | `credito-retorno.schema.json` | `leitores/creditos.ts` |
| `recolhimentos` | `POST {base}/recolhimentos/{cnpj}` | `recolhimento-retorno.schema.json` | `leitores/recolhimentos.ts` |
| `pagamentos` | `POST {base}/pagamentos/{cnpj}` | `pagamento-retorno.schema.json` | `leitores/pagamentos.ts` |
| `debitos` | `POST {base}/debitos/{cnpj}` | `debito-retorno.schema.json` | `leitores/debitos.ts` |

Situação e download são comuns: `GET {base}/situacao/{tiquete}` e `GET {base}/download/{tiquete}`. Não existe código para `/rad`, `/pcont` nem outro serviço.

### Cliente de token: `token.ts` (CA-23, CA-4, CA-12)

`criarClienteToken({ config, fetch, relogio, registro, pastaLocal })` → `{ obter(): Promise<string>, descartar(): void }`.

Pedido:

- `POST {APURACAO_URL_TOKEN}`, `Content-Type: application/x-www-form-urlencoded`, `Accept: application/json`.
- `basic`: cabeçalho `Authorization: Basic base64(urlencode(client_id) + ":" + urlencode(client_secret))` (RFC 6749, 2.3.1) e corpo `grant_type=client_credentials`.
- `corpo`: corpo `grant_type=client_credentials&client_id=...&client_secret=...`, sem `Authorization`.
- `scope=...` no corpo só se `APURACAO_TOKEN_SCOPE` estiver preenchida.
- Resposta 2xx: lê `access_token` (obrigatório; ausente = erro) e `expires_in` (segundos). Sem `expires_in`, assume 3600 (manual v1.4: 1 hora) e avisa no terminal que assumiu. O terminal mostra "token obtido, válido por N s" (dado do CA-19), nunca o token.

Cache (`.local/token.json`): `{ chaveCredencial, obtidoEm, expiraEm, accessToken }`. `chaveCredencial` = SHA-256 de `APURACAO_URL_TOKEN + "\n" + APURACAO_CLIENT_ID`; cache de outra credencial ou endereço é ignorado. `obter()` devolve o token em cache se faltar mais de 120 s para `expiraEm`; senão pede outro.

Limite de 2 por hora: antes de pedir, conta no registro (CA-25) os pedidos de token (`tipo: "token"`, com qualquer resultado) nos últimos 60 minutos. Com 2 ou mais, não chama e encerra (código 1) com "limite de 2 tokens por hora; pode pedir de novo a partir de HH:MM" (horário em que o mais antigo sai da janela). Contar também os recusados é conservador: não se sabe se a Receita os conta.

Renovação durante a espera: o acompanhamento pode durar até 4 h e o token vale 1 h. Pedir um token novo quando o cache vence é parte do ciclo (CA-1) e respeita o limite (um por hora). O que o CA-4 proíbe é pedir de novo **depois de um erro**: um 401 descarta o cache, encerra e não tenta outra vez.

### Cliente das APIs: `api.ts` (CA-1, CA-4, CA-15)

Todas as chamadas: `AbortSignal.timeout(60_000)`, sem nova tentativa automática, registro no CA-25 antes de devolver ou lançar.

| Função | Pedido | Retorno |
|---|---|---|
| `abrir(servico)` | `POST {base}/{servico}/{cnpj}`, `Authorization: Bearer`, `Content-Type: application/json`, `Accept: application/json`, corpo `{"urlRetorno":""}` | HTTP 201 (aceita qualquer 2xx; registra o código real): `{ tiquete, teaSegundos }`. Sem `tiqueteSolicitacao` = erro |
| `situacao(tiquete)` | `GET {base}/situacao/{tiquete}`, `Bearer`, `Accept: application/json` | `{ situacao, codigoErro?, mensagemErro? }` |
| `linkDownload(tiquete)` | `GET {base}/download/{tiquete}`, `Bearer`, `Accept: application/json` | `{ urlAssinada, expiraEm? }` |
| `baixarArquivo(urlAssinada)` | `GET` sem nenhum cabeçalho | bytes da resposta (`arrayBuffer`) |

O tíquete vai no caminho com `encodeURIComponent`. A `urlAssinada` é tratada como segredo (guia 5.1): não vai para saída, registro nem mensagem de erro, e entra na lista do `redacao.ts`. Se `urlAssinadaExpiraEm` estiver no passado, não baixa e encerra como "urlAssinada vencida"; um 403 ou 400 no GET do arquivo também é tratado como vencida.

### Acompanhamento: `acompanhamento.ts` (CA-2, CA-3, CA-4)

`acompanhar({ servico, tiquete, teaSegundos?, config, api, relogio, dormir, saida })`.

- Mostra no início: serviço, tíquete e estimativa (`tEASegundos` em minutos e segundos; `-1` = "sem estimativa"; na retomada, "estimativa não disponível na retomada").
- Primeira consulta de situação depois de `max(60, min(tEASegundos, intervalo))` segundos quando `tEASegundos > 0`; senão, depois de `intervalo`. As seguintes, a cada `intervalo`.
- Mostra cada **mudança** de situação com horário (a primeira situação lida também é mostrada).
- `CONCLUIDA` → devolve; `ERRO` ou `EXPIRADA` → erro com `codigoErro` e `mensagemErro` (CA-4); situação desconhecida → erro "situação não documentada: X", sem adivinhar.
- Passada a espera máxima, para sem erro da API, código 1, com o comando de retomada (`npm run consulta -- <servico> --tiquete <tiquete>`).
- Ao concluir, mostra o tempo de processamento: da abertura (horário do registro com o mesmo tíquete; na retomada, o primeiro registro de abertura desse tíquete, se houver) até a primeira `CONCLUIDA` observada. É uma medida do lado do cliente, limitada pelo intervalo (dado do CA-19).

### Erros: `erros.ts` (CA-4, CA-12)

`ErroApi { tipoChamada, servico?, http?, codigoErro?, mensagemErro?, tiquete? }`. Nunca guarda cabeçalhos, corpo enviado, token nem `urlAssinada`. `codigoErro` e `mensagemErro` vêm do corpo da resposta, se for JSON com esses campos; outro corpo não é mostrado (pode ter dado que não é nosso). Toda mensagem passa pelo `redacao.ts`.

Mensagens (o texto final é do Developer; o conteúdo é este):

| Situação | O que diz e o que fazer |
|---|---|
| Token 400/401 | Credencial recusada no pedido de token. Conferir client id e segredo no `.env` e `APURACAO_TOKEN_CREDENCIAIS`; credencial gerada antes da v2 (28/10/2026) precisa ser gerada de novo. Não foi feita nova tentativa; lembra quantos pedidos de token restam na hora |
| API 401 | Token recusado ou consumidor não autorizado para este NI (`mensagemErro`). Cache do token descartado. Conferir se a credencial é do estabelecimento matriz do CNPJ base |
| 403 | Sem permissão ou escopo para o serviço. Conferir os serviços marcados na credencial e `APURACAO_TOKEN_SCOPE` |
| 404 na abertura | Endereço não encontrado. Conferir `APURACAO_URL_BASE` |
| 404 no download | Arquivo indisponível (`ARQUIVO_INDISPONIVEL`): solicitação inexistente ou não concluída |
| 429 | Limite excedido. Mostra quantas aberturas desse serviço o registro tem hoje; a FAQ diz que a cota reinicia à meia-noite |
| 400, 500, outro código | Código HTTP, `codigoErro` e `mensagemErro`. Em 500, tentar mais tarde |
| `ERRO` / `EXPIRADA` | `codigoErro` e `mensagemErro`. Uma nova solicitação exige rodar o comando de novo, e isso consome uma chamada do limite |
| `urlAssinada` vencida | Pedir outra com `--tiquete` enquanto o arquivo estiver disponível (48 h) |
| Rede ou tempo esgotado | Sem resposta; nada foi repetido |

Se já existe tíquete, toda mensagem de erro termina com o comando de retomada. Nenhum erro abre solicitação nem pede token por conta própria.

### Registro de chamadas: `registro.ts` (CA-25, CA-19, CA-23)

`.local/chamadas.jsonl`, uma linha JSON por chamada, gravada em modo de acréscimo, com **exatamente** estes campos:

```json
{"quando":"2026-11-23T14:25:30.123-03:00","servico":"creditos","tipo":"abertura","http":201,"tiquete":"<tíquete>"}
```

- `quando`: ISO 8601 com o fuso local.
- `servico`: a consulta da execução (também nos pedidos de token).
- `tipo`: `token`, `abertura`, `situacao`, `download` (o `GET /download/{tiquete}`) ou `arquivo` (o GET na `urlAssinada`, separado para mostrar se o download do arquivo conta à parte).
- `http`: código da resposta; `null` se não houve resposta (rede, tempo esgotado).
- `tiquete`: quando houver; `null` no token e numa abertura sem tíquete. O tíquete é o identificador que o guia (5.1) manda registrar na auditoria; não é segredo nem dado fiscal.

Nada de token, credencial, `urlAssinada`, corpo ou situação devolvida.

Funções: `registrar(entrada)`, `contarAberturas(servico, dia)` (dia local da máquina, porque a FAQ fala em meia-noite) com total e quantas tiveram 2xx, `pedidosDeTokenDesde(instante)`, `primeiraAbertura(tiquete)`. Antes de abrir, o `consulta` mostra: "Aberturas de <servico> registradas hoje: N (M aceitas). Limite documentado: 4 por API e por credencial (FAQ: por dia)". Se o arquivo for apagado, a contagem recomeça; o README avisa.

### Guarda do arquivo bruto: `armazenamento.ts` (CA-5, CA-14)

- `guardar({ servico, tiquete, bytes, agora })`: grava os bytes exatamente como chegaram em `.local/arquivos/<AAAAMMDDTHHMMSSZ>_<servico>_<tiquete>.json` (UTC; tíquete com caracteres fora de `[A-Za-z0-9._-]` trocados por `_`). Nunca sobrescreve: se o nome existir, acrescenta `_2`, `_3`. Gravado **antes** de qualquer parse ou validação. Devolve o caminho e o mostra no terminal.
- `abrirGuardado(caminho)`: lê os bytes e identifica o serviço pelo nome do arquivo. Nome fora do padrão encerra com código 2 explicando o padrão.

### Validação: `validacao.ts` (CA-6, CA-8, CA-20)

- Compila as quatro cópias de `schemas/oficiais/` com `Ajv2020` + `ajv-formats`, `allErrors: true`, `multipleOfPrecision: 4`.
- Valida o resultado de `JSON.parse` do texto (BOM inicial removido só para a leitura).
- Checagem exata à parte: todo número que o schema marca como `valorMonetario` tem, no texto original (via `lossless-json`), no máximo duas casas decimais e não está em notação exponencial. Falha nela conta como divergência do schema.
- Inválido: mostra até 20 divergências (`instancePath` e mensagem do ajv, sem o valor do campo), o total, o caminho do arquivo guardado, e sai com código 3 sem resumir. JSON que nem faz parse recebe o mesmo tratamento.

Cópias versionadas: `schemas/oficiais/*.schema.json` são cópias byte a byte de `https://docs.receitafederal.gov.br/apuracao-cbs/schemas/<nome>`, nunca editadas. `schemas/oficiais/versoes.json` registra, por arquivo: `url`, `versaoSchema` (como declarada na página, hoje `1.0.0`), `pagina` e `versaoPagina` (ex.: `credito.html`, `1.3 (13/11/2026)`), `lidoEm` (data da cópia) e `sha256`. Um teste confere o `sha256` de cada cópia contra o `versoes.json`. Atualizar um schema é: baixar de novo, atualizar o `versoes.json` e a tabela "Fontes" da referência, no mesmo commit.

### Leitura sem perda e dinheiro: `json.ts`, `dinheiro.ts` (CA-8)

- `lerSemPerda(texto)`: `lossless-json` com todo número como string. Os leitores convertem com `Number()` só os inteiros pequenos que o schema já validou (`origem`, `documento`, `tipo`, `sequencial`).
- `valor(texto | undefined)`: `Big(texto)`; `undefined` vira `Big(0)`, porque as páginas de créditos e débitos dizem que valores zero opcionais são omitidos.
- `somar(valores)`: soma em `Big`. Nenhum valor monetário passa por `number`, `parseFloat` ou `Number()`.
- `formatar(big)`: `toFixed(2)` e troca para `1.234,56` por manipulação de texto (sem `Intl` sobre `number`).

### Leitores e resumos: `leitores/*.ts`, `saida.ts` (CA-7, CA-9, CA-10, CA-11, CA-21, CA-22)

Cada leitor recebe o objeto já validado e lido sem perda e devolve um resumo estruturado; `saida.ts` imprime. Cabeçalho comum: serviço, tíquete, `geradoEm`, caminho do arquivo. `niConsumidor` não é mostrado (pode ser CPF).

**Arquivo vazio (CA-10):** `apuracao` igual a `[]` em qualquer consulta é resultado válido, código 0: "A API não devolveu alterações para esta consulta desde a última solicitação concluída (janela de até 8 dias, segundo a documentação)."

**Créditos (CA-7):** uma linha por crédito: período (`pa`), `chave`, tipo (`documento`, código e nome da tabela da página: 55 = NF-e etc.), origem (`origem`, código e nome: 0 = NORMAL etc.), **a apropriar** (`cbs.apropriacao.aApropriar`) e **apropriado** (`cbs.apropriacao.apropriado`). Por período: quantidade, total a apropriar, total apropriado. Os demais valores (`apurado`, `excedente`, `suspenso`, `utilizacao.*` etc.) não aparecem no resumo; estão no bruto.

**Recolhimentos (CA-11):** uma linha por item de `composicao`: `numeroDARF`, `dataArrecadacao`, período (`pa`), `niFornecedor`, `chaveDFE` ou "sem chave", `total`. Por período: quantidade e total de `total`. No fim: "Itens sem chaveDFE: N de M".

**Pagamentos (CA-21)**, campos do `pagamento-retorno.schema.json` 1.0.0:

- origem do pagamento: `pagamentos[].tipo`, com `1` = "RAD (recolhimento pelo adquirente)" e `2` = "PCONT (pagamento pelo contribuinte)", como na página;
- `pagamentos[].numeroDARF` e `apuracao[].dataArrecadacao`;
- período: `composicao[].pa`; valor: `composicao[].total`.

Um pagamento pode ter itens de períodos diferentes, então a linha é por item de `composicao`. Por período: total RAD, total PCONT e total geral. `niAdquirente`, `niContribuinte`, `chaveDFE`, `principal`, `multa` e `juros` ficam no bruto.

**Débitos (CA-22):** uma linha por débito: período (`pa`), `chave`, tipo (`documento`, código e nome), **apurado** (`cbs.apurado`), **extinto** (`cbs.extinto`, ausente = 0,00) e **saldo devedor** (`cbs.saldoDevedor`). Por período: quantidade e os três totais. `suspenso`, `inexigivel`, `pgtoAntecipado` e `excedente` ficam no bruto.

**Rótulos (CA-9):** só os nomes da documentação: "a apropriar", "apropriado", "apurado", "extinto", "saldo devedor", "RAD", "PCONT", "total". O resumo não usa "disponível", "a pagar", "pendente", "confirmado" nem explica o significado dos valores.

Chaves e NIs reais aparecem só no terminal e em `.local/` (CA-14, decisão 8 da US).

### Redação de segredos: `redacao.ts` (CA-12, CA-23)

`criarRedator()` guarda os segredos conhecidos na execução (client id, segredo, token, `urlAssinada`) e troca qualquer ocorrência por `***` em todo texto que vai para a saída ou para mensagens de erro. É defesa extra: nenhum código deve imprimir esses valores, e o teste do ciclo completo verifica.

## Riscos e decisões

- **Endereço e ambiente sem fonte (P-2).** O único endereço documentado das APIs v2 é a "URL de Produção". O roteiro tenta esse endereço primeiro, com a credencial de produção restrita, e registra o que acontecer. Se ele responder com dados, não há como saber, pela resposta, se é produção restrita ou produção (beta); o que identifica o ambiente é o tipo de credencial gerada no portal. Ver P-7.
- **Forma de envio das credenciais.** O roteiro tenta `basic` primeiro: a RFC 6749 (2.3.1) obriga o servidor a aceitar Basic, e o manual da Plataforma CBS fala em "[user] clientID e clientSecret". Cada tentativa gasta um dos 2 tokens da hora: se as duas formas falharem, só se tenta de novo uma hora depois.
- **Schema de pagamentos x exemplo oficial.** O exemplo da página de pagamentos não passa no schema 1.0.0 (vencimento RAD com data em vez de `date-time`). Se a API real seguir o exemplo, todo arquivo de pagamentos com RAD será recusado pela validação (CA-6) e não terá resumo; o bruto fica guardado e pode ser relido com `ler` quando houver decisão. A Spec mantém a validação estrita e não edita a cópia oficial. Ver P-6.
- **`multipleOf` em ponto flutuante.** Sem `multipleOfPrecision`, o ajv recusa valores válidos como 0,07. A tolerância de 4 casas cobre valores até a casa dos bilhões; a checagem exata de casas decimais no texto fecha o resto.
- **Limite de chamadas sem definição.** O registro local não sabe o que a Receita conta. Ninguém vai esgotar o limite de propósito: cada abertura é uma das 4 do dia. Se nenhum 429 aparecer, "situação e download contam?" fica como não observado (CA-19).
- **Contagem local apagável.** Apagar `.local/chamadas.jsonl` zera a contagem de aberturas e de tokens. O README avisa.
- **Token em disco.** O cache fica em `.local/token.json`, em texto, como o CA-23 permite. Vale no máximo 1 hora; o roteiro manda apagá-lo ao fim.
- **Tíquete no registro.** Decisão desta Spec, apoiada no guia 5.1. Não é segredo nem dado fiscal.
- **Documentação em beta.** As páginas mudam. A tabela de fontes e o `versoes.json` dizem contra qual versão o código foi escrito.
- **Uma consulta por execução.** É mais restritivo que "nomear cada uma" no CA-24 e evita disparo em lote por engano.

## Implantação

Sem nota de implantação, tag ou release (regra do projeto). Nada vai ao ar: a aplicação roda só na máquina do responsável.

- **Apps afetadas:** nova `app/apuracao-cbs`. A landing não muda.
- **Migration:** não há.
- **Compatibilidade:** não há outra aplicação que dependa desta.
- **Variáveis de ambiente novas** (só no `.env` local de `app/apuracao-cbs`): `APURACAO_CLIENT_ID`, `APURACAO_CLIENT_SECRET`, `APURACAO_URL_TOKEN`, `APURACAO_URL_BASE`, `APURACAO_TOKEN_CREDENCIAIS`, `APURACAO_TOKEN_SCOPE`, `APURACAO_CNPJ_BASE`, `APURACAO_INTERVALO_SITUACAO_SEGUNDOS`, `APURACAO_ESPERA_MAXIMA_MINUTOS`.
- **Outros efeitos:** a credencial é gerada e revogada pelo responsável no portal. Sem cron, sem infra, sem CI.
- **Mudanças no repositório:**
  - `AGENTS.md`: na regra "Testes primeiro", registrar o comando de teste da aplicação nova (`npm test` em `app/apuracao-cbs`); em "Comandos", um bloco `apuracao-cbs` com `npm install`, `npm test`, `npm run lint`, `npm run build`, `npm run consulta -- <creditos|recolhimentos|pagamentos|debitos> [--tiquete <tiquete>]` e `npm run ler -- <arquivo>`, com o aviso de que `consulta` chama a API real e só roda por pedido explícito do responsável (CA-17).
  - `.claude/fluxo.json`: `"apps": { "landing-page": "app/landing-page", "apuracao-cbs": "app/apuracao-cbs" }`.
  - `docs/PROJECT_CONTEXT.md`: §2 (linha da prova de conceito), §4 (stack da `apuracao-cbs`: Node 24+, TypeScript, vitest, oxlint, ajv, big.js, lossless-json; comandos), §7 (pasta nova), §11 (changelog). A linha "Aplicação (backend e painel) — proposta, não confirmada" continua: esta PoC não decide a stack do painel.
  - Se a guarda dos agentes impedir o Developer de editar `AGENTS.md` ou `.claude/fluxo.json`, a sessão principal decide quem faz; a mudança é a descrita acima.
- **Antes da chamada real:** testes, lint e build passando; credencial gerada; `.env` preenchido.
- **Depois:** credencial revogada; segredo apagado do `.env`; `.local/token.json` apagado.
- **Como voltar:** apagar `app/apuracao-cbs` e reverter as linhas de `AGENTS.md`, `fluxo.json` e `PROJECT_CONTEXT.md`. Nada externo a desfazer além de revogar a credencial.

## Estratégia de verificação

### Garantias gerais dos testes (CA-16)

- `test/setup.ts` troca `globalThis.fetch` por uma função que lança "rede bloqueada nos testes". Todo cliente recebe `fetch` por injeção; um teste confere que o `fetch` global é o bloqueador.
- Nenhum teste chama `lerConfig(process.env)` nem `loadEnvFile`: a configuração vem de objetos montados no teste, com segredos fictícios e reconhecíveis (`id-ficticio-123`, `segredo-ficticio-456`, `token-ficticio-789`, `https://armazenamento.exemplo.invalid/arquivo?assinatura=ficticia`).
- URLs dos testes usam o domínio reservado `exemplo.invalid`.
- Relógio e espera são falsos e injetados: o laço da situação roda sem esperar de verdade.
- Pasta local é temporária por teste.
- A API simulada (`test/apoio/`) responde por roteiro (sequência de respostas por chamada) e registra cada pedido para as asserções.

### Dados fictícios (CA-14)

- CNPJ base `12345678`, o mesmo que a documentação oficial usa nos exemplos fictícios.
- NIs de 14 dígitos (`niConsumidor`, `niFornecedor`, `niAdquirente`, `niContribuinte`) com dígito verificador **inválido** (ex.: `12345678000100`), para que não possam ser CNPJ existentes.
- Chaves (`chave`, `chaveDFE`) começando com `FICT` (ex.: `FICT-NFE-0001`). O schema só exige texto de 1 a 100 caracteres.
- Tíquetes no formato da documentação, com texto fictício.
- Um teste percorre `test/fixtures/` e falha se algum NI de 14 dígitos tiver DV válido ou alguma chave não começar com `FICT`.

Fixtures por consulta (todas válidas pelo schema, salvo indicação):

| Consulta | Arquivos |
|---|---|
| créditos | dois períodos com valores com centavos, crédito sem `aApropriar` (omitido) e outro sem `apropriado`; vazio (`apuracao: []`); inválido (campo obrigatório ausente); inválido (valor com 3 casas) |
| recolhimentos | itens com e sem `chaveDFE`, dois períodos; vazio; inválido |
| pagamentos | RAD (com `vencimento` em `date-time`, como o schema exige) e PCONT, um pagamento com itens de dois períodos; vazio; RAD com `vencimento` só data, como o exemplo oficial (deve falhar: documenta a divergência 3) |
| débitos | dois períodos, débito sem `extinto`; vazio; inválido |

### Mapa CA → verificação

| CA | Teste automatizado (arquivo) | Verificação manual |
|---|---|---|
| CA-1 | `cli.test.ts`: ciclo completo simulado para cada uma das quatro consultas (token → abertura com `{"urlRetorno":""}` no caminho `/{servico}/12345678` → `PENDENTE` → `EM_PROCESSAMENTO` → `CONCLUIDA` → download → arquivo → resumo) | Roteiro, passo 4 |
| CA-2 | `acompanhamento.test.ts`: mostra serviço, tíquete, estimativa (inclusive `-1`); mostra cada mudança e não repete situação igual; esperas pedidas ao `dormir` seguem a regra do intervalo; `config.test.ts`: intervalo < 60 recusado | Roteiro, passo 4 |
| CA-3 | `cli.test.ts`: `--tiquete` para cada consulta não faz abertura nem conta aberturas; espera máxima encerra com o comando de retomada | Roteiro, passo 5 (se houver interrupção) |
| CA-4 | `api.test.ts` e `token.test.ts`: 400, 401, 403, 404, 429, 500 e outro código, na abertura, situação, download e token, com mensagem e orientação; `ERRO` e `EXPIRADA`; `urlAssinadaExpiraEm` no passado não baixa; 403 no GET do arquivo; erro de rede; em todos, a API simulada confirma que não houve nova abertura nem novo token depois do erro e que o cache foi descartado no 401 | — |
| CA-5 | `armazenamento.test.ts`: bytes gravados idênticos aos recebidos (com espaços e quebras originais); nome com data, serviço e tíquete; não sobrescreve; `cli.test.ts`: `ler` de um arquivo guardado de cada consulta com `fetch` que falha se chamado | Roteiro, passo 6 |
| CA-6 | `validacao.test.ts`: `sha256` das cópias = `versoes.json`; fixtures válidas passam; inválidas listam divergências sem valores; `cli.test.ts`: arquivo inválido fica guardado, sai com código 3 e não imprime resumo | — |
| CA-7 | `creditos.test.ts`: linhas por documento com chave, tipo, origem, período, a apropriar e apropriado; omitido = 0,00; totais por período | Roteiro, passo 4 |
| CA-8 | `dinheiro.test.ts`: soma de lista com centavos bate ao centavo (inclui 0,10 + 0,20 = 0,30 e valores de 16 dígitos inteiros); formatação; `json.test.ts`: números chegam como texto; `validacao.test.ts`: 0,07 aceito, 3 casas recusado | — |
| CA-9 | `saida.test.ts`: resumos das quatro consultas não contêm "disponível", "a pagar", "pendente" nem "confirmado"; contêm os rótulos da documentação | — |
| CA-10 | testes de cada leitor e `cli.test.ts`: `apuracao: []` dá a mensagem de "sem alterações" e código 0 | — |
| CA-11 | `recolhimentos.test.ts`: linhas por item, "sem chave", contagem de itens sem chave, total por período | — |
| CA-12 | `cli.test.ts`: depois do ciclo completo e de cada cenário de erro, nem a saída capturada nem os arquivos de `.local/` (exceto `token.json`, que guarda só o token) contêm o client id, o segredo, o token ou a `urlAssinada` fictícios; `config.test.ts`: erro de configuração mostra nomes, não valores | `git status` e `git grep` antes de cada commit; `git check-ignore -v app/apuracao-cbs/.env app/apuracao-cbs/.local/x` |
| CA-13 | `config.test.ts`: sem `APURACAO_URL_TOKEN` ou `APURACAO_URL_BASE` dá erro (não existe valor padrão); URL não `https` recusada; teste que procura `receitafederal.gov.br` em `src/` e falha se achar | Revisão do `.env.example` |
| CA-14 | `fixtures.test.ts` (DV inválido e prefixo `FICT`) | Revisão do diff |
| CA-15 | `servicos.test.ts`: catálogo tem exatamente os quatro nomes; teste que procura `rad` e `pcont` como caminho em `src/` e falha se achar | — |
| CA-16 | Este conjunto, mais o teste do `fetch` bloqueado | — |
| CA-17 | — | Revisão do README da aplicação e do `AGENTS.md` |
| CA-18 | — | `npm run lint`, `npm run build`, `npm test` em `app/apuracao-cbs` |
| CA-19 | — | Roteiro, passos 4 a 9 |
| CA-20 | `validacao.test.ts` (`versoes.json`) | Revisão da tabela "Fontes" |
| CA-21 | `pagamentos.test.ts`: RAD e PCONT pelo `tipo`, período e valor por item, totais por período e tipo | — |
| CA-22 | `debitos.test.ts`: linhas com apurado, extinto (omitido = 0,00) e saldo devedor; totais por período | — |
| CA-23 | `token.test.ts`: forma `basic` e `corpo` (cabeçalhos e corpo exatos; sem `Authorization` em `corpo`); `scope` só se configurado; segunda execução (novo cliente, mesma pasta) reutiliza o cache sem chamar; cache vencido ou de outra credencial pede novo; com 2 pedidos na última hora no registro, recusa sem chamar e informa o horário; renovação durante espera longa; sem `expires_in` assume 3600 e avisa | Roteiro, passos 3 e 4 |
| CA-24 | `cli.test.ts`: sem consulta, nome desconhecido, dois nomes, `todas`: código 2, opções listadas, zero chamadas (nem token) | Roteiro, passo 4 |
| CA-25 | `registro.test.ts`: cada linha tem exatamente os cinco campos; nenhum token, credencial, `urlAssinada` ou corpo; contagem por serviço e dia local; `cli.test.ts`: a contagem aparece antes da abertura | Roteiro, passo 7 |

### Comandos

```bash
cd app/apuracao-cbs
npm install
npm test
npm run lint
npm run build
```

### Roteiro da chamada real (manual, por pedido explícito do responsável)

Quem executa é o responsável, na máquina dele. Nenhum segredo vai para tela, chat ou commit. O README da aplicação traz este roteiro (CA-17).

1. **Pré-requisitos.** `npm test`, `npm run lint` e `npm run build` passando na branch.
2. **Credencial.** Em <https://consumo.tributos.gov.br/> (ou `servicos.receitafederal.gov.br`), entrar com gov.br representando o CNPJ (representante, procurador ou e-CNPJ), abrir "Gerar Credencial de Acesso para API" e gerar a credencial para o serviço de apuração da CBS de produção restrita (na tela "Nova Credencial" aparece "Apuração Assistida e Devolução de CBS (produção, produção restrita e v2)"). Anotar, para o registro, qual opção foi marcada.
3. **`.env`.** Copiar `.env.example` para `.env` em `app/apuracao-cbs` e preencher **no editor**, não no terminal: client id e segredo; `APURACAO_URL_TOKEN` e `APURACAO_URL_BASE` com os endereços citados nos comentários (os únicos documentados); `APURACAO_TOKEN_CREDENCIAIS=basic`; `APURACAO_CNPJ_BASE` com os 8 primeiros dígitos do CNPJ.
4. **Primeira consulta: créditos.** `npm run consulta -- creditos`. Conferir a linha de aberturas do dia, a estimativa, as mudanças de situação, o caminho do arquivo guardado e o resumo. Anotar o tempo de processamento mostrado no fim.
   - Token recusado com `basic` (400/401): trocar para `APURACAO_TOKEN_CREDENCIAIS=corpo` e rodar de novo. Com as duas recusadas, os 2 tokens da hora acabaram: parar, anotar os códigos e `mensagemErro`, e esperar a hora (o comando diz quando).
   - Abertura recusada (404, 403 ou outro): parar e anotar código HTTP e `codigoErro`/`mensagemErro`. Não tentar os caminhos v1 (`/rtc/...`): não estão implementados e são de uma versão anterior. Um novo endereço só com fonte (P-2).
5. **Interrupção ou demora.** Retomar com `npm run consulta -- creditos --tiquete <tiquete>`; o tíquete está na saída e no registro.
6. **Releitura.** `npm run ler -- .local/arquivos/<arquivo>.json` lê de novo sem rede.
7. **Registro de chamadas.** Abrir `.local/chamadas.jsonl` (não tem segredo nem dado fiscal) e contar, por tipo, as chamadas feitas e se algum 429 apareceu e depois de quantas.
8. **Demais consultas.** Recolhimentos, pagamentos e débitos, uma por vez, cada uma por pedido explícito, repetindo os passos 4 a 7.
9. **Encerramento.** Revogar a credencial no portal; apagar client id e segredo do `.env`; apagar `.local/token.json`. Os arquivos em `.local/arquivos/` ficam na máquina, fora do git.

O responsável passa à sessão só observações sem dado real (códigos HTTP, `codigoErro`, tempos, contagens, "sim/não", quantidades). Com elas, uma task final registra, com data:

- em `docs/referencias/apuracao-cbs/README.md`: endereços que funcionaram e com que tipo de credencial, e se o token é o mesmo endereço (só se houver fonte oficial para chamar de "produção restrita"; sem fonte, registrar como observado, não como documentado); forma de envio que funcionou; `expires_in` observado; tempo de processamento por consulta; se situação, download, arquivo e token apareceram ligados a algum 429 (ou "não observado"); situação de cada divergência (confirmada, resolvida ou não testada); a seção "Ambientes" com o que o manual da Plataforma CBS diz do Ambiente Beta;
- na H1 de `docs/produto/hipoteses.md`: o que um crédito "a apropriar" significou nos dados obtidos e se foi possível ligá-lo ao pagamento do fornecedor por recolhimentos ou pagamentos; se a chave da nota bastou para identificar o fornecedor; com que frequência `chaveDFE` veio vazia (a contagem do resumo); e, se o ambiente veio vazio ou só com dados de teste, cada pergunta como "não respondida", com o motivo.

## Perguntas em aberto

- **P-2 (da US, continua parcial):** URL da produção restrita, se o token tem outro endereço nela e a forma de envio das credenciais. A Spec não depende da resposta: tudo é configuração.
- **P-6:** o arquivo de pagamentos com RAD que siga o exemplo oficial (vencimento só data) não passa no schema 1.0.0. Recomendação: manter a validação estrita, como o CA-6 pede, sem editar a cópia oficial; se acontecer na chamada real, registrar a divergência como confirmada, guardar o bruto e decidir depois (por exemplo, uma opção explícita de "resumir mesmo inválido" com aviso), numa demanda pequena.
- **P-7:** a única URL v2 documentada é a de produção. Com credencial de produção restrita, o roteiro tenta essa URL primeiro, e o assistente do portal indicou que é a mesma do ambiente de testes. Se ela responder, a PoC não consegue provar pela resposta em qual ambiente está, e a US põe produção (beta) fora de escopo. Recomendação: aceitar a tentativa, já que a aplicação só lê e os dados ficam em `.local/`; o ambiente fica identificado pelo tipo de credencial marcada no portal (roteiro, passo 2), e a referência registra isso como observado, não como documentado.
