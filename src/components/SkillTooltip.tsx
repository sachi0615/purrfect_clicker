import {
  cloneElement,
  type ReactElement,
  type ReactNode,
  useMemo,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import type { SkillSpec } from '../store/skills';
import { cn } from '../lib/utils';

type SkillTooltipProps = {
  spec: SkillSpec;
  baseSpec: SkillSpec;
  totalDuration: number;
  totalCooldown: number;
  hotkey?: string;
  statusKey: string;
  remaining: { cd: number; dur: number };
  children: ReactElement;
};

function compose<T extends (...args: any[]) => void>(
  original: T | undefined,
  next: T,
): T {
  return (((...args: Parameters<T>) => {
    original?.(...args);
    next(...args);
  }) as T);
}

function formatSeconds(seconds: number): string {
  return seconds.toFixed(seconds >= 10 ? 0 : 1);
}

function formatDelta(seconds: number, t: (key: string, options?: any) => string): string {
  if (Math.abs(seconds) < 0.05) {
    return t('skill.tooltip.adjustment.none');
  }
  const sign = seconds > 0 ? '+' : '';
  return `${sign}${formatSeconds(seconds)}${t('skill.tooltip.secondsSuffix')}`;
}

function effectSummary(spec: SkillSpec, t: (key: string, options?: any) => string): string[] {
  const { effect } = spec;
  const list: string[] = [];
  if (typeof effect.clickMult === 'number') {
    list.push(
      t('skill.effect.clickMult', {
        value: effect.clickMult.toFixed(2),
      }),
    );
  }
  if (typeof effect.ppsMult === 'number') {
    list.push(
      t('skill.effect.ppsMult', {
        value: effect.ppsMult.toFixed(2),
      }),
    );
  }
  if (typeof effect.critChancePlus === 'number') {
    list.push(
      t('skill.effect.critChancePlus', {
        value: Math.round(effect.critChancePlus * 100),
      }),
    );
  }
  if (typeof effect.critMultPlus === 'number') {
    list.push(
      t('skill.effect.critMultPlus', {
        value: effect.critMultPlus.toFixed(2),
      }),
    );
  }
  if (typeof effect.tickRateMult === 'number' && effect.tickRateMult > 0) {
    const speed = 1 / effect.tickRateMult;
    list.push(
      t('skill.effect.tickRateMult', {
        value: speed.toFixed(2),
      }),
    );
  }
  return list;
}

export function SkillTooltip({
  spec,
  baseSpec,
  totalDuration,
  totalCooldown,
  hotkey,
  statusKey,
  remaining,
  children,
}: SkillTooltipProps) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const open = hovered || focused;

  const content = useMemo(() => {
    const metaDurationDelta = spec.baseDuration - baseSpec.baseDuration;
    const runDurationDelta = totalDuration - spec.baseDuration;
    const metaCooldownDelta = spec.baseCd - baseSpec.baseCd;
    const runCooldownDelta = totalCooldown - spec.baseCd;
    const effects = effectSummary(spec, t);

    return {
      metaDurationDelta,
      runDurationDelta,
      metaCooldownDelta,
      runCooldownDelta,
      effects,
    };
  }, [baseSpec.baseCd, baseSpec.baseDuration, spec, t, totalCooldown, totalDuration]);

  const wrappedChild = cloneElement(children, {
    onMouseEnter: compose(children.props.onMouseEnter, () => setHovered(true)),
    onMouseLeave: compose(children.props.onMouseLeave, () => setHovered(false)),
    onFocus: compose(children.props.onFocus, () => setFocused(true)),
    onBlur: compose(children.props.onBlur, () => setFocused(false)),
  });

  const statusLabel = t(statusKey);
  const durationLabel = `${formatSeconds(totalDuration)}${t('skill.tooltip.secondsSuffix')}`;
  const cooldownLabel = `${formatSeconds(totalCooldown)}${t('skill.tooltip.secondsSuffix')}`;
  const remainingSeconds =
    statusKey === 'skill.active'
      ? remaining.dur
      : statusKey === 'skill.cooldown'
      ? remaining.cd
      : 0;

  return (
    <div className="relative inline-flex">
      {wrappedChild}
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            role="tooltip"
            className={cn(
              'pointer-events-none absolute bottom-full left-1/2 z-30 mb-3 w-56 -translate-x-1/2',
            )}
            aria-hidden={!open}
          >
            <div className="rounded-2xl border border-white/80 bg-white/95 p-4 text-xs text-plum-700 shadow-xl backdrop-blur">
              <div className="mb-2">
                <p className="text-sm font-semibold text-plum-900">
                  {t(spec.nameKey)}
                </p>
                <p className="text-xs text-plum-600">{t(spec.descKey)}</p>
              </div>
              <dl className="space-y-1">
                <Row
                  label={t('skill.tooltip.status')}
                  value={`${statusLabel}${
                    remainingSeconds > 0
                      ? ` · ${formatSeconds(remainingSeconds)}${t('skill.tooltip.secondsSuffix')}`
                      : ''
                  }`}
                />
                <Row label={t('skill.tooltip.duration')} value={durationLabel} />
                <Adjustments
                  metaDelta={content.metaDurationDelta}
                  runDelta={content.runDurationDelta}
                  t={t}
                />
                <Row label={t('skill.tooltip.cooldown')} value={cooldownLabel} />
                <Adjustments
                  metaDelta={content.metaCooldownDelta}
                  runDelta={content.runCooldownDelta}
                  t={t}
                  inverse
                />
                {hotkey ? <Row label={t('skill.tooltip.hotkey')} value={hotkey.toUpperCase()} /> : null}
              </dl>
              {content.effects.length > 0 ? (
                <div className="mt-3 border-t border-plum-100 pt-2">
                  <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wide text-plum-500">
                    {t('skill.tooltip.effects')}
                  </p>
                  <ul className="space-y-1 text-xs">
                    {content.effects.map((line) => (
                      <li key={line} className="flex items-start gap-1">
                        <span aria-hidden className="mt-0.5 h-1.5 w-1.5 rounded-full bg-plum-300" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

type RowProps = {
  label: ReactNode;
  value: ReactNode;
};

function Row({ label, value }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[0.7rem] font-medium uppercase tracking-wide text-plum-500">{label}</dt>
      <dd className="text-right text-xs font-semibold text-plum-700">{value}</dd>
    </div>
  );
}

type AdjustmentsProps = {
  metaDelta: number;
  runDelta: number;
  inverse?: boolean;
  t: (key: string, options?: any) => string;
};

function Adjustments({ metaDelta, runDelta, inverse = false, t }: AdjustmentsProps) {
  const hasMeta = Math.abs(metaDelta) >= 0.05;
  const hasRun = Math.abs(runDelta) >= 0.05;

  if (!hasMeta && !hasRun) {
    return null;
  }

  const format = (value: number) =>
    inverse ? formatDelta(value, t) : formatDelta(value, t);

  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[0.7rem] font-medium uppercase tracking-wide text-plum-400">
        {t('skill.tooltip.adjustment.label')}
      </dt>
      <dd className="text-right text-[0.7rem] text-plum-600">
        {[
          hasMeta ? `${t('skill.tooltip.adjustment.meta')} ${format(metaDelta)}` : null,
          hasRun ? `${t('skill.tooltip.adjustment.run')} ${format(runDelta)}` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </dd>
    </div>
  );
}
