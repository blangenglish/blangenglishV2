-- Add description column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='payment_config' AND column_name='description'
  ) THEN
    ALTER TABLE payment_config ADD COLUMN description text;
  END IF;
END $$;

-- Re-insert defaults
INSERT INTO payment_config (key, value, description) VALUES
  ('pse_bank_name', '', 'Nombre del banco para PSE'),
  ('pse_account_type', 'Ahorros', 'Tipo de cuenta (Ahorros/Corriente)'),
  ('pse_account_number', '', 'Número de cuenta bancaria'),
  ('pse_owner_name', 'Blang English Academy', 'Titular de la cuenta'),
  ('paypal_link', 'https://paypal.me/blangenglish', 'Link de PayPal')
ON CONFLICT (key) DO NOTHING;
