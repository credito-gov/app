# app/web

Interface do CreditoGov (demanda 034: login e escolha de empresa). React, Vite e TypeScript.

## Comandos

```bash
cd app/web
npm install
npm run dev     # Vite em http://localhost:5173, com proxy de /api para http://127.0.0.1:3000
npm test        # vitest com jsdom; sem rede (o fetch é simulado)
npm run lint
npm run build
```

Para usar a interface de verdade, suba também a API (veja o [README do backend](../backend/README.md)). O proxy do Vite repassa `/api` para a porta 3000 da API e acrescenta `X-Forwarded-For` (`xfwd`); no backend use `CREDITOGOV_CONFIAR_PROXY=1` no desenvolvimento, para o limite por origem enxergar cada pessoa.

## Estados de falha da API

O cliente (`src/api/cliente.ts`) devolve estados tipados; as telas tratam cada um:

| Estado | Quando | O que a pessoa vê |
|---|---|---|
| `sem_conexao` | O `fetch` falhou (sem rede, API parada) | "Sem conexão", com "Tentar de novo" |
| `servidor_indisponivel` | 502, 503 ou 504 sem o corpo de erro da API (proxy ou servidor fora do ar) | "O serviço está indisponível no momento. Tente em alguns minutos." |
| `erro` com código `resposta_invalida` | Resposta de sucesso que não é JSON (exceto 204) | Erro genérico da tela |
| `erro` com código da API | Por exemplo `email_nao_enviado` (502, convite criado e e-mail não enviado) e `convite_aceito_sem_sessao` (500, aceite gravado e sessão não aberta; leva a `/entrar` com o aviso) | A mensagem de cada tela |

Só `401` na leitura inicial da sessão vira "sem sessão"; os demais erros mostram "Tentar de novo". Sair só leva a `/entrar` se o servidor encerrou a sessão.

## Conferência no navegador

Roteiro para o **responsável** executar antes do PR (P-9). Só dados fictícios: e-mails de `exemplo.com.br` e raízes de CNPJ `00000000` e `11111111`. A conferência ainda **não foi feita**; o resultado fica registrado no PR.

1. Subir o banco e migrar, em `app/backend`: `npm run banco:subir` e `npm run migrar`.
2. Com `npm run admin`, criar duas empresas fictícias e convidar um titular e um contador (exemplos em `app/backend/README.md`).
3. Subir a API (`npm run dev` em `app/backend`) e a web (`npm run dev` em `app/web`). Abrir o convite pelo arquivo em `app/backend/.local/emails/`.
4. Conferir:
   - login com sucesso;
   - login com erro (a mensagem não revela se o e-mail existe);
   - sem conexão (parar a API e tentar entrar);
   - muitas tentativas seguidas (aviso de bloqueio temporário);
   - recuperação de senha ("Esqueci a senha" e o link do e-mail em `.local/emails/`);
   - aceitar convite sem conta (criar a senha) e com conta (entrar e aceitar);
   - escolha de empresa e troca de empresa;
   - lista de pessoas, remoção de vínculo e sair.
5. Repetir em largura de celular (por volta de 375 px) e de desktop, e com `prefers-reduced-motion` ligado.
