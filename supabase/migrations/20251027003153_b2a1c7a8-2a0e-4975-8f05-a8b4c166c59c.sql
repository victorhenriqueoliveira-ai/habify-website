-- =============================================
-- CORREÇÃO DE SEGURANÇA: SEARCH PATH NAS FUNÇÕES
-- =============================================

-- Usar CREATE OR REPLACE ao invés de DROP para evitar problemas com triggers

-- 1. Corrigir notify_message_sent (usada por trigger)
CREATE OR REPLACE FUNCTION public.notify_message_sent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  project_user_id UUID;
  sender_name TEXT;
BEGIN
  -- Get project owner and sender name
  SELECT p.user_id INTO project_user_id 
  FROM public.projects p 
  WHERE p.id = NEW.project_id;
  
  SELECT pr.name INTO sender_name 
  FROM public.profiles pr 
  WHERE pr.user_id = NEW.sender_id;

  -- Notify project owner if sender is not the owner
  IF project_user_id != NEW.sender_id THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      project_user_id,
      'Nova mensagem no projeto',
      sender_name || ' enviou uma mensagem sobre seu projeto.',
      'info'
    );
  ELSE
    -- Notify admins/devs if sender is the project owner
    INSERT INTO public.notifications (user_id, title, message, type)
    SELECT user_id, 'Nova mensagem de cliente', sender_name || ' enviou uma mensagem sobre o projeto.', 'info'
    FROM public.profiles 
    WHERE role IN ('admin', 'dev');
  END IF;

  RETURN NEW;
END;
$function$;

-- 2. Corrigir handle_new_user (usada por trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    'user'
  );
  RETURN NEW;
END;
$function$;

-- 3. Corrigir validate_user_plan_role
CREATE OR REPLACE FUNCTION public.validate_user_plan_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user_role user_role;
BEGIN
  SELECT role INTO _user_role 
  FROM public.profiles 
  WHERE id = NEW.user_id;
  
  IF _user_role IN ('admin', 'dev') THEN
    RAISE EXCEPTION 'Admin e dev não podem ter planos associados';
  END IF;
  
  RETURN NEW;
END;
$function$;