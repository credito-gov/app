# Handoff — 2026-11-28 — demanda 035-correcoes-034

## O que foi entregue

Correção das pendências deixadas pela 034 (bug.md em `docs/demandas/035-correcoes-034/bug.md`), branch `fix/035-correcoes-034`.

- **R-8, raiz de CNPJ real nos dados fictícios:** a raiz `00000000`, adotada como fictícia no design da 032 e copiada para a 034, é de empresa real. Foi trocada em testes, READMEs, um comentário de código e documentos (`docs/design/`, US, Spec e Tasks da 034). Mapa, aplicado numa passada só para manter a ordem por `cnpj_raiz`: `00000000`→`11111111`, `11111111`→`22222222`, `22222222`→`33333333`. O nome da empresa saiu do R-8 da Spec da 034.
- **Varreduras novas:** `app/backend/test/varredura.test.ts` e `app/web/test/varredura.test.ts` falham se `00000000`, `00.000.000` ou a forma escapada `00\.000\.000` aparecer em `src/`, `test/` ou `README.md`, e exigem ter lido ao menos um arquivo em `src/` e um em `test/`. A web confere também que os CNPJs completos do `PainelMarca` têm dígito verificador errado.
- **Regra no `PROJECT_CONTEXT.md` §6:** raiz fictícia só da lista conferida (com data e método), CNPJ completo de exemplo com dígito errado, nunca nomear o dono de raiz real. Linha da 035 no §11.
- **B-2:** saiu o parâmetro `tipo?` de `AlertaDeRede` (e das 9 chamadas) e o ramo morto de `Pessoas.tsx`, que virou a constante `TEXTO_DE_REDE`.
- **B-3:** testes de conexão de fora do CIDR e do endereço único do proxy (negativos e o positivo de `192.168.1.1`), e de 503 sem corpo no login mostrando "Sem conexão".
- **CA-14 da 034:** redação alinhada ao DT-17 (lista local de `@zxcvbn-ts/language-common` 4.2.0).
- **Conferência no navegador:** `app/web/README.md` e a task 34 da 034 registram a conferência do responsável em 2026-11-28.

## Decisões do responsável

- **P-1 = A:** raiz numérica conferida pelo responsável. Em 2026-11-28 ele consultou na página pública "Comprovante de Inscrição e de Situação Cadastral" da Receita as matrizes `11.111.111/0001-91`, `22.222.222/0001-91`, `33.333.333/0001-91` e `44.444.444/0001-91`; nenhuma existe. `44444444` fica de reserva.
- **P-2 adiada:** as raízes fictícias do painel (`90817263`, `55443322`, `11223344`, `44556677`, `55667788`, `66778899`) e o `12.345.678` da Spec da 030 não foram conferidas. Pendência registrada no §6.

## Verificação

- **Testes:** backend 220 (com `npm run banco:subir`), web 117, painel 425, apuracao-cbs 377. `lint` e `build` passam no backend, na web e no painel.
- **Testes primeiro:** as varreduras falharam antes da troca; os testes de proxy e de 503 foram checados por mutação local (`trustProxy: true`; tirar o 503 de `cliente.ts`), sem commit.
- **Revisão:** `fluxo:reviewer` aprovou na primeira rodada, com achados baixos; o `pr-review-toolkit` (code-reviewer, pr-test-analyzer, silent-failure-hunter) apontou lacunas pequenas. Uma rodada de correção (de um limite de 3) tratou seis itens; o Reviewer aprovou de novo.

## Pendências e riscos

- **033:** usa `00000000` nas tasks. Depois do merge da 035 na `main`, as varreduras quebram os testes da 033 até ela adotar o mesmo mapa. A sessão da 033 foi avisada em 2026-11-28. Os conflitos nos READMEs devem ser pequenos (uma linha no backend, um parágrafo na web).
- **Banco de teste compartilhado:** a 033 e a 035 usam o mesmo `creditogov_teste`; rodar as duas suítes ao mesmo tempo dá erro `57P01` intermitente. Não é defeito de código.
- **Histórico do Git:** o nome da empresa dona de `00000000` continua no histórico da `main` (versão anterior da Spec da 034). Apagar exigiria reescrever a `main`; decisão do responsável.
- **Achados baixos não tratados:** as varreduras não pegam a forma com barra dupla (`00\\.000\\.000`, em literal de string para `new RegExp`) e não têm âncora de dígito antes do padrão pontuado. O `app/painel` não tem varredura própria.
- **Validade da conferência:** vale na data em que foi feita.
