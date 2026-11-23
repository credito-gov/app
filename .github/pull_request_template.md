## O quê

<!-- 1-3 frases descrevendo o que este PR entrega. -->

## Por quê

<!-- Referência à demanda (número + link) e motivação.
Ex.: Demanda [028](../docs/demandas/028-slug/us.md). Liste os CA-N atendidos. -->

## Como testar

<!-- Passos manuais/automáticos para reproduzir e validar. -->

## Riscos

<!-- O que pode dar errado e o que ficou sem verificar. -->

---

## Checklist obrigatório (marcar todos antes de solicitar review)

### Preparação
- [ ] Li a demanda em `docs/demandas/NNN-slug/` e o [`PROJECT_CONTEXT.md`](../docs/PROJECT_CONTEXT.md)
- [ ] Estou na branch correta (`feat/`, `fix/` ou `docs/` + `NNN-slug`)
- [ ] Branch sincronizada com `origin/main` (rodei `git fetch && git merge origin/main` sem conflitos pendentes)

### Entrega
- [ ] Todos os arquivos estão **commitados** (`git status` limpo, nada no working tree ou stage)
- [ ] Commits seguem [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`)
- [ ] Fiz **push** e este PR está apontando para `main`

### Documentação
- [ ] O status no `us.md` (ou `bug.md`) e no kanban `docs/demandas/README.md` coincidem
- [ ] O handoff está em `docs/handoff/`
- [ ] Se mudou decisão ou regra, atualizei o `PROJECT_CONTEXT.md` e o changelog dele

### Qualidade
- [ ] Lint e build passam nas pastas tocadas
- [ ] Testes automatizados passam (se houver na área tocada)
- [ ] Arquivos `.md` estão em UTF-8

<!--
Após criar o PR, aguarde o CI passar. Se falhar, corrija ANTES de solicitar review.
-->
