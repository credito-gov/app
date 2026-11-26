# 031-stack-arquitetura — Avaliação do fluxo

- **Demanda:** 031-stack-arquitetura
- **PR:** [credito-gov/app#35](https://github.com/credito-gov/app/pull/35), mergeado em 2026-11-26 (`e13a9b7`)
- **Preenchido por / data:** sessão principal da demanda, 2026-11-26

## Rodadas de correção
Contadas pela sessão principal. O Reviewer aprovou em todas; as rodadas vieram dos achados do `code-reviewer`, avaliados pela sessão como defeitos reais.

| Rodada | Veredito | Motivo da correção |
|---|---|---|
| 1 | Aprovado (Reviewer) | `code-reviewer`: remoção da credencial não alcança backups; condições do isolamento por linha; ordem de gravação da coleta gastava chamada após queda; nomes de estado; conta do cenário B; número da demanda do dashboard; branch atrás da `main` (032) |
| 2 | Aprovado (Reviewer) | `code-reviewer`: papel do coletor que cruza empresas contradizia o modelo; Reviewer: superusuário, Spec desalinhada, link numa linha da 032 |
| 3 | Aprovado (Reviewer) | `code-reviewer`: a função `SECURITY DEFINER` voltaria vazia com `FORCE ROW LEVEL SECURITY` |
| Extra | Aprovado (Reviewer) | Autorizada pelo responsável (opção (a)). Na conferência, os dois revisores acharam o `BYPASSRLS` no papel errado no R-3 e o `EXECUTE` de `PUBLIC`; corrigido dentro da mesma autorização, conferido pela sessão no diff |

**Total de rodadas:** 3, mais uma extra.
**Escalou ao usuário?** Sim, depois da rodada 3: o defeito da função de agendamento era real e o limite tinha sido atingido. O responsável escolheu corrigir pela opção (a).

## Defeitos encontrados

| Defeito | Origem | Severidade | Arquivo | Corrigido? |
|---|---|---|---|---|
| Remoção da credencial dita definitiva, mas os backups a mantêm | Plugin | Importante | `docs/arquitetura/README.md` | Sim |
| Isolamento por linha sem `FORCE`, papel sem posse e `SET LOCAL` | Plugin | Importante | `docs/arquitetura/README.md` | Sim |
| Abertura registrada depois da resposta: queda gastava outra chamada | Plugin | Importante | `docs/arquitetura/README.md` | Sim |
| Estado `aberta_sem_tiquete` fora da lista; nomes de estado misturados | Plugin e Reviewer | Baixa | `docs/arquitetura/README.md` | Sim |
| Conta dos 28 CNPJs atribuída à cadência diária | Plugin e Reviewer | Média | arquitetura, spec, hipóteses | Sim |
| Dashboard atribuído à 031 no `PROJECT_CONTEXT` | Plugin | Baixa | `docs/PROJECT_CONTEXT.md` | Sim |
| Branch atrás da `main` com a 032; conflitos | Plugin e Reviewer | Média | `PROJECT_CONTEXT.md`, kanban | Sim (merge pela sessão) |
| Papel do coletor entre empresas indefinido | Plugin | Importante | `docs/arquitetura/README.md` | Sim |
| Superusuário não excluído | Reviewer | Baixa | `docs/arquitetura/README.md` | Sim |
| Função de agendamento vazia com `FORCE ROW LEVEL SECURITY` | Plugin | Importante | `docs/arquitetura/README.md` | Sim (escalado) |
| `BYPASSRLS` no papel errado no R-3; `EXECUTE` de `PUBLIC` | Plugin e Reviewer | Média | arquitetura, spec | Sim |
| Ajustes de texto (alternativas da AD-7 e AD-12, `niConsumidor`, fonte do R-2) | Reviewer | Baixa | `docs/arquitetura/README.md` | Sim |

## Defeitos que passaram

| Defeito | Onde apareceu | Quem deveria ter pego | Por que passou |
|---|---|---|---|
| Nenhum conhecido até o merge | — | — | — |

Observação: na rodada 3, o Reviewer aprovou o desenho da função `SECURITY DEFINER` supondo que ela furava a segurança por linha, o que não vale com `FORCE`. O `code-reviewer` pegou. Em decisões de segurança de banco, o Reviewer julgou contra os CA e não contra o funcionamento do PostgreSQL.

## Tokens por agente
Valores do último relatório de uso de cada agente retomado (aproximados, acumulados nas retomadas).

| Agente | Modelo | Execuções | Tokens |
|---|---|---|---|
| `architect` | `opus` | 5 (US, 2 ajustes da US, Spec, Tasks) | ~154 mil |
| `developer` | `sonnet` | 5 (tasks 1–11, 4 correções) | ~178 mil |
| `reviewer` | `opus` | 4 | ~182 mil |
| `pr-review-toolkit:code-reviewer` | `opus` | 4 | ~170 mil |
| `pr-review-toolkit:pr-test-analyzer` | — | 0 (sem teste: entrega só de documentação) | — |
| `pr-review-toolkit:silent-failure-hunter` | — | 0 (sem código) | — |
| Sessão principal | — | — | não medido |

## Intervenções manuais

| Intervenção | Motivo |
|---|---|
| Três rodadas de ajuste na US pelo responsável | Premissas novas: acesso decidido pela credencial gov.br; SaaS; credencial por cliente; login federado |
| Merge da `main` com a 032 e resolução de conflitos pela sessão (task 12) | A 032 foi mergeada durante a implementação, mexendo nas mesmas linhas do `PROJECT_CONTEXT` e do kanban |
| Decisão do responsável depois da rodada 3 | Limite de rodadas atingido com defeito real |
| Branch renomeada de `feat/` para `docs/` | Entrega só de documentação |

## Bloqueios da guarda

| Agente | Comando ou caminho | Correto? | Observação |
|---|---|---|---|
| `architect` | Script no scratchpad para aplicar edições | Sim | O Arquiteto só escreve em `docs/demandas/`; refez com o Edit |
| `architect` | Comando com destino em variável de shell | Sim (falso positivo provável) | Repetido com caminho literal |

## Falhas de subagente

| Agente | O que aconteceu | Resolvido com contexto limpo? |
|---|---|---|
| Nenhuma | — | — |

## Decisão
- **Manter:** US com ajustes iterativos do responsável antes da aprovação; escolhas das alternativas na aprovação da Spec; `code-reviewer` em toda rodada numa demanda de arquitetura.
- **Ajustar:** em demanda de documentação que corre em paralelo a outras, fazer o merge da `main` antes da revisão, não depois. Em decisões de segurança de banco, pedir ao Reviewer que confira o mecanismo, não só a presença do critério.
- **Modelos:** manter Arquiteto `opus`, Developer `sonnet` e Reviewer `opus`; o Developer deu conta de texto técnico denso.
- **Plugin:** o `code-reviewer` compensou: achou todos os defeitos importantes. `pr-test-analyzer` e `silent-failure-hunter` não se aplicam a documentação e não foram acionados.
