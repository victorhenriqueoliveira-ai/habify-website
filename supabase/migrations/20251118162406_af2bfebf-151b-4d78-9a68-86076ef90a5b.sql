-- Fix send-payment-confirmation email sender
-- Update all edge functions that send emails to use contato@habify.com.br

-- No database changes needed, this is just a note that email functions should be updated
-- The actual change is in the edge functions code

-- Create a system_settings entry for default email sender if not exists
INSERT INTO public.system_settings (key, category, value, description)
VALUES (
  'default_email_sender',
  'email',
  '{"email": "contato@habify.com.br", "name": "Habify"}'::jsonb,
  'Default sender email address for all system emails'
)
ON CONFLICT (key) DO UPDATE
SET value = '{"email": "contato@habify.com.br", "name": "Habify"}'::jsonb;