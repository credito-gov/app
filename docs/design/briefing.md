# Briefing para o Claude Design

Contexto do produto CreditoGov para o design do produto, demanda [032](../demandas/032-design-system-produto/us.md) (critério CA-1).

**Como este texto foi feito.** Este briefing foi consolidado **depois** da aprovação visual, a partir do que a sessão da demanda usou para operar o Claude Design. Não é o texto literal enviado à ferramenta: reúne o mesmo contexto num documento só, tirado da US, do [`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) e do [`design-system.md`](design-system.md). Serve de registro e de ponto de partida para as próximas telas. Não contém CNPJ real, credencial, valor real nem regra tributária sem fonte; todo dado de exemplo é fictício.

## 1. O que é o produto e para quem

O CreditoGov é um SaaS B2B para pequenas e médias empresas no regime regular de CBS/IBS. Mostra o crédito de CBS das compras como parte do caixa: quanto existe, de qual nota e de qual emitente veio, e o que ainda está a apropriar. O produto não calcula imposto: lê o que a Receita informa pela API de apuração da CBS.

- **Usuário:** dono ou financeiro de pequena e média empresa.
- **Canal:** o contador, que acompanha várias empresas pela carteira.
- **Escopo:** só CBS. O IBS ainda não está na fonte de dados, e as telas dizem isso num aviso permanente.

## 2. Vocabulário de valores

Os nomes são os da API de apuração da CBS (fonte dos campos: [`referencias/apuracao-cbs/README.md`](../referencias/apuracao-cbs/README.md)).

Os quatro totais, **sempre separados**, cada um com o nome oficial do campo como legenda:

| Rótulo | Campo |
|---|---|
| A apropriar (pendente) | `aApropriar` |
| Apropriado | `apropriado` |
| Já utilizado | `utilizado` |
| Saldo credor não utilizado | `saldoCredor` |

Regras:

- Os quatro valores nunca são somados num número só, nem um é calculado a partir dos outros.
- **Débitos de CBS ficam à parte**, em bloco próprio, **sem saldo líquido**.
- **Pendências são agrupadas por emitente.** O emitente aparece só pelo CNPJ lido da chave da nota, formatado, sem nome. Casos especiais: "Emitente não identificado" e "Emitida pela própria empresa".
- Valor sem dados nunca aparece como `R$ 0,00`: aparece como "Sem dados". Zero só quando a fonte devolveu zero.
- Formato brasileiro, duas casas (`R$ 1.234,56`). A regra de exibição não altera o valor.
- Não afirmar o motivo de uma pendência.

## 3. Palavras proibidas como rótulo

Nenhum rótulo, badge ou texto de valor de crédito usa "confirmado", "disponível", "pode usar", "a receber", "garantido" ou equivalente sem base. Crédito não confirmado nunca é apresentado como disponível ([`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) §6). Valor a apropriar nunca usa a cor ou o ícone de sucesso; nenhum valor de crédito usa verde, porque qual valor é o saldo utilizável está em aberto para tributarista. Preferir "crédito registrado" e "ainda não liberado pela Receita".

## 4. Restrições de texto público

- Não prometer integração, sincronização, garantia ou funcionalidade que não exista.
- Não publicar depoimento, logo de cliente nem número de resultado inventado.
- Nenhuma regra de CBS/IBS sem fonte em [`referencias/`](../referencias/).
- Mockups com dados fictícios, ditos na própria tela ("Exemplo fictício"). CNPJ de exemplo no formato `11.111.111/0001-00` (raiz conferida, DV errado de propósito), nunca um real. Sem credencial de ERP ou da Receita, sem nome de empresa real.

## 5. Ponto de partida visual

O ponto de partida foi a identidade escura da landing (fundo `#060a13`, superfícies `#0c121e` e `#0e1524`, bordas `#1e293b`, verde, âmbar, fonte Inter). Durante o design, por decisão do responsável (seção "Mudanças pedidas" da US), duas coisas mudaram:

- **A fonte das cores passou a ser o logo:** verde `#27a671` e azul-marinho `#354363` e `#001955` (arquivos em [`assets/`](assets/)). O logo colorido aparece numa placa clara no tema escuro.
- **O tema claro passou a ser o principal** e sai primeiro. O escuro continua, com os mesmos nomes de token.

Outras decisões do responsável: navegação no topo, sem barra lateral; login com provedor externo além de e-mail e senha; Inter com algarismos tabulares nos valores e monoespaçada só na chave; estado a apropriar em âmbar, apropriado e já utilizado em neutro ou informação.

## 6. O que não é referência

- `app/painel`: ferramenta interna local, não é o produto.
- [`wireframes/dashboard-principal.md`](wireframes/dashboard-principal.md): rascunho da concepção, com compensação de ICMS, antecipação e "Validados", fora do escopo atual. Superado.

## 7. O que o design system precisa cobrir

Critérios da US:

- **CA-4:** cores em tokens semânticos (fundo, superfícies, bordas, texto, ação primária, foco, informação, sucesso, atenção, erro).
- **CA-5:** tipografia por papel, com algarismos tabulares para valores.
- **CA-6:** espaçamento, raios, bordas e sombras como tokens.
- **CA-7:** tokens em CSS custom properties e JSON, com os mesmos nomes e valores, sem citar framework.
- **CA-8:** botões primário, secundário, ghost e destrutivo, com tamanhos e estados (padrão, mouse, pressionado, foco, desabilitado, carregando).
- **CA-9:** campos de texto, e-mail, senha com mostrar/ocultar, seleção e busca, com rótulo, ajuda e erro, em todos os estados.
- **CA-10:** cartões, incluindo o cartão de total, e a navegação (item ativo, empresa, saída da sessão).
- **CA-11:** badges de crédito e de arquivo, com cor, texto e um sinal além da cor.
- **CA-12:** alertas em quatro níveis, em bloco e em linha, incluindo o aviso permanente de que só há CBS.
- **CA-13:** estados vazio, carregando, erro, foco e desabilitado.
- **CA-14:** valores em R$: formato, alinhamento, negativo, zero e não informado.
- **CA-15:** tabela de créditos e notas: cabeçalho, linhas, chave de 44 ou 50 posições legível, ordenação, filtro, paginação, linha que abre o detalhe, vazia e carregando.
- **CA-16:** exemplos de totais sem somar os quatro valores, com débitos em bloco separado e sem saldo líquido.
- **CA-17:** acessibilidade WCAG 2.1 AA, com razão de contraste anotada, foco visível e nenhum estado só por cor.

Telas: login (com erro de credencial, sem revelar se o e-mail existe, e erro de conexão, também no celular), dashboard (com os indicadores da demanda 033) e carteira do contador, nos estados descritos em [`design-system.md`](design-system.md) §4.
