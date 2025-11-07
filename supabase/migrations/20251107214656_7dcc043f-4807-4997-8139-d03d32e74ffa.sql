-- Criar enum para status das manutenções
CREATE TYPE maintenance_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Criar tabela de manutenções
CREATE TABLE public.maintenances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_plan_id UUID REFERENCES public.user_plans(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 79.90,
  status maintenance_status NOT NULL DEFAULT 'pending',
  payment_gateway TEXT,
  payment_id TEXT,
  payment_data JSONB DEFAULT '{}'::jsonb,
  contracted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  description TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.maintenances ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para maintenances
-- Usuários podem ver suas próprias manutenções
CREATE POLICY "Users can view their own maintenances"
ON public.maintenances
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE id = maintenances.user_id
  )
  OR is_admin_or_dev_v2(auth.uid())
);

-- Usuários podem criar manutenções para seus projetos
CREATE POLICY "Users can create maintenances for their projects"
ON public.maintenances
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = maintenances.project_id 
    AND projects.user_id = auth.uid()
  )
  OR is_admin_or_dev_v2(auth.uid())
);

-- Sistema pode criar manutenções (para webhooks)
CREATE POLICY "System can create maintenances"
ON public.maintenances
FOR INSERT
WITH CHECK (true);

-- Sistema pode atualizar manutenções
CREATE POLICY "System can update maintenances"
ON public.maintenances
FOR UPDATE
USING (true);

-- Admins podem atualizar qualquer manutenção
CREATE POLICY "Admins can update maintenances"
ON public.maintenances
FOR UPDATE
USING (is_admin_or_dev_v2(auth.uid()));

-- Admins podem deletar manutenções
CREATE POLICY "Admins can delete maintenances"
ON public.maintenances
FOR DELETE
USING (is_admin_or_dev_v2(auth.uid()));

-- Criar índices para performance
CREATE INDEX idx_maintenances_user_id ON public.maintenances(user_id);
CREATE INDEX idx_maintenances_project_id ON public.maintenances(project_id);
CREATE INDEX idx_maintenances_status ON public.maintenances(status);
CREATE INDEX idx_maintenances_contracted_at ON public.maintenances(contracted_at DESC);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_maintenances_updated_at
BEFORE UPDATE ON public.maintenances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();