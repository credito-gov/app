# 030-painel-primeira-versao — Avaliação do fluxo

Terceira demanda do fluxo por demandas e a primeira aplicação com telas.

- **Demanda:** 030-painel-primeira-versao
- **PR:** [credito-gov/app#31](https://github.com/credito-gov/app/pull/31) (merge `3998af6`, 2026-11-25)
- **Preenchido por / data:** sessão principal da demanda, 2026-11-25

No merge, o responsável registrou que o painel entregue é um ensaio: a plataforma não terá esta forma. Os três acabamentos de interface vistos na conferência final (abaixo) ficaram sem correção por decisão dele.

## Rodadas de correção
Rodadas entre Developer e Reviewer, contadas pela sessão principal. O limite é 3.

| Rodada | Veredito | Motivo da reprovação |
|---|---|---|
| 1 | Reviewer: aprovado. Devolvido pela sessão | A revisão complementar achou falhas silenciosas e testes fracos: arquivo com falha de leitura sumia dos totais e da tela de arquivos; falha passageira ficava no cache como recusa; erro 500 sem registro; estado vazio atribuído à Receita com arquivo recusado; aviso do cabeçalho sem distinguir recusa; filtro inválido descartado em silêncio; data que o painel não lê; `--porta 80`; a palavra "confirmado" no motivo do documento 91 |
| 2 | Reviewer: aprovado. Devolvido pela sessão | A correção da rodada 1 criou uma regressão (JSON aninhado demais derrubava todas as rotas); fictícios com data em 2027; teste tautológico; log do erro 500 sem limite |
| 3 | Reviewer: aprovado. Devolvido pela sessão | Chave repetida no JSON derrubava todas as rotas; a correção da rodada 2 tirou dos fictícios a emissão depois do mês do período |
| 4 | aprovado | Revisão final: Reviewer e `code-reviewer`, sem defeito |

**Total de rodadas:** 3 de correção, o limite, e 4 de revisão.
**Escalou ao usuário?** Não. A revisão depois da terceira correção aprovou.

## Defeitos encontrados
Um defeito por linha, antes do merge.

| Defeito | Origem (Reviewer, plugin ou usuário) | Severidade | Arquivo | Corrigido? |
|---|---|---|---|---|
| Arquivo com falha de leitura sumia dos totais e da tela de arquivos, sem aviso | Plugin (`silent-failure-hunter`) | Alta | `nucleo/arquivos.ts` | Sim |
| Falha passageira de leitura ficava no cache como recusa | Plugin (`silent-failure-hunter`) | Média | `nucleo/arquivos.ts` | Sim |
| Erro 500 sem registro no terminal | Plugin (`silent-failure-hunter`) | Média | `servidor.ts` | Sim |
| Sem créditos e com arquivo recusado, a tela dizia que a Receita não devolveu créditos | Plugin (`silent-failure-hunter`) | Alta | `paginas/vazio.ts` | Sim |
| Aviso do cabeçalho não distinguia recusado, ignorado e aceito com divergência | Plugin (`silent-failure-hunter`, `code-reviewer`) | Média | `paginas/layout.ts` | Sim |
| Filtro inválido era descartado em silêncio e a lista vinha inteira | Plugin (`silent-failure-hunter`) | Média | `nucleo/lista.ts`, `paginas/creditos.ts` | Sim |
| Data que o painel não consegue ler entrava na ordenação | Plugin (`code-reviewer`) | Média | `nucleo/datas.ts`, `nucleo/validacao.ts` | Sim |
| `--porta 80` recusava todo pedido pela conferência do `Host` | Plugin (`code-reviewer`) | Baixa | `servidor.ts` | Sim |
| A palavra "confirmado" no motivo do documento 91, contra a decisão da US | Plugin (`code-reviewer`) | Baixa | `nucleo/emitente.ts` | Sim |
| Testes fracos: dígito verificador, séries reservadas e varreduras de texto | Plugin (`pr-test-analyzer`) | Média | `test/` | Sim |
| JSON com aninhamento profundo derrubava todas as rotas (regressão da rodada 1) | Plugin (`code-reviewer`), rodada 2 | Alta | `nucleo/arquivos.ts` | Sim |
| Fictícios com data em 2027 | Plugin (`code-reviewer`), rodada 2 | Baixa | `scripts/gerarFicticios.ts` | Sim |
| Teste tautológico | Plugin (`code-reviewer`), rodada 2 | Baixa | `test/` | Sim |
| Log do erro 500 sem limite de tamanho | Plugin (`code-reviewer`), rodada 2 | Baixa | `servidor.ts` | Sim |
| Chave repetida no JSON derrubava todas as rotas | Plugin (`code-reviewer`), rodada 3 | Alta | `nucleo/arquivos.ts` | Sim, com isolamento do erro por arquivo e limite de 200 MB |
| Fictícios sem emissão depois do mês do período | Reviewer, rodada 3 | Baixa | `scripts/gerarFicticios.ts` | Sim |
| A mensagem do commit `39fd8cc` diz que schema ausente dá erro 500; o arquivo sai recusado com "erro interno" | Sessão principal | Baixa | histórico | Não: registrado no PR e no handoff |
| O ajuste 2 da Spec marca como "(rodada 3)" uma regra da rodada 2 | Sessão principal | Baixa | `spec.md` | Não |

## Defeitos que passaram
Apareceram depois do merge, ou foram achados pelo usuário depois do veredito `aprovado`.

Nenhum defeito de cálculo. A conferência da sessão no Chrome, com os fictícios, depois do veredito e antes do merge, achou três acabamentos de interface. O responsável decidiu não corrigir.

| Defeito | Onde apareceu | Quem deveria ter pego | Por que passou |
|---|---|---|---|
| A chave da nota é o link para o detalhe, mas tem aparência de texto comum | Conferência visual, 2026-11-25 | Arquiteto, na Spec | Nenhum CA trata da aparência dos links |
| Os campos de texto do filtro não estão ligados aos rótulos | Conferência visual, 2026-11-25 | Reviewer ou `code-reviewer` | Nenhum CA de acessibilidade; os testes conferem o texto, não a associação |
| A página ocupa só parte da largura em tela grande, e a coluna da chave fica apertada | Conferência visual, 2026-11-25 | Sessão principal, na primeira conferência | A primeira conferência foi a 1440 px |

O painel não foi rodado com os arquivos reais por nenhum agente (regra do projeto). O que aparecer nesse uso entra aqui.

## Tokens por agente
Soma das notificações de término de cada execução. Onde a notificação não trouxe a contagem, a execução ficou de fora da soma.

| Agente | Modelo | Execuções | Tokens |
|---|---|---|---|
| `architect` | `opus` | 8 (US e quatro retomadas até a Spec; Tasks; ajustes da Spec, duas vezes) | cerca de 870 mil |
| `developer` | `sonnet` | 4 (tasks 1–32 e três correções) | cerca de 730 mil |
| `reviewer` | `opus` | 4 | cerca de 316 mil em três; a final não foi medida |
| `pr-review-toolkit:code-reviewer` | `opus` | 4 | cerca de 130 mil na última; as três primeiras não foram medidas |
| `pr-review-toolkit:pr-test-analyzer` | Herda da sessão | 1 | não medido |
| `pr-review-toolkit:silent-failure-hunter` | Herda da sessão | 1 | não medido |
| `general-purpose` (fonte do leiaute da chave) | Herda da sessão | 1 | cerca de 138 mil |
| Sessão principal | Herda da sessão | 1 | não medido |

## Intervenções manuais
O que o usuário ou a sessão principal precisou fazer fora do fluxo.

| Intervenção | Motivo |
|---|---|
| O usuário fez uma chamada real, com a credencial de outra empresa, durante a etapa da US | Decisão dele, para ver como os dados chegam; a regra do projeto reserva a chamada ao responsável |
| A sessão orientou a chamada pelo terminal: pasta certa, `npm install`, `.env` a partir do exemplo e intervalo entre as consultas de situação | O worktree da 029, que tinha o `.env` e as dependências, já tinha sido removido; o comando espera calado entre as consultas e pareceu ter falhado |
| A sessão extraiu a forma dos arquivos reais (campos, tipos, contagens e sinais) com dois scripts temporários | Autorização do usuário; nenhum CNPJ, chave ou valor saiu dos arquivos |
| A sessão acionou um agente `general-purpose` para achar a fonte oficial do leiaute da chave de acesso | O Arquiteto não escreve regra sem fonte, e a fonte não estava em `docs/referencias/` |
| A sessão devolveu ao Developer três rodadas com o veredito do Reviewer `aprovado` | Os defeitos vieram do plugin; defeito real do plugin volta ao Developer |
| A sessão acionou o Arquiteto para registrar na Spec os comportamentos que mudaram na revisão | Mudaram depois da aprovação da Spec pelo usuário |
| A sessão conferiu as telas no navegador, duas vezes | A aplicação não tem teste de aparência; a segunda conferência foi a pedido do usuário |
| A sessão gravou o encerramento numa branch própria, com PR | O merge do PR da demanda veio antes do status `concluída` |

## Bloqueios da guarda

| Agente | Comando ou caminho | Correto? | Observação |
|---|---|---|---|
| — | Nenhum bloqueio registrado pela sessão | — | A sessão não anotou bloqueios durante a demanda; pode ter havido algum resolvido pelo próprio agente |

## Falhas de subagente

| Agente | O que aconteceu | Resolvido com contexto limpo? |
|---|---|---|
| — | Nenhuma falha. O Developer fez as 32 tasks numa execução | — |

## Decisão
- **Manter:** a chamada real antes da Spec, que mudou a especificação (o `ni` com 14 dígitos, o saldo sem "disponível", o emitente pela chave); a extração só da forma dos arquivos reais; os fictícios que imitam a forma real; a seção "Ajustes da revisão" na Spec para o que muda depois da aprovação.
- **Ajustar:**
  - Pela segunda demanda seguida, o Reviewer aprovou as quatro revisões e os defeitos de robustez vieram do plugin. O que o painel não pode esconder (arquivo que não entrou nos totais, filtro ignorado, erro interno) precisa estar em critérios de aceite próprios, para o Reviewer cobrar.
  - Duas das três rodadas corrigiram o que a rodada anterior criou. Nas duas vezes, uma entrada malformada derrubava todas as rotas. O isolamento do erro por arquivo, que resolveu de vez, devia estar na Spec desde o início.
  - A conferência visual deve acontecer depois da última rodada de correção, e em mais de uma largura de tela.
  - Combinar com o responsável, antes da Spec, se a entrega é ensaio ou produto. Esta demanda teve três rodadas de robustez numa ferramenta de conferência que não será a plataforma.
  - Registrar os bloqueios da guarda e os tokens ao longo da demanda: no fim, parte das contagens já não estava disponível.
- **Modelos:** manter Arquiteto `opus`, Developer `sonnet` e Reviewer `opus`. O Developer entregou 32 tasks e três correções sem falha. O Arquiteto foi o agente mais caro, por causa das retomadas da US depois da chamada real.
- **Plugin:** o `silent-failure-hunter` e o `code-reviewer` compensaram: acharam todos os defeitos de alta severidade. O `pr-test-analyzer` apontou testes fracos reais; manter na primeira rodada.
