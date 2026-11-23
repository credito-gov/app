# Modelo de Negócio - CreditoGov

## Business Model Canvas Completo

### 1. SEGMENTOS DE CLIENTES (Customer Segments)

#### Primário: PMEs via Parceria Contábil
- **Tipo**: B2B SaaS
- **Perfil**: PMEs comércio/varejo/indústria pequena, dentro da carteira de escritórios de contabilidade parceiros
- **Tamanho**: 3-4k clientes (fim ano 1), via 10 parcerias no 1º semestre (~100 PMEs/parceria)
- **Faturamento**: R$ 500k - R$ 5M/mês
- **Comprador**: Proprietário ou CFO (decisão influenciada/indicada pelo contador)
- **Ticket**: R$ 100/mês, pago direto ao CreditoGov
- **Volume**: Em lote, por parceria fechada

#### Secundário: PMEs Diretas (Direct)
- **Tipo**: B2B SaaS independente
- **Perfil**: Mesma segmentação, mas acesso direto (sem intermediação de contador)
- **Tamanho**: Canal complementar, a partir do Ano 2
- **Ticket**: R$ 50-150/mês
- **Modelo**: Freemium + premium

#### Terciário: Fintechs/FIDCs (B2B Revenue Share — a negociar)
- **Tipo**: B2B2C
- **Parceiros**: Fintechs, FIDCs ou uma instituição financeira (a definir)
- **Modelo**: Comissão por originação de adiantamento — sem taxa fixada; negociada quando a base de PMEs ativas atingir massa crítica
- **Volume**: 1-3 parceiros, entrada planejada a partir do Ano 2

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
- **Única solução integrada** (dados operacionais + governo + ação)
- **Validação automática** (via Split Payment)
- **Contexto operacional** (compra → crédito → ação)
- **Sem fricção** (2 cliques, não consultoria manual)
- **Distribuição via contador** (adoção com confiança já estabelecida)
- **Timing perfeito** (Reforma tributária jan/2027)

---

### 3. CANAIS DE DISTRIBUIÇÃO (Channels)

| Canal | Estratégia | Timeline | CAC |
|-------|-----------|----------|-----|
| **Parcerias Contábeis** | Onboarding em lote via carteira do contador (~100 PMEs/parceria); comissão 15-20% da mensalidade | Abr-Out/2027 (primeiros 6 meses pós-lançamento) | Próximo de R$ 0 (custo = comissão recorrente) |
| **Direct SaaS** | Landing page + google ads (complementar) | Ano 2+ | R$ 50-150 |
| **Freemium** | Versão básica grátis → upsell | Ano 2+ | R$ 20-50 |
| **Fintech/FIDC** | Embedded no fluxo de adiantamento — a negociar pós-volume | Ano 2+ | R$ 0 (comissão) |

### Customer Journey

```
Contador parceiro indica o CreditoGov para sua carteira de PMEs
    ↓
PME conecta com certificado digital (1 clique, onboarding assistido pelo contador)
    ↓
Dashboard mostra créditos
    ↓
Clica "Adiantar" → vai pra Fintech/FIDC parceiro
    ↓
Fintech/FIDC aprova e repassa R$
```

---

### 4. RELACIONAMENTO COM CLIENTES (Customer Relationships)

#### Para PME
- **Onboarding**: Automatizado (1-2 minutos)
- **Dashboard**: Self-service (nenhum suporte necessário)
- **Alertas**: Automáticos (novo crédito, vencimento)
- **Suporte**: Email/chat (tier free)
- **Modelo**: Low-touch SaaS

#### Para Contadores/Escritórios Contábeis
- **Contato**: Ponto focal dedicado durante onboarding da carteira
- **Relatórios**: Mensais (PMEs ativas, uso, comissão gerada)
- **Incentivo**: Comissão recorrente por PME ativa (15-20% da mensalidade)
- **Suporte**: Canal direto para dúvidas sobre a carteira

#### Para Fintechs/FIDCs
- **API**: Integration support
- **Relatórios**: Revenue share mensal (uma vez negociado)
- **Performance**: Feedback loop
- **Co-marketing**: Quando relevante

---

### 5. REVENUE STREAMS (Fontes de Receita)

#### 5A. SaaS Subscription (Direto)

**Modelo**
```
PME (ou escritório contábil em nome dela) paga CreditoGov R$ 100/mês
  └── CreditoGov recebe R$ 100 (100% capturado)
      └── Repassa comissão de 15-20% ao contador que trouxe a PME
```

**Volume**
- 3-4k PMEs no fim do ano 1 (via 10 parcerias contábeis no 1º semestre, expandindo no 2º)
- R$ 100/mês × 3.5k = R$ 350k/mês (MRR fim de ano)
- ARR run-rate: R$ 3.6-4.8M (fim de ano, conservador)

**Modelo de Precificação**
- Tier 1 (Básico): R$ 50/mês - Dashboard + sincronização
- Tier 2 (Pro): R$ 100/mês - Tudo + projeções avançadas
- Tier 3 (Enterprise): R$ 200/mês + custom - Integração direta

#### 5B. Comissão Fintech/FIDC (a negociar pós-volume)

**Modelo**
```
PME tem R$ 100k de crédito
PME clica "Adiantar R$ 80k" no CreditoGov
  ↓
Redireciona para Fintech/FIDC parceiro (a definir)
  ↓
Fintech/FIDC aprova e retém sua taxa de adiantamento
  └── CreditoGov negocia uma comissão sobre essa taxa
      — condições a definir quando houver massa crítica de PMEs ativas
```

**Racional**
- Não há taxa comprometida no cenário base
- O volume de PMEs ativas construído pelo canal contábil é o ativo de barganha nessa negociação
- Sequenciamento: primeiro escala (canal contábil), depois monetização adicional (fintech/FIDC/FI)

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
- Relacionamento com Receita Federal e rede de contadores parceiros

#### Tecnologia
- Plataforma SaaS (backend Node, frontend React/Vue)
- Infraestrutura cloud (AWS)
- Banco de dados (PostgreSQL)
- Integrações (Omie, Receita Federal, Fintechs)

#### Pessoas
- Desenvolvedor(es) fullstack (2x)
- Tributarista part-time
- Product manager
- Responsável pelo canal contábil (desenvolvimento e gestão das parcerias)

#### Parceria
- Contadores/escritórios contábeis (distribuição)
- Receita Federal (dados)
- Fintechs/FIDCs/instituição financeira (monetização, a negociar)

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
- Prospecção e onboarding de novos escritórios contábeis
- Comunicação com Receita Federal
- Negociação com fintechs/FIDCs (a partir de massa crítica de PMEs)
- Co-marketing com contadores parceiros

---

### 8. KEY PARTNERSHIPS (Parcerias-Chave)

| Parceiro | Tipo | Benefício | Timeline | Crítico |
|----------|------|-----------|----------|---------|
| **Contadores/Escritórios Contábeis** | Distribuidor | Acesso em lote a carteiras de PMEs (~100/parceria) | Abr/2027+ (6 primeiros meses pós-lançamento) | 🔴 SIM |
| **Receita Federal** | Data provider | API de Créditos | Jan/2027+ | 🔴 SIM |
| **Fintech/FIDC/FI** (a definir) | Revenue share | Adiantamento de crédito | Ano 2+ (pós-volume) | 🟡 NÃO |
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
| **Infraestrutura (AWS)** | R$ 2-5k | Mensal |
| **Outros (legal, contabilidade, etc)** | R$ 5-10k | Mensal |

**Total Fixed**: R$ 28-53k/mês

#### Custo de Canal (Variável, atrelado ao volume)

| Item | Custo | Base |
|------|-------|------|
| **Comissão contador** | 15-20% da mensalidade | Por PME ativa trazida via parceria |

#### Breakeven Analysis

```
Receita Monthly (fim ano 1) = R$ 350k (3.5k PMEs × R$ 100)

Custos Fixed = R$ 40-50k
Comissão Canal (18%) = R$ 63k
Custos Variáveis = R$ 35k (10% receita)

Contribuição = R$ 350k - R$ 143k = R$ 207k

Breakeven ≈ 2.5k PMEs (25 parcerias contábeis) — atingível dentro do Ano 1 ✅
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
- Canal (parcerias contábeis = CAC próximo de zero, distribuição em lote)
- Dados (integração com governo)
- Contexto (integração com operação)

### Modelo de Receita
- 100% SaaS direto no cenário base (previsível, recurring, capturado integralmente)
- Comissão Fintech/FIDC como upside a negociar pós-volume (não contabilizada no cenário base)

### Escalabilidade
- Zero marginal cost (software)
- Distribuição em lote via parcerias, não venda um a um
- Plataforma (2-3 devs escalam para centenas de milhares de PMEs)

---

**Conclusão**: CreditoGov é um modelo de negócio **viável, escalável e sustentável**.

---

**Última atualização**: Agosto 2026
