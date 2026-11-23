# PROJECT_CONTEXT — CreditoGov

> Fonte canônica do projeto. Leia inteiro antes de mexer em qualquer coisa.
> Se uma demanda, task ou documento antigo divergir daqui, **este arquivo vale** — pare e pergunte.
> Tudo que está em `docs/historico/` e `docs/tasks/` é registro do passado, não regra.

---

## 1. O que é

O **CreditoGov** é um SaaS B2B para pequenas e médias empresas no regime regular de CBS/IBS. Ele mostra ao empresário o crédito tributário gerado pelas compras como parte do caixa: quanto existe, de qual compra veio, o que já pode ser usado e o que ainda depende do fornecedor.

Três ideias sustentam o produto. Elas vieram da concepção (ago/2026) e continuam valendo:

1. **O ERP já calcula CBS/IBS.** O CreditoGov não calcula imposto. O valor está em tratar o crédito como ativo de caixa.
2. **Crédito vem das compras; venda gera débito.** O saldo é crédito menos débito.
3. **O crédito depende do recolhimento.** O adquirente só aproveita o crédito quando o débito do fornecedor foi extinto (por split payment, recolhimento pelo adquirente ou outra modalidade). Mostrar o que está confirmado e o que está pendente, por fornecedor, é o centro do produto.

Só CBS e IBS. Tributos antigos (PIS, Cofins, ICMS, ISS, IPI) ficam fora do escopo.

Visão de produto e negócio: [`produto/visao.md`](produto/visao.md).

---

## 2. Estado real do projeto

| Parte | Situação |
|---|---|
| Landing page (`app/landing-page`) | No ar em <https://credito-gov.vercel.app/>, na versão clara da `main`. Ainda com placeholders (depoimentos, preço) e promessas não validadas — ver §6 |
| Redesign escuro da landing | Tasks 015–025 integradas na branch `feat/landing-redesign`. Falta a 026 (PR #22 aberto) e a 027. PR centralizador #10 em rascunho |
| Backend, banco, autenticação, painel | **Não iniciados.** As tasks 001–005 foram escritas e estão suspensas (ver §5) |
| Validação de mercado (entrevistas, contadores, tributarista) | Sem registro no repositório |

---

## 3. Decisões tomadas

| Data | Decisão |
|---|---|
| 2026-08-12 | Escopo só CBS/IBS; tributos antigos fora |
| 2026-08-12 | O produto é gestão do crédito como caixa, não cálculo de imposto |
| 2026-08-25 | Omie descartado como canal de distribuição e como forma de login |
| 2026-08-25 | Autenticação própria da plataforma (email + senha), sem credencial de ERP |
| 2026-08-26 | Venda direta (SaaS), com escritórios de contabilidade como canal comercial principal |
| 2026-08-26 | Antecipação com fintech/FIDC fica para depois de haver base de clientes |
| 2026-11-23 | Fonte de dados dos créditos rebaixada de premissa para **hipótese em aberto** (ver §5) |
| 2026-11-23 | Fluxo de trabalho passa a ser por demandas (US → Spec → Tasks) com subagentes; o modelo de tasks + walkthrough fica congelado |

---

## 4. Stack

### Landing page — o que existe

Vite 8, React 19, TypeScript 6, Tailwind CSS v4 (plugin do Vite), lint com `oxlint`. Publicada no Vercel. Precisa de Node 20.12 ou mais novo.

```bash
cd app/landing-page
npm install
npm run dev     # http://localhost:5173
npm run lint
npm run build   # tsc -b && vite build
```

Não há testes automatizados nem CI configurado.

### Aplicação (backend e painel) — proposta, não confirmada

A concepção propôs Node.js + Express + TypeORM + PostgreSQL no backend e React + Redux Toolkit + shadcn/ui no painel. Nada disso foi construído. A stack será confirmada na Spec da primeira demanda de backend, depois de resolvida a fonte de dados. O desenho antigo está em [`historico/2026-08-concepcao/05_ARQUITETURA_TECNICA.md`](historico/2026-08-concepcao/05_ARQUITETURA_TECNICA.md) e **não deve ser seguido como especificação**.

---

## 5. Hipóteses e decisões em aberto

Lista completa em [`produto/hipoteses.md`](produto/hipoteses.md). As que travam desenvolvimento:

- **Fonte de dados dos créditos (bloqueia todo o backend).** A concepção assumiu uma API da Receita Federal com OAuth2 e endpoints como `/apuracao-creditos/{cnpj}`. Os manuais oficiais em [`referencias/split-payment/`](referencias/split-payment/README.md) não descrevem nada disso: a Plataforma Pública de Split Payment liga bancos e PSPs ao governo, usa mTLS e não oferece consulta de crédito por contribuinte. Enquanto a fonte não for decidida, não se desenha modelo de dados, sincronização nem integração.
- **Como a empresa autoriza o acesso aos dados dela** (certificado digital, procuração eletrônica, exportação do ERP) — depende da fonte.
- **Compensar e antecipar pelo painel.** Não há base, nos manuais do repositório, para afirmar que um terceiro consegue disparar a compensação. A antecipação depende de parceiro e de entendimento jurídico sobre cessão desse crédito.
- **Preço e comissão do contador** (R$ 100/mês e 15–20% são hipóteses da concepção).

As tasks 001–005 do modelo antigo foram escritas sobre a premissa da API e estão suspensas.

---

## 6. Regras que valem sempre

### Domínio

- Não afirmar regra tributária sem fonte. O que estiver nos manuais de `referencias/` pode ser citado com o trecho; o resto entra como "a validar com tributarista".
- Não tratar as alíquotas de teste (CBS 0,9% e IBS 0,1%) como definitivas, nem dizer que o IBS substitui ICMS/ISS em 2027. Ver [`produto/reforma-tributaria.md`](produto/reforma-tributaria.md).
- Crédito não confirmado nunca é apresentado como disponível.

### Texto público (landing, materiais)

- Não prometer integração, sincronização, garantia ou funcionalidade que não exista.
- Não publicar depoimento, logo de cliente ou número de resultado inventado.

### Código

- Valores monetários em decimal de precisão fixa, nunca ponto flutuante.
- Nunca commitar `.env`, credenciais, tokens ou certificados. Nunca registrar esses dados em log.
- Nunca commitar `node_modules/`, `dist/` nem arquivos temporários.
- Sem PR com lint ou build falhando.
- Não criar funcionalidade que não foi pedida. Decisão técnica relevante vai para a Spec da demanda, não fica implícita no código.

---

## 7. Estrutura do repositório

```
credito-gov/
├── AGENTS.md                  # regras para agentes (o CLAUDE.md só importa este)
├── README.md
├── .claude/fluxo.json         # configuração do fluxo de demandas
├── app/
│   └── landing-page/          # única aplicação existente
└── docs/
    ├── PROJECT_CONTEXT.md     # este arquivo
    ├── README.md              # índice da documentação
    ├── produto/               # visão, hipóteses, reforma tributária
    ├── design/                # design system, wireframes, marca
    ├── referencias/           # material oficial de terceiros (Split Payment)
    ├── demandas/              # kanban, templates e uma pasta por demanda
    ├── handoff/               # registros de passagem entre sessões
    ├── tasks/                 # modelo antigo (001–027), congelado
    └── historico/             # documentos da concepção, só para consulta
```

Aplicações novas entram em `app/<nome>`.

---

## 8. Convenções

- **Idioma:** documentação, commits e PRs em português.
- **Commits:** Conventional Commits (`feat(landing): ...`, `fix(...)`, `docs(...)`, `chore(...)`, `test(...)`, `refactor(...)`).
- **Branches:** `feat/NNN-slug`, `fix/NNN-slug` ou `docs/NNN-slug`, sempre a partir de `main`. Nunca trabalhar direto na `main`.
- **Demandas:** `NNN-slug`, numeração contínua a partir de 028 (001–027 são do modelo antigo).
- **Arquivos TypeScript:** `camelCase.ts` para utilitários, `PascalCase.tsx` para componentes React.
- **Markdown:** UTF-8, nomes de arquivo em minúsculas com hífen.

O fluxo de trabalho está em [`../AGENTS.md`](../AGENTS.md).

---

## 9. Glossário

| Termo | Significado |
|---|---|
| **CBS** | Contribuição sobre Bens e Serviços, federal. Substitui PIS e Cofins |
| **IBS** | Imposto sobre Bens e Serviços, de estados e municípios. Substitui ICMS e ISS de forma gradual |
| **CGIBS** | Comitê Gestor do IBS |
| **Regime regular** | Regime em que a empresa apura débito e crédito de CBS/IBS. É o público do produto |
| **Fornecedor / Adquirente** | Quem vende e quem compra. O crédito é do adquirente |
| **Crédito tributário** | Direito do adquirente sobre o CBS/IBS das compras. Exige destaque no documento fiscal e extinção do débito do fornecedor |
| **Split payment** | Segregação e recolhimento do CBS/IBS no momento da liquidação financeira do pagamento. De adoção facultativa por quem origina a transação |
| **PSP** | Prestador de serviço de pagamento (banco, instituição de pagamento). É quem fala com a Plataforma Pública de Split Payment |
| **Documento fiscal (DF)** | Nota que origina débito e crédito e que vincula o pagamento à operação |
| **Confirmado / Pendente** | Estados de um crédito para o produto: débito do fornecedor extinto ou ainda não |
| **Canal contábil** | Escritórios de contabilidade que levam o produto à carteira de clientes |

---

## 10. Referências

| Tema | Arquivo |
|---|---|
| Visão de produto e negócio | [`produto/visao.md`](produto/visao.md) |
| Hipóteses a validar | [`produto/hipoteses.md`](produto/hipoteses.md) |
| Reforma tributária: o que sabemos | [`produto/reforma-tributaria.md`](produto/reforma-tributaria.md) |
| Manuais do Split Payment | [`referencias/split-payment/`](referencias/split-payment/README.md) |
| Design system e wireframes | [`design/`](design/README.md) |
| Kanban de demandas | [`demandas/README.md`](demandas/README.md) |
| Tasks do modelo antigo | [`tasks/README.md`](tasks/README.md) |
| Documentos da concepção | [`historico/`](historico/README.md) |

---

## 11. Changelog

| Data | Mudança |
|---|---|
| 2026-08-25 | Versão inicial. Removida a parceria Omie como canal |
| 2026-08-26 | Go-to-market definido: SaaS direto com canal contábil |
| 2026-11-23 | Reescrito na reorganização geral: estado real do projeto, API da Receita rebaixada a hipótese, stack do backend marcada como proposta, fluxo por demandas, nova estrutura de pastas |
