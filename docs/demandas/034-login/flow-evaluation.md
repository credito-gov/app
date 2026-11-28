# 034-login — Avaliação do fluxo

- **Demanda:** 034-login
- **PR:** [credito-gov/app#37](https://github.com/credito-gov/app/pull/37), mergeado em 2026-11-28 (`87d7c36`)
- **Preenchido por / data:** sessão principal da demanda, 2026-11-28

## Rodadas de correção
A sessão principal contou as rodadas. A primeira revisão completa, com o Reviewer e os três agentes do plugin, abriu a rodada 1 de correção.

| Rodada | Veredito | Motivo da correção |
|---|---|---|
| Revisão inicial | Aprovado (Reviewer) | O plugin achou 41 itens, que a sessão avaliou como defeitos reais. Eram de três tipos: confiança no proxy, falhas silenciosas e lacunas de teste. As falhas silenciosas foram estas: "link enviado" aparecia quando o envio falhava, o "sair" fingia sucesso, o `verificar` engolia erros, e a falha do e-mail de recuperação revelava se a conta existia |
| 1 | Reprovado (Reviewer) | A-1 (CA-18): as respostas 502, 503 e 504 viraram "Serviço indisponível", e o CA-18 pede "Sem conexão". M-1: a confiança no proxy por contagem de saltos podia ser forjada |
| 2 | Aprovado (Reviewer) | Ficaram só os achados baixos B-1, B-2 e B-3, registrados no PR |

**Total de rodadas de correção:** 2, de um limite de 3.
**Escalou ao usuário?** Não.

## Defeitos encontrados

| Defeito | Origem | Severidade | Arquivo | Corrigido? |
|---|---|---|---|---|
| Confiança em `X-Forwarded-For` sem proxy declarado | Plugin | Importante | `app/backend/src/config.ts`, `servidor.ts` | Sim |
| Falhas silenciosas na web e na API (envio, sair, verificar, recuperação) | Plugin | Importante | `app/web/src/...`, `rotasRecuperacao.ts` | Sim |
| Lacunas de teste nos caminhos de erro | Plugin | Média | testes do backend e da web | Sim |
| 502, 503 e 504 mostrados como "Serviço indisponível" (A-1, CA-18) | Reviewer | Importante | `app/web/src/api/cliente.ts` | Sim |
| Contagem de saltos do proxy forjável (M-1) | Reviewer | Importante | `app/backend/src/config.ts` | Sim; DT-18 e DT-19 atualizados |
| Expectativas de teste mudadas no commit da correção (B-1) | Reviewer | Baixa | testes da web | Não; registrado no PR |
| Código sem uso em `AlertaDeRede.tsx` e `Pessoas.tsx` (B-2) | Reviewer | Baixa | `app/web` | Não; registrado no PR |
| Faltam dois testes negativos: fora do CIDR e login com 503 (B-3) | Reviewer | Baixa | testes | Não; registrado no PR |

## Defeitos que passaram

| Defeito | Onde apareceu | Quem deveria ter pego | Por que passou |
|---|---|---|---|
| A raiz `00000000`, adotada como fictícia, é a raiz real de um CNPJ (R-8) | Implementação (registrado na Spec) | Design (032) e US | A raiz foi escolhida no design sem conferir; só apareceu na implementação |
| `app/web/README.md` e a task 34 ainda dizem que a conferência no navegador está pendente | Depois do merge | Sessão principal, na entrega | A conferência ficou registrada no PR e no handoff, mas os dois textos não foram atualizados |

Observação: na revisão inicial, o Reviewer aprovou, e os defeitos importantes vieram do plugin. Na rodada 1, o Reviewer achou o A-1, uma regressão contra um CA, que a correção do plugin tinha introduzido.

## Tokens por agente
A sessão não registrou os relatórios de uso.

| Agente | Modelo | Execuções | Tokens |
|---|---|---|---|
| `architect` | `opus` | US, Spec, Tasks e notas de implementação (DT-13 a DT-22, ajuste de DT-18 e DT-19) | não registrado |
| `developer` | `sonnet` | Backend (parou na task 2 e foi retomado depois que o Docker subiu), web, tasks 34 a 38 e 2 rodadas de correção | não registrado |
| `reviewer` | `opus` | 3 | não registrado |
| `pr-review-toolkit:code-reviewer` | — | 3 | não registrado |
| `pr-review-toolkit:pr-test-analyzer` | — | 1 | não registrado |
| `pr-review-toolkit:silent-failure-hunter` | — | 1 | não registrado |
| Sessão principal | — | — | não medido |

## Intervenções manuais

| Intervenção | Motivo |
|---|---|
| O responsável subiu o Docker Desktop | O Developer do backend parou na task 2 sem o daemon |
| O responsável escolheu a lista de senhas comuns (zxcvbn-ts) | Não havia lista com licença definida |
| A sessão subiu o banco, a API e a web, com as variáveis só no processo, para a conferência no navegador | Os agentes não criam `.env`. O segredo foi sorteado na hora e não foi gravado |
| A sessão corrigiu no banco local os nomes das empresas fictícias | O `npm run admin`, chamado pelo shell do Windows, gravou `^` nos nomes. Era dado de conferência, não código |

## Bloqueios da guarda

| Agente | Comando ou caminho | Correto? | Observação |
|---|---|---|---|
| `developer` | Alguns comandos compostos de shell | Sim (provável falso positivo) | Reescritos em comandos simples; nada foi contornado |

## Falhas de subagente

| Agente | O que aconteceu | Resolvido com contexto limpo? |
|---|---|---|
| `developer` (backend) | Parou na task 2: o daemon do Docker estava fora | Retomado depois que o Docker subiu, a partir do que já estava commitado |

## Decisão
- **Manter:**
  - aprovação da US com as recomendações P-N listadas;
  - plugin completo na primeira revisão de uma demanda com código novo, onde ele achou os defeitos de segurança e de falha silenciosa;
  - notas de implementação na Spec (DTs), escritas pelo Arquiteto.
- **Ajustar:**
  - Conferir o Docker antes de acionar o Developer em app com banco.
  - Na entrega, atualizar os textos que dizem que a conferência no navegador está pendente.
  - Pedir ao Developer que mude expectativa de teste só no commit de testes, mesmo quando volta ao CA.
  - Dados fictícios: conferir que a raiz de CNPJ não existe (R-8).
- **Modelos:** manter Arquiteto `opus`, Developer `sonnet` e Reviewer `opus`.
- **Plugin:** o `silent-failure-hunter` compensou nesta demanda, porque achou falhas que o Reviewer não viu.
