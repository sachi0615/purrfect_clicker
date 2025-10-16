import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

import i18n, { DEFAULT_LANGUAGE, setLanguage } from '../i18n';
import { cn } from '../lib/utils';

const LANGS: Array<{ code: string; labelKey: string }> = [
  { code: 'ja', labelKey: 'lang.ja' },
  { code: 'en', labelKey: 'lang.en' },
];

export function LanguageSwitch() {
  const { t } = useTranslation();

  const handleChange = useCallback(
    (lang: string) => {
      setLanguage(lang);
    },
    [],
  );

  const active = i18n.language || DEFAULT_LANGUAGE;

  return (
    <div className="flex items-center gap-2 rounded-full border border-plum-200 bg-white/80 px-3 py-1 shadow-sm">
      <Globe aria-hidden className="h-4 w-4 text-plum-500" />
      <span className="sr-only">{t('nav.language')}</span>
      <div className="flex gap-1">
        {LANGS.map((lang) => {
          const isActive = active.startsWith(lang.code);
          return (
            <button
              key={lang.code}
              type="button"
              aria-label={t('nav.language') + ': ' + t(lang.labelKey)}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400',
                isActive
                  ? 'bg-plum-500 text-white shadow'
                  : 'text-plum-600 hover:bg-plum-100',
              )}
              onClick={() => handleChange(lang.code)}
            >
              {t(lang.labelKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
