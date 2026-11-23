# Documentação do CreditoGov

Comece pelo [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md).

| Pasta | O que tem | Vale como regra? |
|---|---|---|
| [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) | Estado do projeto, decisões, regras, glossário | Sim, é a fonte canônica |
| [`produto/`](produto/) | [Visão](produto/visao.md), [hipóteses](produto/hipoteses.md), [reforma tributária](produto/reforma-tributaria.md) | Sim |
| [`design/`](design/README.md) | Design system, wireframes, marca | Sim, com as ressalvas do README da pasta |
| [`referencias/`](referencias/split-payment/README.md) | Manuais oficiais do Split Payment | Fonte externa |
| [`demandas/`](demandas/README.md) | Kanban, templates e uma pasta por demanda | Sim |
| [`handoff/`](handoff/README.md) | Passagem de contexto entre sessões | Registro |
| [`tasks/`](tasks/README.md) | Tasks 001–027 do modelo antigo | Não. Congelado |
| [`historico/`](historico/README.md) | Documentos da concepção (ago/2026) | Não. Só consulta |

## Onde colocar o quê

- Decisão nova ou regra: `PROJECT_CONTEXT.md`, com linha no changelog.
- Hipótese confirmada ou derrubada: `produto/hipoteses.md`.
- Trabalho a fazer: uma demanda em `demandas/`.
- Documento oficial de terceiro: `referencias/`, com um README dizendo o que é e o que foi conferido.
- Documento que deixou de valer: `historico/`, sem apagar.
