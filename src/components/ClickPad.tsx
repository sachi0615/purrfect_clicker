import { useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Cat } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Section } from './Section';
import { useRunStore } from '../store/run';

export function ClickPad() {
  const { t } = useTranslation();
  const run = useRunStore((state) => state.run);
  const click = useRunStore((state) => state.click);
  const floatingTexts = useRunStore((state) => state.floatingTexts);

  const handleClick = useCallback(() => {
    click();
  }, [click]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        click();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [click]);

  if (!run) {
    return null;
  }

  return (
    <Section
      title={t('action.pet')}
      description={
        <span className="flex flex-col gap-1 text-sm text-plum-600 md:text-base">
          <span>{t('clickPad.hint')}</span>
          <span className="text-xs text-plum-500 md:text-sm">{t('clickPad.comboHint')}</span>
        </span>
      }
      icon={<Cat className="h-5 w-5" aria-hidden />}
      className="relative flex min-h-0 flex-1 flex-col"
      headerClassName="mb-6"
    >
      <div className="relative flex flex-1 items-center justify-center">
        <button
          type="button"
          onClick={handleClick}
          className="relative inline-flex h-44 w-44 items-center justify-center rounded-full bg-gradient-to-br from-plum-300 via-plum-400 to-plum-500 text-xl font-bold text-white shadow-xl transition hover:opacity-90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-300 md:h-52 md:w-52 md:text-2xl"
          aria-label={t('action.pet')}
        >
          {t('action.pet')}
        </button>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <AnimatePresence>
            {floatingTexts.map((text) => (
              <motion.span
                key={text.id}
                initial={{ opacity: 0, scale: 0.9, y: 12 }}
                animate={{ opacity: Math.max(0, Math.min(1, text.life)), scale: 1, y: -18 }}
                exit={{ opacity: 0, scale: 0.95, y: -30 }}
                transition={{ duration: 0.4 }}
                className="absolute text-sm font-semibold text-plum-700 md:text-base"
                style={{
                  left: `calc(50% + ${text.offsetX}px)`,
                  top: `calc(50% + ${text.offsetY}px)`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {text.value}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </Section>
  );
}
