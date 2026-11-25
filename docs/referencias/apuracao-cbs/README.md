# APIs de apuração da CBS — Receita Federal

Resumo da documentação oficial, lida em 2026-11-23 e conferida de novo em 2026-11-24 (demanda 029). A fonte é sempre a página original; este arquivo só registra o que foi conferido e o que ficou em aberto. A documentação muda com frequência (quatro versões entre setembro e novembro de 2026): confira a versão antes de implementar.

## Fontes

Base: <https://docs.receitafederal.gov.br/apuracao-cbs/>

| Página | Versão lida |
|---|---|
| `guiaapiassincrona.html` (regras comuns) | 1.1, de 14/10/2026 |
| `credito.html`, `debito.html`, `pagamentos.html`, `recolhimentos.html` | 1.3, de 13/11/2026 |
| `situacao-solicitacao.html` | 1.2, de 14/10/2026 |
| `download.html` | 1.0, de 13/10/2026 |
| `gerar-darf-ad.html`, `gerar-darf-contrib.html` | 1.0, de 13/11/2026 |
| `faq.html` | — |
| `schemas/credito-retorno.schema.json`, `recolhimento-retorno.schema.json`, `debito-retorno.schema.json`, `pagamento-retorno.schema.json` | 1.0.0, declarada nas páginas (os arquivos não trazem versão); Draft 2020-12; só o de créditos tem `$id`. Cópias byte a byte baixadas em 2026-11-24 em `app/apuracao-cbs/schemas/oficiais/`, com o `sha256` de cada uma em `versoes.json` |
| Manual "Receita Integra - Documentação Técnica - Prod - v1.4" (compartilhamento citado no guia, seção 3) | 1.4, de 17/07/2026 |
| "Manual Plataforma da CBS — Versão Maio/2026" (RTC – Projeto Piloto), trazido pelo responsável | maio/2026. **Anterior à v2**: descreve a API v1 e não é seguido onde diverge |
| [Notícia oficial, 09/11/2026](https://www.gov.br/fazenda/pt-br/assuntos/noticias/2026/novembro/receita-federal-libera-acesso-as-novas-apis-de-apuracao-da-cbs) (também no [site da Receita](https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/novembro/receita-federal-libera-acesso-as-novas-apis-de-apuracao-da-cbs)) | texto lido na versão da Fazenda |

**Não lidos:** schemas de geração de DARF.

Atualizar um schema é baixar de novo, atualizar o `versoes.json` da aplicação e esta tabela, no mesmo commit.

## Serviços

Todos em `https://api.receitafederal.gov.br/apuracao-cbs/v2`, com `Authorization: Bearer <access_token>`.

### Consultas assíncronas

| Serviço | Chamada | Retorna |
|---|---|---|
| Créditos | `POST /creditos/{cnpj}` | Créditos de CBS incluídos ou atualizados |
| Débitos | `POST /debitos/{cnpj}` | Débitos de CBS incluídos ou atualizados |
| Pagamentos | `POST /pagamentos/{cnpj}` | Pagamentos que extinguem débitos: pelo contribuinte (PCONT) ou pelo adquirente (RAD) |
| Recolhimentos | `POST /recolhimentos/{cnpj}` | Recolhimentos feitos pelo adquirente (RAD), com o fornecedor e a nota de cada item |
| Situação | `GET /situacao/{tiquete}` | `PENDENTE`, `EM_PROCESSAMENTO`, `CONCLUIDA`, `ERRO` ou `EXPIRADA` |
| Download | `GET /download/{tiquete}` | `urlAssinada` do arquivo JSON e a validade dela |

`{cnpj}` é o CNPJ base, de 8 dígitos.

### Geração de guia, síncrona

| Serviço | Chamada | O que faz |
|---|---|---|
| DARF do adquirente (RAD) | `POST /rad/{cnpj}` | Gera a guia para o adquirente recolher a CBS de uma nota de compra. Entrada: `chaveDFE`, pagamento total ou parcial |
| DARF do contribuinte (PCONT) | `POST /pcont/{cnpj}` | Gera a guia do próprio contribuinte para um período de apuração |

A resposta traz chave PIX, código de barras e link do PDF. Pelo texto, o serviço **gera a guia e não efetiva o pagamento**; a página não afirma isso de forma explícita.

## Fluxo de uma consulta

1. **Credencial.** Gerada no serviço "Gerar Credencial de Acesso", em <https://consumo.tributos.gov.br/> ou em <https://servicos.receitafederal.gov.br/>, pelo contribuinte ou por seu procurador digital. Precisa valer para o estabelecimento matriz. Chaves geradas antes da versão 2.0 (liberada em 28/10/2026) precisam ser canceladas e geradas de novo.
2. **Token.** OAuth2 Client Credentials.
3. **Abertura.** O `POST` devolve `tiqueteSolicitacao` e uma estimativa de tempo.
4. **Espera.** Duas formas:
   - **consulta de situação**, a qualquer momento, sem depender de endereço público nosso;
   - **aviso** (`urlRetorno`, opcional): a Receita chama um endereço HTTPS nosso quando termina. O aviso não tem assinatura nem autenticação, e o endereço é testado com `HEAD` na abertura.
5. **Download.** `GET /download/{tiquete}` devolve a `urlAssinada`; o arquivo é baixado com `GET` simples, sem token. Fica disponível por 48 horas.

O processamento pode levar até 240 minutos; depois disso a situação vira `EXPIRADA`.

### Consulta incremental

Não há parâmetro de data nem paginação. Cada chamada devolve o que mudou desde a última solicitação concluída, limitado aos últimos 8 dias. Sem solicitação concluída nos últimos 3 meses, a busca começa no primeiro dia do mês corrente.

**Consequência:** para não perder dados, é preciso consultar pelo menos uma vez a cada 8 dias, por serviço e por cliente, e guardar tudo o que vier. Não há como pedir histórico antigo por esta API.

### Limite de uso

Quatro chamadas por API e por credencial. A FAQ diz "por dia", com reinício à meia-noite; o guia não diz o período. Só a Receita resolve a dúvida.

## O que vem sobre cada crédito

Por período de apuração (`pa`, mês/ano) e por documento fiscal:

- `chave` e tipo do documento (NF-e, CT-e, NFS-e e outros), datas de emissão, registro e atualização;
- `origem`: normal, devolução, cancelamento, perecimento e outros;
- valores de CBS, com duas casas decimais:
  - `apurado`
  - `apropriacao.aApropriar` — ainda não disponível para uso
  - `apropriacao.apropriado` — já pode ser utilizado
  - `apropriacao.suspenso`, `inapropriavel`, `prescrito`
  - `utilizacao.utilizado` — já compensou débito
  - `utilizacao.restabelecido`, `inutilizavel`
  - `naoUtilizado.saldoCredor` e `naoUtilizado.pedidoRessarcimento`

Débitos trazem, por documento, `apurado`, `extinto`, `suspenso`, `inexigivel`, `pgtoAntecipado` e `saldoDevedor`.

Recolhimentos trazem, por DARF e por item: período, vencimento, `niFornecedor`, `chaveDFE`, principal, multa, juros e total.

## O que isso significa para o produto

- **Pendente e confirmado:** `aApropriar` e `apropriado`, por nota, na visão oficial.
- **Fornecedor:** não vem no crédito. Vem nos recolhimentos (`niFornecedor`) e pode ser extraído da chave da nota (posições 7–20 nos documentos 55, 57, 62 e 65; leiaute em [`../documentos-fiscais/`](../documentos-fiscais/README.md)). Nos documentos de código 91 (chave de 50 posições) o leiaute não foi confirmado. Os recolhimentos responderam 404 nas duas credenciais testadas, então a chave foi a única fonte nos arquivos reais.
- **Ação real para destravar crédito:** o adquirente pode gerar a guia e recolher ele mesmo a CBS de uma compra (RAD). É uma ação que a API oferece hoje, diferente da "compensação em dois cliques" imaginada na concepção.
- **Ritmo:** atualização diária. A documentação fala em resposta em até 4 horas; na chamada real de 2026-11-24, com resultado vazio, a resposta veio em até 1 minuto.
- **Sem servidor público para começar:** a consulta de situação dispensa o aviso.

## Observado na chamada real (2026-11-24)

Resultado da prova de conceito (demanda 029, `app/apuracao-cbs`), com credencial do responsável, numa única sessão de cerca de quatro minutos. É **observação de um dia, de um CNPJ**, não documentação: confira de novo antes de depender dela.

| Ponto | O que se observou |
|---|---|
| Credencial | A tela do portal **não oferece escolha de ambiente** ao gerar a credencial (informado pelo responsável). Não há como marcar "produção restrita" |
| Endereços | `https://api.receitafederal.gov.br/token` e `https://api.receitafederal.gov.br/apuracao-cbs/v2` atenderam a credencial. Nenhuma URL separada de produção restrita foi necessária nem encontrada |
| Token | `POST` com as credenciais no cabeçalho `Authorization: Basic` e `grant_type=client_credentials`, sem scope: HTTP 200 na primeira tentativa. Validade devolvida: 3600 segundos. A forma "no corpo" não foi testada |
| Créditos | `POST /creditos/{cnpj}` com `{"urlRetorno":""}`: HTTP 201 com tíquete |
| Débitos | `POST /debitos/{cnpj}`, idem: HTTP 201 com tíquete |
| Recolhimentos | `POST /recolhimentos/{cnpj}`: **HTTP 404**, com o mesmo token e a mesma URL base que atenderam créditos e débitos. Mensagem de erro não registrada. **De novo em 2026-11-24, com a credencial de outra empresa:** HTTP 404, desta vez com a mensagem de endereço não encontrado (O-17) |
| Pagamentos | `POST /pagamentos/{cnpj}`: **HTTP 404**, nas mesmas condições. Mensagem de erro não registrada |
| Tempo de processamento | Créditos e débitos estavam `CONCLUIDA` já na primeira consulta de situação, feita 60 segundos depois da abertura. O tempo real é menor ou igual a isso (a documentação fala em até 240 minutos) |
| Download | `GET /download/{tiquete}` e o `GET` na `urlAssinada`: HTTP 200 nos dois casos |
| Arquivo | `apuracao` **vazia** (nenhum período) em créditos e em débitos. Raiz com `tiqueteSolicitacao`, `ni` (14 dígitos), `niConsumidor` (11 dígitos, diferente do `ni`) e `geradoEm`. **Conferir:** a anotação original dizia "válido contra o schema 1.0.0", mas os quatro schemas exigem `ni` com `^\d{8}$`, e um `ni` de 14 dígitos não passa nessa regra. As duas informações não cabem juntas, e a anotação de válido **não foi reconferida** (pergunta P-1 da demanda 030, sem resposta do responsável) |
| Segunda abertura de créditos | Cerca de dois minutos depois de a primeira ter sido concluída: **HTTP 400**. Mensagem de erro não registrada. Não se sabe se é regra de intervalo mínimo entre solicitações ou outra validação |
| Limite | Nenhum HTTP 429 em 1 pedido de token, 5 aberturas (2 de créditos e 1 de cada outro serviço), 2 consultas de situação, 2 de download e 2 downloads de arquivo. Não dá para dizer se situação e download contam, nem se abertura recusada conta |

### Observado em 2026-11-24 com a credencial de outra empresa (demanda 030)

Segunda chamada real, feita pelo responsável com a credencial de **outra empresa**, API v2, schema 1.0.0. Primeira solicitação dessa credencial. Desta vez créditos e débitos vieram **com dados**. É observação de **um arquivo de cada serviço, de um CNPJ, de um dia**; aqui só entram estrutura, códigos, contagens e proporções, **sem nenhum dado real** (CNPJ, chave, valor).

| # | Ponto | Observado |
|---|---|---|
| O-1 | Ciclo | Token, abertura, situação `CONCLUIDA` e download funcionaram; a estimativa devolvida foi de 8 segundos |
| O-2 | Schema | O arquivo de créditos **não passa no schema oficial por uma única divergência**: `ni` vem com 14 dígitos, e o schema exige `^\d{8}$`. `ni` e `niConsumidor` vêm iguais, com 14 dígitos. Todo o resto passa |
| O-3 | Volume | 9 períodos (`pa` `MM/AAAA`, de 01/2026 a 12/2026), 896 créditos; 878 num só período (11/2026), os demais com 1 a 5 cada |
| O-4 | Janela | `registro` de janeiro a novembro de 2026; toda `atualizacao` entre 2026-11-01 e 2026-11-21; arquivo gerado em 2026-11-24. A janela foi maior que 8 dias, compatível com a regra de quem não tem solicitação concluída nos últimos 3 meses; um arquivo não confirma a regra nem o limite de 8 dias |
| O-5 | Origem | `origem` 0 (normal) nos 896. Nenhuma devolução, cancelamento ou perecimento |
| O-6 | Documentos | Código 55: 207; 57: 551; 62: 3; 65: 3; 91: 132. Chave de 44 dígitos nos códigos 55, 57, 62 e 65 (as posições 21–22 repetem o código do documento); chave de **50 dígitos** no código 91 |
| O-7 | Repetição | As 896 chaves são distintas no arquivo. Não se testou crédito repetido entre arquivos |
| O-8 | Campos | Por crédito, só vieram `origem`, `documento`, `chave`, `emissao`, `registro`, `atualizacao`, `cbs.apurado` e `cbs.apropriacao.{apropriado, aApropriar, utilizacao.{utilizado, naoUtilizado.saldoCredor}}`. `suspenso`, `inapropriavel`, `prescrito`, `excedente`, `restabelecido`, `inutilizavel` e `pedidoRessarcimento` não apareceram |
| O-9 | Zero | Campo zerado vem **ausente**: `aApropriar` ausente em 9; `apropriado` e `utilizado` ausentes em 884. Exceção: `saldoCredor` vem em todos, sempre 0 |
| O-10 | Situação | 884 só com `aApropriar`; 9 só com `apropriado`; 3 com os dois. 887 dos 896 (99%) têm valor a apropriar |
| O-11 | Soma | `apurado` = `apropriado` + `aApropriar` (ausente = 0) nos 896, ao centavo |
| O-12 | Utilização | Nos 12 com `apropriado`, `apropriado` = `utilizado` e `saldoCredor` = 0 em todos: **todo o apropriado observado já tinha sido utilizado** |
| O-13 | Valores | Nenhum negativo. Número JSON com 0, 1 ou 2 casas decimais (zeros à direita cortados) |
| O-14 | Emissão × período | `emissao` no mês do `pa` em 890; antes em 3; depois em 3 |
| O-15 | Datas | Com fuso (`-03:00`); `registro` com 3 a 6 casas de fração de segundo, `atualizacao` com 0 a 3 |
| O-16 | Emitente na chave | Nas chaves de 44 dígitos, as posições 7–20 formam 125 sequências distintas de 14 dígitos; em 1 crédito a sequência é igual ao `ni` da própria empresa. Que essas posições sejam o CNPJ do emitente tem fonte em [`../documentos-fiscais/`](../documentos-fiscais/README.md) |
| O-17 | Outros serviços | Recolhimentos respondeu **HTTP 404 de novo**, com outra credencial, com a mensagem de endereço não encontrado. Pagamentos não foi tentado. Débitos: O-18 a O-25 |

**Débitos, mesma credencial, mesmo dia:**

| # | Ponto | Observado |
|---|---|---|
| O-18 | Ciclo e schema | Abertura, situação `CONCLUIDA` e download funcionaram; estimativa de 4 segundos. Mesma única divergência de schema: `ni` com 14 dígitos. `ni` e `niConsumidor` iguais entre si e aos do arquivo de créditos |
| O-19 | Volume e janela | 3 períodos (01/2026, 10/2026 e 11/2026) e 2.786 débitos: 103, 1.515 e 1.168. `atualizacao` entre 2026-11-04 e 2026-11-19 |
| O-20 | Campos | Só `origem`, `documento`, `chave`, `emissao`, `registro`, `atualizacao`, `cbs.apurado`, `cbs.extinto` e `cbs.saldoDevedor`. `suspenso`, `inexigivel` e `pgtoAntecipado` não apareceram |
| O-21 | Origem e documentos | `origem` 0 em todos. Código 55: 2.687 (chave de 44 dígitos); 91: 99 (chave de 50 dígitos). Chaves distintas |
| O-22 | Valores | `extinto` ausente quando zero (presente em 4); `saldoDevedor` presente em todos (zero em 3). `apurado` = `extinto` + `saldoDevedor` em todos, ao centavo. Nenhum negativo. 99,9% dos débitos com saldo devedor integral |
| O-23 | Emitente na chave | Nas chaves de 44 dígitos dos **débitos**, as posições 7–20 são iguais ao `ni` da empresa em 2.070, têm a mesma raiz de 8 dígitos com outro sufixo em 616 (outro estabelecimento da mesma empresa) e outra raiz em 1. Nos **créditos**, outra raiz em 763 de 764 e igual ao `ni` em 1 |
| O-24 | Mais de um estabelecimento | Um arquivo traz notas de mais de um estabelecimento da mesma raiz, mesmo com `ni` de 14 dígitos no cabeçalho. Comparar empresas pela raiz do CNPJ é o certo |
| O-25 | Nota nos dois arquivos | Uma única chave aparece em créditos e em débitos: a nota de crédito cujo emitente é a própria empresa (O-16) |

O painel (`app/painel`, demanda 030) lê esses arquivos com uma tolerância só, a do `ni` de 14 dígitos (ver a divergência 10).

**O que não foi respondido na primeira chamada**, porque não veio nenhum crédito nem débito: o que significa na prática um crédito `aApropriar`, se dá para ligá-lo ao pagamento do fornecedor, se a chave da nota basta para identificar o fornecedor e com que frequência `chaveDFE` vem vazia. Não se sabe se o resultado vazio quer dizer "nada mudou desde o primeiro dia do mês" ou "ambiente sem dados deste CNPJ". Pela decisão do responsável (P-3 da demanda 029), a prova de conceito foi aceita com o ciclo técnico comprovado.

**Consequências:**

- O ciclo token → abertura → situação → download → arquivo funciona para créditos e débitos com a documentação v2 como está.
- Recolhimentos e pagamentos **não estavam disponíveis** para esta credencial em 2026-11-24, embora documentados. A ligação crédito–fornecedor por `niFornecedor` não pôde ser testada.
- `niConsumidor` identifica a pessoa da credencial, não a empresa: é um dado a observar no desenho do acesso em nome de vários clientes.

## Tabelas de código: tipo de documento e origem

Os schemas trazem só os códigos (`documento`, `origem`). Os nomes abaixo foram transcritos das páginas `credito.html` e `debito.html`, **versão 1.3 (13/11/2026)**, na demanda 029 (`app/apuracao-cbs/src/tabelas.ts`), e aceitos como fonte na decisão F-2 da demanda 030. O painel mostra o nome como está, com o código ao lado; código fora da tabela aparece como "código <n> (sem nome na tabela)".

| `documento` | Nome | | `origem` | Nome |
|---|---|---|---|---|
| 55 | NF-e | | 0 | NORMAL |
| 57 | CT-e | | 20 | DEVOLUCAO_POR_PCONT |
| 62 | NFCOM | | 21 | DEVOLUCAO_POR_RAD |
| 63 | BP-e | | 22 | DEVOLUCAO_POR_CREDITO |
| 64 | GTV-e | | 30 | CANCELAMENTO_CREDITO |
| 65 | NFC-e | | 31 | CANCELAMENTO_RAD |
| 66 | NF3-e | | 32 | CANCELAMENTO_PCONT |
| 67 | CT-e OS | | 50 | PERECIMENTO_TRANSPORTE_FOB |
| 91 | NFS-e | | 51 | PERECIMENTO_TRANSPORTE_CIF |
| 92 | NFS-e Via | | 52 | DEVOLUCAO_PERECIMENTO_TRANSPORTE_CIF_POR_PCONT |
| 93 | BP-e TM | | 53 | DEVOLUCAO_PERECIMENTO_TRANSPORTE_CIF_POR_RAD |
| 94 | DERE | | 54 | DEVOLUCAO_PERECIMENTO_TRANSPORTE_CIF_POR_CREDITO |
| 97 | CT-e Simplificado | | 55 | NOTA_CREDITO_MULTA_JUROS |

## Ambientes e novidades

Segundo o manual da Plataforma da CBS (maio/2026), há um **Ambiente Beta** de 13/01/2026 a dezembro/2026, com DF-e reais e pagamentos simulados. A URL da produção restrita continua sem fonte, e na chamada real de 2026-11-24 não foi necessária (ver "Observado na chamada real"). O assistente do portal disse ao responsável que a "URL da API de testes" para token é o endereço de token acima e citou os caminhos v1: **é indício, não fonte**.

Segundo a notícia oficial, as APIs 2.0 estão em **produção restrita (testes)** e em **produção (beta)**, e novos serviços de apuração seriam liberados ainda em novembro de 2026, sem dizer quais. A notícia não fala de terceiros, IBS, split payment nem limites de uso.

## O que não está documentado

- **Acesso por software em nome de vários contribuintes.** As respostas trazem `niConsumidor` e há erro "consumidor não autorizado para este NI", mas o modelo de procuração para um terceiro não está descrito.
- **Por que um crédito está `aApropriar`.** Nenhum campo explica, nem no arquivo real com dados de 2026-11-24 (99% dos créditos a apropriar, e todo o apropriado já utilizado). A relação com o pagamento do fornecedor precisa ser observada na prática.
- **IBS.** Tudo trata só de CBS.
- **Token.** O endereço (`POST https://api.receitafederal.gov.br/token`), a validade (1 hora) e o limite (2 tokens por hora) têm fonte: manual Receita Integra v1.4. **Sem fonte:** se há scope e a forma de enviar as credenciais; o manual mostra só um diagrama. **Observado em 2026-11-24:** `Basic`, sem scope, funciona.
- **Produção restrita.** O portal lista serviços de "Produção Restrita", mas a URL desse ambiente não aparece. A tabela "Ambientes" do manual Receita Integra v1.4 tem só a linha Produção. **Observado em 2026-11-24:** o portal não deixa escolher ambiente ao gerar a credencial, e o endereço documentado como "Produção" atendeu.
- Se `chaveDFE` vem sempre preenchida nos recolhimentos; total da apuração por período; períodos disponíveis; horários de operação.

## Divergências dentro da própria documentação

Situação de cada uma depois da chamada real de 2026-11-24 (demanda 029, task 35): **confirmada**, **resolvida** ou **não testada**.

| # | Divergência | Situação |
|---|---|---|
| 1 | **Limite de chamadas.** Guia: "4 chamadas por credencial e por api", sem período, no endpoint de solicitação. FAQ: "por API, por dia e por credencial", só nas APIs de solicitação, com reinício à meia-noite. Manual da Plataforma da CBS (v1): "2 chamadas por dia" na solicitação e "8 chamadas por dia" no download | não testada: o limite não foi atingido (2 aberturas de créditos no dia, a segunda recusada com HTTP 400, não 429) |
| 2 | `POST /rad/{cnpj}`: o texto pede CNPJ de 14 dígitos, o exemplo usa 8 | não testada (fora do escopo da demanda 029: a aplicação não chama `/rad`) |
| 3 | **Vencimento nos pagamentos por RAD.** A página e o exemplo oficial usam data (`"2026-09-20"`); o schema 1.0.0 (`composicaoRAD.vencimento`) exige data e hora (`date-time`). **O próprio exemplo oficial não passa no schema 1.0.0.** A aplicação mantém a validação estrita: se a API real seguir o exemplo, o arquivo é guardado e recusado (código 3), sem resumo | não testada: `POST /pagamentos` respondeu HTTP 404 |
| 4 | A página do DARF do contribuinte lista o erro `CNPJ_NAO_ADQUIRENTE`, que parece copiado da página do adquirente | não testada (fora do escopo) |
| 5 | **Fim do prazo de processamento.** Guia (seção 5) e FAQ (pergunta 11): a solicitação passa para "status de erro". A página de situação mostra `EXPIRADA` com `codigoErro: "EXPIRADA"`. A aplicação trata os dois como fim | não testada |
| 6 | **`urlRetorno` ausente ou vazia.** Guia e FAQ mandam enviar `""`; as páginas das consultas (4.4) dizem "sem esse campo, consulte a situação". A aplicação envia `{"urlRetorno":""}`, como no exemplo "sem webhook" das páginas | resolvida para `""`: aceito em créditos e débitos (HTTP 201). A forma sem o campo não foi testada |
| 7 | **Validade do arquivo.** 48 h na v2; 24 h no manual da Plataforma da CBS (v1) | não testada |
| 8 | **Endereços.** O manual da Plataforma da CBS traz `/rtc/apuracao-cbs/v1/{cnpj}` e `/rtc/download/v1/{tiquete}`, com webhook no corpo; a v2 usa `/apuracao-cbs/v2/{servico}/{cnpj}`, com situação e download separados. Vale a v2; os caminhos v1 não estão implementados | resolvida para a v2: `/creditos`, `/debitos`, `/situacao` e `/download` responderam. Os caminhos v1 não foram testados |
| 9 | **Recolhimentos e pagamentos.** As páginas 1.3 documentam `POST /recolhimentos/{cnpj}` e `POST /pagamentos/{cnpj}` com "URL de Produção"; na chamada real os dois responderam HTTP 404, enquanto créditos e débitos, na mesma base, responderam 201 | confirmada em 2026-11-24; recolhimentos respondeu 404 de novo com a credencial de outra empresa, no mesmo dia (O-17) |
| 10 | **`ni` com 14 dígitos no arquivo × `^\d{8}$` nos quatro schemas.** Os schemas 1.0.0 de créditos, recolhimentos, pagamentos e débitos exigem `ni` com 8 dígitos; os arquivos reais de créditos e de débitos trazem 14 (O-2, O-18) | **confirmada** em 2026-11-24, com a credencial de outra empresa. Tratamento do painel: tolera só essa divergência (`ni` com 14 dígitos, regra `pattern`) e marca o arquivo como "aceito com divergência conhecida do schema 1.0.0"; todo o resto segue o schema. A `apuracao-cbs` **continua recusando** esse arquivo (validação estrita, decisão D-1 da demanda 029) |

## Outros serviços da credencial de chaves secretas

Vistos na tela "Nova Credencial" do portal, em 2026-11-23: Apuração Assistida e Devolução de CBS (produção, produção restrita e v2), ARGOS, Reportes de Operações de Consumo, Declaração de Regimes Específicos, TabMestre — Exportações Cashback e Plataforma de Comunicação Split. Só o primeiro foi estudado.
