# Walkthrough — Task 009 (Landing Page: Prova Social)

> **Quem preenche:** executor da task, ao finalizar.
> **Quando:** obrigatório antes de abrir o PR.
> **Por quê:** dar ao revisor (e ao histórico do projeto) visão clara do que foi entregue, do que foi testado **de fato**, e do que ficou de fora intencionalmente.

---

## Objetivo da task

Implementar o componente `SocialProof` com o texto de contexto, a fileira de logos-placeholder e o grid de 3 cards de depoimento, fiel ao Figma (node `15:71`).

---

## O que foi entregue

### 1) Componente `SocialProof`

Arquivo: `app/landing-page/src/components/SocialProof.tsx`

- Texto discreto em maiúsculas ("USADO POR EMPRESAS QUE JÁ RECUPERARAM MILHÕES EM CRÉDITO")
- Fileira de 6 slots de logo (`border-dashed`, vazios)
- Grid de 3 cards de depoimento com `.map()` sobre array local — texto, avatar, nome, cargo
- Linha de aviso sobre os dados serem placeholders

### 2) Asset do avatar

Arquivo: `app/landing-page/src/assets/avatar-placeholder.png`

- Baixado da URL temporária do Figma MCP (mesma imagem reaproveitada nos 3 cards) e commitado no repositório

### 3) Integração em `App.tsx`

- `<SocialProof />` renderizado logo após `<Hero />`

### 4) Fix-forward: centralização + card da Hero mais rico

Durante a revisão visual desta task, o responsável do projeto identificou dois problemas que tocam componentes de tasks anteriores já mergeadas — resolvidos aqui, na mesma branch, por decisão explícita dele:

- **Centralização:** `Hero.tsx` e `SocialProof.tsx` não tinham o mesmo container `max-w-7xl mx-auto` que o `Header` (task 007) já usava — o conteúdo esticava além da largura do header em telas largas. Ambos os componentes foram ajustados para usar a mesma estrutura (`section` full-width com `div.mx-auto.max-w-7xl` por dentro).
- **Card do mockup na Hero (`app/landing-page/src/components/Hero.tsx`, `src/assets/hero-chart.svg`):** ganhou tratamento visual mais rico do que o node `15:36` do Figma tinha originalmente — label "Saldo de créditos", caixinhas coloridas (verde/âmbar) para Validados/Pendentes, gráfico com área em gradiente + marcador no último ponto, e legenda "Vence em 20/01" na Action Band.

---

## Decisões técnicas fora do prompt

### Decisão 1: fix-forward sobre a task 008 (Hero) já mergeada

- **Contexto:** ao revisar o PR #4 (desta task), o responsável do projeto comparou o resultado renderizado com uma referência visual e apontou que (a) o conteúdo de Hero/SocialProof não estava alinhado ao container centralizado do Header, e (b) o card do mockup da Hero estava "sem destaque" comparado ao que ele tinha em mente.
- **Alternativa escolhida:** perguntei explicitamente antes de agir (via pergunta estruturada) se a melhoria do card deveria ser feita direto no código ou primeiro no Figma. O responsável pediu as duas coisas: aplicar no código **e** sincronizar o Figma via MCP, para manter o Figma como fonte de verdade dali em diante. A correção de centralização foi confirmada para entrar nesta mesma branch/task, mesmo tocando o `Hero.tsx` da task 008 já mergeada.
- **Sinalizado antes da execução:** ✅ Sim — perguntado e confirmado antes de qualquer mudança de código ou Figma.
- **Impacto:** `Hero.tsx` (task 008, já mergeada) foi modificado por esta task. O node `15:36` no Figma também foi atualizado via `use_figma` (MCP), então o design agora reflete o mesmo resultado do código — nenhuma divergência nova entre Figma e implementação.

Divergências de **conteúdo** da Prova Social (texto do headline, fileira de logos, linha de aviso) já haviam sido identificadas e confirmadas na criação da task 009 — não são decisões novas desta execução.

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
  ✓ 21 modules transformed.
  dist/assets/index-*.css   12.79 kB
  ✓ built in 251ms
  ```
- **Conclusão:** ✅ passou

### Validação 3: Conteúdo e estrutura (desktop, 1280x1400)

- **Comando:** extração de texto da página via browser (`get_page_text`) + inspeção via `querySelectorAll`
- **Saída resumida:**
  ```json
  { "sectionCount": 2, "logoSlotCount": 6, "avatarCount": 3, "socialFlexDirection": "row" }
  ```
- Texto extraído confirma: headline em maiúsculas, os 3 depoimentos completos (texto, nome, cargo) na ordem correta, e a linha de aviso final
- **Conclusão:** ✅ passou

### Validação 4: Mobile (390x1600)

- **Comando:** mesmo servidor, viewport redimensionado, inspeção via `getComputedStyle`
- **Saída resumida:** `{"socialFlexDirection":"column"}` — cards de depoimento empilham
- **Conclusão:** ✅ passou

> **Nota:** screenshot visual via browser pane apresentou erro intermitente (`UnknownVizError`) neste ambiente; validação de layout foi feita via extração de texto/DOM e `getComputedStyle`, que confirmam estrutura e conteúdo corretos.

### Validação 5: centralização (fix-forward)

- **Comando:** `getBoundingClientRect().width` de Header/Hero/SocialProof em viewport 1400px
- **Saída resumida:** `{"containerWidths":[1280,1280,1280]}` — os três containers agora batem exatamente em `max-w-7xl` (1280px)
- **Conclusão:** ✅ passou

### Validação 6: card da Hero enriquecido

- **Comando:** inspeção de texto/DOM + `getComputedStyle` das caixinhas de stat
- **Saída resumida:** `"SALDO DE CRÉDITOS"` e `"Vence em 20/01"` presentes no texto da página; `getComputedStyle` das caixinhas Validados/Pendentes retornou `rgb(236, 253, 245)` (verde) e `rgb(255, 251, 235)` (âmbar)
- **Conclusão:** ✅ passou

### Validação 7: sincronização com o Figma (node 15:36)

- **Comando:** `use_figma` para aplicar o mesmo ajuste no node `15:49` ("Hero Right — Mockup"), seguido de `get_screenshot` do node
- **Saída resumida:** screenshot do Figma após a edição confirma label "SALDO DE CRÉDITOS", caixinhas coloridas, gráfico com gradiente + marcador no último ponto, e "Vence em 20/01" na Action Band — visualmente equivalente ao componente React
- **Observação de execução:** na primeira tentativa, o novo texto foi posicionado incorretamente (apareceu no fim do card) porque o frame `Mockup Content` usa auto-layout vertical — setar `x`/`y` manualmente não tem efeito nesse tipo de frame; a correção foi reordenar o nó via `insertChild(0, ...)` em vez de definir posição absoluta
- **Conclusão:** ✅ passou (após a correção de reordenação)

---

## Evidências visuais

- Texto completo extraído da página confirma ordem e conteúdo de todas as seções (Header → Hero → Prova Social).
- Estrutura DOM confirma 6 slots de logo, 3 avatares, layout `row`→`column` responsivo.
- Screenshots do Figma (antes/depois) confirmam a sincronização do node `15:36` com o resultado implementado em código.

---

## Pontos importantes para code review

- Slots de logo ficam propositalmente vazios (placeholder tracejado) — não é um bug, é o design.
- Os 3 depoimentos e o avatar são fixos/genéricos, com aviso explícito de que são placeholders — não substituir por conta própria sem pedido explícito.

---

## Fora de escopo mantido

- Dor vs Solução, Features, Preço, FAQ, Footer — tasks 010-014
- Logos reais de clientes

---

## Sugestões de commits (Conventional Commits)

1. `feat(landing): add Social Proof section`
2. `fix(landing): center Hero/SocialProof content and enrich Hero mockup card`
3. `docs(tasks): add walkthrough and mark task 009 as developed`

---

## Fechamento da entrega

### Branch

- `feat/009-landing-social-proof`

### Commits realizados

1. `77fb3fc` — `feat(landing): add Social Proof section`
2. `6c59b3b` — `fix(landing): center Hero/SocialProof content and enrich Hero mockup card`

> Conferido: `git log origin/main..HEAD` mostra apenas commits desta task (o segundo commit é um fix-forward pedido explicitamente durante a revisão desta mesma task, tocando um arquivo de task anterior já mergeada).

### Pull request aberta

- **URL:** https://github.com/credito-gov/app/pull/4
- **Título:** `feat(landing): Prova Social (depoimentos)`
- **Base:** `main`
- **Head:** `feat/009-landing-social-proof`
- **Link pro walkthrough no corpo do PR:** será atualizado no PR após este commit
