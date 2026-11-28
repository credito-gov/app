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
npm run admin -- criar-empresa --cnpj-raiz 00000000 --nome "Comércio Exemplo Ltda."
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
| `CREDITOGOV_CONFIAR_PROXY` | `true` ou `false` (opcional; padrão `false`). Só `true` atrás de proxy confiável. |

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
