import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  description?: string; // alias for message
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'warning' | 'danger' | 'info';
}

export function ConfirmDialog({
  open,
  title = '¿Estás seguro?',
  message,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'warning',
}: ConfirmDialogProps) {
  const displayMessage = message || description || 'Se realizarán las modificaciones solicitadas.';
  const colors = {
    warning: { bg: 'bg-amber-50', border: 'border-amber-300', icon: 'text-amber-500', btn: 'bg-amber-500 hover:bg-amber-600 text-white' },
    danger:  { bg: 'bg-red-50',    border: 'border-red-300',    icon: 'text-red-500',    btn: 'bg-red-500 hover:bg-red-600 text-white' },
    info:    { bg: 'bg-blue-50',   border: 'border-blue-300',   icon: 'text-blue-500',   btn: 'bg-primary hover:bg-primary/90 text-primary-foreground' },
  }[variant];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            className={`relative rounded-2xl shadow-2xl w-full max-w-sm border-2 ${colors.bg} ${colors.border} p-6`}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colors.bg} border-2 ${colors.border}`}>
                <AlertTriangle className={`w-5 h-5 ${colors.icon}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-foreground leading-tight">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{displayMessage}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={onCancel}
              >
                {cancelLabel}
              </Button>
              <Button
                className={`flex-1 rounded-xl ${colors.btn}`}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
