-- Otimização de Performance - Índices para queries comuns
-- Fase 2 - Item 10: Adicionar indexes no banco

-- Índices para tabela orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_gateway ON public.orders(gateway);

-- Índices para tabela user_plans
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON public.user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_status ON public.user_plans(status);
CREATE INDEX IF NOT EXISTS idx_user_plans_plan_id ON public.user_plans(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_expires_at ON public.user_plans(expires_at) WHERE expires_at IS NOT NULL;

-- Índices para tabela projects
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user_plan_id ON public.projects(user_plan_id) WHERE user_plan_id IS NOT NULL;

-- Índices para tabela profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Índices para tabela project_messages
CREATE INDEX IF NOT EXISTS idx_project_messages_project_id ON public.project_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_project_messages_sender_id ON public.project_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_project_messages_created_at ON public.project_messages(created_at DESC);

-- Índices para tabela notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Índices para tabela portfolio_properties
CREATE INDEX IF NOT EXISTS idx_portfolio_properties_project_id ON public.portfolio_properties(project_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_properties_property_type ON public.portfolio_properties(property_type);
CREATE INDEX IF NOT EXISTS idx_portfolio_properties_purpose ON public.portfolio_properties(purpose);

-- Índices compostos para queries comuns
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_plans_user_status ON public.user_plans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON public.projects(user_id, status);

COMMENT ON INDEX idx_orders_user_id IS 'Otimiza queries de pedidos por usuário';
COMMENT ON INDEX idx_orders_status IS 'Otimiza queries de pedidos por status';
COMMENT ON INDEX idx_user_plans_user_id IS 'Otimiza queries de planos por usuário';
COMMENT ON INDEX idx_projects_user_id IS 'Otimiza queries de projetos por usuário';
COMMENT ON INDEX idx_orders_user_status IS 'Otimiza queries combinadas de usuário e status para pedidos';