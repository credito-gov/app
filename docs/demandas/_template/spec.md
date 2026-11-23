# NNN-slug — Spec

## Critérios de aceite atendidos
Lista dos CA-N do `us.md` que esta spec cobre (e, se houver, os que não cobre).

## Abordagem
Solução técnica em poucos parágrafos. Respeitar as regras do projeto (arquivos de `regras` do `.claude/fluxo.json`).

## Mudanças por camada
### <Camada ou app> (`<pasta>`)
(Uma seção por camada ou app do projeto; remover as que não se aplicam.)

## Contratos
Endpoints, DTOs, modelos de dados, eventos. Cada item cita o CA que atende.

## Riscos e decisões
- …

## Implantação
O que quem for colocar no ar precisa saber: apps afetadas; migration (sim/não, quais); variáveis de ambiente novas ou alteradas (só os nomes); outros (cron, infra, DNS); passos antes e depois do deploy; como voltar. "Nenhuma ação além do deploy" quando for o caso.

## Estratégia de verificação
Testes, comandos e checagens manuais que provam cada CA.
