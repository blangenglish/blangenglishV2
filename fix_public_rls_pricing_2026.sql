-- Allow public read access to pricing_plans and site_settings
-- This fixes the 400 error for anonymous users on the Pricing page

-- Enable RLS on pricing_plans (if not already)
ALTER TABLE IF EXISTS pricing_plans ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "pricing_plans_public_read" ON pricing_plans;
DROP POLICY IF EXISTS "Allow public read pricing_plans" ON pricing_plans;

-- Create public read policy
CREATE POLICY "pricing_plans_public_read" ON pricing_plans
  FOR SELECT USING (true);

-- Enable RLS on site_settings (if not already)
ALTER TABLE IF EXISTS site_settings ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "site_settings_public_read" ON site_settings;
DROP POLICY IF EXISTS "Allow public read site_settings" ON site_settings;

-- Create public read policy
CREATE POLICY "site_settings_public_read" ON site_settings
  FOR SELECT USING (true);
