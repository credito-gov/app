# 032-design-system-produto — Design system do produto

- **Status:** em-review
- **Branch:** `docs/032-design-system-produto`
- **Worktree:** `.claude/worktrees/032-design-system-produto`
- **Solicitante / data:** responsável pelo projeto, 2026-11-25
- **Tipo:** funcionalidade, só documentação e design (sem código de aplicação)

## História
Como responsável pelo CreditoGov, quero um design system do produto SaaS, derivado da identidade visual escura da landing e aprovado por mim no Claude Design, registrado no repositório em formato neutro, para que o login, o dashboard e as telas seguintes do produto sejam construídos sobre uma base visual única, acessível e coerente com as regras de domínio, qualquer que seja a stack escolhida.

## Contexto
- **O que existe.** `docs/design/design-system.md` descreve o tema claro da primeira landing (verde `#10B981`, azul `#3B82F6`, fundo `#F9FAFB`, Inter). O redesign escuro da landing (tasks 015–027, na `main`) usa outras cores direto no código, sem tokens documentados: fundo `#060a13`, superfícies `#0c121e`/`#0e1524`, bordas `#1e293b`, texto secundário `#94a3b8`/`#64748b`, verde `#10b981`, âmbar `#fbbf24`, fonte Inter (`app/landing-page/src/index.css` e `src/components/`). O backlog tinha o item "Atualizar o design system para o tema escuro do redesign"; esta demanda o absorve.
- **O que é o produto.** SaaS B2B que mostra o crédito de CBS das compras como caixa: quanto existe, de qual nota e emitente veio, o que ainda está a apropriar ([`../../produto/visao.md`](../../produto/visao.md)). Usuário: dono ou financeiro de pequena e média empresa; canal: contador. Autenticação própria por email e senha (decisão de 2026-08-25, `PROJECT_CONTEXT.md` §3).
- **Vocabulário de valores.** A demanda 030 fixou os quatro totais com o nome oficial da API de apuração da CBS: "A apropriar (pendente)" (`aApropriar`), "Apropriado" (`apropriado`), "Já utilizado" (`utilizado`) e "Saldo credor não utilizado" (`saldoCredor`), sempre separados; débitos de vendas à parte, sem saldo líquido; pendências agrupadas por emitente, com "emitente não identificado" e "emitida pela própria empresa". "Confirmado" e "disponível" não são usados como rótulo de valor sem base (D-3 da [`030`](../030-painel-primeira-versao/us.md)). Fonte dos campos: [`../../referencias/apuracao-cbs/README.md`](../../referencias/apuracao-cbs/README.md).
- **Ferramenta.** O design é feito no Claude Design (Artifacts do tipo "Design System" e "Design" do claude.ai), alimentado com o contexto do produto. A sessão da demanda opera o Claude Design com o briefing do CA-1 e leva cada rodada ao responsável, que aprova visualmente (D-1).
- **Dependências.** A stack do produto está em decisão na demanda 031; os indicadores do dashboard, na demanda 033. As duas correm em paralelo noutras sessões.
- **Referências visuais.** `app/landing-page/src` (tema escuro) e `docs/design/assets/` (marca). **Não** são referência: `app/painel` (ferramenta interna local) e o wireframe `docs/design/wireframes/dashboard-principal.md` (concepção, com compensação de ICMS, antecipação e "Validados", fora do escopo atual).
- **Restrições permanentes.** `PROJECT_CONTEXT.md` §6: crédito não confirmado nunca aparece como disponível; nada de número, promessa, depoimento ou logo de cliente sem base; nenhuma regra de CBS/IBS sem fonte.

## Critérios de aceite

### Contexto e processo

- **CA-1:** O repositório tem, em `docs/design/`, um briefing para o Claude Design com o contexto do produto: o que é, para quem, o vocabulário de valores (os quatro totais, débitos à parte, pendências por emitente), as palavras proibidas como rótulo ("confirmado", "disponível", "pode usar" e equivalentes, sem base), as restrições de texto público, a identidade escura da landing como ponto de partida, o que não é referência (`app/painel`, wireframe da concepção) e a lista do que o design system precisa cobrir (CA-4 a CA-17). O briefing não contém CNPJ real, credencial, valor real nem regra tributária sem fonte.
- **CA-2:** Nada é registrado como definitivo no repositório (tokens, documentação, substituição do `design-system.md`) antes de o responsável aprovar visualmente o artifact de design system no Claude Design. A aprovação fica registrada na demanda com a data e o link (ou identificação) do artifact aprovado.
- **CA-3:** As telas (CA-18 e CA-19) são aprovadas pelo responsável cada uma por si, depois da aprovação do design system. A tela de login vem primeiro. O dashboard só é desenhado depois de a US da demanda 033 estar aprovada, e usa só os indicadores que ela define; enquanto isso, a demanda fica com o dashboard pendente, sem desenho provisório registrado como definitivo.

### Fundamentos

- **CA-4:** Cores em tokens semânticos (fundo, superfícies, bordas, texto principal/secundário/desabilitado, ação primária, foco, e os estados de informação, sucesso, atenção e erro), com o tema escuro como principal, partindo da paleta da landing. Cada token tem nome, valor e uso. O tema claro segue a decisão da P-2.
- **CA-5:** Tipografia com família, escala de tamanhos, pesos e altura de linha por papel (título de página, seção, corpo, rótulo, valor em destaque, texto de tabela), e uma variante de algarismos tabulares para valores.
- **CA-6:** Escala de espaçamento, raios de borda, espessuras de borda e, se houver, sombras ou elevação, todos como tokens.
- **CA-7:** Os tokens ficam no repositório em formato neutro, sem depender de framework: um arquivo de CSS custom properties e um JSON com os mesmos nomes e valores. Nenhum dos dois cita Tailwind, React, shadcn ou outra biblioteca.

### Componentes e estados

- **CA-8:** Botões: primário, secundário, discreto (ghost) e destrutivo, com tamanhos definidos e os estados padrão, passar o mouse, pressionado, foco, desabilitado e carregando.
- **CA-9:** Campos de formulário: texto, email, senha (com mostrar/ocultar), seleção e busca, com rótulo, texto de ajuda e mensagem de erro, nos estados padrão, foco, preenchido, erro e desabilitado.
- **CA-10:** Cartões, incluindo o cartão de total (rótulo, valor em R$, nome oficial do campo como legenda), e navegação do produto (barra lateral ou superior, item ativo, identificação da empresa e saída da sessão).
- **CA-11:** Badges de estado de crédito e de arquivo, cada um com cor, texto e um sinal além da cor (ícone ou forma). Os rótulos de crédito usam o vocabulário do Contexto; nenhum badge diz "confirmado", "disponível" ou equivalente, e um valor a apropriar nunca usa a cor ou o ícone de sucesso.
- **CA-12:** Alertas e avisos em quatro níveis (informação, sucesso, atenção, erro), em bloco na página e em linha no campo, com título, texto e ação opcional. Inclui o aviso permanente de que o produto mostra só CBS e que o IBS não está na fonte de dados.
- **CA-13:** Estados de tela e de componente: vazio (com texto que diz o que faltou, sem exibir R$ 0,00 como se fosse apurado), carregando (esqueleto ou indicador), erro (com o que aconteceu e o que fazer), foco e desabilitado.

### Valores e tabelas

- **CA-14:** Valores em dinheiro em formato brasileiro (`R$ 1.234,56`), sempre com duas casas, alinhados à direita e com algarismos tabulares em colunas. O design system define como aparecem valor negativo (sinal e cor, sem depender só da cor), zero e valor não informado, e diz que a regra de exibição não altera o valor (decimal de precisão fixa, `PROJECT_CONTEXT.md` §6).
- **CA-15:** Tabela de créditos e notas: cabeçalho, linhas, colunas de valor alinhadas à direita, chave de 44 ou 50 posições legível (quebra ou truncamento com acesso ao valor completo), ordenação, filtro, paginação, linha que abre o detalhe, tabela vazia e tabela carregando. Os exemplos de colunas seguem os campos da [`030`](../030-painel-primeira-versao/us.md) (período, tipo de documento, chave, emissão, emitente, apurado, a apropriar, apropriado, utilizado).
- **CA-16:** Os exemplos de totais nunca somam os quatro valores num número só, nunca calculam um a partir dos outros e mostram débitos em bloco separado, sem saldo líquido.

### Acessibilidade

- **CA-17:** Todo par de texto e fundo dos tokens atende WCAG 2.1 AA (4,5:1 para texto normal, 3:1 para texto grande e para bordas de componente e indicador de foco), com a razão de contraste anotada na documentação; o foco é visível em todos os componentes interativos; nenhum estado é comunicado só por cor.

### Telas

- **CA-18:** Tela de login com email e senha: rótulos, mostrar/ocultar senha, botão de entrar com estado carregando, erro de credencial sem dizer se o email existe, erro de conexão, e link de "esqueci a senha" só se a P-5 o incluir. Sem login social, sem credencial de ERP ou da Receita e sem texto que prometa funcionalidade inexistente.
- **CA-19:** Tela de dashboard com os indicadores definidos pela US aprovada da 033, usando os componentes deste design system, no tema principal, em largura de desktop e, conforme a P-6, em largura de celular.
- **CA-20:** Todos os mockups usam dados fictícios e dizem isso na própria tela (ex.: "Dados fictícios"); nenhum CNPJ real (usar CNPJ claramente inventado), nome de empresa real, credencial, depoimento, número de resultado ou promessa sem base; nenhum crédito a apropriar aparece como disponível.

### Registro no repositório

- **CA-21:** Depois das aprovações, `docs/design/` passa a ter: o link do artifact aprovado do design system e de cada tela, os arquivos de tokens (CA-7) e um `design-system.md` novo que substitui o atual (tema claro antigo) e documenta fundamentos, componentes, estados, valores, acessibilidade e as regras de vocabulário. O conteúdo do tema claro antigo deixa de ser apresentado como vigente.
- **CA-22:** `docs/design/README.md` passa a descrever a situação real: o design system novo, os tokens, os links das telas e o wireframe da concepção marcado como superado pelo dashboard desta demanda (ou pendente, se a 033 ainda não tiver liberado o dashboard). `PROJECT_CONTEXT.md` (§2 e changelog) registra que o produto tem design system.

## Fora de escopo
- Código de aplicação: componentes em React ou outro framework, mudança na landing ou no `app/painel`.
- Escolha da stack do produto (demanda 031) e definição dos indicadores do dashboard (demanda 033).
- Telas além de login e dashboard (lista de créditos, detalhe da nota, pendências, cadastro de empresa, recuperação de senha completa, configurações).
- Redesenho da marca ou do logo (exceto se a P-3 decidir o contrário).
- Migrar a landing para os tokens novos.
- Nota de implantação: a demanda é só de documentação.

## Perguntas em aberto
- **P-1: quem opera o Claude Design.** Agentes deste repositório não usam o claude.ai. Recomendação: o fluxo escreve o briefing (CA-1); o responsável cola no Claude Design, itera e aprova, e entrega o link e o export (tokens, imagens) para o registro.
- **P-2: tema claro.** Não há base no repositório para um tema claro do produto. Recomendação: fora desta demanda; os tokens semânticos (CA-4) já permitem acrescentá-lo depois sem renomear nada.
- **P-3: marca e logo.** Usar `docs/design/assets/` e o `logo-lockup-white.png` da landing como estão, ou revisar? Recomendação: usar como estão; revisão de marca seria demanda própria.
- **P-4: fontes.** A landing usa Inter. Manter Inter para tudo, ou usar outra para valores (ex.: monoespaçada nas chaves)? Recomendação: Inter com algarismos tabulares nos valores e uma monoespaçada só para a chave da nota, se o artifact mostrar ganho de leitura.
- **P-5: "esqueci a senha" no login.** A recuperação de senha não está especificada. Recomendação: mostrar o link no desenho do login, sem desenhar o fluxo de recuperação nesta demanda.
- **P-6: celular.** O dashboard e o login precisam de versão para celular? Recomendação: login em desktop e celular; dashboard só em desktop nesta demanda, com celular depois da 033.
- **P-7: link do artifact.** O artifact do claude.ai pode ficar privado na conta do responsável. Recomendação: registrar o link publicado (se ele aceitar publicar) e, sempre, o export em `docs/design/` (tokens e imagens das telas), para o repositório não depender do link.
- **P-8: cores de estado de crédito.** A distinção "a apropriar" × "apropriado" × "já utilizado" é de domínio e qual valor é o saldo utilizável está em aberto para tributarista (D-3 da 030). Recomendação: estado a apropriar em atenção (âmbar), apropriado e já utilizado em neutro/informação, e nenhum valor de crédito em verde de sucesso até haver base.

## Aprovação (2026-11-25)

O responsável aprovou a US com as recomendações de todas as perguntas, com uma correção na P-1:

- **D-1 (era P-1):** a sessão da demanda opera o Claude Design nesta sessão, a partir do briefing (CA-1), e leva cada rodada ao responsável; nada segue sem a aprovação visual dele.
- **D-2 a D-8 (eram P-2 a P-8):** valem as recomendações acima (tema claro fora; marca como está; Inter com algarismos tabulares e monoespaçada só na chave, se ajudar; link "esqueci a senha" sem o fluxo; login em desktop e celular, dashboard só desktop; export sempre em `docs/design/`, link conforme o responsável; a apropriar em âmbar, apropriado e já utilizado em neutro/informação, nenhum crédito em verde de sucesso).

### Mudanças pedidas pelo responsável durante o design (2026-11-25)

- **Paleta a partir do logo:** o verde (`#27a671`) e o azul-marinho (`#354363`, `#001955`) de `docs/design/assets/` passam a ser a fonte das cores; o logo colorido aparece numa placa clara no tema escuro.
- **D-2 alterada: tema claro é o principal e sai primeiro.** O escuro continua, com os mesmos nomes de token.
- **Telas:** login e dashboard desenhados juntos, já com o design da aplicação. A US da 033 foi aprovada em 2026-11-25, então a dependência do CA-3/CA-19 está liberada; a carteira do contador (CA-C1 a CA-C4 da 033) entrou no mesmo canvas.
- **Navegação no topo, sem barra lateral** (pedido do responsável: barra lateral “cara de sistema corporativo”).
- **Login com provedor externo** (Google e Microsoft na proposta), além de e-mail e senha. Muda o CA-18 (“sem login social”) e a decisão de 2026-08-25 (“autenticação própria, email + senha”) do `PROJECT_CONTEXT.md`; os provedores finais e o impacto na arquitetura ficam para a demanda 031. Continua sem credencial de ERP ou da Receita no login.
- **Painel do login com mensagens alternadas:** três mensagens com ilustração feita de componentes do produto, trocando a cada 6 segundos, com pausa sob o ponteiro e sem animação para quem pede menos movimento.

### Aprovação visual (2026-11-25)

- O responsável aprovou visualmente o design system e as telas e pediu o PR ("Aprovo, abra o PR"). Versões aprovadas:
  - design system: <https://claude.ai/artifact/2vTKm7rfbExpg6DSpo8B7U>, aprovado na versão 1795610679-604c. As versões seguintes (1795617722-c486 e 1795620356-7048, a vigente) mudaram só o texto de uso de quatro tokens (`navy`, `on-navy`, `brand` e `body-strong`), para bater com o menu no topo e a regra do emitente. Nenhum valor mudou;
  - telas: <https://claude.ai/artifact/Xj5Mwa2tH2hRGDX7bZWbRg>.
- **D-7 alterada:** as imagens das telas não são exportadas para `docs/design/`. O responsável decidiu registrar só os links, mesmo privados ("registra os links privados... eles são mesmo, então não tem problema"). Os tokens e o CSS de referência ficam no repositório.
- Spec e Tasks dispensadas: a entrega desta demanda é o próprio design aprovado mais o registro do CA-21 e do CA-22.
