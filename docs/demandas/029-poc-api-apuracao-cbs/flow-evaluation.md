# 029-poc-api-apuracao-cbs — Avaliação do fluxo

Segunda demanda do fluxo por demandas e a primeira com código testável.

- **Demanda:** 029-poc-api-apuracao-cbs
- **PR:** [credito-gov/app#29](https://github.com/credito-gov/app/pull/29) (merge `ec6adc6`, 2026-11-24)
- **Preenchido por / data:** sessão principal da demanda, 2026-11-24

## Rodadas de correção
Rodadas entre Developer e Reviewer, contadas pela sessão principal. O limite é 3.

| Rodada | Veredito | Motivo da reprovação |
|---|---|---|
| 1 | Reviewer: aprovado. Devolvido pela sessão | A revisão complementar achou defeitos reais de robustez: tíquete perdido se o registro falhasse após a abertura, erros sem o comando de retomada, tempo limite cortando o download, arquivo bruto truncado com nome canônico, linha ilegível do registro derrubando o download, cache do token, mensagens com causa errada, testes de segredo e de erro fracos |
| 2 | Reviewer: aprovado. Devolvido pela sessão | A correção da rodada 1 criou um bloqueio permanente do token (linha ilegível valendo "agora"); a gravação do bruto deixou de ser atômica; texto confundia contagem local com a da Receita |
| 3 | Reviewer: aprovado. Devolvido pela sessão | A correção da rodada 2 (`linkSync`) falhava em volume sem hard link e tratava como falha a sobra do arquivo temporário |
| 4 | aprovado | Revisão final, só o Reviewer |

**Total de rodadas:** 3 de correção, o limite, e 4 de revisão.
**Escalou ao usuário?** Não. A revisão depois da terceira correção aprovou.

## Defeitos encontrados
Um defeito por linha, antes do merge.

| Defeito | Origem (Reviewer, plugin ou usuário) | Severidade | Arquivo | Corrigido? |
|---|---|---|---|---|
| Tíquete perdido se a gravação do registro falhasse depois da abertura aceita | Plugin (`silent-failure-hunter`) | Alta | `api.ts`, `registro.ts` | Sim |
| Erro depois do tíquete conhecido sem o comando de retomada (inclusive token que vence na espera) | Plugin (`silent-failure-hunter`, `pr-test-analyzer`) e Reviewer | Alta | `cli.ts`, `token.ts` | Sim |
| Tempo limite de 60 s cortava a leitura do corpo e o download do arquivo | Plugin (`code-reviewer`, `silent-failure-hunter`, `pr-test-analyzer`) | Alta | `api.ts`, `token.ts` | Sim |
| Arquivo bruto truncado podia ficar com o nome canônico | Plugin (`silent-failure-hunter`) | Alta | `armazenamento.ts` | Sim |
| Linha malformada no registro derrubava o download e mascarava o 429 | Plugin (`silent-failure-hunter`) | Alta | `registro.ts` | Sim |
| Falha ao gravar o cache perdia o token obtido | Plugin (`silent-failure-hunter`) | Alta | `token.ts` | Sim |
| Base64 de id e segredo podia aparecer na saída | Developer, pelo teste novo pedido pelo `pr-test-analyzer` | Alta (CA-12) | `token.ts`, `redacao.ts` | Sim |
| Teste de segredo passava por construção; asserções fracas nos erros do comando | Plugin (`pr-test-analyzer`) | Média | `api.test.ts`, `cli.test.ts` | Sim |
| Mensagens de erro com causa errada (404 e 401 do arquivo, rede sem código) | Plugin (`silent-failure-hunter`) | Média | `erros.ts` | Sim |
| Linha ilegível do registro bloqueava o token para sempre | Plugin (`code-reviewer`), rodada 2 | Alta | `registro.ts` | Sim |
| Gravação do bruto deixou de ser atômica | Reviewer, rodada 2 | Baixa | `armazenamento.ts` | Sim |
| Arquivo bruto não era guardado em volume sem hard link | Plugin (`code-reviewer`), rodada 3 | Média | `armazenamento.ts` | Sim |
| Arquivo publicado dado como falha se a remoção do temporário falhasse | Plugin (`code-reviewer`), rodada 3 | Média | `armazenamento.ts` | Sim |
| Remoção do destino com corrida e truncamento se o processo morrer durante a cópia | Reviewer, rodada 4 | Baixa | `armazenamento.ts` | Não: registrado no PR e no handoff |
| Download usa tempo limite de 10 min, a Spec diz 60 s; sem teste | Reviewer, rodada 2 | Baixa | `api.ts`, `spec.md` | Não: registrado como desvio no PR |

## Defeitos que passaram
Apareceram depois do merge, ou foram achados pelo usuário depois do veredito `aprovado`.

| Defeito | Onde apareceu | Quem deveria ter pego | Por que passou |
|---|---|---|---|
| No HTTP 404 da abertura, a mensagem manda conferir `APURACAO_URL_BASE`, mas a URL base estava certa: recolhimentos e pagamentos é que não respondem | Chamada real, 2026-11-24 | Ninguém antes da chamada real | O caso "serviço documentado que não existe no ambiente" não estava previsto na Spec |
| O comando não avisa nem impede uma segunda abertura do mesmo serviço logo depois da primeira; a Receita respondeu HTTP 400 | Chamada real, 2026-11-24 | Ninguém antes da chamada real | Comportamento não documentado |

## Tokens por agente

| Agente | Modelo | Execuções | Tokens |
|---|---|---|---|
| `architect` | `opus` | 4 (US, revisão da US, Spec, Tasks) | cerca de 280 mil |
| `developer` | `sonnet` | 4 (tasks 1–34 e três correções) | cerca de 560 mil |
| `reviewer` | `opus` | 4 | cerca de 336 mil |
| `pr-review-toolkit:code-reviewer` | `opus` | 3 | cerca de 318 mil |
| `pr-review-toolkit:pr-test-analyzer` | Herda da sessão | 1 | cerca de 228 mil |
| `pr-review-toolkit:silent-failure-hunter` | Herda da sessão | 1 | cerca de 100 mil |
| Sessão principal | Herda da sessão | 1 | não medido |

## Intervenções manuais
O que o usuário ou a sessão principal precisou fazer fora do fluxo.

| Intervenção | Motivo |
|---|---|
| A sessão leu no navegador o manual "Receita Integra" (PDF num compartilhamento público) | A página só lista os arquivos com JavaScript e os leitores automáticos não conseguiam abrir |
| A sessão extraiu o texto do "Manual Plataforma da CBS" trazido pelo usuário | O leitor de PDF da sessão não estava disponível |
| A sessão devolveu ao Developer três rodadas com o veredito do Reviewer `aprovado` | Os defeitos vieram do plugin; o manual diz que o veredito é do Reviewer, mas defeito real do plugin volta ao Developer |
| A sessão resolveu o merge da `main` (demanda 028) no kanban e no `PROJECT_CONTEXT.md` | As duas demandas correram em paralelo e mexeram nos mesmos arquivos |
| A sessão escreveu o registro da chamada real na referência, nas hipóteses e no `PROJECT_CONTEXT.md` | A task 35 é manual, do usuário com a sessão principal |
| O usuário rodou as consultas reais no terminal dele | Regra da demanda: nenhum agente chama a API real nem vê a credencial |

## Bloqueios da guarda

| Agente | Comando ou caminho | Correto? | Observação |
|---|---|---|---|
| `architect` | Gravar páginas baixadas no scratchpad | Sim | Leu pela saída padrão |
| `architect` | Baixar os schemas para pasta temporária, para calcular o hash | Sim | Os hashes ficaram para o Developer e o Reviewer |
| `developer` | Pasta temporária fora do worktree para o segundo download dos schemas | Sim | Usou `.local/`, ignorada pelo git |
| `developer` | `cat >` e `appendFileSync` fora da pasta da demanda | Sim | Tentativas acidentais; nada foi escrito fora |

## Falhas de subagente

| Agente | O que aconteceu | Resolvido com contexto limpo? |
|---|---|---|
| — | Nenhuma falha. O Developer fez as 34 tasks numa execução | — |

## Decisão
- **Manter:** testes antes do código com a falha registrada no commit de teste; a chamada real como task manual separada; o roteiro da chamada no README; o registro local de chamadas, que permitiu à sessão acompanhar a chamada real sem ver dado fiscal.
- **Ajustar:**
  - O Reviewer aprovou as quatro rodadas e todos os defeitos de robustez vieram do plugin. Vale dizer na Spec, em critérios de aceite próprios, o que não pode se perder numa falha local (tíquete, token, arquivo), para o Reviewer cobrar.
  - Duas das três rodadas corrigiram defeitos criados pela rodada anterior. Pedir ao Developer, em correção de entrada e saída de arquivo, que liste os casos de falha antes de escolher a chamada de sistema.
  - A orientação da sessão "linha ilegível conta como chamada feita" causou o bloqueio da rodada 2: instrução de correção da sessão também precisa de revisão.
  - Demandas em paralelo que tocam o kanban e o `PROJECT_CONTEXT.md` geram conflito certo; a sessão que mergeia por último resolve.
- **Modelos:** manter Arquiteto `opus`, Developer `sonnet` e Reviewer `opus`. O Developer entregou 34 tasks e três correções sem falha.
- **Plugin:** o `silent-failure-hunter` e o `code-reviewer` compensaram: acharam todos os defeitos de alta severidade. O `pr-test-analyzer` foi o mais caro e repetiu parte dos achados, mas apontou o teste de segredo fraco que levou ao vazamento do base64; manter na primeira rodada.
