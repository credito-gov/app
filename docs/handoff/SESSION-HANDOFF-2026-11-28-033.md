# Handoff — 2026-11-28 — demanda 033-dashboard-indicadores

## O que foi entregue

Primeiro dashboard do usuário final e a carteira do contador (US, Spec e Tasks em `docs/demandas/033-dashboard-indicadores/`), branch `feat/033-dashboard-indicadores`. Tudo funciona só com dados fictícios até existir o coletor da 031.

- **Banco:** migração `0002_dados_fiscais` com `consulta`, `arquivo_bruto`, `credito_lido` e `debito_lido`, segurança por linha com `FORCE`, chaves estrangeiras compostas com a empresa e só `SELECT`/`INSERT` para o papel da aplicação. Valores em `numeric(20,2)`.
- **Leitura:** cópia revisada do leitor do painel (`app/backend/src/leitura/`). `registrarLeitura` grava todo retorno, inclusive o recusado, com o motivo; o múltiplo de 0,01 passou a ser conferido com `big.js` (o `multipleOf` do ajv recusava valores válidos). Retorno recusado gera log `warn` `leitura_recusada`, sem valores do arquivo.
- **Indicadores:** funções puras com `big.js` (consolidação D-5, emitente pela chave D-4, grupos por emitente, evolução por período, débitos, situação por serviço, carteira). Varredura proíbe `Number(`, `parseFloat` e `parseInt` nos módulos de cálculo.
- **API:** `GET /api/empresas/:id/painel`, `/pendencias`, `/pendencias/:grupo/notas` e `GET /api/carteira`.
- **Web:** Visão geral em `/e/:id` (substitui a página provisória da 034), Pendências, notas de um grupo (100 por página) e a Carteira em `/empresas` (substitui a lista da 034), com TanStack Query e página de erro amigável. Textos em `app/web/src/paineis/textos.ts`.
- **Dados locais:** gerador fictício determinístico e `npm run admin -- carregar-cenario`, só com `CREDITOGOV_AMBIENTE=local`, com nove cenários (um por estado da tela).

## Decisões do responsável

- **US (2026-11-25):** aprovada com as recomendações de P-1 a P-9. P-1 a P-4 seguem com o tributarista.
- **Spec (2026-11-27):** aprovada com as recomendações de P-S1 a P-S5. A carteira entrou nesta entrega (P-6). P-S3 (transcrição dos artboards da 032) ficou com valores provisórios: 5 emitentes no bloco, textos da Spec, evolução em tabela.
- **Tasks (2026-11-27):** aprovadas com P-T1 (papel abaixo do nome na linha da carteira).
- **Na revisão (2026-11-28):** o aviso de desatualizado, a data de última atualização, o selo da carteira e o texto "os números abaixo são da consulta de X" usam só a última consulta com retorno aceito (`ultimaAceitaEm`, `diasSemAtualizacao`).
- **Raízes fictícias (2026-11-28):** depois do limite de 3 rodadas, o responsável decidiu registrar como pendência as raízes da 033 fora da lista conferida (`PROJECT_CONTEXT.md` §6).

## Verificação

- **Testes:** backend 638 (40 arquivos, com `npm run banco:subir`), web 248 (16 arquivos). `lint` e `build` passam nas duas aplicações.
- **Testes primeiro:** cada parte tem o commit de teste, com a falha registrada, antes do de código. Exceção registrada pelo Reviewer: o `8cd931b` (carteira com `sem_dados_usaveis`) traz teste e código juntos.
- **Revisão:** três rodadas. Rodada 1: `fluxo:reviewer` aprovou; o `pr-review-toolkit` (code-reviewer, pr-test-analyzer, silent-failure-hunter) apontou defeitos reais menores, tratados na correção 1 com o ajuste da Spec. Rodada 2: aprovado, com achados menores, tratados na correção 2 junto com o merge da 035 (mapa de raízes). Rodada 3: reprovado só pela regra de raízes do §6, decidida pelo responsável como pendência; código aprovado pelo Reviewer e pelo code-reviewer.

## Pendências e riscos

- **Conferência no navegador:** não feita. O roteiro está em `app/web/README.md` ("Conferência no navegador: dashboard (demanda 033)") e os cenários em `app/backend/README.md`; comparar com os artboards "Dashboard", "Dashboard — estados dos dados" e "Carteira do contador".
- **Raízes fictícias não conferidas:** `31000001` a `31000009`, `16273849`, `48392017`, `72615839` e as do painel copiadas para o backend. Registrado no §6.
- **Textos provisórios (P-S3):** notas dos cartões, frases de situação e textos da carteira, escritos a partir da US e do design, até a transcrição dos artboards.
- **Sem coletor:** fora do ambiente local, toda empresa aparece como "ainda não consultada". "Em andamento" e "credencial recusada" só são demonstráveis com os cenários.
- **Volume:** cada requisição lê todas as notas da empresa, e a carteira faz isso por empresa, em sequência (DT-3, R-2 da Spec).
- **Lista de empresas da sessão:** pode ficar velha até o próximo `/api/sessao` depois de mudanças vistas pela carteira.
- **Achados menores não tratados:** o `#` faz dois papéis em `ocorrencias` do log (dígitos e separador da regra); a frase do estado vazio sem data não está na tabela de textos da Spec; alerta de falha aparece no topo e dentro do bloco; `PainelMarca` da 034 mostra CNPJs de exemplo com raízes de empresa de teste.
- **Banco de teste compartilhado:** rodar a suíte do backend ao mesmo tempo em duas sessões dá falhas intermitentes de banco. Não é defeito de código.
