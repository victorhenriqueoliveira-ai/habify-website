-- Modificar sistema de créditos de manutenção para ser por projeto
-- Adicionar coluna project_id na tabela maintenance_credits

ALTER TABLE maintenance_credits ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- Atualizar a função use_maintenance_credit para considerar o projeto
CREATE OR REPLACE FUNCTION use_maintenance_credit(_user_id UUID, _project_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _credit_id UUID;
BEGIN
  -- Buscar um crédito específico do projeto
  SELECT id INTO _credit_id
  FROM maintenance_credits
  WHERE user_id = _user_id
    AND project_id = _project_id
    AND remaining_credits > 0
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY expires_at ASC NULLS LAST, created_at ASC
  LIMIT 1;
  
  IF _credit_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum crédito de manutenção disponível para este projeto';
  END IF;
  
  UPDATE maintenance_credits
  SET used_credits = used_credits + 1, updated_at = NOW()
  WHERE id = _credit_id;
  
  RETURN _credit_id;
END;
$$;

-- Criar tabela para mensagens de chat dentro das solicitações de manutenção
CREATE TABLE IF NOT EXISTS maintenance_request_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  attachment_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE maintenance_request_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para mensagens de manutenção
CREATE POLICY "Users can view messages from their requests"
  ON maintenance_request_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_requests mr
      WHERE mr.id = maintenance_request_messages.maintenance_request_id
        AND (
          mr.user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
          OR is_admin_or_dev_v2(auth.uid())
        )
    )
  );

CREATE POLICY "Users can send messages to their requests"
  ON maintenance_request_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM maintenance_requests mr
      WHERE mr.id = maintenance_request_messages.maintenance_request_id
        AND (
          mr.user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
          OR is_admin_or_dev_v2(auth.uid())
        )
    )
  );

CREATE POLICY "Users can update their own messages"
  ON maintenance_request_messages FOR UPDATE
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages"
  ON maintenance_request_messages FOR DELETE
  USING (auth.uid() = sender_id);

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_maintenance_request_messages_request_id 
  ON maintenance_request_messages(maintenance_request_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_request_messages_created_at 
  ON maintenance_request_messages(created_at DESC);

-- Adicionar realtime para as mensagens
ALTER PUBLICATION supabase_realtime ADD TABLE maintenance_request_messages;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_maintenance_request_messages_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER maintenance_request_messages_updated_at
  BEFORE UPDATE ON maintenance_request_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_request_messages_updated_at();