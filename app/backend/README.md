# app/backend

API do CreditoGov (demanda 034: login, convites, empresas e pessoas). Node, Fastify, Kysely e PostgreSQL.

## Requisitos

- Node 24.
- Docker (para o PostgreSQL local do `compose.yaml`).

## Comandos

```bash
cd app/backend
npm install
npm run banco:subir    # sobe o PostgreSQL 18.7 em 127.0.0.1:5433 e cria os papéis (uma vez)
npm run migrar         # aplica as migrações (papel de migração)
npm run dev            # compila e sobe a API (porta 3000 por padrão)
npm run admin -- <comando> [opções]
npm test               # vitest; precisa do banco no ar; sem .env e sem rede externa
npm run lint
npm run build
```

Também existem `npm run banco:parar` e `npm run banco:apagar` (apaga o volume).

### `npm run admin`

Os quatro comandos (não há tela de administração):

- `criar-empresa --cnpj-raiz <8 dígitos> --nome <nome>`
- `convidar --empresa <id> --email <e-mail> --papel <titular|contador>`
- `empresas-do-usuario --email <e-mail>`
- `remover-vinculo --empresa <id> --email <e-mail>`

Exemplo, só com dados fictícios:

```bash
npm run admin -- criar-empresa --cnpj-raiz 11111111 --nome "Comércio Exemplo Ltda."
npm run admin -- convidar --empresa <id> --email titular@exemplo.com.br --papel titular
```

## Variáveis de ambiente

O `.env.example` traz só os nomes. Copie para `.env` (ignorado pelo git) e preencha na sua máquina. Os testes não leem `.env`.

| Variável | Para que serve |
|---|---|
| `CREDITOGOV_AMBIENTE` | `local` ou `homologacao`. `producao` é recusado até existir adaptador real de e-mail. |
| `CREDITOGOV_BANCO_URL` | Conexão do papel de trabalho (`creditogov_app`), usada pela API e pelo `admin`. |
| `CREDITOGOV_BANCO_MIGRACAO_URL` | Conexão do papel de migração (`creditogov_migracao`), usada só por `npm run migrar`. |
| `CREDITOGOV_SESSAO_SEGREDO` | Segredo da sessão, com pelo menos 32 bytes. Também é a chave de HMAC dos tokens. |
| `CREDITOGOV_WEB_URL` | URL da web, para os links dos e-mails e para a verificação de origem. |
| `CREDITOGOV_EMAIL` | Adaptador de e-mail: `arquivo` ou `memoria`. |
| `CREDITOGOV_API_PORTA` | Porta da API (opcional; padrão 3000). |
| `CREDITOGOV_CONFIAR_PROXY` | Lista, separada por vírgula, de endereços IP, CIDRs ou das palavras `loopback`, `linklocal`, `uniquelocal` (opcional; vazia = não confia em proxy nenhum, o padrão). Só conexões vindas desses endereços podem informar `X-Forwarded-For`; o limite por origem usa o endereço que o proxy confiável acrescentou. Não há contagem de saltos: ela deixaria um cliente que fala direto com a API forjar a origem. **No desenvolvimento use `loopback`**: o proxy do Vite (`xfwd`) acrescenta o endereço de quem usa o navegador; sem isso tudo chega de 127.0.0.1 e 5 erros de qualquer pessoa bloqueiam todos. Atrás de proxy reverso, informe o endereço ou a faixa dele. |

## Subida e falhas

- **Papel do banco:** a API e o `admin` conferem, ao subir, que o papel de `CREDITOGOV_BANCO_URL` não é superusuário, não tem `BYPASSRLS` e não é dono de tabela. Se for, não iniciam (a mensagem não mostra a URL).
- **Terminal do operador:** `npm run admin`, `npm run migrar` e a subida da API imprimem `tipo`, `codigo` e `mensagem` do erro inesperado; o `migrar` também diz qual migração falhou. Isso vai só para o terminal, nunca para o log da API.
- **Log do erro 500:** registra `tipo`, `codigo`, `restricao`, `rota` e `stack` (sem a mensagem); nunca `detail`, corpo ou parâmetros.

## Códigos de erro novos da API

| Código | Status | Quando |
|---|---|---|
| `email_nao_enviado` | 502 | O convite foi criado, mas o e-mail não saiu (`"O convite foi criado, mas o e-mail não saiu. Tente reenviar."`). O evento `email_falhou` entra no log, com `conviteId`, `empresaId` e `usuarioId`. |
| `convite_aceito_sem_sessao` | 500 | O aceite do convite foi gravado, mas a sessão não abriu (`"Convite aceito. Entre com seu e-mail e senha."`). A web leva a `/entrar` com esse aviso. |

Na recuperação de senha, se o e-mail não sair, a resposta continua a mesma `202` (não revela se a conta existe); o evento `email_falhou` entra no log, com `usuarioId`. Erros 4xx do framework (413, 415...) mantêm o status; JSON malformado continua `400 entrada_invalida`.

## E-mails locais

Com `CREDITOGOV_EMAIL=arquivo`, cada e-mail (convite, recuperação de senha) vira um arquivo em `app/backend/.local/emails/`, ignorado pelo git. É de lá que se pega o link para a conferência no navegador.

## Banco local e autenticação `trust`

O Compose usa autenticação `trust`: o banco aceita conexões sem senha. Isso é aceitável **só** porque a porta está presa a `127.0.0.1`. Nunca use essa configuração fora da máquina local; fora dela, os papéis têm senha.

## Lista de senhas comuns

A senha é recusada se estiver numa lista de senhas comuns (`src/autenticacao/senhasComuns.ts`):

- **Origem:** dicionário `passwords-common` do pacote `@zxcvbn-ts/language-common`, versão 4.2.0, licença MIT.
- **Tratamento:** normalização NFC e minúsculas.
- **Filtro:** só as senhas com 12 caracteres ou mais (as menores já são recusadas pelo tamanho mínimo). Ficam 308 senhas.
- **Decisão:** fonte escolhida pelo responsável em 2026-11-27.
