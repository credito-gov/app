# Task 022 — Landing Page Redesign: Métricas (nova seção)

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** 021 merged **em `feat/landing-redesign`**
> **Estimativa:** 2-3h
> **Branch:** `feat/022-landing-redesign-metrics` (a partir de `feat/landing-redesign`)

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` e o `AGENTS.md`.
2. Confira que a task 021 está **merged em `feat/landing-redesign`**.
3. **⚠️ Fluxo de branch da série 015-027:** branch a partir de `feat/landing-redesign`, PR de volta para `feat/landing-redesign` — nunca para `main` (contexto completo na task 015).
   ```bash
   git checkout feat/landing-redesign
   git pull --ff-only origin feat/landing-redesign
   git checkout -b feat/022-landing-redesign-metrics
   ```
4. Task **8 de 13**.

---

## Contexto

**Seção nova**: 3 métricas grandes em destaque (Figma node `58:194`, "metrics-impact"). É a seção com o efeito de animação mais chamativo do redesign ("bouncy"/elástico).

**⚠️ Atenção a números fictícios:** "R$ 4.2B em créditos identificados" e "1.840+ empresas parceiras" são números de exemplo do Figma, não métricas reais de negócio da CreditoGov (que ainda não tem clientes em produção). Reproduzir como está — não é papel desta task validar ou substituir esses números; se o time de negócio quiser trocar por dados reais, é uma decisão de conteúdo separada.

---

## Objetivo

Criar o componente `Metrics` com 3 blocos de estatística (número grande + título + descrição), com o fundo escuro gradiente e animação de escala elástica.

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/landing-page/src/components/Metrics.tsx` | Novo componente |
| `app/landing-page/src/App.tsx` | Atualizado, posição após `Features` |
| `docs/tasks/walkthrough/022-landing-redesign-metrics.md` | Obrigatório, depois do PR. |

---

## Fora de escopo (NÃO faça)

- ❌ Não tratar os números como dados reais — são placeholders de exemplo do design (ver nota acima)
- ❌ Não conectar a nenhuma fonte de dados dinâmica — valores são texto estático

---

## Detalhes técnicos — specs do Figma (node 58:194)

### Container

- Fundo: gradiente radial verde sutil sobre `rgb(10,15,29)` sólido — similar ao gradiente da Hero, pode reaproveitar a mesma técnica/CSS
- `border-y-[#1e293b]`, `px-[64px] py-[96px]`, `gap-[40px]`, 3 colunas (`flex-1` cada)

### 3 blocos de métrica

| Número | Título | Descrição |
|---|---|---|
| R$ 4.2B | Em créditos identificados | Auditados com precisão cirúrgica de acordo com a legislação do e-Social e IBS/CBS. |
| 1.840+ | Empresas parceiras | Desde startups de tecnologia aceleradas até indústrias tradicionais de embalagens. |
| 14 Dias | De teste totalmente grátis | Suba o seu certificado digital em segundos e confira se há crédito parado agora. |

- Número: Inter Extra Bold, `56px`, `tracking-[-1.12px]`, cor `#10b981`
- Título: Inter Semi Bold, `18px`, branco
- Descrição: Inter Regular, `14px`, `leading-[1.5]`, cor `#94a3b8`

### Animação — a mais chamativa da página

- Cada número: `.reveal-scale-bounce` (já criada na task 015, `cubic-bezier(0.34, 1.56, 0.64, 1)`, escala 50%→100%)
- Título + descrição de cada bloco: `.reveal-up`, entrando logo depois do número (delay curto)
- Stagger entre os 3 blocos: ~150ms

---

## Passos sugeridos

1. Reabrir node `58:194` no Figma Desktop, confirmar specs
2. Criar `Metrics.tsx` com `.map()` sobre array local dos 3 blocos
3. Inserir no `App.tsx` na posição correta
4. Aplicar `.reveal-scale-bounce` nos números — validar visualmente que o efeito elástico está perceptível (não sutil demais)
5. Testar, walkthrough depois do PR, kanban, sincronizar, abrir PR contra `feat/landing-redesign`

---

## Critérios de validação

- [ ] 3 métricas com números, títulos e descrições exatos
- [ ] Efeito de escala elástica (`bounce`) visível e não excessivamente exagerado
- [ ] `npm run build` sem erros
- [ ] PR aberto contra `feat/landing-redesign`; kanban atualizado

---

## Referências

- [`docs/tasks/021-landing-redesign-features.md`](021-landing-redesign-features.md)
- [`docs/tasks/015-landing-redesign-motion-foundation.md`](015-landing-redesign-motion-foundation.md) — classe `.reveal-scale-bounce`
- Figma: node `58:194` ("metrics-impact")
