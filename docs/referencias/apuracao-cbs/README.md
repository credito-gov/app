# APIs de apuração da CBS — Receita Federal

Resumo da documentação oficial, lida em 2026-11-23. A fonte é sempre a página original; este arquivo só registra o que foi conferido e o que ficou em aberto. A documentação muda com frequência (quatro versões entre setembro e novembro de 2026): confira a versão antes de implementar.

## Fontes

Base: <https://docs.receitafederal.gov.br/apuracao-cbs/>

| Página | Versão lida |
|---|---|
| `guiaapiassincrona.html` (regras comuns) | 1.1, de 14/10/2026 |
| `credito.html`, `debito.html`, `pagamentos.html`, `recolhimentos.html` | 1.3, de 13/11/2026 |
| `situacao-solicitacao.html` | — |
| `download.html` | 1.0, de 13/10/2026 |
| `gerar-darf-ad.html`, `gerar-darf-contrib.html` | 1.0, de 13/11/2026 |
| `faq.html` | — |
| `schemas/credito-retorno.schema.json`, `debito-retorno.schema.json`, `pagamento-retorno.schema.json` | 1.0.0 |
| [Notícia da Receita, novembro de 2026](https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/novembro/receita-federal-libera-acesso-as-novas-apis-de-apuracao-da-cbs) | lida como resumo, não literal |

**Não lidos:** schemas de recolhimento e de geração de DARF, e o manual de credenciais do "Receita Integra" (a página não abre sem navegador).

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

1. **Credencial.** Gerada no portal <https://consumo.tributos.gov.br/>, em "Gerar Credencial de Acesso para API", pelo titular do CNPJ ou por procurador digital. Precisa valer para o estabelecimento matriz.
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
- **Fornecedor:** não vem no crédito. Vem nos recolhimentos (`niFornecedor`) e pode ser extraído da chave da nota.
- **Ação real para destravar crédito:** o adquirente pode gerar a guia e recolher ele mesmo a CBS de uma compra (RAD). É uma ação que a API oferece hoje, diferente da "compensação em dois cliques" imaginada na concepção.
- **Ritmo:** atualização diária, com resposta em horas.
- **Sem servidor público para começar:** a consulta de situação dispensa o aviso.

## O que não está documentado

- **Acesso por software em nome de vários contribuintes.** As respostas trazem `niConsumidor` e há erro "consumidor não autorizado para este NI", mas o modelo de procuração para um terceiro não está descrito.
- **Por que um crédito está `aApropriar`.** Nenhum campo explica. A relação com o pagamento do fornecedor precisa ser observada na prática.
- **IBS.** Tudo trata só de CBS.
- **Token.** Endereço do serviço de token, validade e escopos.
- **Produção restrita.** O portal lista serviços de "Produção Restrita", mas a URL desse ambiente não aparece.
- Se `chaveDFE` vem sempre preenchida nos recolhimentos; total da apuração por período; períodos disponíveis; horários de operação.

## Divergências dentro da própria documentação

- Limite de chamadas: com "por dia" na FAQ, sem período no guia.
- `POST /rad/{cnpj}`: o texto pede CNPJ de 14 dígitos, o exemplo usa 8.
- Vencimento nos pagamentos por RAD: a página diz data, o schema diz data e hora.
- A página do DARF do contribuinte lista o erro `CNPJ_NAO_ADQUIRENTE`, que parece copiado da página do adquirente.

## Outros serviços da credencial de chaves secretas

Vistos na tela "Nova Credencial" do portal, em 2026-11-23: Apuração Assistida e Devolução de CBS (produção, produção restrita e v2), ARGOS, Reportes de Operações de Consumo, Declaração de Regimes Específicos, TabMestre — Exportações Cashback e Plataforma de Comunicação Split. Só o primeiro foi estudado.
