import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers3 } from 'lucide-react';

import { BUILD_ARCHETYPE_INFO, useBuildStore } from '../store/build';

export function BuildBadge() {
  const { t } = useTranslation();
  const activeArchetype = useBuildStore((state) => state.activeArchetype);
  const acquired = useBuildStore((state) => state.acquired);

  const aggregate = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        count: number;
        nameKey: string;
        descKey: string;
        archetype: keyof typeof BUILD_ARCHETYPE_INFO;
        tier: 1 | 2 | 3;
      }
    >();
    acquired.forEach((bonus) => {
      const entry = map.get(bonus.id);
      if (entry) {
        entry.count += 1;
      } else {
        map.set(bonus.id, {
          id: bonus.id,
          count: 1,
          nameKey: bonus.nameKey,
          descKey: bonus.descKey,
          archetype: bonus.archetype,
          tier: bonus.tier,
        });
      }
    });
    return Array.from(map.values());
  }, [acquired]);

  const activeInfo = activeArchetype ? BUILD_ARCHETYPE_INFO[activeArchetype] : null;

  const countBadgeClass = activeInfo
    ? 'bg-white/20 text-white/90'
    : 'bg-plum-100 text-plum-600';

  return (
    <div className="relative group">
      <div
        className={[
          'flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-300',
          activeInfo
            ? ['bg-gradient-to-r text-white', activeInfo.gradientFrom, activeInfo.gradientTo].join(
                ' ',
              )
            : 'border-plum-200 bg-white text-plum-600',
        ].join(' ')}
      >
        <Layers3 className="h-4 w-4" aria-hidden />
        {activeInfo ? t(activeInfo.titleKey) : t('build.badge.none')}
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${countBadgeClass}`}>
          {acquired.length}
        </span>
      </div>
      {activeInfo && aggregate.length > 0 ? (
        <div className="invisible absolute right-0 z-50 mt-2 w-64 translate-y-2 rounded-2xl border border-plum-100 bg-white/95 p-4 text-left text-sm text-plum-600 shadow-xl opacity-0 transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-plum-400">
            {t('build.badge.tooltipTitle')}
          </p>
          <ul className="mt-3 flex max-h-64 flex-col gap-2 overflow-y-auto pr-1 text-sm">
            {aggregate.map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl border border-plum-100 bg-plum-50/60 px-3 py-2 text-plum-600 shadow-sm"
              >
                <p className="flex items-center justify-between text-sm font-semibold text-plum-800">
                  <span>{t(entry.nameKey)}</span>
                  <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs font-bold text-plum-500">
                    ×{entry.count}
                  </span>
                </p>
                <p className="mt-1 text-xs text-plum-500">{t(entry.descKey)}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
