# 033-dashboard-indicadores — Avaliação do fluxo

- **Demanda:** 033-dashboard-indicadores
- **PR:** [credito-gov/app#41](https://github.com/credito-gov/app/pull/41), mergeado em 2026-11-28
- **Preenchido por / data:** sessão principal da demanda, 2026-11-28

## Rodadas de correção
Rodadas entre Developer e Reviewer, contadas pela sessão principal. O limite é 3.

| Rodada | Veredito | Motivo da reprovação |
|---|---|---|
| 1 | aprovado | — (o plugin achou defeitos reais menores; foram tratados na correção 1, com um ajuste da Spec decidido pelo responsável) |
| 2 | aprovado | — (7 achados menores do Reviewer, tratados na correção 2 junto com o merge da 035) |
| 3 | reprovado | Raízes de CNPJ fictícias fora da lista conferida do `PROJECT_CONTEXT.md` §6, regra trazida pela 035 durante a implementação |

**Total de rodadas:** 3.
**Escalou ao usuário?** Sim. Depois da rodada 3, o responsável decidiu registrar as raízes como pendência no §6, em vez de conferi-las antes do PR. Na rodada 1 houve também uma decisão de requisito: o aviso de desatualizado passou a contar só consultas com retorno aceito.

## Defeitos encontrados
Um defeito por linha, antes do merge.

| Defeito | Origem (Reviewer, plugin ou usuário) | Severidade | Arquivo | Corrigido? |
|---|---|---|---|---|
| Valor do banco que não chega como texto vira zero sem aviso | plugin (silent-failure-hunter) | alta | `app/backend/src/paineis/dados.ts` | sim |
| Retorno recusado mantinha a tela "atualizada" e escondia o aviso de 8 dias (regra da Spec) | plugin (silent-failure-hunter) | alta | `app/backend/src/indicadores/situacao.ts` | sim, com ajuste da Spec |
| Carteira sem aviso de retornos recusados; selo "Atualizado" com `sem_dados_usaveis` e no `default` | plugin (silent-failure-hunter) | média | `carteira.ts`, `LinhaCarteira.tsx` | sim |
| Bloco dizia "ainda não consultados" quando a consulta falhou | plugin e Reviewer | média | `app/web/src/paineis/situacao.tsx` | sim |
| Pendências sem data, aviso de desatualizado e falha; "Nenhum crédito" quando havia crédito sem pendente | plugin e Reviewer | média | `app/web/src/paginas/Pendencias.tsx` | sim |
| Key React repetida nas notas do grupo (mesma chave, origens diferentes) | plugin (code-reviewer) | média | `app/web/src/paginas/NotasDoGrupo.tsx` | sim |
| Sem teste que pegasse soma em ponto flutuante (CA-23) | plugin (pr-test-analyzer) | média | `app/backend/test/` | sim |
| CA-20 em débitos sem teste | plugin (pr-test-analyzer) | média | backend e web | sim |
| Página sem `errorElement` | plugin (silent-failure-hunter) | média | `app/web/src/rotas.tsx` | sim |
| Log de recusa sem detalhe e opcional | plugin (silent-failure-hunter) | média | `app/backend/src/leitura/registrar.ts` | sim |
| Textos fixos fora de `textos.ts` | Reviewer | baixa | `app/web/src/` | sim |
| Dígitos do arquivo no caminho do log | Reviewer e code-reviewer | baixa | `app/backend/src/leitura/validacao.ts` | sim |
| Regex `d{8}` sem barra em teste | Reviewer | baixa | `app/backend/test/carregarCenario.test.ts` | sim |
| Frase do estado vazio com data em branco | Reviewer e code-reviewer | baixa | `app/web/src/paineis/textos.ts` | sim |
| Emitentes fictícios coincidindo com raízes de empresa depois da 035 | sessão principal | média | testes do backend e da web | sim |
| Raízes fictícias fora da lista conferida | Reviewer | alta (regra) | testes, cenários, READMEs | não: pendência no §6, decisão do responsável |

## Defeitos que passaram
Apareceram depois do merge, ou foram achados pelo usuário depois do veredito `aprovado`.

| Defeito | Onde apareceu | Quem deveria ter pego | Por que passou |
|---|---|---|---|
| — | — | — | Nenhum até o encerramento. A conferência no navegador ainda não foi feita. |

## Tokens por agente

| Agente | Modelo | Execuções | Tokens |
|---|---|---|---|
| `architect` | `opus` | 5 (US, Spec, Tasks, ajuste da Spec, registros na Spec) | ~514 mil |
| `developer` | `sonnet` | 4 (tasks 1–31, tasks 32–38, correção 1, correção 2) | ~996 mil |
| `reviewer` | `opus` | 3 | ~452 mil |
| `pr-review-toolkit:code-reviewer` | `opus` | 3 | ~359 mil |
| `pr-review-toolkit:pr-test-analyzer` | Herda da sessão | 1 | ~184 mil |
| `pr-review-toolkit:silent-failure-hunter` | Herda da sessão | 1 | ~150 mil |
| Sessão principal | Opus 5.5 | — | não medido |

## Intervenções manuais
O que o usuário ou a sessão principal precisou fazer fora do fluxo.

| Intervenção | Motivo |
|---|---|
| Demanda parada de us-aprovada até a Spec da 034 aprovada, e de tasks-aprovada até a 034 na `main` | Dependências de 031, 032 e login (034) |
| Três merges da `main` na branch (031/032, 034, 035) e resolução dos conflitos de documentação pela sessão | Demandas em paralelo |
| Decisão do responsável sobre o aviso de desatualizado, durante a revisão | Regra da Spec escondia falha, apontada pelo plugin |
| Pendência das raízes no `PROJECT_CONTEXT.md` §6, escrita pela sessão | Decisão do responsável após a rodada 3 |

## Bloqueios da guarda

| Agente | Comando ou caminho | Correto? | Observação |
|---|---|---|---|
| `architect` | `git` no worktree da 034 | sim | Ele leu os arquivos da 034 só com Read |

## Falhas de subagente

| Agente | O que aconteceu | Resolvido com contexto limpo? |
|---|---|---|
| — | Nenhuma. Os revisores viram falhas intermitentes do banco de teste, compartilhado entre sessões e entre revisores ao mesmo tempo; com o banco livre, a suíte passou | — |

## Decisão
- **Manter:** testes antes do código; o `silent-failure-hunter` na primeira rodada, que achou os defeitos de maior impacto (zero sem aviso, falha escondida); a revisão da Spec quando o plugin aponta que a regra esconde um problema.
- **Ajustar:**
  - Não rodar o `npm test` do backend em dois agentes ao mesmo tempo: o banco de teste é único. Só o Reviewer roda a suíte do backend; os do plugin só leem.
  - Regra transversal nova (como a de raízes da 035) entra no brief do Developer no mesmo momento, com a lista de valores permitidos, para não gastar uma rodada.
  - Demanda grande como esta (40 tasks) vale ser dividida: a carteira poderia ter sido demanda própria.
- **Modelos:** manter Arquiteto `opus`, Developer `sonnet` e Reviewer `opus`. O Developer em `sonnet` entregou 40 tasks com testes primeiro; o custo maior foi a primeira rodada longa.
- **Plugin:** sim. `silent-failure-hunter` e `pr-test-analyzer` acharam defeitos reais que o Reviewer não apontou na rodada 1. O `code-reviewer` achou um defeito (key React) e serviu de conferência do merge na rodada 3.
