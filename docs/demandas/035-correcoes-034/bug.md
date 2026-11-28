# 035-correcoes-034 — Correções deixadas pela 034: raiz de CNPJ real nos dados fictícios e achados baixos

- **Status:** diagnóstico-em-revisão
- **Tipo:** correção
- **Trivial:** não
- **Branch:** `fix/035-correcoes-034`
- **Worktree:** `.claude/worktrees/035-correcoes-034`
- **Solicitante / data:** responsável pelo produto, 2026-11-28 (pendências do handoff `docs/handoff/SESSION-HANDOFF-2026-11-28-034.md`)

## Relato

A demanda 034 terminou com cinco pendências, todas já na `main`:

1. **R-8 (principal).** A raiz de CNPJ `00000000`, adotada como fictícia no design system (032) e copiada para a US, a Spec, os testes e os READMEs da 034, é a raiz de um CNPJ real, de empresa real. Isso contraria a regra de nunca usar dado real em código, teste, documento ou mensagem de commit (US da 034, linha 64; `tasks.md` da 034, linha 13). A 033, em implementação em paralelo, já copiou a mesma raiz para as próprias tasks.
2. **B-2.** Sobrou código sem uso em `app/web`: o parâmetro `tipo?` de `AlertaDeRede` e um ramo morto em `Pessoas.tsx`.
3. **B-3.** Faltam dois testes negativos: conexão vinda de fora da faixa CIDR do proxy confiável (backend), e login com 503 mostrando "Sem conexão" (web).
4. **CA-14 da 034.** A US diz que a lista de senhas comuns é "guardada no próprio código"; o DT-17 diz que ela vem de uma dependência e é filtrada em tempo de execução. A redação diverge.
5. **Texto desatualizado.** `app/web/README.md` ("Conferência no navegador") e a task 34 da 034 dizem que a conferência no navegador está pendente. O responsável fez a conferência em 2026-11-28, com dados fictícios (handoff da 034, "Verificação").

Impacto: nenhum em produção (nada foi ao ar). O impacto do item 1 é de conformidade e de cópia: toda demanda nova parte desses exemplos.

## Como reproduzir

1. Na raiz do repositório: `git grep -n -E "00000000|00\.000\.000" -- app docs/design docs/demandas/034-login docs/PROJECT_CONTEXT.md`.
2. Descartar os falsos positivos listados em "Causa raiz › Falsos positivos" (UUID, número de DARF, trechos de chave de acesso, decimal).
3. O que sobra são usos da raiz `00000000` como empresa "fictícia".
4. B-2: abrir `app/web/src/componentes/AlertaDeRede.tsx:6` (o parâmetro `tipo` é declarado e não é lido) e `app/web/src/paginas/Pessoas.tsx:22-24` (o ramo falso do ternário nunca roda, porque `FalhaDeRede` só tem `"sem_conexao"`).
5. B-3: em `app/backend/test/api/proxy.test.ts` não há teste com conexão de fora do CIDR; em `app/web/test/entrar.test.tsx` não há teste de 503 em `POST /api/sessao`.
6. Itens 4 e 5: ler `docs/demandas/034-login/us.md:90`, `spec.md:351`, `tasks.md:60` e `tasks.md:391`, e `app/web/README.md:32`.

## Esperado × atual

- **Esperado:**
  - Nenhum CNPJ ou raiz real em código, teste, documento ou commit (US da 034, linha 64; `tasks.md` da 034, linha 13; `docs/design/briefing.md:46`, "nunca um real").
  - Código sem parâmetro nem ramo inalcançável. O lint do projeto não pega esses dois casos.
  - Os dois negativos cobertos por teste. O CA-17 e o CA-26 da 034 tratam da origem atrás de proxy; o CA-18 trata de "Sem conexão".
  - US, Spec, tasks e README dizendo a mesma coisa.
- **Atual:**
  - A raiz `00000000` aparece como fictícia em 2 documentos de design, em 4 documentos da 034, em 1 arquivo de código e em 13 arquivos de teste ou README do backend e da web, mais 1 teste do painel.
  - O código morto está nos dois arquivos citados.
  - Os dois testes não existem.
  - Os textos divergem.

## Causa raiz

### R-8: raiz real adotada como fictícia

**Origem.** A raiz entrou no design system da 032 sem conferência: `docs/design/design-system.md:8` e `docs/design/briefing.md:46` (commits `5ffad4d` e `fd784a5`, de 2026-11-25). O formato `00.000.000/0001-00` foi tomado por "obviamente fictício". Ele não é: a raiz é de empresa real. O CNPJ completo `00.000.000/0001-00` não existe, porque o dígito verificador certo para `000000000001` é `91`, e não `00`. Mas o produto identifica a empresa pela **raiz** (CNPJ base de 8 dígitos, `docs/referencias/apuracao-cbs/README.md:41`), e a raiz existe. A 034 copiou a raiz para a US, a Spec e os testes. O problema só foi notado na implementação (R-8 da Spec da 034; `flow-evaluation.md:36`).

**Por que não existe hoje um jeito documentado de garantir uma raiz inexistente.** O que as fontes dizem:

- A raiz numérica não tem dígito verificador. O DV cobre só o CNPJ de 14 posições (módulo 11, como na chave de acesso; `docs/referencias/documentos-fiscais/README.md`, fontes F-A e F-D). Um CNPJ **completo** com DV errado é comprovadamente inexistente. Uma **raiz** de 8 dígitos não tem essa garantia por cálculo.
- `docs/referencias/` não traz faixa de raízes reservada para teste ou exemplo. Também não traz letra vedada no CNPJ alfanumérico: "quais letras são vedadas" está em "Não confirmado" no README de documentos fiscais, e o texto da IN RFB nº 2.229/2024 não foi aberto.
- A página "CNPJ alfanumérico" da Receita (fonte F-E, lida de novo em 2026-11-28) fala do "iminente esgotamento dos números de CNPJ disponíveis". Diz também que o CNPJ alfanumérico "será atribuído, a partir de Julho de 2026, exclusivamente a novas inscrições", e que os números existentes não mudam. A página não fala de raiz reservada.
- O PDF de perguntas e respostas da Receita sobre o CNPJ alfanumérico não foi lido: a guarda do agente recusou gravar o arquivo temporário.

Conclusão: não há fonte que torne uma raiz numérica impossível de atribuir. Por isso a raiz substituta é conferida pelo responsável (P-1, decidida: alternativa A).

**As raízes `11111111` e `22222222` têm o mesmo problema, com uma diferença.** Elas também foram escolhidas sem conferência, e não se sabe se pertencem a alguém. A consulta pública do CNPJ pede o número completo e tem captcha: a conferência é do responsável. Os CNPJs completos `11.111.111/0001-11` e `22.222.222/0001-22`, que a tela de login mostra (`PainelMarca.tsx:55-56`), têm DV errado (o certo é `91` nos dois) e não existem. **Resultado da conferência (P-1, 2026-11-28):** o responsável consultou as matrizes `11.111.111/0001-91` e `22.222.222/0001-91` no "Comprovante de Inscrição e de Situação Cadastral" da Receita, e nenhuma existe. Essas duas raízes passam a ser fictícias conferidas.

**Raízes do painel.** `app/painel` usa outras raízes escolhidas sem conferência: `90817263` (empresa dos fictícios), `55443322`, `11223344`, `44556677`, `55667788` e `66778899` (emitentes), e `12.345.678` no exemplo da Spec da 030. A dúvida é a mesma. P-2 foi adiada pelo responsável: elas não mudam nesta correção e ficam registradas como pendência no §6.

**Inventário da raiz `00000000`** (usos como empresa fictícia; levantado com `git grep` em 2026-11-28, na `main` em `39e4fae`):

| Lugar | Arquivo:linha |
|---|---|
| Design | `docs/design/design-system.md:8` (`00.000.000/0001-00`); `docs/design/briefing.md:46` |
| Demanda 034 | `us.md:64`; `spec.md:236`, `spec.md:276`, `spec.md:365` (R-8, que também **nomeia a empresa dona da raiz**), `spec.md:393`, `spec.md:403`; `tasks.md:13`, `tasks.md:226`, `tasks.md:262`, `tasks.md:367` |
| Backend, código | `app/backend/src/empresas/empresas.ts:13` (comentário de `formatarCnpjRaiz`) |
| Backend, README | `app/backend/README.md:38` |
| Backend, testes | `test/admin.test.ts:63, 71, 80, 84, 85, 91, 124, 144, 178, 226, 252, 258`; `test/api/convites.test.ts:26, 197, 214`; `test/api/convitesConcorrentes.test.ts:23, 35`; `test/api/empresas.test.ts:25, 46, 77, 78`; `test/api/falhas.test.ts:129, 150`; `test/api/logs.test.ts:49`; `test/api/sessao.test.ts:19, 25`; `test/banco/isolamento.test.ts:47` |
| Web, README | `app/web/README.md:32` |
| Web, testes | `test/auxiliar.tsx:43, 44`; `test/areaLogada.test.tsx:68, 90`; `test/falhasWeb.test.tsx:133, 146, 341, 352` |
| Painel, teste | `app/painel/test/paginas2.test.ts:401` (`cnpj-00000000000000`, usado como grupo inexistente) |

**Inventário das raízes `11111111` e `22222222`:**

| Lugar | Arquivo:linha |
|---|---|
| Design | `docs/design/design-system.md:8` (`11.111.111/0001-11`) |
| Demanda 034 | `spec.md:344` (`11.111.111/0001-11` e `22.222.222/0001-22`), `spec.md:360` (DT-22), `spec.md:403`; `tasks.md:13` |
| Web, código | `app/web/src/componentes/PainelMarca.tsx:55-56` (painel da tela de login, visível para todos) |
| Web, testes | `test/auxiliar.tsx:50, 51`; `test/areaLogada.test.tsx:69, 112`; `test/painelMarca.test.tsx:129, 131` |
| Web, README | `app/web/README.md:32` |
| Backend, testes | `test/admin.test.ts:64, 71, 145, 146`; `test/api/convites.test.ts:27`; `test/api/empresas.test.ts:26, 47, 234`; `test/banco/isolamento.test.ts:48, 49` |

**Falsos positivos (não são raiz e não mudam):** UUIDs como `00000000-0000-4000-8000-000000000000` (`admin.test.ts:131`), `11111111-1111-4111-8111-111111111111` e `22222222-2222-4222-8222-222222222222` (`web/test/auxiliar.tsx:41, 48`); `"10000000000000000.00"` em `app/apuracao-cbs/test/dinheiro.test.ts:30`; números de DARF `99999000000000001` e trechos de chave de acesso nos fictícios e nos testes do painel; o preenchimento com zeros de `gerarFicticios.ts:96`. Os PDFs de `docs/referencias/split-payment/` são material de terceiros e não mudam.

**`docs/historico/` e `docs/tasks/`:** nenhuma ocorrência de `00000000`, `00.000.000`, `11111111` ou `11.111.111` (busca de 2026-11-28). Não são tocados. Mesmo que houvesse ocorrência, seriam registro do passado (`AGENTS.md`, "Antes de qualquer coisa").

**Registros que descrevem o problema:** `docs/handoff/SESSION-HANDOFF-2026-11-28-034.md:50` e `docs/demandas/034-login/flow-evaluation.md:36, 84` citam a raiz como problema, não como exemplo, e não nomeiam o dono. Ficam como estão, porque handoff e avaliação são registro.

### B-2: código sem uso

O commit `16346ca` (correção A-1 da rodada 2 da 034) reduziu `FalhaDeRede` de `"sem_conexao" | "servidor_indisponivel"` para só `"sem_conexao"`. Nisso, dois restos ficaram para trás:

- **`AlertaDeRede.tsx:6`:** a desestruturação passou a ignorar `tipo`, mas a assinatura manteve `tipo?: FalhaDeRede`. Os 9 pontos de chamada continuam passando o parâmetro: `LayoutEmpresa.tsx:77`, `AceitarConvite.tsx:88` e `:154`, `Entrar.tsx:85`, `EscolherEmpresa.tsx:58`, `EsqueciSenha.tsx:51`, `Pessoas.tsx:58`, `RedefinirSenha.tsx:61` e `ProvedorSessao.tsx:124`.
- **`Pessoas.tsx:22-24`:** `textoDeRede` compara `tipo === "sem_conexao"`. Como o tipo só tem esse valor, o ramo "O serviço está indisponível…" é inalcançável.

### B-3: testes ausentes

Não é defeito de comportamento. É falta de cobertura, apontada pelo Reviewer na rodada 3 da 034.

- **Backend:** `test/api/proxy.test.ts:62-69` só testa a conexão **dentro** do CIDR (`10.0.0.5` em `10.0.0.0/24`). Nenhum teste mostra que uma conexão de fora da faixa, com `X-Forwarded-For`, mantém o próprio endereço como origem. A lista vai para o `trustProxy` em `src/api/servidor.ts:58`.
- **Web:** `test/cliente.test.tsx:52` cobre 502, 503 e 504 no cliente, e `falhasWeb.test.tsx` cobre 503 em outras telas. Na tela de login, só há o `fetch` rejeitado (`test/entrar.test.tsx:112`), e falta o 503 sem corpo em `POST /api/sessao`.

### Item 4: CA-14 × DT-17

`docs/demandas/034-login/us.md:90` diz "lista de senhas comuns guardada no próprio código". O `spec.md:351` (DT-17) diz que a lista vem de `@zxcvbn-ts/language-common` 4.2.0, filtrada em tempo de execução. O DT-17 remenda a leitura ("É assim que se lê…"), quando o certo é a US dizer isso.

### Item 5: conferência no navegador

`app/web/README.md:32` diz "A conferência ainda **não foi feita**". O `docs/demandas/034-login/tasks.md:60` diz "conferência pelo responsável pendente (antes do PR)". O texto não foi atualizado depois de 2026-11-28.

## Correção proposta

**Raízes conferidas (P-1, 2026-11-28).** `11111111`, `22222222`, `33333333` e `44444444`. As matrizes `<raiz>0001-91` não existem no "Comprovante de Inscrição e de Situação Cadastral" da Receita.

**Mapeamento.** Mantém a ordem das empresas de teste, porque `admin.test.ts:71` ordena por `cnpj_raiz`:

| Raiz antiga | Raiz nova |
|---|---|
| `00000000` (`00.000.000`) | `11111111` (`11.111.111`) |
| `11111111` (`11.111.111`) | `22222222` (`22.222.222`) |
| `22222222` (`22.222.222`) | `33333333` (`33.333.333`) |

`44444444` fica registrada no §6 como conferida e de reserva, sem uso nesta correção.

**Troca em uma passada só.** Como as raízes se deslocam, a troca sequencial converte duas vezes: `00000000` vira `11111111` e, na regra seguinte, `22222222`. A troca é feita em uma passada só, com o mapa aplicado de uma vez, ou na ordem decrescente: primeiro `22222222`→`33333333`, depois `11111111`→`22222222`, por fim `00000000`→`11111111`. Vale o mesmo para as formas com pontuação.

**UUIDs não mudam.** UUIDs com esses dígitos (`00000000-0000-4000-8000-000000000000` em `admin.test.ts:131`; `11111111-1111-…` e `22222222-2222-…` em `web/test/auxiliar.tsx:41, 48`) não são raiz e ficam como estão. A conferência depois da troca é o diff, e não um novo `git grep` das raízes, que hoje são todas válidas.

1. **Backend.**
   - **Testes e README:** troca pelo mapeamento acima em todos os arquivos do inventário, nas formas sem e com pontuação.
   - **Comentário:** o de `src/empresas/empresas.ts:13` passa a ser "`11111111` vira `11.111.111`".
   - **Varredura:** `test/varredura.test.ts` ganha um teste. Em `src/`, `test/` e `README.md`, depois de tirar os UUIDs, não pode aparecer a raiz proibida `00000000`, nem `00.000.000`. O próprio arquivo de varredura fica de fora, como já acontece hoje. A lista proibida é só essa.
2. **Web.**
   - **Testes:** `test/auxiliar.tsx`, `areaLogada.test.tsx`, `falhasWeb.test.tsx` e `painelMarca.test.tsx`, com a mesma troca.
   - **Tela de login:** em `src/componentes/PainelMarca.tsx:55-56`, `11.111.111/0001-11` vira `22.222.222/0001-22` e `22.222.222/0001-22` vira `33.333.333/0001-33`, os dois com **DV errado de propósito** (o certo é `91`). `painelMarca.test.tsx:129, 131` acompanham.
   - **Varredura nova:** `test/varredura.test.ts`, igual à do backend (só `00000000` e `00.000.000`), sobre `src/`, `test/` e `README.md`. Ganha também um teste de que todo CNPJ completo exibido em `PainelMarca` tem DV inválido.
   - **README:** em `app/web/README.md:32`, as raízes `11111111`, `22222222` e `33333333` no lugar de `00000000`, `11111111` e `22222222`. A frase da conferência passa a dizer que o responsável a fez em 2026-11-28, com dados fictícios.
3. **Painel:** em `test/paginas2.test.ts:401`, o grupo inexistente `cnpj-00000000000000` passa a usar a raiz conferida `11111111`, com sufixo `0001` e DV errado (`cnpj-11111111000100`). O teste continua esperando 404, porque nenhum dado ou teste do painel usa essa raiz (busca de 2026-11-28). As demais raízes do painel não mudam (P-2 adiada).
4. **B-2, `app/web`.**
   - **`AlertaDeRede.tsx`:** sai `tipo?` da assinatura, e os 9 pontos de chamada deixam de passar o parâmetro. `FalhaDeRede` e `ehFalhaDeRede` ficam, porque estão em uso.
   - **`Pessoas.tsx`:** `textoDeRede` vira a constante `"Sem conexão"`, usada nas linhas 99 e 120.
5. **B-3.**
   - **Backend:** em `test/api/proxy.test.ts`, um teste com `confiarProxy: "10.0.0.0/24, 192.168.1.1"` e conexão de `10.0.1.5` (fora da faixa) e de `192.168.1.2` (fora do endereço único), com `X-Forwarded-For: 2.2.2.2`. A chave de origem tem de ser o endereço da conexão, e não `2.2.2.2`.
   - **Web:** em `test/entrar.test.tsx`, um teste com `POST /api/sessao` respondendo 503 sem corpo. Tem de aparecer o alerta "Sem conexão" com "Tentar de novo", e não o alerta de credencial.
6. **Documentos** (só os vivos).
   - **Design:** em `docs/design/design-system.md:8` e `docs/design/briefing.md:46`, pelo mesmo mapeamento. A empresa de exemplo passa a ser `11.111.111/0001-00` e o emitente de exemplo `22.222.222/0001-22`, os dois com DV errado.
   - **`docs/PROJECT_CONTEXT.md` §6, "Código":** entram as regras novas.
     - Raiz de CNPJ fictícia só da lista conferida: `11111111`, `22222222`, `33333333` e `44444444` (esta de reserva). Conferidas pelo responsável em 2026-11-28 no "Comprovante de Inscrição e de Situação Cadastral" da Receita, pela matriz `<raiz>0001` com o DV certo, sem inscrição encontrada. Raiz nova exige a mesma conferência, com data.
     - CNPJ completo de exemplo sempre com DV errado.
     - Nunca nomear o dono de uma raiz real.
     - **Pendência (P-2, adiada):** as raízes do painel (`90817263`, `55443322`, `11223344`, `44556677`, `55667788`, `66778899`) e o `12.345.678` da Spec da 030 não foram conferidas.
     - O changelog (§11) ganha a linha da 035.
   - **Demanda 034** (Spec, US e tasks descrevem o código que está na `main` e servem de modelo para as próximas):
     - os exemplos trocados pelo mapeamento, em uma passada só;
     - o R-8 da Spec sem o nome da empresa, e com remissão à 035;
     - o DT-22 e a linha 403 da Spec com as raízes `11111111`, `22222222` e `33333333`;
     - o CA-14 da US com a redação do DT-17: "fora da lista de senhas comuns local, vinda da dependência `@zxcvbn-ts/language-common` (DT-17), sem consulta a serviço externo", com a nota "redação alinhada na 035";
     - a frase final do DT-17 ajustada;
     - a task 34 (linha 60 e §34) registrando a conferência do responsável em 2026-11-28.

## Implantação

- **Apps afetadas:** `app/backend` (só testes, README e um comentário), `app/web` (testes, README, `PainelMarca`, `AlertaDeRede` e os 9 pontos de chamada, `Pessoas`) e `app/painel` (uma linha de teste).
- **Banco e configuração:** sem migration e sem variável de ambiente nova.
- **Compatibilidade:** compatível com a versão anterior. Nenhum contrato da API muda.
- **Antes e depois:** nada vai ao ar, porque as aplicações só rodam localmente. Nenhuma ação além do deploy.
- **Banco local do responsável:** se ainda tiver a empresa de raiz `00000000` criada na conferência, pode apagá-la com `npm run banco:apagar`, `npm run banco:subir` e `npm run migrar`, em `app/backend`. É opcional, porque é dado local e fora do git.
- **Como voltar:** reverter o merge.

## Critérios de aceite

- **CA-1 (R-8):** seguindo "Como reproduzir", os passos 1 a 3 não acham mais a raiz `00000000` como empresa fictícia em `app/`, `docs/design/`, `docs/PROJECT_CONTEXT.md` nem `docs/demandas/034-login/{us,spec,tasks}.md`. Sobram só os falsos positivos listados e os registros (handoff e `flow-evaluation.md` da 034, este `bug.md`). As varreduras novas do backend e da web falham se a raiz voltar.
- **CA-2 (R-8):** as raízes fictícias seguem o mapeamento de "Correção proposta": `00000000`→`11111111`, `11111111`→`22222222` e `22222222`→`33333333`, sem conversão dupla. A ordem das empresas de teste é preservada, e os UUIDs não mudam. Todo CNPJ completo de exemplo, no código, nos testes e nos documentos tocados, tem DV inválido (diferente de `91`). A web tem teste disso para `PainelMarca`.
- **CA-3 (R-8):** o `PROJECT_CONTEXT.md` §6 tem:
  - a lista conferida (`11111111`, `22222222`, `33333333` e `44444444` de reserva), com a data 2026-11-28 e o método;
  - a regra de conferir raiz nova;
  - a do DV errado no CNPJ completo;
  - a de não nomear o dono de raiz real;
  - a pendência P-2 (raízes do painel e `12.345.678` da 030, não conferidas).

  O §11 tem a linha da 035.
- **CA-4 (R-8):** nenhum arquivo do repositório nomeia a empresa dona da raiz `00000000`. A mensagem de commit também não.
- **CA-5 (não-regressão):** o comportamento coberto pelos testes que usavam as raízes antigas não muda:
  - formatação `NN.NNN.NNN`;
  - empresa duplicada recusada;
  - ordenação por `cnpj_raiz` em `admin.test.ts` e por nome em `GET /api/empresas`;
  - isolamento por linha;
  - "CNPJ raiz …" na barra.

  Passam `npm test`, `npm run lint` e `npm run build` em `app/backend` (com `npm run banco:subir`), em `app/web` e em `app/painel`. `app/apuracao-cbs` não muda e o `npm test` dela continua passando.
- **CA-6 (B-2):** `AlertaDeRede` não tem o parâmetro `tipo`, e nenhuma chamada o passa. `Pessoas.tsx` não tem ramo inalcançável. Falha de rede em convidar ou remover pessoa continua mostrando "Sem conexão" (testes de `falhasWeb.test.tsx` já existentes). O `npm run build` da web passa, e o `tsc` acusaria uma chamada esquecida.
- **CA-7 (B-3, backend):** com `CREDITOGOV_CONFIAR_PROXY` = `10.0.0.0/24, 192.168.1.1`, um login vindo de `10.0.1.5` ou de `192.168.1.2` com `X-Forwarded-For: 2.2.2.2` grava a chave de origem do endereço da conexão, e não a de `2.2.2.2`. O teste de dentro da faixa (`proxy.test.ts:62`) continua passando.
- **CA-8 (B-3, web):** na tela Entrar, `POST /api/sessao` com 503 sem corpo mostra o alerta "Sem conexão" com "Tentar de novo" e não mostra o alerta de credencial inválida.
- **CA-9 (item 4):** o CA-14 da US da 034 e o DT-17 descrevem a lista de senhas comuns do mesmo jeito: local, vinda da dependência `@zxcvbn-ts/language-common` 4.2.0 e sem consulta externa. A US registra que a redação foi alinhada na 035.
- **CA-10 (item 5):** `app/web/README.md` ("Conferência no navegador") e a task 34 da 034 (tabela e §34) dizem que o responsável fez a conferência em 2026-11-28, com dados fictícios. O roteiro continua no README.

## Tasks

**Teste primeiro.** As tasks 1 e 2 reproduzem o R-8 e falham hoje, pela causa raiz. As tasks 3 e 4 cobrem lacunas, sem defeito de comportamento, e passam na primeira execução. Para mostrar que o teste pega o defeito, o Developer faz uma mutação local, sem commit: na task 3, passar `trustProxy: true` em `servidor.ts:58`; na task 4, tirar 503 da regra de `cliente.ts:83`. Ele registra no commit que o teste falhou com a mutação. As tasks 5, 6 e 9 trocam as raízes pelo mapeamento de "Correção proposta", **em uma passada só**, sem mexer em UUIDs; cada uma confere o diff antes do commit. Um commit por task, sem nome de empresa real na mensagem.

| # | Task | Spec | Verificação | Status |
|---|---|---|---|---|
| 1 | Backend: teste de varredura da raiz proibida `00000000` (e `00.000.000`) em `src/`, `test/` e `README.md`, sem contar UUIDs (CA-1) | §Correção proposta, item 1 | falha hoje, apontando os arquivos do inventário (`npm test` em `app/backend`, com `npm run banco:subir`) | ☐ |
| 2 | Web: `test/varredura.test.ts` com a mesma regra, mais o teste de DV inválido dos CNPJs de `PainelMarca` (CA-1, CA-2) | §Correção proposta, item 2 | a varredura falha hoje (`npm test` em `app/web`) | ☐ |
| 3 | Backend: teste de conexão de fora do CIDR e de fora do endereço único (CA-7) | §Correção proposta, item 5 | passa; falha com a mutação `trustProxy: true` | ☐ |
| 4 | Web: teste de login com 503 sem corpo mostrando "Sem conexão" (CA-8) | §Correção proposta, item 5 | passa; falha com a mutação em `cliente.ts:83` | ☐ |
| 5 | Backend: trocar as raízes nos testes, no README e no comentário de `empresas.ts`, em uma passada só (`22222222`→`33333333`, `11111111`→`22222222`, `00000000`→`11111111`, com e sem pontuação), sem tocar em UUIDs (CA-1, CA-2, CA-5) | §Correção proposta, item 1 | task 1 passa; o diff mostra cada raiz trocada uma vez só; `npm test`, `npm run lint` e `npm run build` em `app/backend` | ☐ |
| 6 | Web: a mesma troca nos testes, em `PainelMarca` (`22.222.222/0001-22` e `33.333.333/0001-33`, DV errado) e no `README.md:32`, que também passa a registrar a conferência de 2026-11-28 (CA-1, CA-2, CA-5, CA-10) | §Correção proposta, item 2 | task 2 passa; o diff mostra cada raiz trocada uma vez só; `npm test`, `npm run lint` e `npm run build` em `app/web` | ☐ |
| 7 | Painel: em `paginas2.test.ts:401`, `cnpj-00000000000000` vira `cnpj-11111111000100`; as demais raízes do painel não mudam (P-2 adiada) (CA-1, CA-5) | §Correção proposta, item 3 | o teste continua esperando 404; `npm test`, `npm run lint` e `npm run build` em `app/painel` | ☐ |
| 8 | Web: tirar `tipo?` de `AlertaDeRede` e dos 9 pontos de chamada; trocar `textoDeRede` em `Pessoas.tsx` pela constante (CA-6) | §Correção proposta, item 4 | `npm test`, `npm run lint` e `npm run build` em `app/web` | ☐ |
| 9 | Documentos: `docs/design/` (2 arquivos) e a 034 (exemplos, R-8 sem o nome da empresa, DT-22, CA-14 e DT-17, task 34), pelo mapeamento em uma passada só; `PROJECT_CONTEXT.md` §6 (lista conferida com data e método, `44444444` de reserva, regras e pendência P-2) e §11 (CA-1 a CA-4, CA-9, CA-10) | §Correção proposta, item 6 | o `git grep` de "Como reproduzir" só acha falsos positivos e registros; o diff mostra cada raiz trocada uma vez só; uma busca pelo nome da empresa (feita pelo Developer, sem escrever o nome em arquivo nem em commit) não acha nada | ☐ |
| 10 | Verificação final (CA-5) | §Critérios de aceite | `npm test`, `npm run lint` e `npm run build` em `app/backend`, `app/web` e `app/painel`; `npm test` em `app/apuracao-cbs` | ☐ |

## Riscos e impacto na 033

- **A 033 (dashboard) usa a raiz `00000000`.** As tasks dela usam a raiz `00000000` (`docs/demandas/033-dashboard-indicadores/tasks.md:31`, na branch `feat/033-dashboard-indicadores`). Quando a 035 entrar na `main`, a 033 precisa adotar o mesmo mapeamento: `00000000`→`11111111`, `11111111`→`22222222` e `22222222`→`33333333`, com `44444444` de reserva. A varredura da task 1 recusa `00000000` em `app/backend/src`, `test` e `README.md`, então um merge da `main` na 033 quebra os testes dela até a troca. Atenção também ao deslocamento: um teste da 033 que já use `11111111` como "segunda empresa" pode colidir com a nova primeira empresa. **Recomendação:** a sessão principal avisa a 033 agora, para que ela já nasça com as raízes novas.
- **Conflito de texto nos READMEs.** A task 29 da 033 edita `app/backend/README.md` e a "Conferência no navegador" de `app/web/README.md`. A 035 mexe só em `app/backend/README.md:38` (uma linha) e em `app/web/README.md:32` (um parágrafo). O conflito esperado é pequeno e localizado.
- **Outras pastas da 033.** A 033 cria `app/backend/src/leitura/`, `app/backend/schemas/oficiais/` e `app/web/test/formatacao/`, e a 035 não toca nelas. A varredura nova vai cobrir esses arquivos quando a 033 entrar. Os schemas oficiais copiados do painel não trazem raiz de exemplo, mas o Developer da 033 deve rodar a varredura depois do merge.
- **Validade da conferência.** A conferência do P-1 vale na data em que foi feita (2026-11-28). Pela página da Receita (F-E), as inscrições novas recebem CNPJ alfanumérico desde julho de 2026. Se isso quiser dizer que não se atribui mais raiz só numérica, a conferência vale de forma permanente. Isso não está confirmado: a IN RFB nº 2.229/2024 não foi lida. A consulta pela matriz (`/0001`) também não prova que a raiz não tem outro estabelecimento. A regra do §6 pede a data, e quem usar a raiz depois pode repetir a consulta.
- **Landing.** A landing (`app/landing-page`) não foi varrida por esta correção, porque não está nos achados. Ela não mostra CNPJ, mas isso não foi conferido linha a linha.

## Fora de escopo

- **B-1 da 034** (expectativas de teste alteradas no commit da correção, e não no de testes): é histórico de commits e não se corrige.
- **R-7 da 034** (lista exata de proxies ao ir ao ar): depende da hospedagem (PD-1).
- `docs/historico/`, `docs/tasks/`, `docs/handoff/`, `docs/demandas/034-login/flow-evaluation.md` e os PDFs de `docs/referencias/`, pelos motivos da "Causa raiz".
- Aceitar raiz alfanumérica no `app/backend` ou no painel: seria mudança de contrato (`^\d{8}$`), e não correção.
- `app/landing-page`.

## Decisões

- **P-1 — decidida em 2026-11-28 pelo responsável: alternativa A** ("Opção A, eu confiro").
  - **Conferência feita em 2026-11-28:** o responsável consultou na página pública "Comprovante de Inscrição e de Situação Cadastral" da Receita os CNPJs de matriz `11.111.111/0001-91`, `22.222.222/0001-91`, `33.333.333/0001-91` e `44.444.444/0001-91` (raiz + `0001` + DV certo). Resposta dele: "nenhum existe".
  - **Mapeamento:** `00000000`→`11111111`, `11111111`→`22222222` e `22222222`→`33333333`, preservando a ordem. A troca é feita em uma passada só.
  - **Reserva:** `44444444` fica registrada no §6 como conferida e de reserva.
  - **Varredura:** a lista proibida é só `00000000`, com e sem pontuação.
  - **Alternativas descartadas:**
    - **(B) raiz com letras:** raízes alfanuméricas são atribuídas desde 31/07/2026, e mudar `^\d{8}$` é mudança de contrato;
    - **(C) valor fora do formato:** a validação recusaria, e seria preciso exceção só para os testes;
    - **(D) manter `00000000`:** contraria a regra de não usar dado real.
- **P-2 — adiada em 2026-11-28 pelo responsável.** As raízes do painel (`90817263`, `55443322`, `11223344`, `44556677`, `55667788`, `66778899`) e o `12.345.678` da Spec da 030 não foram conferidas. Elas ficam registradas como pendência no `PROJECT_CONTEXT.md` §6, e a task 7 só corrige `paginas2.test.ts:401`.

## Perguntas em aberto

- Nenhuma.
