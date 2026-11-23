# APIs de apuração da CBS — Receita Federal

Resumo da documentação oficial, lida em 2026-11-23. A fonte é sempre a página original; este arquivo só registra o que foi conferido e o que ficou em aberto. A documentação muda com frequência (quatro versões entre setembro e novembro de 2026): confira a versão antes de implementar.

## Fontes

| Página | Versão lida |
|---|---|
| <https://docs.receitafederal.gov.br/apuracao-cbs/> | índice |
| `.../guiaapiassincrona.html` (regras comuns) | 1.1, de 14/10/2026 |
| `.../credito.html`, `.../debito.html`, `.../pagamentos.html` | 1.3, de 13/11/2026 |
| `.../faq.html` | — |
| [Notícia da Receita, novembro de 2026](https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/novembro/receita-federal-libera-acesso-as-novas-apis-de-apuracao-da-cbs) | lida como resumo, não literal |

**Ainda não lidas:** `situacao-solicitacao.html`, `download.html`, `recolhimentos.html`, `gerar-darf-ad.html`, `gerar-darf-contrib.html`, os schemas JSON de retorno e o manual de credenciais do "Receita Integra".

## O que a API faz

Entrega os mesmos dados do serviço "Minhas Apurações Assistidas de CBS" do portal <https://consumo.tributos.gov.br/>.

| Serviço | Chamada | Retorna |
|---|---|---|
| Créditos | `POST https://api.receitafederal.gov.br/apuracao-cbs/v2/creditos/{cnpj}` | Créditos de CBS incluídos ou atualizados no período |
| Débitos | `POST .../apuracao-cbs/v2/debitos/{cnpj}` | Débitos de CBS incluídos ou atualizados |
| Pagamentos | `POST .../apuracao-cbs/v2/pagamentos/{cnpj}` | Pagamentos que extinguem débitos, por contribuinte (PCONT) ou pelo adquirente (RAD) |

`{cnpj}` é o CNPJ base, de 8 dígitos. O índice lista também recolhimentos, situação da solicitação, download e geração de DARF, em páginas ainda não lidas.

## Como funciona

1. **Credencial.** Gerada no portal, no serviço "Gerar Credencial de Acesso para API", pelo titular do CNPJ ou por procurador digital. Precisa valer para o estabelecimento matriz.
2. **Token.** OAuth2 Client Credentials. As chamadas levam `Authorization: Bearer <access_token>`.
3. **Chamada assíncrona.** O `POST` abre uma solicitação e devolve um tíquete. O corpo leva `urlRetorno`, um endereço HTTPS nosso que a Receita chama quando o arquivo fica pronto. A Receita testa esse endereço com um `HEAD` na abertura e recusa a solicitação se ele não responder.
4. **Aviso.** A Receita faz `POST` na `urlRetorno` com o tíquete e a situação. Esse aviso não tem assinatura nem autenticação.
5. **Download.** O arquivo JSON fica disponível por 48 horas, numa URL pré-assinada, baixada com `GET` simples.

O processamento pode levar até 240 minutos.

### Consulta incremental

Não há parâmetro de data nem paginação documentada. Cada chamada devolve o que mudou desde a última solicitação concluída, limitado aos últimos 8 dias. Sem solicitação concluída nos últimos 3 meses, a busca começa no primeiro dia do mês corrente.

### Limite de uso

Quatro chamadas por API e por credencial. A FAQ diz "por dia", com reinício à meia-noite; o guia não diz o período. Confirmar.

## O que vem sobre cada crédito

Por período de apuração (`pa`, mês/ano) e por documento fiscal:

- `chave` e tipo do documento (NF-e, CT-e, NFS-e e outros), datas de emissão, registro e atualização;
- `origem`: normal, devolução, cancelamento, perecimento e outros;
- valores de CBS:
  - `apurado`
  - `apropriacao.aApropriar` — ainda não disponível para uso
  - `apropriacao.apropriado` — já pode ser utilizado
  - `apropriacao.suspenso`, `inapropriavel`, `prescrito`
  - `utilizacao.utilizado` — já compensou débito
  - `utilizacao.restabelecido`, `inutilizavel`
  - `naoUtilizado.saldoCredor` e `naoUtilizado.pedidoRessarcimento`

**Para o produto:** a separação entre `aApropriar` e `apropriado` é o "pendente" e o "confirmado" do CreditoGov, na visão oficial e por documento.

Débitos trazem, por documento, `apurado`, `extinto`, `suspenso`, `inexigivel`, `pgtoAntecipado` e `saldoDevedor`. Pagamentos trazem o DARF, o tipo (RAD ou PCONT), e, nos pagamentos por RAD, a chave do documento fiscal e o contribuinte.

## O que não está documentado

- **Fornecedor.** O crédito não traz o CNPJ do fornecedor como campo. Há a chave do documento fiscal, de onde o emitente pode ser extraído (a confirmar para cada tipo de documento).
- **Por que um crédito está `aApropriar`.** A página de créditos não liga o crédito ao pagamento do fornecedor.
- **IBS.** Tudo trata só de CBS.
- **Acesso por software em nome de vários contribuintes.** As respostas trazem `niConsumidor` e há erro "consumidor não autorizado para este NI", mas o modelo de procuração para um terceiro não está descrito.
- **Produção restrita.** O portal lista serviços de "Produção Restrita", mas a URL desse ambiente não aparece nas páginas lidas.
- **Token.** Endereço do serviço de token, validade e escopos (devem estar no manual do Receita Integra).
- Total da apuração por período, períodos disponíveis e horários de operação.

## Serviços listados no portal para a credencial de chaves secretas

Vistos na tela "Nova Credencial", em 2026-11-23: Apuração Assistida e Devolução de CBS (produção, produção restrita e v2), ARGOS, Reportes de Operações de Consumo, Declaração de Regimes Específicos, TabMestre — Exportações Cashback e Plataforma de Comunicação Split. Só o primeiro foi estudado.
