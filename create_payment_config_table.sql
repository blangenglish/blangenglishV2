-- Create payment_config table for storing payment method settings
CREATE TABLE IF NOT EXISTS payment_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value text,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Seed with default keys
INSERT INTO payment_config (key, value, description) VALUES
  ('pse_bank_name', '', 'Nombre del banco para PSE'),
  ('pse_account_type', 'Ahorros', 'Tipo de cuenta bancaria (Ahorros / Corriente)'),
  ('pse_account_number', '', 'Número de cuenta bancaria'),
  ('pse_owner_name', 'Blang English Academy', 'Nombre del titular de la cuenta'),
  ('paypal_link', 'https://paypal.me/blangenglish', 'Link de PayPal para recibir pagos')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Public read payment_config" ON payment_config
  FOR SELECT USING (true);

-- Only service role can update (admin updates via Supabase dashboard)
CREATE POLICY "Service role can modify payment_config" ON payment_config
  FOR ALL USING (auth.role() = 'service_role');
