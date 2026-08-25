# Task NNN — [Título imperativo curto]

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** [task XXX merged] | nenhum
> **Estimativa:** [X horas]
> **Branch:** `<tipo>/<descricao-curta>`

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` na íntegra — convenções, "não faça" e regras de Git estão lá, especialmente **§4.3 (Git)**, seção **"Sequência obrigatória por task"**.
2. Confira em `docs/tasks/README.md` que os pré-requisitos desta task estão **merged**.
3. **Crie a branch da task a partir de `main` atualizado, ANTES de começar a codificar:**
   ```bash
   git checkout main
   git pull --ff-only origin main
   git checkout -b <tipo>/<descricao-curta>
   ```
   Nunca trabalhe direto em `main` nem "por cima" de outra branch.
4. Se algo neste prompt parecer divergente do `PROJECT_CONTEXT.md`, **pare e pergunte** antes de codificar.

---

## Contexto

[1-2 parágrafos: por que esta task existe, em que ponto do projeto ela se encaixa, qual problema resolve.]

---

## Objetivo

[Frase única e clara do resultado esperado.]

---

## Entregáveis

[Lista de arquivos a serem criados/alterados, com paths exatos relativos à raiz do repo. Cada um com descrição curta do conteúdo esperado.]

| Arquivo | Conteúdo resumido |
|---|---|
| `path/to/file.ts` | ... |
| `docs/tasks/walkthrough/NNN-<slug>.md` | **Obrigatório.** Walkthrough da entrega. Use [`docs/tasks/walkthrough/_template.md`](walkthrough/_template.md) como base. |

> ⚠️ **Regra anti-ambiguidade:** se este prompt depende de uma estrutura ou convenção definida em `PROJECT_CONTEXT.md`, **repita a parte relevante aqui** com nível de detalhe suficiente para execução sem ter que cruzar dois arquivos. Em caso de divergência detectada, `PROJECT_CONTEXT.md` é a fonte canônica — pare e pergunte.

---

## Fora de escopo (NÃO faça)

- ❌ ...
- ❌ ...
- ❌ Se surgir a tentação de expandir além do descrito acima, pare e pergunte.

---

## Detalhes técnicos

[Snippets de código, schemas, interfaces, regras de negócio específicas desta task. Snippet ganha da prosa sempre que couber.]

---

## Passos sugeridos

1. ...
2. ...
3. ...
N-3. **Crie o walkthrough** em `docs/tasks/walkthrough/NNN-<slug>.md` usando o [template](walkthrough/_template.md). Cole evidências da validação que você de fato executou.
N-2. **Atualize o kanban**: edite `docs/tasks/README.md` e marque ✅ na coluna **3. Desenv** da linha da task NNN. Commite:
   ```
   chore(docs): mark task NNN as developed
   ```
N-1. **Sincronize com `origin/main` antes de dar merge no PR**:
   ```bash
   git fetch origin
   git merge origin/main
   ```
   Confirme que `git log origin/main..HEAD` mostra **apenas commits desta task**.
N. Abra PR. Descrição responde: **o quê**, **por quê**, **como testar**, **riscos**. Linke o walkthrough no corpo do PR.

---

## Critérios de validação

- [ ] ...
- [ ] ...
- [ ] Commits seguem Conventional Commits
- [ ] Lint/format passam sem erros
- [ ] Testes automatizados (se houver na área tocada) passam
- [ ] **`docs/tasks/walkthrough/NNN-<slug>.md` criado** com evidências reais de validação
- [ ] **`docs/tasks/README.md` atualizado com ✅ na coluna 3.Desenv da task NNN**
- [ ] **Branch sincronizada com `origin/main`** antes do merge
- [ ] PR criado descrevendo: o quê, por quê, como testar, riscos — link pro walkthrough no corpo
- [ ] PR contém **apenas commits da task NNN** (`git log origin/main..HEAD` para conferir)

---

## Referências

- [`docs/PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md)
- [outras referências relevantes]
