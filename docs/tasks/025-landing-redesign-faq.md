# Task 025 — Landing Page Redesign: FAQ

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** 024 merged **em `feat/landing-redesign`**
> **Estimativa:** 3-4h
> **Branch:** `feat/025-landing-redesign-faq` (a partir de `feat/landing-redesign`)

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` e o `AGENTS.md`.
2. Confira que a task 024 está **merged em `feat/landing-redesign`**.
3. **⚠️ Fluxo de branch da série 015-027:** branch a partir de `feat/landing-redesign`, PR de volta para `feat/landing-redesign` — nunca para `main` (contexto completo na task 015).
   ```bash
   git checkout feat/landing-redesign
   git pull --ff-only origin feat/landing-redesign
   git checkout -b feat/025-landing-redesign-faq
   ```
4. Task **11 de 13**.

---

## Contexto

O FAQ agora é uma **seção própria**, separada do CTA final (que era combinado antes, task 012). Figma node `58:259`, "faq". Perguntas parcialmente reescritas.

**Divergências vs. FAQ atual:**
- Seção independente (CTA final vira a task 026)
- Fundo escuro (herda o `#060a13` base)
- Cards dark (`#0e1524`)
- 2 das 4 perguntas são nitidamente diferentes (uma nova sobre antecipação de caixa, outra sobre duração do teste — a pergunta sobre "suporte no fechamento do mês" saiu)

---

## Objetivo

Criar/reescrever o componente `Faq` (extraído de `FaqAndFinalCta.tsx`) com o novo copy e estilo dark, sem o bloco de CTA final.

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/landing-page/src/components/Faq.tsx` | Novo componente (substitui a metade FAQ de `FaqAndFinalCta.tsx`) |
| `app/landing-page/src/App.tsx` | Atualizado |
| `docs/tasks/walkthrough/025-landing-redesign-faq.md` | Obrigatório, depois do PR. |

---

## Fora de escopo (NÃO faça)

- ❌ Não incluir o bloco de CTA final aqui — vira a task 026, seção própria
- ❌ Não implementar accordion — o Figma mostra tudo sempre expandido, como na versão anterior

---

## Detalhes técnicos — specs do Figma (node 58:259)

### Container

- `px-[64px] py-[96px]`, `gap-[56px]` (fundo herda o `#060a13` base — sem cor própria)

### Título

- "Perguntas Frequentes" — Inter Extra Bold, `36px`, branco (sem centralizar necessariamente — conferir no Figma se é `text-left` ou `text-center`; usar centralizado por consistência com as demais seções se não houver indicação contrária)

### Grid de FAQ (2 colunas, `gap-[32px]`, cada coluna `gap-[20px]`)

Cada card: `bg-[#0e1524]`, `border-[#1e293b]`, `rounded-[12px]`, `p-[28px]`, `gap-[12px]`

- Pergunta: Inter Bold, `16px`, branco
- Resposta: Inter Regular, `14px`, `leading-[1.5]`, cor `#94a3b8`

| Coluna | Pergunta | Resposta |
|---|---|---|
| Esquerda | Meus dados fiscais e contábeis estão seguros? | Sim. A integração é feita via procuração eletrônica específica do e-CAC. Não armazenamos senhas de segurança e todo o tráfego é criptografado. |
| Esquerda | Preciso mudar meu software ERP atual? | Não. O CreditoGov roda de forma complementar. Não há necessidade de alteração ou troca de fornecedores contábeis existentes. |
| Direita | Como funciona a antecipação de caixa? | Seus créditos homologados podem ser antecipados com fintechs parceiras a taxas de deságio extremamente competitivas diretamente no painel. |
| Direita | Qual a duração do período de teste gratuito? | Você usufrui de todas as vantagens da plataforma por 14 dias. Não solicitamos dados de pagamento para início do teste. |

### Animação

- Título + grid: `.reveal-up`

---

## Passos sugeridos

1. Reabrir node `58:259` no Figma Desktop, confirmar specs (inclusive alinhamento do título)
2. Criar `Faq.tsx`, extraindo a estrutura de `FaqAndFinalCta.tsx` (task 012) mas com o novo copy/estilo
3. Remover `FaqAndFinalCta.tsx` do `App.tsx` quando a task 026 (CTA Final) também estiver pronta — nesta task, pode-se manter temporariamente ambos se a ordem no `App.tsx` permitir, ou coordenar com a 026 (decisão do executor, documentar no walkthrough)
4. Testar, walkthrough depois do PR, kanban, sincronizar, abrir PR contra `feat/landing-redesign`

---

## Critérios de validação

- [ ] 4 perguntas com texto exato da tabela, em 2 colunas
- [ ] Cards dark, sem bloco de CTA final misturado
- [ ] `npm run build` sem erros
- [ ] PR aberto contra `feat/landing-redesign`; kanban atualizado

---

## Referências

- [`docs/tasks/024-landing-redesign-pricing.md`](024-landing-redesign-pricing.md)
- [`docs/tasks/012-landing-faq-cta.md`](012-landing-faq-cta.md) — versão anterior, combinada com CTA
- Figma: node `58:259` ("faq")
