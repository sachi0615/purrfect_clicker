import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Section } from './Section';
import { useMetaStore } from '../store/meta';

export function MetaPanel() {
  const { t } = useTranslation();
  const meta = useMetaStore((state) => state.meta);

  return (
    <Section
      title={t('meta.title')}
      description={t('meta.helper')}
      icon={<Sparkles className="h-5 w-5 text-plum-500" aria-hidden />}
    >
      <div className="rounded-2xl border border-plum-100 bg-white/80 p-4 text-center text-2xl font-bold text-plum-700 shadow-sm md:text-3xl">
        {meta.catSouls}
      </div>
    </Section>
  );
}
