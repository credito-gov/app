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
| Revisar o texto da landing: tirar números, depoimentos e promessas sem base (`PROJECT_CONTEXT.md` §6) | Funcionalidade | — |
| Publicação da landing: decidir como o site vai ao ar, já que o Vercel recusa o repositório (plano pago, outro provedor ou conta pessoal) | Funcionalidade | Decisão do responsável |
| CI da landing: lint e build em cada PR | Funcionalidade | — |
| Atualizar o design system para o tema escuro do redesign | Documentação | — |
| Prova de conceito da API de apuração da CBS: abrir solicitação de créditos, receber o aviso, baixar e ler o arquivo com credencial própria | Funcionalidade | Credencial gerada pelo responsável |
| Primeira versão do painel: saldo, origem e pendências | Funcionalidade | Prova de conceito concluída |

## Fora do repositório, mas travando o backlog

Não são demandas de código. O resultado entra em [`../produto/hipoteses.md`](../produto/hipoteses.md).

- Levar as perguntas de [`../produto/reforma-tributaria.md`](../produto/reforma-tributaria.md) a um tributarista e decidir a fonte de dados (H1).
- Conversar com empresas e escritórios de contabilidade (H2, H4).

## Antes do fluxo

As tasks 001–027 seguiram outro modelo (task + walkthrough) e estão em [`../tasks/`](../tasks/README.md), congeladas:

- 001–005 (backend, banco, autenticação, frontend, layout): escritas, nunca desenvolvidas, **suspensas**. Partem da premissa da API da Receita. Quando o backend for retomado, vira demanda nova.
- 006–014 (landing, primeira versão): concluídas e na `main`.
- 015–027 (redesign da landing): concluídas e na `main` desde 2026-11-23.
