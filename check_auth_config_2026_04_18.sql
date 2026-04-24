-- Check auth configuration
SELECT key, value FROM auth.config WHERE key IN ('MAILER_AUTOCONFIRM', 'SMTP_ADMIN_EMAIL', 'SITE_URL') LIMIT 10;