# Akashi ✦

> Assistente pessoal adaptativo com IA — produtividade, controle financeiro e memória de longo prazo.

---

## Stack

| Camada       | Tecnologia                                          |
|--------------|-----------------------------------------------------|
| Frontend     | Next.js 15 (App Router) · Tailwind CSS · Radix UI  |
| State        | TanStack Query v5 (cache, optimistic updates)       |
| Backend      | Supabase (PostgreSQL 15 + pgvector + uuid-ossp)     |
| IA           | Claude Sonnet via Anthropic API                     |
| Embeddings   | OpenAI `text-embedding-3-small` (vector 1536d)      |
| Gráficos     | Recharts (Donut + Line charts)                      |
| Deploy       | Vercel (frontend) + Supabase Edge Functions (IA)    |
| Gerenciador  | pnpm                                                |

---

## Estrutura do projeto

```
akashi-app/
├── src/
│   ├── app/                        # Next.js App Router — apenas rotas
│   │   ├── (auth)/                 # Grupo público
│   │   │   └── login/page.tsx
│   │   ├── (app)/                  # Grupo protegido (AppShell)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx
│   │   │   │   └── _components/    # Co-localizados no dashboard
│   │   │   ├── finance/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   └── assistant/page.tsx
│   │   └── auth/callback/route.ts
│   │
│   ├── features/                   # Módulos de domínio (core da app)
│   │   ├── assistant/              # IA, chat, sessão
│   │   ├── tasks/                  # CRUD de tarefas
│   │   ├── finance/                # Transações e metas
│   │   └── reports/                # Charts e visualizações
│   │
│   └── shared/                     # Código genuinamente compartilhado
│       ├── components/
│       │   ├── layout/             # AppShell, Sidebar, Header
│       │   └── ui/                 # Panel, StatCard, Skeleton
│       ├── constants/              # Todas as constantes isoladas
│       ├── lib/supabase/           # Clients browser, server e middleware
│       └── types/                  # Todos os tipos TypeScript
│
├── supabase/functions/assistant/   # Edge Function (Deno) — pipeline IA
├── sql/001_initial_migration.sql   # Migração SQL pura e portável
├── middleware.ts                   # Proteção de rotas
└── deploy.sh                       # Deploy guiado interativo
```

**Regra de dependência:** `app` → `features` → `shared`. Features nunca importam de outras features.

---

## Funcionalidades

### ✅ Tarefas
- Criar, concluir e excluir com **optimistic update** (instantâneo, rollback em falha)
- Prioridades: baixa, média, alta, urgente
- Categorias com cores customizáveis
- Busca em tempo real

### 💰 Financeiro
- Registro de receitas e gastos
- Metas com barra de progresso
- Resumo mensal: receita, gasto, saldo, taxa de poupança

### 📊 Relatórios
- **Donut** — distribuição de tempo por categoria de tarefa
- **Donut** — gastos por categoria financeira
- **Linha temporal** — últimos 30 dias (receitas vs gastos)
- Filtro: hoje, semana, mês ou período personalizado

### 🤖 Assistente IA (pipeline RAG)
```
mensagem do usuário
       │
[1]  Embedding  →  OpenAI text-embedding-3-small
       │
[2]  RAG  →  busca semântica em user_memories (pgvector cosine)
       │
[3]  Contexto  →  tasks + transactions + goals  (paralelo)
       │
[4]  Prompt  →  system enriquecido com memórias + contexto real
       │
[5]  Claude Sonnet  →  resposta personalizada
       │
[6]  Persistência  →  conversa + nova memória  (paralelo)
```

### 🔐 Auth
- Google OAuth + Magic Link
- Middleware de proteção automática de rotas
- Sessão renovada em cada request (Supabase SSR)

---

## Banco de dados (PostgreSQL 15+)

SQL puro e portável — sem funções exclusivas do Supabase.

| Tabela                     | Descrição                                    |
|----------------------------|----------------------------------------------|
| `users`                    | Perfil + preferências JSON                   |
| `task_categories`          | Categorias customizáveis                     |
| `tasks`                    | Status, prioridade, tempo estimado/real      |
| `transaction_categories`   | Categorias financeiras                       |
| `transactions`             | Receitas/gastos (manual + Open Finance)      |
| `user_goals`               | Metas com progresso                          |
| `user_memories`            | Memória semântica da IA — `vector(1536)`     |
| `ai_conversations`         | Histórico de chat por sessão                 |
| `open_finance_connections` | Tokens e consentimentos Open Finance         |

Índice HNSW para busca vetorial eficiente:
```sql
CREATE INDEX idx_user_memories_embedding ON user_memories
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

---

## Setup local

**Pré-requisitos:** Node.js ≥ 20, pnpm ≥ 9, conta Supabase, chaves Anthropic e OpenAI.

```bash
# 1. Clone e instale
git clone https://github.com/matheusscbb/akashi-app.git
cd akashi-app && pnpm install

# 2. Variáveis de ambiente
cp .env.example .env.local
# Preencha NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# 3. Banco — cole no SQL Editor do Supabase:
#    sql/001_initial_migration.sql

# 4. Edge Function
npm i -g supabase
supabase link --project-ref SEU_REF
supabase functions deploy assistant
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...

# 5. Rode
pnpm dev   # http://localhost:3000
```

---

## Deploy em produção

### Vercel
1. Importe o repositório → framework **Next.js**
2. **Install Command:** `pnpm install` · **Build Command:** `pnpm build`
3. Adicione as variáveis de ambiente
4. Deploy

### Supabase Auth — liberar domínio
Em **Authentication → URL Configuration**:
```
Site URL:      https://akashi-app.vercel.app
Redirect URLs: https://akashi-app.vercel.app/**
```

> **Atalho:** `chmod +x deploy.sh && ./deploy.sh` — fluxo guiado completo.

---

## Princípios de arquitetura

| Princípio | Aplicação |
|-----------|-----------|
| **Feature-based** | Cada domínio é um módulo isolado com componentes, hooks e barrel export |
| **Thin pages** | Páginas só compõem features — zero lógica de negócio |
| **Compound pattern** | `Panel + PanelHeader`, `DonutChart` com tooltip e legend internos |
| **Memoização** | `memo()` em componentes + `useMemo()` em todas as derivações |
| **Constantes isoladas** | Zero magic strings; tudo em `shared/constants` |
| **Optimistic updates** | Toggle de tarefa instantâneo com rollback em falha de rede |
| **Types first** | Sem `any`; interfaces TypeScript explícitas para todos os dados |

---

## Roadmap

- [ ] Open Finance — sync automático via Pluggy/Belvo
- [ ] Resumo semanal automático — Edge Function com pg_cron
- [ ] Notificações — alertas de prazo via Supabase Realtime
- [ ] PWA — suporte offline com next-pwa
- [ ] Testes — Vitest (hooks) + Playwright (E2E)

---

MIT © Akashi
