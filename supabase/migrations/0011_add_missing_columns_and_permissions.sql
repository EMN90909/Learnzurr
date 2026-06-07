-- Add missing columns to memorial_pages
ALTER TABLE memorial_pages ADD COLUMN IF NOT EXISTS harambee_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE memorial_pages ADD COLUMN IF NOT EXISTS harambee_target NUMERIC DEFAULT 0;
ALTER TABLE memorial_pages ADD COLUMN IF NOT EXISTS harambee_contributed NUMERIC DEFAULT 0;
ALTER TABLE memorial_pages ADD COLUMN IF NOT EXISTS harambee_contributors_count INT DEFAULT 0;
ALTER TABLE memorial_pages ADD COLUMN IF NOT EXISTS whatsapp_group_link TEXT;

-- Add missing columns to erp_staff
ALTER TABLE erp_staff ADD COLUMN IF NOT EXISTS task_description TEXT;

-- Add missing columns to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS contact_person TEXT;

-- Enable RLS on payments and subscriptions if not already enabled
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Allow authenticated insert to payments" ON payments;
DROP POLICY IF EXISTS "Allow authenticated insert to subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Allow authenticated select from payments" ON payments;
DROP POLICY IF EXISTS "Allow authenticated select from subscriptions" ON subscriptions;

-- Create permissive RLS policies for payments
CREATE POLICY "Allow authenticated insert to payments" ON payments 
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated select from payments" ON payments 
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow anonymous insert to payments" ON payments 
    FOR INSERT TO anon WITH CHECK (true);

-- Create permissive RLS policies for subscriptions
CREATE POLICY "Allow authenticated insert to subscriptions" ON subscriptions 
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated select from subscriptions" ON subscriptions 
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow anonymous insert to subscriptions" ON subscriptions 
    FOR INSERT TO anon WITH CHECK (true);

-- Ensure public read access to memorial_pages is allowed for anyone with the slug
DROP POLICY IF EXISTS "Allow public read access to public memorials" ON memorial_pages;
CREATE POLICY "Allow public read access to public memorials" ON memorial_pages 
    FOR SELECT USING (true);

-- Ensure public read access to memorial_comments is allowed
DROP POLICY IF EXISTS "Allow public read access to comments" ON memorial_comments;
CREATE POLICY "Allow public read access to comments" ON memorial_comments 
    FOR SELECT USING (true);