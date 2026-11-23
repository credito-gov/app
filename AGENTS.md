# Regras para agentes neste repositório

Instruções permanentes para agentes de IA. O `CLAUDE.md` apenas importa este arquivo.

## Antes de qualquer coisa

1. Leia [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md). É a fonte canônica: estado real do projeto, decisões, regras e o que está em aberto.
2. Veja o kanban em [`docs/demandas/README.md`](docs/demandas/README.md) e o handoff mais recente em `docs/handoff/`.
3. Se o pedido divergir do `PROJECT_CONTEXT.md`, pare e pergunte.

`docs/historico/` e `docs/tasks/` são registro do passado. Não use como especificação.

## Fluxo de trabalho

Toda mudança passa por uma **demanda**, conduzida pelo plugin `fluxo`: siga `/fluxo:orquestrar`. A configuração está em [`.claude/fluxo.json`](.claude/fluxo.json).

Resumo do que o fluxo faz, para quem estiver sem o plugin:

| Etapa | Quem | Entrega | Aprovação |
|---|---|---|---|
| História | Arquiteto | `us.md` com critérios de aceite numerados (CA-N) | Usuário |
| Solução | Arquiteto | `spec.md` citando os CA que atende | Usuário |
| Passos | Arquiteto | `tasks.md`, com os testes antes da implementação | Usuário |
| Implementação | Developer | Testes que falham, depois o código, um commit por task | — |
| Revisão | Reviewer | Veredito contra os CA-N; no máximo 3 rodadas | — |
| Entrega | Sessão principal | Handoff, push e PR | Merge é do usuário |

Correção de bug usa um único `bug.md` no lugar de US, Spec e Tasks.

A sessão principal só coordena: não escreve código, testes, US, Spec nem Tasks. Subagentes não falam com o usuário; dúvida de requisito volta para ele.

## Regras do projeto para o fluxo

Estas regras prevalecem sobre o manual do plugin.

- **Sem etapa de publicação.** Não há nota de implantação, runbook, tag de versão nem GitHub Release. Não use `/fluxo:publicar` nem `/fluxo:nova-aplicacao`. O que a entrega exigir para ir ao ar vai na seção "Implantação" da Spec e na descrição do PR.
- **Numeração.** Demandas começam em `028`. De 001 a 027 são tasks do modelo antigo.
- **Worktrees** em `.claude/worktrees/NNN-slug`.
- **Uma demanda por vez**, salvo pedido explícito.
- **Testes primeiro.** Onde houver teste automatizado, ele nasce dos CA-N antes do código. A landing hoje não tem testes: a verificação é `npm run lint` e `npm run build` em `app/landing-page`, mais conferência visual no navegador. A primeira demanda de uma aplicação nova define o comando de teste dela e o registra aqui.
- **Domínio tributário.** O Arquiteto não escreve regra de CBS/IBS sem fonte. O que não estiver em `docs/referencias/` entra como pergunta em aberto, e a resposta é registrada em `docs/produto/hipoteses.md`.
- **Texto público.** Nada de promessa, número ou depoimento sem base (ver `PROJECT_CONTEXT.md` §6).
- **PR em português**, com: o quê, por quê, como testar e riscos.

## Exceção em andamento: redesign da landing

As tasks 026 e 027 terminam no modelo antigo, descrito em [`docs/tasks/README.md`](docs/tasks/README.md): branch a partir de `feat/landing-redesign`, PR de volta para ela, e a 027 promove o PR centralizador (#10) para `main`. Depois disso, o modelo antigo não recebe mais nada.

## Comandos

```bash
# landing
cd app/landing-page
npm install
npm run dev
npm run lint
npm run build
```

## Antes de commitar

- Rode `git status` e confira cada arquivo alterado ou novo.
- Apague arquivo temporário, log ou dump que não faz parte da entrega.
- Não commite `.env`, credenciais, `node_modules/` nem `dist/`.

## Em cada máquina

Para usar os subagentes: plugins `fluxo` e `pr-review-toolkit` instalados no Claude Code, e Node disponível. Agentes e hooks são lidos no início da sessão.
