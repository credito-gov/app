# Walkthrough — Task 006 (Landing Page: Arquitetura)

> **Quem preenche:** executor da task, ao finalizar.
> **Quando:** obrigatório antes de abrir o PR.
> **Por quê:** dar ao revisor (e ao histórico do projeto) visão clara do que foi entregue, do que foi testado **de fato**, e do que ficou de fora intencionalmente.

---

## Objetivo da task

Escolher e documentar a stack técnica da landing page, e entregar o scaffold mínimo rodável (projeto vazio, build funcionando, Dockerfile funcionando) — pronto para as próximas 8 tasks implementarem as seções de conteúdo do design do Figma em cima dele.

---

## O que foi entregue

### 1) Scaffold Vite + React + TypeScript + Tailwind

Diretório: `app/landing-page/`

- Criado via `npm create vite@latest . -- --template react-ts`
- Tailwind CSS v4 instalado via `@tailwindcss/vite` (plugin no `vite.config.ts`) + `@import "tailwindcss"` em `src/index.css`
- `tailwind.config.ts` mínimo com `content` apontando para `index.html` e `src/**/*.{ts,tsx}`
- `App.tsx` reduzido a um placeholder simples (`<h1>CreditoGov</h1>` centralizado com classes Tailwind)
- Removidos artefatos padrão do template não utilizados: `App.css`, `src/assets/` (logos React/Vite), `public/icons.svg`
- `index.html`: `lang="pt-BR"`, `<title>CreditoGov</title>`

### 2) Dockerfile (build multi-stage)

Arquivos: `app/landing-page/Dockerfile`, `app/landing-page/.dockerignore`

- Stage 1 (`node:20-alpine`): `npm ci` + `npm run build`
- Stage 2 (`nginx:alpine`): serve `dist/` estático na porta 80
- `.dockerignore` exclui `node_modules`, `dist`, `.git`

### 3) Documentação da decisão

Arquivo: `app/landing-page/README.md`

- Documenta a stack escolhida e o porquê (reaproveitar convenção de `app/frontend`)
- Como rodar local (`npm run dev`/`build`/`lint`)
- Como buildar/rodar via Docker
- Como o deploy funciona no Render.com (Web Service a partir do Dockerfile, sem `render.yaml`)
- Seção "Decisões em aberto": domínio de produção e CI específico da landing

---

## Decisões técnicas fora do prompt

### Decisão 1: `node:20-alpine` em vez de `node:18-alpine` no Dockerfile

- **Contexto:** o prompt da task 006 sugeria `node:18-alpine` como imagem de build. Ao rodar `docker build`, o `npm run build` falhou dentro do container:
  ```
  SyntaxError: The requested module 'node:util' does not provide an export named 'styleText'
  ```
- **Causa:** o Vite 8 (versão instalada pelo `npm create vite@latest` no momento da execução) usa `rolldown` internamente, que depende de `node:util.styleText` — disponível só a partir do Node 20.12. `node:18-alpine` não tem esse export.
- **Alternativa escolhida:** trocar a imagem de build para `node:20-alpine`. O restante do Dockerfile (stage nginx) não precisou mudar.
- **Sinalizado antes da execução:** ❌ Não (foi um erro de build descoberto durante a validação, não uma decisão de design antecipável) — documentado aqui e no README de `app/landing-page` imediatamente ao ser identificado, antes de abrir o PR.
- **Impacto:** nenhum impacto funcional — apenas a versão da imagem base de build. Runtime final continua `nginx:alpine`, sem Node.

---

## Validação executada

### Validação 1: `npm run dev`

- **Comando:** `npm run dev`
- **Diretório:** `app/landing-page/`
- **Saída resumida:**
  ```
  VITE v8.2.2  ready in 731 ms
  ➜  Local:   http://localhost:5173/
  ```
- Acessado via browser headless: título da página = "CreditoGov", `<h1>` renderizado, `getComputedStyle` confirmou Tailwind aplicado (`font-weight: 700`, `font-size: 24px`, `display: flex` no container pai).
- **Conclusão:** ✅ passou

### Validação 2: `npm run build`

- **Comando:** `npm run build`
- **Diretório:** `app/landing-page/`
- **Saída resumida:**
  ```
  ✓ 16 modules transformed.
  dist/index.html                   0.46 kB
  dist/assets/index-*.css           6.87 kB
  dist/assets/index-*.js          190.51 kB
  ✓ built in 2.96s
  ```
- **Conclusão:** ✅ passou (sem erros de TypeScript, CSS do Tailwind presente no bundle)

### Validação 3: `npm run lint`

- **Comando:** `npm run lint`
- **Saída resumida:** nenhuma saída (sem erros/warnings do `oxlint`)
- **Conclusão:** ✅ passou

### Validação 4: Docker build + run

- **Comando:**
  ```
  docker build -t creditogov-landing .
  docker run -d -p 8080:80 creditogov-landing
  curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:8080
  ```
- **Diretório:** `app/landing-page/`
- **Saída resumida:**
  ```
  ✓ built in 1.13s   (build stage)
  HTTP 200
  <title>CreditoGov</title>
  ```
- **Conclusão:** ✅ passou (após a correção da imagem base para `node:20-alpine`, ver "Decisões técnicas fora do prompt")

---

## Evidências visuais

- **Desktop:** placeholder `CreditoGov` centralizado na tela, fonte bold — confirmado via inspeção de `getComputedStyle` no browser (sem screenshot renderizado devido a limitação do pane de preview no ambiente de execução; título e estilos computados confirmados via JS).

---

## Pontos importantes para code review

- O Dockerfile diverge do prompt original (`node:20-alpine` em vez de `node:18-alpine`) — ver "Decisões técnicas fora do prompt" acima. Recomendo manter `node:20-alpine` como piso mínimo daqui para frente, dado que é requisito do próprio Vite instalado.
- Nenhuma seção de conteúdo foi implementada, conforme escopo da task — apenas o placeholder `<h1>CreditoGov</h1>`.
- `tailwind.config.ts` é mínimo (só `content`); customizações de tema (cores, fontes) ficam para quando as tasks de conteúdo (007+) precisarem, evitando token duplicado antes de existir uso real.

---

## Fora de escopo mantido

- Nenhuma seção de conteúdo (Header, Hero, etc.) — tasks 007-013
- Nenhuma configuração de domínio/DNS no Render.com
- Nenhum formulário de captura de lead ou integração com `app/backend`
- Nenhum pipeline de CI específico para a landing (ci.yml existente não foi alterado)

---

## Sugestões de commits (Conventional Commits)

1. `feat(landing): scaffold Vite + React + TS + Tailwind, Dockerfile for Render.com`
2. `docs(tasks): add walkthrough and mark task 006 as developed`

---

## Fechamento da entrega

### Branch

- `feat/006-landing-page-arch`

### Commits realizados

1. `bf919ea` — `feat(landing): scaffold Vite + React + TS + Tailwind, Dockerfile for Render.com`

> Conferido: `git log origin/main..HEAD` mostra apenas o commit desta task.

### Pull request aberta

- **URL:** https://github.com/credito-gov/app/pull/1
- **Título:** `feat(landing): arquitetura e scaffold da Landing Page`
- **Base:** `main`
- **Head:** `feat/006-landing-page-arch`
- **Link pro walkthrough no corpo do PR:** será atualizado no PR após este commit
