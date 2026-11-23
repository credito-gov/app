# Kanban de demandas

Fonte única de status e backlog. O fluxo está descrito em [`../../AGENTS.md`](../../AGENTS.md).

## Nomeação

- Demanda: `NNN-slug`, três dígitos em sequência, nunca reutilizados, slug em minúsculas com hífen e sem acento. A próxima é a **028**.
- Pasta: `docs/demandas/NNN-slug/` com `us.md`, `spec.md` e `tasks.md` (ou só `bug.md`, numa correção).
- Branch: `feat/NNN-slug` (código), `docs/NNN-slug` (só documentação) ou `fix/NNN-slug` (correção).
- Modelos em [`_template/`](_template/).

## Ciclos de status

- **Funcionalidade:** `us-em-revisão` → `us-aprovada` → `spec-em-revisão` → `spec-aprovada` → `tasks-em-revisão` → `tasks-aprovada` → `em-implementação` → `em-review` → `concluída` (ou `cancelada`)
- **Correção:** `diagnóstico-em-revisão` → `diagnóstico-aprovado` → `em-implementação` → `em-review` → `concluída` (ou `cancelada`)

## Demandas

| NNN | Slug | Título | Status | Branch / PR |
|---|---|---|---|---|
| — | — | Nenhuma demanda aberta ainda | — | — |

## Backlog

Sem número: o número é reservado quando a demanda começa. Em ordem sugerida.

| Item | Tipo | Depende de |
|---|---|---|
| Terminar o redesign da landing (tasks 026 e 027) | Modelo antigo, ver [`../tasks/README.md`](../tasks/README.md) | — |
| Revisar o texto da landing: tirar placeholders e promessas sem base (`PROJECT_CONTEXT.md` §6) | Funcionalidade | Redesign concluído |
| CI da landing: lint e build em cada PR | Funcionalidade | — |
| Atualizar o design system para o tema escuro do redesign | Documentação | Redesign concluído |
| Primeira versão do painel: saldo, origem e pendências | Funcionalidade | Hipótese H1 resolvida |

## Fora do repositório, mas travando o backlog

Não são demandas de código. O resultado entra em [`../produto/hipoteses.md`](../produto/hipoteses.md).

- Levar as perguntas de [`../produto/reforma-tributaria.md`](../produto/reforma-tributaria.md) a um tributarista e decidir a fonte de dados (H1).
- Conversar com empresas e escritórios de contabilidade (H2, H4).

## Antes do fluxo

As tasks 001–027 seguiram outro modelo (task + walkthrough) e estão em [`../tasks/`](../tasks/README.md), congeladas:

- 001–005 (backend, banco, autenticação, frontend, layout): escritas, nunca desenvolvidas, **suspensas**. Partem da premissa da API da Receita. Quando o backend for retomado, vira demanda nova.
- 006–014 (landing, primeira versão): concluídas e na `main`.
- 015–027 (redesign da landing): 015–025 integradas em `feat/landing-redesign`; 026 com PR aberto; 027 pendente.
