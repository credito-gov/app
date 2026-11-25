# Handoff — 2026-11-25 — demanda 032-design-system-produto

## O que foi entregue

O design system do produto e as primeiras telas foram desenhados no Claude Design e aprovados visualmente pelo responsável em 2026-11-25. A demanda é só de documentação: não há código de aplicação.

- **Design system:** <https://claude.ai/artifact/2vTKm7rfbExpg6DSpo8B7U>
  - Aprovado na versão 1795610679-604c.
  - A vigente é a 1795620356-7048, que mudou só o texto de uso de quatro tokens.
- **Telas:** <https://claude.ai/artifact/Xj5Mwa2tH2hRGDX7bZWbRg>
  - Login, login com erro e login no celular sem conexão.
  - Dashboard e dashboard com os estados dos dados.
  - Carteira do contador.
  - Todos os dados são fictícios.
- Os dois artifacts são privados ao dono. O responsável decidiu registrar só os links, sem exportar as imagens (D-7 alterada).
- **No repositório:**
  - `docs/design/briefing.md`: briefing do CA-1, consolidado depois da aprovação e declarado como tal.
  - `docs/design/design-system.md`: novo, substitui o tema claro antigo da landing.
  - `docs/design/tokens/`: `tokens.json`, `tokens.css` e `bundle.css` (CSS de referência dos componentes, prefixo `cg-`, sem framework).
  - `docs/design/README.md`: atualizado.
  - `PROJECT_CONTEXT.md`: §2, §3 e changelog.

## Decisões do responsável durante o design

- Paleta tirada do logo.
- Tema claro principal; o escuro fica disponível com os mesmos nomes de token.
- Navegação por menu no topo, sem barra lateral.
- Painel do login com três mensagens alternadas.
- **Login com provedor externo** (Google e Microsoft propostos), além de e-mail e senha. Isso revê a decisão de 2026-08-25 ("autenticação própria, email + senha") e muda o texto original do CA-18. Os provedores finais e o impacto na arquitetura ficam para a **031**.
- Login e dashboard desenhados e aprovados juntos, já que a US da 033 estava aprovada. Isso muda a ordem prevista no CA-3.
- Spec e Tasks dispensadas: a entrega é o design aprovado mais o registro dos CA-21 e CA-22.

## Verificação

- Revisão pelo `fluxo:reviewer` em três rodadas: reprovado, reprovado, aprovado.
  - Rodada 1: contraste de `line-control`, item ativo da navegação, regra do emitente, tamanho do valor do total, caminho do logo branco e imagens das telas.
  - Rodada 2: briefing do CA-1 e texto de uso de `brand` e `on-navy`.
- Tokens em `docs/design/tokens/` conferidos byte a byte (`cmp`) contra os arquivos publicados no artifact.
- Os contrastes WCAG AA foram recalculados pelo reviewer.
- Não conferido: a renderização do canvas, que só o responsável viu.

## Pendências

- 031: provedores do login externo e o impacto na arquitetura de autenticação.
- Na implementação: marcas oficiais do Google e da Microsoft, conforme as regras de cada provedor (nas telas há marcador provisório).
- Achados menores da última rodada, sem bloqueio: o briefing foi escrito depois da aprovação, e o rótulo "ainda não liberado pela Receita" merece um olhar do tributarista se surgir dúvida.
