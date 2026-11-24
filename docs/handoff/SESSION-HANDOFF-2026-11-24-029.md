# Handoff — 2026-11-24 — demanda 029-poc-api-apuracao-cbs

## O que foi entregue

A primeira aplicação fora da landing: `app/apuracao-cbs`, uma prova de conceito de linha de comando (Node 24 ou mais novo, TypeScript) que lê as APIs de apuração da CBS da Receita Federal. Só leitura.

- **Quatro consultas**, uma por execução, escolhida no comando: créditos, recolhimentos, pagamentos e débitos.
- **Ciclo completo:** token (OAuth2 Client Credentials), abertura com `urlRetorno` vazio, consulta de situação, `urlAssinada`, download, arquivo bruto guardado, validação contra o schema oficial e resumo.
- **Retomada:** `--tiquete <t>` acompanha uma solicitação já aberta sem abrir outra. Toda falha depois que o tíquete é conhecido termina com o comando de retomada.
- **Token:** cache local, reaproveitado enquanto válido; o comando não pede um terceiro token na mesma hora nem pede token novo depois de um erro.
- **Arquivo bruto:** guardado antes da leitura em `app/apuracao-cbs/.local/arquivos/`, nunca sobrescrito; `npm run ler` relê sem chamar a API.
- **Registro de chamadas:** `.local/chamadas.jsonl`, com data, serviço, tipo, código HTTP e tíquete, sem token nem conteúdo.
- **Valores:** nenhum número passa por ponto flutuante; soma exata.
- **Configuração:** URL do token, URL base e forma de envio das credenciais vêm só do `.env`, sem valor fixo no código.
- **Schemas oficiais:** cópias sem alteração em `schemas/oficiais/`, com `versoes.json` (URL, versão, data de leitura, sha256).
- **Documentação:** README da aplicação com o roteiro da chamada real e da revogação da credencial; `AGENTS.md`, `.claude/fluxo.json` e `PROJECT_CONTEXT.md` com a aplicação nova; referência da apuração e H1 com o que já tem fonte pública (manual Receita Integra v1.4, Manual Plataforma da CBS de maio/2026, versões das páginas, divergências).

Comandos, em `app/apuracao-cbs`:

```bash
npm install
npm test
npm run lint
npm run build
npm run consulta -- <creditos|recolhimentos|pagamentos|debitos> [--tiquete <t>]
npm run ler -- .local/arquivos/<arquivo>.json
```

Especificação: [`us.md`](../demandas/029-poc-api-apuracao-cbs/us.md) (CA-1 a CA-25), [`spec.md`](../demandas/029-poc-api-apuracao-cbs/spec.md) e [`tasks.md`](../demandas/029-poc-api-apuracao-cbs/tasks.md) (tasks 1 a 35).

## Verificação

- `npm test`: 27 arquivos, 377 testes passando. A rede fica bloqueada nos testes e os dados são fictícios.
- `npm run lint` e `npm run build` sem erro.
- Nenhum `.env`, `.local/`, `dist/` ou `node_modules/` versionado.
- As cópias dos schemas foram baixadas de novo pelo Reviewer e o sha256 bate com o `versoes.json`.
- A `main` (com a demanda 028) foi trazida para a branch por merge; os testes, o lint e o build foram repetidos depois.

Revisão: quatro rodadas de revisão e três de correção. O Reviewer aprovou contra os CA-N em todas. As correções vieram da revisão complementar:

1. Rodada 1: tíquete perdido se o registro falhasse após a abertura; erros depois do tíquete sem o comando de retomada; tempo limite cortando a leitura do corpo e o download; arquivo bruto truncado com nome canônico; linha ilegível do registro derrubando o download; cache do token; mensagens com causa errada; testes de segredo e de erro fracos. Os testes novos acharam um vazamento do base64 de id e segredo na saída, corrigido.
2. Rodada 2: linha ilegível do registro bloqueava o token para sempre; arquivo bruto deixou de ser publicado de forma atômica; texto confundia contagem local com a da Receita.
3. Rodada 3: gravação do arquivo bruto falhava em volume sem hard link; sobra do arquivo temporário era dada como falha.

## Pendências

- **Chamada real (task 35, CA-19): não foi feita.** É manual, do responsável, com o `.env` gravado por ele, seguindo o roteiro do README da aplicação. Dela dependem as respostas a registrar na referência e na H1: se a URL v2 documentada responde para a credencial de produção restrita, forma de envio das credenciais no token, validade observada, tempo de processamento, limite real de chamadas, se situação e download contam, o que vem em `aApropriar`, frequência de `chaveDFE` vazia e a situação de cada divergência.
- **Sem fonte:** URL própria da produção restrita e forma de envio das credenciais no pedido de token. Ficam como configuração.
- **Desvio da Spec:** o download do arquivo usa tempo limite de 10 minutos; a Spec dizia 60 segundos para todas as chamadas. Nenhum teste cobre esse tempo limite.
- **Pagamentos por RAD:** o exemplo oficial não passa no schema 1.0.0 (vencimento só com data). A validação é estrita por decisão do responsável; se o arquivo real for recusado, o bruto fica guardado e o "resumir mesmo inválido" vira demanda própria.
- **Limites conhecidos, aceitos:**
  - a validação pode recusar por engano valores acima de alguns bilhões (`multipleOfPrecision`);
  - uma linha ilegível em `chamadas.jsonl` conta como chamada feita na data de modificação do arquivo; a mensagem diz qual linha corrigir;
  - em volume sem hard link, o arquivo bruto é publicado por cópia: se o processo morrer durante a cópia, pode ficar truncado com o nome final; e, numa falha da cópia com duas execuções simultâneas do mesmo tíquete no mesmo segundo, a remoção do destino pode atingir o arquivo da outra execução;
  - os testes não passam pela checagem de tipos (`tsconfig.json` inclui só `src/`).
- **Fora desta demanda:** acesso em nome de vários clientes, IBS, painel, banco de dados, hospedagem.

## Onde retomar

1. Chamada real com o responsável: ele grava o `.env` em `app/apuracao-cbs` (nunca em conversa), roda `npm run consulta -- creditos` e as demais consultas uma a uma, e revoga a credencial ao fim. Registrar as respostas em `docs/referencias/apuracao-cbs/README.md` e `docs/produto/hipoteses.md`.
2. Depois do merge: gravar o status `concluída` e o `flow-evaluation.md` da demanda, e remover o worktree `.claude/worktrees/029-poc-api-apuracao-cbs`.
