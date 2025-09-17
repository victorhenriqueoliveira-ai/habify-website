-- Create policy to allow public access to active plans
CREATE POLICY "Anyone can view active plans"
ON public.plans
FOR SELECT
USING (is_active = true);

-- Remove the restrictive authenticated-only policy if it exists
DROP POLICY IF EXISTS "Authenticated users can view plans" ON public.plans;