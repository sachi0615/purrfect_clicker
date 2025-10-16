import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { SKILL_IDS, useSkillsStore } from '../store/skills';
import { pushToast } from '../store/toast';

export function SkillToasts() {
  const { t } = useTranslation();
  const specs = useSkillsStore((state) => state.specs);
  const runtimes = useSkillsStore((state) => state.rt);
  const prev = useRef(runtimes);
  const ready = useRef(false);

  useEffect(() => {
    if (!ready.current) {
      ready.current = true;
      prev.current = runtimes;
      return;
    }

    const now = Date.now();
    const previous = prev.current;

    SKILL_IDS.forEach((id) => {
      const spec = specs[id];
      if (!spec) {
        return;
      }
      const prevRuntime = previous[id];
      const nextRuntime = runtimes[id];
      const prevActive = isRuntimeActive(prevRuntime, now);
      const nextActive = isRuntimeActive(nextRuntime, now);

      if (!prevActive && nextActive) {
        pushToast(
          t('skill.toast.activated', { name: t(spec.nameKey) }),
          'success',
          2400,
        );
      } else if (prevActive && !nextActive) {
        pushToast(
          t('skill.toast.expired', { name: t(spec.nameKey) }),
          'warning',
          2600,
        );
      }
    });

    prev.current = runtimes;
  }, [runtimes, specs, t]);

  return null;
}

function isRuntimeActive(
  runtime: { runningUntil: number } | undefined,
  now: number,
): boolean {
  if (!runtime) {
    return false;
  }
  return runtime.runningUntil > now;
}
