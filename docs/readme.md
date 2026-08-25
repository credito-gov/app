# CreditoGov ✅

**Visibilidade e Gestão Inteligente de Créditos Tributários CBS/IBS**

Plataforma SaaS que integra-se ao Omie para oferecer visibilidade em tempo real sobre créditos tributários CBS/IBS gerados em operações de compra, com validação automática via Split Payment e facilitação de ações de compensação ou adiantamento.

---

## 🎯 O Problema

**PMEs não têm visibilidade sobre:**
- Quanto de crédito tributário realmente têm disponível
- Quando esse crédito vira dinheiro
- Qual operação específica gerou qual crédito
- Como usar esse crédito para melhorar caixa

**Resultado:** Deixam R$ 100k+ de crédito "dormindo" na contabilidade.

---

## ✨ A Solução

Dashboard integrado que mostra:
- ✅ **Créditos validados** (governo confirmou pagamento)
- ✅ **Créditos pendentes** (em processamento)
- ✅ **Projeção de caixa** (quando vira dinheiro)
- ✅ **Oportunidades** (compensar débito, adiantar com fintech)
- ✅ **Contexto** (qual compra gerou qual crédito)

---

## 📊 Status do Projeto

**Fase**: Sprint 0 - Validação de Mercado  
**Timeline**: Ago-Set/2026 (validação) → Jan/2027 (MVP) → Abr/2027 (Go-Live)  
**Conclusão**: ~55% (Documentação + Design) ✅ | Aguardando Código

```
📋 Documentação        ✅ 100%
🎨 Design System       ✅ 100%
🖼️ Wireframes          ✅ 80%
📈 Kanban             ✅ 100%
🛠️ Backend Code       ⏳ 0%
⚛️ Frontend Code      ⏳ 0%
🧪 Testes            ⏳ 0%
```

---

## 📁 Estrutura do Projeto

```
CreditoGov/
├── docs/                  # 📚 Toda documentação
├── backend/               # 🛠️ Node.js + Express
├── frontend/              # ⚛️ React + TypeScript
├── design/                # 🎨 Wireframes + Design System
├── config/                # ⚙️ Configurações
├── .env.example           # 🔐 Variáveis de ambiente
├── README.md              # 📖 Este arquivo
└── INDICE.md              # 📋 Índice completo
```

---

## 📚 Documentação

Todos os documentos estão em `docs/`:

### Negócio
- [`docs/01_PLANO_DE_NEGOCIO.md`](docs/01_PLANO_DE_NEGOCIO.md) - Estratégia completa
- [`docs/02_MODELO_NEGOCIO.md`](docs/02_MODELO_NEGOCIO.md) - Business Model Canvas
- [`docs/11_KANBAN.md`](docs/11_KANBAN.md) - Roadmap com Sprints

### Técnico
- [`docs/05_ARQUITETURA_TECNICA.md`](docs/05_ARQUITETURA_TECNICA.md) ⭐ - Stack, fluxos, banco de dados
- [`docs/12_DESIGN_SYSTEM.md`](docs/12_DESIGN_SYSTEM.md) - Cores, tipografia, componentes

### Design
- [`design/wireframes/01_DASHBOARD_PRINCIPAL.md`](design/wireframes/01_DASHBOARD_PRINCIPAL.md) - Layouts principal

---

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- PostgreSQL 13+
- Git

### Setup Local (Em breve)

```bash
# Clone o repositório
git clone <repo> && cd CreditoGov

# Backend
cd backend && npm install && npm run dev

# Frontend (em outra terminal)
cd frontend && npm install && npm run dev
```

---

## 🎮 Como Usar (Versão Final)

1. **Login** com credenciais Omie
2. **Conectar** certificado digital ou credenciais do governo
3. **Sistema sincroniza** créditos automaticamente
4. **Ver dashboard** com créditos validados
5. **Compensar** débito ou **adiantar** crédito com 2 cliques

---

## 💰 Modelo de Negócio

**SaaS + Partnership + Revenue Share**

- **Omie**: Integração nativa (zero CAC)
- **PME**: Fee via Omie + opções de adiantamento
- **Receita Federal**: APIs de validação de crédito
- **Fintechs**: Comissão em adiantamentos

---

## 🎯 Roadmap

| Fase | Período | Status |
|------|---------|--------|
| **Sprint 0** | Ago-Set/2026 | 🔄 Validação |
| **Sprint 1-4** | Out-Dez/2026 | ⏳ Setup + Backend |
| **Sprint 5-7** | Jan-Mar/2027 | ⏳ Frontend + Beta |
| **Go-Live** | Abr/2027+ | 📅 Com Split Payment |

---

## 🔐 Segurança

- ✅ JWT + OAuth2 authentication
- ✅ Dados sensíveis encriptados (AES-256)
- ✅ HTTPS/TLS
- ✅ Rate limiting
- ✅ WCAG 2.1 AA accessibility

---

## 📊 Métricas de Sucesso

| KPI | Target | Ano 1 |
|-----|--------|-------|
| Clientes | 5-10k | ----- |
| Receita SaaS | R$ 1-2M | ----- |
| Comissão Split | R$ 300-500k | ----- |
| Churn | <5% mês | ----- |
| NPS | >50 | ----- |

---

## 👥 Time

- **Backend**: [Nome] - Node.js, PostgreSQL
- **Frontend**: [A definir] - React, TypeScript
- **Tributarista**: [A definir] - Validações CBS/IBS

---

## 📞 Contato

- **Email**: [TBD]
- **Slack**: [Link do workspace]
- **Issues**: GitHub Issues

---

## 📄 Licença

Proprietary © 2026 CreditoGov

---

## 🙏 Agradecimentos

- Receita Federal (documentação Split Payment)
- Omie (partnership)
- Comunidade de tributaristas consultados

---

**Última atualização**: 25 de agosto de 2026  
**Versão**: 0.1.0-alpha