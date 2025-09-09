-- Create storage bucket for project photos
INSERT INTO storage.buckets (id, name, public) VALUES ('project-photos', 'project-photos', true);

-- Create policies for project photos
CREATE POLICY "Anyone can view project photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'project-photos');

CREATE POLICY "Users can upload their own project photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'project-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own project photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'project-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own project photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'project-photos' AND auth.uid() IS NOT NULL);

-- Add function to link transactions to users after account creation
CREATE OR REPLACE FUNCTION public.link_user_transaction(user_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update transactions that don't have user_id but match the email from payment_data
  UPDATE public.transactions 
  SET user_id = auth.uid(),
      updated_at = now()
  WHERE user_id IS NULL 
    AND payment_data->>'email' = user_email
    AND auth.uid() IS NOT NULL;
END;
$$;