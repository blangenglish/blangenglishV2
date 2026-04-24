-- Add missing columns to student_profiles if they don't exist
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS trial_active BOOLEAN DEFAULT false;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS account_enabled BOOLEAN DEFAULT true;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'pending';
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS education_level TEXT;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS education_other TEXT;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS is_admin_only BOOLEAN DEFAULT false;

-- Add missing columns to subscriptions if they don't exist
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS account_enabled BOOLEAN DEFAULT false;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_active BOOLEAN DEFAULT false;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS renewal_due_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS approved_by_admin BOOLEAN DEFAULT false;

SELECT 'Columns added successfully' as result;