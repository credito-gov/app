# CreditoGov - Relatório Executivo Completo

**Data**: Agosto 2026  
**Status**: Sprint 0 - Validação de Mercado  
**Versão**: 1.0

---

## 📋 Índice

1. [Executive Summary](#executive-summary)
2. [Executive Report](#executive-report)
3. [Investment Pitch](#investment-pitch)
4. [Business Case](#business-case)

---

# EXECUTIVE SUMMARY

## A Oportunidade

PMEs brasileiras **deixam R$ 100k+ de crédito tributário "dormindo"** na contabilidade porque:
- Não sabem quanto crédito têm
- Não conseguem validar se podem creditar
- Não veem quando vira dinheiro
- Pagam crédito bancário caro (12% a.m.) em vez de usar crédito a 1,8%

**Resultado**: Perdem R$ 50k-200k de oportunidade de caixa por ano.

## A Solução

**CreditoGov**: Dashboard SaaS, distribuído via parcerias contábeis, que:
- ✅ Mostra créditos de forma **visível e atualizada** (sincronização diária)
- ✅ **Valida automaticamente** (via API do Governo)
- ✅ **Projeta caixa** (quando vira dinheiro)
- ✅ **Facilita ações** (compensar débito ou adiantar com fintechs - 2 cliques)

## O Mercado

- **TAM**: 1.5M PMEs na faixa R$ 500k-5M/mês
- **SAM**: ~400k PMEs atendidas por escritórios de contabilidade que atuam nessa faixa
- **SOM**: 1.000 PMEs no primeiro semestre pós-lançamento (10 parcerias contábeis) → 3.000-4.000 até o fim do Ano 1

## O Modelo

- **SaaS Direto**: R$ 100/mês por PME, capturado integralmente pelo CreditoGov (sem repasse a terceiros)
- **Canal comercial**: Parcerias com contadores/escritórios de contabilidade — cada parceria ativa uma carteira média de ~100 empresas (cenário pessimista); incentivo/comissão ao contador de 15-20% da mensalidade
- **Comissão Fintech/FIDC**: Monetização adicional via adiantamento de crédito, a negociar com fintechs/FIDCs/instituição financeira parceira uma vez atingida massa crítica de PMEs ativas na plataforma (sem taxa definida no cenário base)
- **Custos Fixos**: R$ 40-50k/mês (2 devs, tributarista PT, infra)

## A Viabilidade

| Métrica | Ano 1 | Ano 2 | Ano 3 |
|---------|-------|-------|-------|
| Clientes | 3-4k | 12-20k | 35-55k |
| Receita | R$ 1.2-1.8M | R$ 4.5-7M | R$ 10-15M |
| EBITDA | R$ 100k-700k | R$ 1.5-3.5M | R$ 4-8M |
| Margem | 8%-40% | 35%-50% | 45%-55% |

*Cenário base, sem contar receita de comissão fintech/FIDC (a negociar pós-volume).*

## A Recomendação

✅ **PROCEED com Sprint 0** (validação de mercado)
- Timing perfeito (Reforma tributária jan/2027)
- Parcerias com contadores/escritórios contábeis = CAC próximo de zero e distribuição em lote (1 parceria ≈ 100 PMEs)
- Diferencial tecnológico claro
- Timeline viável (6 meses MVP)

---

# EXECUTIVE REPORT

## 1. Contexto

### Reforma Tributária 2027

A partir de janeiro/2027 entra em vigor a maior reforma tributária em 30 anos:
- **CBS** (Contribuição sobre Bens e Serviços): 0,9% na compra
- **IBS** (Imposto sobre Bens e Serviços): 0,1% na compra
- **Split Payment** (abr/2027): Governo retém imposto automaticamente no banco

### O Problema Atual

PMEs não conseguem gerenciar crédito tributário:

```
┌─────────────────────────────────────┐
│ PME Compra Produto                  │
│ NF mostra: CBS = R$ 900             │
├─────────────────────────────────────┤
│ PME coloca em "crédito"             │
│ na contabilidade (manual)           │
├─────────────────────────────────────┤
│ Contabilista valida (5-10 dias)     │
│ "Pode creditar? Não sei..."         │
├─────────────────────────────────────┤
│ PME deixa R$ 100k de crédito        │
│ "dormindo" = oportunidade perdida   │
└─────────────────────────────────────┘
```

### Por Que Agora?

1. **Reforma tributária jan/2027**: Primeiro grande uso de CBS/IBS
2. **Split Payment abr/2027**: Governo valida crédito automaticamente
3. **APIs disponíveis**: Receita Federal vai oferecer (confirmado)
4. **Canal contábil pronto para escalar**: Contadores já influenciam decisão de ferramentas das PMEs

**Timing**: 6 meses até Split Payment funcionar = tempo certo para MVP

---

## 2. Análise de Mercado

### Tamanho do Mercado

**Brasil tem 1.5M de PMEs na faixa de R$ 500k-5M faturamento/mês**

Desses:
- ~500k-1M geram crédito CBS/IBS relevante (>R$ 5k/mês)
- ~400k usam Omie
- ~100k têm crédito tributário > R$ 10k/mês

### Segmentação

**Prioridade 1: Comércio/Varejo** (60%)
- Alto volume de compras = mais crédito
- Caixa apertado = precisa visibilidade
- Alta representatividade nas carteiras dos contadores parceiros

**Prioridade 2: Indústria Pequena** (25%)
- Crédito mais complexo (IPI + CBS)
- Melhor ticket médio

**Prioridade 3: Serviços** (15%)
- Crédito limitado
- Menos prioridade

### Competição

**Nenhum competitor direto.**

| Aspecto | Omie | Painel Gov | CreditoGov |
|---------|------|-----------|-----------|
| Calcula imposto | ✅ | ❌ | ❌ |
| Gerencia crédito | ❌ | ❌ | ✅ |
| Integrado ao ERP | ✅ | ❌ | ✅ |
| Validação automática | ❌ | ❌ | ✅ |
| Projeção de caixa | ❌ | ❌ | ✅ |
| Ações (compensar/adiantar) | ❌ | ❌ | ✅ |

---

## 3. Modelo de Negócio

### Revenue Streams

**1. SaaS Direto**
- PME (ou o escritório em nome dela) paga R$ 100/mês diretamente ao CreditoGov
- Sem repasse a terceiros — 100% capturado
- 3.5k PMEs (fim Ano 1) = R$ 350k/mês de MRR

**2. Comissão Fintech/FIDC** (a negociar pós-volume)
- Uso o volume de PMEs ativas na plataforma como moeda de negociação com fintechs/FIDCs/uma instituição financeira parceira
- Sem taxa comprometida no cenário base — entra como upside a partir do momento em que houver massa crítica de PMEs

**3. APIs Futuras** (2028+)
- Integração outros ERPs
- Dados agregados

### Estrutura de Custos

**Fixos: R$ 40-50k/mês**
- 2 devs: R$ 16-30k
- Tributarista PT: R$ 5-8k
- Infra: R$ 2-5k
- Outros: R$ 5-10k

**Canal (comissão contador): 15-20% da mensalidade**

**Variáveis: ~10% da receita**
- APIs: R$ 0.01-0.05/consulta
- Cloud: 5% receita
- Suporte: 2% receita

### Unit Economics

```
Receita/PME/mês: R$ 100
Comissão contador/PME: R$ 15-20
Custo fixo alocado/PME: R$ 8-10
Custo variável/PME: R$ 10
Margem/PME: R$ 60-67 (60-67%)
```

**Breakeven**: ~2.5k PMEs (10 parcerias já se aproximam do ponto de equilíbrio)

---

## 4. Viabilidade Financeira

### Cenário Base (Conservador)

| Métrica | Ano 1 | Ano 2 | Ano 3 |
|---------|-------|-------|-------|
| Clientes | 3-4k | 12-20k | 35-55k |
| SaaS MRR (fim período) | R$ 300-400k | R$ 1.2-2M | R$ 3.5-5.5M |
| Comissão Fintech/FIDC | A negociar (não contabilizada) | A negociar | A negociar |
| Receita Total | R$ 1.2-1.8M | R$ 4.5-7M | R$ 10-15M |
| Custos Fixos | R$ 600k | R$ 1.2M | R$ 1.8M |
| Comissão Canal (contadores) | R$ 220-320k | R$ 700k-1.2M | R$ 1.5-2.5M |
| Custos Variáveis | R$ 120-180k | R$ 500k-1M | R$ 1-1.5M |
| **EBITDA** | **R$ 100k-700k** | **R$ 1.5-3.5M** | **R$ 4-8M** |
| Margem | 8%-40% | 35%-50% | 45%-55% |

*Comissão fintech/FIDC é upside não contabilizado no cenário base — depende de negociação pós-volume.*

### ROI

**Investimento**: R$ 150-250k (6 meses de operação)

**Payback**: 9-12 meses (ano 1)

**NPV (5 anos, 10% discount)**: R$ 8-15M

**IRR**: 120-180%

---

## 5. Riscos e Mitigação

| Risco | Prob | Impacto | Mitigação |
|-------|------|---------|-----------|
| API Receita atrasa | Média | Alto | Validação manual + tributarista |
| Contadores não aderem à parceria | Média | Alto | Ajustar incentivo/comissão; testar múltiplos formatos de parceria |
| Split Payment falha | Média | Médio | Usar ECF com lag 30d |
| Regulação muda | Baixa | Alto | Time tributarista atualiza |
| PME não paga SaaS | Baixa | Médio | Ajustar preço/tiering; reforçar canal contador |

---

# INVESTMENT PITCH

## O Problema (1 slide)

**Situação**
- 1.5M de PMEs brasileiras geram crédito tributário CBS/IBS
- Deixam R$ 100k+ de crédito "dormindo" na contabilidade
- Não sabem quanto têm, quando vira dinheiro, se podem usar

**Impacto**
- Perdem R$ 50k-200k de oportunidade de caixa/ano
- Pagam juros bancários caros (12% am) desnecessariamente
- Falta visibilidade e contexto operacional

**Por que agora?**
- Reforma tributária jan/2027
- Split Payment abr/2027 valida crédito automaticamente
- APIs da Receita Federal ficam disponíveis
- Timing: 6 meses para MVP

---

## A Solução (1 slide)

**CreditoGov**: Dashboard SaaS que:

1. **Visibilidade Real**: Sincronização diária de créditos (Receita Federal API)
2. **Validação Automática**: Governo confirma pagamento via Split Payment
3. **Projeção de Caixa**: Mostra quando vira dinheiro (próximos 30/60/90 dias)
4. **Ações Facilitadas**: Compensar débito ou adiantar crédito (2 cliques)
5. **Contexto Operacional**: Conecta compra específica → crédito → ação

**Diferencial**: Única solução integrada no mercado

---

## O Mercado (1 slide)

**TAM**: 1.5M PMEs (R$ 500k-5M faturamento/mês)  
**SAM**: ~400k PMEs atendidas por escritórios de contabilidade nessa faixa  
**SOM**: 1.000 PMEs no primeiro semestre (10 parcerias contábeis) → 3-4k no fim do Ano 1  

**Go-to-Market**:
- Parcerias com contadores/escritórios contábeis (CAC próximo de zero, 6 primeiros meses pós-lançamento)
- Expansão do canal contábil + eventual direct/freemium (a partir do Ano 2)
- Fintech/FIDC entra como parceiro de monetização depois de construído o volume

---

## O Modelo de Negócio (1 slide)

**Revenue Streams**:
1. **SaaS Direto**: R$ 100/mês por PME, 100% capturado pelo CreditoGov
2. **Comissão Fintech/FIDC**: A negociar pós-volume (upside, não contabilizado no cenário base)
3. **APIs Futuras**: Outros ERPs, dados agregados (2028+)

**Unit Economics**:
- Receita/PME: R$ 100/mês
- Comissão contador (canal): R$ 15-20/mês
- Custo fixo alocado: R$ 8-10/mês
- Margem/PME: 60-67%

**Breakeven**: ~2.5k PMEs (25 parcerias contábeis)

---

## Projeção Financeira (1 slide)

| Ano | Clientes | Receita | EBITDA | Margem |
|-----|----------|---------|--------|--------|
| 1 | 3-4k | R$ 1.2-1.8M | R$ 100k-700k | 8-40% |
| 2 | 12-20k | R$ 4.5-7M | R$ 1.5-3.5M | 35-50% |
| 3 | 35-55k | R$ 10-15M | R$ 4-8M | 45-55% |

**ROI**: 
- Investimento: R$ 200k
- Payback: 9-12 meses
- IRR: a recalcular com dados reais do canal contábil (upside vs. modelo anterior, dado 100% de captura de receita)

---

## Equipe & Próximos Passos (1 slide)

**Equipe**:
- Backend developer (Node.js)
- Frontend developer (React)
- Tributarista part-time (validação CBS/IBS)
- Product manager / responsável pelo canal contábil

**Sprint 0 (Ago-Set/2026)**: Validação de mercado
- 10-15 entrevistas com PMEs e contadores
- Mapeamento e primeiras conversas com escritórios de contabilidade
- Confirmação Receita Federal (API)
- Decisão Go/No-Go (20/set)

**Timeline**: MVP jan/2027, Go-Live abr/2027, 10 parcerias contábeis fechadas até 6 meses após o Go-Live

---

## Call to Action (1 slide)

**Investimento Solicitado**: R$ 150-250k

**Uso dos Fundos**:
- Salários (2 devs + tributarista): R$ 90-120k
- Infraestrutura (AWS, etc): R$ 15-25k
- Canal contábil (comissões/incentivo aos primeiros parceiros): R$ 10-20k
- Contingência: R$ 25-35k

**Retorno Esperado**:
- 9-12 meses: Breakeven
- Ano 2: R$ 1.6M EBITDA
- Ano 3: R$ 4.5M EBITDA
- Potencial de aquisição (2028+)

---

# BUSINESS CASE

## 1. Análise de Viabilidade

### 1.1 Mercado Validado?

✅ **SIM**
- Problema: Confirmado com tributarista
- Solução: Viável tecnicamente (APIs existem)
- Mercado: 1.5M PMEs, 100k+ com crédito relevante
- Timing: Perfeito (Reforma jan/2027, Split Payment abr/2027)

### 1.2 Go-to-Market Viável?

✅ **SIM**
- Canal contábil: 10 parcerias (~100 PMEs cada) = 1.000 clientes no primeiro semestre, CAC próximo de zero
- Escalável: cada nova parceria contábil adiciona lote de PMEs, sem custo de aquisição unitário
- Fintech/FIDC: monetização adicional, negociada com base no volume já construído

### 1.3 Financeiro Viável?

✅ **SIM**
- Breakeven em ~2.5k PMEs (25 parcerias contábeis, alcançável dentro do Ano 1)
- Margem 60-67% por unidade (escalável)
- EBITDA positivo já no Ano 1 no cenário base
- Comissão fintech/FIDC como upside adicional não contabilizado

---

## 2. Análise de Cenários

### Cenário 1: Conservador (menos parcerias fecham, ou trazem menos empresas)

| Métrica | Ano 1 | Ano 2 | Ano 3 |
|---------|-------|-------|-------|
| Clientes | 2-2.5k | 8-12k | 22-35k |
| Receita | R$ 800k-1.2M | R$ 3-4.5M | R$ 6.5-9.5M |
| EBITDA | -R$ 100k a +R$ 200k | R$ 800k-2M | R$ 2.5-5M |

**Ainda viável**: Breakeven em Y1-Y1.5, lucrativo em Y2+

### Cenário 2: Base (10 parcerias/semestre 1, média 100 PMEs/parceria)

| Métrica | Ano 1 | Ano 2 | Ano 3 |
|---------|-------|-------|-------|
| Clientes | 3-4k | 12-20k | 35-55k |
| Receita | R$ 1.2-1.8M | R$ 4.5-7M | R$ 10-15M |
| EBITDA | R$ 100k-700k | R$ 1.5-3.5M | R$ 4-8M |

**Esperado**: EBITDA positivo já no Ano 1, muito lucrativo em Y2+

### Cenário 3: Otimista (mais parcerias, carteiras maiores que a média de 100)

| Métrica | Ano 1 | Ano 2 | Ano 3 |
|---------|-------|-------|-------|
| Clientes | 5-6k | 25-35k | 65-90k |
| Receita | R$ 1.8-2.7M | R$ 9-12M | R$ 18-25M |
| EBITDA | R$ 400k-1M | R$ 3.5-5.5M | R$ 8-13M |

**Possível**: Lucrativo desde o Ano 1, com fintech/FIDC como upside adicional não contabilizado

---

## 3. Análise de Sensibilidade

### Variável: Número de Parcerias Contábeis Fechadas (H1)

```
Parcerias fechadas no primeiro semestre:
- 5 parcerias (pessimista): ~500 PMEs
- 10 parcerias (base): ~1.000 PMEs
- 15 parcerias (otimista): ~1.500 PMEs
```

**Driver Crítico**: Canal contábil (reduz CAC para próximo de zero, distribuição em lote)

### Variável: Preço SaaS

```
Preço/mês:
- R$ 50 (pessimista): Breakeven ~5k PMEs
- R$ 100 (base): Breakeven ~2.5k PMEs
- R$ 150 (otimista): Breakeven ~1.7k PMEs
```

**Recomendação**: Tiering (R$ 50/100/200) para capturar mais valor

### Variável: Comissão do Canal Contábil

```
Incentivo/comissão ao contador (% da mensalidade):
- 20% (conservador para a margem): reduz margem/PME em ~R$ 20
- 15% (base): reduz margem/PME em ~R$ 15
```

**Recomendação**: Negociar comissão fixa em R$ (não % crescente) para preservar margem à medida que o volume aumenta

### Variável: Comissão Fintech/FIDC

Sem taxa definida — depende da negociação pós-volume. Não incluída no cenário base; tratar como upside quando a base de PMEs ativas permitir negociar condições favoráveis com fintechs/FIDCs/uma instituição financeira parceira.

---

## 4. Análise de Dependências

### 🔴 Crítica: API Receita Federal

**Status**: Não pública ainda (esperada jan/2027)

**Plano B**:
- Usar ECF (Escrituração Eletrônica) com lag manual
- Validar com tributarista (2-3 dias)
- Integração total quando API fica pública

**Impacto se atrasar**: MVP fica em fev/2027 (aceitável)

### 🔴 Crítica: Adesão dos Contadores à Parceria

**Status**: A validar no Sprint 0 (primeiras conversas ago/2026)

**Plano B**:
- Ajustar o incentivo/comissão oferecido ao contador
- Testar formatos alternativos de parceria (white-label, indicação simples, revenda)
- Se o canal não performar, complementar com direct to PME (landing page + ads), com CAC mais alto

**Impacto se performar abaixo do esperado**: Menos parcerias fechadas no H1, meta de 1.000 PMEs demora mais a ser atingida — payback se estende

### 🟡 Importante: Split Payment Funcional

**Status**: Abr/2027 (governo)

**Plano B**:
- MVP sem Split Payment (manual validation)
- Full automation quando Split Payment sai
- Beta de 2-3 meses antes (fev-mar/2027)

**Impacto se atrasar**: Go-live atrasa para jun/2027 (aceitável)

---

## 5. Análise de Riscos Mitigáveis

| Risco | Probabilidade | Impacto | Mitigação | Investimento |
|-------|--------------|---------|-----------|--------------|
| API Receita atrasa | 40% | Alto | Validação manual | R$ 20k (tributarista) |
| Contadores não aderem no ritmo esperado | 30% | Alto | Ajustar incentivo + complementar com direct to PME | R$ 30-50k (comissão/marketing) |
| Adoção lenta dentro das carteiras dos parceiros | 30% | Médio | Onboarding assistido + referral entre PMEs | R$ 30k (product) |
| Regulação muda | 10% | Médio | Time tributarista | R$ 15k (consulting) |
| Fintech/FIDC não negocia condições favoráveis | 25% | Baixo | Buscar múltiplos parceiros (fintech, FIDC, FI) | R$ 10k (dev) |

**Total de contingência**: R$ 50-70k (já incluído no orçamento)

---

## 6. KPIs de Sucesso

### Ano 1

**Produto**:
- MVP pronto (dez/2026): ✅
- Cron job funcional: ✅
- Dashboard basic: ✅
- Testes 80% coverage: ✅

**Negócio**:
- 10 parcerias contábeis fechadas (H1): ✅
- 3-4k clientes (fim de ano): ✅
- NPS > 50: ✅
- Churn < 5%: ✅
- CAC próximo de zero via canal contábil: ✅

**Financeiro**:
- EBITDA positivo: ✅
- MRR R$ 300-400k (fim de ano): ✅
- Primeira negociação fintech/FIDC iniciada: ✅

### Ano 2-3

**Produto**:
- API pública: ✅
- Mobile app: ✅
- Advanced analytics: ✅

**Negócio**:
- 12-20k clientes (Y2), 30-50 parcerias contábeis ativas: ✅
- 35-55k clientes (Y3): ✅
- NPS > 60: ✅
- Churn < 3%: ✅

**Financeiro**:
- Y2 EBITDA R$ 1.5-3.5M: ✅
- Y3 EBITDA R$ 4-8M: ✅
- Margem EBITDA 45%+: ✅
- Comissão fintech/FIDC negociada e ativa: ✅

---

## 7. Opções de Exit

### Aquisição (Mais Provável)

**Compradores Potenciais**:
1. **Omie** (maior plataforma de gestão)
2. **Bluesoft** (integrador fiscal)
3. **Fintechs grandes** (Facile, Nubank, etc)
4. **BigTech** (Microsoft, Google, Amazon)

**Valuation**: R$ 50-150M (em 2028-2029)

**Múltiplo**: 5-10x receita (software SaaS)

### IPO (Menos Provável)

Se atingir:
- R$ 20M+ ARR
- 50%+ YoY growth
- Rentabilidade > 20% EBITDA

**Timeline**: 2029-2030

---

## 8. Recomendação Final

### ✅ PROCEED com Investimento

**Razões**:

1. **Mercado Real**: 1.5M PMEs, problema validado, timing perfeito
2. **Diferencial Claro**: Única solução integrada no mercado
3. **Go-to-Market Viável**: Canal contábil = CAC próximo de zero e distribuição em lote (1 parceria ≈ 100 PMEs)
4. **Financeiro Sólido**: EBITDA positivo já no Ano 1, comissão fintech/FIDC como upside adicional
5. **Riscos Mitigáveis**: Planos B para todas as dependências críticas
6. **Timeline Realista**: 6 meses MVP, entrada em produção abr/2027

### Próximas Ações (Sprint 0)

**Semana 1 (Ago 26-30)**:
- [ ] 5-10 entrevistas com PMEs
- [ ] Documentar feedback
- [ ] Validar problema/solução

**Semana 2-3 (Set 2-13)**:
- [ ] Primeiras conversas com contadores/escritórios contábeis (mapear formato de parceria e incentivo)
- [ ] Contato com Receita Federal
- [ ] Explorar parcerias fintech/FIDC (para negociação futura, pós-volume)

**Semana 4 (Set 14-20)**:
- [ ] Decisão Go/No-Go
- [ ] Setup de repositório Git
- [ ] Iniciar contratações (se Go)

**Semana 5+ (Set 21+)**:
- [ ] Sprint 1: Backend setup
- [ ] Sprint 2: Frontend setup
- [ ] Sprint 3+: Desenvolvimento iterativo

---

## Conclusão

CreditoGov é uma **oportunidade real de negócio** que resolve um **problema crítico para 1.5M de PMEs brasileiras** com **timing perfeito** (reforma tributária jan/2027) e **modelo financeiro sólido** (lucratividade desde início).

O investimento de **R$ 150-250k** tem potencial de retorno de **R$ 50-150M em 3-4 anos** com **riscos mitigáveis** e **múltiplos caminhos de sucesso**.

**Recomendação**: Invest now, accelerate fast.

---

**FIM DO RELATÓRIO**

Preparado em: Agosto 2026  
Versão: 1.0  
Status: Pronto para apresentação
