# Arquitetura Técnica - CreditoGov

## 1. Stack Tecnológico

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Banco de Dados**: PostgreSQL 13+
- **ORM**: TypeORM
- **Auth**: JWT + OAuth2
- **Validação**: Zod
- **Logging**: Winston
- **Testing**: Jest

### Frontend
- **Framework**: React 18+
- **State**: Redux Toolkit
- **HTTP**: Axios
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Gráficos**: Recharts
- **Forms**: React Hook Form
- **Testing**: Vitest + RTL

### Infraestrutura
- **Hosting**: AWS EC2 + RDS
- **CDN**: CloudFront
- **CI/CD**: GitHub Actions
- **Monitoramento**: Datadog/New Relic
- **Segurança**: SSL/TLS

---

## 2. Arquitetura de Componentes

### Backend - Estrutura

```
backend/
├── src/
│   ├── cron/
│   │   ├── syncCreditosJob.ts
│   │   ├── scheduler.ts
│   │   └── handlers/
│   │       ├── fetchCreditos.ts
│   │       ├── validateCreditos.ts
│   │       └── storeCreditos.ts
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── creditos.routes.ts
│   │   │   ├── acoes.routes.ts
│   │   │   └── dashboard.routes.ts
│   │   ├── controllers/
│   │   └── middleware/
│   ├── services/
│   │   ├── creditoService.ts
│   │   ├── receitaFederalService.ts
│   │   ├── omieService.ts
│   │   ├── finetechService.ts
│   │   └── validationService.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Credito.ts
│   │   ├── Operacao.ts
│   │   ├── Acao.ts
│   │   └── SyncLog.ts
│   ├── db/
│   │   ├── migrations/
│   │   └── connection.ts
│   ├── utils/
│   └── app.ts
├── tests/
└── package.json
```

### Frontend - Estrutura

```
frontend/
├── src/
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── CreditsDetailPage.tsx
│   │   ├── AcoesPage.tsx
│   │   └── SettingsPage.tsx
│   ├── components/
│   │   ├── common/
│   │   ├── dashboard/
│   │   ├── creditos/
│   │   └── acoes/
│   ├── hooks/
│   │   ├── useCreditos.ts
│   │   ├── useAuth.ts
│   │   ├── useDashboard.ts
│   │   └── useApi.ts
│   ├── store/
│   │   ├── authSlice.ts
│   │   ├── creditosSlice.ts
│   │   ├── uiSlice.ts
│   │   └── store.ts
│   ├── api/
│   │   ├── client.ts
│   │   ├── endpoints.ts
│   │   └── hooks.ts
│   └── utils/
├── public/
├── .env.example
└── package.json
```

---

## 3. Fluxos de Dados Principal

### 3.1 Cron Diário - Sincronização de Créditos

```
1. Cron Job Dispara (00:05 AM)
2. Para cada PME ativa:
   a. Recupera clientID + clientSecret (encrypted)
   b. Chama POST /token na Receita Federal
   c. Chama GET /apuracao-creditos/{cnpj}
   d. Processa resposta (créditos do período)
3. Para cada crédito:
   a. Extrai: CNPJ fornecedor, valor, status
   b. Valida: foi recolhido? (Split Payment?)
   c. Correlaciona: busca NF-e no Omie
   d. Armazena/Atualiza no BD
4. Gera alertas se novo crédito
5. Log de sincronização
```

### 3.2 Dashboard - Visualização

```
1. PME abre CreditoGov
2. Frontend: GET /api/dashboard
3. Backend:
   a. SELECT SUM(valor) FROM creditos WHERE status='validado'
   b. SELECT * FROM creditos ORDER BY data DESC
   c. Calcula projeção (30/60/90 dias)
   d. Busca débitos pendentes
4. Frontend renderiza:
   - Summary cards
   - Tabela de créditos
   - Gráfico de projeção
   - Oportunidades
```

### 3.3 Ação: Compensar Débito

```
1. PME clica "Compensar"
2. Modal mostra:
   - Crédito disponível
   - Débitos pendentes
3. PME confirma
4. Frontend: POST /api/acoes/compensar
5. Backend valida e cria registro
6. Marca como "em processamento"
7. PME vê: "Compensação em processamento"
```

### 3.4 Ação: Adiantar Crédito

```
1. PME clica "Adiantar R$ 80k"
2. Modal mostra: taxa, você recebe
3. PME clica "Proceder"
4. Backend cria acao + gera token
5. Redireciona para Fintech
6. Fintech processa (aprova/rejeita)
7. Callback retorna com status
8. Backend marca como "concluida"
9. PME vê saldo atualizado
```

---

## 4. Integração com APIs Externas

### 4.1 Omie API

```typescript
const omieClient = axios.create({
  baseURL: 'https://app.omie.com.br/api/v1',
  headers: {
    'App-Key': process.env.OMIE_APP_KEY,
    'App-Secret': process.env.OMIE_APP_SECRET,
  }
});

// Endpoints usados
GET /clientes/listar
POST /produtos/listar
POST /nfes/listar
GET /info/status
```

### 4.2 Receita Federal API

```typescript
// OAuth2 - Client Credentials
POST /token
  --user "clientID:clientSecret"
  -d 'grant_type=client_credentials'

// Endpoints
GET /apuracao-creditos/{cnpj}
GET /apuracao-debitos/{cnpj}
POST /consulta-retorno
```

### 4.3 Fintechs (Facile, Liber)

```typescript
// Criar adiantamento
POST /api/adiantar
{
  tipo_documento: 'credito_tributario',
  valor_credito: 50000,
  cnpj_fornecedor: '...',
  taxa_juros_am: 1.8,
  prazos: 30
}

// Callback de fintech
POST /webhooks/fintech-callback
{
  acao_id: '...',
  status: 'aprovado',
  valor_transferido: 49100,
  taxa_cobrada: 900
}
```

---

## 5. Banco de Dados

### Tabelas Principais

```sql
CREATE TABLE pmes (
  id UUID PRIMARY KEY,
  cnpj VARCHAR(14) UNIQUE,
  razao_social VARCHAR(255),
  email VARCHAR(255),
  omie_access_token TEXT (encrypted),
  receita_client_id VARCHAR(255) (encrypted),
  receita_client_secret VARCHAR(255) (encrypted),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE creditos (
  id UUID PRIMARY KEY,
  pme_id UUID REFERENCES pmes(id),
  valor DECIMAL(18, 2) NOT NULL,
  tipo_credito ENUM('CBS', 'IBS', 'OUTRO'),
  status ENUM('pendente', 'validado', 'compensado', 'adiantado'),
  fornecedor_cnpj VARCHAR(14),
  fornecedor_nome VARCHAR(255),
  documento_fiscal_chave VARCHAR(255),
  data_nfe DATE,
  data_validacao DATE,
  data_disponibilidade DATE,
  split_payment BOOLEAN DEFAULT false,
  split_payment_data TIMESTAMP,
  categoria ENUM('compensavel', 'refund', 'inapropriavel'),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX (pme_id, status),
  INDEX (data_validacao)
);

CREATE TABLE acoes (
  id UUID PRIMARY KEY,
  pme_id UUID REFERENCES pmes(id),
  credito_id UUID REFERENCES creditos(id),
  tipo_acao ENUM('compensar', 'adiantar'),
  status ENUM('solicitada', 'processando', 'concluida', 'erro'),
  valor DECIMAL(18, 2),
  fintech VARCHAR(50),
  taxa_cobrada DECIMAL(18, 2),
  valor_liquido DECIMAL(18, 2),
  comissao_creditogov DECIMAL(18, 2),
  data_conclusao TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX (pme_id, status)
);

CREATE TABLE sync_logs (
  id UUID PRIMARY KEY,
  pme_id UUID REFERENCES pmes(id),
  status ENUM('sucesso', 'erro', 'parcial'),
  creditos_novos INT DEFAULT 0,
  creditos_atualizados INT DEFAULT 0,
  erro_mensagem TEXT,
  duracao_ms INT,
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 6. Segurança

### Autenticação
- JWT tokens (iat, exp, sub)
- OAuth2 para Omie e Receita Federal
- Refresh token strategy

### Encriptação
- AES-256-CBC para dados sensíveis
- Certificado digital encriptado
- ClientID/ClientSecret encriptado

### Rate Limiting
- 100 requisições por 15 minutos
- Por IP/user_id

### Validações
- Input validation (Zod)
- CORS policy
- HTTPS/TLS obrigatório

---

## 7. Monitoramento

### Health Checks
```typescript
GET /health
{
  status: 'ok',
  database: 'ok',
  lastCronRun: '2026-08-25T00:05:00Z',
  creditsInQueue: 150
}
```

### Logging
- Structured logging (JSON)
- Log levels: debug, info, warn, error
- Rotating file logs

### Alertas
- API timeout/failure
- Cron job failure
- Database connection issues
- Sync failures

---

## 8. Deployment

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
EXPOSE 3000
CMD ["node", "dist/app.js"]
```

### CI/CD
- GitHub Actions
- Lint → Test → Build → Deploy
- Auto-deploy to staging on PR
- Manual deploy to production

---

## 9. Roadmap Técnico

| Sprint | Deliverable | Status |
|--------|------------|--------|
| 0 | Setup inicial | ⏳ Planejamento |
| 1 | Models + DB | ⏳ Aguardando |
| 2 | Auth + Omie integration | ⏳ Aguardando |
| 3 | Cron + Receita API | ⏳ Aguardando API |
| 4 | Dashboard frontend | ⏳ Aguardando |
| 5 | Ações (compensar/adiantar) | ⏳ Aguardando |
| 6 | Testes + QA | ⏳ Aguardando |
| 7 | Beta | ⏳ Aguardando |
| 8 | Go-Live | ⏳ Aguardando |

---

**Última atualização**: Agosto 2026
