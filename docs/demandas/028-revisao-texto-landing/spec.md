# 028-revisao-texto-landing — Spec

## Critérios de aceite atendidos

CA-1 a CA-23 do [`us.md`](us.md). CA-20 só fica verde quando o e-mail de contato for informado (P-1); até lá, a busca acusa o marcador `PREENCHER`.

## Abordagem

A mudança é de texto. A estrutura visual do redesign escuro fica como está: mesmas seções, mesma ordem, mesmas classes, cores e animações. Também não muda nenhuma dependência. O trabalho tem cinco frentes:

1. **Remover** as seções Prova Social, Métricas, Depoimentos e Preço: os componentes, os imports em `App.tsx` e o asset `avatar-placeholder.png`, que só os depoimentos usam (CA-10, CA-11).
2. **Centralizar o contato** num único arquivo de configuração. Todo botão de chamada monta o link a partir dele (CA-15).
3. **Reescrever o texto** de cada seção que fica, conforme a seção "Texto novo" abaixo (CA-1 a CA-9, CA-12 a CA-14, CA-16, CA-17).
4. **Corrigir a navegação.** Cada seção ganha um `id`, e o menu e o rodapé só apontam para `id` existentes (CA-16).
5. **Metadados e arquivos públicos:** `index.html`, `robots.txt`, `sitemap.xml` (CA-18, CA-19). Também a documentação de contexto (CA-23).

A landing não tem testes automatizados. A verificação é feita com quatro checagens: a busca de termos (CA-20), `npm run lint` e `npm run build` (CA-21) e a conferência visual (CA-22). Não se cria teste nem script novo.

## Mudanças por camada

### Landing (`app/landing-page`)

| Arquivo | Mudança | CA |
|---|---|---|
| `src/config/contato.ts` (novo) | Contato e mensagens num só lugar (ver "Contratos") | CA-15 |
| `src/App.tsx` | Tira `SocialProof`, `Metrics`, `Testimonials` e `Pricing` (imports e uso). A ordem das seções restantes não muda: Header, Hero, HowItWorks, DashboardShowcase, ProblemSolution, Features, Faq, FinalCta, Footer | CA-10, CA-11 |
| `src/components/SocialProof.tsx`, `Metrics.tsx`, `Testimonials.tsx`, `Pricing.tsx` | Apagados | CA-10, CA-11 |
| `src/assets/avatar-placeholder.png` | Apagado (sem outro uso; conferir com busca antes) | CA-10 |
| `src/components/Header.tsx` | Menu novo, link "Lista de espera" no lugar de "Entrar" | CA-6, CA-15, CA-16 |
| `src/components/Hero.tsx` | Texto, botões e mockup | CA-1, CA-2, CA-4 a CA-6, CA-12 a CA-15 |
| `src/components/HowItWorks.tsx` | Texto; `id="como-funciona"` | CA-2, CA-4, CA-7, CA-8, CA-16 |
| `src/components/DashboardShowcase.tsx` | Texto e linhas do mockup; selo de ilustração; selo de status verde para "Confirmado"; `id="painel"` | CA-2, CA-7, CA-12 a CA-14, CA-16 |
| `src/components/ProblemSolution.tsx` | Texto; `id="problema"` | CA-2, CA-4, CA-5, CA-7 |
| `src/components/Features.tsx` | Texto; `id="produto"` | CA-2, CA-3, CA-5, CA-9, CA-16 |
| `src/components/Faq.tsx` | Perguntas novas; `id="faq"` | CA-2, CA-3, CA-4, CA-5, CA-6, CA-11, CA-16 |
| `src/components/FinalCta.tsx` | Texto e botões; `id="lista-de-espera"` | CA-1 (reforço), CA-6, CA-15 |
| `src/components/Footer.tsx` | Apresentação, colunas com links reais, linha final | CA-16, CA-17 |
| `index.html` | Título e descrições; `og:url`; `og:image` com URL absoluta | CA-18, CA-19 |
| `public/robots.txt`, `public/sitemap.xml` | URL `https://credito-gov.vercel.app` | CA-19 |

**Âncoras e cabeçalho fixo.** O cabeçalho é fixo e tem 80 px. Toda seção com `id` recebe `scroll-mt-[80px]`, para que o título não fique escondido ao navegar pelo menu. É o único ajuste de classe permitido, além dos selos descritos no mockup.

**Fontes dos rótulos.** Os textos de seção e de rótulo continuam como estão no código: o que hoje aparece em maiúsculas via `uppercase` continua assim. O texto proposto abaixo está em caixa normal.

### Documentação (`docs/`)

| Arquivo | Mudança | CA |
|---|---|---|
| `docs/PROJECT_CONTEXT.md` §2, linha "Landing page" | "Redesign escuro concluído e na `main` (tasks 015–027, PR #10). Texto em postura de pré-lançamento desde a demanda 028: diz que o produto está em desenvolvimento e convida para a lista de espera, sem números, depoimentos ou promessas sem base." | CA-23 |
| `docs/PROJECT_CONTEXT.md` §11 | Linha de changelog com a data e "Landing em postura de pré-lançamento (demanda 028)" | CA-23 |
| `docs/produto/hipoteses.md` H4 | Trocar "e o redesign usa 'sob consulta'" por "e a landing, desde a demanda 028, diz que o preço será definido antes do lançamento" | CA-23 |

## Contratos

### Configuração de contato — `src/config/contato.ts` (CA-15)

Único lugar onde entram o e-mail e o número. Formato:

```ts
// Endereço real antes de publicar; enquanto estiver com o marcador, a busca do CA-20 reprova.
// (Não repetir o marcador em comentário: a busca acusaria mesmo com o valor preenchido.)
export const EMAIL_CONTATO = 'PREENCHER-EMAIL'

// Só dígitos, com DDI e DDD (ex.: 55 + DDD + número). Vazio: nenhum botão de WhatsApp aparece.
export const WHATSAPP_NUMERO = ''

export const MENSAGEM_LISTA = {
  assunto: 'Lista de espera do CreditoGov',
  corpo:
    'Olá! Quero entrar na lista de espera do CreditoGov.\n\nNome:\nEmpresa ou escritório:\nSou empresa ou escritório de contabilidade:\n',
}

export const MENSAGEM_CONVERSA = {
  assunto: 'Conversa sobre o CreditoGov',
  corpo: 'Olá! Quero conversar sobre o CreditoGov.\n',
}

export function linkEmail(mensagem: { assunto: string; corpo: string }): string
// mailto:${EMAIL_CONTATO}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}

export function linkWhatsApp(texto: string): string | null
// null quando WHATSAPP_NUMERO estiver vazio; senão https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}
```

Regras:

- **Endereço e número.** Não se inventa endereço nem número. O marcador `PREENCHER-EMAIL` deixa o build compilar, mas reprova o CA-20. Quando o usuário informar o endereço, a mudança é uma linha.
- **Botão de WhatsApp.** Sem número, ele **não aparece** em nenhum lugar: o componente só renderiza o link quando `linkWhatsApp` não retorna `null`. Com número, o WhatsApp aparece como terceiro botão na chamada final e como item "WhatsApp" na coluna Contato do rodapé, sempre com a mensagem de conversa.
- **Mesmo canal (P-3).** Os links de lista de espera usam `MENSAGEM_LISTA`, e os de conversa usam `MENSAGEM_CONVERSA`. O canal é o mesmo (o e-mail).
- **Formato dos links.** Links `mailto:` e `wa.me` são `<a href>` comuns. O `wa.me` abre em nova aba (`target="_blank" rel="noopener noreferrer"`). O `mailto:` não leva `target`.

| Onde | Rótulo | Link |
|---|---|---|
| Header (desktop e celular) | Lista de espera | `linkEmail(MENSAGEM_LISTA)` |
| Hero, botão principal | Entrar na lista de espera | `linkEmail(MENSAGEM_LISTA)` |
| Hero, botão secundário | Conversar com a equipe | `linkEmail(MENSAGEM_CONVERSA)` |
| FinalCta, botão principal | Entrar na lista de espera | `linkEmail(MENSAGEM_LISTA)` |
| FinalCta, botão secundário | Conversar por e-mail | `linkEmail(MENSAGEM_CONVERSA)` |
| FinalCta, terceiro (só com número) | Falar pelo WhatsApp | `linkWhatsApp(MENSAGEM_CONVERSA.corpo)` |
| Footer, coluna Contato | Lista de espera / E-mail / WhatsApp (só com número) | idem |

### Navegação (CA-16)

| Menu (Header) | Destino |
|---|---|
| Como vai funcionar | `#como-funciona` (HowItWorks) |
| Prévia do painel | `#painel` (DashboardShowcase) |
| O que vai fazer | `#produto` (Features) |
| Perguntas | `#faq` (Faq) |
| Lista de espera | `linkEmail(MENSAGEM_LISTA)` |

O item "Soluções" sai. "Preço" sai também (P-2).

## Texto novo

Esta seção é o texto que o usuário aprova. A implementação copia o texto como está; pequenos ajustes de quebra de linha só se a conferência visual exigir.

### `index.html` (CA-18, CA-19)

- `<title>`: CreditoGov — Crédito de CBS/IBS como caixa (em desenvolvimento)
- `description`, `og:description`: O CreditoGov está em desenvolvimento para mostrar o crédito de CBS/IBS das compras da sua empresa: quanto já está confirmado, quanto depende do fornecedor e de onde vem. Entre na lista de espera.
- `og:title`, `twitter:title`: CreditoGov — Pare de deixar crédito tributário parado na planilha *(fica igual: é o texto do `og-image.png`)*
- `twitter:description`: Em desenvolvimento: o crédito de CBS/IBS das suas compras, separado em confirmado e pendente. Entre na lista de espera.
- `og:url`: `https://credito-gov.vercel.app/`
- `og:image` e `twitter:image`: `https://credito-gov.vercel.app/og-image.png` (redes sociais exigem URL absoluta)
- `robots.txt`: `Sitemap: https://credito-gov.vercel.app/sitemap.xml`
- `sitemap.xml`: `<loc>https://credito-gov.vercel.app/</loc>`

### Header (CA-6, CA-16)

Itens do menu conforme a tabela de navegação. "Entrar" sai.

### Hero (CA-1, CA-2, CA-4 a CA-6, CA-12 a CA-15)

- Selo: **Em desenvolvimento · CBS/IBS**
- Título: **Pare de deixar crédito tributário parado na planilha.** *(fica igual)*
- Parágrafo: Com a CBS e o IBS, as compras da sua empresa geram crédito, mas ele só pode ser usado quando o imposto do fornecedor é quitado. O CreditoGov está em desenvolvimento para mostrar quanto do seu crédito já está confirmado, quanto ainda depende do fornecedor e de quais compras ele vem.
- Botões: **Entrar na lista de espera** · **Conversar com a equipe**
- Linha abaixo dos botões: Lista de espera sem custo e sem compromisso. Avisaremos quando a primeira versão estiver pronta.

Mockup (todos os números são ilustrativos):

- Barra superior: o texto "PAINEL EXECUTIVO" vira **EXEMPLO ILUSTRATIVO** (CA-12)
- Rótulo do valor principal: **Crédito confirmado (CBS + IBS)**; valor **R$ 152.430,18**
- Cartão verde: **Fornecedores com pendência** · **7**
- Cartão âmbar: **Pendente** · **R$ 121.905,40**
- Gráfico decorativo (`hero-chart.svg`) fica
- Barra verde inferior: título **Maior pendência: Fornecedor A**; subtítulo **R$ 48.300,00 aguardando o fornecedor**; selo branco **Ver notas** (no lugar de "Compensar")

O pendente não entra no valor principal e nada é rotulado como "disponível" (CA-13). Não há ação de compensar nem vencimento (CA-14).

### HowItWorks — `#como-funciona` (CA-2, CA-4, CA-7, CA-8)

- Selo: **Como vai funcionar**
- Título: **Do imposto na nota ao crédito no caixa**
- Subtítulo: Este é o plano da primeira versão. A forma de conectar os dados da sua empresa ainda está em definição.
- 01 **Suas compras viram crédito**: O CreditoGov vai reunir o CBS e o IBS destacados nas notas de compra da sua empresa, com a nota e o fornecedor de cada valor.
- 02 **Cada crédito ganha um status**: Confirmado quando o imposto do fornecedor foi quitado; pendente enquanto não foi. É o que a regra da CBS e do IBS exige para o crédito valer.
- 03 **Você enxerga o caixa**: Saldo, origem, pendências por fornecedor e projeção das próximas semanas, em um só painel.

Fonte da regra do passo 02 e do parágrafo do Hero: Manual de Operações do Split Payment, Apêndice A ("Crédito Tributário": destaque de CBS/IBS no documento fiscal e efetiva extinção do débito do fornecedor) e §3 (CA-7). "Quitado" resume "extinção do débito", sem citar modalidade nem prazo.

### DashboardShowcase — `#painel` (CA-2, CA-7, CA-12 a CA-14)

- Selo: **Prévia do painel**
- Título: **Cada crédito com a compra, a nota e o fornecedor**
- Subtítulo: O painel em desenvolvimento vai mostrar de onde vem cada crédito de CBS e IBS e o que ainda depende do fornecedor.
- Cabeçalho do cartão: à esquerda **Créditos por compra**; à direita, selo **Exemplo ilustrativo** (mesmo estilo do selo âmbar existente, em tom neutro `#94a3b8` sobre `#1e293b`)
- Colunas: **FORNECEDOR** · **NOTA** · **TRIBUTO** · **CRÉDITO** · **STATUS**

| Fornecedor | Nota | Tributo | Crédito | Status |
|---|---|---|---|---|
| Fornecedor A | NF-e 10.482 | CBS | R$ 4.910,22 | Confirmado |
| Fornecedor B | NF-e 3.117 | IBS | R$ 1.312,18 | Pendente |
| Fornecedor C | NF-e 88.205 | CBS | R$ 2.435,00 | Pendente |
| Fornecedor A | NF-e 10.517 | IBS | R$ 677,78 | Confirmado |

O selo "Confirmado" é verde, com o mesmo padrão do selo "Pendente": borda `rgba(16,185,129,0.2)`, fundo `rgba(16,185,129,0.1)` e texto `#10b981`. A chave da lista passa a ser a nota, porque o fornecedor se repete. Não há período nem data (CA-14).

### ProblemSolution — sem âncora no menu (CA-2, CA-4, CA-5, CA-7)

- Sobretítulo: **O dia a dia hoje** *(fica igual)*
- Título: **O crédito existe. Só não aparece pra ninguém.** *(fica igual)*
- Rótulo das caixas de solução: **COM O CREDITOGOV** vira **O QUE O CREDITOGOV VAI FAZER**

| Problema | Texto do problema | Solução | Texto da solução |
|---|---|---|---|
| Crédito que depende do fornecedor | O crédito da compra só pode ser usado quando o imposto do fornecedor é quitado. Hoje ninguém acompanha isso nota a nota. | Confirmado e pendente, separados | Separar o crédito já confirmado do que ainda depende do fornecedor, de CBS e de IBS. |
| Planilha manual | Saber de qual compra veio cada crédito exige cruzar notas e pagamentos à mão, todo mês. | A origem de cada crédito | Mostrar a compra, a nota e o fornecedor de cada valor. |
| Caixa sem previsão | O imposto destacado na nota não aparece como dinheiro a receber, e o caixa das próximas semanas fica no escuro. | Projeção do que deve ser confirmado | Projetar quanto crédito deve ser confirmado nas próximas semanas, com base nas compras já feitas. |

`ProblemSolution` recebe `id="problema"` e `scroll-mt-[80px]`, para uso futuro e coerência, mas não entra no menu (o menu já tem quatro itens).

### Features — `#produto` (CA-2, CA-3, CA-5, CA-9)

- Selo: **Em desenvolvimento** (no lugar de "Vantagens Exclusivas")
- Título: **O que o CreditoGov vai fazer, e o que não vai**

| Título | Texto | Rodapé do cartão |
|---|---|---|
| Pendências por fornecedor | Quem ainda não quitou o imposto da venda e quanto isso segura do seu crédito. | Fornecedor a fornecedor |
| Saldo de CBS e de IBS | O crédito de cada tributo, separado em confirmado e pendente, sem misturar o que ainda não pode ser usado. | Confirmado × pendente |
| Complemento ao ERP e ao contador | O CreditoGov não calcula imposto nem emite nota: isso continua no seu ERP. Também não substitui o contador. | Sem trocar de sistema |

### Faq — `#faq` (CA-2 a CA-6, CA-11, P-5)

- Título: **Perguntas frequentes**

Coluna 1:

1. **O CreditoGov já está funcionando?** Ainda não. O produto está em desenvolvimento. Entre na lista de espera para saber quando a primeira versão estiver pronta.
2. **De onde virão os dados da minha empresa?** Isso ainda está em definição. Antes do lançamento, vamos explicar como os dados chegam ao CreditoGov e o que você precisa autorizar.
3. **Preciso mudar meu ERP?** Não. O ERP continua calculando o imposto e emitindo as notas. O CreditoGov vai mostrar o crédito que vem delas.
4. **Vai dar para compensar ou antecipar crédito pelo painel?** Não na primeira versão. São possibilidades que dependem de validação jurídica e ainda não têm data.

Coluna 2:

5. **Quanto vai custar?** O preço será definido antes do lançamento e informado a quem estiver na lista de espera.
6. **O CreditoGov substitui o contador?** Não. Ele não calcula imposto nem faz a apuração. Seu contador continua responsável por isso.
7. **Sou contador. Posso participar?** Sim. Se você atende empresas no regime regular de CBS/IBS, entre na mesma lista de espera e conte um pouco sobre a sua carteira.

### FinalCta — `#lista-de-espera` (CA-6, CA-15, P-5)

- Título: **Quer ver o seu crédito como caixa?**
- Subtítulo: O CreditoGov está em desenvolvimento. Entre na lista de espera e acompanhe a primeira versão. Empresas e escritórios de contabilidade são bem-vindos.
- Botões: **Entrar na lista de espera** · **Conversar por e-mail** · **Falar pelo WhatsApp** *(só com número)*

### Footer (CA-16, CA-17)

- Apresentação: Crédito de CBS/IBS como caixa para pequenas e médias empresas. Em desenvolvimento.
- Coluna **Navegação**: Como vai funcionar (`#como-funciona`), Prévia do painel (`#painel`), O que vai fazer (`#produto`), Perguntas (`#faq`)
- Coluna **Contato**: Lista de espera (`linkEmail(MENSAGEM_LISTA)`), E-mail (`linkEmail(MENSAGEM_CONVERSA)`), WhatsApp (só com número)
- Os itens viram `<a>`, mantendo as classes atuais do `<p>`.
- Linha final: à esquerda **© 2026 CreditoGov. Todos os direitos reservados.** *(fica igual)*; à direita **Produto em desenvolvimento.**

As colunas "Produto", "Soluções" e "Suporte" saem.

## Riscos e decisões

- **Marcador de contato (P-1).** Até o usuário informar o e-mail, os botões abrem um `mailto:PREENCHER-EMAIL`, que não entrega. O build passa, mas o CA-20 reprova. Assim o Reviewer não aprova uma página com o marcador. Se o e-mail chegar antes da implementação, o Developer já grava o valor real.
- **WhatsApp sem número.** O botão some e não fica desabilitado. Assim a página não fica com botão morto e não precisa de outra decisão quando o número não existir.
- **`mailto:` depende do cliente de e-mail do visitante.** No celular sem app de e-mail, o link não faz nada visível. Aceito pela decisão 3 (sem formulário nem backend). Mitigação: o rodapé mostra o rótulo "E-mail". Mostrar o endereço por extenso fica para quando ele existir; não é exigido.
- **Título e `og:title` mantidos.** "Pare de deixar crédito tributário parado na planilha." não afirma integração nem número, e é o texto do `og-image.png`, que está fora de escopo. Trocar só o título deixaria a imagem de compartilhamento divergente.
- **Regra tributária usada.** Só a do Apêndice A do Manual de Operações: o crédito depende do destaque e da extinção do débito do fornecedor. "Quitado" é o resumo em linguagem comum de "extinção do débito". Não se citam modalidade, prazo, alíquota nem data.
- **Números do mockup.** Valores, quantidade de fornecedores e números de nota são inventados. Isso é permitido por estar marcado como ilustração (CA-12). Os nomes "Fornecedor A, B, C" evitam parecer cliente real.
- **Busca de termos é grosseira.** Ela pode acusar palavra legítima em texto futuro (por exemplo "taxa" ou "validado"). Nesta demanda, o texto novo foi escrito para não usar nenhum dos termos. Se a implementação precisar de um deles, o termo volta para a Spec antes de mudar o padrão.
- **Site não vai ao ar com esta demanda.** O Vercel não publica a partir do repositório (`PROJECT_CONTEXT.md` §2). A publicação é item próprio do backlog.

## Implantação

- **Apps afetadas:** `app/landing-page` (só arquivos estáticos e componentes).
- **Migration:** não.
- **Compatibilidade:** não há outras apps.
- **Variáveis de ambiente:** nenhuma. O contato é constante no código, não variável de ambiente.
- **Outros efeitos:** nenhum (sem cron, DNS, Keycloak ou infra).
- **Antes de publicar:** preencher `EMAIL_CONTATO` (e `WHATSAPP_NUMERO`, se houver) em `src/config/contato.ts` e rodar a busca do CA-20 sem resultado.
- **Deploy:** nenhuma ação além do merge. O site **não** vai ao ar automaticamente: `https://credito-gov.vercel.app` segue com a versão clara antiga até a demanda de publicação ser resolvida.
- **Como voltar:** reverter o merge.

## Estratégia de verificação

Não há testes automatizados na landing. A verificação é feita em quatro passos: a busca de termos, lint, build e conferência visual. A busca é feita primeiro e deve **acusar** os termos atuais antes da mudança. Isso mostra que ela pega o problema e faz o papel de "teste que falha".

### Busca de termos (CA-4 a CA-9, CA-10, CA-11, CA-14, CA-19, CA-20)

Comando, rodado na raiz do worktree em Git Bash, sem `npm run` nem script:

```bash
grep -rniIE 'receita federal|e-?cac|e-?cnpj|procura|certificado digital|sincroniz|00:05|todo santo dia|tempo real|14 dias|gr.{1,2}tis|gratuit|come.{1,2}ar agora|#entrar|demonstra|especialista|fintech|des.{1,2}gio|taxa|homologad|dois cliques|prescre|expira|pagos a maior|retroativ|presumido|diferimento|e-?social|audit|1\.840|4[.,]2 ?b|sob consulta|pre.{1,2}o transparente|dominio-a-definir|dispon.{1,2}ve|validad|PREENCHER' app/landing-page/src app/landing-page/index.html app/landing-page/public
```

- **Antes da implementação:** 65 linhas de resultado (conferido em 2026-11-23 sobre o código atual).
- **Aprovado:** nenhuma linha de saída e código de saída `1`.
- **Como o padrão foi montado:**
  - `-i` ignora maiúsculas.
  - `.{1,2}` cobre a letra acentuada em UTF-8 e a versão sem acento ("grátis" e "gratis").
  - `-I` pula os binários de `public/` e `src/assets/`.
- **Termos novos em relação ao CA-20:**
  - `validad` e `dispon.{1,2}ve` cobrem o "Validado" e o "Disponíveis" do mockup antigo (CA-13).
  - `pre.{1,2}o transparente` cobre a seção de preço (CA-11).
  - `PREENCHER` cobre o marcador de contato (P-1).

Busca complementar do CA-10, que também deve voltar vazia:

```bash
grep -rnE 'SocialProof|Metrics|Testimonials|Pricing|avatar-placeholder' app/landing-page/src
```

### Lint e build (CA-21)

```bash
cd app/landing-page && npm run lint && npm run build
```

Os dois sem erro. O build também prova que não sobrou import dos arquivos apagados (CA-10, CA-11).

### Conferência visual (CA-1 a CA-3, CA-12 a CA-17, CA-22)

Rodar `npm run dev` e abrir no navegador, com as ferramentas de desenvolvedor em 1280 px e em 375 px de largura.

- **CA-1:** na primeira tela, sem rolar, aparecem o selo "Em desenvolvimento" e o botão "Entrar na lista de espera". Conferir nas duas larguras.
- **CA-2, CA-3:** ler a página inteira. Toda função do produto aparece no futuro ou como plano, e o cartão "Complemento ao ERP e ao contador" e a FAQ dizem o que o produto não faz.
- **CA-12 a CA-14:** os dois mockups mostram "Exemplo ilustrativo". O valor principal do Hero é só o confirmado. Não há "Compensar", vencimento nem período.
- **CA-15:** passar o mouse ou inspecionar cada botão. Todos são `mailto:` com assunto de lista ou de conversa, conforme a tabela de contato. Com `WHATSAPP_NUMERO` vazio, não há link `wa.me` na página. Para conferir o caso com número, preencher um valor de teste localmente, ver o botão aparecer e **não commitar**.
- **CA-16:** clicar em cada item do menu (desktop e menu do celular) e do rodapé. Cada um rola até a seção certa, com o título visível abaixo do cabeçalho.
- **CA-17:** o rodapé tem só Navegação e Contato e a apresentação nova.
- **CA-22:** nenhuma seção com texto cortado ou sobreposto. Em 375 px, sem rolagem horizontal da página; a tabela do painel continua rolando dentro do próprio cartão, como hoje. O menu do celular abre e fecha.

### Documentação (CA-23)

Ler a linha "Landing page" do §2 do `PROJECT_CONTEXT.md`, o changelog §11 e a H4 de `hipoteses.md`.
