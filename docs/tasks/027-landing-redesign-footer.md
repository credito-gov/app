# Task 027 — Landing Page Redesign: Footer (última task da série)

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** 026 merged **em `feat/landing-redesign`**
> **Estimativa:** 3-4h
> **Branch:** `feat/027-landing-redesign-footer` (a partir de `feat/landing-redesign`)

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` e o `AGENTS.md`.
2. Confira que a task 026 está **merged em `feat/landing-redesign`**.
3. **⚠️ Fluxo de branch da série 015-027:** branch a partir de `feat/landing-redesign`, PR de volta para `feat/landing-redesign` (contexto completo na task 015).
   ```bash
   git checkout feat/landing-redesign
   git pull --ff-only origin feat/landing-redesign
   git checkout -b feat/027-landing-redesign-footer
   ```
4. **Última task da série (13 de 13).** Depois desta ser mergeada em `feat/landing-redesign`, a **PR centralizadora** (`feat/landing-redesign` → `main`) sai do modo rascunho e é revisada/mergeada — ver "Passo final" abaixo.

---

## Contexto

Reescreve o Footer (Figma node `58:284`, "footer"). Reorganiza as colunas de links e escurece ainda mais o fundo.

**Divergências vs. Footer atual (task 013):**
- Fundo `#040810` (era `#111827`) — mais escuro
- Colunas mudam de **Produto/Empresa/Legal** para **Produto/Soluções/Suporte**
- Links dentro de cada coluna mudam bastante — a coluna "Soluções" é inteiramente nova; **os links legais (Termos, Privacidade, LGPD, Status) desaparecem**
- Bottom bar: "Auditoria tributária, todo santo dia." (era "Crédito tributário, todo santo dia.")

---

## Objetivo

Reescrever `Footer.tsx` com as novas colunas e fundo mais escuro. Esta é a última peça do redesign — depois dela, promover a PR centralizadora.

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/landing-page/src/components/Footer.tsx` | Reescrito |
| `docs/tasks/walkthrough/027-landing-redesign-footer.md` | Obrigatório, depois do PR. |

---

## Fora de escopo (NÃO faça)

- ❌ Não inventar conteúdo para os links legais removidos — se o time jurídico/negócio precisar deles de volta, é uma decisão separada, não desta task
- ❌ Não mexer no lockup da marca (logo real, task 014) — só o fundo e as colunas de link mudam

---

## Detalhes técnicos — specs do Figma (node 58:284)

### Container

- `bg-[#040810]`, `border-t-[#1e293b]`, `px-[64px] pt-[64px] pb-[40px]`, `gap-[48px]`

### Coluna de marca

- Logo (reaproveitar o lockup branco da task 014, `logo-lockup-white.png`) + descrição: "Auditoria de crédito fiscal CBS/IBS com atualização diária via Receita Federal." (Regular `13px`, cor `#94a3b8`, largura `280px`)

### 3 colunas de links (`gap-[64px]` entre elas)

| Coluna | Links |
|---|---|
| **PRODUTO** | Como funciona · Preço · Dashboard · Segurança |
| **SOLUÇÕES** | Antecipação · Compensação · Previsões · e-CNPJ |
| **SUPORTE** | FAQ · Central de Ajuda · WhatsApp · Contato |

- Cabeçalho de cada coluna: Inter Bold, `11px`, branco, **uppercase**
- Links: Inter Regular, `13px`, cor `#94a3b8`

### Barra inferior

- `border-t-[#1e293b]`, `pt-[24px]`, `justify-between`, texto `12px` cor `#64748b`
- Esquerda: "© 2026 CreditoGov. Todos os direitos reservados."
- Direita: "Auditoria tributária, todo santo dia."

### Animação

- Colunas e barra inferior: fade simples (`.reveal`), sem deslocamento — é o efeito mais discreto da página, adequado ao footer

---

## Passos sugeridos

1. Reabrir node `58:284` no Figma Desktop, confirmar specs
2. Reescrever `Footer.tsx` com as novas colunas
3. Testar, criar o walkthrough desta task **depois do PR aberto**
4. Atualizar `docs/tasks/README.md` — marcar ✅ na coluna 3.Desenv da task 027
5. Sincronizar com `origin/feat/landing-redesign`, abrir PR **contra `feat/landing-redesign`**
6. Após o merge desta PR em `feat/landing-redesign`: **Passo final da série** — revisar a PR centralizadora (`feat/landing-redesign` → `main`), tirá-la do modo rascunho, rodar `npm run build`/`npm run lint` uma última vez com a branch completa, e só então mergeá-la em `main`. Este passo final não é "task 028" — é o fechamento natural desta task 027, documentar no walkthrough desta task o resultado desse merge final.

---

## Critérios de validação

- [ ] Fundo `#040810`, 3 colunas (Produto/Soluções/Suporte) com os links exatos, sem links legais
- [ ] Barra inferior com o texto atualizado
- [ ] `npm run build` sem erros
- [ ] PR aberto contra `feat/landing-redesign`; kanban atualizado
- [ ] **Passo final:** PR centralizadora (`feat/landing-redesign` → `main`) revisada e mergeada, fechando toda a série 015-027

---

## Referências

- [`docs/tasks/026-landing-redesign-final-cta.md`](026-landing-redesign-final-cta.md)
- [`docs/tasks/013-landing-footer.md`](013-landing-footer.md) — versão anterior
- Figma: node `58:284` ("footer")
