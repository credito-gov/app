# Task 001 — Setup inicial: Backend infrastructure

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** nenhum
> **Estimativa:** 4-6h
> **Branch:** `feat/001-backend-infra`

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` — especialmente §4 (Convenções) e §4.3 (Git).
2. Confirme em `docs/tasks/README.md` que esta é a primeira task (sem pré-requisitos).
3. **Crie a branch antes de codificar:**
   ```bash
   git checkout main
   git pull --ff-only origin main
   git checkout -b feat/001-backend-infra
   ```

---

## Contexto

Esta é a task fundacional do projeto. Sem essa infraestrutura base, nenhuma outra task pode começar. O objetivo é ter um repositório Node.js + TypeScript com qualidade de código garantida (ESLint + Prettier), banco de dados PostgreSQL rodando localmente via Docker, e pipeline de CI básico no GitHub Actions.

---

## Objetivo

Criar a infraestrutura base do backend: Node.js 18 + TypeScript + ESLint + Prettier + docker-compose com PostgreSQL + GitHub Actions com lint e build.

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/backend/package.json` | Dependências e scripts (dev, build, lint, format) |
| `app/backend/tsconfig.json` | Configuração TypeScript (strict mode) |
| `app/backend/.eslintrc.json` | ESLint com regras TypeScript |
| `app/backend/.prettierrc` | Prettier com configuração padrão do projeto |
| `app/app/backend/src/app.ts` | Express app base (sem rotas ainda) |
| `app/app/backend/src/server.ts` | Entry point — inicializa o servidor |
| `app/backend/.env.example` | Todas as variáveis necessárias sem valores reais |
| `docker-compose.yml` | PostgreSQL 13 + volume persistente |
| `.github/workflows/ci.yml` | Lint + build na abertura de PR |
| `docs/tasks/walkthrough/001-backend-infra.md` | **Obrigatório.** Walkthrough da entrega. |

---

## Fora de escopo (NÃO faça)

- ❌ Não criar rotas, controllers ou models — isso é task 002+
- ❌ Não configurar banco ainda (TypeORM, migrations) — isso é task 002
- ❌ Não subir para nenhum ambiente cloud — local apenas
- ❌ Não commitar `.env` com valores reais — apenas `.env.example`

---

## Detalhes técnicos

### Estrutura de pastas a criar

```
backend/
├── src/
│   ├── app.ts          # Express app
│   └── server.ts       # Entry point
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── package.json
└── tsconfig.json

docker-compose.yml      # na raiz do repositório
.github/
└── workflows/
    └── ci.yml
```

### Variáveis obrigatórias no `.env.example`

```env
# Servidor
PORT=3000
NODE_ENV=development

# Banco de dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=creditogov
DB_USER=creditogov
DB_PASSWORD=

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=30d

# Omie
OMIE_APP_KEY=
OMIE_APP_SECRET=
OMIE_BASE_URL=https://app.omie.com.br/api/v1

# Receita Federal
RECEITA_BASE_URL=
RECEITA_CLIENT_ID=
RECEITA_CLIENT_SECRET=

# Segurança
ENCRYPTION_KEY=
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:13-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: creditogov
      POSTGRES_USER: creditogov
      POSTGRES_PASSWORD: creditogov_local
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### GitHub Actions CI

```yaml
name: CI
on:
  pull_request:
    branches: [main]
jobs:
  lint-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      - run: npm ci
        working-directory: app/backend
      - run: npm run lint
        working-directory: app/backend
      - run: npm run build
        working-directory: app/backend
```

---

## Passos sugeridos

1. Inicializar o projeto Node.js: `npm init -y` dentro de `app/backend/`
2. Instalar dependências de produção: `express`, `dotenv`
3. Instalar dependências de dev: `typescript`, `@types/node`, `@types/express`, `ts-node-dev`, `eslint`, `prettier` e plugins
4. Configurar `tsconfig.json` com `strict: true`, `outDir: dist`, `rootDir: src`
5. Configurar ESLint + Prettier
6. Criar `src/app.ts` e `src/server.ts` mínimos
7. Criar `docker-compose.yml` na raiz
8. Criar `.env.example` completo
9. Criar `.github/workflows/ci.yml`
10. Testar: `docker compose up -d && npm run dev` — servidor deve subir sem erro
11. Criar o walkthrough em `docs/tasks/walkthrough/001-backend-infra.md`
12. Atualizar `docs/tasks/README.md` — marcar ✅ na coluna 3.Desenv da task 001
13. Sincronizar com `origin/main` e abrir PR

---

## Critérios de validação

- [ ] `docker compose up -d` sobe o PostgreSQL sem erro
- [ ] `npm run dev` (dentro de `app/backend/`) inicia o servidor na porta 3000
- [ ] `npm run lint` passa sem erros
- [ ] `npm run build` gera `dist/` sem erros de TypeScript
- [ ] `.env.example` tem todas as variáveis necessárias documentadas
- [ ] `.env` **não** existe no repositório (apenas `.env.example`)
- [ ] `docs/tasks/walkthrough/001-backend-infra.md` criado com evidências reais
- [ ] `docs/tasks/README.md` atualizado com ✅ na coluna 3.Desenv
- [ ] PR criado para `main`

---

## Referências

- [`docs/PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) — §2 (Stack), §4 (Convenções), §9 (Não faça)
- [`docs/tasks/walkthrough/_template.md`](walkthrough/_template.md)
