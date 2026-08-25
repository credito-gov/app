## O quê

<!-- 1-3 frases descrevendo o que este PR entrega. -->

## Por quê

<!-- Referência à task (número + link) e motivação de negócio.
Ex.: Fecha task [001](../docs/tasks/001-backend-setup.md) — cria o setup inicial do backend. -->

## Como testar

<!-- Passos manuais/automáticos para reproduzir e validar. -->

---

## Checklist obrigatório (marcar todos antes de solicitar review)

### Preparação
- [ ] Li a task correspondente em `docs/tasks/NNN-*.md` e o [`PROJECT_CONTEXT.md`](../docs/PROJECT_CONTEXT.md)
- [ ] Estou na branch correta (nome bate com a task)
- [ ] Branch sincronizada com `origin/main` (rodei `git fetch && git merge origin/main` sem conflitos pendentes)

### Entrega
- [ ] Todos os arquivos estão **commitados** (`git status` limpo, nada no working tree ou stage)
- [ ] Commits seguem [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`)
- [ ] Fiz **push** e este PR está apontando para `main`

### Documentação
- [ ] Criei o walkthrough em `docs/tasks/walkthrough/NNN-<slug>.md` seguindo o template
- [ ] O walkthrough **não** tem trechos `[a preencher]` — todas as seções foram completadas
- [ ] Atualizei `docs/tasks/README.md` marcando `3.Desenv ✅` na linha da task (dentro deste PR)

### Qualidade
- [ ] Lint passa sem erros nas pastas tocadas
- [ ] Testes automatizados passam (se houver na área tocada)
- [ ] Arquivos `.md` estão em UTF-8

<!--
Após criar o PR, aguarde o CI passar. Se falhar, corrija ANTES de solicitar review.
-->
