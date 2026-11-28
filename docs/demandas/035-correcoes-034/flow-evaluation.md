# 035-correcoes-034 — Avaliação do fluxo

- **Demanda:** 035-correcoes-034 (correção, não trivial)
- **PR:** [credito-gov/app#39](https://github.com/credito-gov/app/pull/39), mergeado em 2026-11-28
- **Preenchido por / data:** sessão principal da demanda, 2026-11-28

## Rodadas de correção
Rodadas entre Developer e Reviewer, contadas pela sessão principal. O limite é 3.

| Rodada | Veredito | Motivo da reprovação |
|---|---|---|
| Revisão inicial | aprovado | — (achados baixos do Reviewer e do plugin) |
| 1 | aprovado | — (a rodada foi aberta pela sessão para tratar seis achados baixos e reais, não por reprovação) |

**Total de rodadas:** 1 rodada de correção.
**Escalou ao usuário?** Não.

## Defeitos encontrados
Um defeito por linha, antes do merge.

| Defeito | Origem (Reviewer, plugin ou usuário) | Severidade | Arquivo | Corrigido? |
|---|---|---|---|---|
| Título do DT-22 contraditório depois do deslocamento das raízes | Reviewer | baixa | `docs/demandas/034-login/spec.md:360` | sim |
| Varreduras não pegavam a forma escapada `00\.000\.000` (um uso escapou do inventário) | Developer e Reviewer | baixa | `app/backend/test/varredura.test.ts`, `app/web/test/varredura.test.ts` | sim |
| Varreduras podiam passar sem ler arquivo nenhum | plugin (silent-failure-hunter) | média | idem | sim |
| Endereço único confiável do proxy sem caso positivo | plugin (pr-test-analyzer) | média | `app/backend/test/api/proxy.test.ts` | sim |
| Frase do bug.md prometia cobertura que a varredura não tem | plugin (pr-test-analyzer) | baixa | `docs/demandas/035-correcoes-034/bug.md` | sim |
| CA-14 sem a versão 4.2.0 da lista | Reviewer | baixa | `docs/demandas/034-login/us.md:90` | sim |
| Varreduras não pegam a forma com barra dupla nem têm âncora de dígito | Reviewer (rodada 1) | baixa | varreduras | não (registrado no PR e no handoff) |

## Defeitos que passaram
Apareceram depois do merge, ou foram achados pelo usuário depois do veredito `aprovado`.

| Defeito | Onde apareceu | Quem deveria ter pego | Por que passou |
|---|---|---|---|
| — | — | — | Nenhum até o registro. |

## Tokens por agente
Último total informado por execução (agentes retomados acumulam).

| Agente | Modelo | Execuções | Tokens |
|---|---|---|---|
| `architect` | `opus` | 1 (retomado 2 vezes) | ~163 mil |
| `developer` | `sonnet` | 1 (retomado 1 vez) | ~109 mil |
| `reviewer` | `opus` | 2 | ~75 mil + ~42 mil |
| `pr-review-toolkit:code-reviewer` | `opus` | 2 | ~126 mil + ~72 mil |
| `pr-review-toolkit:pr-test-analyzer` | Herda da sessão | 1 | ~100 mil |
| `pr-review-toolkit:silent-failure-hunter` | Herda da sessão | 1 | ~81 mil |
| Sessão principal | `opus` | 1 | não medido |

## Intervenções manuais
O que o usuário ou a sessão principal precisou fazer fora do fluxo.

| Intervenção | Motivo |
|---|---|
| O responsável consultou na Receita quatro CNPJs de matriz | Nenhuma fonte garante raiz numérica sem dono, e a consulta pública tem captcha |
| A sessão calculou os CNPJs de matriz (raiz + 0001 + DV) para a consulta | Simplificar a conferência para o responsável |
| A sessão reescreveu a pergunta P-1 em linguagem simples | O responsável não entendeu a primeira versão ("não sei e não estou entendendo") |
| A sessão mudou a pasta de trabalho para o worktree da 035 | A sessão abriu no worktree da 033 |
| Aviso à sessão da 033 sobre o novo mapa de raízes | A 033 usa `00000000` e vai quebrar nas varreduras novas |

## Bloqueios da guarda

| Agente | Comando ou caminho | Correto? | Observação |
|---|---|---|---|
| `architect` | Escrita em `.claude/worktrees/035-correcoes-034/docs/demandas/` | sim | A pasta da sessão era o worktree da 033; resolvido ao trocar a pasta da sessão |
| `architect` | Arquivo temporário para ler o PDF da Receita | sim | O PDF não foi lido; ficou registrado no bug.md |
| `developer` | Escrita em `/tmp` e no scratchpad; `git update-index` | discutível | Contornado por stdin e `git checkout -- <arquivo>`, sem burlar a regra |

## Falhas de subagente

| Agente | O que aconteceu | Resolvido com contexto limpo? |
|---|---|---|
| `architect` | Não conseguiu gravar o bug.md (guarda, pasta errada) e entregou o conteúdo no relatório | Retomado no mesmo contexto depois da troca de pasta; gravou sem refazer a análise |

## Decisão
- **Manter:** testes de varredura como guarda automática de dado real; mutação local sem commit para provar testes que passam de primeira.
- **Ajustar:**
  - A sessão da demanda precisa abrir já no worktree. Senão, a guarda bloqueia o Arquiteto.
  - Perguntas ao responsável sobre regras técnicas, como CNPJ e dígito verificador, devem vir em linguagem simples, com a ação concreta pedida.
  - O banco de teste do backend é compartilhado entre demandas paralelas e gera falhas `57P01`. Vale um banco por worktree.
- **Modelos:** manter Arquiteto `opus`, Developer `sonnet` e Reviewer `opus`. O diagnóstico exigiu pesquisa e inventário cuidadosos, e a implementação foi mecânica.
- **Plugin:** compensou. O pr-test-analyzer e o silent-failure-hunter acharam as duas lacunas médias que o Reviewer aprovou sem apontar. O code-reviewer não achou nada além do Reviewer.
