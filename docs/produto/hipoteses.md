# Hipóteses e decisões em aberto

O que o projeto assume e ainda não confirmou. Quando uma hipótese for resolvida, registre aqui a conclusão, a data e a fonte, e atualize o [`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md).

Estados: **aberta**, **confirmada**, **derrubada**.

## H1 — Fonte de dados dos créditos (confirmada para a CBS em 2026-11-23)

**O que se assumiu:** uma API da Receita Federal entrega, por CNPJ, os créditos e débitos apurados.

**Conclusão:** existe. A Receita publica as APIs de apuração da CBS, com consulta de créditos, débitos e pagamentos por CNPJ, usando OAuth2 e credencial gerada pelo contribuinte no portal <https://consumo.tributos.gov.br/>. Cada crédito vem por documento fiscal, separado em "a apropriar" e "apropriado". Detalhes e fontes em [`../referencias/apuracao-cbs/README.md`](../referencias/apuracao-cbs/README.md).

A API não está nos manuais do Split Payment, que tratam de outra plataforma (entre PSPs e governo). A premissa da concepção estava certa na ideia; os endpoints e o funcionamento são outros.

**O que continua em aberto:**

| Ponto | Por que importa |
|---|---|
| Acesso em nome de vários clientes | **Premissa de 2026-11-25:** quem decide o acesso é a Receita, pela credencial gerada no gov.br pelo titular ou pelo procurador; o CreditoGov não verifica procuração. Cada cliente cadastrado informa a própria credencial (cenário A, a base; [`arquitetura/`](../arquitetura/README.md), AD-11). O cenário B (uma credencial de procurador para vários CNPJs) é contingência e depende das três perguntas abaixo, sem fonte. Não está documentado como um software consulta por muitos contribuintes ([referência](../referencias/apuracao-cbs/README.md), "O que não está documentado") |
| Pergunta operacional 1: uma credencial de procurador cobre vários CNPJs? | **Efeito:** se sim, o cenário B fica possível; se não, segue só o A. **Como obter:** perguntar à Receita ou a quem já integra a API; testar com uma credencial de procurador, por pedido do responsável |
| Pergunta operacional 2: o limite de 4 chamadas é por credencial ou por credencial e CNPJ? | **Efeito:** no cenário B, por credencial no total, com a cadência diária da AD-9 uma credencial atende 4 CNPJs por serviço; só com 1 abertura por CNPJ a cada 7 dias (4 por dia) chega ao máximo de 28; por credencial e CNPJ, o B é igual ao A. **Como obter:** Receita ou quem já integra |
| Pergunta operacional 3: qual o papel do `niConsumidor`? | **Efeito:** se identifica quem gerou a credencial, afeta o rastreio de entrega e a LGPD ([`arquitetura/`](../arquitetura/README.md), seção 8). Na primeira chamada real veio com 11 dígitos (tamanho de um CPF; a referência não diz o que é) e diferente do `ni`; na segunda, igual ao `ni`. **Como obter:** Receita |
| IBS | A API cobre só CBS. Não sabemos se e quando o Comitê Gestor oferecerá o equivalente |
| Motivo da pendência | Nenhum campo explica por que um crédito está "a apropriar". O fornecedor sai da chave da nota e da API de recolhimentos; a relação com o pagamento dele precisa ser observada na prática. **Ainda sem campo, agora com dados:** no arquivo real de créditos de 2026-11-24 (outra credencial), 99% das notas estavam a apropriar e todo o apropriado observado já tinha sido utilizado; nenhum campo diz o porquê. A tela de pendências do painel não afirma motivo |
| Histórico | Cada consulta devolve só o que mudou nos últimos 8 dias. Não há como pedir dados antigos: o que não for coletado a tempo se perde |
| Limite de quatro chamadas por API e por credencial (por dia, segundo a FAQ), resposta em até 4 horas | O produto é de atualização diária, não em tempo real. **Perguntas novas (demanda 031), sem fonte:** a consulta de situação e o download contam no limite? Abertura recusada (HTTP 400, 404) conta? Qual o fuso do reinício à meia-noite? **Efeito:** orçamento de chamadas do coletor ([`arquitetura/`](../arquitetura/README.md), seção 5). **Como obter:** Receita, ou um teste que atinja o limite, por pedido do responsável |
| Ambiente de teste | **Observado em 2026-11-24:** o portal não deixa escolher ambiente ao gerar a credencial, e os endereços documentados como "Produção" atenderam. Não há, pelo que se viu, uma URL separada de produção restrita. O manual da Plataforma da CBS (maio/2026) descreve um Ambiente Beta de 13/01/2026 a dezembro/2026, com DF-e reais e pagamentos simulados |
| Token | O endereço, a validade (1 hora) e o limite (2 por hora) agora têm fonte: manual Receita Integra v1.4 (17/07/2026). A forma de enviar as credenciais e a existência de scope **não** têm fonte; **observado em 2026-11-24:** `Basic`, sem scope, funciona, com validade de 3600 segundos |
| Serviço em beta | A documentação teve quatro versões em três meses |
| Recolhimentos e pagamentos | Documentados, mas `POST /recolhimentos` e `POST /pagamentos` responderam HTTP 404 em 2026-11-24. **Recolhimentos respondeu 404 de novo no mesmo dia com a credencial de outra empresa**, com a mensagem de endereço não encontrado. Sem eles não há `niFornecedor` nem como ver pagamento por RAD |
| Dados para observar | Com a primeira credencial, créditos e débitos vieram vazios (2026-11-24). **Com a de outra empresa, no mesmo dia, o arquivo veio com dados** (896 créditos e 2.786 débitos). Falta a **segunda consulta da mesma credencial**, para ver como um crédito muda entre arquivos (D-5) e se aparecem origens diferentes de normal (D-6). O `ni` do arquivo real vem com 14 dígitos, e o schema 1.0.0 exige 8: divergência confirmada, tratada no painel como tolerância única |

**Prova de conceito (demanda 029, `app/apuracao-cbs`), chamada real em 2026-11-24:** o ciclo completo (token, abertura, situação, download, arquivo válido) funcionou para créditos e débitos, em até um minuto cada. Recolhimentos e pagamentos responderam HTTP 404. Os arquivos vieram sem nenhum crédito ou débito, então as perguntas sobre o conteúdo continuam abertas. O registro completo está em [`../referencias/apuracao-cbs/README.md`](../referencias/apuracao-cbs/README.md), seção "Observado na chamada real".

**Como resolver o que falta:** repetir a consulta de créditos quando houver nota de compra com CBS destacada no período; acompanhar a liberação de recolhimentos e pagamentos nas páginas oficiais; perguntar à Receita ou a quem já integra sobre o modelo de procuração.

**Segunda chamada real (2026-11-24, outra empresa) e a primeira versão do painel (demanda 030):** o arquivo veio com dados e mostrou o que a primeira chamada vazia não mostrou (estrutura, contagens e proporções em [`../referencias/apuracao-cbs/README.md`](../referencias/apuracao-cbs/README.md), O-1 a O-25). As decisões abaixo foram tomadas para construir o painel e são **hipóteses a conferir**, não fatos:

| Hipótese | O que se assumiu | Como conferir |
|---|---|---|
| **D-2: tolerância do `ni`** | O arquivo com `ni` de 14 dígitos é aceito, marcado como "aceito com divergência conhecida do schema 1.0.0"; qualquer outra divergência recusa o arquivo | Rever quando a Receita publicar schema novo ou corrigir o arquivo; conferir se o `ni` de 14 dígitos vem em toda credencial e em recolhimentos e pagamentos |
| **D-3: qual valor é o saldo utilizável** | O painel mostra quatro totais separados (`aApropriar`, `apropriado`, `utilizado`, `saldoCredor`), nenhum calculado a partir dos outros, sem dizer qual deles a empresa pode usar. Todo o apropriado observado já estava utilizado | Tributarista: qual combinação dos campos é crédito utilizável e quando |
| **D-4: emitente pela chave** | O emitente é o `niFornecedor` do recolhimento ligado pela `chaveDFE` ou, sem ele, as posições 7–20 da chave de 44 posições nos documentos 55, 57, 62 e 65 (leiaute em [`../referencias/documentos-fiscais/`](../referencias/documentos-fiscais/README.md)); o código 91 (chave de 50 posições, 15% das notas de crédito observadas) fica "emitente não identificado"; nota emitida pela própria empresa aparece nos dois lados (crédito e débito) sem compensar | Obter o leiaute da chave da NFS-e nacional; conferir o emitente lido da chave contra um recolhimento quando a API de recolhimentos responder; tributarista: o que significa a nota da própria empresa nos dois lados |
| **D-5: identidade e versão do crédito** | A identidade é período, chave, tipo de documento e origem; entre arquivos vale a versão com `atualizacao` mais recente e, no empate, a do arquivo com `geradoEm` mais recente | Segunda consulta da mesma credencial: ver se o mesmo crédito reaparece, com que campos mudando, e se o período entra mesmo na identidade |
| **D-6: origens diferentes de normal** | Valores somados como vêm, sem inverter sinal, com a origem destacada. Nenhuma origem diferente de normal apareceu nos arquivos reais | Tributarista e o primeiro arquivo real que trouxer devolução, cancelamento ou perecimento |
| **DT-7: identidade do item de recolhimento** | Um item de recolhimento é identificado por número do DARF e sequencial; repetido em mais de um arquivo, vale o do arquivo com `geradoEm` mais recente | Primeiro arquivo real de recolhimentos (hoje a API responde 404): ver se o mesmo item reaparece e se mudam os campos |

## H2 — A empresa não enxerga o próprio crédito (aberta)

**O que se assumiu:** o empresário não sabe quanto crédito tem e isso atrapalha o caixa.

**O que se sabe:** nenhuma entrevista registrada. O governo e os ERPs podem passar a mostrar isso.

**Como resolver:** conversas com 5 a 10 empresas e 3 escritórios de contabilidade.

## H3 — Compensar e antecipar pelo painel (aberta, com uma ação confirmada)

**O que se assumiu:** com dois cliques a empresa compensa um débito ou antecipa o crédito com uma fintech, a 1,8% ao mês.

**O que se sabe:**

- A API de apuração da CBS permite **gerar a guia para o adquirente recolher a CBS de uma compra** (RAD) e a guia do próprio contribuinte. É uma ação real que o painel pode oferecer. Pelo texto, o serviço gera a guia e não efetiva o pagamento.
- Compensação de crédito contra débito aparece nos dados (`utilizado`, `extinto`), mas não há serviço para dispará-la.
- Antecipação com fintech: sem parceiro, sem taxa e sem confirmação de que esse crédito pode ser cedido. Facile e Liber, citadas na concepção, não foram contatadas.

**Como resolver:** tributarista para entender quando o recolhimento pelo adquirente compensa para a empresa; tributarista e advogado para a cessão; depois, parceiros financeiros.

## H4 — Preço e comissão (aberta)

**O que se assumiu:** R$ 100 por empresa por mês; 15 a 20% de comissão ao contador; cerca de 100 empresas por escritório parceiro.

**O que se sabe:** números da concepção, sem teste. A landing antiga chegou a propor outro modelo (mensalidade mais taxa de sucesso) e a landing, desde a demanda 028, diz que o preço será definido antes do lançamento.

**Como resolver:** definir na conversa com os primeiros escritórios.

## H5 — Tamanho do mercado e projeções (aberta)

**O que se assumiu:** 1,5 milhão de empresas na faixa-alvo, 3 a 4 mil clientes no primeiro ano, receita de R$ 1,2 a 1,8 milhão.

**O que se sabe:** não há fonte para nenhum desses números. Não usar em material externo.

## Outras decisões em aberto

- **Vários CNPJs por cliente:** cadastros separados ou agrupados?
- **Papel do contador no sistema:** **resolvida em 2026-11-27** (demanda 034): o contador tem acesso próprio, por vínculo, em cada empresa que o convidou. A carteira com valores é da demanda 033.
- **Stack do backend e hospedagem:** **resolvida em 2026-11-25** (demanda 031), em [`../arquitetura/README.md`](../arquitetura/README.md). Tipo de hospedagem escolhido (nuvem gerenciada); o provedor fica pendente da PD-1 (preço sem fonte).
- **Login do gov.br:** um software privado pode usar? Em que condições? **Efeito:** a autenticação própria com a entidade `identidade` aceita o gov.br como mais uma forma de login se for possível; se não, nada muda (AD-12). **Como obter:** documentação oficial do gov.br para integradores, a trazer para `docs/referencias/`. Sem fonte hoje.
- **LGPD:** perguntas para advogado, sem afirmar regra ([`../arquitetura/README.md`](../arquitetura/README.md), seção 8): base legal para tratar os dados da empresa e de quem gerou a credencial; prazo de guarda depois da saída do cliente; se a hospedagem fora do Brasil seria transferência internacional e o que ela exige; o tratamento do `niConsumidor` quando for CPF.
- **Domínio próprio da landing:** hoje está em `credito-gov.vercel.app`.
