# Kanban - CreditoGov (8 Sprints)

## Sprint 0: Validação de Mercado (Ago-Set/2026)

### ✅ Concluído
- [x] Conversa inicial com tributarista
- [x] Identificação do problema
- [x] Leitura documentação Split Payment

### 🔄 Em Progresso
- [ ] Entrevistas com 10 PMEs (target: 5 até 31/ago)
- [ ] Contato com Omie para partnership
- [ ] Confirmação com Receita Federal

### ⏳ Pendente
- [ ] Resposta Omie (SLA: até 15/set)
- [ ] API Receita confirmada (esperado jan/2027)
- [ ] Decisão Go/No-Go (até 20/set)

---

## Sprint 1: Setup Backend (Set-Out/2026)

### Backend Infrastructure
- [ ] Node.js + npm setup
- [ ] ESLint + Prettier
- [ ] TypeScript config
- [ ] PostgreSQL local (docker-compose)
- [ ] GitHub Actions setup

### Database
- [ ] TypeORM setup
- [ ] Migrations (pmes, creditos, acoes, sync_logs)
- [ ] Seeders com dados de teste
- [ ] Índices de performance

### Authentication
- [ ] JWT auth implementation
- [ ] OAuth2 (Omie)
- [ ] Refresh token logic
- [ ] Password hashing

### APIs Básicas
- [ ] POST /auth/login
- [ ] POST /auth/refresh
- [ ] POST /auth/logout
- [ ] GET /auth/me

---

## Sprint 2: Setup Frontend (Out-Nov/2026)

### Project Setup
- [ ] Create React + Vite app
- [ ] Tailwind CSS setup
- [ ] Shadcn/ui installation
- [ ] Redux Toolkit setup
- [ ] Axios + interceptors

### Folder Structure
- [ ] Components, pages, hooks
- [ ] React Router setup
- [ ] Theme setup (light/dark)

### Layout Base
- [ ] Header component
- [ ] Sidebar navigation
- [ ] Main layout wrapper

---

## Sprint 3: Integrações (Nov-Dez/2026)

### Omie Integration
- [ ] OAuth flow
- [ ] List customers
- [ ] List invoices
- [ ] Correlate with credits

### Receita Federal Integration
- [ ] OAuth2 setup
- [ ] /apuracao-creditos endpoint
- [ ] /apuracao-debitos endpoint
- [ ] Mock if API not available

### Cron Job
- [ ] node-cron setup
- [ ] syncCreditos job
- [ ] Error handling
- [ ] Logging

### Tests
- [ ] Integration tests (Omie)
- [ ] Integration tests (Receita)
- [ ] Cron job tests

---

## Sprint 4: Dashboard Frontend (Dez-Jan/2027)

### Dashboard Layout
- [ ] Responsive header
- [ ] Sidebar with menu
- [ ] Main content area

### Summary Cards
- [ ] Crédito Validado (hoje)
- [ ] Crédito Pendente
- [ ] Projeção 30/60/90 dias
- [ ] Oportunidades

### Tabela de Créditos
- [ ] Listar créditos
- [ ] Colunas: fornecedor, valor, data, status, ações
- [ ] Paginação
- [ ] Sorting

### Gráficos
- [ ] Projeção linha (próximos 90 dias)
- [ ] Distribuição pie (validado vs pendente)
- [ ] Histórico bar chart

---

## Sprint 5: Ações (Jan-Fev/2027)

### Compensação
- [ ] Modal "Compensar Crédito"
- [ ] POST /acoes/compensar endpoint
- [ ] Validações
- [ ] Notificações

### Adiantamento
- [ ] Modal "Adiantar Crédito"
- [ ] POST /acoes/adiantar endpoint
- [ ] Gerar token/link
- [ ] Webhook callback

### Fintechs
- [ ] Integração Facile
- [ ] Integração Liber
- [ ] Comissão tracking

---

## Sprint 6: Validação & Polish (Fev-Mar/2027)

### Testes
- [ ] Unit tests (80% coverage)
- [ ] Integration tests
- [ ] E2E tests

### Performance
- [ ] Frontend optimization
- [ ] Backend optimization
- [ ] Load testing

### Segurança
- [ ] Security audit
- [ ] Penetration testing

### UX Polish
- [ ] Design review
- [ ] Copy refinement
- [ ] Accessibility (WCAG 2.1)

### Documentação
- [ ] API docs (Swagger)
- [ ] User guide
- [ ] Developer guide

---

## Sprint 7: Beta (Mar-Abr/2027)

### Onboarding
- [ ] Setup guide
- [ ] Video tutorials
- [ ] Live demos

### Feedback
- [ ] User interviews
- [ ] NPS survey
- [ ] Feature requests

### Iterações
- [ ] Weekly hotfixes
- [ ] Bi-weekly features

---

## Sprint 8: Go-Live (Abr/2027+)

### Pre-Launch
- [ ] Load testing
- [ ] Disaster recovery
- [ ] Monitoring setup
- [ ] On-call rotation

### Launch
- [ ] Omie native integration
- [ ] Customer communications
- [ ] Marketing push

### Post-Launch
- [ ] Monitor health
- [ ] Support team live
- [ ] SLA enforcement

---

## Backlog - Features Futuras

- [ ] Integração outros ERPs
- [ ] API pública
- [ ] Mobile app
- [ ] Analytics avançado
- [ ] Consultoria IA
- [ ] Mais fintechs

---

**Status Geral**: 🔄 Sprint 0 - Validação de Mercado  
**Última atualização**: Agosto 2026
