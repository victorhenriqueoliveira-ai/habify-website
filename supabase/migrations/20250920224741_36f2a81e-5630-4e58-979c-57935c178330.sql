-- Make user_id nullable in profiles table temporarily for pre-payment profiles
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;