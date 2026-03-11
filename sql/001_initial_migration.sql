-- =============================================================================
-- AKASHI — MIGRATION INICIAL
-- Versão: 001
-- PostgreSQL 15+ | Portável (sem funções proprietárias do Supabase)
--
-- Ordem de execução:
--   1. Extensões
--   2. Função de auditoria (updated_at)
--   3. Tabelas (respeitando ordem de FK)
--   4. Índices de performance
--   5. Função de busca RAG (fn_search_memories)
--   6. Trigger de auto-criação de perfil (fn_handle_new_user)
--   7. Row Level Security — policies por tabela
--   8. Seed automático de categorias padrão por usuário
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSÕES
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";       -- pgvector para embeddings

-- ---------------------------------------------------------------------------
-- FUNÇÃO GENÉRICA DE AUDITORIA (updated_at)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- TABELA: users (perfil de app, separado do auth)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id       UUID UNIQUE NOT NULL,          -- referência ao auth provider
  full_name     TEXT,
  avatar_url    TEXT,
  timezone      TEXT NOT NULL DEFAULT 'UTC',
  preferences   JSONB NOT NULL DEFAULT '{}',   -- configurações de UI/IA
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE INDEX idx_users_auth_id ON users(auth_id);

-- ---------------------------------------------------------------------------
-- TABELA: task_categories (categorias customizáveis por usuário)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,                   -- ex: 'work', 'personal', 'finance'
  color       TEXT NOT NULL DEFAULT '#6366f1', -- hex color
  icon        TEXT NOT NULL DEFAULT 'circle',  -- icon name (lucide)
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

CREATE TRIGGER trg_task_categories_updated_at
  BEFORE UPDATE ON task_categories
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE INDEX idx_task_categories_user_id ON task_categories(user_id);

-- ---------------------------------------------------------------------------
-- TABELA: tasks
-- ---------------------------------------------------------------------------
CREATE TYPE task_status   AS ENUM ('pending', 'in_progress', 'done', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE IF NOT EXISTS tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES task_categories(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  status          task_status   NOT NULL DEFAULT 'pending',
  priority        task_priority NOT NULL DEFAULT 'medium',
  estimated_minutes INTEGER,                   -- tempo estimado em minutos
  actual_minutes    INTEGER,                   -- tempo real gasto
  due_at          TIMESTAMPTZ,
  done_at         TIMESTAMPTZ,
  is_recurring    BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_rule TEXT,                        -- iCal RRULE string
  metadata        JSONB NOT NULL DEFAULT '{}', -- dados extras (integrações)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE INDEX idx_tasks_user_id         ON tasks(user_id);
CREATE INDEX idx_tasks_status          ON tasks(user_id, status);
CREATE INDEX idx_tasks_due_at          ON tasks(user_id, due_at);
CREATE INDEX idx_tasks_category_id     ON tasks(category_id);
CREATE INDEX idx_tasks_done_at         ON tasks(user_id, done_at);

-- ---------------------------------------------------------------------------
-- TABELA: transaction_categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transaction_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#10b981',
  icon        TEXT NOT NULL DEFAULT 'wallet',
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

CREATE TRIGGER trg_transaction_categories_updated_at
  BEFORE UPDATE ON transaction_categories
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ---------------------------------------------------------------------------
-- TABELA: transactions (manual + Open Finance)
-- ---------------------------------------------------------------------------
CREATE TYPE transaction_type   AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE transaction_source AS ENUM ('manual', 'open_finance', 'import');

CREATE TABLE IF NOT EXISTS transactions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id       UUID REFERENCES transaction_categories(id) ON DELETE SET NULL,
  task_id           UUID REFERENCES tasks(id) ON DELETE SET NULL, -- vinculado a tarefa
  title             TEXT NOT NULL,
  description       TEXT,
  amount            NUMERIC(15, 2) NOT NULL,   -- positivo sempre; tipo define sinal
  currency          CHAR(3) NOT NULL DEFAULT 'BRL',
  type              transaction_type   NOT NULL,
  source            transaction_source NOT NULL DEFAULT 'manual',
  external_id       TEXT,                      -- ID do Open Finance
  account_name      TEXT,                      -- banco/conta de origem
  occurred_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE INDEX idx_transactions_user_id     ON transactions(user_id);
CREATE INDEX idx_transactions_occurred_at ON transactions(user_id, occurred_at DESC);
CREATE INDEX idx_transactions_type        ON transactions(user_id, type);
CREATE INDEX idx_transactions_category    ON transactions(category_id);
CREATE INDEX idx_transactions_external_id ON transactions(external_id) WHERE external_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- TABELA: user_goals (metas financeiras e pessoais)
-- ---------------------------------------------------------------------------
CREATE TYPE goal_type   AS ENUM ('savings', 'spending_limit', 'income_target', 'task_habit', 'custom');
CREATE TYPE goal_status AS ENUM ('active', 'achieved', 'paused', 'cancelled');

CREATE TABLE IF NOT EXISTS user_goals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES transaction_categories(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  type            goal_type   NOT NULL DEFAULT 'custom',
  status          goal_status NOT NULL DEFAULT 'active',
  target_amount   NUMERIC(15, 2),
  current_amount  NUMERIC(15, 2) NOT NULL DEFAULT 0,
  target_date     TIMESTAMPTZ,
  achieved_at     TIMESTAMPTZ,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_user_goals_updated_at
  BEFORE UPDATE ON user_goals
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX idx_user_goals_status  ON user_goals(user_id, status);

-- ---------------------------------------------------------------------------
-- TABELA: user_memories (RAG - memória semântica da IA)
-- ---------------------------------------------------------------------------
CREATE TYPE memory_type AS ENUM (
  'conversation', 'preference', 'insight', 'summary', 'goal_context'
);

CREATE TABLE IF NOT EXISTS user_memories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        memory_type NOT NULL DEFAULT 'conversation',
  content     TEXT NOT NULL,                   -- texto original
  summary     TEXT,                            -- versão resumida
  embedding   vector(1536),                    -- OpenAI text-embedding-3-small
  relevance   FLOAT NOT NULL DEFAULT 1.0,      -- peso de relevância
  expires_at  TIMESTAMPTZ,                     -- NULL = permanente
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_user_memories_updated_at
  BEFORE UPDATE ON user_memories
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE INDEX idx_user_memories_user_id   ON user_memories(user_id);
CREATE INDEX idx_user_memories_type      ON user_memories(user_id, type);
CREATE INDEX idx_user_memories_expires   ON user_memories(expires_at) WHERE expires_at IS NOT NULL;

-- Índice HNSW para busca vetorial eficiente (pgvector 0.5+)
CREATE INDEX idx_user_memories_embedding ON user_memories
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ---------------------------------------------------------------------------
-- TABELA: ai_conversations (histórico de chats)
-- ---------------------------------------------------------------------------
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

CREATE TABLE IF NOT EXISTS ai_conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id  UUID NOT NULL DEFAULT uuid_generate_v4(),
  role        message_role NOT NULL,
  content     TEXT NOT NULL,
  tokens_used INTEGER,
  metadata    JSONB NOT NULL DEFAULT '{}',    -- model, latency, memory_ids usados
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- sem updated_at: mensagens são imutáveis
);

CREATE INDEX idx_ai_conversations_user_session ON ai_conversations(user_id, session_id, created_at);
CREATE INDEX idx_ai_conversations_created_at   ON ai_conversations(user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- TABELA: open_finance_connections (integração Open Finance)
-- ---------------------------------------------------------------------------
CREATE TYPE of_status AS ENUM ('pending', 'active', 'expired', 'revoked');

CREATE TABLE IF NOT EXISTS open_finance_connections (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  institution_id  TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  status          of_status NOT NULL DEFAULT 'pending',
  consent_id      TEXT,                        -- ID do consentimento
  access_token    TEXT,                        -- criptografado na app layer
  refresh_token   TEXT,                        -- criptografado na app layer
  expires_at      TIMESTAMPTZ,
  last_sync_at    TIMESTAMPTZ,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_open_finance_connections_updated_at
  BEFORE UPDATE ON open_finance_connections
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE INDEX idx_of_connections_user_id ON open_finance_connections(user_id);

-- ---------------------------------------------------------------------------
-- FUNÇÃO: busca semântica por similaridade de coseno
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_search_memories(
  p_user_id   UUID,
  p_embedding vector(1536),
  p_limit     INT DEFAULT 5,
  p_threshold FLOAT DEFAULT 0.75
)
RETURNS TABLE (
  id          UUID,
  content     TEXT,
  summary     TEXT,
  type        memory_type,
  similarity  FLOAT,
  created_at  TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    m.id,
    m.content,
    m.summary,
    m.type,
    1 - (m.embedding <=> p_embedding) AS similarity,
    m.created_at
  FROM user_memories m
  WHERE
    m.user_id = p_user_id
    AND (m.expires_at IS NULL OR m.expires_at > NOW())
    AND 1 - (m.embedding <=> p_embedding) >= p_threshold
  ORDER BY m.embedding <=> p_embedding
  LIMIT p_limit;
$$;

-- ---------------------------------------------------------------------------
-- TRIGGER: criar perfil público automaticamente após signup no Supabase Auth
-- Dispara em auth.users (schema interno do Supabase) após cada novo usuário.
-- SECURITY DEFINER garante permissão para escrever em public.users.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (auth_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (auth_id) DO NOTHING; -- idempotente: re-execuções não quebram
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION fn_handle_new_user();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- Cada usuário só acessa os próprios dados — nunca dados de terceiros.
-- A Edge Function usa service_role key e bypassa o RLS quando necessário.
-- ---------------------------------------------------------------------------

-- Habilitar RLS em todas as tabelas de dados do usuário
ALTER TABLE users                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals               ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_finance_connections ENABLE ROW LEVEL SECURITY;

-- ── users ────────────────────────────────────────────────────────────────────
-- Usuário lê/edita apenas o próprio perfil (auth_id = JWT uid)
CREATE POLICY "users: acesso ao próprio perfil"
  ON users
  FOR ALL
  USING     (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- ── Helper: resolve user_id a partir do JWT ──────────────────────────────────
-- Usada nas policies abaixo para evitar subquery repetida.
CREATE OR REPLACE FUNCTION fn_my_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$;

-- ── task_categories ──────────────────────────────────────────────────────────
CREATE POLICY "task_categories: owner only"
  ON task_categories
  FOR ALL
  USING     (user_id = fn_my_user_id())
  WITH CHECK (user_id = fn_my_user_id());

-- ── tasks ────────────────────────────────────────────────────────────────────
CREATE POLICY "tasks: owner only"
  ON tasks
  FOR ALL
  USING     (user_id = fn_my_user_id())
  WITH CHECK (user_id = fn_my_user_id());

-- ── transaction_categories ───────────────────────────────────────────────────
CREATE POLICY "transaction_categories: owner only"
  ON transaction_categories
  FOR ALL
  USING     (user_id = fn_my_user_id())
  WITH CHECK (user_id = fn_my_user_id());

-- ── transactions ─────────────────────────────────────────────────────────────
CREATE POLICY "transactions: owner only"
  ON transactions
  FOR ALL
  USING     (user_id = fn_my_user_id())
  WITH CHECK (user_id = fn_my_user_id());

-- ── user_goals ───────────────────────────────────────────────────────────────
CREATE POLICY "user_goals: owner only"
  ON user_goals
  FOR ALL
  USING     (user_id = fn_my_user_id())
  WITH CHECK (user_id = fn_my_user_id());

-- ── user_memories ────────────────────────────────────────────────────────────
-- Leitura/escrita pelo próprio usuário.
-- A Edge Function usa service_role e bypassa essa policy ao salvar memórias.
CREATE POLICY "user_memories: owner only"
  ON user_memories
  FOR ALL
  USING     (user_id = fn_my_user_id())
  WITH CHECK (user_id = fn_my_user_id());

-- ── ai_conversations ─────────────────────────────────────────────────────────
CREATE POLICY "ai_conversations: owner only"
  ON ai_conversations
  FOR ALL
  USING     (user_id = fn_my_user_id())
  WITH CHECK (user_id = fn_my_user_id());

-- ── open_finance_connections ─────────────────────────────────────────────────
CREATE POLICY "open_finance_connections: owner only"
  ON open_finance_connections
  FOR ALL
  USING     (user_id = fn_my_user_id())
  WITH CHECK (user_id = fn_my_user_id());

-- ---------------------------------------------------------------------------
-- SEED: trigger de categorias padrão para novos usuários
-- Cria automaticamente as categorias base quando um novo perfil é inserido.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_seed_default_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Categorias de tarefa padrão
  INSERT INTO task_categories (user_id, name, slug, color, icon, is_default)
  VALUES
    (NEW.id, 'Trabalho',   'work',      '#6366f1', 'briefcase',   TRUE),
    (NEW.id, 'Pessoal',    'personal',  '#ec4899', 'user',        TRUE),
    (NEW.id, 'Financeiro', 'finance',   '#10b981', 'dollar-sign', TRUE),
    (NEW.id, 'Doméstico',  'home',      '#f59e0b', 'home',        TRUE),
    (NEW.id, 'Saúde',      'health',    '#ef4444', 'heart',       TRUE),
    (NEW.id, 'Educação',   'education', '#8b5cf6', 'book-open',   TRUE)
  ON CONFLICT (user_id, slug) DO NOTHING;

  -- Categorias de transação padrão
  INSERT INTO transaction_categories (user_id, name, slug, color, icon, is_default)
  VALUES
    (NEW.id, 'Alimentação',   'food',          '#f59e0b', 'utensils',      TRUE),
    (NEW.id, 'Moradia',       'housing',       '#6366f1', 'home',          TRUE),
    (NEW.id, 'Transporte',    'transport',     '#06b6d4', 'car',           TRUE),
    (NEW.id, 'Saúde',         'health',        '#ef4444', 'heart',         TRUE),
    (NEW.id, 'Lazer',         'entertainment', '#ec4899', 'tv',            TRUE),
    (NEW.id, 'Educação',      'education',     '#8b5cf6', 'book-open',     TRUE),
    (NEW.id, 'Salário',       'salary',        '#10b981', 'trending-up',   TRUE),
    (NEW.id, 'Freelance',     'freelance',     '#84cc16', 'briefcase',     TRUE),
    (NEW.id, 'Investimentos', 'investments',   '#f97316', 'bar-chart',     TRUE),
    (NEW.id, 'Outros',        'other',         '#6b7280', 'more-horizontal',TRUE)
  ON CONFLICT (user_id, slug) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_seed_categories_on_new_user
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION fn_seed_default_categories();
