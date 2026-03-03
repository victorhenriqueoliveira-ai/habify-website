-- Fix permissive RLS policies: replace "true" with proper admin/service checks
-- These "System" policies were meant for edge functions using service_role (which bypasses RLS anyway)
-- So we restrict them to admin/dev only for safety

-- maintenance_credits: UPDATE
DROP POLICY IF EXISTS "System can update maintenance credits" ON public.maintenance_credits;
CREATE POLICY "Admins can update maintenance credits"
ON public.maintenance_credits FOR UPDATE TO authenticated
USING (public.is_admin_or_dev_v2(auth.uid()));

-- maintenance_credits: INSERT - restrict to admin/dev (trigger creates via security definer)
DROP POLICY IF EXISTS "System can insert maintenance credits" ON public.maintenance_credits;
CREATE POLICY "Admins can insert maintenance credits"
ON public.maintenance_credits FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_dev_v2(auth.uid()));

-- maintenances: UPDATE
DROP POLICY IF EXISTS "System can update maintenances" ON public.maintenances;
-- Already has "Admins can update maintenances" policy, no replacement needed

-- maintenances: INSERT  
DROP POLICY IF EXISTS "System can create maintenances" ON public.maintenances;
-- Already has "Users can create maintenances for their projects" policy

-- orders: INSERT
DROP POLICY IF EXISTS "System can create orders without user" ON public.orders;
CREATE POLICY "Service can create orders"
ON public.orders FOR INSERT TO anon, authenticated
WITH CHECK (true);
-- Note: orders are created by edge functions with service_role (bypasses RLS)
-- But also by unauthenticated checkout flows, so we need anon access here

-- orders: UPDATE
DROP POLICY IF EXISTS "System can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE TO authenticated
USING (public.is_admin_or_dev_v2(auth.uid()));

-- transactions: INSERT - created by edge functions with service_role
DROP POLICY IF EXISTS "System can create transactions" ON public.transactions;
CREATE POLICY "Admins can create transactions"
ON public.transactions FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_dev_v2(auth.uid()));

-- transactions: UPDATE
DROP POLICY IF EXISTS "System can update transactions" ON public.transactions;
CREATE POLICY "Admins can update transactions"
ON public.transactions FOR UPDATE TO authenticated
USING (public.is_admin_or_dev_v2(auth.uid()));

-- user_plans: INSERT - created by database functions (security definer)
DROP POLICY IF EXISTS "System can insert user plans" ON public.user_plans;
CREATE POLICY "Admins can insert user plans"
ON public.user_plans FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_dev_v2(auth.uid()));

-- user_plans: UPDATE
DROP POLICY IF EXISTS "System can update user plans" ON public.user_plans;
CREATE POLICY "Admins can update user plans"
ON public.user_plans FOR UPDATE TO authenticated
USING (public.is_admin_or_dev_v2(auth.uid()));

-- notifications: INSERT - created by triggers (security definer)
DROP POLICY IF EXISTS "System can create notifications for any user" ON public.notifications;
CREATE POLICY "Admins can create notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_dev_v2(auth.uid()) OR auth.uid() = user_id);

-- audit_logs: INSERT
DROP POLICY IF EXISTS "System can create audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can create audit logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR public.is_admin_or_dev_v2(auth.uid()));

-- credit_logs: INSERT
DROP POLICY IF EXISTS "System can insert credit logs" ON public.credit_logs;
CREATE POLICY "Admins can insert credit logs"
ON public.credit_logs FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_dev_v2(auth.uid()));

-- credits_history: INSERT
DROP POLICY IF EXISTS "System can create credits history" ON public.credits_history;
CREATE POLICY "Admins can insert credits history"
ON public.credits_history FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_dev_v2(auth.uid()));

-- payment_logs: INSERT
DROP POLICY IF EXISTS "System can create payment logs" ON public.payment_logs;
CREATE POLICY "Admins can insert payment logs"
ON public.payment_logs FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_dev_v2(auth.uid()));

-- plans: INSERT (duplicate - already has admin-only insert)
DROP POLICY IF EXISTS "System can insert plans" ON public.plans;

-- social_metrics: INSERT (duplicate - already has admin-only insert)
DROP POLICY IF EXISTS "System can insert social metrics" ON public.social_metrics;