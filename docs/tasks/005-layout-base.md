# Task 005 — Layout Base Frontend: Header + Sidebar + MainWrapper + tema

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** task 004 merged
> **Estimativa:** 4-6h
> **Branch:** `feat/005-layout-base`

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` e `docs/00-project/docs/12_DESIGN_SYSTEM.md`.
2. Confirme que a task 004 está **merged** em `main`.
3. ```bash
   git checkout main && git pull --ff-only origin main
   git checkout -b feat/005-layout-base
   ```

---

## Contexto

Com a infraestrutura React pronta, esta task implementa o shell visual da aplicação: o layout que envolve todas as telas. É aqui que o Design System é materializado (tokens de cor, tipografia, espaçamento) e onde o usuário vê a cara do CreditoGov pela primeira vez.

---

## Objetivo

Implementar o layout base completo: Header, Sidebar com navegação, MainWrapper, página de Login e tema claro baseado no Design System do projeto.

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/app/frontend/src/index.css` | CSS variables do Design System + reset + fonte Inter |
| `app/app/frontend/src/components/layout/AppLayout.tsx` | Wrapper: sidebar + main content area |
| `app/app/frontend/src/components/layout/Header.tsx` | Logo, nome da empresa, settings, logout |
| `app/app/frontend/src/components/layout/Sidebar.tsx` | Navegação: Dashboard, Créditos, Ações, Config |
| `app/app/frontend/src/pages/LoginPage.tsx` | Tela de login (campos: App Key + App Secret do Omie) |
| `app/app/frontend/src/pages/DashboardPage.tsx` | Placeholder da página principal |
| `app/app/frontend/src/hooks/useAuth.ts` | Hook de autenticação (login, logout, estado) |
| `docs/tasks/walkthrough/005-layout-base.md` | **Obrigatório.** Com screenshot das telas. |

---

## Fora de escopo (NÃO faça)

- ❌ Não implementar o dashboard real — apenas o shell/layout
- ❌ Não criar dark mode — apenas o tema claro por ora
- ❌ Não conectar login ao backend ainda — pode usar mock local (a task 003 já tem o endpoint pronto, mas a integração real é bonus se sobrar tempo)

---

## Detalhes técnicos

### CSS Variables (baseado no Design System)

```css
/* src/index.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  --color-primary: #10B981;
  --color-primary-hover: #059669;
  --color-secondary: #3B82F6;
  --color-secondary-hover: #2563EB;
  --color-error: #EF4444;
  --color-warning: #F59E0B;
  --color-bg: #F9FAFB;
  --color-surface: #FFFFFF;
  --color-border: #E5E7EB;
  --color-text: #111827;
  --color-text-muted: #6B7280;

  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;

  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
}

body {
  font-family: 'Inter', sans-serif;
  background-color: var(--color-bg);
  color: var(--color-text);
}
```

### Layout desktop (baseado no wireframe)

```
┌──────────────────────────────────────────────────────────┐
│ Header: logo | empresa | settings | logout               │
├────────────┬─────────────────────────────────────────────┤
│  Sidebar   │  MainWrapper (conteúdo das pages)           │
│  Dashboard │                                             │
│  Créditos  │                                             │
│  Ações     │                                             │
│  Config    │                                             │
└────────────┴─────────────────────────────────────────────┘
```

### Página de Login

Campos: `App Key` e `App Secret` do Omie (não é user/password tradicional). Botão "Entrar". Link "Como obter minhas credenciais Omie?".

---

## Passos sugeridos

1. Configurar CSS Variables em `index.css` e importar fonte Inter
2. Criar `AppLayout.tsx` com sidebar + main area (CSS Grid ou Flexbox)
3. Criar `Header.tsx` com logo CreditoGov e itens de navegação global
4. Criar `Sidebar.tsx` com os 4 itens de menu e indicador de rota ativa
5. Criar `LoginPage.tsx` com form (campos App Key + App Secret)
6. Criar `DashboardPage.tsx` como placeholder (só o título "Dashboard")
7. Conectar rotas no `App.tsx`: `/login` → LoginPage, `/` → AppLayout > DashboardPage
8. Verificar responsividade (sidebar colapsa em mobile)
9. Tirar screenshot da tela de login e do dashboard placeholder para o walkthrough
10. Walkthrough + kanban + PR

---

## Critérios de validação

- [ ] `npm run dev` e navegar para `/login` mostra a tela de login com os campos App Key e App Secret
- [ ] Sidebar exibe os 4 itens de menu; item ativo fica destacado
- [ ] Layout responsivo: em tela < 768px, sidebar se comporta adequadamente (colapsa ou hamburger)
- [ ] Fonte Inter está sendo carregada (verificar no DevTools > Network > Fonts)
- [ ] CSS Variables estão definidas e aplicadas (verificar no DevTools > Elements > :root)
- [ ] `npm run build` continua sem erro de TypeScript
- [ ] Walkthrough inclui screenshots (login + dashboard placeholder)
- [ ] Kanban atualizado, PR criado

---

## Referências

- [`docs/PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) — §2 (Stack)
- [`docs/00-project/docs/12_DESIGN_SYSTEM.md`](../00-project/docs/12_DESIGN_SYSTEM.md) — cores, tipografia, componentes
- [`docs/00-project/design/wireframes/01_DASHBOARD_PRINCIPAL.md`](../00-project/design/wireframes/01_DASHBOARD_PRINCIPAL.md) — layout de referência
