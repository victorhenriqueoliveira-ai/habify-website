-- Conserta o consumo de crédito de manutenção.
--
-- O gatilho que cria o crédito (create_maintenance_credits_on_plan) insere
-- a partir do *plano*, sem project_id — e é o comportamento certo: quando
-- o cliente compra um plano de manutenção ele ainda não escolheu em qual
-- projeto vai usar. Mas uma migração posterior passou a exigir
-- `project_id = _project_id` na hora de consumir.
--
-- Resultado: todo crédito nasce com project_id nulo e nenhum jamais casa
-- com o filtro. A função sempre levanta "Nenhum crédito de manutenção
-- disponível para este projeto", e o cliente nunca consegue abrir uma
-- solicitação. Conferido em produção: 2 créditos existentes, os 2 com
-- saldo, os 2 com project_id nulo.
--
-- A correção trata project_id nulo como "vale para qualquer projeto deste
-- usuário", que é o significado que o gatilho sempre deu a ele. Créditos
-- presos a um projeto específico continuam valendo só para ele, e são
-- consumidos primeiro — senão um crédito concedido para o projeto X seria
-- gasto numa alteração do projeto Y, e aí o X ficaria sem.

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
    AND (project_id = _project_id OR project_id IS NULL)
    AND remaining_credits > 0
    AND (expires_at IS NULL OR expires_at > NOW())
  -- (project_id IS NULL) ordena false antes de true: o crédito específico
  -- do projeto sai na frente do crédito genérico.
  ORDER BY (project_id IS NULL), expires_at ASC NULLS LAST, created_at ASC
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
