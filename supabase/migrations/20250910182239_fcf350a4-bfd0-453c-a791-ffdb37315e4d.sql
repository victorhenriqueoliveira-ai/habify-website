-- Create project-photos storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-photos', 'project-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for project photos
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Project photos are publicly accessible" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload project photos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their project photos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their project photos" ON storage.objects;
    
    -- Create new policies
    CREATE POLICY "Project photos are publicly accessible" 
    ON storage.objects 
    FOR SELECT 
    USING (bucket_id = 'project-photos');

    CREATE POLICY "Users can upload project photos" 
    ON storage.objects 
    FOR INSERT 
    WITH CHECK (bucket_id = 'project-photos' AND auth.uid() IS NOT NULL);

    CREATE POLICY "Users can update their project photos" 
    ON storage.objects 
    FOR UPDATE 
    USING (bucket_id = 'project-photos' AND auth.uid() IS NOT NULL);

    CREATE POLICY "Users can delete their project photos" 
    ON storage.objects 
    FOR DELETE 
    USING (bucket_id = 'project-photos' AND auth.uid() IS NOT NULL);
END
$$;