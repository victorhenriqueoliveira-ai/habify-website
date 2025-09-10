-- Add email field to profiles table to store user email
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Update existing profiles with email from the name field where it looks like an email
UPDATE public.profiles 
SET email = name 
WHERE email IS NULL 
  AND name LIKE '%@%';

-- Create a function to automatically set email when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
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
$$;