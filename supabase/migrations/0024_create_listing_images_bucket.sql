-- Create the listing-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, owner, created_at, updated_at)
VALUES ('listing-images', 'listing-images', true, false, NULL, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for listing-images bucket

-- Allow authenticated users to upload their own listing images
CREATE POLICY "Users can upload own listing images" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'listing-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own listing images
CREATE POLICY "Users can update own listing images" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'listing-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'listing-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own listing images
CREATE POLICY "Users can delete own listing images" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'listing-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to listing images
CREATE POLICY "Public read access for listing images" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'listing-images');

-- Allow authenticated read access to listing images
CREATE POLICY "Authenticated read access for listing images" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'listing-images');

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
