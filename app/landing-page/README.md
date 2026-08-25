# CreditoGov — Landing Page

Landing page pública do CreditoGov. Ver [`docs/tasks/006-landing-page-architecture.md`](../../docs/tasks/006-landing-page-architecture.md) para o contexto completo da decisão.

## Stack

- **Vite + React + TypeScript** — mesma stack de `app/frontend` (ver `docs/PROJECT_CONTEXT.md` §2), reaproveitando convenções e conhecimento já validados no projeto. Não há motivo para introduzir uma segunda stack de frontend só para a landing.
- **Tailwind CSS v4** (via `@tailwindcss/vite`) — utilitário de estilo, sem CSS customizado além do necessário.
- **Lint**: `oxlint` (padrão do template Vite atual, substitui ESLint).

Esta é uma landing estática (SPA sem rotas, sem chamadas a `app/backend`) — não há necessidade de SSR/SSG neste momento.

## Rodando localmente

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
npm run lint
```

## Build e execução via container

```bash
docker build -t creditogov-landing .
docker run -p 8080:80 creditogov-landing
# http://localhost:8080
```

O `Dockerfile` usa build multi-stage: `node:20-alpine` para compilar (`npm run build`) e `nginx:alpine` para servir o `dist/` estático.

> **Nota de versão:** o Vite 8 usa `rolldown` internamente, que depende de `node:util.styleText` (disponível a partir do Node 20.12). `node:18-alpine` **não funciona** para o build — use `node:20-alpine` ou mais recente.

## Deploy no Render.com

O deploy é feito como **Web Service** no Render.com, a partir do `Dockerfile` deste diretório — o Render builda e roda o container diretamente, sem necessidade de `render.yaml`. Domínio de produção ainda não definido (ver `docs/tasks/014-landing-seo.md`).

## Decisões em aberto

- Domínio de produção: pendente, depende da configuração do serviço no painel do Render.com.
- CI específico para a landing: não criado nesta task. Se o `.github/workflows/ci.yml` existente não cobrir `app/landing-page` de forma trivial, avaliar workflow próprio em task futura.
