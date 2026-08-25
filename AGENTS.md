# Regras do agente neste repositório

Este arquivo é a fonte persistente de instruções do repositório para agentes de IA. Sempre siga estas regras ao trabalhar aqui.

## Sequência obrigatória por task

Para toda task de desenvolvimento, siga esta ordem sem atalhos:

1. Criar e trocar para o branch da task a partir de `main`.
2. Executar o desenvolvimento necessário da task.
3. Abrir a pull request da branch da task para `main`.
4. Criar o walkthrough da task em `docs/tasks/walkthrough/NNN-slug.md`.
5. Atualizar o kanban em `docs/tasks/README.md` apenas quando isso refletir o estado real da entrega.

## Regras de execução

- Não trate a tarefa como concluída antes de cumprir a sequência inteira.
- Não escreva walkthrough antes da PR existir.
- Não pule a etapa de PR para "adiantar" documentação ou status.
- Se o usuário pedir para "finalizar a sequência" ou algo equivalente, isso significa completar a ordem acima, não encurtá-la.
- Se houver conflito entre um pedido pontual e estas regras, avise antes de assumir qualquer atalho.

## Fonte canônica

- `docs/PROJECT_CONTEXT.md` é a fonte canônica de regras, convenções e decisões de arquitetura.
- Em caso de divergência entre um prompt de task e o `PROJECT_CONTEXT.md`, pare e pergunte.

## Rotina de auto-verificação e limpeza

Para garantir que o fluxo obrigatório não seja esquecido e evitar lixo no repositório:

1. **Antes de codificar:** Verbalize e anote os 5 passos do fluxo obrigatório no plano, comprometendo-se a segui-los.
2. **Antes de commitar (Sanity Check):** Rode `git status` e analise a lista de arquivos alterados/não rastreados.
3. **Limpeza OBRIGATÓRIA:** Delete ativamente qualquer arquivo temporário, logs, dumps ou artefatos que não foram solicitados pela task. Nenhum arquivo extra deve ser incluído nos commits.

## Persistência

- Estas instruções valem para esta sessão e para sessões futuras que carreguem este repositório.
- Se precisar alterar este fluxo, edite este arquivo de forma explícita.
