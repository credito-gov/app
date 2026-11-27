# Design

Design do produto CreditoGov, aprovado pelo responsável em 2026-11-25 na demanda [032](../demandas/032-design-system-produto/us.md). Dados de todas as telas são fictícios.

| Arquivo | O que é | Situação |
|---|---|---|
| [`briefing.md`](briefing.md) | Briefing para o Claude Design: produto, vocabulário, restrições e o que o design system cobre | Registro do contexto usado, consolidado depois da aprovação |
| [`design-system.md`](design-system.md) | Design system do produto: fundamentos, componentes, estados, valores, acessibilidade e vocabulário | Vigente. Substitui o documento do tema claro da primeira landing |
| [`tokens/tokens.json`](tokens/tokens.json) | Tokens de cor (tema claro e escuro), tipografia, espaço, raio, sombra e tamanho | Vigente. Mesmos nomes e valores do `tokens.css` |
| [`tokens/tokens.css`](tokens/tokens.css) | Os mesmos tokens como propriedades CSS | Vigente |
| [`tokens/bundle.css`](tokens/bundle.css) | CSS de referência dos componentes, classes com prefixo `cg-` | Referência, sem framework. A stack é da demanda 031 |
| [`assets/`](assets/) | Marca: `brand.png`, `icon.png`, `logo.png` | Em uso |
| [`wireframes/dashboard-principal.md`](wireframes/dashboard-principal.md) | Rascunho do painel da concepção | **Superado** pelo dashboard desta demanda. Mostra compensação de ICMS e antecipação, que não estão validadas. Só para consulta histórica |

## Artifacts aprovados (claude.ai)

Os dois artifacts são **privados ao dono** (conta do responsável). Quem não tiver acesso deve usar este diretório: os tokens e o `design-system.md` são o registro que o repositório mantém. Os arquivos das telas (`.dc.html`) não estão no repositório.

- Design system "CreditoGov", versão `1795620356-7048`: <https://claude.ai/artifact/2vTKm7rfbExpg6DSpo8B7U>
- Canvas "CreditoGov — Login e Dashboard": <https://claude.ai/artifact/Xj5Mwa2tH2hRGDX7bZWbRg>. Cada tela é um artboard do canvas:

| Tela (artboard) | O que mostra |
|---|---|
| Login | Entrada por provedor externo (Google e Microsoft na proposta) e por e-mail e senha; painel da marca com três mensagens alternadas |
| Login — e-mail ou senha incorretos | Erro de credencial sem revelar se o e-mail existe; botão carregando |
| Login no celular — sem conexão | Versão para celular com erro de conexão |
| Dashboard | Os quatro totais separados, pendência por emitente, datas de atualização, débitos à parte (indicadores da demanda 033) |
| Dashboard — estados dos dados | Antes da primeira consulta, sem créditos, falha, desatualizado, serviço sem dados |
| Carteira do contador | Empresas do escritório, cada uma com os próprios indicadores e sem total da carteira |

## Pontos de atenção

- O login por provedor externo revê a decisão de 2026-08-25 de autenticação própria (e-mail e senha). Os provedores finais e o impacto na arquitetura ficam para a demanda 031. As marcas oficiais do Google e da Microsoft entram na implementação.
- A **landing mantém o tema próprio** (redesign escuro, tasks 015–027) e não usa estes tokens. Alinhá-la é outra demanda. As imagens da landing ficam em `app/landing-page/src/assets/`.
