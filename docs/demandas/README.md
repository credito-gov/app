# Kanban de demandas

Fonte única de status e backlog. O fluxo está descrito em [`../../AGENTS.md`](../../AGENTS.md).

## Nomeação

- Demanda: `NNN-slug`, três dígitos em sequência, nunca reutilizados, slug em minúsculas com hífen e sem acento. A próxima é a **035**.
- Pasta: `docs/demandas/NNN-slug/` com `us.md`, `spec.md` e `tasks.md` (ou só `bug.md`, numa correção).
- Branch: `feat/NNN-slug` (código), `docs/NNN-slug` (só documentação) ou `fix/NNN-slug` (correção).
- Modelos em [`_template/`](_template/).

## Ciclos de status

- **Funcionalidade:** `us-em-revisão` → `us-aprovada` → `spec-em-revisão` → `spec-aprovada` → `tasks-em-revisão` → `tasks-aprovada` → `em-implementação` → `em-review` → `concluída` (ou `cancelada`)
- **Correção:** `diagnóstico-em-revisão` → `diagnóstico-aprovado` → `em-implementação` → `em-review` → `concluída` (ou `cancelada`)

## Demandas

| NNN | Slug | Título | Status | Branch / PR |
|---|---|---|---|---|
| 028 | [revisao-texto-landing](028-revisao-texto-landing/us.md) | Revisar o texto da landing para o pré-lançamento | concluída | [credito-gov/app#27](https://github.com/credito-gov/app/pull/27) |
| 029 | [poc-api-apuracao-cbs](029-poc-api-apuracao-cbs/us.md) | Prova de conceito da API de apuração da CBS | concluída | [credito-gov/app#29](https://github.com/credito-gov/app/pull/29) |
| 030 | [painel-primeira-versao](030-painel-primeira-versao/us.md) | Primeira versão do painel: saldo, origem e pendências | concluída | [credito-gov/app#31](https://github.com/credito-gov/app/pull/31) |
| 031 | [stack-arquitetura](031-stack-arquitetura/us.md) | Stack e arquitetura do produto | concluída | [credito-gov/app#35](https://github.com/credito-gov/app/pull/35) |
| 032 | [design-system-produto](032-design-system-produto/us.md) | Design system do produto | concluída | [credito-gov/app#33](https://github.com/credito-gov/app/pull/33) |
| 033 | [dashboard-indicadores](033-dashboard-indicadores/us.md) | Primeiro dashboard do usuário final: indicadores do crédito de CBS | us-aprovada | `feat/033-dashboard-indicadores` |

## Backlog

Sem número: o número é reservado quando a demanda começa. Em ordem sugerida.

| Item | Tipo | Depende de |
|---|---|---|
| Publicação da landing: decidir como o site vai ao ar, já que o Vercel recusa o repositório (plano pago, outro provedor ou conta pessoal) | Funcionalidade | Decisão do responsável |
| CI da landing: lint e build em cada PR | Funcionalidade | — |

## Fora do repositório, mas travando o backlog

Não são demandas de código. O resultado entra em [`../produto/hipoteses.md`](../produto/hipoteses.md).

- Levar as perguntas de [`../produto/reforma-tributaria.md`](../produto/reforma-tributaria.md) a um tributarista e decidir a fonte de dados (H1).
- Conversar com empresas e escritórios de contabilidade (H2, H4).

## Antes do fluxo

As tasks 001–027 seguiram outro modelo (task + walkthrough) e estão em [`../tasks/`](../tasks/README.md), congeladas:

- 001–005 (backend, banco, autenticação, frontend, layout): escritas, nunca desenvolvidas, **suspensas**. Partem da premissa da API da Receita. Quando o backend for retomado, vira demanda nova.
- 006–014 (landing, primeira versão): concluídas e na `main`.
- 015–027 (redesign da landing): concluídas e na `main` desde 2026-11-23.
