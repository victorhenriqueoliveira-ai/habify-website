-- FASE 3 - Item 11: Adicionar indexes no banco para otimizar queries críticas
-- Análise de queries mais usadas no sistema:
-- 1. Busca de orders por user_id, status, gateway
-- 2. Busca de projects por user_id, status
-- 3. Busca de profiles por email, user_id
-- 4. Busca de user_plans por user_id, status
-- 5. Busca de credits_history por user_id
-- 6. Busca de payment_logs por order_id, gateway

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_gateway ON orders(gateway);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_abacatepay_id ON orders(abacatepay_id) WHERE abacatepay_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_hubla_transaction_id ON orders(hubla_transaction_id) WHERE hubla_transaction_id IS NOT NULL;

-- Projects table indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON projects(user_id, status);

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- User plans table indexes
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_status ON user_plans(status);
CREATE INDEX IF NOT EXISTS idx_user_plans_plan_id ON user_plans(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_order_id ON user_plans(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_plans_expires_at ON user_plans(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_plans_user_status ON user_plans(user_id, status);

-- Credits history table indexes
CREATE INDEX IF NOT EXISTS idx_credits_history_user_id ON credits_history(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_history_created_at ON credits_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credits_history_type ON credits_history(type);
CREATE INDEX IF NOT EXISTS idx_credits_history_order_id ON credits_history(order_id) WHERE order_id IS NOT NULL;

-- Payment logs table indexes
CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id ON payment_logs(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_logs_gateway ON payment_logs(gateway);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_logs_user_id ON payment_logs(user_id) WHERE user_id IS NOT NULL;

-- Portfolio properties table indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_properties_project_id ON portfolio_properties(project_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_properties_property_type ON portfolio_properties(property_type);
CREATE INDEX IF NOT EXISTS idx_portfolio_properties_purpose ON portfolio_properties(purpose);
CREATE INDEX IF NOT EXISTS idx_portfolio_properties_created_at ON portfolio_properties(created_at DESC);

-- Plans table indexes
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON plans(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_plans_type ON plans(type);

-- Project messages table indexes
CREATE INDEX IF NOT EXISTS idx_project_messages_project_id ON project_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_project_messages_sender_id ON project_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_project_messages_created_at ON project_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_messages_is_read ON project_messages(is_read) WHERE is_read = false;

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Audit logs table indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_type ON audit_logs(target_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Composite indexes para queries complexas comuns
CREATE INDEX IF NOT EXISTS idx_orders_user_status_created ON orders(user_id, status, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_user_status_created ON projects(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_plans_user_status_expires ON user_plans(user_id, status, expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON INDEX idx_orders_user_id IS 'Otimiza busca de pedidos por usuário';
COMMENT ON INDEX idx_orders_status IS 'Otimiza busca de pedidos por status';
COMMENT ON INDEX idx_projects_user_status IS 'Otimiza busca de projetos por usuário e status';
COMMENT ON INDEX idx_profiles_email IS 'Otimiza busca de perfis por email';
COMMENT ON INDEX idx_user_plans_user_status IS 'Otimiza busca de planos ativos por usuário';