# Task 002 — TypeORM setup + Migrations + Seeders

> **Status:** ⏳ pendente de execução
> **Pré-requisitos:** task 001 merged
> **Estimativa:** 4-5h
> **Branch:** `feat/002-database-migrations`

---

## ⚠️ Antes de começar

1. **Leia obrigatoriamente** `docs/PROJECT_CONTEXT.md` — especialmente §8 (Banco de dados) e §9 (Não faça).
2. Confirme que a task 001 está **merged** em `main`.
3. **Crie a branch antes de codificar:**
   ```bash
   git checkout main && git pull --ff-only origin main
   git checkout -b feat/002-database-migrations
   ```

---

## Contexto

Com a infraestrutura base pronta (task 001), o próximo passo é definir o schema do banco de dados — as 4 tabelas centrais do CreditoGov. Essas tabelas são o coração do sistema e todas as features futuras dependem delas estarem corretas desde o início.

---

## Objetivo

Configurar TypeORM, criar as migrations das 4 tabelas principais (`pmes`, `creditos`, `acoes`, `sync_logs`) e seeders com dados de teste realistas para desenvolvimento.

---

## Entregáveis

| Arquivo | Conteúdo resumido |
|---|---|
| `app/app/backend/src/db/connection.ts` | DataSource TypeORM configurado via env vars |
| `app/app/backend/src/db/migrations/001_create_pmes.ts` | Migration tabela pmes |
| `app/app/backend/src/db/migrations/002_create_creditos.ts` | Migration tabela creditos |
| `app/app/backend/src/db/migrations/003_create_acoes.ts` | Migration tabela acoes |
| `app/app/backend/src/db/migrations/004_create_sync_logs.ts` | Migration tabela sync_logs |
| `app/app/backend/src/db/seeds/dev-seed.ts` | Seeder com 2 PMEs, 10 créditos, 2 ações |
| `app/app/backend/src/models/Pme.ts` | Entidade TypeORM — pmes |
| `app/app/backend/src/models/Credito.ts` | Entidade TypeORM — creditos |
| `app/app/backend/src/models/Acao.ts` | Entidade TypeORM — acoes |
| `app/app/backend/src/models/SyncLog.ts` | Entidade TypeORM — sync_logs |
| `docs/tasks/walkthrough/002-database-migrations.md` | **Obrigatório.** Walkthrough da entrega. |

---

## Fora de escopo (NÃO faça)

- ❌ Não criar endpoints ou services — isso é task 003+
- ❌ Não criar DDL direto no banco — apenas via migrations TypeORM
- ❌ Não commitar dados reais de PMEs nos seeders — apenas dados fictícios

---

## Detalhes técnicos

### Schema das tabelas (fonte: `docs/00-project/docs/05_ARQUITETURA_TECNICA.md`)

**pmes**
```typescript
@Entity('pmes')
export class Pme {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true, length: 14 }) cnpj: string;
  @Column({ length: 255 }) razao_social: string;
  @Column({ length: 255 }) email: string;
  @Column({ type: 'text', nullable: true }) omie_access_token: string;       // encrypted
  @Column({ length: 255, nullable: true }) receita_client_id: string;        // encrypted
  @Column({ length: 255, nullable: true }) receita_client_secret: string;    // encrypted
  @Column({ default: true }) ativo: boolean;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
```

**creditos** — `tipo_credito`: `'CBS' | 'IBS' | 'OUTRO'`; `status`: `'pendente' | 'validado' | 'compensado' | 'adiantado'`; `categoria`: `'compensavel' | 'refund' | 'inapropriavel'`

**acoes** — `tipo_acao`: `'compensar' | 'adiantar'`; `status`: `'solicitada' | 'processando' | 'concluida' | 'erro'`

**Valores monetários**: sempre `DECIMAL(18, 2)` — **nunca FLOAT**.

**Índices obrigatórios**:
- `creditos`: `(pme_id, status)` e `(data_validacao)`
- `acoes`: `(pme_id, status)`

### Scripts a adicionar no package.json

```json
"migration:run": "typeorm migration:run -d src/db/connection.ts",
"migration:revert": "typeorm migration:revert -d src/db/connection.ts",
"seed:dev": "ts-node src/db/seeds/dev-seed.ts"
```

---

## Passos sugeridos

1. Instalar TypeORM, `pg`, `reflect-metadata`
2. Criar `src/db/connection.ts` com DataSource
3. Criar os 4 models (entidades TypeORM)
4. Criar as 4 migrations na ordem: pmes → creditos → acoes → sync_logs
5. Rodar `npm run migration:run` — confirmar no psql que as tabelas existem
6. Criar seeder com dados fictícios: 2 PMEs (CNPJ fictício), 5 créditos validados, 3 pendentes, 1 ação compensar, 1 ação adiantar
7. Rodar `npm run seed:dev` — confirmar dados no banco
8. Criar walkthrough com `\d creditos` e `SELECT COUNT(*) FROM creditos` como evidência
9. Atualizar kanban e abrir PR

---

## Critérios de validação

- [ ] `npm run migration:run` executa sem erro
- [ ] `\dt` no psql lista as 4 tabelas: `pmes`, `creditos`, `acoes`, `sync_logs`
- [ ] `\d creditos` mostra colunas com tipos corretos (especialmente `valor DECIMAL(18,2)`)
- [ ] `npm run seed:dev` insere dados sem erro
- [ ] `SELECT COUNT(*) FROM creditos;` retorna 8+ registros
- [ ] `npm run migration:revert` + `npm run migration:run` funciona sem conflito (idempotente)
- [ ] **DECIMAL(18,2)** confirmado em todas as colunas monetárias — nenhum FLOAT
- [ ] Walkthrough com evidência real do `\d creditos` e `SELECT COUNT(*)`
- [ ] Kanban atualizado, PR criado

---

## Referências

- [`docs/PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) — §6.5 (Integridade financeira), §8 (Banco de dados), §9 (Não faça)
- [`docs/00-project/docs/05_ARQUITETURA_TECNICA.md`](../00-project/docs/05_ARQUITETURA_TECNICA.md) — §5 (Schema)
