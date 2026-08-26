# Task 015 — Landing Page Redesign: Fundação de Motion + Design Tokens

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** 014 merged; branch de integração `feat/landing-redesign` criada
> **Estimativa:** 3-4h
> **Branch:** `feat/015-landing-redesign-motion` (a partir de `feat/landing-redesign`, **não** de `main`)

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` e o `AGENTS.md` — sequência obrigatória (branch → dev → PR → walkthrough → kanban) é inegociável.
2. Confira em `docs/tasks/README.md` que a task 014 está **merged**.
3. **⚠️ Fluxo de branch diferente do padrão do projeto para toda a série 015-027:** as tasks deste redesign **não** fazem PR direto para `main`. Existe uma branch de integração, `feat/landing-redesign`, com uma [PR centralizadora](../../.) aberta como rascunho contra `main`. Cada task branch a partir de `feat/landing-redesign` e abre PR **de volta para `feat/landing-redesign`** — nunca para `main`. Só quando as 13 tasks estiverem todas mergeadas ali é que a PR centralizadora sai do rascunho e vai para `main`. Isso é uma decisão explícita do responsável do projeto para esta série, documentada aqui e não uma mudança permanente do fluxo do `AGENTS.md`.
   ```bash
   git checkout feat/landing-redesign
   git pull --ff-only origin feat/landing-redesign
   git checkout -b feat/015-landing-redesign-motion
   ```
4. Esta é a task **1 de 13** de uma nova série: o **redesign completo** da landing page (dark mode, novas seções, animações de scroll), que **substitui** a landing atual (série 006-014, já em produção). As tasks 016-027 dependem desta.

---

## Contexto

O time de design entregou um redesign completo da landing (Figma, `CréditoGov — Design`, node `58:26`, frame "creditogov-landing-redesign"), decidido para **substituir** a landing atual: tema dark, 3 seções novas (Como Funciona, Dashboard Showcase, Métricas), copy reescrito quase por completo, e animações de entrada coreografadas por seção.

**Decisão confirmada com o responsável do projeto sobre as animações:** o design usa `motion.div` (Framer Motion) só como *ferramenta de especificação* no Figma — a intenção real é implementar como **animações disparadas por scroll** (estilo AOS/GSAP ScrollTrigger: o elemento anima quando entra na viewport), não como uma timeline de página que roda no load. **Não instalar Framer Motion nem nenhuma lib de animação** — implementar com `IntersectionObserver` nativo + CSS transitions, que cobre integralmente o vocabulário de efeitos do design (fade, slide, scale, "spring"/bounce).

Esta task constrói a base reaproveitada por todas as próximas 12 tasks: o hook de scroll-reveal e os tokens de cor/tipografia do redesign.

---

## Objetivo

Criar o hook `useScrollReveal` (IntersectionObserver) e as classes CSS de animação de entrada (fade/slide/scale, com variante "bounce"), documentar os design tokens do redesign (cores, tipografia, radius) para reuso nas tasks 016-027, e atualizar a fonte Inter para incluir o peso Extra Bold (800), usado extensivamente no redesign.

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/landing-page/src/hooks/useScrollReveal.ts` | Hook com `IntersectionObserver`, retorna `ref` + estado visível, desconecta após revelar (anima uma vez só) |
| `app/landing-page/src/index.css` | Classes utilitárias de reveal (`.reveal`, `.reveal-up`, `.reveal-left`, `.reveal-right`, `.reveal-scale`, `.reveal-scale-bounce`) + suporte a `prefers-reduced-motion` |
| `app/landing-page/index.html` | Import da fonte Inter atualizado para incluir peso 800 (Extra Bold) |
| `docs/tasks/walkthrough/015-landing-redesign-motion-foundation.md` | **Obrigatório.** Criado **depois** do PR aberto (AGENTS.md). |

> ⚠️ Esta task **não** altera nenhum componente visual existente (Header, Hero, etc.) — só cria a infraestrutura. As tasks 016-027 é que aplicam.

---

## Fora de escopo (NÃO faça)

- ❌ Não instalar `framer-motion`, `gsap`, `aos` ou qualquer lib de animação — é só CSS + IntersectionObserver nativo
- ❌ Não alterar nenhum componente de seção existente (isso é escopo das tasks 016+)
- ❌ Não remover a landing atual — ela continua no ar até as tasks de substituição serem mergeadas uma a uma
- ❌ Se surgir a tentação de expandir além do descrito acima, pare e pergunte

---

## Detalhes técnicos

### Hook `useScrollReveal`

```ts
import { useEffect, useRef, useState } from 'react'

export function useScrollReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}
```

Uso nos componentes (padrão a seguir nas tasks 016-027):

```tsx
const { ref, isVisible } = useScrollReveal<HTMLDivElement>()

<div ref={ref} className={`reveal-up ${isVisible ? 'is-visible' : ''}`} style={{ transitionDelay: `${index * 80}ms` }}>
```

### Classes CSS de reveal (`src/index.css`)

```css
@media (prefers-reduced-motion: no-preference) {
  .reveal, .reveal-up, .reveal-left, .reveal-right, .reveal-scale, .reveal-scale-bounce {
    opacity: 0;
    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  }
  .reveal-up { transform: translateY(24px); }
  .reveal-left { transform: translateX(-32px); }
  .reveal-right { transform: translateX(32px); }
  .reveal-scale { transform: scale(0.9); }
  .reveal-scale-bounce {
    transform: scale(0.5);
    transition: opacity 0.6s ease-out, transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .reveal.is-visible, .reveal-up.is-visible, .reveal-left.is-visible,
  .reveal-right.is-visible, .reveal-scale.is-visible, .reveal-scale-bounce.is-visible {
    opacity: 1;
    transform: none;
  }
}
```

`prefers-reduced-motion: reduce` (usuário fora do `@media` acima): elementos ficam sempre com `opacity: 1` e sem transform — sem essa media query, o CSS acima simplesmente não se aplica, então o conteúdo já nasce visível. **Requisito de acessibilidade, não é opcional.**

Mapeamento efeito do Figma → classe:
| Efeito descrito no design | Classe |
|---|---|
| Fade + slide de baixo | `.reveal-up` |
| Fade + slide da esquerda | `.reveal-left` |
| Fade + slide da direita | `.reveal-right` |
| Escala suave (85-90% → 100%) | `.reveal-scale` |
| Escala "bouncy"/elástica (50% → 100%, métricas) | `.reveal-scale-bounce` |
| Stagger entre itens de uma lista/grid | `transitionDelay` incremental (`index * 80-120ms`) via inline style |

### Fonte Inter — adicionar peso 800

```html
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
  rel="stylesheet"
/>
```

### Design tokens do redesign (referência para as tasks 016-027)

**Fundos:**
| Token | Valor | Uso |
|---|---|---|
| `bg-base` | `#060a13` | fundo padrão das seções escuras (Hero, CTA, etc.) |
| `bg-card-dark` | `#0e1524` | cards em fundo escuro (mockup, depoimentos, FAQ) |
| `bg-nav` | `rgba(6,10,19,0.8)` + `backdrop-blur(10px)` | nav fixa |
| `bg-footer` | `#040810` | footer (mais escuro que o resto) |
| `bg-light` | `#f8fafc` | seções claras (Como Funciona, Features, Preço) |
| `border-dark` | `#1e293b` | bordas em contexto escuro |
| `border-light` | `#e2e8f0` | bordas em contexto claro |

**Texto:**
| Token | Valor | Uso |
|---|---|---|
| `text-on-dark-primary` | `#ffffff` | títulos em fundo escuro |
| `text-on-dark-secondary` | `#94a3b8` | corpo de texto em fundo escuro |
| `text-on-dark-muted` | `#64748b` | labels/legendas em fundo escuro |
| `text-on-light-primary` | `#060a13` | títulos em fundo claro |
| `text-on-light-secondary` | `#64748b` | corpo de texto em fundo claro |

**Verde (marca):**
| Token | Valor | Uso |
|---|---|---|
| `green-base` | `#10b981` | CTAs, ícones, destaques |
| `green-panel` | `#047857` | fundo de faixas de ação (Action Pill) |
| `green-text-light-bg` | `#059669` | texto verde em fundo claro |
| `green-eyebrow-bg-dark` | `rgba(4,120,87,0.15)` / borda `rgba(4,120,87,0.5)` | badge eyebrow em fundo escuro |
| `green-eyebrow-bg-light` | `#ecfdf5` / borda `#a7f3d0` | badge eyebrow em fundo claro |

**Status (mockup/dashboard):**
| Token | Valor | Uso |
|---|---|---|
| `validated-bg` | `rgba(5,150,105,0.08)` / borda `rgba(5,150,105,0.2)` | card "Validado" |
| `pending-text` | `#fbbf24` | texto/dot "Pendente" |
| `pending-bg` | `rgba(217,119,6,0.08)` / borda `rgba(217,119,6,0.2)` | card "Pendente" |

**Tipografia:** Inter, pesos Regular(400)/Medium(500)/Semi Bold(600)/Bold(700)/**Extra Bold(800)** — headings agora usam Extra Bold (antes usavam Semi Bold).

**Border radius:** cards `16px` (era 8-10px), botões `8px` (era 6px), pills `999px` (igual).

---

## Passos sugeridos

1. Criar `app/landing-page/src/hooks/useScrollReveal.ts`
2. Adicionar as classes de reveal em `src/index.css`, com o guard de `prefers-reduced-motion`
3. Atualizar o link do Google Fonts em `index.html` para incluir peso 800
4. Testar manualmente: criar um elemento de teste temporário na `App.tsx` com a classe `reveal-up`, confirmar que anima ao rolar a página (remover o teste antes de commitar)
5. Criar o walkthrough em `docs/tasks/walkthrough/015-landing-redesign-motion-foundation.md` — **somente depois do PR aberto**
6. Atualizar `docs/tasks/README.md` — marcar ✅ na coluna 3.Desenv da task 015
7. Sincronizar com `origin/feat/landing-redesign` e abrir PR **contra `feat/landing-redesign`** (não `main`)

---

## Critérios de validação

- [ ] `useScrollReveal` desconecta o observer após revelar (não continua observando)
- [ ] Classes de reveal funcionam nos 5 efeitos (up/left/right/scale/scale-bounce)
- [ ] Com `prefers-reduced-motion: reduce` emulado no browser, os elementos aparecem imediatamente, sem transição
- [ ] Fonte Inter carrega peso 800 (`font-extrabold` no Tailwind resolve para 800, não 700)
- [ ] `npm run build` sem erros
- [ ] Lint/format sem erros
- [ ] **PR aberto contra `feat/landing-redesign` (não `main`), antes do walkthrough ser criado** (AGENTS.md)
- [ ] `docs/tasks/walkthrough/015-landing-redesign-motion-foundation.md` criado com evidências reais
- [ ] `docs/tasks/README.md` atualizado com ✅ na coluna 3.Desenv
- [ ] PR contém apenas commits da task 015

---

## Referências

- [`docs/PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md)
- [`AGENTS.md`](../../AGENTS.md)
- Figma: `CréditoGov — Design`, file `47CFOJpk4Lm8LipC1pynyx`, node `58:26` ("creditogov-landing-redesign")
