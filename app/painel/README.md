# Painel (primeira versão)

Painel local do crédito de CBS de uma empresa, montado a partir dos arquivos que a [`../apuracao-cbs`](../apuracao-cbs) baixa da Receita. Demanda [030](../../docs/demandas/030-painel-primeira-versao/).

Abre no navegador, em `http://127.0.0.1:5180/`, sem login. Só funciona na máquina de quem roda: escuta apenas em `127.0.0.1`.

## O que faz

- **Saldo** (`/`): quatro totais de crédito, no geral e por período de apuração, sempre separados: "A apropriar (pendente)" (`aApropriar`), "Apropriado" (`apropriado`), "Já utilizado" (`utilizado`) e "Saldo credor não utilizado" (`saldoCredor`). Cada um é a soma do campo como veio no arquivo; nenhum é calculado a partir dos outros. Mais, à parte, os totais de débitos das vendas (`apurado`, `extinto`, `saldoDevedor`).
- **Créditos** (`/creditos`): lista das notas com filtro por período, tipo de documento, emitente e "só com valor a apropriar", ordenação por emissão ou por valor a apropriar, busca por trecho da chave e paginação de 100 notas. Cada nota abre o detalhe com todos os campos oficiais e os recolhimentos ligados pela chave.
- **Pendências** (`/pendencias`): as notas com valor a apropriar, agrupadas por emitente, com a quantidade e o total de cada grupo.
- **Arquivos** (`/arquivos`): cada arquivo da pasta, aceito, aceito com divergência conhecida, recusado ou ignorado, com o motivo; a data de geração por serviço; as versões substituídas na consolidação.

Cada arquivo é validado contra o schema oficial 1.0.0 (cópia em `schemas/oficiais/`, sem alteração). Há uma única tolerância: o `ni` com 14 dígitos, que os arquivos reais trazem e o schema não aceita (exige 8). Esse arquivo é aceito e marcado como "aceito com divergência conhecida do schema 1.0.0". Qualquer outra divergência recusa o arquivo, e ele não entra em nenhum número.

## O que não faz

- **Não chama a API da Receita** e não pede, lê nem guarda credencial. Não lê `.env` nem variável de ambiente. Os arquivos chegam pela `apuracao-cbs`.
- **Não grava, move nem apaga nada** na pasta de arquivos: só lê.
- **Só CBS.** O IBS não está na fonte de dados.
- **Não calcula saldo líquido** entre crédito e débito.
- **Não diz o motivo da pendência.** A Receita informa o valor a apropriar de cada nota sem informar o motivo, e o painel não afirma que o emitente deixou de recolher.
- **Não mostra nome nem razão social do emitente**: só o número (CNPJ ou CPF) que vier do recolhimento ou da chave da nota. Documento 91 (NFS-e) e chave fora do leiaute conhecido ficam "emitente não identificado".
- **Não mistura empresas.** Se a pasta tiver arquivos de mais de uma raiz de CNPJ, o painel não mostra nenhum valor e lista os arquivos que divergem.
- A visão é só a dos arquivos lidos. A Receita não fornece histórico por esta API.

## Requisitos

Node 24 ou mais novo.

## Comandos

Em `app/painel`:

```bash
npm install
npm test                      # vitest; sem rede e sem .env
npm run lint
npm run build
npm run gerar-ficticios       # regenera os fictícios de volume (resultado idêntico)
npm start                     # sobe em http://127.0.0.1:5180/ com os fictícios
npm start -- --pasta <caminho> --porta <n>
```

Sem `--pasta`, o painel usa os fictícios de `dados/ficticios/`. Sem `--porta`, usa `5180`. O caminho pode ser absoluto ou relativo à pasta da aplicação. Recarregar a página mostra arquivos novos ou alterados na pasta, sem reiniciar.

## Dados fictícios

`dados/ficticios/` tem arquivos no formato oficial, com NIs e chaves inventados (dígitos verificadores de CNPJ e CPF propositalmente errados). Os pequenos são escritos à mão, um por caso; os de volume (cerca de 900 créditos e 2.800 débitos) saem do `npm run gerar-ficticios`, que é determinístico. Os casos de erro (outra empresa, arquivo inválido, JSON ilegível, nome fora do padrão, pagamentos) ficam em `test/fixtures/erros/`, fora da pasta padrão.

Como o `ni` dos fictícios tem 14 dígitos, como nos arquivos reais, a pasta padrão abre com o aviso de divergência conhecida.

## Apontar para os arquivos reais

Os arquivos reais nunca entram no repositório.

```bash
npm start -- --pasta <pasta com os arquivos de uma empresa>
```

- **Uma pasta por empresa.** Com arquivos de duas raízes de CNPJ na mesma pasta, o painel mostra só o erro.
- A `apuracao-cbs` guarda os arquivos baixados em `app/apuracao-cbs/.local/arquivos/` **do checkout ou do worktree onde o comando rodou**. Num worktree (`.claude/worktrees/NNN-slug`), essa pasta é apagada quando o worktree é removido. **Antes de remover o worktree**, copie os arquivos que quer manter para uma pasta durável **fora do repositório** (por exemplo, uma pasta por empresa nos seus documentos).
- Só os arquivos `*.json` no padrão de nome da `apuracao-cbs` (`AAAAMMDDTHHMMSSZ_<servico>_<tiquete>.json`) são lidos. Arquivos de **pagamentos** e arquivos com **nome fora do padrão** são ignorados e aparecem em `/arquivos` com o motivo.
- Não copie valores, chaves nem prints dos arquivos reais para o repositório, para PR ou para chat.

## Estrutura

```
src/nucleo/    leitura, validação, consolidação, emitente, totais (sem rede e sem HTTP)
src/paginas/   páginas HTML e a folha de estilo
src/rotas.ts   tratar(pedido) -> resposta, sem socket
src/servidor.ts, src/main.ts
schemas/oficiais/   cópia byte a byte dos schemas da apuracao-cbs
dados/ficticios/    arquivos fictícios versionados
scripts/            gerador dos fictícios de volume
test/               vitest
```

O código de leitura, validação, formatação de valores e as tabelas de código foram copiados da `apuracao-cbs` (cada arquivo indica a origem); um teste confere os schemas copiados contra o `versoes.json`.
