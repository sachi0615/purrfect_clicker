import { Cat as CatIcon, Coins, Gauge, Hand, Hash, Map } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { fmt } from '../lib/format';
import { cn } from '../lib/utils';
import { useRunStore } from '../store/run';

const PILL_META = [
  { key: 'happy', icon: Coins },
  { key: 'clickPower', icon: Hand },
  { key: 'pps', icon: Gauge },
  { key: 'totalPets', icon: CatIcon },
  { key: 'stage', icon: Map },
  { key: 'seed', icon: Hash },
] as const;

export function TopPills() {
  const { t } = useTranslation();
  const run = useRunStore((state) => state.run);
  if (!run) {
    return null;
  }

  const currentStage = Math.min(run.stageIndex + 1, run.stages.length);
  const display: Record<string, string> = {
    happy: fmt(run.happy),
    clickPower: fmt(run.clickPower * (run.tempMods.clickMult ?? 1)),
    pps: fmt(run.pps * (run.tempMods.ppsMult ?? 1)),
    totalPets: fmt(run.totalPets),
    stage: `${currentStage}/${run.stages.length}`,
    seed: String(run.seed),
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-3">
        {PILL_META.map((pill) => {
          const Icon = pill.icon;
          return (
            <article
              key={pill.key}
              className={cn(
                'flex min-w-[150px] flex-col gap-2 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-md backdrop-blur',
              )}
            >
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-plum-500 md:text-sm">
                <Icon className="h-4 w-4" aria-hidden />
                {t(`pills.${pill.key}`)}
              </div>
              <div className="text-lg font-semibold text-plum-900 md:text-xl">
                {display[pill.key]}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
