# 030-painel-primeira-versao — Spec

- **Status:** spec-em-revisão
- **US:** [`us.md`](us.md), aprovada em 2026-11-24 (decisões D-1 a D-8)

> **Bloqueio para aprovar a Spec (F-1).** A identificação do emitente pela chave de 44 dígitos (D-4) depende de uma fonte oficial do leiaute da chave registrada em `docs/referencias/`. Não há nenhuma no repositório (conferido em `docs/referencias/apuracao-cbs/` e `docs/referencias/split-payment/`). A seção "Emitente" descreve o que precisa ser obtido e o que muda sem ele. Pela D-4, sem a fonte a demanda volta ao usuário.

## Critérios de aceite atendidos

Todos os CA da US: CA-1 a CA-23, CA-D1 a CA-D3 e CA-A1 a CA-A3. A parte do CA-12 e do CA-14 que usa a chave da nota depende da F-1; sem ela, o CA-12 é atendido só com o recolhimento, como na D-4.

## Abordagem

Uma aplicação nova, `app/painel`, em Node 24 e TypeScript, com o mesmo conjunto de ferramentas da `app/apuracao-cbs` (vitest, oxlint, ajv, big.js, lossless-json). Um servidor HTTP do próprio Node (`node:http`) escuta só em `127.0.0.1`, lê os arquivos de uma pasta, valida, consolida e devolve páginas HTML montadas no servidor. O navegador não executa JavaScript: filtros, ordenação e paginação são formulários e links com parâmetros na URL.

O código tem duas partes: um **núcleo** sem rede e sem HTTP (leitura, validação, consolidação, emitente, totais), que recebe a lista de arquivos e devolve estruturas de dados; e as **páginas**, funções puras que recebem essas estruturas e devolvem HTML. O servidor só liga as duas. Os testes exercitam o núcleo e as páginas diretamente, sem socket, e uma vez o servidor real em `127.0.0.1`.

A cada pedido, o painel lista a pasta e reaproveita o resultado dos arquivos que não mudaram (mesmo nome, tamanho e data de modificação). Arquivo novo ou alterado é lido e validado de novo. Assim, recarregar a página reflete a pasta (CA-A2) sem revalidar 4.000 notas a cada clique.

## Mudanças por camada

### Painel (`app/painel`, novo)

Estrutura:

```
app/painel/
├── package.json, tsconfig.json, vitest.config.ts, README.md
├── schemas/oficiais/         # cópia byte a byte dos 4 schemas e do versoes.json da apuracao-cbs
├── dados/ficticios/          # arquivos fictícios versionados (CA-17, CA-D3)
├── scripts/gerarFicticios.ts # gera os fictícios de volume, deterministicamente
├── src/
│   ├── main.ts               # lê --pasta e --porta, sobe o servidor
│   ├── servidor.ts           # node:http, 127.0.0.1, Host, métodos, cabeçalhos
│   ├── rotas.ts              # tratar(pedido) -> resposta, sem socket
│   ├── nucleo/
│   │   ├── arquivos.ts       # lista a pasta, identifica o serviço pelo nome, cache por nome+tamanho+mtime
│   │   ├── json.ts           # leitura sem perda (copiado)
│   │   ├── dinheiro.ts       # decimal exato e formatação (copiado e estendido)
│   │   ├── tabelas.ts        # nomes de documento e origem (copiado; ver F-2)
│   │   ├── validacao.ts      # schema oficial + tolerância do ni (D-2)
│   │   ├── empresa.ts        # raiz do CNPJ, conflito entre empresas (CA-3)
│   │   ├── consolidacao.ts   # identidade e versão mais recente (D-5)
│   │   ├── emitente.ts       # recolhimento e chave (D-4, F-1)
│   │   ├── saldo.ts          # quatro totais por período (CA-7)
│   │   ├── pendencias.ts     # grupos por emitente (CA-14)
│   │   ├── lista.ts          # filtro, ordenação, busca, paginação (CA-10)
│   │   ├── debitos.ts        # totais de débitos (CA-D2)
│   │   └── datas.ts          # exibição textual de datas, sem conversão de fuso
│   └── paginas/              # layout, saldo, creditos, detalhe, pendencias, arquivos, erro, estilo.css
└── test/
```

#### Configuração e execução (CA-A1, CA-A2, CA-19)

- `npm start -- [--pasta <caminho>] [--porta <n>]`. Sem `--pasta`, usa `dados/ficticios/`. Sem `--porta`, usa `5180`. O caminho pode ser absoluto ou relativo à pasta da aplicação.
- Não há `.env` nem variável de ambiente lida pelo painel. Os agentes não criam `.env` (`AGENTS.md`), e o painel não precisa de segredo.
- Na partida, o painel escreve no terminal o endereço (`http://127.0.0.1:<porta>/`) e o caminho absoluto da pasta. Não registra conteúdo de arquivo no terminal.
- Pasta inexistente ou ilegível: o servidor sobe e todas as páginas dizem que a pasta não pôde ser lida, com o caminho. Não cria a pasta.

#### Servidor (CA-A1, CA-A3, CA-19)

- `listen` em `127.0.0.1` (nunca `0.0.0.0` nem `::`). Porta ocupada encerra com mensagem e código 2.
- O cabeçalho `Host` precisa ser `127.0.0.1:<porta>` ou `localhost:<porta>`. Qualquer outro recebe 421, o que protege contra *DNS rebinding*.
- Só `GET` e `HEAD`. Qualquer outro método recebe 405.
- Cabeçalhos em toda resposta: `Content-Security-Policy: default-src 'none'; style-src 'self'; img-src 'self'; form-action 'self'; frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Cache-Control: no-store`.
- Todo texto vindo de arquivo passa por uma única função de escape de HTML antes de entrar na página. A lista de arquivos usa só o nome do arquivo, nunca um caminho vindo da URL. Nenhuma rota recebe caminho de arquivo como parâmetro.
- O código só usa `readdir`, `stat` e `readFile`. Não importa cliente HTTP (`fetch`, `node:https`, bibliotecas) e não lê `process.env` (CA-19).

#### Rotas

| Rota | Conteúdo | CA |
|---|---|---|
| `GET /` | Saldo: quatro totais gerais e por período; aviso de só CBS; bloco de débitos; data dos dados | CA-5 a CA-9, CA-D2 |
| `GET /creditos` | Lista de créditos com filtros, ordenação, busca e paginação | CA-10, CA-12, CA-13 |
| `GET /creditos/nota?pa=&documento=&origem=&chave=` | Detalhe de uma nota e recolhimentos ligados | CA-11, CA-12 |
| `GET /pendencias` e `GET /pendencias?grupo=` | Grupos por emitente e notas de um grupo | CA-14, CA-15 |
| `GET /arquivos` | Arquivos lidos, aceitos, aceitos com divergência, recusados ou ignorados, com motivo | CA-2, CA-3, CA-5 |
| `GET /estilo.css` | Folha de estilo | D-8 |

Todas as páginas têm o mesmo cabeçalho: nome do painel, raiz do CNPJ formatada (`12.345.678`), data dos dados (CA-5) e um aviso com link para `/arquivos` quando há arquivo recusado ou aceito com divergência. Com conflito de empresas (CA-3), todas as rotas, menos `/arquivos` e `/estilo.css`, mostram só o erro e a lista dos arquivos divergentes.

#### Arquivos e serviço (CA-1, CA-2)

- O painel lê os `*.json` da pasta, sem descer em subpastas.
- O serviço vem do nome, no padrão que a `apuracao-cbs` grava: `AAAAMMDDTHHMMSSZ_<servico>_<tiquete>[_<n>].json`. O conteúdo não basta: recolhimentos e pagamentos têm a mesma raiz (`apuracao[].dataArrecadacao` e `pagamentos`), e arquivo vazio não tem nada que indique o serviço.
- Serviços usados: `creditos`, `recolhimentos`, `debitos`. Arquivo de `pagamentos` aparece em `/arquivos` como "ignorado: serviço não usado pelo painel". Nome fora do padrão aparece como "ignorado: nome fora do padrão da apuracao-cbs".
- BOM inicial é aceito, como na `apuracao-cbs`.

#### Validação com a tolerância do `ni` (CA-2, D-2)

Mesma validação da `apuracao-cbs`: ajv 2020-12 com `ajv-formats` sobre as cópias dos schemas oficiais, mais a checagem no texto original de que nenhum número monetário tem mais de duas casas nem notação exponencial. A tolerância é um filtro sobre os erros, sem tocar no schema:

- um erro é tolerado só se `instancePath` for exatamente `/ni`, a regra violada for `pattern` e o valor casar com `^\d{14}$`;
- se todos os erros forem tolerados, o arquivo é **aceito com divergência conhecida do schema 1.0.0**, com o texto "`ni` com 14 dígitos (o schema exige 8)";
- qualquer outro erro recusa o arquivo, e o motivo lista até 20 divergências, como na `apuracao-cbs`. `niConsumidor` não tem tolerância: o schema já aceita 11 ou 14 dígitos.

#### Empresa (CA-3)

- Raiz = os 8 primeiros caracteres de `ni`, com 8 ou 14 dígitos.
- Os arquivos aceitos (com ou sem divergência) são agrupados por raiz. Com mais de uma raiz, há conflito: nenhum valor é mostrado, e `/arquivos` lista cada arquivo com a raiz, para o usuário tirar da pasta os de outra empresa. Arquivo recusado não entra nessa comparação.

#### Consolidação (CA-4, CA-D1, D-5)

- **Crédito e débito:** a identidade é (`pa`, `chave`, `documento`, `origem`). Entre versões da mesma identidade, vence a de `atualizacao` mais recente; no empate, a do arquivo com `geradoEm` mais recente; persistindo o empate, a do nome de arquivo maior em ordem lexicográfica, que no padrão da `apuracao-cbs` é o mais recente. As datas são comparadas como instantes, com fuso e fração de qualquer tamanho (O-15).
- **Item de recolhimento:** identidade (`numeroDARF`, `sequencial`). Repetido em mais de um arquivo, vence o do arquivo com `geradoEm` mais recente. Esta regra não está na US: o recolhimento também é incremental, e sem ela o mesmo arquivo lido duas vezes duplicaria itens no detalhe. É registrada como hipótese junto da D-5 (CA-23).
- O mesmo arquivo em duas cópias com nomes diferentes não muda nenhum total, porque as versões são iguais e a identidade colapsa.
- A página `/arquivos` mostra, por serviço, quantas versões foram substituídas na consolidação.

#### Valores (CA-7, CA-8, CA-16, D-3, D-6)

- Todo número vem do texto original (lossless-json) e vira `Big`. Campo ausente vale zero na soma e aparece como "não veio no arquivo" no detalhe (CA-11). Essa é a regra que a Spec define para o "conforme a Spec" do CA-11.
- Totais de crédito por período e gerais, cada um soma só do seu campo: `aApropriar`, `apropriado`, `utilizacao.utilizado` e `utilizacao.naoUtilizado.saldoCredor`. Nenhum total é derivado de outro (D-3). Os rótulos são os da D-3, com o nome do campo ao lado, em fonte monoespaçada.
- Linhas de origem diferente de normal entram como vêm, sem inverter sinal (D-6).
- Formatação: `R$ 1.234,56`; negativo como `-R$ 1.234,56`. Feita por texto sobre `toFixed(2)`, como em `dinheiro.ts`.
- Percentual do CA-14: `Big` com uma casa decimal, arredondamento meio para cima; total a apropriar zero mostra "—".
- Teste de texto: nenhuma página contém "disponível", "pode usar", "pode ser usado", "confirmado" nem "liberado" (CA-8, D-3).

#### Emitente (CA-12, CA-14, D-4, F-1)

Ordem para cada nota de crédito:

1. **Recolhimento:** se houver item de recolhimento com `chaveDFE` igual à `chave`, o emitente é o `niFornecedor` dele, com a indicação "do recolhimento". Itens diferentes com `niFornecedor` diferentes para a mesma chave: o emitente fica "não identificado (recolhimentos divergentes)", e o detalhe lista todos.
2. **Chave da nota (depende da F-1):** para os documentos 55, 57, 62 e 65, quando a chave tem o formato e o tamanho que o leiaute oficial define, o emitente é o campo do emitente nas posições que o leiaute define, com a indicação "da chave da nota". O painel confere também o campo do modelo dentro da chave contra o `documento` do crédito; se divergir, o emitente fica "não identificado (chave fora do leiaute)". Evidência observada, que não substitui a fonte: nos arquivos reais (O-6, O-16, O-23), as posições 7–20 têm 14 dígitos com padrão de CNPJ do emitente, e as posições 21–22 repetem o código do documento.
3. **Demais casos**, inclusive todo documento 91 (chave de 50 dígitos): "emitente não identificado".

Quando os dois existem e divergem, vale o recolhimento, e o detalhe mostra os dois. Emitente com a mesma raiz da empresa vai para "emitida pela própria empresa" (CA-12, CA-14). O detalhe da nota também mostra se a mesma chave aparece nos débitos (O-25), sem compensar nada.

**Sem a F-1**, o passo 2 não é implementado. Com recolhimentos fora do ar (O-17), toda nota real cai em "emitente não identificado". Pela D-4, isso volta ao usuário antes das Tasks.

#### Lista de créditos (CA-10, CA-13)

- Filtros (parâmetros GET, combináveis): `pa`, `documento`, `emitente` (raiz ou CNPJ, ou os valores `nao-identificado` e `propria-empresa`), `pendente=1` (só `aApropriar` maior que zero), `busca` (trecho da chave, só dígitos e letras, de 4 a 50 caracteres; outro valor é ignorado e avisado).
- Ordenação: `ordem=emissao|aApropriar`, `sentido=asc|desc`. Padrão: emissão decrescente. Empate pela chave.
- Paginação: 100 notas por página, `pagina=N`, com total de notas e de páginas e o total a apropriar do filtro inteiro (não só da página).
- Colunas do CA-10. Linha com origem diferente de normal tem a marca "origem: <nome>". Linha com emissão fora do mês do `pa` não tem tratamento especial (CA-13).
- Página fora do intervalo mostra a última página.

#### Pendências (CA-14, CA-15)

- Notas com `aApropriar` maior que zero, agrupadas pelo emitente do CA-12. Grupos fixos "emitente não identificado" e "emitida pela própria empresa" aparecem mesmo vazios. Ordem: total decrescente, empate pela quantidade e depois pelo número.
- Notas com `aApropriar` negativo (possíveis pela D-6, nunca observadas) ficam numa linha própria, "notas com valor a apropriar negativo", para a soma da tela continuar igual ao total do CA-7. A tela mostra a igualdade.
- Texto fixo da tela: "A Receita informa o valor a apropriar de cada nota, mas não informa o motivo. Esta tela não indica que o emitente deixou de recolher."

#### Débitos (CA-D1, CA-D2)

Mesma leitura, validação, empresa e consolidação. Totais gerais e por período de `apurado`, `extinto` e `saldoDevedor`, num bloco próprio da página inicial, abaixo do saldo de crédito, com o texto: "Débitos das vendas, mostrados à parte. O painel não calcula saldo líquido entre crédito e débito." Não há lista de notas de venda.

#### Datas e data dos dados (CA-5)

- Exibição textual a partir da string do arquivo (`dd/mm/aaaa hh:mm`, com o fuso do arquivo ao lado). Sem conversão de fuso nem objeto `Date` para exibição.
- Por serviço: `geradoEm` mais recente, quantidade de arquivos usados, menor e maior `atualizacao`. Texto: "A visão é só a dos arquivos lidos. A Receita não fornece histórico por esta API."
- Estado vazio (CA-6): "A Receita não devolveu créditos nos arquivos lidos.", no lugar dos totais.

#### Aparência (D-8)

Uma folha `estilo.css` com variáveis tiradas das cores usadas na landing (`app/landing-page/src`): fundo `#060a13`, superfícies `#0e1524` e `#111827`, borda `#1e293b`, texto `#e2e8f0`, texto secundário `#94a3b8` e `#64748b`, destaque `#10b981` e `#047857`, alerta `#fbbf24`; fonte Inter com *fallback* `system-ui`, sem carregar fonte externa. Layout para tela de computador, a partir de 1280 px, com tabelas largas e rolagem horizontal abaixo disso. Sem Tailwind, sem Vite: CSS escrito à mão, servido pelo próprio servidor.

#### Fictícios (CA-17, CA-D3)

- `dados/ficticios/` com arquivos no padrão de nome da `apuracao-cbs`, em duas partes:
  - **escritos à mão**, pequenos, um por caso: as origens diferentes de normal; o mesmo crédito em dois arquivos com valores diferentes; recolhimentos com e sem `chaveDFE`; apropriado não utilizado; `ni` de 8 dígitos; arquivo vazio; débitos com `extinto` e a nota presente nos dois lados;
  - **gerados** por `npm run gerar-ficticios` (script determinístico, sem aleatoriedade não semeada, saída versionada): o arquivo de volume com cerca de 900 créditos, um período concentrando quase tudo, a mistura de documentos da O-6, a forma da O-9 a O-15; e um arquivo de débitos com cerca de 2.800 notas em 3 períodos, com a mistura de estabelecimentos da O-23.
- Os casos de erro ficam em `test/fixtures/` (fora da pasta padrão), para a demonstração não abrir com aviso: arquivo de outra empresa, arquivo inválido por outro motivo, JSON ilegível, nome fora do padrão, arquivo de pagamentos.
- Identificadores fictícios: NIs e emitentes com dígito verificador de CNPJ propositalmente errado; chaves com dígito verificador errado (se a F-1 trouxer o algoritmo; senão, prefixo de UF inexistente, como `99`); tíquetes e DARFs com o prefixo `FICT`. Um teste recalcula o dígito verificador do CNPJ (módulo 11) de todo NI e de todo emitente dos fictícios e falha se algum for válido. O algoritmo serve só para garantir que o dado de teste não é real, não é regra do produto.

#### README (CA-20)

O que o painel faz e não faz (não chama a API, não grava nada, só CBS, não calcula saldo líquido nem diz o motivo da pendência), requisitos, comandos, como apontar para os arquivos reais (seção "Implantação") e o aviso de uma pasta por empresa.

### Prova de conceito (`app/apuracao-cbs`)

Nenhuma mudança. O painel copia código e schemas (DT-2) em vez de importar.

### Documentação

- `AGENTS.md`: na regra "Testes primeiro", a frase da `app/painel` com `npm test`; na seção "Comandos", o bloco da `app/painel` (CA-21).
- `docs/PROJECT_CONTEXT.md`: §2 (linha do painel), §4 (stack do painel, o que existe), §7 (`app/painel` na árvore), §11 (changelog) (CA-21).
- `.claude/fluxo.json`: `"painel": "app/painel"` em `apps` (CA-21).
- `docs/referencias/apuracao-cbs/README.md`: na seção "Observado na chamada real", O-1 a O-25 sem dado real; na tabela de divergências, a nova divergência "`ni` com 14 dígitos no arquivo × `^\d{8}$` nos quatro schemas", **confirmada**; a linha de recolhimentos (404 com outra credencial e mensagem de endereço não encontrado); conferir a anotação "Válido contra o schema 1.0.0" da primeira chamada, que registra `ni` com 14 dígitos, e corrigi-la se o arquivo foi de fato recusado (CA-23).
- `docs/produto/hipoteses.md`: H1 com o que os arquivos reais mostraram (motivo da pendência ainda sem campo; 99% a apropriar; apropriado todo utilizado; recolhimentos 404), e as hipóteses D-3 a D-6 e a identidade do item de recolhimento (CA-23).
- `docs/referencias/documentos-fiscais/README.md` (novo, se a F-1 for obtida): o leiaute da chave, com a fonte.
- Tabelas de documento e origem em `docs/referencias/apuracao-cbs/README.md`, se a F-2 for aceita.

## Contratos

Estruturas do núcleo, entre o núcleo e as páginas (nomes indicativos; os tipos finais são da implementação):

| Estrutura | Campos principais | CA |
|---|---|---|
| `ArquivoLido` | `nome`, `servico` (`creditos`, `recolhimentos`, `debitos`, `pagamentos` ou nenhum), `situacao` (`aceito`, `aceito-com-divergencia`, `recusado`, `ignorado`), `motivos[]`, `geradoEm`, `raiz`, `quantidade` | CA-2, CA-3, CA-5 |
| `Nota` (crédito) | `pa`, `chave`, `documento`, `origem`, `emissao`, `registro`, `atualizacao`, `valores` (mapa do caminho oficial, por exemplo `cbs.apropriacao.aApropriar`, para `Big` ou ausente), `arquivo` | CA-4, CA-10, CA-11 |
| `Emitente` | `tipo` (`identificado`, `propria-empresa`, `nao-identificado`), `numero`, `fonte` (`recolhimento`, `chave`), `observacao` | CA-12 |
| `Totais` | por período e geral: `aApropriar`, `apropriado`, `utilizado`, `saldoCredor` | CA-7 |
| `GrupoPendencia` | `emitente`, `quantidade`, `total`, `notas` | CA-14 |
| `TotaisDebitos` | por período e geral: `apurado`, `extinto`, `saldoDevedor` | CA-D2 |
| `Visao` | arquivos, conflito de empresa, notas consolidadas, recolhimentos, totais, débitos, datas por serviço | todos |

Contrato de entrada: os quatro schemas oficiais 1.0.0, cópia byte a byte (`schemas/oficiais/`), mais a tolerância da D-2. Contrato de saída: as rotas HTTP da tabela acima, só leitura.

## Riscos e decisões

Decisões técnicas, para aprovação junto com a Spec:

- **DT-1, stack: Node 24 + TypeScript, servidor `node:http` com HTML montado no servidor, sem framework de interface e sem JavaScript no navegador.** Alternativas:
  - (a) esta. Uma aplicação, um build (`tsc`), as mesmas ferramentas e dependências da `apuracao-cbs`, testes sem navegador. O servidor é necessário de qualquer forma para ler a pasta do disco a cada recarga (CA-A2). Com paginação no servidor, 1.000 notas por período não pesam no navegador;
  - (b) Vite + React (como a landing) com uma API Node local. Dois processos ou um servidor que serve o build, estado no cliente, testes de interface com jsdom: mais peças sem ganho para três telas de leitura. A concepção propunha React no painel; essa decisão continua aberta para o produto com backend;
  - (c) só no navegador, com seleção de pasta pelo navegador. Dispensa servidor, mas a pasta precisa ser escolhida de novo a cada abertura, o que contraria CA-A2.
  Custo de (a): quando houver backend e interface rica, as páginas serão refeitas; o núcleo (leitura, validação, consolidação, emitente, totais) é reaproveitável.
- **DT-2, reaproveitamento da `apuracao-cbs`: copiar.** Alternativas:
  - (a) **copiar** `json.ts`, `dinheiro.ts`, `tabelas.ts` e a lógica de `validacao.ts` (cerca de 170 linhas) e os quatro schemas com o `versoes.json`, com cabeçalho indicando a origem. Custo: duplicação. Mitigação: um teste do painel confere o sha256 de cada schema copiado contra o `versoes.json` da própria cópia, e outro compara o `versoes.json` do painel com o da `apuracao-cbs` (só leitura do arquivo vizinho, no repositório);
  - (b) importar por caminho relativo ou `file:../apuracao-cbs`. A `apuracao-cbs` não é biblioteca (sem `exports`, `rootDir` em `src`, build próprio); o build do painel passaria a depender do da prova de conceito, e uma mudança nela quebraria o painel sem aviso;
  - (c) extrair um pacote comum (`app/compartilhado` ou workspaces npm). É o certo a longo prazo, mas mexe na `apuracao-cbs` e nos seus 377 testes, e a US limita mudanças nela ao mínimo.
  Recomendação: (a) agora; (c) quando houver uma terceira aplicação ou o backend.
- **DT-3, serviço pelo nome do arquivo**, não pelo conteúdo (motivo na seção "Arquivos e serviço"). Arquivo real renomeado à mão fica ignorado e aparece em `/arquivos` com o motivo.
- **DT-4, configuração por argumento** (`--pasta`, `--porta`), sem `.env`.
- **DT-5, paginação de 100 notas**, filtro e ordenação no servidor.
- **DT-6, precedência do recolhimento sobre a chave** quando os dois existem e divergem; os dois aparecem no detalhe.
- **DT-7, identidade do item de recolhimento** (`numeroDARF`, `sequencial`), registrada como hipótese.
- **DT-8, campo ausente**: zero na soma, "não veio no arquivo" no detalhe.
- **DT-9, linha de notas com `aApropriar` negativo** nas pendências, para a soma fechar.
- **DT-10, proteção local:** `127.0.0.1`, checagem de `Host`, CSP sem script, escape único de HTML, só `GET` e `HEAD`.

Riscos:

- **F-1 não obtida:** a visão por emitente fica vazia com dados reais enquanto recolhimentos responder 404.
- **CNPJ alfanumérico.** Se o leiaute vigente admite letras no campo do emitente da chave, uma regra "só dígitos" erra. A F-1 precisa trazer isso; os fictícios cobrem o formato que a fonte definir.
- **Hipóteses D-5, D-6 e DT-7** podem cair na segunda consulta real. O efeito fica isolado em `consolidacao.ts` e nos totais, com testes próprios.
- **Validação com ajv sobre `JSON.parse`** herda o limite conhecido da `apuracao-cbs` (`multipleOfPrecision`) para valores acima de alguns bilhões: arquivo correto pode ser recusado. O motivo aparece em `/arquivos`.
- **Arquivos reais em pasta de worktree.** `app/apuracao-cbs/.local/` de um worktree some quando o worktree é removido (ver "Implantação").
- **Pasta com arquivos de duas empresas** (por exemplo, a primeira chamada real, de uma credencial, e a de 2026-11-24, de outra) cai no conflito do CA-3. É o comportamento certo; o README explica que a pasta deve ter uma empresa só.
- **Cache por nome, tamanho e data de modificação:** arquivo trocado por outro com os mesmos três valores não é relido. Na prática, não acontece com arquivos gravados pela `apuracao-cbs`, que nunca sobrescreve.

## Implantação

Não há deploy: o painel roda só na máquina do responsável. Sem nota de implantação, tag nem release.

- **Apps afetadas:** `app/painel` (nova). `app/apuracao-cbs` e `app/landing-page` sem mudança.
- **Migration:** não há banco.
- **Compatibilidade:** não muda nada nas outras aplicações. Lê os arquivos que a `apuracao-cbs` já grava, no formato atual.
- **Variáveis de ambiente:** nenhuma. Configuração por `--pasta` e `--porta`.
- **Outros efeitos:** nenhum serviço externo, cron, Keycloak, DNS ou infraestrutura. O painel abre uma porta local em `127.0.0.1`.
- **Como rodar:** Node 24 ou mais novo; em `app/painel`, `npm install` e `npm start`. Abre `http://127.0.0.1:5180/` com os fictícios.
- **Arquivos reais:**
  - `npm start -- --pasta <pasta com os arquivos de uma empresa>`;
  - os arquivos baixados pela `apuracao-cbs` ficam em `app/apuracao-cbs/.local/arquivos/` **do checkout ou worktree onde o comando rodou**. Num worktree (`.claude/worktrees/NNN-slug`), essa pasta é apagada quando o worktree é removido. **Antes de remover o worktree da 029 ou da 030**, o responsável copia os arquivos que quer manter para uma pasta durável fora do repositório (por exemplo, uma pasta por empresa nos documentos dele) ou para `app/apuracao-cbs/.local/arquivos/` do checkout principal, sempre fora do git;
  - uma pasta por empresa (CA-3). Os arquivos de pagamentos e os de nome fora do padrão são ignorados e listados.
- **Antes:** nada. **Depois:** nada.
- **Como voltar:** parar o processo (Ctrl+C). O painel não grava nada; não há o que desfazer.

## Estratégia de verificação

Comandos, em `app/painel`: `npm test` (vitest), `npm run lint` (oxlint), `npm run build` (tsc), `npm run gerar-ficticios`, `npm start`. Os testes não usam rede nem `.env`: o `setup` substitui `fetch` por uma função que falha, como na `apuracao-cbs`, e só o teste do servidor abre um socket, em `127.0.0.1` e porta 0. Os testes são escritos antes do código (primeiras Tasks), a partir dos CA.

| CA | Como se prova |
|---|---|
| CA-1 | Leitura dos fictícios e de cópias dos fixtures da `apuracao-cbs`: campos ausentes, números `1`, `1.5`, `1.50`, datas com 0, 3 e 6 casas de fração e fuso; arquivo com BOM |
| CA-2 | Validação: `ni` de 14 dígitos aceito com divergência e o texto da marca; `ni` de 13 dígitos, `ni` com letra, `ni` de 14 mais outro erro, três casas decimais, JSON ilegível, todos recusados com motivo; os outros arquivos continuam somados; sha256 dos schemas copiados igual ao `versoes.json` |
| CA-3 | Raiz de `ni` com 8 e com 14 dígitos coincide; duas raízes, nenhum valor em nenhuma rota e a lista dos divergentes em `/arquivos`; arquivo recusado não gera conflito |
| CA-4, CA-D1 | Mesmo crédito em dois arquivos: vence `atualizacao` mais recente; empate por `geradoEm`; empate por nome; o mesmo arquivo duas vezes não muda nenhum total; idem débitos e itens de recolhimento |
| CA-5 | `geradoEm` mais recente, contagem e intervalo de `atualizacao` por serviço; o texto não contém "8 dias" |
| CA-6 | Pasta só com arquivo vazio e pasta sem créditos: texto do estado vazio e nenhum "R$ 0,00" na área de totais |
| CA-7 | Totais por período e gerais conferidos à mão nos fictícios pequenos; quatro totais e nomes oficiais presentes; nenhum total igual à soma de outros por construção (teste com valores em que `apropriado` ≠ `utilizado` + `saldoCredor`) |
| CA-8, D-3 | Varredura do HTML de todas as rotas, com todos os fictícios: nenhuma ocorrência de "disponível", "pode usar", "pode ser usado", "confirmado", "liberado" |
| CA-9 | Texto de só CBS na página inicial |
| CA-10 | Filtros isolados e combinados, ordenação nos dois sentidos, busca, paginação (100 por página, total do filtro inteiro, página fora do intervalo); com o arquivo gerado de volume |
| CA-11 | Detalhe com todos os campos presentes, ausentes como "não veio no arquivo", recolhimentos ligados e a marca de chave presente nos débitos |
| CA-12 | Emitente do recolhimento; da chave (se F-1); divergência recolhimento × chave; recolhimentos divergentes; documento 91; modelo da chave diferente do `documento`; mesma raiz da empresa; chave fora do formato |
| CA-13 | Origens diferentes de normal marcadas e somadas como vêm, inclusive valor negativo; emissão fora do mês sem alteração |
| CA-14, CA-15 | Grupos, ordem, grupos fixos, linha de negativos, soma igual ao total do CA-7, percentual de não identificado; texto fixo presente e nenhuma frase sobre recolhimento do emitente |
| CA-16 | Somas exatas com valores que dão erro em ponto flutuante (`0.1 + 0.2`); formatação de positivo, negativo, zero e milhar; nenhum `parseFloat`, `Number(` em valor ou `toFixed` sobre `number` no núcleo (varredura do código) |
| CA-17, CA-D3 | Todos os fictícios válidos (com a tolerância); `gerar-ficticios` reproduz exatamente os arquivos versionados; cada caso listado no CA-17 tem um teste que o encontra nos fictícios; dígito verificador de todo NI e emitente fictício inválido |
| CA-18 | `.gitignore` da raiz cobre `.local/`; README manda guardar reais fora do repositório. Manual: `git check-ignore app/painel/.local/x.json` |
| CA-19 | Varredura do código: sem `process.env`, sem `fetch`, `node:https`, `node:net` (exceto o `node:http` do servidor), sem endereço da Receita, sem leitura de `.env` |
| CA-20, CA-21, CA-23 | Conferência do Reviewer nos arquivos de documentação |
| CA-22 | `npm test`, `npm run lint` e `npm run build` sem erro |
| CA-D2 | Totais de débitos por período e geral; texto de não haver saldo líquido; nenhum valor de débito somado a crédito (fictício com nota nos dois lados) |
| CA-A1 | Teste do servidor: endereço de escuta é `127.0.0.1`; `Host` estranho recebe 421; `POST` recebe 405; cabeçalhos CSP e `nosniff` presentes. Manual: abrir `http://127.0.0.1:5180/` |
| CA-A2 | Sem `--pasta`, usa os fictícios; com `--pasta` numa cópia temporária, um arquivo novo aparece no pedido seguinte sem reiniciar; arquivo alterado é relido |
| CA-A3 | Hash, tamanho e data de modificação de todos os arquivos da pasta iguais antes e depois de percorrer todas as rotas; varredura do código sem `writeFile`, `rename`, `unlink`, `rm`, `mkdir` em `src/` |
| Desempenho | Com os fictícios de volume (cerca de 900 créditos e 2.800 débitos): primeira carga e `/creditos?pa=11/2026` abaixo de 2 s; recarga sem mudança na pasta não relê arquivo (contagem de leituras). Limite largo para não depender da máquina |

Conferência manual, no navegador, antes do PR: as cinco páginas com os fictícios; um arquivo inválido na pasta; e, se o responsável quiser, com a pasta real dele, só na máquina dele, sem print nem cópia de valor para o PR.

## Perguntas em aberto

- **F-1 (bloqueante): fonte oficial do leiaute da chave de 44 dígitos.** Não há nada no repositório. Precisa ser registrado em `docs/referencias/documentos-fiscais/README.md`, com título, versão, data, URL e a seção citada, de:
  - **NF-e e NFC-e (modelos 55 e 65):** "Manual de Orientação do Contribuinte (MOC)" do Projeto NF-e, versão vigente, publicado pelo ENCAT e pela Receita Federal no Portal Nacional da NF-e (`www.nfe.fazenda.gov.br`), seção da chave de acesso; e a Nota Técnica do Projeto NF-e que trata do CNPJ alfanumérico, se alterar a chave;
  - **CT-e (modelo 57):** "Manual de Orientação do Contribuinte do CT-e", versão vigente, Portal Nacional do CT-e (`www.cte.fazenda.gov.br`), seção da chave de acesso;
  - **NFCom (modelo 62):** "Manual de Orientação do Contribuinte da NFCom", versão vigente, no portal da NFCom.

  De cada um deve constar: a tabela de campos da chave (posição inicial, tamanho, conteúdo), em especial o campo do emitente e o do modelo; se o emitente pode ser CPF e como ele aparece; se o campo do emitente admite letras (CNPJ alfanumérico) e desde quando; e o cálculo do dígito verificador da chave. Recomendação: a sessão ou o responsável obtém os documentos nos portais oficiais e os registra (trecho citado ou PDF, como em `split-payment/`); com isso, a Spec é atualizada só na seção "Emitente" e nos fictícios. Se não forem obtidos, a D-4 manda voltar ao usuário: seguir só com recolhimento (visão por emitente vazia com dados reais) ou esperar.
- **F-2: nomes dos tipos de documento e das origens.** Os schemas trazem só os códigos. Os nomes estão em `app/apuracao-cbs/src/tabelas.ts`, transcritos na demanda 029 das páginas `credito.html` e `debito.html` versão 1.3 (13/11/2026), mas não em `docs/referencias/`. Recomendação: aceitar essa transcrição como fonte, mostrar o nome oficial como está (por exemplo, `DEVOLUCAO_POR_PCONT`) com o código ao lado, e copiar as duas tabelas para `docs/referencias/apuracao-cbs/README.md` nesta demanda, com a página e a versão. Código fora da tabela aparece como "código <n> (sem nome na tabela)".
