# 030-painel-primeira-versao — Spec

- **Status:** spec-aprovada
- **US:** [`us.md`](us.md), aprovada em 2026-11-24 (decisões D-1 a D-8)
- **Spec aprovada:** 2026-11-24, pelo responsável ("Aprovo a Spec"), sobre a versão do commit `dab51b5`, com as decisões técnicas DT-1 a DT-10 e a decisão F-2 (ver "Perguntas em aberto")

> **Leiaute da chave (antiga F-1): resolvido.** As fontes oficiais foram localizadas pela sessão em 2026-11-24 e estão em "Fontes do leiaute da chave". **Nomes das tabelas de documento e origem (antiga F-2): decidido** na aprovação da Spec (ver "Perguntas em aberto").

## Critérios de aceite atendidos

Todos os CA da US: CA-1 a CA-23, CA-D1 a CA-D3 e CA-A1 a CA-A3. O CA-12 e o CA-14 usam o recolhimento e a chave de 44 posições, com as fontes F-A a F-E (D-4).

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
│   │   ├── emitente.ts       # recolhimento e chave (D-4, fontes F-A a F-E)
│   │   ├── saldo.ts          # quatro totais por período (CA-7)
│   │   ├── pendencias.ts     # grupos por emitente (CA-14)
│   │   ├── lista.ts          # filtro, ordenação, busca, paginação (CA-10)
│   │   ├── debitos.ts        # totais de débitos (CA-D2)
│   │   └── datas.ts          # exibição textual de datas, sem conversão de fuso
│   └── paginas/              # layout, saldo, creditos, detalhe, pendencias, arquivos, erro, vazio, estilo.ts (CSS; alterado na revisão, ajuste 11)
└── test/
```

#### Configuração e execução (CA-A1, CA-A2, CA-19)

- `npm start -- [--pasta <caminho>] [--porta <n>]`. Sem `--pasta`, usa `dados/ficticios/`. Sem `--porta`, usa `5180`. O caminho pode ser absoluto ou relativo à pasta da aplicação.
- Não há `.env` nem variável de ambiente lida pelo painel. Os agentes não criam `.env` (`AGENTS.md`), e o painel não precisa de segredo.
- Na partida, o painel escreve no terminal o endereço (`http://127.0.0.1:<porta>/`) e o caminho absoluto da pasta. Não registra conteúdo de arquivo no terminal.
- Pasta inexistente ou ilegível: o servidor sobe e todas as páginas dizem que a pasta não pôde ser lida, com o caminho e o código do erro do sistema, e orientam conforme o código. Não cria a pasta. *(Alterado na revisão: ajuste 10.)*

#### Servidor (CA-A1, CA-A3, CA-19)

- `listen` em `127.0.0.1` (nunca `0.0.0.0` nem `::`). Porta ocupada encerra com mensagem e código 2.
- O cabeçalho `Host` precisa ser `127.0.0.1:<porta>` ou `localhost:<porta>`; com `--porta 80`, também `127.0.0.1` e `localhost` sem porta. Qualquer outro recebe 421, o que protege contra *DNS rebinding*. *(Alterado na revisão: ajuste 9.)*
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

Todas as páginas têm o mesmo cabeçalho: nome do painel, raiz do CNPJ formatada (`12.345.678`), data dos dados (CA-5) e um aviso único com link para `/arquivos` quando há arquivo recusado, ignorado ou aceito com divergência, com as contagens separadas (recusados, que não entram nos totais; ignorados; aceitos com divergência conhecida). *(Alterado na revisão: ajuste 4.)* Com conflito de empresas (CA-3), todas as rotas, menos `/arquivos` e `/estilo.css`, mostram só o erro e a lista dos arquivos divergentes.

#### Arquivos e serviço (CA-1, CA-2)

- O painel lê os `*.json` da pasta, sem descer em subpastas. Entrada `.json` que não é arquivo, ou cujo `stat` ou leitura falha, aparece em `/arquivos` como recusada (com o código do erro do sistema, quando há). `.JSON` em maiúsculas aparece como ignorado (nome fora do padrão). *(Alterado na revisão: ajuste 3.)*
- O serviço vem do nome, no padrão que a `apuracao-cbs` grava: `AAAAMMDDTHHMMSSZ_<servico>_<tiquete>[_<n>].json`. O conteúdo não basta: recolhimentos e pagamentos têm a mesma raiz (`apuracao[].dataArrecadacao` e `pagamentos`), e arquivo vazio não tem nada que indique o serviço.
- Serviços usados: `creditos`, `recolhimentos`, `debitos`. Arquivo de `pagamentos` aparece em `/arquivos` como "ignorado: serviço não usado pelo painel". Nome fora do padrão aparece como "ignorado: nome fora do padrão da apuracao-cbs".
- BOM inicial é aceito, como na `apuracao-cbs`.

#### Validação com a tolerância do `ni` (CA-2, D-2)

Mesma validação da `apuracao-cbs`: ajv 2020-12 com `ajv-formats` sobre as cópias dos schemas oficiais, mais a checagem no texto original de que nenhum número monetário tem mais de duas casas nem notação exponencial. A tolerância é um filtro sobre os erros, sem tocar no schema:

- um erro é tolerado só se `instancePath` for exatamente `/ni`, a regra violada for `pattern` e o valor casar com `^\d{14}$`;
- se todos os erros forem tolerados, o arquivo é **aceito com divergência conhecida do schema 1.0.0**, com o texto "`ni` com 14 dígitos (o schema exige 8)";
- qualquer outro erro recusa o arquivo, e o motivo lista até 20 divergências, como na `apuracao-cbs`, seguidas de "e mais N divergências" quando há mais *(alterado na revisão: ajuste 3)*. `niConsumidor` não tem tolerância: o schema já aceita 11 ou 14 dígitos.

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

#### Emitente (CA-12, CA-14, D-4)

Fontes: F-A a F-E, em "Fontes do leiaute da chave", registradas em `docs/referencias/documentos-fiscais/README.md` na implementação. A leitura pela chave vale só para os documentos 55, 57, 62 e 65. O documento 91 e qualquer outro código ficam "emitente não identificado", com o motivo "leiaute da chave deste tipo de documento sem fonte registrada", porque o leiaute da chave da NFS-e nacional (50 posições) não foi confirmado. *(Alterado na revisão: ajuste 8.)*

Ordem para cada nota de crédito:

1. **Recolhimento.** Se houver item de recolhimento com `chaveDFE` igual à `chave`, o emitente é o `niFornecedor` dele, com o rótulo "CNPJ do fornecedor, informado no recolhimento". Se houver itens com `niFornecedor` diferentes para a mesma chave, o emitente fica "não identificado (recolhimentos divergentes)", e o detalhe lista todos.
2. **Chave da nota.** Os passos são feitos em ordem; o primeiro que falha encerra com "emitente não identificado", e o motivo entre parênteses aparece no detalhe da nota.
   1. **Formato.** A chave precisa casar com `^[0-9]{6}[A-Z0-9]{12}[0-9]{26}$` (44 posições; F-D, item 5). Se não casar: "(chave fora do leiaute de 44 posições)". O schema oficial da apuração não restringe o formato de `chave` (só tamanho de 1 a 100), então chave com letras passa na validação e chega a este passo.
   2. **Modelo.** As posições 21–22 precisam ser iguais ao `documento` do crédito. Se não forem: "(modelo na chave diverge do tipo de documento)".
   3. **Dígito verificador.** A posição 44 precisa ser igual ao DV calculado sobre as 43 primeiras: módulo 11, pesos de 2 a 9 da direita para a esquerda, cada caractere convertido pelo código ASCII menos 48, DV = 11 − resto, e resto 0 ou 1 dá DV 0 (F-A, 2.2.6.2; F-B, 7.3; F-C, 5.3; F-D, item 5, que mantém o cálculo e acrescenta a conversão; para chave só com dígitos o resultado é o mesmo). Se não bater: "(dígito verificador da chave inválido)".
   4. **Série, modelos 55 e 65.** A série são as posições 23–25.
      - Modelo 55, série de 890 a 899 (NFA-e): a chave traz o CNPJ da SEFAZ, não o do remetente (F-A, Tabela 2-4). Resultado: "(nota fiscal avulsa: a chave traz o CNPJ do fisco)".
      - Modelo 55, série de 910 em diante: reservada para emitente pessoa física, cujo CPF consta na chave precedido de zeros até completar 14 posições (F-A, 2.2.6.1 e Tabela 2-4). Se as posições 7–9 forem `000` e as posições 10–20 forem 11 dígitos, o emitente é o CPF (posições 10–20), com o rótulo "CPF do emitente, lido da chave da nota". Senão: "(série de emitente CPF sem CPF na chave)".
      - Modelo 65, série de 890 em diante: as fontes não confirmam se a NFC-e admite CPF ou nota avulsa nessas séries. Resultado: "(série sem regra confirmada para NFC-e)".
   5. **CT-e, modelo 57.** A F-B admite CPF do emitente na NFF (2.1.6), com zeros à esquerda, mas a chave não traz campo que distinga CPF de CNPJ. Se as posições 7–9 forem `000`, o painel não decide: "(CT-e com CPF ou CNPJ não distinguível pela chave)". Custo: um CT-e de CNPJ que comece com `000` também cai aqui.
   6. **CNPJ.** Nos demais casos, o emitente são as posições 7–20: CNPJ, que pode ter letras maiúsculas nas posições 7–18 desde julho de 2026 (F-D, item 4; F-E), com o rótulo "CNPJ do emitente, lido da chave da nota". O painel não confere o dígito verificador do CNPJ: a chave já passou pelo DV dela, e a regra do DV do CNPJ não está nas fontes registradas.
3. **Demais casos:** "emitente não identificado".

As posições absolutas (emitente 7–20, modelo 21–22, série 23–25, DV 44) são **derivadas** da ordem e do tamanho dos campos nas tabelas das fontes, que não trazem coluna de posição; a expressão regular da F-D confirma a conta. Nos arquivos reais (O-6, O-16, O-23), as chaves de 44 posições eram só dígitos, as posições 21–22 repetiam o `documento` e as posições 7–20 tinham o padrão de CNPJ do emitente: evidência compatível com a regra, não fonte dela.

**Prioridade e grupos.** Quando o recolhimento e a chave dão emitentes diferentes, vale o recolhimento, e o detalhe mostra os dois (DT-6). Emitente CNPJ com a mesma raiz da empresa (os 8 primeiros caracteres do CNPJ iguais à raiz do `ni`) vai para "emitida pela própria empresa" (CA-12, CA-14). CPF nunca é da própria empresa. Nas pendências, cada CNPJ ou CPF é um grupo, e o rótulo diz se é CNPJ ou CPF e de onde veio. O detalhe da nota também mostra se a mesma chave aparece nos débitos (O-25), sem compensar nada.

**Exibição.** CNPJ formatado `AA.AAA.AAA/AAAA-DD`, com as letras como vierem; CPF `DDD.DDD.DDD-DD`. O CPF é dado pessoal do emitente: aparece só no painel local, nunca em log, teste, documento ou PR.

#### Fontes do leiaute da chave

Lidas pela sessão nos portais oficiais em 2026-11-24. Na implementação, são registradas em `docs/referencias/documentos-fiscais/README.md` com título, versão, data, URL e seção, mais a tabela de composição com as posições marcadas como derivadas e a lista do que não foi confirmado.

| ID | Documento | Versão e data | URL | Seções usadas |
|---|---|---|---|---|
| F-A | "Sistema Nota Fiscal Eletrônica – Manual de Orientação do Contribuinte – Visão Geral" (NF-e e NFC-e, modelos 55 e 65), Portal Nacional da NF-e | MOC 7.0, novembro/2020 | PDF: <https://www.nfe.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=LrBx7WT9PuA=>; lista: <https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=ndIjl+iEFdE=> | 2.2.6 "Chave de Acesso" (p. 18); 2.2.6.1, Tabela 2-1 (p. 19); 2.2.6.2, DV (p. 19–20); 2.2.8, Tabela 2-4, séries reservadas (p. 21) |
| F-B | "Projeto Conhecimento de Transporte Eletrônico – Manual de Orientação do Contribuinte – Padrões Técnicos de Comunicação do CTe" (modelo 57), Portal Nacional do CT-e | MOC 4.00; capa de agosto/2022, listado no portal como fevereiro/2023 | PDF: <https://www.cte.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=0eu1YksSGXM=>; lista: <https://www.cte.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=YIi+H8VETH0=> | 2.1.4 (p. 8–9); 2.1.6, NFF (p. 9–10); 7.3, DV (p. 78) |
| F-C | "MOC NFCom - Padrões Técnicos de Comunicação" (modelo 62), SVRS | v.1.00a, 11/04/2023 | online: <https://moc.sped.fazenda.pr.gov.br/NFCom/VisaoGeral.html>; lista: <https://dfe-portal.svrs.rs.gov.br/Nfcom/Documentos> | 2.1.3, Tabela 2-1; 5.3, DV |
| F-D | "Nota Técnica Conjunta – CNPJ Alfanumérico – Nota Técnica 2025.001", ENCAT | v1.00, 25/04/2025 | <https://www.nfe.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=5ZkvIZt10mQ=> | item 4 (p. 7), CNPJ `[A-Z0-9]{12}[0-9]{2}`; item 5 (p. 8), chave `[0-9]{6}[A-Z0-9]{12}[0-9]{26}` e DV com ASCII − 48; produção em 06/07/2026 |
| F-E | Nota Técnica 2026.004 (NF-e) e página "CNPJ alfanumérico" da Receita Federal | NT v1.01, junho/2026 | NT: <https://www.nfe.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=BTZQzgsO9Ws=>; Receita: <https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/cnpj-alfanumerico> | produção em 01/07/2026 (NT 2026.004); primeiro CNPJ alfanumérico em 31/07/2026 (Receita) |

Composição da chave de 44 posições (ordem e tamanho das fontes; posições derivadas):

| Campo | NF-e, NFC-e, CT-e (F-A, F-B) | NFCom (F-C) | Posições |
|---|---|---|---|
| UF (`cUF`) | 2 | 2 | 1–2 |
| Ano e mês de emissão (`AAMM`) | 4 | 4 | 3–6 |
| CNPJ do emitente (na NF-e e no CT-e, ou CPF precedido de zeros) | 14 | 14 | 7–20 |
| Modelo (`mod`) | 2 | 2 | 21–22 |
| Série | 3 | 3 | 23–25 |
| Número (`nNF`) | 9 | 9 | 26–34 |
| Forma de emissão (`tpEmis`) | 1 | 1 | 35 |
| Código numérico | `cNF`, 8 | `nSiteAutoriz`, 1, e `cNFCom`, 7 | 36–43 |
| Dígito verificador (`cDV`) | 1 | 1 | 44 |

**Não confirmado** (entra assim na referência; o painel não depende disso ou trata como "emitente não identificado"):

- leiaute da chave da NFS-e nacional (50 posições, documento 91);
- se a NFC-e admite CPF do emitente ou nota avulsa na chave;
- quais letras são vedadas no CNPJ alfanumérico (o painel aceita `A-Z`, como a expressão da F-D);
- a data exata de produção do CNPJ alfanumérico nos documentos (01/07 na F-E × 06/07/2026 na F-D);
- o texto da IN RFB nº 2.229/2024, que não foi aberto;
- a regra do dígito verificador do CNPJ alfanumérico.

#### Lista de créditos (CA-10, CA-13)

- Filtros (parâmetros GET, combináveis): `pa`, `documento`, `emitente` (raiz, CNPJ ou CPF, com ou sem pontuação, ou os valores `nao-identificado` e `propria-empresa`), `pendente=1` (só `aApropriar` maior que zero), `busca` (trecho da chave, só dígitos e letras, de 4 a 50 caracteres). Valor inválido de `pa`, `documento`, `emitente` ou `busca` é ignorado e avisado. *(Alterado na revisão: ajuste 6.)*
- Ordenação: `ordem=emissao|aApropriar`, `sentido=asc|desc`. Padrão: emissão decrescente. Empate pela chave.
- Paginação: 100 notas por página, `pagina=N`, com total de notas e de páginas e o total a apropriar do filtro inteiro (não só da página).
- Colunas do CA-10. Linha com origem diferente de normal tem a marca "origem: <nome>". Linha com emissão fora do mês do `pa` não tem tratamento especial (CA-13).
- Página fora do intervalo mostra a última página.

#### Pendências (CA-14, CA-15)

- Notas com `aApropriar` maior que zero, agrupadas pelo emitente do CA-12. Grupos fixos "emitente não identificado" e "emitida pela própria empresa" aparecem mesmo vazios. Ordem: total decrescente, empate pela quantidade e depois pelo número. O rótulo do grupo mostra todas as fontes de identificação presentes nele (recolhimento, chave ou as duas). *(Alterado na revisão: ajuste 7.)*
- Notas com `aApropriar` negativo (possíveis pela D-6, nunca observadas) ficam numa linha própria, "notas com valor a apropriar negativo", para a soma da tela continuar igual ao total do CA-7. A tela mostra a igualdade.
- Texto fixo da tela: "A Receita informa o valor a apropriar de cada nota, mas não informa o motivo. Esta tela não indica que o emitente deixou de recolher."

#### Débitos (CA-D1, CA-D2)

Mesma leitura, validação, empresa e consolidação. Totais gerais e por período de `apurado`, `extinto` e `saldoDevedor`, num bloco próprio da página inicial, abaixo do saldo de crédito, com o texto: "Débitos das vendas, mostrados à parte. O painel não calcula saldo líquido entre crédito e débito." Não há lista de notas de venda.

#### Datas e data dos dados (CA-5)

- Exibição textual a partir da string do arquivo (`dd/mm/aaaa hh:mm`, com o fuso do arquivo ao lado). Sem conversão de fuso nem objeto `Date` para exibição.
- Por serviço: `geradoEm` mais recente, quantidade de arquivos usados, menor e maior `atualizacao`. Texto: "A visão é só a dos arquivos lidos. A Receita não fornece histórico por esta API."
- Estado vazio (CA-6): "A Receita não devolveu créditos nos arquivos lidos.", no lugar dos totais, quando não há arquivo de créditos ou todos vêm vazios. Havendo arquivo de créditos recusado ou ignorado, a tela diz quantos arquivos não entraram nos totais, com link para `/arquivos`, em vez de atribuir o vazio à Receita. O mesmo vale para os débitos. *(Alterado na revisão: ajuste 5.)*

#### Aparência (D-8)

Uma folha servida em `/estilo.css`, escrita em `src/paginas/estilo.ts` *(alterado na revisão: ajuste 11)*, com variáveis tiradas das cores usadas na landing (`app/landing-page/src`): fundo `#060a13`, superfícies `#0e1524` e `#111827`, borda `#1e293b`, texto `#e2e8f0`, texto secundário `#94a3b8` e `#64748b`, destaque `#10b981` e `#047857`, alerta `#fbbf24`; fonte Inter com *fallback* `system-ui`, sem carregar fonte externa. Layout para tela de computador, a partir de 1280 px, com tabelas largas e rolagem horizontal abaixo disso. Sem Tailwind, sem Vite: CSS escrito à mão, servido pelo próprio servidor.

#### Fictícios (CA-17, CA-D3)

- `dados/ficticios/` com arquivos no padrão de nome da `apuracao-cbs`, em duas partes:
  - **escritos à mão**, pequenos, um por caso: as origens diferentes de normal; o mesmo crédito em dois arquivos com valores diferentes; recolhimentos com e sem `chaveDFE`; apropriado não utilizado; `ni` de 8 dígitos; arquivo vazio; débitos com `extinto` e a nota presente nos dois lados;
  - **gerados** por `npm run gerar-ficticios` (script determinístico, sem aleatoriedade não semeada, saída versionada): o arquivo de volume com cerca de 900 créditos, um período concentrando quase tudo, a mistura de documentos da O-6, a forma da O-9 a O-15; e um arquivo de débitos com cerca de 2.800 notas em 3 períodos, com a mistura de estabelecimentos da O-23.
- Os casos de erro ficam em `test/fixtures/` (fora da pasta padrão) *(alterado na revisão: ajuste 11; a pasta padrão abre com o aviso de divergência conhecida, pelos fictícios com `ni` de 14 dígitos)*: arquivo de outra empresa, arquivo inválido por outro motivo, JSON ilegível, nome fora do padrão, arquivo de pagamentos.
- Identificadores fictícios: NIs e emitentes com dígito verificador de CNPJ propositalmente errado; chaves de 44 posições com DV correto (para o emitente ser lido) e UF que não seja código da tabela de UFs do MOC (por exemplo, `99`), mais casos com DV errado, modelo divergente, série 890–899, série de CPF, CT-e começando com `000`, chave com letras nas posições 7–18 e chave de 50 posições; CPFs fictícios com dígito verificador errado; tíquetes e DARFs com o prefixo `FICT` (o DARF fictício tem 17 dígitos começando por `99999`; alterado na revisão, ajuste 11). Um teste recalcula o dígito verificador do CNPJ e do CPF (módulo 11) de todo NI e de todo emitente só com dígitos dos fictícios e falha se algum for válido; CNPJ fictício com letras usa um prefixo como `FICT`. Esse cálculo serve só para garantir que o dado de teste não é real, não é regra do produto.

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
- `docs/referencias/documentos-fiscais/README.md` (novo): as fontes F-A a F-E com título, versão, data, URL e seção; a tabela de composição da chave com as posições marcadas como derivadas; as regras de CPF, NFA-e, letras e DV, cada uma com a seção; e a lista do que não foi confirmado (seção "Fontes do leiaute da chave"). Entra no `docs/README.md` e na tabela de referências do `PROJECT_CONTEXT.md` (§10).
- Tabelas de documento e origem em `docs/referencias/apuracao-cbs/README.md`, com a página e a versão de origem (decisão F-2).

## Contratos

Estruturas do núcleo, entre o núcleo e as páginas (nomes indicativos; os tipos finais são da implementação):

| Estrutura | Campos principais | CA |
|---|---|---|
| `ArquivoLido` | `nome`, `servico` (`creditos`, `recolhimentos`, `debitos`, `pagamentos` ou nenhum), `situacao` (`aceito`, `aceito-com-divergencia`, `recusado`, `ignorado`), `motivos[]`, `geradoEm`, `raiz`, `quantidade` | CA-2, CA-3, CA-5 |
| `Nota` (crédito) | `pa`, `chave`, `documento`, `origem`, `emissao`, `registro`, `atualizacao`, `valores` (mapa do caminho oficial, por exemplo `cbs.apropriacao.aApropriar`, para `Big` ou ausente), `arquivo` | CA-4, CA-10, CA-11 |
| `Emitente` | `tipo` (`identificado`, `propria-empresa`, `nao-identificado`), `documento` (`cnpj`, `cpf`), `numero`, `fonte` (`recolhimento`, `chave`), `motivo` (quando não identificado) | CA-12 |
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

- **Regra conservadora do emitente.** NFC-e em série 890 ou acima, CT-e com emitente começando em `000` e todo documento 91 ficam "não identificado". Nos arquivos reais, o documento 91 é 15% das notas de crédito.
- **CNPJ alfanumérico em `ni` e `niFornecedor`.** Os schemas 1.0.0 só aceitam dígitos nesses campos, e a tolerância da D-2 também (`^\d{14}$`). Se a Receita mandar letras, o arquivo é recusado e aparece em `/arquivos`; aceitar isso exige decisão nova. Na chave, letras já são aceitas (F-D).
- **Posições derivadas.** As fontes dão ordem e tamanho, não posições. Um erro de conta apareceria nos testes de modelo (21–22) e de DV (44); nos arquivos reais, o modelo nas posições 21–22 bateu com o `documento` (O-6).
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
| CA-12 | Emitente do recolhimento; da chave (CNPJ só com dígitos, CNPJ com letras, CPF em série 910 ou acima); divergência recolhimento × chave; recolhimentos divergentes; documento 91; chave fora do formato; modelo divergente; DV inválido (cálculo conferido com chave só de dígitos e com letras); série 890–899; série de CPF sem zeros; NFC-e em série 890 ou acima; CT-e com `000`; mesma raiz da empresa; CPF nunca "própria empresa"; rótulos "lido da chave da nota" e "informado no recolhimento" |
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

## Ajustes da revisão (2026-11-24)

> Estes ajustes foram decididos pela sessão durante a revisão (duas rodadas de correção, commits `01e025e..5e43e96`), a partir de achados dos revisores. A aprovação da Spec pelo responsável (commit `dab51b5`) é anterior a eles; serão apresentados ao usuário no PR. Os trechos da Spec que ficaram contraditórios foram corrigidos e marcados com "alterado na revisão"; o resto da Spec não mudou.

| # | Ajuste | CA | Onde |
|---|---|---|---|
| 1 | Arquivo válido pelo schema, mas com `geradoEm`, `atualizacao`, `emissao` ou `registro` num formato de data-hora que o painel não lê (o schema aceita, por exemplo, fuso sem dois-pontos, `t`/`z` minúsculos ou espaço no lugar do `T`), é recusado com motivo próprio, que diz o caminho do campo e o formato esperado (`aaaa-mm-ddThh:mm:ss`, fração opcional de até 9 dígitos, `Z` ou `±hh:mm`). É recusa a mais, não tolerância: o "nenhuma outra" do CA-2 continua valendo. | CA-2, CA-5 | `src/nucleo/validacao.ts` (`checarDatas`) |
| 2 | JSON com mais de 64 níveis de aninhamento é recusado com o motivo fixo "o conteúdo não pôde ser verificado: estrutura aninhada demais", antes das checagens recursivas (que estourariam a pilha e derrubariam as rotas). | CA-2 | `src/nucleo/validacao.ts` (`PROFUNDIDADE_MAXIMA`, `profundidadeDe`, `MOTIVO_ANINHADO`) |
| 3 | Entrada `.json` que não é arquivo entra em `/arquivos` como recusada ("a entrada não é um arquivo"); falha de `stat` ou de leitura entra como recusada com o código do erro do sistema (por exemplo, `EBUSY`). Falha de E/S é transitória: não vai para o cache nem para a memória da visão, e o arquivo é relido no pedido seguinte. Erro que não é de E/S é defeito do painel: propaga, a resposta é 500 e o servidor registra em stderr o nome do erro, a rota sem a query, a pilha e a mensagem truncada em 200 caracteres. `.JSON` em maiúsculas aparece como ignorado (nome fora do padrão). Recusa com mais de 20 divergências mostra "e mais N divergências". | CA-1, CA-2, CA-A2 | `src/nucleo/arquivos.ts` (`lerPasta`, `lerUm`, `codigoDeSistema`); `src/rotas.ts` (memória da visão); `src/servidor.ts` (`registrarErro`) |
| 4 | O aviso do cabeçalho continua único, com contagens separadas: recusados (que não entram nos totais), ignorados e aceitos com divergência conhecida do schema 1.0.0. Arquivo ignorado também acende o aviso. | CA-2, CA-5 | `src/paginas/layout.ts` (`aviso`) |
| 5 | Estado vazio: o texto do CA-6 vale quando não há arquivo do serviço ou todos vêm vazios. Havendo arquivo do serviço recusado ou ignorado, a tela diz quantos arquivos não entraram nos totais, com link para `/arquivos`, sem atribuir o vazio à Receita. Vale para créditos e débitos. | CA-6, CA-D2 | `src/paginas/vazio.ts`; `src/nucleo/visao.ts` (`naoEntraram`) |
| 6 | Lista: valor inválido de `pa`, `documento` ou `emitente` gera aviso (antes, só a `busca`). `emitente` aceita CNPJ ou CPF com pontuação (`.`, `/`, `-` são retirados antes da conferência). | CA-10 | `src/nucleo/lista.ts` (`lerConsulta`) |
| 7 | Pendências: o grupo mostra todas as fontes de identificação presentes nele (um mesmo emitente pode vir do recolhimento numa nota e da chave em outra). | CA-12, CA-14 | `src/nucleo/pendencias.ts` |
| 8 | Motivo do documento 91 e de qualquer documento sem leiaute: "leiaute da chave deste tipo de documento sem fonte registrada" (o texto anterior usava "confirmado", vedado pelo CA-8). | CA-8, CA-12 | `src/nucleo/emitente.ts` (`MOTIVOS.semLeiaute`) |
| 9 | Servidor: com `--porta 80`, o `Host` sem porta (`127.0.0.1` ou `localhost`) é aceito, porque o navegador omite a porta 80. | CA-A1 | `src/servidor.ts` (`hostAceito`) |
| 10 | Erro de leitura da pasta mostra o código do erro do sistema e orienta conforme ele: `EACCES`/`EPERM`, conferir permissões; `ENOENT`/`ENOTDIR`, conferir o caminho; outro código, conferir se a pasta está acessível e não está em uso. | CA-A1, CA-A2 | `src/nucleo/arquivos.ts` (`lerPasta`); `src/paginas/erro.ts` (`orientacaoPasta`) |
| 11 | Divergências dos fictícios e da estrutura, aceitas pelo Reviewer: o DARF fictício tem 17 dígitos começando por `99999` (não o prefixo `FICT`); o CSS fica em `src/paginas/estilo.ts`, servido em `/estilo.css`; a pasta padrão abre com o aviso de divergência conhecida (fictícios com `ni` de 14 dígitos); `app/painel` tem `.gitignore` próprio (`.local/`, `node_modules/`, `dist/`); `npm run gerar-ficticios` roda `node scripts/gerarFicticios.ts`. | CA-17, CA-18, D-8 | `dados/ficticios/`; `src/paginas/estilo.ts`; `app/painel/.gitignore`; `package.json` |

## Perguntas em aberto

- **F-1 (resolvida em 2026-11-24):** fontes F-A a F-E, na seção "Fontes do leiaute da chave". O que elas não confirmam está listado lá e cai em "emitente não identificado".
- **F-2 (decidida em 2026-11-24, na aprovação da Spec): nomes dos tipos de documento e das origens.** Os schemas trazem só os códigos. Os nomes estão em `app/apuracao-cbs/src/tabelas.ts`, transcritos na demanda 029 das páginas `credito.html` e `debito.html` versão 1.3 (13/11/2026). Decisão: essa transcrição é aceita como fonte; o painel mostra o nome oficial como está (por exemplo, `DEVOLUCAO_POR_PCONT`) com o código ao lado; as duas tabelas são copiadas para `docs/referencias/apuracao-cbs/README.md` nesta demanda, com a página e a versão. Código fora da tabela aparece como "código <n> (sem nome na tabela)".

Nenhuma pergunta em aberto sobre a Spec.
