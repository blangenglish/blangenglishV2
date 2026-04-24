/**
 * RenewalAlert.tsx
 * Shows a banner in the dashboard when PSE/PayPal subscription
 * is due within 1 day, prompting the student to renew.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Copy, CheckCircle2, ExternalLink, Wallet, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RenewalAlertProps {
  paymentMethod: 'pse' | 'paypal';
  dueDate: string; // ISO string
  onDismiss: () => void;
}

export function RenewalAlert({ paymentMethod, dueDate, onDismiss }: RenewalAlertProps) {
  const [copied, setCopied] = useState(false);
  const ADMIN_EMAIL = 'blangenglishlearning@blangenglish.com';

  const copyEmail = () => {
    navigator.clipboard.writeText(ADMIN_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const due = new Date(dueDate);
  const formatted = due.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <motion.div
      className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 shadow-lg"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="font-extrabold text-amber-800 text-sm">
            ⏰ ¡Tu suscripción vence el {formatted}!
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Para mantener tu acceso activo, debes {paymentMethod === 'pse' ? 'hacer la transferencia PSE' : 'enviar el pago por PayPal'} y enviar el soporte <strong>hoy</strong> al correo:
          </p>
          <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2 mt-2">
            <span className="text-xs font-mono text-foreground flex-1">{ADMIN_EMAIL}</span>
            <button onClick={copyEmail} className="text-amber-600 hover:text-amber-800 shrink-0">
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            {paymentMethod === 'paypal' && (
              <a href="https://paypal.me" target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs h-8 gap-1.5">
                  <Wallet className="w-3.5 h-3.5" /> Ir a PayPal <ExternalLink className="w-3 h-3" />
                </Button>
              </a>
            )}
            {paymentMethod === 'pse' && (
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs h-8 gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Transferir por PSE
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onDismiss} className="rounded-xl text-xs h-8 text-amber-700 hover:bg-amber-100">
              Recordar después
            </Button>
          </div>
        </div>
        <button onClick={onDismiss} className="text-amber-500 hover:text-amber-700 shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
