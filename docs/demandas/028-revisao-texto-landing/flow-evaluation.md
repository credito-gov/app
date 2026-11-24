# 028-revisao-texto-landing — Avaliação do fluxo

Primeira demanda do fluxo por demandas.

- **Demanda:** 028-revisao-texto-landing
- **PR:** [credito-gov/app#27](https://github.com/credito-gov/app/pull/27) (merge `b35f896`, 2026-11-24)
- **Preenchido por / data:** sessão principal da demanda, 2026-11-24

## Rodadas de correção
Rodadas entre Developer e Reviewer, contadas pela sessão principal. O limite é 3.

| Rodada | Veredito | Motivo da reprovação |
|---|---|---|
| 1 | reprovado | CA-22: rolagem horizontal em 375 px (barra do mockup do Hero). CA-12: contraste baixo do selo "Exemplo ilustrativo" do Hero. Do plugin: menu do celular sem fechar e CSS morto |
| 2 | aprovado (contato pendente) | Antes da revisão, a sessão achou na conferência visual uma segunda causa de rolagem horizontal (o `translateX` da animação do Hero) e devolveu ao Developer |
| 3 | aprovado | Revisão final depois do contato real (task 16) e do ajuste "começa pela CBS" (tasks 17–25) |

**Total de rodadas:** 2 de correção (a segunda só com a sessão e o Developer), mais a revisão final do ajuste.
**Escalou ao usuário?** Não por rodadas. O usuário foi consultado sobre a validação de formato do contato (decidiu-se não validar no build) e sobre o ajuste "começa pela CBS", que veio do PR #26 mergeado durante a demanda.

## Defeitos encontrados
Um defeito por linha, antes do merge.

| Defeito | Origem (Reviewer, plugin ou usuário) | Severidade | Arquivo | Corrigido? |
|---|---|---|---|---|
| Rolagem horizontal em 375 px pela barra do mockup | Sessão principal (conferência visual), confirmado pelo Reviewer | Alta (CA-22) | `Hero.tsx` | Sim |
| Rolagem horizontal antes da animação do cartão do Hero | Sessão principal (conferência visual) | Média (CA-22) | `Hero.tsx` | Sim |
| Contraste baixo do selo "Exemplo ilustrativo" | Reviewer | Média (CA-12) | `Hero.tsx` | Sim |
| Menu do celular cobre a seção de destino | Plugin (`code-reviewer`) | Média | `Header.tsx` | Sim |
| CSS sem uso (`.reveal-scale-bounce`) | Plugin (`code-reviewer`) | Baixa (CA-10) | `index.css` | Sim |
| "o CBS" em vez de "a CBS" no texto da Spec | Reviewer | Baixa | `HowItWorks.tsx` | Sim, no ajuste da CBS |
| Contato sem validação de formato | Plugin (`silent-failure-hunter`) | Média | `config/contato.ts` | Não: o usuário aceitou conferir à mão |
| Texto apresentava CBS e IBS juntos, contra a decisão do PR #26 | Sessão principal, ao trazer a `main` | Média | vários | Sim (CA-24, CA-25) |

## Defeitos que passaram
Apareceram depois do merge, ou foram achados pelo usuário depois do veredito `aprovado`.

| Defeito | Onde apareceu | Quem deveria ter pego | Por que passou |
|---|---|---|---|
| Nenhum conhecido até o registro | — | — | — |

## Tokens por agente

Valores do último relatório de cada agente (cumulativos por agente retomado).

| Agente | Modelo | Execuções | Tokens |
|---|---|---|---|
| `architect` | `opus` | 5 (US, Spec, Tasks, ajuste CBS em 2 tentativas) | ~161 mil |
| `developer` | `sonnet` | 5 (tasks 1–15, rodada 1, rodada 2, task 16, tasks 17–25) | ~119 mil |
| `reviewer` | `opus` | 3 | ~112 mil |
| `pr-review-toolkit:code-reviewer` | `opus` | 3 | ~235 mil |
| `pr-review-toolkit:pr-test-analyzer` | Herda da sessão | 0 (a landing não tem testes) | — |
| `pr-review-toolkit:silent-failure-hunter` | Herda da sessão | 1 | ~84 mil |
| Sessão principal | Opus | 1 | Não medido |

## Intervenções manuais
O que o usuário ou a sessão principal precisou fazer fora do fluxo.

| Intervenção | Motivo |
|---|---|
| Sessão fez a conferência visual no navegador | Developer e Reviewer não têm navegador; o CA-22 só se verifica assim |
| Sessão trouxe a `main` duas vezes (PRs #25 e #26) e resolveu conflito no kanban | PRs de documentação mergeados durante a demanda |
| Sessão preencheu itens "pendente" do registro de verificação no `tasks.md` | Resultado da conferência visual feita pela sessão |
| Sessão criou `.claude/launch.json` (ignorado pelo Git) no checkout principal | O painel de navegador só lê o arquivo de lá |

## Bloqueios da guarda

| Agente | Comando ou caminho | Correto? | Observação |
|---|---|---|---|
| `architect` | Write/Edit em `.claude/worktrees/028-.../docs/demandas/...` | Não | O diretório da sessão mudou sozinho para o checkout principal, e a guarda passou a ver o worktree como fora de `docs/demandas/`. Resolvido ao voltar a sessão para o worktree |
| `developer` | `sed -i`, redirecionamento para `/tmp` e `$VAR` como destino | Sim | Contornado com Edit e scripts na raiz do worktree |

## Falhas de subagente

| Agente | O que aconteceu | Resolvido com contexto limpo? |
|---|---|---|
| `architect` | Ajuste da CBS interrompido pela guarda (ver acima), com uma edição do `us.md` sem commit | Retomado no mesmo contexto depois de corrigir o diretório; não precisou de contexto limpo |

## Decisão
- **Manter:** a busca de termos proibidos como "teste que falha" para mudança de texto; um commit por task; a pergunta do contato tratada como marcador que reprova a busca até o usuário responder.
- **Ajustar:** a conferência visual precisa estar prevista como etapa da sessão principal desde a Spec, com a checagem de `scrollWidth` em 375 px antes e depois das animações. Ao retomar subagentes, conferir antes que o diretório da sessão é o worktree.
- **Modelos:** manter. O Developer em `sonnet` deu conta do trabalho de texto e layout; o Reviewer em `opus` pegou o contraste e cruzou com a fonte tributária.
- **Plugin:** o `code-reviewer` compensou (achou o menu do celular e o CSS morto). O `silent-failure-hunter` trouxe um risco real que virou decisão do usuário. O `pr-test-analyzer` não se aplica enquanto a landing não tiver testes.
