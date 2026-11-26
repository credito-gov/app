# Handoff — 2026-11-26 — demanda 031-stack-arquitetura

## O que foi entregue

Só documentação. A arquitetura do produto está decidida e registrada; nada foi construído.

- **[`docs/arquitetura/README.md`](../arquitetura/README.md)** (novo): documento de decisão com 13 seções e as decisões AD-1 a AD-14, cada uma com problema, critérios, alternativas com prós e contras, recomendação, escolha do responsável com data, descartadas e fontes.
- **`docs/PROJECT_CONTEXT.md`:** §2 (painel como ferramenta interna; dashboard do usuário feito do zero na 033; backend com arquitetura decidida), §3 (sete decisões novas de 2026-11-25), §4 (stack decidida no lugar da proposta da concepção), §5, §7, §10 e §11.
- **`docs/produto/hipoteses.md`:** premissa do acesso pela credencial, perguntas operacionais do limite na H1, login gov.br, LGPD; "Stack do backend e hospedagem" resolvida, com o provedor pendente da PD-1.
- **`docs/README.md`:** pasta `arquitetura/` no índice.

Especificação: [`us.md`](../demandas/031-stack-arquitetura/us.md) (CA-1 a CA-29, mais CA-21a e CA-22a), [`spec.md`](../demandas/031-stack-arquitetura/spec.md) e [`tasks.md`](../demandas/031-stack-arquitetura/tasks.md) (tasks 1 a 12).

## Decisões do responsável (2026-11-25)

Premissas, com as palavras dele na US e no documento:

- O acesso a cada CNPJ é decidido pela Receita, pela credencial do gov.br; o CreditoGov não verifica procuração, só registra quem entregou cada credencial.
- SaaS multi-inquilino: uma instalação única operada pelo CreditoGov.
- Cada cliente informa a própria credencial (cenário A, a base); credencial de procurador para vários CNPJs (cenário B) é contingência.
- Email e senha são a base do login; Google, Apple, Microsoft e gov.br não ficam bloqueados. A lista final é da demanda de login.

Escolhas ("Aprovo todas"): Node 24 + TypeScript; `app/backend` (API com Fastify + coletor) e `app/web` (React 19 + Vite, página única); PostgreSQL; Kysely; tabelas compartilhadas com segurança por linha; nuvem gerenciada (provedor pendente da PD-1); arquivo bruto imutável em armazenamento de objetos; coletor contínuo com estado no banco; credencial com cifra de envelope (KMS); cenário A construído com o modelo aceitando o B; autenticação própria no backend com entidade `identidade`; decimal exato do banco à tela; `apuracao-cbs` e `painel` seguem como ferramentas internas.

## Verificação

Sem teste automatizado (entrega só de documentação). Checagens V1 a V6 do `tasks.md`, rodadas por task e no fim: diff só em `docs/`; nenhum número de 11 dígitos ou mais; nenhum segredo; toda afirmação sobre a API com fonte em `docs/referencias/`, nenhum preço; links relativos abrindo; conteúdo contra os CA.

Revisão: o Reviewer aprovou nas três rodadas e na conferência final. As correções vieram da revisão complementar (`code-reviewer`):

1. Rodada 1: remoção da credencial não alcança backups; condições do isolamento por linha (`FORCE ROW LEVEL SECURITY`, papel sem posse e sem `BYPASSRLS`, `SET LOCAL`); estado `abrindo` para não gastar chamada após queda; nomes de estado; conta do cenário B (4 CNPJs na cadência diária, 28 a cada 7 dias); demanda 033 no `PROJECT_CONTEXT`; AD-12 com a decisão de login da 032.
2. Rodada 2: papel de agendamento do coletor declarado; superusuário excluído; Spec alinhada ao documento.
3. Rodada 3: a função de agendamento voltaria vazia com `FORCE ROW LEVEL SECURITY`. Passado o limite, o responsável escolheu a opção (a): dono próprio sem login com `BYPASSRLS`, `search_path` fixo, `REVOKE EXECUTE ... FROM PUBLIC`, só o papel de agendamento executa.

Task 12: a `main` (com a 032, PRs #33 e #34) foi mergeada na branch; os conflitos em `PROJECT_CONTEXT.md` (§2, §3, §11) e no kanban foram resolvidos mantendo as duas entregas. As linhas da 032 ficaram idênticas às da `main`.

## Pendências

- **PD-1:** preços de hospedagem, banco, KMS e serviço de identidade com página oficial e data, para escolher o provedor. Não trava a primeira demanda de backend, que roda local.
- **Perguntas sem fonte** em `hipoteses.md`: credencial de procurador para vários CNPJs; limite por credencial ou por credencial e CNPJ; o que conta no limite e o fuso; papel do `niConsumidor`; login gov.br em software privado; quatro perguntas de LGPD para advogado.
- **R-6:** o passo 4 de `produto/visao.md` ("Primeira versão do painel") pode ser lido como a 030. Não alterado; decisão do responsável.
- **Opcional para a primeira demanda de backend:** pacote compartilhado do leitor (AD-14, backlog).
- Demandas que esperavam esta: login e implementação do dashboard (033).
