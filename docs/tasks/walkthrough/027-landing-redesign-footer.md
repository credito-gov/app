# Walkthrough — Task 027 (Redesign: Footer)

> Última task da série de redesign (015–027) e última do modelo antigo de tasks.

---

## Objetivo da task

Reescrever o `Footer.tsx` no visual do redesign: fundo mais escuro, colunas Produto / Soluções / Suporte e nova barra inferior.

---

## O que foi entregue

### 1) `Footer.tsx`

- Fundo `#040810`, borda superior `#1e293b`, `px-[64px] pt-[64px] pb-[40px]` no desktop
- Coluna de marca: lockup branco (mesmo arquivo da task 014) e descrição em 13px, `#94a3b8`, largura máxima de 280px
- Três colunas, com 64px entre elas: **Produto** (Como funciona, Preço, Dashboard, Segurança), **Soluções** (Antecipação, Compensação, Previsões, e-CNPJ), **Suporte** (FAQ, Central de Ajuda, WhatsApp, Contato)
- Cabeçalhos em 11px, bold, branco, maiúsculas; links em 13px, `#94a3b8`
- Links legais (Termos, Privacidade, LGPD, Status) removidos, conforme a task
- Barra inferior: "© 2026 CreditoGov. Todos os direitos reservados." e "Auditoria tributária, todo santo dia.", 12px, `#64748b`
- Animação: `.reveal` (fade simples) no bloco de colunas e na barra inferior

### 2) Sincronização com a `main`

- Commit `1ebfebe` traz a reorganização da documentação (PR #23) para a série. O conflito em `docs/tasks/README.md` foi resolvido com a versão da `main`.

---

## Validação executada

### Validação 1: `npm run lint` / `npm run build`

- **Saída resumida:** ambos sem erros nem avisos
- **Conclusão:** ✅ passou

### Validação 2: conteúdo e estilo (dev server + inspeção do DOM)

- **Saída resumida:** fundo `rgb(4, 8, 16)`, borda `rgb(30, 41, 59)`; colunas `PRODUTO`, `SOLUÇÕES`, `SUPORTE` com os quatro links de cada uma; descrição e os dois textos da barra inferior idênticos à task; os dois blocos `.reveal` com opacidade 1 depois de rolar
- **Conclusão:** ✅ passou

### Validação 3: página inteira

- **Saída resumida:** as 13 seções renderizam na ordem esperada (Header → Hero → … → FAQ → CTA Final → Footer); sem erro no console; sem rolagem horizontal em desktop nem em largura de celular (375px)
- **Conclusão:** ✅ passou

### Não validado

- Comparação com o Figma (node `58:284`): sem acesso ao Figma nesta sessão. A implementação seguiu as medidas escritas na task.

---

## Pontos importantes para code review

- **Branch empilhada na 026.** O PR #22 ainda estava aberto, então esta branch saiu de `feat/026-landing-redesign-final-cta`. Ordem de merge: #22, depois #24.
- **Texto contra a regra do projeto.** A descrição do rodapé ("atualização diária via Receita Federal") e os itens "Antecipação", "Compensação" e "e-CNPJ" seguem o Figma, mas prometem o que o `PROJECT_CONTEXT.md` §5 e §6 tratam como hipótese. O mesmo vale para outras seções do redesign (métricas, depoimentos, selo "Integrado à Receita Federal"). Fica para a revisão de texto da landing, no backlog de `docs/demandas/README.md`, antes de divulgar o site.
- Os links do rodapé continuam sem destino (`<p>`), como na versão anterior.

---

## Fora de escopo mantido

- Lockup da marca: não alterado
- Conteúdo para os links legais removidos: não criado

---

## Passo final da série

Pendente, e é do responsável pelo projeto:

1. Merge do PR #22 (026) e do PR #24 (027) em `feat/landing-redesign`
2. Tirar o PR #10 (`feat/landing-redesign` → `main`) de rascunho, conferir lint e build com a branch completa e fazer o merge

Depois disso o modelo de tasks fica encerrado; trabalho novo entra como demanda.

---

## Fechamento da entrega

### Branch

- `feat/027-landing-redesign-footer` (a partir de `feat/026-landing-redesign-final-cta`)

### Commits realizados

1. `1ebfebe` — `chore(landing): sync redesign branch with main (docs reorganization)`
2. `fe4d6b5` — `feat(landing): redesign Footer with Produto/Soluções/Suporte columns`

### Pull request aberta

- **URL:** https://github.com/credito-gov/app/pull/24
- **Título:** `feat(landing): redesign Footer (colunas Produto/Soluções/Suporte)`
- **Base:** `feat/landing-redesign`
- **Head:** `feat/027-landing-redesign-footer`
