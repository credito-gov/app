# Task 006 — Definição de arquitetura: Landing Page

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** nenhum
> **Estimativa:** 3-4h
> **Branch:** `feat/006-landing-page-arch`

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` na íntegra — especialmente §2 (Stack), §3 (Estrutura de repositório) e §4.3 (Git).
2. Confira em `docs/tasks/README.md` que esta é a primeira task da série "Landing Page" (sem pré-requisitos).
3. **Crie a branch antes de codificar:**
   ```bash
   git checkout main
   git pull --ff-only origin main
   git checkout -b feat/006-landing-page-arch
   ```
4. Esta task é a **primeira de um conjunto de 9** que, juntas, entregam a landing page completa. As demais (007-014) dependerão desta.

---

## Contexto

O CreditoGov ainda não tem landing page — a aplicação (`app/backend` + `app/frontend`) é o produto logado, mas não existe página pública de apresentação. O design já está pronto e será fornecido nas próximas tasks (007+); esta task **não trata de conteúdo, seções ou design** — só da base técnica sobre a qual o design será implementado.

Decisão já tomada com o responsável do projeto: a landing page vive em `app/landing-page/` (mesma convenção de `app/backend` e `app/frontend`, sem criar uma pasta `apps/` nova) e será publicada via **container**, com alvo de deploy no **Render.com**.

---

## Objetivo

Escolher e documentar a stack técnica da landing page, e entregar o scaffold mínimo rodável (projeto vazio, build funcionando, Dockerfile funcionando) — pronto para as próximas 8 tasks implementarem seções de conteúdo e metadados em cima dele.

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/landing-page/package.json` | Scaffold Vite + React + TypeScript + Tailwind (mesma stack de `app/frontend`, reaproveitando convenção e conhecimento já existente no time) |
| `app/landing-page/tsconfig.json` | TypeScript strict mode |
| `app/landing-page/tailwind.config.ts` | Config base do Tailwind |
| `app/landing-page/src/main.tsx` / `src/App.tsx` | Entry point mínimo — uma página placeholder, sem seções de conteúdo |
| `app/landing-page/Dockerfile` | Multi-stage build: `npm run build` → serve estático via nginx |
| `app/landing-page/.dockerignore` | Exclui `node_modules`, `dist` |
| `app/landing-page/README.md` | Documenta a decisão de arquitetura: stack escolhida e por quê, como rodar local, como buildar o container, como isso é publicado no Render.com |
| `docs/tasks/walkthrough/006-landing-page-architecture.md` | **Obrigatório.** Walkthrough da entrega. Use [`docs/tasks/walkthrough/_template.md`](walkthrough/_template.md) como base. |

> ⚠️ **Regra anti-ambiguidade:** se este prompt depende de uma estrutura ou convenção definida em `PROJECT_CONTEXT.md`, a estrutura de pastas já foi decidida acima. Em caso de divergência detectada, pare e pergunte antes de codificar.

---

## Fora de escopo (NÃO faça)

- ❌ Não implementar nenhuma seção de conteúdo (hero, features, footer, etc.) — isso é task 007+
- ❌ Não portar o design ainda — o design chega nas próximas tasks
- ❌ Não configurar domínio/DNS no Render.com — só o Dockerfile precisa buildar e rodar localmente
- ❌ Não criar formulário de captura de lead nem qualquer integração com `app/backend` — decisão de escopo (institucional vs. lead capture vs. CTA para login) ainda não foi tomada e não é parte desta task
- ❌ Não criar pipeline de CI específico para a landing page, a menos que seja trivial reaproveitar o `.github/workflows/ci.yml` existente — se não for trivial, deixe para uma task futura e anote em "Decisões em aberto" no README da landing page
- ❌ Se surgir a tentação de expandir além do descrito acima, pare e pergunte

---

## Detalhes técnicos

### Por que Vite + React + TypeScript + Tailwind

Mesma stack de `app/frontend` (ver `docs/PROJECT_CONTEXT.md` §2). Reaproveita convenções, tooling e conhecimento já validados no projeto — não há motivo para introduzir uma segunda stack de frontend só para a landing page. Se a task de execução encontrar um motivo concreto para divergir (ex: necessidade de SSG/SEO que o Vite puro não resolve bem), documente a alternativa e o porquê no `app/landing-page/README.md` antes de prosseguir.

### Estrutura de pastas

```
app/landing-page/
├── src/
│   ├── main.tsx
│   └── App.tsx          # placeholder, sem seções ainda
├── public/
├── Dockerfile
├── .dockerignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

### Dockerfile (multi-stage, build estático servido por nginx)

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Render.com

Documentar no `README.md` da landing page que o deploy no Render.com é feito como **Web Service** a partir do Dockerfile acima (Render builda e roda o container diretamente — não precisa de `render.yaml` nesta task). Registrar isso como decisão, não implementar o serviço no painel do Render.

---

## Passos sugeridos

1. Criar `app/landing-page/` com `npm create vite@latest . -- --template react-ts`
2. Instalar e configurar Tailwind CSS
3. Reduzir `App.tsx` a um placeholder simples (ex: `<h1>CreditoGov</h1>`)
4. Testar `npm run dev` e `npm run build` localmente
5. Criar o `Dockerfile` e `.dockerignore`
6. Testar o build do container: `docker build -t creditogov-landing app/landing-page && docker run -p 8080:80 creditogov-landing` — acessar `localhost:8080` e confirmar que a página carrega
7. Escrever `app/landing-page/README.md` com a decisão de arquitetura, como rodar local e como o deploy funciona no Render.com
8. Criar o walkthrough em `docs/tasks/walkthrough/006-landing-page-architecture.md`
9. Atualizar `docs/tasks/README.md` — marcar ✅ na coluna 3.Desenv da task 006, e adicionar as tasks 007-014 (landing page) à tabela como bloqueadas por 006, se já estiverem definidas
10. Sincronizar com `origin/main` e abrir PR

---

## Critérios de validação

- [ ] `npm run dev` (dentro de `app/landing-page/`) sobe a página placeholder sem erro
- [ ] `npm run build` gera `dist/` sem erros de TypeScript
- [ ] `docker build` do `app/landing-page/Dockerfile` completa sem erro
- [ ] `docker run` do container resultante serve a página em `localhost:8080` (ou porta equivalente)
- [ ] `app/landing-page/README.md` documenta a decisão de stack, como rodar local e como o deploy funciona no Render.com
- [ ] Commits seguem Conventional Commits
- [ ] Lint/format passam sem erros
- [ ] **`docs/tasks/walkthrough/006-landing-page-architecture.md` criado** com evidências reais de validação
- [ ] **`docs/tasks/README.md` atualizado com ✅ na coluna 3.Desenv da task 006**
- [ ] **Branch sincronizada com `origin/main`** antes do merge
- [ ] PR criado descrevendo: o quê, por quê, como testar, riscos — link pro walkthrough no corpo
- [ ] PR contém **apenas commits da task 006** (`git log origin/main..HEAD` para conferir)

---

## Referências

- [`docs/PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) — §2 (Stack), §3 (Estrutura de repositório), §4 (Convenções)
- [`docs/tasks/001-backend-infra.md`](001-backend-infra.md) — task equivalente para o backend, mesmo espírito de setup fundacional
- [`docs/tasks/walkthrough/_template.md`](walkthrough/_template.md)
