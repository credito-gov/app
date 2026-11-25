# Design system do produto CreditoGov

Design system do produto (login, dashboard e telas seguintes), aprovado pelo responsável em 2026-11-25 na demanda [032](../demandas/032-design-system-produto/us.md). Substitui o design system anterior, que descrevia o tema claro da primeira landing e não vale mais.

- **Fonte dos valores:** [`tokens/tokens.json`](tokens/tokens.json) e [`tokens/tokens.css`](tokens/tokens.css), com os mesmos nomes e valores. Este documento cita os nomes e os valores deles; se divergirem, vale o arquivo de tokens.
- **CSS de referência dos componentes:** [`tokens/bundle.css`](tokens/bundle.css), CSS puro, classes com prefixo `cg-`.
- **Sem amarra de framework.** Nem os tokens nem o CSS dependem de biblioteca. A stack do produto é decisão da demanda 031: qualquer stack aplica as classes ou copia os valores. O `bundle.css` é referência, não é código de aplicação.
- **Dados das telas são fictícios.** Toda tela de exemplo leva o selo "Exemplo fictício". O CNPJ da empresa de exemplo é `00.000.000/0001-00` ("Comércio Exemplo Ltda."); emitentes de exemplo têm números como `11.111.111/0001-11`.
- **Marcas de provedores.** Os botões "Entrar com Google" e "Entrar com Microsoft" nas telas usam uma letra no lugar da marca. As marcas oficiais entram na implementação, conforme as regras de uso de cada provedor.

Links dos artifacts e das telas: [`README.md`](README.md).

## 1. Princípios

- **O número oficial vem primeiro.** Todo total mostra o rótulo em português e o nome do campo da Receita (`aApropriar`, `apropriado`, `utilizado`, `saldoCredor`) em `mono`, na cor `ink-subtle`.
- **Pendente nunca parece disponível.** O valor a apropriar usa `pending` (âmbar) com ícone de relógio. Nenhum valor de crédito usa verde.
- **Os totais não se misturam.** Os quatro totais ficam em cartões separados. Nenhum é somado a outro nem calculado a partir de outro. Débitos de CBS ficam em bloco à parte, sem saldo líquido.
- **As duas cores do logo.** O verde (`brand`) é marca e ação; o azul-marinho (`navy`, e `info`, que é o azul-marinho ajustado a cada tema) é identidade e dado oficial. Nenhuma das duas pinta valor pendente.
- **Claro primeiro, sóbrio, legível.** Fundo levemente azulado, cartões brancos. O verde nunca colore um número.

## 2. Fundamentos

### 2.1 Cor

A paleta vem do logo (`docs/design/assets/`): verde `#27a671` e azul-marinho `#354363` e `#001955`. Há dois temas com os **mesmos nomes de token**: **claro**, o principal, e **escuro**, disponível e alinhado ao redesign da landing. Cada token tem valor nos dois temas; o componente nunca escolhe cor por tema. No claro, verde e âmbar são escurecidos para passar de 4,5:1 sobre branco. `tokens.css` aplica o claro em `:root` e `[data-theme="claro"]`, e o escuro por `[data-theme="escuro"]`.

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `bg` | `#f5f7fa` | `#060a13` | Fundo da página |
| `surface` | `#eef2f7` | `#0c121e` | Faixas de cabeçalho: topo de cartão e de tabela |
| `surface-raised` | `#ffffff` | `#0e1524` | Cartões, tabelas, painéis, campos |
| `surface-hover` | `#eef2f7` | `#172039` | Linha de tabela e item de navegação sob o ponteiro |
| `line` | `#e2e8f0` | `#1e293b` | Divisórias e contorno de cartão. Decorativa |
| `line-control` | `#7d899f` | `#5b6b91` | Borda de campo, seleção e botão secundário (3,1:1 ou mais) |
| `ink` | `#0b1530` | `#f8fafc` | Texto principal e valores |
| `ink-muted` | `#475569` | `#94a3b8` | Texto secundário, rótulos, cabeçalho de coluna |
| `ink-subtle` | `#5f6b7e` | `#7c8aa0` | Metadados, nome oficial do campo, ajuda, placeholder |
| `brand` | `#1a7d55` | `#27a671` | Verde do logo. Botão primário, link, foco, ícone do item ativo. Nunca em valor de crédito |
| `brand-hover` | `#166b49` | `#2fbf83` | Botão primário sob o ponteiro |
| `brand-strong` | `#047857` | `#047857` | Faixa de destaque com texto branco |
| `brand-soft` / `brand-line` | `#27a6711a` / `#27a67159` | `#27a67126` / `#27a67166` | Fundo e borda do selo de marca |
| `navy` | `#354363` | `#354363` | Azul-marinho do símbolo. Fundo do painel do login, do avatar e dos blocos da capa. No escuro, nunca como texto |
| `navy-deep` | `#001955` | `#001955` | Azul-marinho do "Gov". Texto de marca sobre fundo claro; no escuro, só sobre a placa clara |
| `brand-plate` | `#ffffff` | `#ffffff` | Placa clara que recebe o logo colorido |
| `on-brand` | `#ffffff` | `#060a13` | Texto e ícone sobre `brand` (5,1:1 no claro, 6,4:1 no escuro) |
| `on-navy` | `#ffffff` | `#f8fafc` | Texto sobre `navy` (9,4:1 ou mais) |
| `pending` | `#a14a07` | `#fbbf24` | "A apropriar (pendente)" e atenção: texto, ícone, borda |
| `pending-soft` / `pending-line` | `#fef3c7` / `#f5b54a` | `#fbbf241a` / `#fbbf2440` | Fundo e borda do selo e do alerta de atenção |
| `info` | `#3b5797` | `#8fa3d6` | "Apropriado" e alerta informativo |
| `info-soft` / `info-line` | `#e9eef8` / `#a9b8de` | `#8fa3d61f` / `#8fa3d64d` | Fundo e borda do selo e do alerta informativo |
| `neutral-soft` / `neutral-line` | `#f1f5f9` / `#cbd5e1` | `#94a3b81f` / `#94a3b84d` | Selo neutro: "Já utilizado", "Saldo credor", "Fictício", "Emitente não identificado" |
| `danger` | `#b91c1c` | `#f87171` | Erro: mensagem de campo, alerta, botão destrutivo |
| `danger-soft` / `danger-line` | `#fef2f2` / `#fecaca` | `#f871711a` / `#f8717140` | Fundo e borda do alerta de erro |
| `success` | `#15803d` | `#34d399` | Só resultado de ação do usuário (por exemplo, senha alterada). Nunca em valor de crédito |
| `success-soft` / `success-line` | `#ecfdf5` / `#a7f3d0` | `#34d3991a` / `#34d39940` | Fundo e borda do alerta de sucesso |
| `overlay` | `#0b153066` | `#060a13cc` | Véu atrás de diálogo |

Estados do crédito (decisão D-8 da US):

| Estado | Rótulo | Campo | Cor | Ícone |
|---|---|---|---|---|
| A apropriar | A apropriar (pendente) | `aApropriar` | `pending` (âmbar) | Relógio |
| Apropriado | Apropriado | `apropriado` | `info` (azul-marinho) | Círculo com ponto |
| Já utilizado | Já utilizado | `utilizado` | neutro (`neutral-soft`, `ink-muted`) | Seta de canto |
| Saldo credor | Saldo credor não utilizado | `saldoCredor` | neutro | |
| Emitente não identificado | Emitente não identificado | | neutro | Interrogação |

Nenhum estado de crédito usa `success`. O verde `brand` é marca e ação, não estado.

### 2.2 Tipografia

Família: **Inter** (Google Fonts, pesos 400 a 800), a mesma da landing. Pilha: `Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`. Algarismos tabulares (`font-variant-numeric: tabular-nums`, classe `cg-num`) em todo valor, data e contagem. A monoespaçada do sistema (`ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace`) serve só para a chave do documento fiscal e o número do DARF.

| Estilo | Tamanho / linha | Peso | Uso |
|---|---|---|---|
| `display` | 32px / 40px | 800 | Título da página, um por tela |
| `heading` | 20px / 28px | 700 | Seção ou cartão grande |
| `subheading` | 16px / 24px | 700 | Título de cartão e de diálogo |
| `body` | 14px / 22px | 400 | Texto corrido, células, campos |
| `body-strong` | 14px / 22px | 600 | Ênfase; nome da empresa em foco e rótulos de linha |
| `label` | 12px / 16px | 600 | Rótulo de campo, cabeçalho de coluna, texto de selo |
| `overline` | 11px / 16px | 700 | Caixa alta, espaçamento de letras 0,06em: marca de dado fictício, etiqueta |
| `money-xl` | 36px / 44px | 800 | Valor principal do cartão de total |
| `money-lg` | 20px / 28px | 700 | Valor de cartão secundário e total de grupo |
| `money` | 14px / 22px | 600 | Valor em célula de tabela e linha de detalhe |
| `mono` | 13px / 20px | 400 | Chave de 44 ou 50 dígitos, em blocos de 4 |

### 2.3 Espaçamento, raios, sombras e tamanhos

Base de 4px, a mesma da landing.

| Espaço | Valor | Uso |
|---|---|---|
| `space-1` | 4px | Ícone e texto no selo |
| `space-2` | 8px | Ícone e texto no botão; entre rótulo e campo |
| `space-3` | 12px | Padding vertical de célula; entre selos |
| `space-4` | 16px | Padding de alerta e campo; entre campos |
| `space-5` | 20px | Padding de cabeçalho de cartão |
| `space-6` | 24px | Padding de cartão |
| `space-8` | 32px | Entre blocos da página |
| `space-12` | 48px | Margem do conteúdo em telas largas |

| Raio | Valor | Uso |
|---|---|---|
| `radius-sm` | 6px | Botão pequeno, item da navegação |
| `radius-md` | 8px | Botões, campos, cartão pequeno |
| `radius-lg` | 12px | Alertas e faixas |
| `radius-xl` | 16px | Cartões grandes e tabelas |
| `radius-full` | 9999px | Selos (pílula) |

Sombras: `shadow-card` existe só no claro (`0 1px 2px #0b15300d, 0 1px 3px #0b153014`); no escuro vale `none` e a separação vem de superfície e borda. `shadow-pop` (claro `0 12px 32px #0b15302e`, escuro `0 12px 32px #000000b3`) só no que flutua: menu, diálogo, tooltip.

Tamanhos: `control-sm` 32px (filtros), `control-md` 40px (padrão), `control-lg` 48px (botão Entrar), `appbar-height` 64px, `content-max` 1200px. Os valores de `size` estão no `tokens.json`.

### 2.4 Ícones

Traço no estilo Lucide (24×24, traço 2, pontas arredondadas), em 16px nos controles e 20px na navegação e nos alertas, cor herdada (`currentColor`). A Lucide é a referência, sem amarrar framework. Ícone decorativo leva `aria-hidden`.

### 2.5 Marca

- `logo.png` (colorido) é o logo do produto: no tema claro, direto sobre a superfície; no escuro, sobre a placa clara (`cg-plate`, token `brand-plate`), onde o azul-marinho direto não teria contraste. Usado na barra do topo (40px de altura) e no login.
- `logo-lockup-white.png` (branco; fica nos assets da landing, em `app/landing-page/src/assets/brand/`, e não em `docs/design/assets/`) onde só cabe uma cor.
- `brand.png` é só o nome, colorido, para fundo claro. `icon.png` é só o símbolo (favicon, avatar).
- O logo não é redesenhado, recolorido nem recriado em texto. Os arquivos estão em [`assets/`](assets/).

## 3. Componentes

Todos com foco visível e sem estado comunicado só por cor. As classes citadas estão em [`tokens/bundle.css`](tokens/bundle.css).

### 3.1 Botões

`cg-btn` com variantes `cg-btn-primary`, `cg-btn-secondary`, `cg-btn-ghost` e `cg-btn-danger`; tamanhos `cg-btn-sm` (32px), padrão (40px) e `cg-btn-lg` (48px); `cg-btn-block` ocupa a largura. Estados: padrão, passar o mouse (`brand-hover` no primário), pressionado, foco (`focus-ring`), desabilitado e carregando (`cg-spin`, texto "Entrando…" ou equivalente).

- Texto começa com verbo, em caixa de frase: "Entrar", "Exportar lista", "Tentar de novo".
- O primário usa `brand` com `on-brand`. O secundário contorna com `line-control`.
- **Botão de provedor** (`cg-btn-provider`, marca em `cg-provider-mark`): "Entrar com Google" e "Entrar com Microsoft" na proposta, acima do formulário e separados dele por `cg-divider-text` ("ou com e-mail"). Os provedores finais ficam para a demanda 031. As marcas oficiais entram na implementação, conforme as regras de cada provedor.

### 3.2 Campos

`cg-field` com `cg-label`, `cg-input` (e `cg-input-sm`), `cg-select`, `cg-help` e `cg-error-text`. Tipos: texto, e-mail, senha com mostrar/ocultar, seleção e busca. Estados: padrão, foco, preenchido, erro e desabilitado.

- Rótulo sempre visível, nunca só placeholder. Borda `line-control`.
- Erro ligado ao campo por `aria-describedby`, com texto que diz o que fazer: "Digite um e-mail completo, como nome@empresa.com.br."
- No login, a mensagem de credencial é "E-mail ou senha incorretos", sem dizer qual dos dois, para não revelar se o e-mail tem conta.

### 3.3 Cartões e os quatro totais

`cg-card` (`cg-card-head`, `cg-card-title`, `cg-card-body`), raio `radius-xl`, padding `space-6`. O cartão de total (`cg-total`) tem rótulo (`cg-total-label`), valor em R$ (`cg-total-value`, 28px/36px; a variação `is-xl` usa `money-xl`, 36px/44px), nome oficial do campo (`cg-total-field`, em `mono`) e uma nota (`cg-total-note`).

Os quatro totais, sempre em cartões separados:

| Rótulo | Campo | Nota do cartão (texto das telas) |
|---|---|---|
| A apropriar (pendente) | `aApropriar` | Ainda não liberado pela Receita. Ela informa o valor sem dizer o motivo. |
| Apropriado | `apropriado` | Liberado pela Receita. Parte ou todo pode já ter sido usado. |
| Já utilizado | `utilizado` | Já abateu débito de CBS da empresa. |
| Saldo credor não utilizado | `saldoCredor` | Como a Receita informa. O significado prático está em análise. |

Acima deles, um cartão "Crédito apurado nas compras" (`apurado`) traz o total registrado pela Receita nas notas de compra do recorte, com a contagem de notas, e diz que os quatro valores abaixo vêm de campos separados e não se somam. Débitos de CBS ficam em bloco à parte, sem saldo líquido. O bloco "Pendente por emitente" agrupa o valor a apropriar por emitente, com "Emitente não identificado" e "Emitida pela própria empresa" quando for o caso.

### 3.4 Badges

`cg-badge` com `cg-badge-pending`, `cg-badge-info`, `cg-badge-brand`, `cg-badge-danger` e `cg-badge-fict` ("Exemplo fictício"). Todo badge tem cor, texto e ícone. Os de crédito seguem a tabela da seção 2.1. Nenhum diz "confirmado" ou "disponível", e valor a apropriar nunca usa a cor ou o ícone de sucesso. Situação de dados na carteira: atualizado (`info`), consulta falhou (`danger`), dias sem consulta (`pending`), sem consulta concluída (neutro).

### 3.5 Alertas

`cg-alert` em quatro níveis: informação, sucesso (`cg-alert-success`), atenção (`cg-alert-warning`) e erro (`cg-alert-error`), com ícone, título (`cg-alert-title`), texto (`cg-alert-text`) e ação opcional. Em bloco na página; em linha no campo, com `cg-error-text`. `cg-inline-note` é a nota discreta dentro de um bloco. Aviso permanente nas telas de dados: os dados vêm da API de apuração da CBS da Receita Federal e o IBS ainda não está nessa fonte.

Regras de texto: não afirmar o motivo de uma pendência. Escrever "A Receita informa o valor a apropriar sem dizer o motivo", não "o fornecedor não recolheu". Dizer sempre o que aconteceu e o que fazer.

### 3.6 Valores em R$

`cg-money`, junto de `cg-num` para algarismos tabulares.

- Formato brasileiro com duas casas, `R$ 1.234,56`, alinhado à direita nas colunas.
- Negativo: sinal de menos e texto, sem depender só da cor.
- Zero: `R$ 0,00` só quando a fonte devolveu zero. **Nunca no lugar de "sem dados".**
- Sem dados (`cg-money is-na`): texto "Sem dados", nunca `R$ 0,00`.
- A regra de exibição não altera o valor: o valor continua decimal de precisão fixa, como em [`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) §6.

### 3.7 Tabela

`cg-table-wrap`, `cg-table`, `cg-toolbar` (filtros em `control-sm`), `cg-sort` (ordenação), `cg-pager` (paginação), `cg-row` e `cg-rowlink` (linha que abre o detalhe) e `cg-key` (chave de 44 ou 50 posições em `mono`, em blocos de 4, com quebra ou truncamento e acesso ao valor completo). Cabeçalho em `surface`, cabeçalho de coluna em `label`. Colunas de valor à direita, com `money`. Há tabela vazia e tabela carregando (`cg-skel`). Colunas de exemplo, seguindo a demanda 030: período, tipo de documento, chave, emissão, emitente, apurado, a apropriar, apropriado, utilizado. O emitente aparece só pelo CNPJ lido da chave, formatado e sem nome.

### 3.8 Navegação

Menu no topo (`cg-appbar`, `cg-appbar-logo`, `cg-appbar-end`, `cg-topnav`, `cg-topnav-item`), **sem barra lateral**. Altura mínima `appbar-height` (64px), conteúdo até `content-max`. Item ativo (`[aria-current="page"]`) com texto `ink`, peso 600 e sublinhado inferior `brand`, sem fundo `navy`. Quando este documento divergir dos arquivos de `tokens/`, valem os arquivos: `tokens.json` para valores e `bundle.css` para componentes. Itens do dashboard: Visão geral, Créditos, Pendências, Débitos, Consultas à Receita. À direita: a empresa em foco (`cg-company`, `cg-company-name`, `cg-company-meta` com o CNPJ) com **troca de empresa** (`cg-company-switch`), `cg-avatar` e a saída da sessão. O contador troca de empresa pelo mesmo controle e tem a carteira de clientes (seção 4).

### 3.9 Estados de tela e de componente

- **Vazio** (`cg-empty`, `cg-empty-icon`, `cg-empty-title`, `cg-empty-text`): diz o que faltou. Nunca exibe `R$ 0,00` como se fosse apurado.
- **Carregando** (`cg-skel`, `cg-spin`): esqueleto ou indicador; o movimento é desligado com `prefers-reduced-motion`.
- **Erro**: diz o que aconteceu e o que fazer.
- **Desatualizado**: números anteriores continuam visíveis com a data da consulta e aviso de que não estão atualizados, em atenção (`pending`).
- Foco e desabilitado em todo componente interativo.

Casos do dashboard, cada um num bloco próprio (tela "Dashboard — estados dos dados"): antes da primeira consulta; consulta concluída sem créditos ("A Receita não devolveu créditos", e isto não é saldo de R$ 0,00); atualização falhou com números anteriores; dias sem consulta concluída; um serviço com dados e outro sem; retorno da Receita que não entrou nos indicadores.

## 4. Telas aprovadas

Todas com dados fictícios, em largura de desktop; o login também no celular. Links em [`README.md`](README.md).

| Tela | O que mostra |
|---|---|
| Login | Painel da marca com três mensagens alternadas (ilustração feita de componentes do produto, troca a cada 6 segundos, pausa sob o ponteiro, pontos clicáveis, sem animação com `prefers-reduced-motion`); entrada por Google e Microsoft; e-mail e senha; "Esqueci a senha"; "Ainda não tem acesso? Fale com a equipe CreditoGov ou com o seu contador." Sem credencial de ERP ou da Receita |
| Login, e-mail ou senha incorretos | Alerta de erro sem dizer qual dos dois está errado e o botão em estado carregando |
| Login no celular, sem conexão | Alerta "Sem conexão", botão "Tentar de novo" |
| Dashboard | Recorte por período, datas de atualização de créditos e débitos, "Crédito apurado nas compras", os quatro totais, "Pendente por emitente", débitos à parte |
| Dashboard, estados dos dados | Os casos da seção 3.9 |
| Carteira do contador | Empresas do escritório com a apropriar, apropriado, já utilizado e a situação dos dados de cada uma. Sem total da carteira: valores de empresas diferentes não se somam |

## 5. Acessibilidade

- Meta: **WCAG 2.1 AA**. Texto normal 4,5:1; texto grande, borda de componente e indicador de foco 3:1.
- Contrastes anotados nos tokens (`tokens.json`, campo de uso): `ink` 16:1 ou mais no claro e 14:1 ou mais no escuro; `ink-muted` e `ink-subtle` passam de 4,5:1 sobre as superfícies; `line-control` tem 3,1:1 ou mais; `brand` com `on-brand` 5,1:1 no claro e 6,4:1 no escuro; `pending` 6:1 no claro; `info` 7:1 no claro e 7,9:1 no escuro; `danger` 5,7:1 ou mais. No escuro, o `#64748b` da landing não é usado em texto do produto (3,8:1).
- **Foco:** `focus-ring` (2px da cor do fundo e 2px de `brand`) em todo elemento focável, nos dois temas, nunca removido.
- Cor nunca é o único sinal: todo estado tem texto e, em selos e alertas, ícone.
- Rótulo sempre visível em campo; erro por `aria-describedby`; ícone decorativo com `aria-hidden`.
- Movimento só em carregamento e na alternância do login, desligado com `prefers-reduced-motion`.

## 6. Voz e vocabulário

- Português do Brasil, tratamento por "você", frases curtas, sem exclamação e sem emoji.
- **Os quatro totais nunca são somados** nem calculados um a partir do outro.
- **Débitos à parte**, sem saldo líquido.
- **Nunca** usar "confirmado", "disponível", "pode usar", "a receber" ou "garantido" como rótulo de valor de crédito. Preferir "crédito registrado" e "ainda não liberado pela Receita".
- **Emitente só pelo CNPJ lido da chave**, formatado e sem nome.
- **`R$ 0,00` nunca no lugar de "sem dados".**
- Não afirmar o motivo de uma pendência.
- Nada de número, promessa ou depoimento sem base ([`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) §6). Nenhuma regra de CBS/IBS sem fonte em [`referencias/`](../referencias/).
- Dado de exemplo é sempre fictício e marcado como tal.

## 7. Em aberto

- Provedores finais do login e impacto na arquitetura: demanda 031.
- Qual valor é o saldo utilizável fica em aberto para tributarista (D-3 da demanda 030); por isso nenhum valor de crédito usa verde.
- A landing mantém o tema próprio e ainda usa `#10b981`; alinhar a landing a estes tokens é outra demanda.
