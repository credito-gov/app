# 032-design-system-produto — Avaliação do fluxo

- **Demanda:** 032-design-system-produto
- **PR:** [credito-gov/app#33](https://github.com/credito-gov/app/pull/33), mergeado em 2026-11-25 (088e32f)
- **Preenchido por / data:** sessão principal da demanda, 2026-11-25

Demanda só de documentação, com o design feito no Claude Design pela própria sessão (D-1). Spec e Tasks foram dispensadas; o Developer fez só o registro dos CA-21 e CA-22.

## Rodadas de correção

| Rodada | Veredito | Motivo da reprovação |
|---|---|---|
| 1 | reprovado | Imagens das telas ausentes (D-7); contraste de `line-control` errado no doc; item ativo da navegação divergente do CSS; regra do emitente contradita no texto de uso de `body-strong`; tamanho do valor do total; caminho do logo branco |
| 2 | reprovado | Briefing do CA-1 ausente; texto de uso de `brand` e `on-navy` ainda com o item ativo antigo; versão aprovada ambígua na US |
| 3 | aprovado | — |

**Total de rodadas:** 3
**Escalou ao usuário?** Sim, uma vez, na rodada 1: a D-7 pedia imagens das telas que a sessão não conseguia exportar. O responsável decidiu registrar só os links privados.

## Defeitos encontrados

| Defeito | Origem (Reviewer, plugin ou usuário) | Severidade | Arquivo | Corrigido? |
|---|---|---|---|---|
| Logo e marca quebrados no canvas (blobs de outro artifact) | Usuário | Alta | canvas | Sim |
| Paleta sem relação com o logo e a marca | Usuário | Alta | design system | Sim |
| Barra lateral com cara de sistema corporativo | Usuário | Média | telas | Sim (menu no topo) |
| Faltava login com provedor externo | Usuário | Média | telas | Sim |
| Imagens das telas fora do repositório (D-7) | Reviewer | Alta | `docs/design/README.md` | Sim, por decisão do responsável (só links) |
| Contraste de `line-control` como 3,4:1 | Reviewer | Alta | `docs/design/design-system.md` | Sim |
| Item ativo descrito com fundo navy | Reviewer | Média | `design-system.md`, `tokens.json` | Sim |
| `body-strong` como "nome do emitente" | Reviewer | Média | `design-system.md`, `tokens.json` | Sim |
| Tamanho de `cg-total-value` | Reviewer | Baixa | `design-system.md` | Sim |
| Caminho do `logo-lockup-white.png` | Reviewer | Baixa | `design-system.md` | Sim |
| Briefing do CA-1 ausente | Reviewer | Alta | `docs/design/briefing.md` | Sim |
| Texto de uso de `brand` e `on-navy` | Reviewer | Baixa | `tokens.json` | Sim |

## Defeitos que passaram

| Defeito | Onde apareceu | Quem deveria ter pego | Por que passou |
|---|---|---|---|
| Nenhum conhecido até o merge | — | — | — |

## Tokens por agente

| Agente | Modelo | Execuções | Tokens |
|---|---|---|---|
| `architect` | `opus` | US e aprovação, antes do design | Não registrado |
| `developer` | `sonnet` | 3 | ~115 mil |
| `reviewer` | `opus` | 3 | ~151 mil |
| `pr-review-toolkit:*` | — | 0 | Não acionado: só documentação |
| Sessão principal | `opus` | — | Não medido. Foi o maior gasto, porque operou o Claude Design |

## Intervenções manuais

| Intervenção | Motivo |
|---|---|
| A sessão principal operou o Claude Design (design system e canvas) | Decisão D-1 do responsável: o design é feito nesta sessão |
| A sessão principal corrigiu o texto de uso dos tokens e republicou o artifact (duas vezes) | Os tokens vêm do artifact; o Developer só copia |
| Spec e Tasks dispensadas | O responsável aprovou o visual e pediu o PR; a entrega é o registro dos CA-21 e CA-22 |
| Registro na US da aprovação visual e da D-7 alterada | Registro do fluxo, com as palavras do responsável |

## Bloqueios da guarda

| Agente | Comando ou caminho | Correto? | Observação |
|---|---|---|---|
| `developer` | Checagem automática de links no `PROJECT_CONTEXT.md` | Discutível | Conferiu à mão só os links novos |

## Falhas de subagente

| Agente | O que aconteceu | Resolvido com contexto limpo? |
|---|---|---|
| Nenhuma | — | — |

## Decisão
- **Manter:** o Reviewer julgando o registro contra a US; ele achou contradições reais entre o doc e os tokens.
- **Ajustar:** numa demanda de design, escrever e commitar o briefing **antes** de operar o Claude Design, e descrever o uso de cada token a partir do CSS final, não do rascunho. Quando o responsável mudar a navegação ou a paleta, revisar também o texto de uso dos tokens.
- **Modelos:** manter. O `sonnet` bastou para o registro; o `opus` no Reviewer pegou divergências finas.
- **Plugin:** não acionado. Sem código, o `pr-review-toolkit` não compensa.
