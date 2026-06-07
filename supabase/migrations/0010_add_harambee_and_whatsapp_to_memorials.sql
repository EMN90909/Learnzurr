-- Add Harambee and WhatsApp group link columns to memorial_pages table
ALTER TABLE memorial_pages 
ADD COLUMN IF NOT EXISTS whatsapp_group_link text,
ADD COLUMN IF NOT EXISTS harambee_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS harambee_target numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS harambee_contributed numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS harambee_contributors_count integer DEFAULT 0;