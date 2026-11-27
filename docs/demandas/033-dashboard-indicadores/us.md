# 033-dashboard-indicadores — Primeiro dashboard do usuário final: indicadores do crédito de CBS

- **Status:** spec-em-revisão
- **Branch:** `feat/033-dashboard-indicadores`
- **Worktree:** `.claude/worktrees/033-dashboard-indicadores`
- **Solicitante / data:** responsável pelo produto, 2026-11-25

## História

Como dono ou responsável financeiro de uma empresa do regime regular, quero abrir o CreditoGov e ver numa tela só quanto crédito de CBS as minhas compras geraram, quanto a Receita ainda não liberou, quanto já foi liberado e já usado, e de quais emitentes vem o que está parado, para tratar esse crédito como parte do caixa sem depender de planilha nem de arquivo da Receita.

Como contador que atende várias empresas, quero ver os mesmos indicadores de cada cliente e saber quais estão com dados desatualizados ou com consulta falhando, para orientar o cliente e não apresentar um número velho como atual.

## Contexto

É o primeiro dashboard do **produto**: a tela que o usuário final vê ao entrar. O `app/painel` (demanda 030) é ferramenta interna de validação, lida com arquivos de uma pasta local; o responsável registrou no merge que a plataforma não terá aquela forma. Esta experiência nasce do zero. Da 030 vêm só o que se aprendeu sobre os dados e as decisões de domínio D-2 a D-6, que continuam hipóteses (ver [`../../produto/hipoteses.md`](../../produto/hipoteses.md), H1).

### Dependências

- **031 (stack e arquitetura):** define onde os dados ficam, quem faz as consultas à Receita e com que frequência. A Spec desta demanda só é escrita depois dela.
- **032 (design system do produto):** usa esta US para desenhar a tela, os indicadores e os estados. A Spec desta demanda só é escrita depois dela.
- **Login (demanda futura, sem número):** autenticação própria, email e senha (decisão de 2026-08-25). O dashboard só existe atrás do login; o login não é desta demanda.
- **Acesso em nome de vários contribuintes (H1, sem documentação):** condiciona a visão do contador (CA-C1 a CA-C4; ver P-6).

Esta US não escolhe stack, componente, gráfico nem cor. Diz o que cada indicador mostra, de onde vem o número e como cada estado se comporta.

### Fonte dos números

A API de apuração da CBS da Receita ([`../../referencias/apuracao-cbs/README.md`](../../referencias/apuracao-cbs/README.md)), versão v2, schemas 1.0.0. O que a documentação e os arquivos reais de 2026-11-24 sustentam:

- **Créditos** (`POST /creditos/{cnpj}`): por período de apuração (`pa`) e por documento, `chave`, `documento`, `origem`, `emissao`, `registro`, `atualizacao` e os valores em `cbs`: `apurado`; `apropriacao.aApropriar` ("ainda não disponível para uso"); `apropriacao.apropriado` ("já pode ser utilizado"); `apropriacao.utilizacao.utilizado` ("já compensou débito"); `apropriacao.utilizacao.naoUtilizado.saldoCredor`; e, quando vierem, `suspenso`, `inapropriavel`, `prescrito`, `restabelecido`, `inutilizavel`, `pedidoRessarcimento`.
- **Débitos** (`POST /debitos/{cnpj}`): por período e por documento, `apurado`, `extinto`, `saldoDevedor` (e, quando vierem, `suspenso`, `inexigivel`, `pgtoAntecipado`).
- **Recolhimentos e pagamentos:** documentados, mas responderam HTTP 404 nas duas credenciais testadas (divergência 9 da referência). Sem eles não há `niFornecedor` nem pagamento por RAD.
- **Consulta incremental:** cada consulta devolve só o que mudou desde a última concluída, limitado aos últimos 8 dias; não há como pedir histórico. Quatro chamadas por API e por credencial (por dia, segundo a FAQ).

O que a 030 aprendeu com os dados reais e que molda os indicadores:

- **Quatro saldos separados.** Em 99% das notas havia valor a apropriar, e todo o apropriado observado já tinha sido utilizado (O-10, O-12). Chamar o apropriado de "confirmado" ou "disponível" sugere um dinheiro que já não existe (D-3). Os totais ficam separados, cada um é a soma do campo como veio, e nenhum é calculado a partir dos outros.
- **Emitente lido da chave de acesso.** O crédito não traz o fornecedor. Sem recolhimentos, o emitente sai das posições 7–20 da chave de 44 posições (documentos 55, 57, 62 e 65; fonte em [`../../referencias/documentos-fiscais/`](../../referencias/documentos-fiscais/README.md)). O documento 91 (NFS-e, chave de 50 posições, cerca de 15% das notas de crédito observadas) fica "emitente não identificado". Nota emitida pela própria empresa (mesma raiz de CNPJ) aparece em grupo próprio (D-4).
- **Crédito a apropriar sem motivo informado.** Nenhum campo diz por que um crédito está a apropriar. O dashboard não afirma que o emitente deixou de recolher.
- **Forma dos dados:** campo zerado vem ausente (vale zero); `ni` vem com 14 dígitos contra 8 no schema (D-2); um arquivo traz notas de mais de um estabelecimento da mesma raiz (O-24); o mesmo crédito pode reaparecer em consultas seguintes e conta uma vez (D-5, hipótese); origens diferentes de normal não apareceram (D-6, hipótese).

### Restrições

- **Só CBS.** A API não cobre IBS.
- **Crédito não confirmado nunca é apresentado como disponível** ([`../../PROJECT_CONTEXT.md`](../../PROJECT_CONTEXT.md) §6). Nenhum indicador usa "disponível", "pode usar", "confirmado", "a receber" ou equivalente sem decisão sobre P-1 e P-4.
- **Sem regra tributária sem fonte.** O que depende de regra de CBS/IBS que não está em `docs/referencias/` está em "Perguntas em aberto".
- **Antecipação de crédito fica fora** (receita futura, H3).
- **Texto sem base:** nenhum número, prazo, promessa ou depoimento sem fonte (§6). Nenhum CNPJ real, credencial ou dado de cliente em documento, teste ou exemplo.
- **Valores em decimal exato**, nunca ponto flutuante.

## Indicadores

Cada indicador vale para **uma empresa** (raiz do CNPJ) e para o **recorte de período** escolhido (CA-12). "Campo" é o nome oficial na API; ausente vale zero.

| # | Indicador | O que significa para o usuário | De onde vem |
|---|---|---|---|
| I-1 | **Crédito apurado nas compras** | Todo o crédito de CBS que a Receita registrou nas notas de compra do período | Créditos: soma de `cbs.apurado` |
| I-2 | **A apropriar (pendente)** | Crédito registrado que a Receita ainda não liberou para uso. A Receita não informa o motivo | Créditos: soma de `cbs.apropriacao.aApropriar` |
| I-3 | **Apropriado** | Crédito que a Receita liberou. Parte ou todo pode já ter sido usado (I-4) | Créditos: soma de `cbs.apropriacao.apropriado` |
| I-4 | **Já utilizado** | Crédito que já abateu débito de CBS da empresa | Créditos: soma de `cbs.apropriacao.utilizacao.utilizado` |
| I-5 | **Saldo credor não utilizado** | Valor que a Receita informa como saldo credor não utilizado. O significado prático depende de P-4 | Créditos: soma de `cbs.apropriacao.utilizacao.naoUtilizado.saldoCredor` |
| I-6 | **Outros valores do crédito** | Valores suspensos, inapropriáveis, prescritos, restabelecidos, inutilizáveis ou em pedido de ressarcimento, quando a Receita informar. Não vieram nos arquivos reais | Créditos: soma de cada campo, separado (`suspenso`, `inapropriavel`, `prescrito`, `restabelecido`, `inutilizavel`, `pedidoRessarcimento`) |
| I-7 | **Pendente por emitente** | De quem são as notas que seguram crédito a apropriar, do maior para o menor valor | Créditos com `aApropriar` > 0, agrupados pelo emitente da chave de acesso (D-4); grupos "emitente não identificado" e "emitida pela própria empresa" |
| I-8 | **Evolução por período** | Como I-1 a I-5 se distribuem entre os períodos de apuração | Créditos: os mesmos campos, por `pa` |
| I-9 | **Débitos de CBS das vendas** | Imposto das vendas registrado pela Receita: total, quanto já foi extinto e quanto está em aberto. Fica à parte do crédito | Débitos: soma de `cbs.apurado`, `cbs.extinto` e `cbs.saldoDevedor` |
| I-10 | **Situação dos dados** | Até quando os números estão atualizados, se a última consulta funcionou e se há risco de lacuna | Data da última consulta concluída por serviço, `geradoEm` do retorno, intervalo de `atualizacao`; resultado da última tentativa |

Notas sobre os indicadores:

- I-1 a I-6 são exibidos **separados**. Nenhum é somado a outro, subtraído de outro nem derivado dos outros. Nos dados reais, `apurado` = `apropriado` + `aApropriar` em todas as notas (O-11), mas isso é observação, não regra documentada: o dashboard mostra I-1 como veio.
- I-9 não é comparado a nenhum indicador de crédito. Saldo líquido (crédito menos débito) depende de P-2.
- Quantidade de notas acompanha I-1, I-2 e cada grupo de I-7.

## Critérios de aceite

### Indicadores de crédito

- **CA-1:** O dashboard mostra I-1 a I-5, cada um com o rótulo da tabela de indicadores, a explicação em linguagem do usuário e o nome oficial do campo ao alcance do usuário (ao lado, em ajuda ou em detalhe, a critério do design). Cada valor é igual, centavo a centavo, à soma do campo nas notas do recorte.
- **CA-2:** I-1 a I-6 ficam separados: nenhum número da tela é soma, diferença ou proporção entre eles. Nenhum rótulo, título, ajuda ou mensagem do dashboard usa "disponível", "pode usar", "confirmado", "a receber", "garantido" ou equivalente para qualquer valor de crédito.
- **CA-3:** I-6 aparece só quando algum dos campos tiver valor diferente de zero no recorte, com cada campo em linha própria, rótulo e nome oficial. Sem nenhum desses valores, o dashboard não mostra o bloco nem um zero.
- **CA-4:** Junto de I-2, o dashboard diz que a Receita informa o valor a apropriar sem informar o motivo. Nenhum texto do dashboard diz ou sugere que o emitente deixou de recolher.
- **CA-5:** O dashboard mostra a quantidade de notas de crédito do recorte e quantas delas têm valor a apropriar.

### Pendente por emitente

- **CA-6:** I-7 lista os emitentes das notas com valor a apropriar maior que zero, do maior para o menor total a apropriar, com a quantidade de notas e o total de cada um. O emitente aparece pelo CNPJ que veio da chave, formatado, sem nome ou razão social.
- **CA-7:** O emitente só é identificado pela regra de D-4: chave de 44 posições dos documentos 55, 57, 62 e 65, válida pelo leiaute de [`../../referencias/documentos-fiscais/`](../../referencias/documentos-fiscais/README.md) (inclusive as exceções de série registradas lá). As demais notas, inclusive todas do documento 91, entram no grupo "emitente não identificado". O dashboard nunca deduz emitente por semelhança, nome ou valor.
- **CA-8:** A nota cujo emitente tem a mesma raiz de CNPJ da empresa entra no grupo "emitida pela própria empresa", e não como fornecedor.
- **CA-9:** A soma dos grupos de I-7 (emitentes, "não identificado" e "própria empresa") é igual a I-2, centavo a centavo. O dashboard diz que percentual de I-2 está em "emitente não identificado".
- **CA-10:** Quando há mais emitentes do que cabem no bloco, o dashboard mostra os maiores e um grupo "demais emitentes" com a soma do resto, de modo que CA-9 continue valendo; o usuário consegue chegar à lista completa e, de cada grupo, às notas que o compõem. Quantos aparecem no bloco é decisão do design (032).

### Período e débitos

- **CA-11:** I-8 mostra I-1 a I-5 por período de apuração (`pa`, mês/ano), em ordem cronológica, só para os períodos com nota no recorte, e a soma dos períodos é igual ao total geral de cada indicador.
- **CA-12:** O usuário escolhe o recorte: todos os períodos coletados ou um período de apuração. Todos os indicadores (I-1 a I-9) seguem o recorte escolhido, e a tela mostra qual é. O recorte inicial depende de P-7.
- **CA-13:** I-9 fica num bloco "Débitos de CBS (vendas)", separado dos indicadores de crédito, com `apurado`, `extinto` e `saldoDevedor` (rótulos "Débito apurado", "Já extinto" e "Em aberto", com o nome oficial). Nenhum total de débito é somado, subtraído ou comparado a total de crédito, e o bloco diz que o CreditoGov não calcula saldo líquido nesta versão.

### Situação dos dados e estados

- **CA-14:** I-10 mostra, por serviço consultado (créditos e débitos), a data e hora da última consulta concluída e o intervalo das datas de `atualizacao` das notas. O dashboard diz que os números são os das consultas feitas pelo CreditoGov e que a Receita não fornece histórico anterior a elas.
- **CA-15:** Se a última consulta concluída de um serviço tiver mais de 8 dias, o dashboard avisa que pode haver alteração da Receita que não foi recebida, porque cada consulta só devolve os últimos 8 dias (referência, "Consulta incremental"). O aviso fica no dashboard enquanto a situação durar.
- **CA-16 (sem dados, antes da primeira consulta):** Se nenhuma consulta foi concluída ainda, o dashboard não mostra R$ 0,00 em nenhum indicador: diz que os dados ainda não foram consultados e, quando houver consulta em andamento, que ela está em andamento.
- **CA-17 (sem dados, consulta vazia):** Se as consultas concluídas não trouxeram nenhuma nota de crédito, o dashboard diz que a Receita não devolveu créditos nas consultas feitas até a data de CA-14, em vez de mostrar R$ 0,00 como se fosse um saldo apurado. O mesmo vale para o bloco de débitos.
- **CA-18 (dados parciais, um serviço):** Se um serviço tem dados e o outro não (nunca consultado, consulta vazia ou com erro), cada bloco mostra o seu próprio estado: o bloco com dados mostra os números e o outro mostra o estado de CA-16, CA-17 ou CA-19. Um serviço sem dados nunca aparece como zero.
- **CA-19 (erro de consulta):** Se a última tentativa de consulta de um serviço falhou (erro, expiração, credencial recusada, limite de chamadas ou serviço indisponível), o dashboard diz que a atualização falhou, quando, e em palavras do usuário o que ele pode fazer quando a ação for dele (por exemplo, gerar nova credencial). Se havia consulta concluída antes, os números dela continuam na tela, com a data de CA-14 e o aviso de que não estão atualizados. Detalhe técnico do erro não aparece ao usuário final.
- **CA-20 (dados parciais, retorno recusado):** Se um retorno da Receita não pôde ser usado (ilegível, fora do schema além da tolerância de D-2, ou de outra empresa), nada dele entra nos números, e o dashboard avisa que há dados que não entraram nos indicadores. Nenhum retorno é descartado sem aviso.
- **CA-21:** Recolhimentos e pagamentos não entram em nenhum indicador. O dashboard não mostra bloco vazio, zero nem promessa sobre eles.
- **CA-22:** O dashboard diz que mostra só CBS e que o IBS não está na fonte de dados.

### Visão do contador (condicionada a P-6)

- **CA-C1:** O contador vê a lista das empresas que atende, com, por empresa: identificação (raiz do CNPJ formatada e o nome cadastrado no CreditoGov), I-2, I-3, I-4 e a situação dos dados (I-10).
- **CA-C2:** A lista pode ser ordenada por I-2 e por data da última consulta concluída, e destaca as empresas com consulta falhando (CA-19), sem consulta concluída (CA-16) ou com mais de 8 dias sem consulta concluída (CA-15).
- **CA-C3:** Do item da lista, o contador abre o dashboard daquela empresa, com os mesmos indicadores e estados de CA-1 a CA-22.
- **CA-C4:** Valores de empresas diferentes nunca são somados entre si nem aparecem como total da carteira.

### Valores, dados e verificação

- **CA-23:** Valores lidos sem perda e somados em decimal exato; exibidos em reais no padrão brasileiro (R$ 1.234,56, negativo com sinal). Campo ausente vale zero.
- **CA-24:** Cada crédito e cada débito conta uma vez nos indicadores, mesmo que apareça em mais de uma consulta (regra de D-5, hipótese). Retorno com notas de mais de um estabelecimento da mesma raiz conta para a mesma empresa (O-24).
- **CA-25:** Notas com origem diferente de normal entram nos totais como vêm, sem inverter sinal (D-6, hipótese), e o dashboard indica que há notas com essas origens no recorte.
- **CA-26:** Os indicadores e todos os estados de CA-16 a CA-22 (e CA-C1 a CA-C4, se ficarem) são demonstráveis e testados com dados fictícios que imitam a forma real observada (como os da 030), sem rede, sem chamada à API real e sem `.env`. Nenhum CNPJ, chave, valor ou credencial real em código, teste, exemplo ou documento.

## Fora de escopo

- **Antecipação de crédito** (receita futura, H3) e qualquer oferta ou simulação dela.
- **Projeção de caixa** (item 4 da visão): não há fonte sobre quando um crédito a apropriar passa a apropriado (ver P-3).
- Saldo líquido (crédito menos débito), salvo decisão diferente em P-2.
- Compensação, geração de guia (RAD, PCONT) e qualquer ação sobre o crédito.
- Indicadores de recolhimentos e de pagamentos (a API responde 404); emitente por `niFornecedor`.
- Lista de notas de venda; o débito fica só nos totais de I-9.
- Explicar o motivo da pendência ou afirmar que o emitente não recolheu.
- Nome ou razão social do emitente.
- IBS e tributos antigos.
- Login, cadastro de empresa, cadastro de credencial e convite do contador (demandas próprias).
- Fazer as consultas à Receita, agendá-las e guardar os retornos (decisão da 031 e de demanda de backend).
- Alertas por email ou notificação fora do dashboard.
- Exportar dados (planilha, PDF).
- Tela de detalhe da nota e lista completa de créditos com filtros, além do caminho de CA-10 (pode virar demanda própria; ver P-8).
- Evoluir o `app/painel`.

## Perguntas em aberto

- **P-1 (domínio):** Qual valor é o crédito que a empresa pode usar? A documentação diz que o apropriado "já pode ser utilizado", mas nos dados reais todo apropriado já tinha sido utilizado, e não há regra sobre a combinação de apropriado, utilizado e saldo credor. Recomendação: manter os quatro saldos separados, sem "disponível" (D-3), até um tributarista responder; registrar a resposta em `hipoteses.md`.
- **P-2 (domínio):** O dashboard mostra saldo líquido (crédito menos débito)? O `PROJECT_CONTEXT.md` diz que "o saldo é crédito menos débito", mas não há fonte sobre quais campos entram na conta (apropriado? a apropriar? saldo devedor?) nem sobre a nota emitida pela própria empresa, que aparece nos dois lados (D-4). Recomendação: não mostrar nesta versão (CA-13) e levar a pergunta ao tributarista.
- **P-3 (domínio):** Quando um crédito a apropriar passa a apropriado, e o que o trava? Nenhum campo da API diz o motivo, e a referência não tem prazo. Sem isso não há projeção de caixa nem "previsão de liberação". Recomendação: deixar a projeção fora (já está em "Fora de escopo") e levar a pergunta ao tributarista junto com as 2 e 6 de `reforma-tributaria.md`.
- **P-4 (domínio):** O que significa, para a empresa, o saldo credor não utilizado (`saldoCredor`) e o pedido de ressarcimento? É dinheiro que pode voltar ao caixa? Veio sempre zero nos dados reais. Recomendação: mostrar com o nome oficial e a explicação neutra de I-5, sem chamar de "a receber", até a resposta.
- **P-5 (texto):** A história fala em tratar o crédito "como dinheiro a receber". O dashboard pode usar essa expressão? Pela regra do §6, crédito a apropriar não pode parecer garantido. Recomendação: usar "crédito registrado" e "ainda não liberado pela Receita" nos rótulos; "a receber" só depois de P-1 e P-4.
- **P-6 (escopo):** A visão do contador (CA-C1 a CA-C4) fica nesta demanda? O acesso de um software em nome de vários contribuintes não está documentado (H1), e o papel do contador no sistema está em aberto (`hipoteses.md`, "Outras decisões em aberto"). Recomendação: manter os CA-C na US, para a 032 desenhar a tela da carteira junto, e deixar a Spec decidir se entram nesta entrega ou viram demanda própria, conforme a 031 e o modelo de acesso.
- **P-7 (produto):** Qual o recorte inicial ao abrir o dashboard: todos os períodos coletados ou o período de apuração mais recente com nota? Nos dados reais, quase todas as notas estavam num só período (O-3). Recomendação: todos os períodos coletados, porque a consulta é incremental e o usuário não tem outro histórico; o período fica a um clique (CA-12).
- **P-8 (escopo):** A lista completa de créditos e o detalhe da nota (que a 030 tinha) entram nesta demanda ou numa seguinte? CA-10 exige chegar às notas de cada grupo. Recomendação: esta demanda entrega o dashboard e uma lista simples das notas de um grupo (chave, emissão, tipo, a apropriar); filtros, busca e detalhe da nota ficam para uma demanda própria.
- **P-9 (produto):** O limiar de CA-15 é o próprio limite de 8 dias da consulta incremental. Quer um aviso mais cedo (por exemplo, antes de chegar ao limite), sabendo que o produto é de atualização diária? Recomendação: avisar ao passar de 8 dias, que é o único número com fonte; antecipar o aviso depende da frequência de consulta definida na 031.

**Aprovação (2026-11-25):** o responsável aprovou a US com as recomendações de P-1 a P-9. P-1 a P-4 continuam como perguntas ao tributarista; até a resposta, valem as recomendações. A Spec espera as demandas 031 (stack e arquitetura), 032 (design system) e a de login, ainda não aberta.
