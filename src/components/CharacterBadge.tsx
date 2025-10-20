import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Target, Zap, Shield, Dice6, type LucideIcon } from 'lucide-react';

import { cn } from '../lib/utils';
import { useCharsStore } from '../store/chars';
import { useRunStore } from '../store/run';

const ICONS: Record<string, LucideIcon> = {
  Sparkles,
  Target,
  Zap,
  Shield,
  Dice6,
};

export function CharacterBadge() {
  const { t } = useTranslation();
  const { selected, specs, requestSelection } = useCharsStore((state) => ({
    selected: state.selected,
    specs: state.specs,
    requestSelection: state.requestSelection,
  }));
  const run = useRunStore((state) => state.run);
  const runAlive = Boolean(run?.alive);

  const spec = useMemo(() => {
    return selected ? specs[selected] : undefined;
  }, [selected, specs]);

  const label = spec ? t(spec.nameKey) : t('char.badge.select');
  const description = spec ? t(spec.descKey) : t('char.badge.helper');
  const Icon = resolveIcon(spec?.icon);

  const gradient = spec?.color ?? 'from-plum-400 to-plum-600';

  const handleClick = () => {
    requestSelection();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex items-center gap-3 rounded-full border border-white/60 bg-gradient-to-br px-4 py-2 text-left text-white shadow transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400 hover:shadow-md',
        gradient,
      )}
      aria-label={spec ? t('char.badge.change', { name: label }) : t('char.badge.select')}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-[0.65rem] text-white/80">
          {runAlive ? t('char.badge.viewOnly') : description}
        </span>
      </span>
    </button>
  );
}

function resolveIcon(iconName?: string): LucideIcon {
  if (iconName && ICONS[iconName]) {
    return ICONS[iconName];
  }
  return Sparkles;
}
