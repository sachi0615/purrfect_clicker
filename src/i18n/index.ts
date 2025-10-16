import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ja from './locales/ja.json';

export const DEFAULT_LANGUAGE = 'ja';
const STORAGE_KEY = 'purrfect-lang';

const storedLang =
  typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ja: { translation: ja },
      en: { translation: en },
    },
    lng: storedLang ?? DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  })
  .catch((error) => {
    console.error('Failed to initialise i18next', error);
  });

export function setLanguage(lang: string) {
  i18n.changeLanguage(lang);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, lang);
  }
}

export function getStorageLanguage(): string {
  return storedLang ?? DEFAULT_LANGUAGE;
}

export { STORAGE_KEY as LANGUAGE_STORAGE_KEY };

export default i18n;
