-- Create enum for transaction status
CREATE TYPE public.transaction_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Create enum for plan types
CREATE TYPE public.plan_type AS ENUM ('website_only', 'website_maintenance_1m', 'website_maintenance_6m');

-- Create enum for project types
CREATE TYPE public.project_type AS ENUM ('single_property', 'realtor_multiple');

-- Create plans table
CREATE TABLE public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type plan_type NOT NULL UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE RESTRICT,
  abacatepay_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Update projects table to include more fields
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_type project_type DEFAULT 'single_property';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}'::jsonb;

-- Create audit_logs table for tracking admin/dev actions
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for plans (public read access)
CREATE POLICY "Anyone can view active plans" ON public.plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON public.plans
  FOR ALL USING (is_admin_or_dev());

-- RLS policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT USING (is_admin_or_dev());

CREATE POLICY "System can create transactions" ON public.transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update transactions" ON public.transactions
  FOR UPDATE USING (true);

-- RLS policies for audit_logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (is_admin_or_dev());

CREATE POLICY "System can create audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default plans
INSERT INTO public.plans (name, type, price, description, features) VALUES
('Só o Site', 'website_only', 597.00, 'Site completo para seu empreendimento', '["Site responsivo", "Design profissional", "Otimização SEO", "Entrega em até 7 dias"]'::jsonb),
('Site + Manutenção 1 Mês', 'website_maintenance_1m', 897.00, 'Site + 1 mês de manutenção incluída', '["Site responsivo", "Design profissional", "Otimização SEO", "1 mês de manutenção", "Suporte prioritário", "Atualizações de conteúdo"]'::jsonb),
('Site + Manutenção 6 Meses', 'website_maintenance_6m', 1597.00, 'Site + 6 meses de manutenção (R$ 166,16/mês)', '["Site responsivo", "Design profissional", "Otimização SEO", "6 meses de manutenção", "Suporte prioritário", "Atualizações de conteúdo", "Relatórios mensais", "Backup automático"]'::jsonb);