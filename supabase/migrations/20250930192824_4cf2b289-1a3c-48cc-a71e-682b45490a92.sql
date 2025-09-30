-- Create table for portfolio properties
CREATE TABLE IF NOT EXISTS public.portfolio_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  price NUMERIC NOT NULL,
  property_type TEXT NOT NULL,
  purpose TEXT NOT NULL, -- 'sale' or 'rent'
  bedrooms INTEGER,
  bathrooms INTEGER,
  area NUMERIC NOT NULL,
  parking_spaces INTEGER,
  construction_year INTEGER,
  floor_number INTEGER,
  condominium_fee NUMERIC,
  iptu NUMERIC,
  description TEXT,
  amenities TEXT[], -- Array of amenities
  photos TEXT[] NOT NULL DEFAULT '{}', -- Array of photo URLs
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.portfolio_properties ENABLE ROW LEVEL SECURITY;

-- Create policies for portfolio_properties
CREATE POLICY "Users can view properties from their projects"
  ON public.portfolio_properties
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = portfolio_properties.project_id
      AND projects.user_id = auth.uid()
    )
    OR is_admin_or_dev()
  );

CREATE POLICY "Users can create properties for their projects"
  ON public.portfolio_properties
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = portfolio_properties.project_id
      AND projects.user_id = auth.uid()
    )
    OR is_admin_or_dev()
  );

CREATE POLICY "Users can update properties from their projects"
  ON public.portfolio_properties
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = portfolio_properties.project_id
      AND projects.user_id = auth.uid()
    )
    OR is_admin_or_dev()
  );

CREATE POLICY "Users can delete properties from their projects"
  ON public.portfolio_properties
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = portfolio_properties.project_id
      AND projects.user_id = auth.uid()
    )
    OR is_admin_or_dev()
  );

-- Create trigger for updated_at
CREATE TRIGGER update_portfolio_properties_updated_at
  BEFORE UPDATE ON public.portfolio_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_portfolio_properties_project_id ON public.portfolio_properties(project_id);