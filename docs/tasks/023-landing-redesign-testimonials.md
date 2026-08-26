# Task 023 — Landing Page Redesign: Depoimentos

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** 022 merged **em `feat/landing-redesign`**
> **Estimativa:** 3-4h
> **Branch:** `feat/023-landing-redesign-testimonials` (a partir de `feat/landing-redesign`)

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` e o `AGENTS.md`.
2. Confira que a task 022 está **merged em `feat/landing-redesign`**.
3. **⚠️ Fluxo de branch da série 015-027:** branch a partir de `feat/landing-redesign`, PR de volta para `feat/landing-redesign` — nunca para `main` (contexto completo na task 015).
   ```bash
   git checkout feat/landing-redesign
   git pull --ff-only origin feat/landing-redesign
   git checkout -b feat/023-landing-redesign-testimonials
   ```
4. Task **9 de 13**.

---

## Contexto

Os depoimentos, que na landing atual viviam dentro da Prova Social, agora são uma **seção própria** (Figma node `58:207`, "testimonials"), com estilo dark.

**Divergências vs. os depoimentos atuais:**
- Seção independente (task 018 já removeu os depoimentos da Prova Social)
- Cards agora dark (`#0e1524`), não brancos
- Citações reescritas
- **3ª pessoa mudou de profissão**: "Contadora — Escritório Contábil" virou "Diretora Tributária na Prado & Advogados" — mudança de personagem, não só de estilo

---

## Objetivo

Criar o componente `Testimonials` com cabeçalho + grid de 3 cards de depoimento, estilo dark.

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/landing-page/src/components/Testimonials.tsx` | Novo componente (extrai a lógica que antes vivia em `SocialProof.tsx`) |
| `app/landing-page/src/App.tsx` | Atualizado, posição após `Metrics` |
| `docs/tasks/walkthrough/023-landing-redesign-testimonials.md` | Obrigatório, depois do PR. |

---

## Fora de escopo (NÃO faça)

- ❌ Não reaproveitar o avatar placeholder antigo sem verificar se ainda serve — o Figma referencia um asset de avatar (`imgEllipse3`); se disponível, baixar; se a URL tiver expirado, reaproveitar `avatar-placeholder.png` (task 009) como fallback e documentar no walkthrough

---

## Detalhes técnicos — specs do Figma (node 58:207)

### Container

- `bg-[#060a13]` (herda fundo base), `px-[64px] py-[96px]`, `gap-[56px]`

### Cabeçalho

- Eyebrow: "Feedback Real" — estilo dark (`rgba(4,120,87,0.15)` bg)
- Título: "O que dizem os nossos clientes" — Inter Extra Bold, `36px`, branco, centralizado

### Grid de 3 cards (`gap-[24px]`, alturas iguais)

Cada card: `bg-[#0e1524]`, `border-[#1e293b]`, `rounded-[16px]`, `p-[32px]`, `gap-[24px]`

- Citação: Inter Regular, `15px`, `leading-[1.6]`, cor `#94a3b8`, entre aspas
- Avatar `32px` circular + nome (Bold `13px` branco) + cargo (Regular `11px`, cor `#64748b`)

| # | Citação | Nome | Cargo |
|---|---|---|---|
| 1 | "Reduzimos de 3 dias de trabalho manual em planilha para menos de 10 minutos por mês. O crédito que a gente perdia de vista agora aparece no painel." | Fernanda Costa | Controller na Embalagens Sul |
| 2 | "A antecipação de saldo validado nos deu a previsibilidade necessária para manter o fluxo operacional em um momento estratégico de expansão comercial." | Ricardo Nunes | CFO na Distribuidora Master |
| 3 | "Finalmente uma tecnologia que atende a complexidade do contábil e do executivo ao mesmo tempo. A integração com e-CNPJ foi concluída em instantes." | Juliana Prado | Diretora Tributária na Prado & Advogados |

### Animação

- 3 cards entram de **direções diferentes**: card 1 de `.reveal-left`, card 2 `.reveal-up` (ou fade simples, sem deslocamento horizontal), card 3 `.reveal-right`

---

## Passos sugeridos

1. Reabrir node `58:207` no Figma Desktop, confirmar specs
2. Criar `Testimonials.tsx` com `.map()` sobre array local — atenção às direções de entrada diferentes por índice
3. Remover a lógica de depoimentos de `SocialProof.tsx` se ainda não tiver sido removida na task 018
4. Inserir no `App.tsx` na posição correta
5. Testar, walkthrough depois do PR, kanban, sincronizar, abrir PR contra `feat/landing-redesign`

---

## Critérios de validação

- [ ] 3 depoimentos com texto, nome e cargo exatos da tabela (atenção à 3ª pessoa, que mudou de personagem)
- [ ] Cards com direções de entrada diferentes (esquerda/centro/direita)
- [ ] `npm run build` sem erros
- [ ] PR aberto contra `feat/landing-redesign`; kanban atualizado

---

## Referências

- [`docs/tasks/018-landing-redesign-social-proof.md`](018-landing-redesign-social-proof.md)
- [`docs/tasks/022-landing-redesign-metrics.md`](022-landing-redesign-metrics.md)
- Figma: node `58:207` ("testimonials")
