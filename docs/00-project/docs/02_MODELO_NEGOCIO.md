# Modelo de Negócio - CreditoGov

## Business Model Canvas Completo

### 1. SEGMENTOS DE CLIENTES (Customer Segments)

#### Primário: PMEs via Omie (Partnership)
- **Tipo**: B2B SaaS
- **Perfil**: PMEs comércio/varejo/indústria pequena
- **Tamanho**: 5-10k clientes (ano 1)
- **Faturamento**: R$ 500k - R$ 5M/mês
- **Comprador**: Proprietário ou CFO
- **Ticket**: Incluído em Omie (fee split)
- **Volume**: Massa (integração nativa)

#### Secundário: PMEs Diretas (Direct)
- **Tipo**: B2B SaaS independente
- **Perfil**: Mesma segmentação, mas acesso direto
- **Tamanho**: 1-5k clientes (ano 1+)
- **Ticket**: R$ 50-150/mês
- **Modelo**: Freemium + premium

#### Terciário: Fintechs (B2B Revenue Share)
- **Tipo**: B2B2C
- **Parceiros**: Facile, Liber, etc
- **Modelo**: Comissão por origination
- **Volume**: 2-5 parceiros

---

### 2. PROPOSTA DE VALOR (Value Proposition)

#### Para PME (Problema → Solução)

| Antes | Depois |
|-------|--------|
| ❌ "Tenho crédito mas não sei quanto" | ✅ "Tenho R$ 150k de crédito validado" |
| ❌ "Não sei se posso creditar" | ✅ "Governo confirmou, posso usar" |
| ❌ "Tomo crédito caro com banco (12%)" | ✅ "Antecipo crédito a 1,8% com fintech" |
| ❌ "Preciso de contabilista pra validar" | ✅ "Sistema valida automaticamente" |
| ❌ "Qual compra gerou qual crédito?" | ✅ "Vejo crédito por operação" |

#### Diferencial Chave
- **Única solução integrada** (Omie + governo + ação)
- **Validação automática** (via Split Payment)
- **Contexto operacional** (compra → crédito → ação)
- **Sem fricção** (2 cliques, não consultoria manual)
- **Timing perfeito** (Reforma tributária jan/2027)

---

### 3. CANAIS DE DISTRIBUIÇÃO (Channels)

| Canal | Estratégia | Timeline | CAC |
|-------|-----------|----------|-----|
| **Omie Nativo** | Integração direta na plataforma | Jan-Abr/2027 | R$ 0 |
| **Direct SaaS** | Landing page + google ads | Abr-Ago/2027 | R$ 50-150 |
| **Freemium** | Versão básica grátis → upsell | Ago/2027+ | R$ 20-50 |
| **Parceiros Contábeis** | Revenda via contadores | Jan/2028+ | R$ 100-200 |
| **Fintechs** | Embedded no fluxo de adiantamento | Jan/2027+ | R$ 0 (comissão) |

### Customer Journey

```
PME usa Omie
    ↓
"Vejo opção de CreditoGov"
    ↓
Conecta com certificado digital (1 clique)
    ↓
Dashboard mostra créditos
    ↓
Clica "Adiantar" → vai pra Fintech
    ↓
Fintech aprova e repassa R$
```

---

### 4. RELACIONAMENTO COM CLIENTES (Customer Relationships)

#### Para PME
- **Onboarding**: Automatizado (1-2 minutos)
- **Dashboard**: Self-service (nenhum suporte necessário)
- **Alertas**: Automáticos (novo crédito, vencimento)
- **Suporte**: Email/chat (tier free)
- **Modelo**: Low-touch SaaS

#### Para Omie
- **Contato**: Account manager dedicado
- **Relatórios**: Mensais (clientes, uso, receita)
- **Roadmap**: Compartilhado (feedback loop)
- **SLA**: 99.5% uptime

#### Para Fintechs
- **API**: Integration support
- **Relatórios**: Revenue share mensal
- **Performance**: Feedback loop
- **Co-marketing**: Quando relevante

---

### 5. REVENUE STREAMS (Fontes de Receita)

#### 5A. SaaS Subscription (Via Omie)

**Modelo**
```
PME paga Omie R$ 100-150/mês
  ├── Omie retém R$ 70-100
  └── CreditoGov recebe R$ 30-50

Ou: Omie cobra Omie + CreditoGov R$ 150/mês
  ├── CreditoGov recebe R$ 30-50
  └── Omie retém R$ 100
```

**Volume**
- 5-10k PMEs em ano 1
- R$ 30-50/mês × 7.5k = R$ 225-375k/mês
- ARR: R$ 2.7-4.5M (conservador)

**Modelo de Precificação**
- Tier 1 (Básico): R$ 50/mês - Dashboard + sincronização
- Tier 2 (Pro): R$ 100/mês - Tudo + projeções avançadas
- Tier 3 (Enterprise): R$ 200/mês + custom - Integração direta

#### 5B. Comissão de Adiantamento de Crédito

**Modelo**
```
PME tem R$ 100k de crédito
PME clica "Adiantar R$ 80k" no CreditoGov
  ↓
Redireciona para Fintech (Facile, Liber, etc)
  ↓
Fintech aprova e retém comissão de 1.8% am
  ├── Fintech retém R$ 1.440 (1,8% × 80k)
  ├── CreditoGov recebe 20-30% = R$ 288-432
  └── PME recebe R$ 78.560 (80k - 1.44k)
```

**Volume**
- 20% de PMEs adiantam crédito = 2k PMEs
- Ticket médio R$ 50k
- Frequência: 1-2x/ano por PME
- Comissão: 1-2% da taxa

**Matemática**
```
2.000 PMEs × R$ 50k × 1.5x/ano × 1.8% × 25% = R$ 540k/ano
Ou: R$ 45k/mês (conservador)
```

#### 5C. APIs Adicionais (Futuro 2028+)

**Possíveis Revenue Streams**
- Integração com outros ERPs (B2B): R$ 500-2k/mês
- API pública pra developers: R$ 50-200/mês
- Consultoria tributária: R$ 1k-5k por projeto
- Dados agregados (anonimizados): R$ 10-50k/mês

---

### 6. KEY RESOURCES (Recursos-Chave)

#### Intelectual
- Expertise tributária (CBS/IBS)
- Arquitetura de API
- Integração Split Payment
- Relacionamento com Omie e Receita Federal

#### Tecnologia
- Plataforma SaaS (backend Node, frontend React/Vue)
- Infraestrutura cloud (AWS)
- Banco de dados (PostgreSQL)
- Integrações (Omie, Receita Federal, Fintechs)

#### Pessoas
- Desenvolvedor(es) fullstack (2x)
- Tributarista part-time
- Product manager
- Sales/business development

#### Parceria
- Omie (distribuição)
- Receita Federal (dados)
- Fintechs (monetização)

---

### 7. KEY ACTIVITIES (Atividades-Chave)

#### Produto
- Desenvolvimento e manutenção da plataforma
- Integração com APIs (Omie, Receita, Fintechs)
- Suporte técnico e operacional
- Roadmap e releases

#### Operação
- Sincronização de dados (cron jobs)
- Validação de créditos (algoritmo)
- Monitoramento de uptime
- Segurança e compliance

#### Parceria
- Manutenção de integração com Omie
- Comunicação com Receita Federal
- Partnership com Fintechs
- Co-marketing

---

### 8. KEY PARTNERSHIPS (Parcerias-Chave)

| Parceiro | Tipo | Benefício | Timeline | Crítico |
|----------|------|-----------|----------|---------|
| **Omie** | Distribuidor | Acesso a 400k PMEs | Jan/2027 | 🔴 SIM |
| **Receita Federal** | Data provider | API de Créditos | Jan/2027+ | 🔴 SIM |
| **Facile/Liber** | Revenue share | Adiantamento de crédito | Jan/2027 | 🟡 NÃO |
| **Tributarista** | Consultor | Validação de regras | Ago/2026+ | 🟡 NÃO |
| **AWS/Google Cloud** | Infraestrutura | Hosting | Sempre | 🟢 SUPORTE |

---

### 9. COST STRUCTURE (Estrutura de Custos)

#### Custos Variáveis

| Item | Custo | Base |
|------|-------|------|
| **API Receita Federal** | R$ 0.01-0.05 | Por consulta [TBD] |
| **Cloud Infrastructure** | ~5% receita | Escalável |
| **Payment Processing** | ~1% receita | Transações |
| **Suporte (2nd line)** | ~2% receita | Volume |

#### Custos Fixos (Mensais)

| Item | Custo | Frequência |
|------|-------|-----------|
| **Salário Dev Backend** | R$ 8-15k | Mensal |
| **Salário Dev Frontend** | R$ 8-15k | Mensal |
| **Tributarista PT** | R$ 5-8k | Mensal |
| **Omie Infrastructure** | R$ 2-5k | Mensal |
| **Outros (legal, contabilidade, etc)** | R$ 5-10k | Mensal |

**Total Fixed**: R$ 30-50k/mês

#### Breakeven Analysis

```
Receita Monthly = R$ 225k (SaaS) + R$ 45k (comissão) = R$ 270k

Custos Fixed = R$ 40k
Custos Variáveis = R$ 27k (10% receita)

Contribuição = R$ 270k - R$ 67k = R$ 203k

Breakeven = Nunca! Operação é lucrativa desde início ✅
```

---

## Business Model Summary

### Proposta de Valor Única
CreditoGov é a **única plataforma integrada** que conecta:
1. **Operação** (qual compra)
2. **Crédito** (quanto de crédito gerou)
3. **Validação** (governo confirmou)
4. **Ação** (compensar ou adiantar)

### Vantagem Competitiva Sustentável
- Timing (reforma tributária)
- Partnership (Omie = zero CAC)
- Dados (integração com governo)
- Contexto (integração com operação)

### Modelo de Receita Diversificado
- 75% SaaS (previsível, recurring)
- 25% Comissão (escalável, high-margin)

### Escalabilidade
- Zero marginal cost (software)
- Integração nativa (não precisa sales)
- Plataforma (2-3 devs escalam para 1M+ PMEs)

---

**Conclusão**: CreditoGov é um modelo de negócio **viável, escalável e sustentável**.

---

**Última atualização**: Agosto 2026
