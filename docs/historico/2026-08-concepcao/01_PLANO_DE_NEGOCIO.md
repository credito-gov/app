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

**Para o Contador/Escritório Contábil:**
- ✅ Ferramenta que agrega valor à carteira de clientes (diferencial na oferta do escritório)
- ✅ Reduz o trabalho manual de validação de crédito para o próprio contador
- ✅ Incentivo/comissão por indicação

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
- PMEs atendidas por escritórios de contabilidade na faixa-alvo: ~400k
- PMEs com crédito tributário relevante (>R$ 5k/mês): ~100k
- Potencial SAM: R$ 15-30M/ano em receita

**Mercado Atingível (SOM) - Ano 1**
- Target: 3-4k PMEs (via 10 parcerias contábeis no 1º semestre pós-lançamento, expandindo ao longo do ano)
- Receita Year 1: R$ 1.2-1.8M

### Segmentação de Clientes

**Prioridade 1: Comércio/Varejo** (60% do TAM)
- Alto volume de compras → mais crédito gerado
- Caixa apertado → precisa visibilidade
- Forte presença nas carteiras dos escritórios de contabilidade
- Ticket médio: R$ 1-5M/mês faturamento

**Prioridade 2: Indústria Pequena** (25% do TAM)
- Crédito mais complexo (IPI + CBS)
- Volume maior de crédito
- Melhor ticket médio: R$ 2-10M/mês

**Prioridade 3: Serviços** (15% do TAM)
- Crédito limitado (CBS só em consumo)
- Menor volume de operações
- Menos prioridade inicial

---

## 5. Modelo de Negócio

### Revenue Streams

**1. SaaS Subscription (Direto)**
- PME (ou o escritório contábil em nome dela) paga R$ 100/mês diretamente ao CreditoGov
- Sem repasse a terceiros — receita 100% capturada
- Assume 3.5k PMEs (fim Ano 1) = R$ 350k/mês de MRR

**2. Comissão Fintech/FIDC (a negociar pós-volume)**
- PME usa app pra adiantar crédito com fintech/FIDC/instituição financeira parceira
- Modelo de comissão a ser negociado quando houver massa crítica de PMEs ativas — o volume é o principal ativo de negociação
- Não contabilizada no cenário base (upside)

**3. APIs Adicionais (Futuro 2028+)**
- Integração com outros ERPs (Omie, Bluesoft, SAP, etc)
- Venda de dados agregados (anonimizados, com consentimento)

### Estrutura de Custos

**Custos Fixos (Mensais)**
- Infra (servidor, BD, CDN): R$ 5-10k
- Pessoas (2 devs, 1 tributarista PT): R$ 30-50k
- Outros (legal, contabilidade, marketing): R$ 5-10k
- **Total**: R$ 40-70k/mês

**Custo de Canal (Comissão ao Contador)**
- 15-20% da mensalidade por PME trazida via parceria contábil

**Custos Variáveis (Por transação)**
- API Receita Federal: R$ 0.01-0.05/consulta [TBD]
- Suporte: ~2% da receita

### Breakeven Analysis

```
Receita Monthly (fim Ano 1) = R$ 350k (3.5k PMEs × R$ 100)

Custos Fixed = R$ 40-50k
Comissão Canal (18%) = R$ 63k
Custos Variáveis = R$ 35k (10% receita)

Contribuição = R$ 350k - R$ 143k = R$ 207k

Status: LUCRATIVO ANTES DO FIM DO ANO 1 ✅ (breakeven em ~2.5k PMEs / 25 parcerias)
```

---

## 6. Go-to-Market Strategy

### Fase 1: Parcerias com Contadores/Escritórios Contábeis (primeiros 6 meses pós-lançamento)

**Estratégia**
1. MVP pronto em dez/2026
2. Fechar 10 parcerias com escritórios de contabilidade no 1º semestre pós Go-Live
3. Cada parceria ativa a carteira do escritório (média pessimista: 100 empresas/parceria) → meta de 1.000 PMEs no semestre
4. Onboarding assistido pelo próprio contador (que já tem a confiança do cliente)
5. Comissão/incentivo ao contador de 15-20% da mensalidade por PME ativa

**Vantagens**
- CAC próximo de zero: 1 parceria fechada ≈ 100 clientes, sem necessidade de vender empresa a empresa
- Contador já tem a confiança da PME — reduz fricção de adoção
- Distribuição em lote, não um a um

**Por que esse canal primeiro (vs. venda direta à PME)**
- Penetração direta em PME é lenta e cara (ciclo de vendas longo, baixa confiança em ferramenta nova)
- Contador já decide/influencia ferramentas usadas pela empresa
- Volume construído aqui é o que viabiliza a negociação com fintechs/FIDCs depois

### Fase 2: Escala do Canal Contábil + Monetização Fintech/FIDC (Ano 2+)

**Estratégia**
1. Expandir de 10 para 30-50+ parcerias contábeis ativas
2. Com massa crítica de PMEs na plataforma, iniciar negociação com fintechs/FIDCs (ou uma instituição financeira) para o produto de adiantamento de crédito
3. Complementar com direct to PME / freemium onde fizer sentido

**Vantagens**
- Volume de PMEs ativas = poder de negociação com parceiros financeiros
- Diversifica receita (SaaS + comissão fintech/FIDC)
- Escala sem depender de um único parceiro de distribuição

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
2. **Canal de distribuição em lote** (parcerias contábeis, não venda um a um)
3. **Validação automática** (API do governo)
4. **Contexto operacional** (conecta compra → crédito → ação)
5. **Partnership com governo** (dados estruturados)
6. **Timing perfeito** (reforma tributária jan/2027)

---

## 8. Projeção Financeira (3 Anos)

### Cenário Base (10 parcerias contábeis no H1, ~100 PMEs/parceria)

| Métrica | Ano 1 | Ano 2 | Ano 3 |
|---------|-------|-------|-------|
| **Clientes** | 3-4k | 12-20k | 35-55k |
| **SaaS MRR (fim período)** | R$ 300-400k | R$ 1.2-2M | R$ 3.5-5.5M |
| **Comissão Fintech/FIDC** | A negociar (não contabilizada) | A negociar | A negociar |
| **Receita Total** | R$ 1.2-1.8M | R$ 4.5-7M | R$ 10-15M |
| **Custos Variáveis** | R$ 120-180k | R$ 500k-1M | R$ 1-1.5M |
| **Comissão Canal (contadores)** | R$ 220-320k | R$ 700k-1.2M | R$ 1.5-2.5M |
| **Custos Fixos** | R$ 600k | R$ 1.2M | R$ 1.8M |
| **Total Custos** | R$ 940k-1.1M | R$ 2.4-3.2M | R$ 4.3-5.8M |
| **EBITDA** | R$ 100k-700k | R$ 1.5-3.5M | R$ 4-8M |
| **Margem EBITDA** | 8%-40% | 35%-50% | 45%-55% |

### Cenário Otimista (mais parcerias fechadas / carteiras acima da média)

| Métrica | Ano 1 | Ano 2 | Ano 3 |
|---------|-------|-------|-------|
| **Clientes** | 5-6k | 25-35k | 65-90k |
| **Receita Total** | R$ 1.8-2.7M | R$ 9-12M | R$ 18-25M |
| **EBITDA** | R$ 400k-1M | R$ 3.5-5.5M | R$ 8-13M |
| **Margem** | 22%-37% | 39%-46% | 44%-52% |

*Comissão fintech/FIDC não entra nas tabelas acima — é upside a negociar após a base de PMEs atingir massa crítica.*

---

## 9. Riscos e Mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|--------|-----------|
| API Receita atrasa | Média | Alto | Começar com validação manual; fallback pra tributarista |
| Contadores não aderem no ritmo esperado | Média | Alto | Ajustar comissão/incentivo; testar formatos de parceria alternativos; complementar com direct to PME |
| Split payment não funciona em jan/2027 | Média | Médio | Usar ECF do governo; validação com lag de 30 dias |
| PME não paga SaaS | Baixa | Médio | Ajustar preço/tiering; reforçar onboarding via contador |
| Regulação muda | Baixa | Alto | Time tributarista atualiza; documentação versionada |
| Fintech/FIDC não fecha condições favoráveis | Baixa | Médio | Negociar com múltiplos parceiros (fintech, FIDC, FI); só negociar após volume relevante |

---

## 10. Métricas de Sucesso (KPIs)

### Métricas de Negócio

- **CAC** (Customer Acquisition Cost): próximo de zero via canal contábil (custo = comissão recorrente, não aquisição pontual)
- **LTV** (Lifetime Value): >R$ 2.000
- **Churn**: <5% ao mês
- **NPS**: >50
- **Monthly Recurring Revenue**: R$ 300-400k (fim ano 1)
- **Parcerias contábeis ativas**: 10 (fim H1) → 30-50 (fim ano 1)

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
- Entrevistas com 10-15 PMEs e contadores
- Confirmação com Receita Federal (API)
- Primeiras conversas com escritórios de contabilidade (mapear formato de parceria)
- Decisão: Go/No-Go

**MVP (Out-Dez/2026)**: Backend + Frontend Básico
- Integração Omie API (sincronização de dados, técnica)
- Cron de sincronização
- Dashboard simples
- Testes

**Beta (Jan-Mar/2027)**: Validação com Clientes
- Integração API Receita (quando disponível)
- Split Payment (integração)
- Beta com as primeiras 2-3 parcerias contábeis fechadas
- Feedback e iteração

**Go-Live (Abr/2027+)**: Escalas Comerciais
- Fechar as 10 primeiras parcerias contábeis (meta: 1.000 PMEs em 6 meses)
- Iniciar conversas de negociação com fintechs/FIDCs (com base no volume construído)
- Suporte e onboarding assistido pelos contadores parceiros

---

## 12. Conclusão

CreditoGov resolve um problema real e urgente para PMEs na era pós-reforma tributária. Com timing perfeito (split payment começando abr/2027), canal de distribuição via parcerias contábeis, e diferencial tecnológico claro, o projeto tem:

✅ Mercado grande (1.5M PMEs)  
✅ Problema real (crédito invisível)  
✅ Solução clara (dashboard + API)  
✅ Go-to-market definido (parcerias contábeis, CAC próximo de zero)  
✅ Timeline apertada mas viável (6 meses MVP)  
✅ Modelo de negócio sustentável (lucro já no Ano 1)  

**Recomendação**: Proceed com Sprint 0 agora (agosto/2026).

---

**Última atualização**: Agosto 2026  
**Preparado por**: [Seu nome]  
**Status**: Pronto para apresentação
