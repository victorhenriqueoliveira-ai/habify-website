
-- 1. PROFILES: prevent privilege escalation via self-update
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins/devs bypass
  IF public.is_admin_or_dev_v2(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.credits IS DISTINCT FROM OLD.credits
     OR NEW.is_active IS DISTINCT FROM OLD.is_active
     OR NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Não é permitido alterar role, credits, is_active, user_id ou auth_user_id';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_profile_escalation_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. ORDERS: restrict anonymous insert
DROP POLICY IF EXISTS "Service can create orders" ON public.orders;

CREATE POLICY "Authenticated users can create their own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IS NULL
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = orders.user_id AND p.user_id = auth.uid())
);

CREATE POLICY "Anonymous can create guest orders only"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- 3. USER_ROLES: explicit restrictive deny on self-insert (defense in depth)
CREATE POLICY "Block non-admin user_roles inserts"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_dev_v2(auth.uid()));

-- 4. STORAGE: project-photos — only owner of the project folder can modify
-- Convention: files stored under <project_id>/...
DROP POLICY IF EXISTS "Authenticated users can upload project photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update project photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete project photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their project photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their project photos" ON storage.objects;

CREATE POLICY "Project owner or admin can upload project photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-photos'
  AND (
    public.is_admin_or_dev_v2(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Project owner or admin can update project photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-photos'
  AND (
    public.is_admin_or_dev_v2(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Project owner or admin can delete project photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-photos'
  AND (
    public.is_admin_or_dev_v2(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.user_id = auth.uid()
    )
  )
);
