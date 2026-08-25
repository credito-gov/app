# Task 004 — Setup Frontend: React + Vite + TypeScript + Tailwind + shadcn/ui + Redux + Router

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** task 003 merged
> **Estimativa:** 4-5h
> **Branch:** `feat/004-frontend-setup`

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` — §2 (Stack Frontend), §4 (Convenções).
2. Confirme que a task 003 está **merged** em `main`.
3. ```bash
   git checkout main && git pull --ff-only origin main
   git checkout -b feat/004-frontend-setup
   ```

---

## Contexto

Com o backend de auth pronto, iniciamos o frontend. Esta task cria toda a infraestrutura da aplicação React — sem ainda implementar telas. O objetivo é ter o projeto configurado, compilando sem erros e com todas as ferramentas prontas para as tasks de UI.

---

## Objetivo

Criar a aplicação React 18 + Vite + TypeScript com Tailwind CSS, shadcn/ui, Redux Toolkit, React Router e Axios configurados e funcionando.

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/frontend/` | Projeto Vite completo |
| `app/app/frontend/src/store/store.ts` | Redux store configurado |
| `app/app/frontend/src/store/authSlice.ts` | Slice de autenticação |
| `app/app/frontend/src/store/creditosSlice.ts` | Slice de créditos (vazio por ora) |
| `app/app/frontend/src/store/uiSlice.ts` | Slice de UI (loading, toasts) |
| `app/app/frontend/src/api/client.ts` | Instância Axios com interceptors de auth |
| `app/app/frontend/src/api/endpoints.ts` | Constantes de endpoints da API |
| `app/app/frontend/src/App.tsx` | App com React Router (rotas placeholder) |
| `app/app/frontend/.env.example` | `VITE_API_URL` e demais variáveis |
| `.github/workflows/ci.yml` | Adicionar job de lint + build do frontend |
| `docs/tasks/walkthrough/004-frontend-setup.md` | **Obrigatório.** |

---

## Fora de escopo (NÃO faça)

- ❌ Não criar telas ou componentes de UI — isso é task 005+
- ❌ Não implementar chamadas reais à API — apenas configurar o client Axios
- ❌ Não usar TailwindCSS v4 — usar v3 (compatível com shadcn/ui)

---

## Detalhes técnicos

### Criação do projeto

```bash
cd app/frontend
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### shadcn/ui

```bash
npx shadcn-ui@latest init
# Escolher: TypeScript, Tailwind, src/components/ui
```

### Dependências principais

```bash
npm install @reduxjs/toolkit react-redux react-router-dom axios
npm install @radix-ui/react-icons lucide-react
```

### Interceptor Axios (auth)

```typescript
// src/api/client.ts
apiClient.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor de response para refresh automático no 401
apiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401) {
      // tenta refresh, se falhar, desloga
    }
    return Promise.reject(error);
  }
);
```

### Rotas iniciais (placeholder)

```typescript
// src/App.tsx
<Routes>
  <Route path="/login" element={<div>Login (placeholder)</div>} />
  <Route path="/" element={<PrivateRoute><div>Dashboard (placeholder)</div></PrivateRoute>} />
  <Route path="*" element={<Navigate to="/" />} />
</Routes>
```

---

## Passos sugeridos

1. Criar o projeto com Vite + react-ts
2. Configurar Tailwind (tailwind.config.js com content paths corretos)
3. Inicializar shadcn/ui
4. Instalar todas as dependências listadas acima
5. Configurar Redux store + 3 slices (auth, creditos, ui)
6. Configurar Axios client com interceptors
7. Configurar React Router com rotas placeholder
8. Verificar: `npm run dev` abre no browser sem erro de console
9. Verificar: `npm run build` compila sem erro de TypeScript
10. Atualizar CI para incluir frontend
11. Walkthrough + kanban + PR

---

## Critérios de validação

- [ ] `npm run dev` (dentro de `app/frontend/`) abre em `localhost:5173` sem erro de console
- [ ] `npm run build` compila sem erros de TypeScript
- [ ] `npm run lint` passa sem erros
- [ ] Redux DevTools mostra a store com os 3 slices (auth, creditos, ui)
- [ ] shadcn/ui: `npx shadcn-ui@latest add button` adiciona componente sem conflito
- [ ] CI do GitHub Actions passa no job do frontend
- [ ] Walkthrough com screenshot da tela placeholder rodando + output do build
- [ ] Kanban atualizado, PR criado

---

## Referências

- [`docs/PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) — §2 (Stack Frontend)
- [`docs/00-project/docs/12_DESIGN_SYSTEM.md`](../00-project/docs/12_DESIGN_SYSTEM.md) — cores e tipografia (usar na task 005)
