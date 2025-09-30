-- Add new columns to projects table for wizard flow
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS layout_choice text,
ADD COLUMN IF NOT EXISTS color_palette text,
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS wizard_data jsonb DEFAULT '{}'::jsonb;

-- Add comment explaining wizard_data structure
COMMENT ON COLUMN public.projects.wizard_data IS 'Stores wizard form data including: profileType, ownerName, companyName, creciNumber, creciType, address fields, and contact information';