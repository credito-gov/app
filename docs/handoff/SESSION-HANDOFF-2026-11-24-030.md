# Handoff — 2026-11-24 — demanda 030-painel-primeira-versao

## O que foi entregue

A primeira versão do painel: `app/painel`, uma aplicação web local (Node 24 ou mais novo, TypeScript) que lê os arquivos da API de apuração da CBS guardados numa pasta e mostra saldo, origem e pendências do crédito de uma empresa. Sem login, sem banco, sem chamada à Receita.

- **Telas:** saldo (com o quadro de débitos das vendas, à parte), lista de créditos, detalhe da nota, pendências por emitente e arquivos lidos.
- **Saldo:** quatro totais separados, com o nome oficial de cada campo (a apropriar, apropriado, já utilizado, saldo credor), no geral e por período. Nenhum é calculado a partir dos outros e nenhum rótulo usa "confirmado" ou "disponível".
- **Validação:** cada arquivo passa pelo schema oficial 1.0.0, sem alteração. A única divergência tolerada é o `ni` com 14 dígitos (o schema exige 8), e o arquivo fica marcado como "aceito com divergência conhecida".
- **Uma empresa por pasta:** a comparação é pela raiz do CNPJ; com arquivos de empresas diferentes, o painel não mostra valor nenhum.
- **Consolidação:** o mesmo crédito em vários arquivos conta uma vez; vale a `atualizacao` mais recente.
- **Emitente:** vem do recolhimento, quando existe, ou da chave de 44 posições (documentos 55, 57, 62 e 65), com conferência de formato, modelo e dígito verificador. O documento 91 fica "emitente não identificado".
- **Só na máquina:** escuta em `127.0.0.1`, confere o cabeçalho `Host`, aceita só `GET` e `HEAD`, não lê `.env`, não usa rede e não grava em disco. As páginas não têm JavaScript.
- **Fictícios:** `app/painel/dados/ficticios/`, com casos escritos à mão e o volume (cerca de 900 créditos e 2.800 débitos) gerado por `npm run gerar-ficticios`.
- **Documentação:** README da aplicação; `AGENTS.md`, `.claude/fluxo.json` e `PROJECT_CONTEXT.md` com a aplicação nova; referência nova `docs/referencias/documentos-fiscais/` com as fontes do leiaute da chave; referência da apuração e H1 com o que foi observado nos arquivos reais de 2026-11-24.

Comandos, em `app/painel`:

```bash
npm install
npm test
npm run lint
npm run build
npm start -- [--pasta <pasta>] [--porta <porta>]   # padrão: dados/ficticios e 5180
npm run gerar-ficticios
```

Especificação: [`us.md`](../demandas/030-painel-primeira-versao/us.md) (CA-1 a CA-23, CA-A1 a CA-A3, CA-D1 a CA-D3), [`spec.md`](../demandas/030-painel-primeira-versao/spec.md) e [`tasks.md`](../demandas/030-painel-primeira-versao/tasks.md) (tasks 1 a 32).

## Chamada real de 2026-11-24

Durante a etapa da US, o responsável fez uma chamada real com a credencial de outra empresa, e créditos e débitos vieram com dados (na chamada anterior tinham vindo vazios). A sessão extraiu só a forma dos arquivos (campos, tipos, contagens, sinais), com autorização dele; nenhum CNPJ, chave ou valor entrou em documento, código ou teste. Os achados estão na `us.md` (O-1 a O-25) e na referência da apuração. Os principais:

- o `ni` vem com 14 dígitos, e essa é a única divergência dos arquivos contra o schema;
- cerca de 99% dos créditos tinham valor a apropriar, e todo o apropriado observado já tinha sido utilizado;
- `apurado = apropriado + aApropriar` em todos os créditos; campo zerado vem ausente;
- recolhimentos respondeu HTTP 404 de novo, com outra credencial; pagamentos não foi tentado.

## Verificação

- `npm test` em `app/painel`: 21 arquivos, 425 testes passando, sem rede.
- `npm run lint` e `npm run build` sem erro; `npm run gerar-ficticios` não deixa diferença no git.
- `npm test` em `app/apuracao-cbs`: 377 testes passando; a aplicação não foi alterada, nem a landing.
- Conferência visual da sessão no navegador, com os fictícios: as cinco telas, a tela de pasta ilegível e a largura de 1440 px. Feita antes das rodadas de correção; os textos dos avisos mudaram depois e estão cobertos por teste, não por nova conferência visual.
- Nenhum `.env`, `.local/`, `dist/` ou `node_modules/` versionado.

Revisão: quatro revisões e três rodadas de correção (o limite). O Reviewer aprovou contra os CA-N nas quatro. As correções vieram da revisão complementar:

1. Rodada 1: arquivo com falha de leitura sumia dos totais e da tela de arquivos; falha passageira ficava no cache como recusa; erro 500 sem registro; estado vazio atribuído à Receita com arquivo recusado; aviso do cabeçalho sem distinguir recusa; filtro inválido descartado em silêncio; data que o painel não lê; `--porta 80`; a palavra "confirmado" no motivo do documento 91; testes fracos (dígito verificador, séries reservadas, varreduras).
2. Rodada 2: JSON aninhado demais derrubava todas as rotas (regressão da rodada 1); fictícios com data em 2027; teste tautológico; log do erro 500 sem limite.
3. Rodada 3: chave repetida no JSON derrubava todas as rotas; a correção isolou o erro por arquivo e pôs limite de 200 MB; fictícios sem emissão depois do mês do período.

Os comportamentos que mudaram na revisão, depois da aprovação da Spec pelo responsável, estão na seção "Ajustes da revisão (2026-11-24)" da Spec (ajustes 1 a 15).

## Pendências

- **Painel com os arquivos reais: não foi rodado.** A sessão não aponta o painel para dado real; fica para o responsável (`npm start -- --pasta <pasta>`).
- **Os arquivos reais estão em `app/apuracao-cbs/.local/arquivos/` do worktree desta demanda**, que é apagado depois do merge. Copiar antes para uma pasta fora do repositório, com uma empresa por pasta.
- **A `app/apuracao-cbs` recusa todo arquivo real** (validação estrita do `ni`) e não gera resumo. "Resumir mesmo inválido" continua como item próprio do backlog.
- **Sem fonte ou não testado**, registrado como hipótese em `docs/produto/hipoteses.md`:
  - identidade do crédito entre arquivos (só houve um arquivo por serviço);
  - origens diferentes de normal e sinal dos valores (não apareceram no real);
  - qual valor é o saldo utilizável (para tributarista);
  - a nota emitida pela própria empresa aparece em créditos e em débitos, sem compensar;
  - leiaute da chave de 50 posições (documento 91);
  - as posições do emitente na chave são derivadas da ordem e dos tamanhos dos manuais.
- **Primeira chamada real (da manhã):** a referência anota o arquivo como válido e, na mesma linha, `ni` com 14 dígitos. A incompatibilidade está registrada sem dizer qual anotação está errada; o responsável não confirmou.
- **Limites conhecidos, aceitos:**
  - com os schemas oficiais ausentes, cada arquivo sai recusado com "erro interno" e log, em vez de erro 500 (a mensagem do commit `39fd8cc` diz o contrário);
  - o corte do log supõe mensagem de erro de uma linha só;
  - data com ano de 0 a 99 seria ordenada como 1900 a 1999;
  - a validação pode recusar por engano valores acima de alguns bilhões (`multipleOfPrecision`, herdado da `apuracao-cbs`);
  - se a Receita devolver CNPJ com letras em `ni` ou `niFornecedor`, o arquivo é recusado;
  - as páginas respondem 200 também para pasta ilegível e conflito de empresas.
- **Fora desta demanda:** vários clientes, login, banco, hospedagem, IBS, pagamentos, saldo líquido, compensação, antecipação e CI.

## Onde retomar

1. Revisão e merge do PR pelo responsável.
2. Antes de remover o worktree `.claude/worktrees/030-painel-primeira-versao`: copiar `app/apuracao-cbs/.local/arquivos/` para fora do repositório.
3. Depois do merge: gravar o status `concluída` e o `flow-evaluation.md` da demanda.
4. Rodar o painel com os arquivos reais e conferir as hipóteses; a segunda consulta da mesma credencial permite testar a identidade do crédito entre arquivos.
