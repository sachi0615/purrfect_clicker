import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Coins,
  Flame,
  Hourglass,
  Sparkles,
  Target,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';

import { Section } from './Section';
import { SkillTooltip } from './SkillTooltip';
import { cn } from '../lib/utils';
import {
  getBaseSkillSpec,
  isBaseSkill,
  syncSkillRunModifiers,
  type SkillId,
  type SkillSpec,
  useSkillsStore,
} from '../store/skills';
import { useRunStore } from '../store/run';

type SkillBinding = {
  id: SkillId;
  hotkey?: string;
};

type SkillView = {
  binding: SkillBinding;
  spec: SkillSpec;
  baseSpec: SkillSpec;
  statusRunning: boolean;
  statusCooling: boolean;
  remain: { cd: number; dur: number };
  progress: number;
  statusKey: string;
  runTotalDuration: number;
  runTotalCooldown: number;
};

const DEFAULT_HOTKEYS: Partial<Record<SkillId, string>> = {
  cheerful: 'Q',
  critBoost: 'W',
  clickRush: 'E',
  overdrive: 'R',
  timeWarp: 'T',
  spiritSwarm: 'Y',
  doubleOrNothing: 'F',
};

const ICONS: Record<string, LucideIcon> = {
  Sparkles,
  Target,
  Zap,
  Flame,
  Hourglass,
  Coins,
};

const CIRCLE_RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

export function SkillBar() {
  const { t } = useTranslation();
  const runTempMods = useRunStore((state) => state.run?.tempMods);

  useEffect(() => {
    syncSkillRunModifiers(runTempMods);
  }, [runTempMods]);

  const {
    specs,
    trigger,
    runModifiers,
    isRunning,
    isCooling,
    remaining,
    skillIds,
  } = useSkillsStore(
    (state) => ({
      specs: state.specs,
      trigger: state.trigger,
      runModifiers: state.runModifiers,
      isRunning: state.isRunning,
      isCooling: state.isCooling,
      remaining: state.remaining,
      skillIds: state.skillIds,
    }),
    shallow,
  );

  const bindings = useMemo<SkillBinding[]>(
    () => skillIds.map((id) => ({ id, hotkey: DEFAULT_HOTKEYS[id] })),
    [skillIds],
  );

  const skills = useMemo(() => {
    return bindings
      .map<SkillView | null>((binding) => {
        const spec = specs[binding.id];
        if (!spec) {
          return null;
        }
        const baseSpec = isBaseSkill(binding.id) ? getBaseSkillSpec(binding.id) : spec;
        const runTotalDuration = Math.max(0.5, spec.baseDuration + runModifiers.durationBonus);
        const runTotalCooldown = Math.max(0.5, spec.baseCd * runModifiers.cooldownMult);
        const statusRunning = isRunning(binding.id);
        const statusCooling = isCooling(binding.id);
        const remain = remaining(binding.id);
        const progress = computeProgress({
          isRunning: statusRunning,
          isCooling: statusCooling,
          remaining: remain,
          totalDuration: runTotalDuration,
          totalCooldown: runTotalCooldown,
        });
        const statusKey = statusRunning ? 'skill.active' : statusCooling ? 'skill.cooldown' : 'skill.ready';

        return {
          binding,
          spec,
          baseSpec,
          statusRunning,
          statusCooling,
          remain,
          progress,
          statusKey,
          runTotalDuration,
          runTotalCooldown,
        };
      })
      .filter((entry): entry is SkillView => entry !== null);
  }, [bindings, isCooling, isRunning, remaining, runModifiers.cooldownMult, runModifiers.durationBonus, specs]);

  useEffect(() => {
    const map = new Map<string, SkillId>();
    bindings.forEach(({ id, hotkey }) => {
      if (!hotkey) {
        return;
      }
      map.set(hotkey.toUpperCase(), id);
    });

    const handleKey = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }
      const id = map.get(event.key.toUpperCase());
      if (!id) {
        return;
      }
      event.preventDefault();
      trigger(id);
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [bindings, trigger]);

  const activeNames = skills
    .filter((entry) => entry.statusRunning)
    .map((entry) => t(entry.spec.nameKey));

  return (
    <Section
      title={t('skill.bar.title')}
      description={
        <span className="text-xs text-plum-500 md:text-sm">{t('skill.bar.helper')}</span>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {skills.map((entry) => (
          <SkillButton
            key={entry.binding.id}
            entry={entry}
            trigger={trigger}
            t={t}
          />
        ))}
      </div>
      <AnimatePresence>
        {activeNames.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className="rounded-xl border border-plum-100 bg-plum-50/70 px-3 py-2 text-xs text-plum-600 shadow-inner md:text-sm"
          >
            {t('skill.bar.activeList', {
              count: activeNames.length,
              names: activeNames.join(t('skill.bar.nameSeparator')),
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Section>
  );
}

type SkillEntry = {
  binding: SkillBinding;
  spec: SkillSpec;
  baseSpec: SkillSpec;
  statusRunning: boolean;
  statusCooling: boolean;
  remain: { cd: number; dur: number };
  progress: number;
  statusKey: string;
  runTotalDuration: number;
  runTotalCooldown: number;
};

type SkillButtonProps = {
  entry: SkillEntry;
  trigger: (id: SkillId) => void;
  t: (key: string, options?: any) => string;
};

function SkillButton({ entry, trigger, t }: SkillButtonProps) {
  const Icon = resolveIcon(entry.spec.icon);

  const label = t(entry.spec.nameKey);
  const statusLabel = t(entry.statusKey);
  const ariaLabel = entry.binding.hotkey
    ? t('skill.bar.ariaWithHotkey', {
        name: label,
        status: statusLabel,
        hotkey: entry.binding.hotkey,
      })
    : t('skill.bar.aria', { name: label, status: statusLabel });

  const seconds = entry.statusRunning
    ? entry.remain.dur
    : entry.statusCooling
    ? entry.remain.cd
    : entry.runTotalDuration;

  const displaySeconds = Math.ceil(seconds);
  const arcOffset = CIRCUMFERENCE * (1 - clamp01(entry.progress));

  const handleClick = () => {
    trigger(entry.binding.id);
  };

  return (
    <SkillTooltip
      spec={entry.spec}
      baseSpec={entry.baseSpec}
      totalDuration={entry.runTotalDuration}
      totalCooldown={entry.runTotalCooldown}
      hotkey={entry.binding.hotkey}
      statusKey={entry.statusKey}
      remaining={entry.remain}
    >
      <motion.button
        type="button"
        onClick={handleClick}
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.02 }}
        className={cn(
          'relative flex flex-col items-center gap-2 rounded-2xl border bg-white/80 p-3 text-center shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400/70',
          entry.statusRunning
            ? 'border-emerald-200 bg-emerald-50/80 text-emerald-700'
            : entry.statusCooling
            ? 'border-plum-200 text-plum-600 opacity-80'
            : 'border-plum-100 text-plum-700 hover:border-plum-200',
        )}
        aria-label={ariaLabel}
        title={`${label} (${statusLabel})`}
        disabled={entry.statusCooling || entry.statusRunning}
      >
        <div className="relative flex h-24 w-24 items-center justify-center">
          <svg className="h-24 w-24 -rotate-90" viewBox="0 0 120 120" aria-hidden>
            <circle
              cx="60"
              cy="60"
              r={CIRCLE_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              opacity={0.15}
            />
            <motion.circle
              cx="60"
              cy="60"
              r={CIRCLE_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={arcOffset}
              strokeLinecap="round"
              initial={false}
              animate={{ strokeDashoffset: arcOffset }}
              transition={{ duration: 0.2 }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center">
            <Icon className="h-10 w-10" aria-hidden />
          </span>
          {entry.binding.hotkey ? (
            <span className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-plum-500 shadow">
              {entry.binding.hotkey}
            </span>
          ) : null}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-xs text-plum-500">
            {statusLabel}
            {displaySeconds > 0 ? ` · ${displaySeconds}${t('skill.tooltip.secondsSuffix')}` : ''}
          </p>
        </div>
      </motion.button>
    </SkillTooltip>
  );
}

function resolveIcon(iconName?: string): LucideIcon {
  if (iconName && ICONS[iconName]) {
    return ICONS[iconName];
  }
  return Sparkles;
}

function computeProgress({
  isRunning,
  isCooling,
  remaining,
  totalDuration,
  totalCooldown,
}: {
  isRunning: boolean;
  isCooling: boolean;
  remaining: { cd: number; dur: number };
  totalDuration: number;
  totalCooldown: number;
}): number {
  if (isRunning) {
    if (totalDuration <= 0) {
      return 1;
    }
    return clamp01(remaining.dur / totalDuration);
  }
  if (isCooling) {
    if (totalCooldown <= 0) {
      return 1;
    }
    const fraction = 1 - remaining.cd / totalCooldown;
    return clamp01(fraction);
  }
  return 1;
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}
