import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Cat, Cog, Save } from 'lucide-react';

import { pushToast } from '../store/toast';
import { LanguageSwitch } from './LanguageSwitch';

export function TopBar() {
  const { t } = useTranslation();

  const handleSave = useCallback(() => {
    pushToast(t('toast.saved'), 'success');
  }, [t]);

  const handleSettings = useCallback(() => {
    pushToast(t('settings.comingSoon'), 'info');
  }, [t]);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-lg backdrop-blur md:flex-row md:items-center md:justify-between md:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-plum-100 p-2 text-plum-600 shadow-inner">
          <Cat className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-plum-900 md:text-3xl">
            {t('app.title')}
          </h1>
          <p className="text-sm text-plum-600 md:text-base">{t('app.subtitle')}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 md:gap-4">
        <LanguageSwitch />
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 rounded-full bg-plum-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-300"
          aria-label={t('action.save')}
        >
          <Save className="h-4 w-4" aria-hidden />
          {t('action.save')}
        </button>
        <button
          type="button"
          onClick={handleSettings}
          className="flex items-center gap-2 rounded-full border border-plum-200 bg-white/90 px-4 py-2 text-sm font-semibold text-plum-600 shadow transition hover:border-plum-300 hover:text-plum-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-300"
          aria-label={t('nav.openSettings')}
        >
          <Cog className="h-4 w-4" aria-hidden />
          {t('nav.settings')}
        </button>
      </div>
    </div>
  );
}
