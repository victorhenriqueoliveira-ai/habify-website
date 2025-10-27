-- Create performance indexes for optimized queries

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_gateway_status ON public.orders(gateway, status);

-- Projects index
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

-- User plans index
CREATE INDEX IF NOT EXISTS idx_user_plans_user_status ON public.user_plans(user_id, status);

-- Payment logs index
CREATE INDEX IF NOT EXISTS idx_payment_logs_gateway_created ON public.payment_logs(gateway, created_at DESC);

-- Audit logs index
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON public.audit_logs(user_id, created_at DESC);