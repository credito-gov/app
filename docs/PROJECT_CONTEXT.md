# PROJECT_CONTEXT — CreditoGov

> **Leia este arquivo integralmente antes de tocar em qualquer código.**
> Convenções, decisões de arquitetura, regras inegociáveis e o "não faça" estão aqui.
> Em caso de divergência entre este arquivo e qualquer task, **este arquivo é a fonte canônica** — pare e pergunte.

---

## 1. O que é o CreditoGov

**CreditoGov** é uma plataforma SaaS B2B que oferece visibilidade e gestão inteligente de créditos tributários CBS/IBS para PMEs brasileiras, integrada diretamente às APIs da **Receita Federal** (via Split Payment).

### Problema resolvido

Com a Reforma Tributária (vigência jan/2027), PMEs passam a acumular créditos de CBS/IBS nas compras. Esses créditos ficam invisíveis: a PME não sabe quanto tem, quando vira dinheiro, nem como usar. O CreditoGov resolve isso com um dashboard integrado que:

1. **Valida** créditos automaticamente via API da Receita Federal
2. **Contextualiza** cada crédito com a compra/NF-e que o gerou
3. **Facilita ações**: compensar débito fiscal ou adiantar crédito com fintech (2 cliques)

### Posicionamento

| Aspecto | Painel Gov | CreditoGov |
|---|---|---|
| Gerencia crédito | ❌ | ✅ |
| Validação automática | ❌ | ✅ |
| Projeção de caixa | ❌ | ✅ |
| Ações (compensar/adiantar) | ❌ | ✅ |
| Contexto operacional | ❌ | ✅ |

---

## 2. Stack tecnológico

### Backend

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js 4.x |
| Linguagem | TypeScript |
| ORM | TypeORM |
| Banco | PostgreSQL 13+ |
| Auth | JWT + OAuth2 |
| Validação | Zod |
| Logging | Winston |
| Scheduler | node-cron |
| Testes | Jest |

### Frontend

| Camada | Tecnologia |
|---|---|
| Framework | React 18+ |
| Linguagem | TypeScript |
| State | Redux Toolkit |
| HTTP | Axios |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Gráficos | Recharts |
| Forms | React Hook Form |
| Testes | Vitest + RTL |

### Infraestrutura

| Item | Tecnologia |
|---|---|
| Hosting | AWS EC2 + RDS |
| CDN | CloudFront |
| CI/CD | GitHub Actions |
| Monitoramento | Datadog / New Relic |

---

## 3. Estrutura de repositório

```
credito-gov/
├── app/backend/
│   └── src/
│       ├── api/            # routes, controllers, middleware
│       ├── cron/           # jobs de sincronização
│       ├── services/       # lógica de negócio
│       ├── models/         # entidades TypeORM
│       ├── db/             # migrations, connection
│       └── utils/
├── app/frontend/
│   └── src/
│       ├── pages/          # LoginPage, DashboardPage, etc.
│       ├── components/     # common, dashboard, creditos, acoes
│       ├── hooks/
│       ├── store/          # Redux slices
│       └── api/
├── docs/
│   ├── PROJECT_CONTEXT.md  # este arquivo
│   ├── tasks/              # tasks de desenvolvimento
│   │   ├── README.md       # Kanban das tasks
│   │   ├── _template.md    # template de task
│   │   └── walkthrough/    # walkthroughs por task
│   └── 00-project/         # documentação de negócio e design
│       ├── docs/
│       └── design/
├── .github/
│   └── pull_request_template.md
└── AGENTS.md
```

---

## 4. Convenções

### 4.1 Nomenclatura

- **Arquivos TypeScript**: `camelCase.ts` para utilitários/services, `PascalCase.tsx` para componentes React
- **Tabelas do banco**: `snake_case` no plural (`pmes`, `creditos`, `acoes`, `sync_logs`)
- **Colunas do banco**: `snake_case`
- **Variáveis de ambiente**: `UPPER_SNAKE_CASE` prefixadas por contexto (`RECEITA_`, `DB_`, `JWT_`, `FINTECH_`)
- **Branches**: `tipo/descricao-curta` (ex: `feat/dashboard-creditos`, `fix/cron-sync-error`)

### 4.2 Commits (Conventional Commits)

```
feat(creditos): add validation status to credito model
fix(cron): handle timeout on Receita Federal API call
docs(tasks): mark task 001 as developed
chore(deps): update axios to 1.7.0
test(services): add unit tests for creditoService
refactor(auth): extract token refresh logic
```

### 4.3 Git — Sequência obrigatória por task

Para toda task de desenvolvimento, nesta ordem, sem atalhos:

1. Criar branch a partir de `main` atualizado
2. Executar o desenvolvimento da task
3. Abrir PR da branch para `main`
4. Criar walkthrough em `docs/tasks/walkthrough/NNN-slug.md`
5. Atualizar kanban em `docs/tasks/README.md` (coluna **3.Desenv ✅**)

```bash
# Antes de começar qualquer task:
git checkout main
git pull --ff-only origin main
git checkout -b tipo/descricao-curta
```

Nunca trabalhe direto em `main`. Nunca "empilhe" branches.

### 4.4 Pull Requests

- PR sempre para `main`
- Descrição responde: **o quê**, **por quê**, **como testar**, **riscos**
- Link para o walkthrough no corpo do PR
- Branch sincronizada com `origin/main` antes do merge

---

## 5. Glossário de domínio

| Termo | Significado |
|---|---|
| **CBS** | Contribuição sobre Bens e Serviços — substitui PIS e Cofins a partir de jan/2027 |
| **IBS** | Imposto sobre Bens e Serviços — substitui ICMS e ISS a partir de jan/2027 |
| **Split Payment** | Mecanismo onde o imposto é recolhido automaticamente no momento do pagamento, sem passar pelo caixa do vendedor |
| **Crédito tributário** | Crédito de CBS/IBS gerado quando a PME compra de um fornecedor. Pode ser usado para compensar débitos ou ser antecipado |
| **Validado** | Status de crédito confirmado pela Receita Federal (imposto efetivamente recolhido via Split Payment) |
| **Pendente** | Status de crédito ainda aguardando confirmação da Receita Federal |
| **Compensar** | Usar crédito disponível para abater um débito fiscal (sem movimentação financeira) |
| **Adiantar** | Antecipar o recebimento do crédito via fintech (recebe dinheiro agora, com desconto da taxa) |
| **PME** | Pequena e Média Empresa — cliente final do CreditoGov |
| **NF-e** | Nota Fiscal Eletrônica — documento que origina o crédito tributário |
| **Cron** | Job agendado (00:05 diariamente) que sincroniza créditos da Receita Federal para cada PME ativa |
| **Fintech/FIDC** | Parceiros de adiantamento de crédito. Monetização a negociar após massa crítica de PMEs ativas — não é o foco comercial dos 6 primeiros meses |
| **Contador/Escritório Contábil** | Canal comercial primário do CreditoGov. Cada parceria fechada ativa, em lote, a carteira de PMEs do escritório (média pessimista: ~100 empresas/parceria). Recebe comissão de 15-20% da mensalidade por PME ativa |

---

## 6. Regras de negócio inegociáveis

### 6.1 Status de crédito

| Status | Regra |
|---|---|
| `pendente` | Crédito registrado mas sem confirmação da Receita Federal |
| `validado` | Receita Federal confirmou que o imposto foi recolhido via Split Payment |
| `compensado` | Crédito foi usado para abater um débito fiscal |
| `adiantado` | Crédito foi antecipado via fintech |

### 6.2 Tipos de crédito

```
CBS — Contribuição sobre Bens e Serviços
IBS — Imposto sobre Bens e Serviços
OUTRO — demais casos (retrocompatibilidade futura)
```

### 6.3 Cron de sincronização

- Executa às **00:05** diariamente
- Processa cada PME com `ativo = true`
- Credenciais da Receita Federal ficam **encriptadas** no banco (AES-256-CBC)
- Erro em uma PME não interrompe o processamento das demais
- Todo ciclo gera registro em `sync_logs`

### 6.4 Segurança

- `receita_client_id` e `receita_client_secret` são **sempre** armazenados encriptados (AES-256-CBC)
- Nunca logar credenciais, tokens ou dados sensíveis de PME
- Rate limiting: 100 requisições por 15 minutos por IP/usuário

### 6.5 Integridade financeira

- Valores monetários sempre em `DECIMAL(18, 2)` — nunca `FLOAT`
- Nunca assumir que um crédito "pendente" pode ser usado — apenas `validado` é acionável
- Compensação e adiantamento são registros em `acoes` — nunca atualizar `creditos.status` sem uma `acao` correspondente

---

## 7. APIs externas

### 7.1 Receita Federal (Split Payment)

- Autenticação: OAuth2 Client Credentials
- Endpoints: `/apuracao-creditos/{cnpj}`, `/apuracao-debitos/{cnpj}`, `/consulta-retorno`
- **Status**: API em desenvolvimento pela Receita — disponibilidade confirmada para jan/2027. Usar mock nos ambientes de dev/staging
- Documentação: `docs/split-payment/`

### 7.2 Fintechs (Facile, Liber)

- Modelo: redirect + webhook callback
- Callback endpoint: `POST /webhooks/fintech-callback`
- Status possíveis no callback: `aprovado`, `rejeitado`, `pendente`

---

## 8. Banco de dados — tabelas principais

```sql
pmes            -- empresas cadastradas (1 por CNPJ)
creditos        -- créditos tributários CBS/IBS por PME
acoes           -- compensações e adiantamentos solicitados
sync_logs       -- histórico de execuções do cron
```

Migrations sempre via TypeORM CLI. Nunca DDL manual no banco.

---

## 9. "NÃO faça" — armadilhas conhecidas

- ❌ **NUNCA** executar DDL direto no banco. Sempre via migration TypeORM em `app/app/backend/src/db/migrations/`
- ❌ **NUNCA** commitar `.env`, credenciais, tokens ou certificados digitais
- ❌ **NUNCA** usar `FLOAT` para valores monetários — sempre `DECIMAL(18, 2)`
- ❌ **NUNCA** assumir que a API da Receita Federal está disponível em dev — usar mock
- ❌ **NUNCA** atualizar `creditos.status` sem criar um registro correspondente em `acoes`
- ❌ **NUNCA** logar `receita_client_id`, `receita_client_secret` ou qualquer credencial
- ❌ **NUNCA** commitar `node_modules/`, `dist/`, arquivos gerados pelo build
- ❌ **NUNCA** abrir PR com lint/teste falhando
- ❌ **NÃO** criar feature que não foi pedida — se em dúvida, perguntar
- ❌ **NÃO** tomar decisões técnicas silenciosas — documentar no walkthrough e sinalizar antes de executar

---

## 10. Como pedir ajuda quando algo não estiver claro

Antes de codificar baseado em suposição:

1. **Releia este `PROJECT_CONTEXT.md`** procurando o termo ou regra
2. **Confira o documento de arquitetura** em `docs/00-project/docs/05_ARQUITETURA_TECNICA.md`
3. **Confira o doc da feature** em `docs/tasks/NNN-*.md`
4. **Se ainda ambíguo, PARE e pergunte.** Suposição vira retrabalho.

Boas perguntas começam com o que você já checou e qual ambiguidade ficou.

---

## 11. Referências

| Tema | Arquivo |
|---|---|
| Plano de negócio | `docs/00-project/docs/01_PLANO_DE_NEGOCIO.md` |
| Modelo de negócio | `docs/00-project/docs/02_MODELO_NEGOCIO.md` |
| Arquitetura técnica | `docs/00-project/docs/05_ARQUITETURA_TECNICA.md` |
| Design System | `docs/00-project/docs/12_DESIGN_SYSTEM.md` |
| Wireframe Dashboard | `docs/00-project/design/wireframes/01_DASHBOARD_PRINCIPAL.md` |
| Documentação Split Payment | `docs/split-payment/` |
| **Kanban / status das tasks** | `docs/tasks/README.md` — **manter atualizado a cada mudança de estado** |
| Template para novas tasks | `docs/tasks/_template.md` |

---

## 12. Decisões em aberto

Não codifique baseado em "achismo" sobre estes pontos:

- [ ] **API Receita Federal** — endpoint exato e schema de resposta confirmados. Enquanto não disponível, usar mock baseado na documentação `docs/split-payment/`
- [ ] **Fintech/FIDC parceiro(a)** — quem? Comissão a negociar somente após massa crítica de PMEs ativas; contrato e webhooks a definir
- [ ] **Formato exato da parceria contábil** — % de comissão final (faixa 15-20%), contrato, onboarding assistido — a validar no Sprint 0
- [ ] **Multi-CNPJ** — uma PME pode ter múltiplos CNPJs? Tratar como cadastros separados ou agrupados?
- [ ] **Retenção de dados de sync_logs** — quanto tempo manter histórico?

---

## 13. Changelog deste documento

| Data | Mudança |
|---|---|
| 2026-08-25 | Versão inicial — adaptada do modelo Liane/data-intelligence para o CreditoGov |
| 2026-08-25 | Removida proposta de parceria Omie como canal de distribuição — go-to-market a redefinir |
| 2026-08-26 | Go-to-market definido: SaaS direto (sem repasse a terceiros), com parcerias contábeis (contadores/escritórios de contabilidade) como canal comercial primário nos primeiros 6 meses pós-lançamento — meta de 10 parcerias / 1.000 PMEs (média de 100 empresas por parceria). Omie segue como fonte de dados técnica (sincronização de NF-e), não como canal de distribuição ou monetização. Comissão fintech/FIDC/instituição financeira passa a ser negociada apenas após a plataforma reunir massa crítica de PMEs ativas |
