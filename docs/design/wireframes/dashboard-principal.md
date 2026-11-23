# Wireframes - Dashboard Principal

## Desktop - Layout Completo

```
┌─────────────────────────────────────────────────────────────────────────┐
│  CreditoGov       [Empresa XYZ]  [Settings] [Logout]                   │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌──────────┐  │  ┌────────────────────────────────────────────────────┐ │
│ │ Dashboard│  │  │  Olá, João!                                        │ │
│ │ Créditos │  │  │  Sua situação de créditos em tempo real            │ │
│ │ Ações    │  │  │                                                    │ │
│ │ Config   │  │  │  ┌──────────┬──────────┬────────────────────────┐  │ │
│ │          │  │  │  │R$ 150k   │R$ 120k   │R$ 180k                │  │ │
│ │          │  │  │  │Validados │Pendentes │Projeção 90d           │  │ │
│ │          │  │  │  └──────────┴──────────┴────────────────────────┘  │ │
│ │          │  │  │                                                    │ │
│ │          │  │  │  📊 PROJEÇÃO (30 DIAS)                             │ │
│ │          │  │  │  ┌──────────────────────────────────────────────┐ │ │
│ │          │  │  │  │                                              │ │ │
│ │          │  │  │  │      200k │                                  │ │ │
│ │          │  │  │  │      150k │  ╱╲                              │ │ │
│ │          │  │  │  │      100k │ ╱  ╲                             │ │ │
│ │          │  │  │  │       50k │╱     ╲                           │ │ │
│ │          │  │  │  │          0├──────────►                       │ │ │
│ │          │  │  │  │            1  7  14  21  28 dias            │ │ │
│ │          │  │  │  └──────────────────────────────────────────────┘ │ │
│ │          │  │  │                                                    │ │
│ │          │  │  │  ⚡ OPORTUNIDADES                                 │ │
│ │          │  │  │  Compensar R$ 50k de débito ICMS                 │ │
│ │          │  │  │  [Compensar]                                      │ │
│ │          │  │  │                                                    │ │
│ │          │  │  │  Adiantar R$ 120k de crédito (1,8% am)            │ │
│ │          │  │  │  [Adiantar]                                        │ │
│ │          │  │  └────────────────────────────────────────────────┘ │ │
│ └──────────┘  │                                                       │ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tabela de Créditos

```
┌────────────────────────────────────────────────────────────────────────────┐
│ SEUS CRÉDITOS                                         [Filtrar] [+Info]   │
├────────────────────────────────────────────────────────────────────────────┤
│ Fornecedor      │ Valor       │ Status      │ Data    │ Vence   │ Ações   │
├─────────────────┼─────────────┼─────────────┼─────────┼─────────┼─────────┤
│ Fornecedor A    │ R$ 50.000   │ ✅ Validado │ 10/01   │ 45d     │ > /⬆   │
│ Fornecedor B    │ R$ 35.230   │ ✅ Validado │ 12/01   │ 40d     │ > /⬆   │
│ Fornecedor C    │ R$ 25.000   │ ⏳ Pendente │ 13/01   │ 50d     │ > /ℹ   │
│ Fornecedor D    │ R$ 15.000   │ ✅ Validado │ 11/01   │ 45d     │ > /⬆   │
│ Fornecedor E    │ R$ 9.500    │ ⏳ Pendente │ 14/01   │ 55d     │ > /ℹ   │
│                                                    [< Ant] [Prox >]        │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Modal: Compensar Débito

```
┌────────────────────────────────────────────┐
│ Compensar Débito                        [X] │
├────────────────────────────────────────────┤
│                                            │
│ CRÉDITO: R$ 50.000 (Fornecedor A)         │
│                                            │
│ DÉBITOS PENDENTES:                        │
│ ○ ICMS  R$ 50.000  [Vence: 20/01]        │
│ ○ PIS   R$ 15.000  [Vence: 25/01]        │
│ ○ IPI   R$ 8.000   [Vence: 28/01]        │
│                                            │
│ VALORES:                                   │
│ Crédito:     R$ 50.000                    │
│ Débito:      R$ 50.000                    │
│ A Compensar: R$ 50.000                    │
│ Saldo:       R$ 0                         │
│                                            │
│          [Cancelar]  [Compensar]          │
│                                            │
└────────────────────────────────────────────┘
```

---

## Modal: Adiantar Crédito

```
┌─────────────────────────────────────────────┐
│ Adiantar Crédito                        [X] │
├─────────────────────────────────────────────┤
│                                             │
│ CRÉDITO: R$ 50.000                         │
│ FINTECH: [○ Facile] [● Liber]             │
│                                             │
│ SIMULAÇÃO:                                  │
│ Taxa:         1,8% a.m.                    │
│ Prazo:        30 dias                      │
│ Custo:        -R$ 900                      │
│ ─────────────────────                      │
│ Você recebe:  R$ 49.100                    │
│ Em:           24 horas                     │
│                                             │
│          [Cancelar]  [Adiantar]            │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Mobile - Versão Responsiva

```
┌──────────────────────────────┐
│ ≡ CreditoGov  [Settings]    │
├──────────────────────────────┤
│ Olá, João!                   │
│ Sua situação em tempo real   │
│                              │
│ ┌────────────────────────┐  │
│ │ R$ 150.230             │  │
│ │ Validados Agora        │  │
│ └────────────────────────┘  │
│                              │
│ ┌────────────────────────┐  │
│ │ R$ 120.000             │  │
│ │ Aguardando Validação   │  │
│ └────────────────────────┘  │
│                              │
│ ┌────────────────────────┐  │
│ │ R$ 180.000             │  │
│ │ Projeção 90 dias       │  │
│ └────────────────────────┘  │
│                              │
│ 📊 ÚLTIMOS CRÉDITOS         │
│ ┌────────────────────────┐  │
│ │ Fornecedor A           │  │
│ │ R$ 50.000  ✅  [>][⬆]  │  │
│ ├────────────────────────┤  │
│ │ Fornecedor B           │  │
│ │ R$ 35.230  ✅  [>][⬆]  │  │
│ └────────────────────────┘  │
│                              │
│ ⚡ OPORTUNIDADES            │
│ [Compensar Débito]          │
│ [Adiantar Crédito]          │
│                              │
└──────────────────────────────┘
```

---

## Estados - Loading

```
┌──────────────────────────────────────────┐
│ ⟳ Sincronizando com Receita Federal...   │
├──────────────────────────────────────────┤
│                                          │
│ [████████░░░░░░░░░░] 45%                 │
│                                          │
│ Validados: 25/50                         │
│ Pendentes: 15/50                         │
│ Erros: 0/50                              │
│                                          │
│ Tempo estimado: 30s                      │
│                                          │
└──────────────────────────────────────────┘
```

---

## Estados - Vazio (Primeira Vez)

```
┌──────────────────────────────────────────┐
│ Bem-vindo ao CreditoGov!                 │
│                                          │
│ 📦 Nenhum crédito encontrado ainda       │
│                                          │
│ Como funciona:                           │
│ 1. Você compra de um fornecedor          │
│ 2. Nós sincronizamos com o governo       │
│ 3. Você vê seus créditos aqui            │
│ 4. Compensa ou antecipa com 2 cliques   │
│                                          │
│ Próxima sincronização:                   │
│ Amanhã às 00:05                          │
│                                          │
│ Ou [Sincronizar Agora]                  │
│                                          │
└──────────────────────────────────────────┘
```

---

## Fluxo de Navegação

```
Dashboard (Home)
    ├── Clica em Crédito
    │   └── Detalhes do Crédito
    │       ├── Compensar → Modal
    │       ├── Adiantar → Modal
    │       └── Voltar
    │
    ├── Tabela de Créditos
    │   ├── Filtrar
    │   ├── Ordenar
    │   └── Paginar
    │
    └── Settings
        ├── Desconectar
        └── Logout
```

---

**Última atualização**: Agosto 2026
