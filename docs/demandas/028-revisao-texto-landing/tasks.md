# 028-revisao-texto-landing — Tasks

Pequenas, ordenadas, um commit por task. Cada task cita a seção da [Spec](spec.md) e diz como é verificada.

**Verificação primeiro.** A landing não tem testes automatizados (`AGENTS.md`). O papel de teste fica com a busca de termos do CA-20 (Spec › Estratégia de verificação › Busca de termos), com lint, build e conferência visual. A task 1 registra a busca falhando no código atual. As tasks seguintes implementam até ela passar.

**Comandos de referência** (raiz do worktree, Git Bash):

- **Busca CA-20:** o comando exato está na Spec, seção "Busca de termos". Copie-o de lá sem alterar.
- **Busca complementar CA-10:** `grep -rnE 'SocialProof|Metrics|Testimonials|Pricing|avatar-placeholder' app/landing-page/src`
- **Lint e build (CA-21):** `cd app/landing-page && npm run lint && npm run build`

**Regras para todas as tasks:**

- Toda task que mexe em código termina com lint e build passando. Não se commita com erro (`PROJECT_CONTEXT.md` §6).
- O texto vem da Spec › Texto novo, copiado como está.
- Não se mexe em layout, cor nem animação além do que a Spec prevê: `id`, `scroll-mt-[80px]`, os selos "Exemplo ilustrativo" e "Confirmado" e `<p>` virando `<a>` no rodapé.
- Commits em Conventional Commits: `feat(landing): ...`, `docs(028): ...`.

| # | Task | Spec | Verificação | Status |
|---|---|---|---|---|
| 1 | **Verificação que falha.** Rodar a busca CA-20 e a busca complementar no código atual e registrar o resultado na seção "Registro de verificação" abaixo: número de linhas e a saída completa da busca CA-20 num bloco de código, e o número de linhas da complementar. Esperado: 65 linhas na CA-20 e resultado não vazio na complementar. Commit `docs(028): registra a busca de termos antes da mudança` | Estratégia de verificação › Busca de termos | A busca falha (há saída). Registro commitado | ☑ |
| 2 | Criar `app/landing-page/src/config/contato.ts` exatamente como em Contratos: `EMAIL_CONTATO = 'PREENCHER-EMAIL'`, `WHATSAPP_NUMERO = ''`, `MENSAGEM_LISTA`, `MENSAGEM_CONVERSA`, `linkEmail`, `linkWhatsApp` (retorna `null` sem número). Nenhum comentário repete o marcador (CA-15, CA-20) | Contratos › Configuração de contato | Lint e build passam. A busca CA-20 passa a listar também uma linha de `contato.ts`, a do marcador, como esperado | ☑ |
| 3 | Remover Prova Social, Métricas, Depoimentos e Preço: apagar `SocialProof.tsx`, `Metrics.tsx`, `Testimonials.tsx`, `Pricing.tsx` e `src/assets/avatar-placeholder.png`, e tirar imports e uso em `App.tsx`, mantendo a ordem das demais seções (CA-10, CA-11) | Mudanças por camada › Landing (linhas `App.tsx` e arquivos apagados) | A busca complementar volta vazia. Lint e build passam | ☑ |
| 4 | `index.html`, `public/robots.txt` e `public/sitemap.xml`: título, descrições, `og:url`, `og:image` e `twitter:image` absolutos e URL `https://credito-gov.vercel.app` (CA-18, CA-19) | Texto novo › `index.html` | `grep -n 'dominio-a-definir' app/landing-page/index.html app/landing-page/public/*.txt app/landing-page/public/*.xml` vazio. A busca CA-20 não lista nenhuma linha desses três arquivos. Build passa | ☑ |
| 5 | Header: itens do menu da tabela de navegação (desktop e celular), "Entrar" sai, entra "Lista de espera" com `linkEmail(MENSAGEM_LISTA)` (CA-6, CA-15, CA-16) | Contratos › Navegação; Texto novo › Header | A busca CA-20 não lista `Header.tsx`. Lint e build passam. As âncoras ficam válidas ao fim da task 13 | ☑ |
| 6 | Hero: selo, parágrafo, botões ("Entrar na lista de espera" e "Conversar com a equipe" via `linkEmail`), linha abaixo dos botões e mockup ("EXEMPLO ILUSTRATIVO", valor principal só confirmado, cartões "Fornecedores com pendência" e "Pendente", barra "Maior pendência" com selo "Ver notas") (CA-1, CA-2, CA-4 a CA-6, CA-12 a CA-15) | Texto novo › Hero | A busca CA-20 não lista `Hero.tsx`. Lint e build passam | ☑ |
| 7 | HowItWorks: selo, título, subtítulo e três passos; `id="como-funciona"` e `scroll-mt-[80px]` na `<section>` (CA-2, CA-4, CA-7, CA-8, CA-16) | Texto novo › HowItWorks | A busca CA-20 não lista `HowItWorks.tsx`. Lint e build passam | ☑ |
| 8 | DashboardShowcase: selo, título, subtítulo, cabeçalho do cartão com selo "Exemplo ilustrativo", colunas e quatro linhas novas, selo verde "Confirmado", chave da lista pela nota; `id="painel"` e `scroll-mt-[80px]` (CA-2, CA-7, CA-12 a CA-14, CA-16) | Texto novo › DashboardShowcase | A busca CA-20 não lista `DashboardShowcase.tsx`. Lint e build passam (sem aviso de chave duplicada no console do `npm run dev`) | ☑ |
| 9 | ProblemSolution: rótulo "O QUE O CREDITOGOV VAI FAZER" e os três pares problema/solução; `id="problema"` e `scroll-mt-[80px]` (CA-2, CA-4, CA-5, CA-7) | Texto novo › ProblemSolution | A busca CA-20 não lista `ProblemSolution.tsx`. Lint e build passam | ☑ |
| 10 | Features: selo "Em desenvolvimento", título e três cartões; `id="produto"` e `scroll-mt-[80px]` (CA-2, CA-3, CA-5, CA-9, CA-16) | Texto novo › Features | A busca CA-20 não lista `Features.tsx`. Lint e build passam | ☑ |
| 11 | Faq: título "Perguntas frequentes" e as sete perguntas (4 na coluna 1, 3 na coluna 2); `id="faq"` e `scroll-mt-[80px]` (CA-2 a CA-6, CA-11, CA-16) | Texto novo › Faq | A busca CA-20 não lista `Faq.tsx`. Lint e build passam | ☑ |
| 12 | FinalCta: título, subtítulo e botões ("Entrar na lista de espera", "Conversar por e-mail" e "Falar pelo WhatsApp" só quando `linkWhatsApp` não for `null`, com `target="_blank" rel="noopener noreferrer"`); `id="lista-de-espera"` e `scroll-mt-[80px]` (CA-6, CA-15) | Texto novo › FinalCta; Contratos › Configuração de contato | A busca CA-20 não lista `FinalCta.tsx`. Lint e build passam | ☑ |
| 13 | Footer: apresentação nova, colunas "Navegação" e "Contato" com `<a>` (mesmas classes), WhatsApp só com número, linha final "Produto em desenvolvimento." (CA-16, CA-17) | Texto novo › Footer | A busca CA-20 não lista `Footer.tsx`. Lint e build passam | ☑ |
| 14 | Documentação: `PROJECT_CONTEXT.md` §2 (linha "Landing page") e §11 (changelog) e `hipoteses.md` H4, com o texto da Spec. Commit `docs(028): ...` (CA-23) | Mudanças por camada › Documentação | Leitura dos três trechos | ☑ |
| 15 | **Verificação final.** (a) Busca CA-20: a **única** linha é o marcador em `src/config/contato.ts`, que só some na task 16; qualquer outra linha reprova. (b) Busca complementar vazia. (c) Lint e build. (d) Conferência visual em 1280 px e 375 px com a checklist da Spec, incluindo o caso com número de WhatsApp de teste preenchido localmente e **não commitado**. Registrar o resultado de cada item na seção "Registro de verificação". Commit `docs(028): registra a verificação final` (CA-1 a CA-22) | Estratégia de verificação (todas as subseções) | Registro preenchido; (a) a (d) conforme descrito | ☑ |
| 16 | **Depende da resposta do usuário (P-1).** Gravar o e-mail real em `EMAIL_CONTATO` e, se houver, o número em `WHATSAPP_NUMERO` (só dígitos, com DDI e DDD), em `src/config/contato.ts`. Não fazer antes de a sessão principal trazer os valores. Commit `feat(landing): grava o contato da lista de espera` (CA-15, CA-20) | Contratos › Configuração de contato; Implantação | Busca CA-20 sem nenhuma linha e com código de saída `1`. Lint e build passam. Na conferência visual, os botões abrem o e-mail certo e, com número, o WhatsApp aparece | ☐ |

Cobertura: CA-1 (6, 15) · CA-2 (6 a 11, 15) · CA-3 (10, 11, 15) · CA-4 a CA-9 (4 a 13, 15) · CA-10 (3, 15) · CA-11 (3, 11, 15) · CA-12 a CA-14 (6, 8, 15) · CA-15 (2, 5, 6, 12, 13, 15, 16) · CA-16 (5, 7, 8, 10, 11, 13, 15) · CA-17 (13, 15) · CA-18, CA-19 (4, 15) · CA-20 (1, 15, 16) · CA-21 (todas as tasks de código, 15) · CA-22 (15) · CA-23 (14).

A demanda só fica pronta para revisão final com a task 16 feita. Sem ela, o CA-20 continua reprovado pelo marcador, como a Spec prevê.

## Registro de verificação

Preenchido pelo Developer nas tasks 1 e 15.

### Task 1 — antes da mudança

- Busca CA-20: **65 linhas** (a busca falha, como esperado). Saída completa:

```text
app/landing-page/src/components/DashboardShowcase.tsx:21:    tribute: 'Crédito Presumido',
app/landing-page/src/components/DashboardShowcase.tsx:28:    tribute: 'Diferimento CBS',
app/landing-page/src/components/DashboardShowcase.tsx:53:            um dashboard auditável.
app/landing-page/src/components/Faq.tsx:8:        'Sim. A integração é feita via procuração eletrônica específica do e-CAC. Não armazenamos senhas de segurança e todo o tráfego é criptografado.',
app/landing-page/src/components/Faq.tsx:20:        'Seus créditos homologados podem ser antecipados com fintechs parceiras a taxas de deságio extremamente competitivas diretamente no painel.',
app/landing-page/src/components/Faq.tsx:23:      question: 'Qual a duração do período de teste gratuito?',
app/landing-page/src/components/Faq.tsx:25:        'Você usufrui de todas as vantagens da plataforma por 14 dias. Não solicitamos dados de pagamento para início do teste.',
app/landing-page/src/components/Features.tsx:6:    title: 'Sincronização diária',
app/landing-page/src/components/Features.tsx:18:    title: 'Dois cliques para liquidar',
app/landing-page/src/components/Features.tsx:20:      'Abata débitos tributários diretamente com os saldos validados ou solicite a antecipação imediata com taxas reduzidas.',
app/landing-page/src/components/FinalCta.tsx:39:            href="#testar-gratis"
app/landing-page/src/components/FinalCta.tsx:42:            Testar grátis por 14 dias
app/landing-page/src/components/FinalCta.tsx:45:            href="#falar-com-especialista"
app/landing-page/src/components/FinalCta.tsx:48:            Falar com especialista
app/landing-page/src/components/Footer.tsx:11:    links: ['Antecipação', 'Compensação', 'Previsões', 'e-CNPJ'],
app/landing-page/src/components/Footer.tsx:33:              Auditoria de crédito fiscal CBS/IBS com atualização diária via Receita Federal.
app/landing-page/src/components/Footer.tsx:58:          <p>Auditoria tributária, todo santo dia.</p>
app/landing-page/src/components/Header.tsx:31:          <a href="#entrar" className="text-[14px] font-medium whitespace-nowrap text-[#94a3b8]">
app/landing-page/src/components/Header.tsx:56:          <a href="#entrar" className="text-[14px] text-[#94a3b8]">
app/landing-page/src/components/Hero.tsx:23:              Integrado à Receita Federal
app/landing-page/src/components/Hero.tsx:32:            Sincronizamos com a Receita Federal todos os dias para revelar impostos pagos a maior
app/landing-page/src/components/Hero.tsx:38:              href="#testar-gratis"
app/landing-page/src/components/Hero.tsx:41:              Ver meus créditos em 14 dias grátis
app/landing-page/src/components/Hero.tsx:44:              href="#agendar-demonstracao"
app/landing-page/src/components/Hero.tsx:47:              Agendar demonstração
app/landing-page/src/components/Hero.tsx:52:            Sem cartão de crédito · Sem fidelidade · Integração imediata via e-CNPJ
app/landing-page/src/components/Hero.tsx:73:                SALDO DE CRÉDITOS DISPONÍVEIS
app/landing-page/src/components/Hero.tsx:80:                <p className="text-[12px] font-semibold text-[#10b981]">Validado</p>
app/landing-page/src/components/HowItWorks.tsx:6:    title: 'Conexão e-CNPJ imediata',
app/landing-page/src/components/HowItWorks.tsx:8:      'Com apenas uma autorização via e-CAC, nosso software sincroniza diretamente com a base da Receita Federal.',
app/landing-page/src/components/HowItWorks.tsx:12:    title: 'Auditoria contínua',
app/landing-page/src/components/HowItWorks.tsx:20:      'Com os saldos validados, você abate guias de impostos ou solicita antecipação de caixa sem burocracia.',
app/landing-page/src/components/HowItWorks.tsx:55:            Como funciona a auditoria diária
app/landing-page/src/components/HowItWorks.tsx:58:            Uma apuração contínua e integrada que substitui processos retroativos demorados por
app/landing-page/src/components/HowItWorks.tsx:59:            dados em tempo real.
app/landing-page/src/components/Metrics.tsx:5:    number: 'R$ 4.2B',
app/landing-page/src/components/Metrics.tsx:8:      'Auditados com precisão cirúrgica de acordo com a legislação do e-Social e IBS/CBS.',
app/landing-page/src/components/Metrics.tsx:11:    number: '1.840+',
app/landing-page/src/components/Metrics.tsx:17:    number: '14 Dias',
app/landing-page/src/components/Metrics.tsx:18:    title: 'De teste totalmente grátis',
app/landing-page/src/components/Metrics.tsx:19:    description: 'Suba o seu certificado digital em segundos e confira se há crédito parado agora.',
app/landing-page/src/components/Pricing.tsx:4:  'Sincronização diária estruturada com e-CAC',
app/landing-page/src/components/Pricing.tsx:6:  'Gestão ilimitada de e-CNPJs',
app/landing-page/src/components/Pricing.tsx:7:  'Auditorias retroativas inclusas',
app/landing-page/src/components/Pricing.tsx:22:            <p className="text-[11px] font-bold text-[#047857] uppercase">Preço Transparente</p>
app/landing-page/src/components/Pricing.tsx:39:              <p className="text-[48px] font-extrabold text-[#060a13]">Sob Consulta</p>
app/landing-page/src/components/Pricing.tsx:44:              + taxa de sucesso regressiva sobre o crédito compensado ou antecipado no mês de
app/landing-page/src/components/Pricing.tsx:59:              href="#testar-gratis"
app/landing-page/src/components/Pricing.tsx:62:              Começar agora 14 dias grátis
app/landing-page/src/components/ProblemSolution.tsx:6:    solutionTitle: 'O número se atualiza sozinho às 00:05',
app/landing-page/src/components/ProblemSolution.tsx:8:      'Sincronizamos com a Receita Federal todo dia de madrugada — o saldo já está pronto quando você abre o painel.',
app/landing-page/src/components/ProblemSolution.tsx:11:    problemTitle: 'Crédito prescreve sem ninguém ver',
app/landing-page/src/components/ProblemSolution.tsx:16:      'O painel avisa quando um crédito está perto de expirar, com o valor exposto para você agir a tempo.',
app/landing-page/src/components/ProblemSolution.tsx:22:    solutionTitle: 'Compensar ou antecipar em dois cliques',
app/landing-page/src/components/ProblemSolution.tsx:24:      'Use o crédito para abater um débito de CBS/IBS ou antecipe com uma fintech parceira, direto no painel.',
app/landing-page/src/components/SocialProof.tsx:16:          Mais de 1.840 empresas conectadas no Brasil
app/landing-page/src/components/Testimonials.tsx:14:      'A antecipação de saldo validado nos deu a previsibilidade necessária para manter o fluxo operacional em um momento estratégico de expansão comercial.',
app/landing-page/src/components/Testimonials.tsx:21:      'Finalmente uma tecnologia que atende a complexidade do contábil e do executivo ao mesmo tempo. A integração com e-CNPJ foi concluída em instantes.',
app/landing-page/index.html:13:    <title>CreditoGov — Crédito tributário CBS/IBS, todo santo dia</title>
app/landing-page/index.html:16:      content="Sincronizamos com a Receita Federal todos os dias, mostramos exatamente quanto sua empresa tem de crédito de CBS/IBS e liberamos o caminho para compensar ou antecipar."
app/landing-page/index.html:26:      content="Sincronizamos com a Receita Federal todos os dias, mostramos exatamente quanto sua empresa tem de crédito de CBS/IBS e liberamos o caminho para compensar ou antecipar."
app/landing-page/index.html:29:    <meta property="og:url" content="https://[dominio-a-definir]" />
app/landing-page/index.html:38:      content="Sincronizamos com a Receita Federal todos os dias e liberamos o caminho para compensar ou antecipar seu crédito de CBS/IBS."
app/landing-page/public/robots.txt:37:Sitemap: https://[dominio-a-definir]/sitemap.xml
app/landing-page/public/sitemap.xml:4:    <loc>https://[dominio-a-definir]/</loc>
```

- Busca complementar: **13 linhas** (resultado não vazio, como esperado).

### Task 15 — depois da mudança

- (a) Busca CA-20: **1 linha**, a esperada (o marcador, que só some na task 16). Nenhuma outra linha:

```text
app/landing-page/src/config/contato.ts:3:export const EMAIL_CONTATO = 'PREENCHER-EMAIL'
```

- (b) Busca complementar: vazia (código de saída `1`).
- (c) Lint e build: `npm run lint` e `npm run build` em `app/landing-page` sem erro. `dist/` fora do commit.
- (d) Conferência visual 1280 px: **pendente, fica para a sessão principal.** O Developer não tem navegador. Subir com `cd app/landing-page && npm run dev` (http://localhost:5173) e seguir a checklist da Spec.
- (d) Conferência visual 375 px: **pendente, fica para a sessão principal** (mesmo comando, com as ferramentas de desenvolvedor em 375 px).
- (d) Caso com número de WhatsApp de teste: **pendente, fica para a sessão principal.** Preencher `WHATSAPP_NUMERO` localmente com um número de teste, conferir o botão "Falar pelo WhatsApp" na chamada final e o item "WhatsApp" no rodapé, e **não commitar**.

### Correções da rodada 1 de revisão

- **CA-22, rolagem horizontal em 375 px:** na barra verde do mockup do Hero, saiu `whitespace-nowrap` dos dois `<p>`; entraram `min-w-0` no bloco de texto, `shrink-0` no selo "Ver notas" e `gap-3` na barra. Ajuste de classe necessário para cumprir o CA-22; o texto não mudou.
- **CA-12, contraste:** selo "EXEMPLO ILUSTRATIVO" do Hero de `text-[#64748b]` para `text-[#94a3b8]`, o mesmo tom do selo do painel.
- **CA-16/CA-22, menu do celular:** `onClick={() => setIsMenuOpen(false)}` em cada link do menu, inclusive "Lista de espera".
- **CSS morto:** removida a classe `.reveal-scale-bounce` de `index.css` (só o `Metrics.tsx`, já apagado, a usava). Nenhum `.tsx` a usa.
- Depois das correções: busca CA-20 só com a linha do marcador em `contato.ts`; busca complementar vazia; lint e build sem erro. Conferência visual refeita pela sessão principal.
