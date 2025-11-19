-- Tabela de créditos de manutenção
CREATE TABLE IF NOT EXISTS maintenance_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_plan_id UUID NOT NULL REFERENCES user_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_credits INTEGER NOT NULL DEFAULT 0,
  used_credits INTEGER NOT NULL DEFAULT 0,
  remaining_credits INTEGER GENERATED ALWAYS AS (total_credits - used_credits) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de solicitações de customização
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  maintenance_credit_id UUID REFERENCES maintenance_credits(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  attachments_urls TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  admin_notes TEXT,
  before_urls TEXT[],
  after_urls TEXT[],
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_maintenance_credits_user_id ON maintenance_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_credits_user_plan_id ON maintenance_credits(user_plan_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_user_id ON maintenance_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_project_id ON maintenance_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON maintenance_requests(status);

-- RLS Policies para maintenance_credits
ALTER TABLE maintenance_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own maintenance credits"
  ON maintenance_credits FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE id = maintenance_credits.user_id
    ) OR is_admin_or_dev_v2(auth.uid())
  );

CREATE POLICY "System can insert maintenance credits"
  ON maintenance_credits FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update maintenance credits"
  ON maintenance_credits FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete maintenance credits"
  ON maintenance_credits FOR DELETE
  USING (is_admin_or_dev_v2(auth.uid()));

-- RLS Policies para maintenance_requests
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own maintenance requests"
  ON maintenance_requests FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE id = maintenance_requests.user_id
    ) OR is_admin_or_dev_v2(auth.uid())
  );

CREATE POLICY "Users can create maintenance requests for their projects"
  ON maintenance_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = maintenance_requests.project_id 
      AND projects.user_id = auth.uid()
    ) OR is_admin_or_dev_v2(auth.uid())
  );

CREATE POLICY "Admins can update maintenance requests"
  ON maintenance_requests FOR UPDATE
  USING (is_admin_or_dev_v2(auth.uid()));

CREATE POLICY "Users can update their own pending requests"
  ON maintenance_requests FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE id = maintenance_requests.user_id
    ) AND status = 'pending'
  );

CREATE POLICY "Admins can delete maintenance requests"
  ON maintenance_requests FOR DELETE
  USING (is_admin_or_dev_v2(auth.uid()));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_maintenance_credits_updated_at
  BEFORE UPDATE ON maintenance_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_requests_updated_at
  BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para criar créditos automaticamente ao adicionar user_plan
CREATE OR REPLACE FUNCTION create_maintenance_credits_for_plan()
RETURNS TRIGGER AS $$
DECLARE
  _plan_type TEXT;
  _credits INTEGER;
  _expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Buscar tipo do plano
  SELECT type INTO _plan_type FROM plans WHERE id = NEW.plan_id;
  
  -- Calcular créditos baseado no tipo
  IF _plan_type = 'website_maintenance_1m' THEN
    _credits := 1;
    _expires_at := NEW.expires_at;
  ELSIF _plan_type = 'website_maintenance_6m' THEN
    _credits := 6;
    _expires_at := NEW.expires_at;
  ELSE
    -- Não é plano de manutenção, não criar créditos
    RETURN NEW;
  END IF;
  
  -- Criar créditos de manutenção
  INSERT INTO maintenance_credits (
    user_plan_id,
    user_id,
    total_credits,
    used_credits,
    expires_at
  ) VALUES (
    NEW.id,
    NEW.user_id,
    _credits,
    0,
    _expires_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar créditos automaticamente
CREATE TRIGGER create_maintenance_credits_on_plan_insert
  AFTER INSERT ON user_plans
  FOR EACH ROW
  EXECUTE FUNCTION create_maintenance_credits_for_plan();

-- Função para usar crédito ao criar solicitação
CREATE OR REPLACE FUNCTION use_maintenance_credit(_user_id UUID, _project_id UUID)
RETURNS UUID AS $$
DECLARE
  _credit_id UUID;
  _remaining INTEGER;
BEGIN
  -- Buscar crédito disponível
  SELECT id INTO _credit_id
  FROM maintenance_credits
  WHERE user_id = _user_id
    AND remaining_credits > 0
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY expires_at ASC NULLS LAST, created_at ASC
  LIMIT 1;
  
  IF _credit_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum crédito de manutenção disponível';
  END IF;
  
  -- Incrementar créditos usados
  UPDATE maintenance_credits
  SET used_credits = used_credits + 1,
      updated_at = NOW()
  WHERE id = _credit_id;
  
  RETURN _credit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;