# apuracao-cbs

Prova de conceito (demanda 029) da API de apuração da CBS da Receita Federal: uma aplicação de linha de comando que faz o ciclo assíncrono das quatro consultas (créditos, recolhimentos, pagamentos e débitos), guarda o arquivo bruto, valida pelo schema oficial e mostra um resumo no terminal.

Não é o produto. Serve para responder, com uma chamada real, o que a documentação deixa em aberto (ver `docs/referencias/apuracao-cbs/README.md` e a H1 em `docs/produto/hipoteses.md`).

## O que faz e o que não faz

- **Só leitura.** Token, abertura da consulta, situação, download e arquivo. Não existe código para `/rad`, `/pcont` nem para qualquer serviço que gere guia ou altere dados.
- **Uma consulta por execução.** O comando exige o nome de uma consulta; não existe opção que dispare todas. Rodar as quatro exige quatro execuções, cada uma pedida.
- **Sem servidor, sem banco, sem aviso por `urlRetorno`.** A espera é feita consultando a situação.
- **Valores monetários em decimal exato**, nunca em ponto flutuante.
- Tudo o que a aplicação grava fica em `.local/`, ignorada pelo git.

## Requisitos e comandos

Node 24 ou mais novo.

```bash
cd app/apuracao-cbs
npm install
npm test          # testes (sem rede, sem .env)
npm run lint
npm run build
```

Os testes não chamam a API real nem leem o `.env`: usam respostas simuladas e dados fictícios.

### `consulta` (chama a API real)

> **Atenção:** `npm run consulta` chama a API real da Receita e gasta uma das 4 chamadas por API e por credencial. Rode só quando for a hora de fazer a chamada real, depois de preencher o `.env` (ver o roteiro abaixo).

```bash
npm run consulta -- creditos
npm run consulta -- recolhimentos
npm run consulta -- pagamentos
npm run consulta -- debitos
npm run consulta -- creditos --tiquete <tiquete>   # retoma sem abrir nova solicitação
```

- Sem consulta, com nome desconhecido, com mais de um nome ou com `todas`: lista as opções, sai com código 2 e não faz nenhuma chamada (nem pede token).
- `--tiquete` vai direto ao acompanhamento da situação, sem abrir solicitação nova e sem contar abertura. O tíquete aceita só `[A-Za-z0-9._-]`, de 1 a 200 caracteres.
- Antes de abrir, mostra quantas aberturas daquele serviço o registro local já tem no dia.

### `ler` (sem rede)

```bash
npm run ler -- .local/arquivos/<arquivo>.json
```

Valida e resume um arquivo já guardado, sem chamar a API, sem pedir token e sem precisar do `.env`. O nome do arquivo identifica a consulta (`AAAAMMDDTHHMMSSZ_<servico>_<tiquete>.json`).

### Códigos de saída

| Código | Significado |
|---|---|
| 0 | Sucesso (inclusive arquivo sem alterações) |
| 1 | Erro da API, da situação ou de rede |
| 2 | Uso incorreto ou configuração inválida |
| 3 | Arquivo não passou no schema oficial |

## Configuração (`.env`)

Copie `.env.example` para `.env` e preencha **no editor**, nunca no terminal. O `.env.example` traz só os nomes e comentários, com a fonte de cada endereço citado; nenhum valor.

| Variável | Obrigatória | Observação |
|---|---|---|
| `APURACAO_CLIENT_ID` | sim | credencial gerada no portal |
| `APURACAO_CLIENT_SECRET` | sim | idem |
| `APURACAO_URL_TOKEN` | sim | sem valor padrão no código |
| `APURACAO_URL_BASE` | sim | sem valor padrão no código |
| `APURACAO_TOKEN_CREDENCIAIS` | sim | `basic` ou `corpo` |
| `APURACAO_TOKEN_SCOPE` | não | só se a documentação passar a exigir |
| `APURACAO_CNPJ_BASE` | sim | 8 dígitos |
| `APURACAO_INTERVALO_SITUACAO_SEGUNDOS` | não | mínimo 60, padrão 300 |
| `APURACAO_ESPERA_MAXIMA_MINUTOS` | não | padrão 250 |

## Avisos

- **`.local/token.json`** guarda o token em texto, por até 1 hora, só nesta máquina. Apague ao fim do uso.
- **`.local/chamadas.jsonl`** é o registro de chamadas (data e hora, serviço, tipo, código HTTP e tíquete; sem token, credencial nem conteúdo). **Apagá-lo zera as contagens** de aberturas por dia e de pedidos de token por hora. Linha ilegível ou sem data válida conta como chamada feita, com a data de modificação do arquivo: deixa de contar depois de uma hora (token) ou no dia seguinte (aberturas). Para tirá-la antes, corrija ou apague a linha indicada no aviso.
- O limite de 2 tokens por hora vale também para pedidos recusados: o programa conta todos e não pede um terceiro; diz a partir de que horas pode pedir de novo.
- **Arquivo de pagamentos com RAD recusado pelo schema** (o exemplo oficial traz o vencimento só com data, e o schema 1.0.0 exige data e hora; divergência 3 da referência): o arquivo bruto fica guardado, o comando sai com código 3 e não gera resumo. A validação continua estrita (decisão D-1); resumir arquivo inválido seria outra demanda.
- Dados reais (chaves de notas, NIs) aparecem só no terminal e em `.local/`. Nada disso vai para código, teste, documento ou PR.

## Roteiro da chamada real

Quem executa é o responsável, na máquina dele, por pedido explícito, uma consulta por vez. Nenhum segredo vai para tela, chat ou commit.

1. **Pré-requisitos.** `npm test`, `npm run lint` e `npm run build` passando.
2. **Credencial.** No portal `consumo.tributos.gov.br` (ou `servicos.receitafederal.gov.br`), entre com gov.br representando o CNPJ (representante, procurador ou e-CNPJ), abra "Gerar Credencial de Acesso para API" e gere a credencial para o serviço de apuração da CBS de produção restrita (na tela "Nova Credencial" aparece "Apuração Assistida e Devolução de CBS (produção, produção restrita e v2)"). **Anote qual opção foi marcada**: é o que identifica o ambiente (decisão D-2).
3. **`.env`.** Copie `.env.example` para `.env` em `app/apuracao-cbs` e preencha **no editor**: client id e segredo; `APURACAO_URL_TOKEN` e `APURACAO_URL_BASE` com os endereços citados nos comentários do `.env.example` (os únicos com fonte); `APURACAO_TOKEN_CREDENCIAIS=basic`; `APURACAO_CNPJ_BASE` com os 8 primeiros dígitos do CNPJ.
4. **Primeira consulta: créditos.** `npm run consulta -- creditos`. Confira a linha de aberturas do dia, a estimativa, as mudanças de situação, o caminho do arquivo guardado e o resumo. Anote o tempo de processamento mostrado no fim.
   - Token recusado com `basic` (400 ou 401): troque para `APURACAO_TOKEN_CREDENCIAIS=corpo` e rode de novo. Se as duas formas forem recusadas, os 2 tokens da hora acabaram: pare, anote os códigos e a `mensagemErro`, e espere a hora (o comando diz quando).
   - Abertura recusada (404, 403 ou outro): pare e anote o código HTTP e `codigoErro`/`mensagemErro`. **Não tente os caminhos da versão 1** (`/rtc/...`): não estão implementados e são de uma versão anterior. Um endereço novo só entra com fonte.
5. **Interrupção ou demora.** Retome com `npm run consulta -- creditos --tiquete <tiquete>`; o tíquete está na saída e no registro.
6. **Releitura.** `npm run ler -- .local/arquivos/<arquivo>.json` lê de novo, sem rede.
7. **Registro de chamadas.** Abra `.local/chamadas.jsonl` (não tem segredo nem dado fiscal) e conte, por tipo, as chamadas feitas, se algum 429 apareceu e depois de quantas.
8. **Demais consultas.** Recolhimentos, pagamentos e débitos, uma por vez, cada uma por pedido explícito, repetindo os passos 4 a 7.
9. **Encerramento.** **Revogue a credencial no portal**; apague client id e segredo do `.env`; apague `.local/token.json`. Os arquivos em `.local/arquivos/` ficam na máquina, fora do git.

### O que passar para a sessão depois

Só observações sem dado real: o tipo de credencial marcado no portal, códigos HTTP, `codigoErro`/`mensagemErro`, a forma de envio que funcionou (`basic` ou `corpo`), o `expires_in`, tempos de processamento, contagens por tipo do registro, se houve 429 e depois de quantas chamadas, quantos itens vieram sem `chaveDFE`, se o resultado veio vazio ou com dados de teste, e se o arquivo de pagamentos foi recusado pelo schema. **Nunca** cole chave de nota, NI, valor, token, segredo ou `urlAssinada`.

## Limites conhecidos

- **Valores acima de alguns bilhões.** A validação de `multipleOf: 0.01` usa tolerância de 4 casas (`multipleOfPrecision`); em valor monetário acima de alguns bilhões o erro de ponto flutuante pode passar dessa tolerância, e o programa recusa como inválido (código 3) um arquivo que está certo. O arquivo bruto fica guardado e a divergência é listada, para conferência manual.
