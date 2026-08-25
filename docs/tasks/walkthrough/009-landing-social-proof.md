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

---

## Decisões técnicas fora do prompt

Nenhuma. Divergências de conteúdo (texto do headline, fileira de logos, linha de aviso) já haviam sido identificadas e confirmadas na criação da task 009 — não são decisões novas desta execução.

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

---

## Evidências visuais

- Texto completo extraído da página confirma ordem e conteúdo de todas as seções (Header → Hero → Prova Social).
- Estrutura DOM confirma 6 slots de logo, 3 avatares, layout `row`→`column` responsivo.

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
2. `docs(tasks): add walkthrough and mark task 009 as developed`

---

## Fechamento da entrega

### Branch

- `feat/009-landing-social-proof`

### Commits realizados

1. `77fb3fc` — `feat(landing): add Social Proof section`

> Conferido: `git log origin/main..HEAD` mostra apenas o commit desta task.

### Pull request aberta

- **URL:** https://github.com/credito-gov/app/pull/4
- **Título:** `feat(landing): Prova Social (depoimentos)`
- **Base:** `main`
- **Head:** `feat/009-landing-social-proof`
- **Link pro walkthrough no corpo do PR:** será atualizado no PR após este commit
