# Walkthrough — Task NNN (título curto)

> **Quem preenche:** executor da task, ao finalizar.
> **Quando:** obrigatório antes de abrir o PR.
> **Por quê:** dar ao revisor (e ao histórico do projeto) visão clara do que foi entregue, do que foi testado **de fato**, e do que ficou de fora intencionalmente.

---

## Objetivo da task

[Em 2-4 linhas, o objetivo prático da task e o escopo esperado. Pode adaptar da seção "Objetivo" do prompt original.]

---

## O que foi entregue

### 1) [Entregável principal]

Arquivo: `path/do/arquivo`

- [ponto importante 1]
- [ponto importante 2]
- [ponto importante 3]

### 2) [Entregável complementar]

Arquivo: `path/do/arquivo`

- [ponto importante 1]
- [ponto importante 2]

### 3) [Documentação / kanban / etc]

Arquivos:

- `path/do/arquivo`
- `path/do/arquivo`

---

## Decisões técnicas fora do prompt

> Se este bloco estiver vazio, ótimo. Se tiver decisões, cada uma exige sinalização prévia ao Daniel — via mensagem, ANTES de executar.

### Decisão N: <título>
- **Contexto:** ...
- **Alternativa escolhida:** ...
- **Sinalizado antes da execução:** ❌ Não / ✅ Sim
- **Impacto:** ...

---

## Validação executada

> **Importante:** colar a evidência real (comando + saída resumida).
> Se a task envolve runtime, **não basta validar sintaxe** — precisa subir de fato e mostrar o resultado.

### Validação 1: [o que está sendo validado]

- **Comando:** `comando exato executado`
- **Diretório:** `pasta/onde/rodou`
- **Saída resumida:**
  ```
  cole aqui a parte relevante da saída
  ```
- **Conclusão:** ✅ passou / ⚠️ passou com observação / ❌ falhou

### Validação 2: [runtime / integração / etc]

- **Comando:** `...`
- **Saída resumida:** ...
- **Conclusão:** ...

_(Repita para cada validação executada.)_

---

## Evidências visuais (se aplicável)

Se a task altera layout/UI, inclua screenshots ou gravação de tela.

- **Desktop:**
- **Mobile:**

---

## Pontos importantes para code review

- [ponto de atenção funcional]
- [ponto de atenção técnico]
- [decisões de design relevantes ou divergências do prompt original — com justificativa]

---

## Fora de escopo mantido

- [item fora de escopo 1]
- [item fora de escopo 2]

---

## Sugestões de commits (Conventional Commits)

1. `tipo(escopo): mensagem`
2. `tipo(escopo): mensagem`
3. `chore(docs): mark task NNN as developed`

---

## Template curto de descrição de PR

### O que

[Resumo objetivo do que foi entregue]

### Por que

[Motivação da mudança / problema que resolve]

### Como testar

1. [passo 1]
2. [passo 2]
3. [resultado esperado]

### Riscos

[Risco baixo/médio/alto + justificativa]

---

## Fechamento da entrega (preencher após abrir o PR)

### Branch

- `nome-da-branch`

### Commits realizados

1. `hash` — `mensagem`
2. `hash` — `mensagem`

> Conferir antes do PR: `git log origin/main..HEAD` deve mostrar **apenas commits desta task**.

### Pull request aberta

- **URL:** [link da PR]
- **Título:** `título da PR`
- **Base:** `main`
- **Head:** `sua-branch`
- **Link pro walkthrough no corpo do PR:** sim / não
