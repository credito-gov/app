# Plano de Negócio - CreditoGov

## 1. Resumo Executivo

**Empresa**: CreditoGov  
**Segmento**: SaaS B2B (Fintech/Govtech)  
**Produto**: Plataforma de Gestão e Validação de Créditos Tributários CBS/IBS  
**Mercado**: PMEs brasileiras (R$ 500k - R$ 5M faturamento/mês)  
**Timeline**: MVP Jan/2027, Go-Live Abr/2027  
**Investimento**: R$ 150k-250k (6 meses)  
**ROI**: Breakeven Ano 1, Lucratividade Ano 2+

---

## 2. O Problema

### Contexto da Reforma Tributária

A partir de janeiro/2027, entra em vigor o CBS (Contribuição sobre Bens e Serviços) e o IBS (Imposto sobre Bens e Serviços), substituindo PIS, Cofins, ICMS e IPI. É a maior reforma tributária em 30 anos.

### Pain Points das PMEs

**Problema 1: Invisibilidade de Crédito**
- PME compra de fornecedor (NF com CBS destacado)
- CBS vai para contabilidade como "crédito"
- PME nunca sabe quantos créditos acumulou (pode ser R$ 100k+)
- Deixa crédito "dormindo" indefinidamente
- Perde oportunidades de caixa

**Problema 2: Validação Manual e Incerta**
- Não sabe se crédito é real (imposto realmente pago) ou só destacado na nota
- Depende de contabilista para validar manualmente
- Sem segurança legal de que pode creditar
- Risco de usar crédito inválido (depois precisa devolver)

**Problema 3: Oportunidade Perdida de Caixa**
- Crédito "pendente" não vira dinheiro
- PME não consegue antecipar crédito com banco
- Toma crédito bancário caro (12% am) em vez de antecipar crédito a 1,8%
- Deixa R$ 50k-200k de oportunidade por ano

**Problema 4: Falta de Contexto Operacional**
- "Tenho R$ 150k de crédito" - ok, mas...
- Qual operação gerou? Quando vira dinheiro?
- Pode usar para compensar débito específico?
- Nenhuma ferramenta atual responde isso

---

## 3. A Solução

### Value Proposition

**Para PME:**
- ✅ Visibilidade completa de créditos em tempo real
- ✅ Validação automática (sem dependência de contabilista)
- ✅ Projeção de caixa (sabe quando vira dinheiro)
- ✅ Ações facilitadas (compensar/adiantar com 2 cliques)
- ✅ Contexto operacional (qual compra gerou qual crédito)

**Para Omie:**
- ✅ Diferencial competitivo (único que oferece)
- ✅ Integração nativa na plataforma
- ✅ Mais sticky (PME usa mais Omie por isso)
- ✅ Comissões adicionais (de adiantamentos)

**Para Governo:**
- ✅ Melhora arrecadação (split payment funciona melhor)
- ✅ Dados estruturados (sabe exatamente quem tem crédito)
- ✅ Menos fraude (crédito validado automaticamente)

### Diferencial vs. Concorrentes

| Aspecto | Omie | Painel Gov | CreditoGov |
|---------|------|-----------|-----------|
| Calcula imposto | ✅ | ❌ | ❌ |
| Gerencia crédito | ❌ | ❌ | ✅ |
| Integrado ao ERP | ✅ | ❌ | ✅ |
| Validação automática | ❌ | ❌ | ✅ |
| Projeção de caixa | ❌ | ❌ | ✅ |
| Ações (compensar/adiantar) | ❌ | ❌ | ✅ |
| Contexto operacional | ✅ | ❌ | ✅ |

---

## 4. Mercado

### Tamanho do Mercado

**Mercado Total Endereçável (TAM)**
- 16M de empresas registradas no Brasil
- ~1.5M na faixa R$ 500k - R$ 5M faturamento (nosso alvo)
- Potencial: 500k - 1M PMEs que geram crédito CBS/IBS relevante

**Mercado Abordável (SAM)**
- Clientes Omie: ~400k
- PMEs com crédito tributário relevante (>R$ 5k/mês): ~100k
- Potencial SAM: R$ 15-30M/ano em receita

**Mercado Atingível (SOM) - Ano 1**
- Target: 5-10k PMEs
- Receita Year 1: R$ 1-3M

### Segmentação de Clientes

**Prioridade 1: Comércio/Varejo** (60% do TAM)
- Alto volume de compras → mais crédito gerado
- Caixa apertado → precisa visibilidade
- Usa Omie massivamente
- Ticket médio: R$ 1-5M/mês faturamento

**Prioridade 2: Indústria Pequena** (25% do TAM)
- Crédito mais complexo (IPI + CBS)
- Volume maior de crédito
- Melhor ticket médio: R$ 2-10M/mês
- Menos clientes Omie (usa ERP maior)

**Prioridade 3: Serviços** (15% do TAM)
- Crédito limitado (CBS só em consumo)
- Menor volume de operações
- Menos prioridade inicial

---

## 5. Modelo de Negócio

### Revenue Streams

**1. SaaS Subscription (via Omie)**
- PME paga Omie R$ 100-150/mês
- Omie repassa 20-30% de comissão para CreditoGov
- Assume 7.5k PMEs = R$ 225k/mês = R$ 2.7M/ano

**2. Comissão de Adiantamento (Split Revenue)**
- PME usa app pra adiantar crédito com fintech
- Fintech paga 1-2% de comissão por originação
- CreditoGov fica com 50% dessa comissão
- Assume 20% das PMEs adiantam = R$ 45k/mês

**3. APIs Adicionais (Futuro 2028+)**
- Integração com outros ERPs (Bluesoft, SAP, etc)
- Venda de dados agregados (anonimizados, com consentimento)

### Estrutura de Custos

**Custos Fixos (Mensais)**
- Infra (servidor, BD, CDN): R$ 5-10k
- Pessoas (2 devs, 1 tributarista PT): R$ 30-50k
- Omie partnership: R$ 5k
- Outros (legal, contabilidade, marketing): R$ 5-10k
- **Total**: R$ 45-75k/mês

**Custos Variáveis (Por transação)**
- API Receita Federal: R$ 0.01-0.05/consulta [TBD]
- API Fintechs: Incluído na comissão
- Suporte: ~2% da receita

### Breakeven Analysis

```
Receita Monthly = R$ 225k (SaaS) + R$ 45k (comissão) = R$ 270k

Custos Fixed = R$ 40k
Custos Variáveis = R$ 27k (10% receita)

Contribuição = R$ 270k - R$ 67k = R$ 203k

Status: LUCRATIVO DESDE O INÍCIO ✅
```

---

## 6. Go-to-Market Strategy

### Fase 1: Partnership com Omie (Jan-Abr/2027)

**Estratégia**
1. MVP pronto em dez/2026
2. Pitch pra Omie em janeiro
3. Integração nativa na plataforma
4. Beta com 100-200 clientes Omie (fev-mar)
5. Go-live massivo (abr, com split payment)

**Vantagens**
- Zero customer acquisition cost
- Built-in trust (marca Omie)
- Distribuição imediata para 400k PMEs

### Fase 2: Direct to PME (Abr-Ago/2027)

**Estratégia**
1. Landing page (google ads, facebook)
2. Integração direta com Omie (sem necessidade de partnership)
3. Freemium (versão básica free)
4. Programas de referência

**Vantagens**
- Diversifica receita
- Não depende 100% de Omie
- Maior margem (sem split com Omie)

---

## 7. Competição

### Situação Atual (Ago/2026)

**Competidores Diretos**: Nenhum
- Omie calcula imposto (não gerencia crédito)
- Bluesoft calcula imposto (não gerencia crédito)
- Painel do governo existe (não integrado, sem recomendações)

**Competidores Indiretos**
- Banks tradicionais (oferecem adiantamento caro 12% am)
- Fintechs de adiantamento (Facile, Liber - sem contexto)
- Software de contabilidade genérico

### Vantagem Competitiva

1. **Primeiro mover** (primeira solução integrada)
2. **Integração nativa** (dentro de Omie, não ferramenta separada)
3. **Validação automática** (API do governo)
4. **Contexto operacional** (conecta compra → crédito → ação)
5. **Partnership com governo** (dados estruturados)
6. **Timing perfeito** (reforma tributária jan/2027)

---

## 8. Projeção Financeira (3 Anos)

### Cenário Base

| Métrica | Ano 1 | Ano 2 | Ano 3 |
|---------|-------|-------|-------|
| **Clientes** | 5-10k | 30-50k | 100-150k |
| **SaaS MRR** | R$ 250-500k | R$ 1.5-2.5M | R$ 4-6M |
| **Comissão Split** | R$ 200-400k | R$ 1-1.5M | R$ 2-3M |
| **Receita Total** | R$ 450-900k | R$ 2.5-4M | R$ 6-9M |
| **Custos Variáveis** | R$ 100k | R$ 500k | R$ 1.2M |
| **Custos Fixos** | R$ 600k | R$ 1.2M | R$ 1.8M |
| **Total Custos** | R$ 700k | R$ 1.7M | R$ 3M |
| **EBITDA** | -R$ 250k a R$ 200k | R$ 800k-2.3M | R$ 3-6M |
| **Margem EBITDA** | -28% a 22% | 32%-58% | 50%-67% |

### Cenário Otimista (20% mais clientes)

| Métrica | Ano 1 | Ano 2 | Ano 3 |
|---------|-------|-------|-------|
| **Clientes** | 12k | 60k | 180k |
| **Receita Total** | R$ 1.08M | R$ 5M | R$ 11M |
| **EBITDA** | R$ 300k | R$ 3M | R$ 7.5M |
| **Margem** | 28% | 60% | 68% |

---

## 9. Riscos e Mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|--------|-----------|
| API Receita atrasa | Média | Alto | Começar com validação manual; fallback pra tributarista |
| Omie rejeita partnership | Baixa | Alto | Direct to PME; integração via Omie API pública |
| Split payment não funciona em jan/2027 | Média | Médio | Usar ECF do governo; validação com lag de 30 dias |
| PME não paga SaaS | Baixa | Médio | Freemium; venda via comissão de adiantamento |
| Regulação muda | Baixa | Alto | Time tributarista atualiza; documentação versionada |
| Fintechs não querem parceria | Baixa | Médio | Integração com mais parceiros; ajustar modelo |

---

## 10. Métricas de Sucesso (KPIs)

### Métricas de Negócio

- **CAC** (Customer Acquisition Cost): <R$ 100
- **LTV** (Lifetime Value): >R$ 2.000
- **Churn**: <5% ao mês
- **NPS**: >50
- **Monthly Recurring Revenue**: R$ 250k+ (ano 1)

### Métricas de Produto

- **Daily Active Users**: >20% de clientes
- **Taxa de compensação/adiantamento**: >20%
- **Tempo médio de validação**: <2 dias
- **Uptime**: >99.5%

### Métricas de Crescimento

- **MoM Growth**: >10% (meses 1-6)
- **Virality**: >1.2x (referral rate)
- **Retenção**: >90% (mês 1), >85% (ano 1)

---

## 11. Roadmap Executivo

**Sprint 0 (Ago-Set/2026)**: Validação de Mercado
- Entrevistas com 10-15 PMEs
- Confirmação com Receita Federal (API)
- Confirmação com Omie (partnership)
- Decisão: Go/No-Go

**MVP (Out-Dez/2026)**: Backend + Frontend Básico
- Integração Omie API
- Cron de sincronização
- Dashboard simples
- Testes

**Beta (Jan-Mar/2027)**: Validação com Clientes
- Integração API Receita (quando disponível)
- Split Payment (integração)
- Beta com Omie (100-200 clientes)
- Feedback e iteração

**Go-Live (Abr/2027+)**: Escalas Comerciais
- Integração fintech (adiantamento)
- Omie inclui no produto (native)
- Marketing (direct to PME)
- Suporte e onboarding

---

## 12. Conclusão

CreditoGov resolve um problema real e urgente para PMEs na era pós-reforma tributária. Com timing perfeito (split payment começando abr/2027), partnership com Omie, e diferencial tecnológico claro, o projeto tem:

✅ Mercado grande (1.5M PMEs)  
✅ Problema real (crédito invisível)  
✅ Solução clara (dashboard + API)  
✅ Go-to-market definido (Omie)  
✅ Timeline apertada mas viável (6 meses MVP)  
✅ Modelo de negócio sustentável (lucro desde Y1)  

**Recomendação**: Proceed com Sprint 0 agora (agosto/2026).

---

**Última atualização**: Agosto 2026  
**Preparado por**: [Seu nome]  
**Status**: Pronto para apresentação
