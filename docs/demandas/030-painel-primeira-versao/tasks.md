# 030-painel-primeira-versao — Tasks

Pequenas, ordenadas, um commit por task. Cada task cita a seção da Spec, os CA que atende e como será verificada. A Spec aprovada (commit `faf565b`, com DT-1 a DT-10 e a decisão F-2) é a referência; onde esta lista e a Spec divergirem, vale a Spec e a divergência volta para a sessão principal.

**Testes primeiro:** para cada parte, a task de testes vem antes da task de código. Os testes nascem dos CA-N da `us.md` e **falham** quando são commitados (por falta do módulo ou do comportamento); o Developer registra a falha na mensagem do commit (quantos testes falham e por quê). A task seguinte implementa até passarem. Todo CA-N tem ao menos um teste ou uma verificação de documento (mapa no fim).

**Regras para o Developer em todas as tasks:**

- Trabalhar só em `app/painel/` e nos documentos citados nas tasks 26 a 31. **Nenhuma task altera `app/apuracao-cbs` nem `app/landing-page`**; da `apuracao-cbs` só se **lê** código, schemas e fixtures, para copiar (DT-2).
- **Nenhum dado real** (CNPJ, CPF, chave de nota, número de DARF, tíquete, valor) em código, teste, fictício, documento ou mensagem de commit. Tudo que o painel lê nos testes é fictício.
- **Não abrir `app/apuracao-cbs/.local/`** (nem listar o conteúdo), em nenhum checkout ou worktree. **Não rodar `npm run consulta`. Não criar `.env`. Não pedir nem receber credencial.**
- **Nenhum teste usa rede:** o `test/setup.ts` bloqueia `fetch`; o único socket é o do teste do servidor, em `127.0.0.1`, porta 0.
- Comandos rodados em `app/painel`, salvo indicação: `npm test`, `npm run lint`, `npm run build`. A partir da task 6, os três passam ao fim de cada task de implementação; numa task de testes, só os testes novos falham e o lint passa.
- Antes de cada commit: `git status`, conferir cada arquivo, nada de `node_modules/`, `dist/`, `.local/` ou `.env`.
- Mensagens de commit: `chore(painel): ...`, `test(painel): ...`, `feat(painel): ...`, `docs(030): ...`.

| # | Task | Spec | CA | Verificação | Status |
|---|---|---|---|---|---|
| 1 | Estrutura da aplicação, `.gitignore` com `.local/` e bloqueio de rede nos testes | Abordagem; Painel › Estrutura; Configuração e execução; Estratégia de verificação | CA-18, CA-19, CA-22 | `npm install`; `npm test` (1 teste passa); `npm run lint`; `git check-ignore` | ☐ |
| 2 | Testes de guarda por varredura do código (`src/`) | Servidor; Valores; Estratégia › CA-16, CA-19, CA-A3 | CA-16, CA-19, CA-A3 | passam vazios; falha provocada registrada | ☐ |
| 3 | Testes das cópias dos schemas (`sha256` = `versoes.json`; `versoes.json` igual ao da `apuracao-cbs`) | Contratos; DT-2 | CA-2 | falham (cópias não existem) | ☐ |
| 4 | Copiar os quatro schemas e o `versoes.json`, e `.gitattributes` | Painel › Estrutura; DT-2 | CA-2 | testes da task 3 passam | ☐ |
| 5 | Testes de `json.ts`, `dinheiro.ts`, `tabelas.ts` e `datas.ts` | Valores; Datas; F-2 | CA-1, CA-10, CA-13, CA-16 | falham | ☐ |
| 6 | Implementar `json.ts`, `dinheiro.ts`, `tabelas.ts` e `datas.ts` | Valores; Datas; F-2; DT-2 | idem 5 | testes da task 5 passam; lint e build | ☐ |
| 7 | Testes de `arquivos.ts` e `validacao.ts` | Arquivos e serviço; Validação com a tolerância do `ni`; DT-3 | CA-1, CA-2, CA-A2, CA-A3, CA-D1 | falham | ☐ |
| 8 | Implementar `arquivos.ts` e `validacao.ts` | idem 7 | idem 7 | testes da task 7 passam | ☐ |
| 9 | Testes de `empresa.ts` e `consolidacao.ts` | Empresa; Consolidação; DT-7 | CA-3, CA-4, CA-D1 | falham | ☐ |
| 10 | Implementar `empresa.ts` e `consolidacao.ts` | idem 9 | idem 9 | testes da task 9 passam | ☐ |
| 11 | Testes de `emitente.ts` | Emitente; Fontes do leiaute da chave; DT-6 | CA-12, CA-14 | falham | ☐ |
| 12 | Implementar `emitente.ts` | idem 11 | idem 11 | testes da task 11 passam | ☐ |
| 13 | Testes de `saldo.ts`, `pendencias.ts`, `debitos.ts` e da montagem da `Visao` | Valores; Pendências; Débitos; Datas e data dos dados; Contratos; DT-8, DT-9 | CA-5, CA-6, CA-7, CA-8, CA-13, CA-14, CA-D2 | falham | ☐ |
| 14 | Implementar `saldo.ts`, `pendencias.ts`, `debitos.ts` e a `Visao` | idem 13 | idem 13 | testes da task 13 passam | ☐ |
| 15 | Testes de `lista.ts` | Lista de créditos; DT-5 | CA-10, CA-13 | falham | ☐ |
| 16 | Implementar `lista.ts` | idem 15 | idem 15 | testes da task 15 passam | ☐ |
| 17 | Testes dos fictícios e das fixtures de erro | Fictícios | CA-17, CA-18, CA-D3 | falham (fictícios não existem) | ☐ |
| 18 | Fictícios escritos à mão (`dados/ficticios/`) e fixtures de erro (`test/fixtures/`) | Fictícios | CA-17, CA-D3 | testes da task 17 dos casos à mão passam; os de volume ainda falham | ☐ |
| 19 | Script `gerar-ficticios` e arquivos de volume gerados | Fictícios | CA-10, CA-17, CA-D3 | todos os testes da task 17 passam; gerar de novo não muda nada (`git status`) | ☐ |
| 20 | Testes das páginas e rotas, parte 1: layout, saldo, débitos, arquivos, conflito, vazio, erro, escape, estilo | Rotas; Valores; Débitos; Datas; Aparência; Empresa | CA-2, CA-3, CA-5, CA-6, CA-7, CA-9, CA-D2 | falham | ☐ |
| 21 | Implementar `rotas.ts`, `paginas/` (layout, saldo, arquivos, erro) e `estilo.css` | idem 20 | idem 20 | testes da task 20 passam | ☐ |
| 22 | Testes das páginas, parte 2: créditos, detalhe, pendências e varredura de texto de todas as rotas | Rotas; Lista; Emitente; Pendências; Valores | CA-8, CA-10, CA-11, CA-12, CA-13, CA-14, CA-15 | falham | ☐ |
| 23 | Implementar `paginas/` créditos, detalhe e pendências | idem 22 | idem 22 | testes da task 22 passam | ☐ |
| 24 | Testes de `servidor.ts` e `main.ts` (escuta, `Host`, métodos, cabeçalhos, pasta, recarga, só leitura, desempenho) | Configuração e execução; Servidor; DT-4, DT-10; Estratégia › CA-A1 a CA-A3, Desempenho | CA-19, CA-A1, CA-A2, CA-A3 | falham | ☐ |
| 25 | Implementar `servidor.ts`, `main.ts` e o script `start` | idem 24 | idem 24 | todos os testes passam; lint e build | ☐ |
| 26 | README da aplicação | README; Implantação | CA-18, CA-20 | revisão contra a Spec | ☐ |
| 27 | `AGENTS.md` (regra de testes e "Comandos") e `.claude/fluxo.json` (`apps`) | Documentação | CA-21 | revisão; JSON válido | ☐ |
| 28 | `docs/PROJECT_CONTEXT.md` (§2, §4, §7, §10, §11) | Documentação | CA-21 | revisão | ☐ |
| 29 | Referência nova `docs/referencias/documentos-fiscais/README.md` e índice `docs/README.md` | Fontes do leiaute da chave; Documentação | CA-12 | revisão contra a Spec | ☐ |
| 30 | Referência `docs/referencias/apuracao-cbs/README.md`: O-1 a O-25, divergência do `ni`, recolhimentos, tabelas de documento e origem | Documentação; F-2 | CA-23 | revisão contra a US e a Spec | ☐ |
| 31 | `docs/produto/hipoteses.md`, H1: o que os arquivos reais mostraram e as hipóteses D-2 a D-6 e DT-7 | Documentação | CA-23 | revisão | ☐ |
| 32 | Verificação de fechamento | Estratégia de verificação | CA-22 | comandos abaixo; sem commit, salvo correção | ☐ |

Fora da lista de tasks de código: **verificação manual no navegador, da sessão principal** (seção "Verificação manual", no fim).

## Detalhe das tasks

### 1. Estrutura da aplicação

Criar `app/painel/` com:

- `package.json`: `"name": "painel"`, `"private": true`, `"type": "module"`, `"engines": { "node": ">=24" }`; scripts `build` (`tsc -p tsconfig.json`), `lint` (`oxlint`), `test` (`vitest run`). Os scripts `gerar-ficticios` e `start` entram nas tasks 19 e 25. Dependências as mesmas da `apuracao-cbs` (DT-1): `ajv`, `ajv-formats`, `big.js`, `lossless-json`; de desenvolvimento, `typescript`, `@types/node` (24), `@types/big.js`, `vitest`, `oxlint`, nas versões da `apuracao-cbs`. Nenhuma outra (sem framework de interface, sem Vite, sem Tailwind).
- `package-lock.json` gerado pelo `npm install`.
- `tsconfig.json`, `vitest.config.ts` (com `setupFiles: ["test/setup.ts"]`) e `.oxlintrc.json` no modelo da `apuracao-cbs`. Os fictícios gerados e o script ficam fora do `include` do build da aplicação se isso for preciso para `dist/` conter só `src/`; o script roda pelo mesmo caminho que o Developer escolher na task 19, documentado no README.
- `.gitignore` com a linha `.local/`. **Nota sobre a Spec:** a estratégia do CA-18 fala em "`.gitignore` da raiz", mas a raiz não ignora `.local/`; quem ignora a pasta da `apuracao-cbs` é o `.gitignore` dela. O painel segue o mesmo modelo, com o seu próprio `.gitignore`. A raiz não é alterada.
- `test/setup.ts`: troca `globalThis.fetch` por uma função que lança "rede bloqueada nos testes".
- `test/rede.test.ts`: confere que o `fetch` global é o bloqueador.

Verificação:

```bash
cd app/painel
npm install
npm test        # 1 teste, passa
npm run lint
cd ../..
git check-ignore -v app/painel/.local/x.json   # aponta app/painel/.gitignore, regra .local/
git status                                     # sem node_modules/ nem dist/
```

### 2. Testes de guarda por varredura do código

`test/varredura.test.ts`, lendo todos os `.ts` de `src/` (recursivo):

- **CA-19:** nenhuma ocorrência de `process.env`, `fetch(`, `node:https`, `node:net`, `node:tls`, `node:dgram`, `.env`, `receitafederal.gov.br`, `apuracao-cbs/.local`. `node:http` só em `src/servidor.ts`.
- **CA-A3:** nenhuma ocorrência de `writeFile`, `appendFile`, `rename`, `unlink`, `rm(`, `rmdir`, `mkdir`, `copyFile`, `createWriteStream` em `src/`.
- **CA-16:** nenhuma ocorrência de `parseFloat` nem `Number(` em `src/nucleo/`; `toFixed` só sobre `Big` (o teste aceita `toFixed` apenas em `src/nucleo/dinheiro.ts`).

Enquanto `src/` estiver vazio, os testes passam sem conferir nada. Por isso: (a) o teste também exige que `src/` tenha ao menos um `.ts` a partir da task 6 (`it.skipIf` até existir `src/nucleo/dinheiro.ts` é aceitável, ou o Developer registra a decisão no commit); (b) **antes de commitar**, o Developer prova que cada varredura pega o erro com um arquivo temporário em `src/` contendo a linha proibida, vê o teste falhar, apaga o arquivo e registra isso no commit. O arquivo temporário não é commitado.

### 3. Testes das cópias dos schemas

`test/schemas.test.ts`:

- `schemas/oficiais/versoes.json` com exatamente as quatro entradas (`credito-retorno`, `recolhimento-retorno`, `pagamento-retorno`, `debito-retorno`), e o `sha256` dos bytes de cada arquivo (sem normalizar fim de linha) igual ao registrado;
- o `versoes.json` do painel é idêntico, byte a byte, ao de `../apuracao-cbs/schemas/oficiais/versoes.json` (só leitura do arquivo vizinho, DT-2).

Falham: as cópias ainda não existem.

### 4. Cópias dos schemas

Copiar **byte a byte** (cópia de arquivo, sem abrir em editor) de `app/apuracao-cbs/schemas/oficiais/` para `app/painel/schemas/oficiais/` os quatro `*.schema.json` e o `versoes.json`. Criar `app/painel/.gitattributes` com `schemas/oficiais/*.json -text`, como na `apuracao-cbs`. Não baixar de novo da Receita nem editar nada (CA-2: "as cópias dos schemas oficiais não são alteradas").

Verificação: testes da task 3 passam; `git diff --stat` mostra só os cinco arquivos e o `.gitattributes`.

### 5. Testes de `json.ts`, `dinheiro.ts`, `tabelas.ts` e `datas.ts`

Testes em `test/json.test.ts`, `test/dinheiro.test.ts`, `test/tabelas.test.ts`, `test/datas.test.ts`, nascidos dos CA:

- **CA-1, CA-16 (json):** leitura sem perda de `1`, `1.5`, `1.50`, `0.1`; BOM inicial aceito; JSON ilegível lança erro identificável.
- **CA-16 (dinheiro):** soma exata de `0.1 + 0.2` = `0.30`; soma de muitos itens igual ao esperado ao centavo; ausente vale zero (DT-8); formatação `R$ 0,00`, `R$ 1,50`, `R$ 1.234,56`, `R$ 1.234.567,89`, negativo `-R$ 1.234,56`; percentual com uma casa, meio para cima, e "—" com total zero (CA-14).
- **F-2 (tabelas):** nome oficial como está, com o código (`55` → `NF-e`, `20` → `DEVOLUCAO_POR_PCONT`); código fora da tabela → "código <n> (sem nome na tabela)".
- **CA-5, CA-1 (datas):** exibição `dd/mm/aaaa hh:mm` com o fuso do arquivo ao lado, a partir do texto, sem objeto `Date`; aceita 0, 3 e 6 casas de fração e fuso `-03:00`; comparação de dois instantes com fusos e frações diferentes (para a D-5); data inválida identificada.

Falham: os módulos não existem.

### 6. Implementar `json.ts`, `dinheiro.ts`, `tabelas.ts` e `datas.ts`

Em `src/nucleo/`. `json.ts`, `dinheiro.ts` e `tabelas.ts` copiados da `apuracao-cbs` com cabeçalho indicando a origem (arquivo e commit), e estendidos só no que a Spec pede (formatação de negativo, percentual, texto de código sem nome). `datas.ts` novo. Verificação: testes da task 5 e da task 2 passam; lint e build.

### 7. Testes de `arquivos.ts` e `validacao.ts`

Fixtures pequenas em `test/fixtures/` (fictícias, montadas para cada caso), mais **cópias das fixtures da `apuracao-cbs`** (`app/apuracao-cbs/test/fixtures/`, só leitura) em `test/fixtures/apuracao-cbs/`, com conteúdo inalterado e nome ajustado ao padrão se preciso.

- **Arquivos (CA-1, CA-A2, DT-3):** só `*.json` da pasta, sem subpastas; serviço pelo nome `AAAAMMDDTHHMMSSZ_<servico>_<tiquete>[_<n>].json`; `pagamentos` → "ignorado: serviço não usado pelo painel"; nome fora do padrão → "ignorado: nome fora do padrão da apuracao-cbs"; pasta inexistente → situação de pasta ilegível com o caminho, sem criar a pasta; cache: segunda leitura sem mudança não relê nenhum arquivo (contagem de leituras por uma função de leitura injetada); arquivo novo e arquivo alterado (tamanho ou data de modificação) são lidos.
- **Validação (CA-1, CA-2, CA-D1, D-2):** arquivos de créditos, recolhimentos e débitos válidos aceitos; `ni` de 14 dígitos → "aceito com divergência conhecida do schema 1.0.0" com o texto "`ni` com 14 dígitos (o schema exige 8)"; `ni` de 13 dígitos, `ni` com letra, `ni` de 14 mais outro erro, número com três casas, número em notação exponencial, `niConsumidor` inválido → recusados com motivo (até 20 divergências); campos zerados ausentes, números com 0 a 2 casas e datas com 0 a 6 casas de fração aceitos (O-9, O-13, O-15).

Falham.

### 8. Implementar `arquivos.ts` e `validacao.ts`

`validacao.ts` com a lógica copiada da `validacao.ts` da `apuracao-cbs` (cabeçalho com a origem) e o filtro de erros da D-2 exatamente como na Spec (`instancePath` `/ni`, regra `pattern`, valor `^\d{14}$`). `arquivos.ts` só usa `readdir`, `stat` e `readFile`. Verificação: testes das tasks 2, 3, 5 e 7 passam.

### 9. Testes de `empresa.ts` e `consolidacao.ts`

- **CA-3:** raiz de `ni` com 8 e com 14 dígitos coincide; dois arquivos de estabelecimentos da mesma raiz não geram conflito (O-24); duas raízes → conflito, com a lista dos arquivos e a raiz de cada um; arquivo recusado não entra na comparação.
- **CA-4, CA-D1, D-5:** mesmo crédito (`pa`, `chave`, `documento`, `origem`) em dois arquivos: vence `atualizacao` mais recente (inclusive com frações e fusos diferentes); empate → `geradoEm` mais recente; empate → nome maior; mesmo arquivo em duas cópias com nomes diferentes não muda nenhum total; idem débitos; contagem de versões substituídas por serviço.
- **DT-7:** item de recolhimento (`numeroDARF`, `sequencial`) repetido: vence o do arquivo com `geradoEm` mais recente; arquivo de recolhimentos lido duas vezes não duplica itens.

Falham.

### 10. Implementar `empresa.ts` e `consolidacao.ts`

Verificação: testes da task 9 passam.

### 11. Testes de `emitente.ts`

Um teste por linha da seção "Emitente" da Spec, com chaves fictícias montadas no teste (UF `99`):

- recolhimento com `chaveDFE` igual à `chave` → `niFornecedor`, rótulo "CNPJ do fornecedor, informado no recolhimento"; recolhimentos com `niFornecedor` diferentes → "não identificado (recolhimentos divergentes)"; recolhimento × chave divergentes → vale o recolhimento e os dois ficam disponíveis para o detalhe (DT-6);
- chave: CNPJ só com dígitos; CNPJ com letras nas posições 7–18; chave fora do formato de 44 posições; documento 91 com chave de 50 posições; modelo nas posições 21–22 diferente do `documento`; DV inválido; cálculo do DV conferido com chave só de dígitos e com letras (ASCII − 48); modelo 55 série 890–899 (NFA-e); modelo 55 série 910+ com CPF (`000` + 11 dígitos) e sem; modelo 65 série 890+; modelo 57 começando com `000`; rótulo "CNPJ do emitente, lido da chave da nota" e "CPF do emitente, lido da chave da nota"; cada motivo entre parênteses exatamente como na Spec;
- mesma raiz da empresa → "emitida pela própria empresa" (CA-12); CPF nunca é da própria empresa;
- formatação `AA.AAA.AAA/AAAA-DD` (com letras como vierem) e `DDD.DDD.DDD-DD`.

Os CPFs e CNPJs dos testes têm dígito verificador próprio propositalmente inválido (não são reais). Falham.

### 12. Implementar `emitente.ts`

Seguir a ordem e os textos da Spec sem acréscimo; não conferir DV de CNPJ. Verificação: testes da task 11 passam.

### 13. Testes de `saldo.ts`, `pendencias.ts`, `debitos.ts` e da `Visao`

- **CA-7, D-3, DT-8:** quatro totais por período e gerais, cada um a soma do seu campo, conferidos à mão; um caso em que `apropriado` ≠ `utilizado` + `saldoCredor` mostra que nenhum é derivado de outro.
- **CA-8:** a estrutura não tem nenhum campo que some `aApropriar` (ou `suspenso`, `inapropriavel`, `prescrito`) a outro total.
- **CA-13, D-6:** origem diferente de normal somada como vem, inclusive valor negativo; emissão fora do mês do `pa` sem alteração.
- **CA-14, DT-9:** grupos por emitente; grupos fixos "emitente não identificado" e "emitida pela própria empresa" presentes mesmo vazios; ordem total decrescente, depois quantidade, depois número; linha "notas com valor a apropriar negativo"; soma dos grupos igual ao total a apropriar do CA-7; percentual do grupo não identificado.
- **CA-D2:** totais de `apurado`, `extinto`, `saldoDevedor` por período e gerais; nota que aparece nos dois serviços não altera nenhum total do outro lado (O-25).
- **CA-5:** por serviço, `geradoEm` mais recente, quantidade de arquivos usados, menor e maior `atualizacao`.
- **CA-6:** sem arquivo de créditos, ou só com `apuracao` vazia → a `Visao` marca o estado vazio, sem totais.
- **CA-3:** com conflito de empresa, a `Visao` não traz nenhum valor.

Falham.

### 14. Implementar `saldo.ts`, `pendencias.ts`, `debitos.ts` e a `Visao`

A montagem da `Visao` (contrato da Spec) fica num módulo do núcleo, por exemplo `src/nucleo/visao.ts`, que recebe a lista de arquivos lidos e devolve a estrutura. Verificação: testes da task 13 passam.

### 15. Testes de `lista.ts`

- **CA-10, DT-5:** filtros `pa`, `documento`, `emitente` (CNPJ, raiz, `nao-identificado`, `propria-empresa`), `pendente=1`, isolados e combinados; `busca` por trecho da chave (4 a 50 caracteres, só dígitos e letras; outro valor ignorado e avisado); ordem `emissao` e `aApropriar` nos dois sentidos, padrão emissão decrescente, empate pela chave; 100 por página, total de notas e de páginas, total a apropriar do filtro inteiro; página fora do intervalo → última página; 1.000 notas num período geradas no próprio teste.
- **CA-13:** linha de origem diferente de normal com a marca "origem: <nome>".

Falham.

### 16. Implementar `lista.ts`

Verificação: testes da task 15 passam.

### 17. Testes dos fictícios e das fixtures de erro

`test/ficticios.test.ts`:

- **CA-17, CA-D3:** cada caso listado no CA-17 e no CA-D3 é encontrado nos arquivos de `dados/ficticios/` por um teste próprio (um `it` por item: `ni` e `niConsumidor` iguais com 14 dígitos; campos zerados ausentes e `saldoCredor` presente; números com 0, 1 e 2 casas; frações de tamanhos diferentes; documentos 55, 57, 62, 65 com 44 posições e 91 com 50; um período com centenas de notas; apropriações parciais; apropriado igual ao utilizado; nota com emitente da própria empresa; emissões fora do mês; origens diferentes de normal; mesmo crédito em dois arquivos com valores diferentes; recolhimentos com e sem `chaveDFE`; `saldoCredor` maior que zero; `ni` de 8 dígitos; arquivo vazio; débitos com `extinto` ausente quando zero, documentos 55 e 91, estabelecimentos da mesma raiz; a nota presente em créditos e débitos);
- casos de emitente da Spec presentes nos fictícios (DV errado, modelo divergente, série 890–899, série de CPF, CT-e com `000`, chave com letras);
- todos os arquivos de `dados/ficticios/` passam na validação (com a tolerância) e todos têm nome no padrão; a pasta padrão não tem conflito de empresa nem arquivo recusado (a demonstração abre sem aviso);
- `test/fixtures/` tem: arquivo de outra empresa, arquivo inválido por motivo diferente do `ni`, JSON ilegível, nome fora do padrão, arquivo de pagamentos;
- **não é dado real:** um helper de teste (`test/apoio/`), escrito a partir do módulo 11 de CNPJ e CPF, recalcula o DV de todo `ni`, `niConsumidor`, `niFornecedor`, emitente só com dígitos e CPF dos fictícios e das fixtures, e falha se algum for válido; CNPJ com letras começa por `FICT`; toda chave de 44 posições começa por `99`; tíquetes e DARFs começam por `FICT`;
- `gerar-ficticios` reproduz exatamente os arquivos gerados versionados (o teste roda o gerador para uma pasta temporária e compara byte a byte).

Falham: os fictícios não existem.

### 18. Fictícios escritos à mão e fixtures de erro

Pequenos, um por caso, como na Spec ("Fictícios"). Valores inventados; nenhum identificador copiado de arquivo real (que o Developer não abre). Verificação: os testes da task 17 que dependem só desses arquivos passam; os de volume e o do gerador continuam falhando (registrar no commit).

### 19. Script `gerar-ficticios` e arquivos de volume

`scripts/gerarFicticios.ts` e o script `gerar-ficticios` no `package.json`. Determinístico (sem `Math.random` nem data do sistema; se houver sorteio, gerador com semente fixa). Gera: créditos com cerca de 900 notas, um período concentrando quase todas, a mistura de documentos da O-6 e a forma da O-9 a O-15; débitos com cerca de 2.800 notas em 3 períodos e a mistura de estabelecimentos da O-23. Chaves com DV correto e UF `99`. Saída versionada em `dados/ficticios/`.

Verificação: todos os testes da task 17 passam; `npm run gerar-ficticios` de novo e `git status` sem mudança.

### 20. Testes das páginas e rotas, parte 1

Testes de `rotas.ts` com a função `tratar(pedido) -> resposta`, sem socket, sobre os fictícios e as fixtures:

- **layout:** cabeçalho com nome do painel, raiz formatada (`12.345.678`), data dos dados; aviso com link para `/arquivos` quando há arquivo recusado ou aceito com divergência;
- **CA-7, CA-9, CA-D2 (`/`):** quatro rótulos da D-3 com o nome do campo ao lado; valores no padrão brasileiro; texto de só CBS; bloco "Débitos de CBS (vendas)" com o texto de não haver saldo líquido;
- **CA-5:** por serviço, data de geração, quantidade e intervalo de `atualizacao`; o texto "A visão é só a dos arquivos lidos. A Receita não fornece histórico por esta API."; nenhuma página contém "8 dias";
- **CA-6:** pasta só com arquivo vazio e pasta sem créditos → "A Receita não devolveu créditos nos arquivos lidos." e nenhum "R$ 0,00" na área de totais;
- **CA-2, CA-3 (`/arquivos`):** cada arquivo com situação e motivo; marca de divergência conhecida; com conflito, todas as rotas menos `/arquivos` e `/estilo.css` mostram só o erro e a lista dos divergentes, sem nenhum valor; versões substituídas por serviço;
- pasta ilegível: todas as páginas dizem que a pasta não pôde ser lida, com o caminho;
- rota inexistente → 404; `/estilo.css` com o tipo `text/css`;
- **escape:** texto de arquivo com `<script>` e aspas aparece escapado em todas as páginas.

Falham.

### 21. Implementar `rotas.ts`, layout, saldo, arquivos, erro e `estilo.css`

`estilo.css` com as variáveis da seção "Aparência" (D-8), fonte Inter com *fallback* `system-ui`, sem fonte externa, sem script. Uma única função de escape de HTML. Verificação: testes da task 20 passam.

### 22. Testes das páginas, parte 2

- **CA-10, CA-13 (`/creditos`):** colunas do CA-10 com nomes da tabela e código ao lado (F-2); filtros, ordenação, busca e paginação pela URL; formulários com `method="get"`; marca de origem diferente de normal; com o fictício de volume, `/creditos?pa=11/2026` mostra 100 linhas e o total de páginas;
- **CA-11, CA-12 (`/creditos/nota`):** todos os campos com nome oficial, ausente como "não veio no arquivo"; registro e atualização; recolhimentos ligados (data de arrecadação, DARF, período, vencimento, fornecedor, principal, multa, juros, total); emitente com a fonte, ou "emitente não identificado" com o motivo; recolhimento × chave divergentes mostrando os dois; marca de chave presente nos débitos (O-25); parâmetros que não acham nota → 404;
- **CA-14, CA-15 (`/pendencias`):** grupos, totais, quantidades, grupos fixos, linha de negativos, igualdade com o total do CA-7 mostrada, percentual de não identificado; `?grupo=` lista as notas do grupo; texto fixo da Spec presente; nenhuma frase que diga que o emitente não recolheu (varredura por "não recolheu", "deixou de recolher" fora do texto fixo, "inadimpl");
- **CA-8, D-3:** varredura do HTML de **todas** as rotas, com a pasta padrão e com cada fixture: nenhuma ocorrência (sem diferenciar maiúsculas) de "disponível", "pode usar", "pode ser usado", "confirmado", "liberado".

Falham.

### 23. Implementar créditos, detalhe e pendências

Verificação: testes das tasks 20 e 22 passam.

### 24. Testes de `servidor.ts` e `main.ts`

Socket só em `127.0.0.1`, porta 0:

- **CA-A1, DT-10:** endereço de escuta `127.0.0.1`; `Host` diferente de `127.0.0.1:<porta>` e `localhost:<porta>` → 421; `POST`, `PUT`, `DELETE` → 405; `HEAD` aceito; cabeçalhos `Content-Security-Policy` (texto exato da Spec), `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Cache-Control: no-store` em toda resposta, inclusive erro;
- **DT-4 (`main.ts`):** argumentos `--pasta` e `--porta`; sem `--pasta`, `dados/ficticios/`; caminho relativo resolvido a partir da pasta da aplicação; porta ocupada → código de saída 2 com mensagem; mensagem de partida com o endereço e a pasta, sem conteúdo de arquivo;
- **CA-A2:** com `--pasta` numa cópia temporária dos fictícios, um arquivo novo aparece no pedido seguinte sem reiniciar; arquivo alterado é relido;
- **CA-A3:** hash, tamanho e data de modificação de todos os arquivos da pasta temporária iguais antes e depois de percorrer todas as rotas;
- **Desempenho:** com os fictícios de volume, primeira carga de `/` e `/creditos?pa=11/2026` abaixo de 2 s; recarga sem mudança não relê arquivo.

Pastas temporárias criadas pelo teste no diretório temporário do sistema e apagadas ao fim. Falham.

### 25. Implementar `servidor.ts`, `main.ts` e o script `start`

`npm start -- [--pasta <caminho>] [--porta <n>]`, porta padrão `5180`. Verificação: todos os testes passam; lint e build. O Developer **não** abre o navegador (é da sessão principal) e não aponta o painel para nenhuma pasta real.

### 26. README da aplicação

`app/painel/README.md`, como na Spec ("README" e "Implantação"): o que faz e o que não faz (não chama a API, não grava nada, só CBS, sem saldo líquido, sem motivo da pendência, sem nome do emitente); requisitos (Node 24); comandos (`npm install`, `npm test`, `npm run lint`, `npm run build`, `npm run gerar-ficticios`, `npm start`); como apontar para os arquivos reais com `--pasta`, uma pasta por empresa, e o aviso de copiar os arquivos de `.local/arquivos/` de um worktree antes de removê-lo, sempre fora do git; o que é ignorado e listado (pagamentos, nome fora do padrão). Nenhum exemplo com dado real: caminhos de exemplo genéricos.

### 27. `AGENTS.md` e `.claude/fluxo.json`

- `AGENTS.md`, regra "Testes primeiro": frase da `app/painel` (demanda 030), que testa com `npm test` (vitest), em `app/painel`, sem rede e sem `.env`.
- `AGENTS.md`, seção "Comandos": bloco `# painel (primeira versão do painel, local)` com `cd app/painel`, `npm install`, `npm test`, `npm run lint`, `npm run build`, `npm run gerar-ficticios`, `npm start -- [--pasta <caminho>] [--porta <n>]`, e uma linha dizendo que o painel não chama a API e só lê a pasta.
- `.claude/fluxo.json`: `"painel": "app/painel"` em `apps`.

Verificação: revisão; `node -e "JSON.parse(require('fs').readFileSync('.claude/fluxo.json','utf8'))"` sem erro.

### 28. `docs/PROJECT_CONTEXT.md`

- §2: linha do painel (`app/painel`, demanda 030: web local, sem login, lê os arquivos da `apuracao-cbs`, só CBS, testado com fictícios); a linha "Backend, banco, autenticação, painel" passa a dizer que backend, banco e autenticação continuam não iniciados.
- §4: subseção "Painel (`app/painel`) — o que existe" com a stack da DT-1; a subseção "proposta, não confirmada" passa a tratar só do backend e do painel com login.
- §7: `app/painel/` na árvore; `referencias/` deixa de dizer só "Split Payment".
- §10: linha "Leiaute da chave dos documentos fiscais" → `referencias/documentos-fiscais/`.
- §11: changelog de 2026-11-24 com a demanda 030.

### 29. Referência `docs/referencias/documentos-fiscais/README.md`

Novo, a partir da seção "Fontes do leiaute da chave" da Spec: F-A a F-E com título, versão, data, URL e seções; a tabela de composição com as posições marcadas como **derivadas**; as regras usadas pelo painel (formato, modelo, DV com ASCII − 48, NFA-e, série de CPF, CT-e com `000`, CNPJ alfanumérico), cada uma com a fonte e a seção; e a lista do que não foi confirmado. Nenhuma chave real como exemplo. Entrada no `docs/README.md` (índice).

### 30. Referência `docs/referencias/apuracao-cbs/README.md`

- Seção "Observado na chamada real": acrescentar a observação de 2026-11-24 com a credencial de outra empresa, O-1 a O-25 como na US (estrutura, códigos, contagens, proporções; **sem nenhum dado real**).
- Tabela de divergências: nova linha "`ni` com 14 dígitos no arquivo × `^\d{8}$` nos quatro schemas", **confirmada**, com o tratamento do painel (D-2) e a nota de que a `apuracao-cbs` continua recusando o arquivo.
- Linha de recolhimentos: 404 de novo, com outra credencial, com a mensagem de endereço não encontrado (O-17).
- Linha "Arquivo" da primeira chamada ("Válido contra o schema 1.0.0" com `ni` de 14 dígitos): ver a pergunta P-1 no fim. O Developer **não** abre `.local/` para conferir.
- Tabelas de documento e origem (decisão F-2): os códigos e nomes de `app/apuracao-cbs/src/tabelas.ts`, com a página (`credito.html`, `debito.html`) e a versão (1.3, 13/11/2026).
- "O que isso significa para o produto" e "O que não está documentado": ajustar o que os arquivos reais responderam (fornecedor pela chave, com a referência de documentos fiscais; motivo da pendência continua sem campo).

### 31. `docs/produto/hipoteses.md`, H1

Na H1: motivo da pendência ainda sem campo, agora com dados (99% a apropriar, apropriado todo utilizado); recolhimentos 404 com a segunda credencial; "dados para observar" atualizado (o arquivo veio com dados; falta a segunda consulta da mesma credencial); e, como **hipóteses a conferir**, D-2 (tolerância do `ni`), D-3 (qual valor é o saldo utilizável: tributarista), D-4 (emitente pela chave; código 91 não identificado; nota da própria empresa nos dois lados), D-5 (identidade e versão do crédito), D-6 (origens somadas como vêm) e DT-7 (identidade do item de recolhimento), cada uma com como conferir.

### 32. Verificação de fechamento

```bash
cd app/painel
npm test
npm run lint
npm run build
npm run gerar-ficticios && git status --short   # nada muda
cd ../apuracao-cbs
npm test                                        # todos passam, como antes
cd ../..
git diff --stat main -- app/apuracao-cbs app/landing-page   # vazio
git status                                      # sem node_modules/, dist/, .local/, .env
git check-ignore -v app/painel/.local/x.json
```

Também: `grep` nos arquivos novos e alterados da demanda por sequências de 44 e 50 dígitos e de 14 dígitos que não comecem com `99`/`FICT` nem sejam fictícias conhecidas, para confirmar que nenhum dado real entrou. Sem commit, salvo correção (com commit próprio).

## Mapa CA → verificação

| CA | Tasks |
|---|---|
| CA-1 | 5, 7 |
| CA-2 | 3, 7, 20 |
| CA-3 | 9, 13, 20 |
| CA-4 | 9 |
| CA-5 | 5, 13, 20 |
| CA-6 | 13, 20 |
| CA-7 | 13, 20 |
| CA-8 | 13, 22 |
| CA-9 | 20 |
| CA-10 | 15, 22 |
| CA-11 | 22 |
| CA-12 | 11, 22, 29 |
| CA-13 | 13, 15, 22 |
| CA-14 | 11, 13, 22 |
| CA-15 | 22 |
| CA-16 | 2, 5 |
| CA-17 | 17 |
| CA-18 | 1, 17, 26, 32 |
| CA-19 | 2, 24 |
| CA-20 | 26 (revisão) |
| CA-21 | 27, 28 (revisão) |
| CA-22 | 32 |
| CA-23 | 30, 31 (revisão) |
| CA-D1 | 7, 9 |
| CA-D2 | 13, 20 |
| CA-D3 | 17 |
| CA-A1 | 24; manual |
| CA-A2 | 7, 24 |
| CA-A3 | 2, 24 |

## Verificação manual (sessão principal, fora das tasks de código)

Depois da task 32, antes do PR, a **sessão principal** (não o Developer):

1. `npm start` em `app/painel` e abrir `http://127.0.0.1:5180/` no navegador.
2. Percorrer as cinco páginas com os fictícios: saldo e débitos, lista de créditos (filtros, ordenação, busca, paginação), detalhe de notas com e sem emitente, pendências e arquivos. Conferir a aparência (D-8) numa tela de 1280 px ou mais.
3. Copiar os fictícios e uma fixture inválida (`test/fixtures/`) para uma pasta temporária, subir com `--pasta` e conferir o aviso e `/arquivos`; acrescentar outro arquivo e recarregar.
4. Se o responsável quiser, ele mesmo aponta o painel para a pasta real dele, só na máquina dele, sem print nem cópia de valor para o PR ou para o chat.

## Perguntas em aberto

- **P-1:** A referência registra a primeira chamada real como "Válido contra o schema 1.0.0" com `ni` de 14 dígitos, mas o schema exige `^\d{8}$`, então as duas anotações não podem estar certas ao mesmo tempo, e a Spec manda conferir. O Developer não pode abrir `.local/`. Recomendação: o responsável diz se, naquela chamada, a `apuracao-cbs` mostrou o resumo ou recusou o arquivo; até a resposta, a task 30 reescreve a linha registrando a incompatibilidade ("`ni` com 14 dígitos não passa no `^\d{8}$`; a anotação de válido não foi reconferida") sem afirmar qual das duas está errada.
