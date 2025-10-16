import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react';

import { cn } from '../lib/utils';
import { useToastStore } from '../store/toast';

const ICONS = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
} as const;

export function ToastStack() {
  const { t } = useTranslation();
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-6 z-50 flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type] ?? ICONS.info;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.18 }}
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur',
                'focus-within:ring-2 focus-within:ring-plum-300',
                toast.type === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
                toast.type === 'info' && 'border-plum-200 bg-plum-50 text-plum-800',
                toast.type === 'warning' && 'border-amber-200 bg-amber-50 text-amber-800',
              )}
              role="status"
              aria-live="polite"
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <p className="flex-1 text-sm">{toast.message}</p>
              <button
                type="button"
                aria-label={t('action.close')}
                className="rounded-full px-2 py-1 text-xs font-semibold text-current opacity-70 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400"
                onClick={() => dismiss(toast.id)}
              >
                ×
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
