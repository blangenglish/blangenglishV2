-- Trigger para confirmar automáticamente el email al registrarse
CREATE OR REPLACE FUNCTION auto_confirm_email()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    UPDATE auth.users 
    SET email_confirmed_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trig_auto_confirm ON auth.users;

CREATE TRIGGER trig_auto_confirm
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_confirm_email();

SELECT 'Auto-confirm trigger created' as result;