-- Corrigir search_path das funções de manutenção
DROP TRIGGER IF EXISTS create_maintenance_credits_on_plan_insert ON user_plans;
DROP FUNCTION IF EXISTS create_maintenance_credits_for_plan();
DROP FUNCTION IF EXISTS use_maintenance_credit(UUID, UUID);

CREATE OR REPLACE FUNCTION create_maintenance_credits_for_plan()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  _plan_type TEXT;
  _credits INTEGER;
  _expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT type INTO _plan_type FROM plans WHERE id = NEW.plan_id;
  
  IF _plan_type = 'website_maintenance_1m' THEN
    _credits := 1;
    _expires_at := NEW.expires_at;
  ELSIF _plan_type = 'website_maintenance_6m' THEN
    _credits := 6;
    _expires_at := NEW.expires_at;
  ELSE
    RETURN NEW;
  END IF;
  
  INSERT INTO maintenance_credits (
    user_plan_id, user_id, total_credits, used_credits, expires_at
  ) VALUES (
    NEW.id, NEW.user_id, _credits, 0, _expires_at
  );
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION use_maintenance_credit(_user_id UUID, _project_id UUID)
RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  _credit_id UUID;
BEGIN
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
  
  UPDATE maintenance_credits
  SET used_credits = used_credits + 1, updated_at = NOW()
  WHERE id = _credit_id;
  
  RETURN _credit_id;
END;
$$;

CREATE TRIGGER create_maintenance_credits_on_plan_insert
  AFTER INSERT ON user_plans
  FOR EACH ROW
  EXECUTE FUNCTION create_maintenance_credits_for_plan();