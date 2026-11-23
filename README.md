# CreditoGov

SaaS para pequenas e médias empresas acompanharem o crédito tributário de CBS/IBS das compras como parte do caixa: quanto está confirmado, quanto depende do fornecedor e de onde vem cada valor.

## Situação

| Parte | Estado |
|---|---|
| Landing page | Redesign concluído na `main`. O endereço <https://credito-gov.vercel.app/> ainda mostra a versão antiga |
| Backend e painel | Não iniciados. Dependem da decisão sobre a fonte de dados |

Detalhes em [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md).

## Rodar a landing

Precisa de Node 20.12 ou mais novo.

```bash
cd app/landing-page
npm install
npm run dev     # http://localhost:5173
```

## Documentação

- [`docs/README.md`](docs/README.md) — índice
- [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) — contexto, decisões e regras
- [`docs/produto/visao.md`](docs/produto/visao.md) — produto e negócio
- [`docs/demandas/README.md`](docs/demandas/README.md) — o que está sendo feito
- [`AGENTS.md`](AGENTS.md) — como trabalhar no repositório com agentes

## Licença

Proprietário. © 2026 CreditoGov.
