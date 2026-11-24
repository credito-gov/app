# 028-revisao-texto-landing — Revisar o texto da landing para o pré-lançamento

- **Status:** concluída
- **Branch:** `feat/028-revisao-texto-landing`
- **Worktree:** `.claude/worktrees/028-revisao-texto-landing`
- **Solicitante / data:** Daniel Buona, 2026-11-23

## História

Como visitante da landing (dono ou responsável financeiro de pequena ou média empresa no regime regular de CBS/IBS, ou contador que atende essas empresas), quero ler uma página que diga com honestidade que o CreditoGov está em desenvolvimento, qual problema ele resolve e o que vai fazer, para decidir se entro na lista de espera ou falo com a equipe, sem ser levado a acreditar em integração, número ou cliente que não existe.

## Contexto

A landing com o redesign escuro (tasks 015–027) está na `main`, mas o texto foi escrito como se o produto estivesse em operação. Ele contradiz o [`PROJECT_CONTEXT.md`](../../PROJECT_CONTEXT.md) §5 e §6:

- afirma integração diária com a Receita Federal, e-CAC e e-CNPJ, quando a fonte de dados é a hipótese H1, em aberto ([`hipoteses.md`](../../produto/hipoteses.md)), e os manuais em [`referencias/split-payment/`](../../referencias/split-payment/README.md) não oferecem consulta de crédito por contribuinte;
- promete compensar e antecipar pelo painel (H3, em aberto), teste grátis, login e demonstração que não existem;
- exibe logos, depoimentos e números de resultado inventados;
- cita regras tributárias sem fonte (prescrição, crédito presumido, diferimento, "pagos a maior", auditoria retroativa);
- no mockup do Hero, soma crédito pendente ao "saldo de créditos disponíveis", o que o §6 proíbe.

O texto novo apoia-se em [`visao.md`](../../produto/visao.md): problema, público, as quatro funções do produto (saldo confirmado × pendente, origem, pendências por fornecedor, projeção de caixa) e o que o produto não faz. Regra tributária só entra com fonte em `docs/referencias/`. Hoje a única usável é a definição de crédito tributário do Manual de Operações do Split Payment (Apêndice A e §3): o crédito do adquirente exige CBS/IBS destacado no documento fiscal e a extinção do débito do fornecedor (por split, recolhimento pelo adquirente ou outra modalidade). A linha do tempo de [`reforma-tributaria.md`](../../produto/reforma-tributaria.md) está "a confirmar com tributarista" e não vai para a página.

### Decisões já tomadas pelo usuário

1. **Postura de pré-lançamento.** A página diz que o produto está em desenvolvimento, explica o problema e o que ele vai fazer, e convida para uma lista de espera. O visual do redesign escuro fica (cores, tipografia, layout e animações das seções que permanecem).
2. **Remover a prova inventada.** Saem as seções Prova Social (`SocialProof.tsx`), Métricas (`Metrics.tsx`) e Depoimentos (`Testimonials.tsx`), sem deixar código ou asset morto. Voltam quando houver clientes e números reais, em outra demanda.
3. **Chamadas para WhatsApp ou e-mail.** Os botões levam para WhatsApp ou e-mail, sem formulário, serviço externo nem backend. O e-mail é o canal principal; o WhatsApp entra como segundo botão só se houver número comercial (P-1).
4. **Primeira versão começa pela CBS** (2026-11-23, depois do PR #26, que confirmou a H1 para a CBS com as APIs de apuração da Receita e registrou em `PROJECT_CONTEXT.md` §3 "Produto começa só com CBS"). A página diz que a primeira versão começa pela CBS e que o IBS vem depois, sem data e sem promessa. O resto da postura não muda: a forma de conectar os dados continua "em definição" (o acesso em nome de vários clientes está em aberto, `PROJECT_CONTEXT.md` §5), e a página não anuncia integração com a Receita nem fala de fonte de dados além disso.

### Levantamento do texto atual

Tudo abaixo sai ou é reescrito. "Sem base" quer dizer sem fonte em `docs/referencias/` ou contrário a `visao.md` / `PROJECT_CONTEXT.md`.

| Onde | Texto atual | Problema |
|---|---|---|
| `index.html` `<title>` | "Crédito tributário CBS/IBS, todo santo dia" | Sugere atualização diária |
| `index.html` description, `og:description`, `twitter:description` | "Sincronizamos com a Receita Federal todos os dias… liberamos o caminho para compensar ou antecipar" | Integração inexistente; H3 |
| `index.html` `og:url`; `public/robots.txt`; `public/sitemap.xml` | `https://[dominio-a-definir]` | Placeholder (ver P-4) |
| `Header.tsx` | Link "Entrar" (`#entrar`) | Não há login |
| `Header.tsx` | Âncoras `#como-funciona`, `#solucoes`, `#preco`, `#faq` | Nenhuma seção tem esses `id`; links quebrados |
| `Hero.tsx` | Selo "Integrado à Receita Federal" | Integração inexistente |
| `Hero.tsx` | "Sincronizamos com a Receita Federal todos os dias para revelar impostos pagos a maior… prontos para compensação ou antecipação financeira" | Integração inexistente; "pagos a maior" sem fonte e fora do produto; H3 |
| `Hero.tsx` | Botões "Ver meus créditos em 14 dias grátis" e "Agendar demonstração" | Não há teste nem demonstração |
| `Hero.tsx` | "Sem cartão de crédito · Sem fidelidade · Integração imediata via e-CNPJ" | Pressupõe produto à venda; integração inexistente |
| `Hero.tsx` (mockup) | "SALDO DE CRÉDITOS DISPONÍVEIS R$ 274.335,18" = Validado + Pendente | Pendente apresentado como disponível (§6) |
| `Hero.tsx` (mockup) | "Validado" | O produto usa "confirmado" (glossário §9) |
| `Hero.tsx` (mockup) | "Compensar R$ 50.000 de CBS/IBS", "Vencimento próximo em 20/01", botão "Compensar" | H3; prazo sem fonte |
| `SocialProof.tsx` | "Mais de 1.840 empresas conectadas no Brasil" e cinco logos | Número e clientes inventados (decisão 2) |
| `HowItWorks.tsx` | "Fluxo Automático", "Como funciona a auditoria diária", "apuração contínua e integrada… dados em tempo real" | Produto não audita nem apura; tempo real sem base |
| `HowItWorks.tsx` | "Conexão e-CNPJ imediata… autorização via e-CAC… sincroniza diretamente com a base da Receita Federal" | H1; integração inexistente |
| `HowItWorks.tsx` | "Auditoria contínua… motor de regras tributárias atualiza seus saldos diariamente, identificando desvios" | Produto não calcula imposto (`visao.md`); atualização diária sem base |
| `HowItWorks.tsx` | "Compensação rápida… abate guias de impostos ou solicita antecipação de caixa sem burocracia" | H3 |
| `DashboardShowcase.tsx` | "Centralize toda a gestão fiscal… dashboard auditável" | Produto não faz gestão fiscal completa |
| `DashboardShowcase.tsx` (mockup) | "Crédito Presumido", "Diferimento CBS", "CBS Retida", "IBS Devido" (débito numa tabela de "Transações de Crédito") | Regras sem fonte; débito rotulado como crédito |
| `DashboardShowcase.tsx` (mockup) | Períodos de agosto a novembro de 2025 | CBS/IBS não tem apuração em 2025 |
| `ProblemSolution.tsx` | "O número se atualiza sozinho às 00:05", "Sincronizamos com a Receita Federal todo dia de madrugada" | Integração inexistente |
| `ProblemSolution.tsx` | "Crédito prescreve sem ninguém ver", "dias restantes", "perto de expirar" | Sem fonte (`reforma-tributaria.md`, "Erros dos documentos antigos") |
| `ProblemSolution.tsx` | "Compensar ou antecipar em dois cliques", "fintech parceira" | H3; não há parceiro |
| `Features.tsx` | "Vantagens Exclusivas", "Sincronização diária", "Varremos notas fiscais… na virada do dia… nenhum centavo de crédito seja esquecido" | Integração e garantia sem base |
| `Features.tsx` | "Projeção de 90 dias" | `visao.md` fala em "próximas semanas"; horizonte não definido |
| `Features.tsx` | "Dois cliques para liquidar… saldos validados… antecipação imediata com taxas reduzidas", "Crédito vira dinheiro" | H3 |
| `Metrics.tsx` | "R$ 4.2B em créditos identificados", "legislação do e-Social", "1.840+ empresas parceiras", "14 Dias de teste", "Suba o seu certificado digital" | Números inventados; e-Social não tem relação com CBS/IBS; teste inexistente |
| `Testimonials.tsx` | Três depoimentos com nome e empresa, "Feedback Real", `avatar-placeholder.png` | Depoimentos inventados |
| `Pricing.tsx` | "Preço Transparente" com "Sob Consulta", "CREDITOGOV PRO", "taxa de sucesso regressiva" | Preço é H4, em aberto; contraditório |
| `Pricing.tsx` | "Sincronização diária estruturada com e-CAC", "Gestão ilimitada de e-CNPJs", "Auditorias retroativas inclusas", "Projeções… até 90 dias" | H1; sem fonte |
| `Pricing.tsx` | "Começar agora 14 dias grátis" | Não há teste |
| `Faq.tsx` | "integração é feita via procuração eletrônica específica do e-CAC… Não armazenamos senhas" | H1; garantia sobre sistema inexistente |
| `Faq.tsx` | "créditos homologados… antecipados com fintechs parceiras a taxas de deságio extremamente competitivas" | H3 |
| `Faq.tsx` | "período de teste gratuito… 14 dias" | Não há teste |
| `FinalCta.tsx` | "Não deixe sua empresa perder dinheiro… Integração em segundos, resultados no primeiro dia" | Promessa sem base |
| `FinalCta.tsx` | "Testar grátis por 14 dias", "Falar com especialista" | Não há teste nem especialista |
| `Footer.tsx` | "Auditoria de crédito fiscal CBS/IBS com atualização diária via Receita Federal", "Auditoria tributária, todo santo dia" | Integração inexistente; produto não audita |
| `Footer.tsx` | Colunas "Segurança", "Antecipação", "Compensação", "e-CNPJ", "Central de Ajuda", "Dashboard"… em texto sem link | Páginas e funções inexistentes |

O que pode ficar sem mudança: `public/og-image.png` (logo e "Pare de deixar crédito tributário parado na planilha.", sem afirmação sem base), `favicon.png`, `robots.txt` exceto a URL, a resposta da FAQ "não precisa trocar de ERP" (coerente com `visao.md`) e o gráfico decorativo do Hero, se o mockup for marcado como ilustração.

## Critérios de aceite

### Postura e conteúdo

- **CA-1:** Acima da dobra (primeira tela, em desktop e em celular), a página diz de forma explícita que o CreditoGov está em desenvolvimento e convida para a lista de espera.
- **CA-2:** A página apresenta o problema e as funções do produto como estão em `visao.md` (saldo confirmado e pendente, origem de cada crédito, pendências por fornecedor, projeção de caixa), sempre no futuro ou como plano ("vai mostrar", "em desenvolvimento"), nunca como algo que já funciona.
- **CA-3:** A página deixa claro o que o produto não faz, conforme `visao.md`: não calcula CBS/IBS, não emite nota e não substitui o contador.
- **CA-4:** Nenhum texto afirma integração, sincronização, conexão ou autorização com Receita Federal, e-CAC, e-CNPJ, certificado digital, procuração eletrônica ou qualquer outra fonte de dados, nem frequência ou horário de atualização. Se a página mencionar a origem dos dados, diz apenas que ela está em definição.
- **CA-5:** Nenhum texto oferece ou sugere compensar débito, antecipar crédito, parceria com fintech, taxa, deságio ou crédito "homologado". Se a página citar compensação ou antecipação, é só como possibilidade futura, sem promessa.
- **CA-6:** Nenhum texto pressupõe produto em operação: sem teste grátis, "14 dias", "Começar agora", "Entrar", "Agendar demonstração", "Falar com especialista", "sem cartão", "sem fidelidade", "integração imediata", "resultados no primeiro dia" ou equivalentes.
- **CA-7:** Nenhuma regra tributária aparece sem fonte em `docs/referencias/`. Em especial, saem prescrição ou prazo de validade de crédito, "impostos pagos a maior", auditoria retroativa, crédito presumido, diferimento, e-Social, alíquotas e datas da reforma. A regra de que o crédito do adquirente depende do destaque no documento fiscal e da extinção do débito do fornecedor pode ser usada, porque está no Manual de Operações do Split Payment (Apêndice A).
- **CA-8:** A página não descreve o produto como auditoria, apuração, cálculo de imposto ou "gestão fiscal completa".
- **CA-9:** Nenhum texto promete resultado, garantia ou número ("nenhum centavo esquecido", "em segundos", "precisão cirúrgica", percentuais, contagens de empresas ou valores agregados).

### Seções removidas

- **CA-10:** As seções Prova Social, Métricas e Depoimentos não aparecem na página. `SocialProof.tsx`, `Metrics.tsx`, `Testimonials.tsx` e qualquer asset usado só por eles (hoje `avatar-placeholder.png`) são apagados, e nenhum import ou referência a eles sobra.
- **CA-11:** A seção de preço sai da página e o arquivo `Pricing.tsx` é apagado; o item "Preço" sai do menu (P-2). A FAQ responde que o preço será definido antes do lançamento. Não aparecem valor, "Sob Consulta", "Preço Transparente", nome de plano, taxa de sucesso, lista de benefícios nem teste grátis.

### Mockups

- **CA-12:** Todo mockup de painel (Hero e Painel de Controle) traz, visível junto dele, uma marcação de que é ilustração (por exemplo, "Exemplo ilustrativo"), legível em desktop e em celular.
- **CA-13:** Nos mockups, crédito pendente nunca é somado nem rotulado como disponível. Confirmado e pendente aparecem separados, com o vocabulário do produto ("confirmado" e "pendente").
- **CA-14:** Os mockups não mostram botão ou ação de compensar ou antecipar, prazo ou vencimento de crédito, nem rótulos sem fonte ("Crédito Presumido", "Diferimento", "Retida", débito listado como crédito). As linhas de exemplo refletem a origem do crédito (compra, nota, fornecedor) e não usam período anterior a 2026.

### Chamadas, links e navegação

- **CA-15:** Todo botão de chamada leva para o mesmo canal (P-3): `mailto:` para o e-mail de contato e, só quando houver número comercial, `https://wa.me/<número>` (P-1). Os botões de "lista de espera" e de "conversa" usam mensagens pré-preenchidas diferentes. O endereço e o número ficam num único ponto do código. Sem número, nenhum botão ou link de WhatsApp aparece. Nenhum link aponta para âncora inexistente ou para `#` vazio.
- **CA-16:** Cada link do menu (desktop e menu do celular) leva a uma seção existente da página. Itens de menu e de rodapé que não correspondem a uma seção ou canal real são retirados.
- **CA-17:** O rodapé não lista páginas ou funções inexistentes e tem um texto de apresentação coerente com a postura de pré-lançamento, sem "auditoria" nem "Receita Federal".

### Metadados e arquivos públicos

- **CA-18:** `<title>`, `description`, `og:title`, `og:description`, `twitter:title` e `twitter:description` estão de acordo com CA-4 a CA-9 e com a postura de pré-lançamento.
- **CA-19:** Não sobra `[dominio-a-definir]` em `index.html`, `public/robots.txt` nem `public/sitemap.xml`; a URL usada é `https://credito-gov.vercel.app` (P-4).

### Verificação

- **CA-20:** Uma busca sem distinção de maiúsculas e acentos em `app/landing-page/src/` e `app/landing-page/index.html` não encontra nenhum destes termos: "Receita Federal", "e-CAC", "e-CNPJ", "procuração", "certificado digital", "sincroniz", "00:05", "todo santo dia", "tempo real", "14 dias", "grátis", "gratuito", "Começar agora", "#entrar", "demonstração", "especialista", "fintech", "deságio", "taxa", "homologad", "dois cliques", "prescreve", "expirar", "pagos a maior", "retroativ", "Presumido", "Diferimento", "e-Social", "auditoria", "auditável", "1.840", "4.2B", "Sob Consulta", "dominio-a-definir". A busca também acusa o marcador de contato não preenchido (`PREENCHER`), de modo que a página não fica pronta para publicar sem o endereço real. A Spec define o comando, que a revisão repete.
- **CA-21:** `npm run lint` e `npm run build` passam em `app/landing-page`, sem erro.
- **CA-22:** Conferência visual no navegador, em desktop (1280 px de largura) e em celular (375 px), mostra todas as seções restantes sem texto cortado, sobreposto ou com rolagem horizontal, mantendo o visual do redesign escuro e o menu do celular funcionando.
- **CA-23:** `PROJECT_CONTEXT.md` §2 deixa de dizer que a landing tem números, depoimentos e promessas sem base e registra a postura de pré-lançamento; a menção ao "sob consulta" na H4 de `hipoteses.md` é atualizada.

### Escopo da primeira versão (decisão 4)

- **CA-24:** A página diz que a primeira versão começa pela CBS e que o IBS vem numa etapa seguinte, sem data nem promessa (no Hero, em Features e numa pergunta da FAQ). Nenhum texto apresenta crédito de IBS como parte da primeira versão: título, descrições, selo, mockups e rodapé falam de crédito de CBS. A sigla IBS só aparece como etapa futura, no contexto da reforma ("Com a CBS e o IBS…") ou no nome do regime ("regime regular de CBS/IBS").
- **CA-25:** Nenhum mockup mostra crédito ou valor de IBS: a tabela do painel e o valor principal do Hero são só de CBS.

## Fora de escopo

- Formulário, backend, banco ou serviço externo para a lista de espera (decisão 3).
- Novo layout, nova seção visual, troca de cores, fontes ou animações. Só texto, remoção das seções da decisão 2 e o mínimo de ajuste de marcação para links, `id` de seção e a marcação de ilustração.
- Novos testes automatizados ou CI da landing (item próprio no backlog). A busca de termos do CA-20 não vira etapa de CI nesta demanda.
- `public/og-image.png`, favicon e marca.
- Domínio próprio e publicação do site (item próprio no backlog; o Vercel não publica a partir do repositório).
- `app/landing-page/README.md` e o design system.
- Política de privacidade e termos de uso (não há coleta de dados na página).
- Resolver as hipóteses H1 a H5.

## Perguntas em aberto

Respondidas pelo usuário em 2026-11-23 (todas as recomendações aceitas):

- **P-1:** e-mail como canal principal e WhatsApp como segundo botão, se houver número comercial. **O endereço e o número ainda não foram informados**; a implementação usa um marcador que a busca do CA-20 acusa.
- **P-2:** a seção de preço sai, junto com o item "Preço" do menu; a FAQ diz que o preço será definido antes do lançamento.
- **P-3:** lista de espera e contato usam o mesmo canal, com mensagem pré-preenchida diferente para cada botão.
- **P-4:** `https://credito-gov.vercel.app` em `og:url`, `robots.txt` e `sitemap.xml`.
- **P-5:** sim. Uma pergunta da FAQ e o texto da chamada final convidam o contador para a mesma lista, sem parceria nem comissão.

Ainda em aberto: o endereço de e-mail e, se houver, o número de WhatsApp (P-1).
