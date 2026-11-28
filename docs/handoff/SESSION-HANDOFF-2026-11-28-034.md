# Handoff — 2026-11-28 — demanda 034-login

## O que foi entregue

O login por e-mail e senha, o convite e o acesso por empresa. São duas aplicações novas, que rodam só na máquina local:

- **`app/backend`:** API em Fastify, com Kysely e PostgreSQL 18.7 no Docker Compose (`127.0.0.1:5433`).
  - **Papéis do banco:** `creditogov_migracao`, dono das tabelas, e `creditogov_app`, de trabalho, sem superusuário e sem `BYPASSRLS`.
  - **Segurança por linha:** RLS com `FORCE` em `empresa`, `vinculo_empresa` e `convite`.
  - **Senha:** argon2id, de 12 a 128 caracteres, com a lista de senhas comuns do zxcvbn-ts (MIT).
  - **Sessão:** cookie `cg_sessao`, com HttpOnly, Secure, SameSite=Strict e `Path=/api`. Expira após 2 h sem uso ou 12 h no máximo.
  - **Proteção de requisição:** cabeçalho `X-CreditoGov-Requisicao` e conferência de `Origin`.
  - **Limite de tentativas:** 5 erros em 15 minutos bloqueiam por 15 minutos, por e-mail e por origem.
  - **Proxy:** lista de proxies confiáveis em `CREDITOGOV_CONFIAR_PROXY`.
  - **E-mail:** adaptadores `memoria` e `arquivo`. Em `producao`, a API recusa iniciar.
  - **Administração:** CLI `npm run admin`, com `criar-empresa`, `convidar`, `empresas-do-usuario` e `remover-vinculo`.
- **`app/web`:** React 19, Vite e react-router, só com o tema claro.
  - **Telas:** entrar, esqueci a senha, redefinir senha, aceitar convite, escolher empresa, início da empresa e pessoas.
  - **Para a 033:** `LayoutEmpresa`, `BarraTopo`, `useEmpresaEmFoco()` e `api/cliente.ts`.
- **Documentação:** `AGENTS.md` (comandos de teste das duas aplicações), `PROJECT_CONTEXT.md`, `docs/design/`, `docs/arquitetura/README.md` (§9 e §13), `docs/produto/hipoteses.md` e os READMEs das aplicações.

## Decisões do responsável

- **D-1:** só e-mail e senha. Google e Microsoft ficam para depois, e os botões saíram da tela.
- **D-2:** a conta nasce por convite, sem cadastro aberto.
- **P-1 a P-13:** aceitas as recomendações. Os papéis são titular, contador e colaborador.
- **Spec:** só o tema claro (P-S2).
- **Senhas comuns:** a lista vem do zxcvbn-ts.

## Verificação

- **Testes:** 216 no backend e 113 na web. `lint` e `build` passam nas duas aplicações.
- **Isolamento por empresa:** o teste de R-3 passou com Kysely e RLS no PostgreSQL 18.7, então não foi preciso trocar para Drizzle.
- **Revisão:** três rodadas do `fluxo:reviewer`, com o `pr-review-toolkit` em paralelo.
  - **Rodada 1:** aprovada pelo Reviewer, mas o plugin achou 41 itens, todos corrigidos: confiança no proxy, falhas silenciosas e lacunas de teste.
  - **Rodada 2:** reprovada.
    - **A-1 (CA-18):** as respostas 502, 503 e 504 viraram "Serviço indisponível". Voltaram a `sem_conexao`.
    - **M-1:** a confiança no proxy por contagem de saltos podia ser forjada. Virou uma lista de endereços. DT-18 e DT-19 foram atualizados.
  - **Rodada 3:** aprovada.
  - Foram 2 rodadas de correção, de um limite de 3.
- **Navegador:** o responsável conferiu as telas em 2026-11-28, com dados fictícios.

## Pendências

- **Achados baixos da rodada 3, sem bloqueio:**
  - **B-1:** quatro expectativas de teste da web mudaram no commit da correção, e não no commit de testes.
  - **B-2:** sobrou código sem uso: um parâmetro `tipo?` em `AlertaDeRede.tsx` e um ramo morto em `Pessoas.tsx`.
  - **B-3:** faltam dois testes negativos: conexão vinda de fora da faixa de endereços do proxy, e login com 503 mostrando "Sem conexão".
- **R-7:** a lista de proxies tem de estar exata quando a aplicação for ao ar.
- **R-8:** a raiz `00000000` é a raiz real de um CNPJ. A troca nos testes, nos dados de exemplo e no design fica para uma demanda futura.
- **CA-14:** o texto da US diz "guardada no próprio código", e o DT-17 detalha a origem da lista. Falta alinhar a redação.
- **Textos desatualizados:**
  - `app/web/README.md` ainda diz que a conferência no navegador não foi feita.
  - A task 34 de `tasks.md` ainda diz que a conferência está pendente.
- **Depois do merge:** status `concluída` e `flow-evaluation.md`.
