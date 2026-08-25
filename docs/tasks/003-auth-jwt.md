# Task 003 — Autenticação JWT + endpoints /auth/*

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** task 002 merged
> **Estimativa:** 4-6h
> **Branch:** `feat/003-auth-jwt`

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` — §6.4 (Segurança).
2. Confirme que a task 002 está **merged** em `main`.
3. ```bash
   git checkout main && git pull --ff-only origin main
   git checkout -b feat/003-auth-jwt
   ```

---

## Contexto

A autenticação é o pré-requisito de todos os endpoints futuros. A PME acessa o CreditoGov com email e senha cadastrados diretamente na plataforma — o sistema gera um JWT internamente para manter a sessão.

> ⚠️ **Decisão registrada**: o modelo de login com credenciais de ERP externo (ex. Omie) foi descartado. A autenticação é própria da plataforma — email + senha.

---

## Objetivo

Implementar a camada de autenticação completa: registro de PME, JWT com refresh token, e os 4 endpoints `/auth/*` funcionais.

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/backend/src/services/authService.ts` | Lógica de registro, login, refresh, logout, geração de tokens |
| `app/backend/src/utils/encryption.ts` | AES-256-CBC para encriptar/decriptar dados sensíveis |
| `app/backend/src/utils/jwt.ts` | Helper para assinar e verificar JWT |
| `app/backend/src/utils/hash.ts` | bcrypt para hash de senha |
| `app/backend/src/api/middleware/auth.ts` | Middleware de autenticação JWT para rotas protegidas |
| `app/backend/src/api/routes/auth.routes.ts` | Definição das 4 rotas |
| `app/backend/src/api/controllers/authController.ts` | Controllers dos endpoints |
| `docs/tasks/walkthrough/003-auth-jwt.md` | **Obrigatório.** |

---

## Fora de escopo (NÃO faça)

- ❌ Não implementar lógica de créditos — apenas auth
- ❌ Não criar telas — apenas a API
- ❌ Não usar `jwt.sign` sem `expiresIn` — token sem expiração é falha de segurança
- ❌ Não logar senha, token ou qualquer credencial nos logs
- ❌ Não integrar com nenhum ERP ou serviço externo nesta task

---

## Detalhes técnicos

### Endpoints

```
POST /auth/register        — recebe { cnpj, razao_social, email, senha }
                             → valida, cria PME, retorna JWT + refresh
POST /auth/login           — recebe { email, senha }
                             → valida credenciais, retorna JWT + refresh
POST /auth/refresh         — recebe refresh_token → retorna novo JWT
POST /auth/logout          — invalida refresh_token
GET  /auth/me              — retorna dados da PME autenticada (requer JWT válido)
```

### Fluxo de registro/login

```
Registro:
1. PME envia { cnpj, razao_social, email, senha }
2. authService valida: CNPJ formato, email único, senha mínimo 8 chars
3. Hash da senha com bcrypt (rounds: 12)
4. Cria registro em pmes
5. Gera JWT (payload: { sub: pme.id, cnpj: pme.cnpj })
6. Gera refresh token (JWT de longa duração — 30 dias)
7. Retorna { access_token, refresh_token, expires_in }

Login:
1. PME envia { email, senha }
2. Busca PME por email
3. bcrypt.compare(senha, pme.senha_hash)
4. Se válido: gera JWT + refresh token
5. Retorna { access_token, refresh_token, expires_in }
```

### Modelo — campo senha na tabela pmes

Adicionar via migration de ajuste (migration separada, não alterar a de 002):
```sql
ALTER TABLE pmes ADD COLUMN senha_hash VARCHAR(255);
ALTER TABLE pmes ADD COLUMN email VARCHAR(255) UNIQUE;
```
> Verificar se a migration 002 já criou esses campos — se sim, não recriar.

### Encriptação (obrigatório para campos sensíveis futuros)

```typescript
// app/backend/src/utils/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes em hex

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, encryptedHex] = encryptedText.split(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]).toString();
}
```

### Rate limiting

Aplicar `express-rate-limit` nos endpoints `/auth/login` e `/auth/register`:
- Limite: 10 requisições por 15 minutos por IP

### JWT payload

```typescript
interface JwtPayload {
  sub: string;    // pme.id (UUID)
  cnpj: string;  // pme.cnpj
  iat: number;
  exp: number;
}
```

---

## Passos sugeridos

1. Instalar: `jsonwebtoken`, `@types/jsonwebtoken`, `bcryptjs`, `@types/bcryptjs`, `express-rate-limit`
2. Criar `utils/encryption.ts` e testar encrypt/decrypt no console
3. Criar `utils/hash.ts` — métodos `hashPassword(plain)` e `comparePassword(plain, hash)`
4. Criar `utils/jwt.ts` — `signToken`, `signRefreshToken`, `verifyToken`
5. Criar `services/authService.ts` — register, login, refresh, logout
6. Criar middleware `auth.ts` — extrai e verifica JWT do header `Authorization: Bearer <token>`
7. Criar rotas e controllers
8. Testar com curl:
   ```bash
   # Registrar
   curl -X POST http://localhost:3000/auth/register \
     -H "Content-Type: application/json" \
     -d '{"cnpj":"12345678000190","razao_social":"Empresa Teste","email":"teste@empresa.com","senha":"senha123"}'

   # Login
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"teste@empresa.com","senha":"senha123"}'
   ```
9. Testar `GET /auth/me` sem token (401) e com token válido (dados da PME)
10. Walkthrough + kanban + PR

---

## Critérios de validação

- [ ] `POST /auth/register` cria PME e retorna `{ access_token, refresh_token, expires_in }`
- [ ] `POST /auth/register` com email duplicado retorna 409
- [ ] `POST /auth/login` com credenciais válidas retorna tokens
- [ ] `POST /auth/login` com senha errada retorna 401
- [ ] `GET /auth/me` sem token retorna 401
- [ ] `GET /auth/me` com token válido retorna dados da PME (sem `senha_hash` exposta)
- [ ] `POST /auth/refresh` com refresh válido retorna novo access_token
- [ ] `senha_hash` no banco é um hash bcrypt (não a senha em plaintext)
- [ ] Nenhuma credencial aparece nos logs do Winston
- [ ] Rate limit bloqueia após 10 tentativas de login em 15min
- [ ] Walkthrough com evidência real dos curls + respostas JSON
- [ ] Kanban atualizado, PR criado

---

## Referências

- [`docs/PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) — §6.4 (Segurança), §9 (Não faça)
- [`docs/tasks/walkthrough/_template.md`](walkthrough/_template.md)
