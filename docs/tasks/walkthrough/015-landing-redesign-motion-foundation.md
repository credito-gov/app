# Walkthrough — Task 015 (Redesign: Fundação de Motion + Design Tokens)

> **Quem preenche:** executor da task, ao finalizar.
> **Quando:** obrigatório antes de abrir o PR.
> **Por quê:** dar ao revisor (e ao histórico do projeto) visão clara do que foi entregue, do que foi testado **de fato**, e do que ficou de fora intencionalmente.

---

## Objetivo da task

Criar o hook `useScrollReveal` (IntersectionObserver) e as classes CSS de animação de entrada (fade/slide/scale, com variante "bounce"), documentar os design tokens do redesign, e atualizar a fonte Inter para incluir o peso Extra Bold (800).

---

## O que foi entregue

### 1) Hook `useScrollReveal`

Arquivo: `app/landing-page/src/hooks/useScrollReveal.ts`

- `IntersectionObserver` nativo, threshold configurável (default `0.15`)
- Desconecta o observer assim que o elemento é revelado uma vez (não continua observando)

### 2) Classes CSS de reveal

Arquivo: `app/landing-page/src/index.css`

- `.reveal`, `.reveal-up`, `.reveal-left`, `.reveal-right`, `.reveal-scale`, `.reveal-scale-bounce`
- Toda a regra fica dentro de `@media (prefers-reduced-motion: no-preference)` — usuários com a preferência de movimento reduzido nunca recebem `opacity: 0` inicial, então o conteúdo já nasce visível sem depender de JS

### 3) Fonte Inter — peso 800

Arquivo: `app/landing-page/index.html`

- Import do Google Fonts atualizado: `Inter:wght@400;500;600;700;800`

### 4) Nenhuma dependência nova

Conforme decisão do responsável do projeto: sem `framer-motion`, `gsap` ou `aos` — as animações do Figma (que usam `motion.div` só como especificação) são reimplementadas como scroll-trigger nativo.

---

## Decisões técnicas fora do prompt

Nenhuma. Implementação seguiu exatamente as specs do prompt da task 015.

---

## Validação executada

### Validação 1: `npm run lint`

- **Comando:** `npm run lint`
- **Saída resumida:** nenhuma saída (sem erros)
- **Conclusão:** ✅ passou

### Validação 2: `npm run build`

- **Comando:** `npm run build`
- **Saída resumida:**
  ```
  ✓ 31 modules transformed.
  dist/assets/index-*.css   14.43 kB
  ✓ built in 173ms
  ```
- **Conclusão:** ✅ passou

### Validação 3: comportamento real do scroll-reveal (browser)

- **Comando:** elemento de teste temporário (`<div ref={ref} className="reveal-up ...">`) adicionado à `App.tsx`, testado em `npm run dev` com JS real no browser
- **Saída resumida:**
  - Antes de entrar no viewport: `{"opacity":"0","transform":"matrix(1, 0, 0, 1, 0, 24)"}` (equivalente a `translateY(24px)`, oculto)
  - Depois de `scrollIntoView()` + o elemento realmente dentro da área visível: `{"opacity":"1","classList":"reveal-up ... is-visible"}`, `transform: none`
  - Um `IntersectionObserver` de depuração criado à parte confirmou `isIntersecting: false` quando o elemento estava fora da viewport e o comportamento correto assim que ficou dentro dela
- **Nota de execução:** durante a validação, o tamanho da aba do browser mudou entre chamadas (de ~1280x1000 para ~490x415), o que inicialmente pareceu um bug do hook — na real, era só o elemento ter saído da viewport menor. Confirmado que o hook funciona corretamente reajustando a posição de scroll para o viewport real a cada verificação.
- Elemento de teste **removido** da `App.tsx` antes do commit — não sobrou código de teste no repositório.
- **Conclusão:** ✅ passou

### Validação 4: `prefers-reduced-motion` — verificação estática

- Como as regras de `opacity: 0` / `transform` só existem dentro de `@media (prefers-reduced-motion: no-preference)`, um usuário com a preferência de movimento reduzido ativada nunca recebe esse CSS — o elemento permanece com os estilos padrão (`opacity: 1`, sem transform), independentemente do JS/classe aplicada. Verificado por leitura do CSS gerado (a regra não tem fallback fora do media query), não por emulação no browser (ferramenta de emulação de `prefers-reduced-motion` não disponível no ambiente desta sessão).
- **Conclusão:** ✅ passou (verificação estática; recomenda-se validação manual em um browser real com "reduzir movimento" ativado como parte do review desta PR)

---

## Evidências visuais

Não aplicável — esta task não altera nenhum componente visual existente (é só infraestrutura). A validação foi funcional (comportamento do hook), não visual.

---

## Pontos importantes para code review

- **Verificação manual recomendada:** ativar "Reduzir movimento" no sistema operacional/browser e confirmar visualmente que os componentes das próximas tasks (016+) não ficam com `opacity: 0` bugado — a ferramenta de emulação não estava disponível nesta sessão para confirmar automaticamente.
- Classe `.reveal-scale-bounce` usa `cubic-bezier(0.34, 1.56, 0.64, 1)` para o efeito elástico — vale conferir visualmente na task 022 (Métricas), que é onde esse efeito é mais usado.
- Nenhuma mudança em componentes existentes — build e lint continuam idênticos aos da série 006-014 fora dos arquivos tocados aqui.

---

## Fora de escopo mantido

- Nenhum componente de seção alterado — tasks 016-027
- Nenhuma lib de animação instalada

---

## Sugestões de commits (Conventional Commits)

1. `feat(landing): add scroll-reveal hook and dark-mode design tokens`
2. `docs(tasks): add walkthrough and mark task 015 as developed`

---

## Fechamento da entrega

### Branch

- `feat/015-landing-redesign-motion` (a partir de `feat/landing-redesign`)

### Commits realizados

1. `73b8dfb` — `feat(landing): add scroll-reveal hook and dark-mode design tokens`

> Conferido: `git log feat/landing-redesign..HEAD` mostra apenas o commit desta task (o PR é contra `feat/landing-redesign`, não `main` — ver nota de fluxo na task 015).

### Pull request aberta

- **URL:** https://github.com/credito-gov/app/pull/11
- **Título:** `feat(landing): fundação de motion + design tokens (redesign)`
- **Base:** `feat/landing-redesign` (não `main` — fluxo específico desta série, ver PR centralizadora [#10](https://github.com/credito-gov/app/pull/10))
- **Head:** `feat/015-landing-redesign-motion`
- **Link pro walkthrough no corpo do PR:** será atualizado no PR após este commit
