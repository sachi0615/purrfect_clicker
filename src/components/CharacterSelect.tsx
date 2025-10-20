import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Target, Zap, Shield, Dice6, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

export function CharacterSelect() {
  const { t } = useTranslation();
  const { specs, modalOpen, selected, select, closeModal } = useCharsStore(
    (state) => ({
      specs: state.specs,
      modalOpen: state.modalOpen,
      selected: state.selected,
      select: state.select,
      closeModal: state.closeModal,
    }),
  );
  const run = useRunStore((state) => state.run);
  const runAlive = Boolean(run?.alive);

  const characters = useMemo(() => Object.values(specs), [specs]);

  const [highlighted, setHighlighted] = useState(() => {
    if (selected) {
      const index = characters.findIndex((spec) => spec.id === selected);
      if (index >= 0) {
        return index;
      }
    }
    return 0;
  });

  useEffect(() => {
    if (!modalOpen) {
      return;
    }
    if (selected) {
      const index = characters.findIndex((spec) => spec.id === selected);
      setHighlighted(index >= 0 ? index : 0);
    } else {
      setHighlighted(0);
    }
  }, [modalOpen, characters, selected]);

  const highlightedSpec = characters[highlighted];
  const canChangeCharacter = !runAlive || !run;
  const isCurrentSelection = highlightedSpec ? highlightedSpec.id === selected : false;
  const canConfirm = Boolean(highlightedSpec) && (canChangeCharacter || isCurrentSelection);

  const handleConfirm = useCallback(() => {
    if (!highlightedSpec) {
      return;
    }
    if (!canChangeCharacter && !isCurrentSelection) {
      return;
    }
    select(highlightedSpec.id);
  }, [highlightedSpec, canChangeCharacter, isCurrentSelection, select]);

  const handleClose = useCallback(() => {
    if (!selected) {
      return;
    }
    closeModal();
  }, [closeModal, selected]);

  useEffect(() => {
    if (!modalOpen || characters.length === 0) {
      return;
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        setHighlighted((prev) => (prev + 1) % characters.length);
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlighted((prev) => (prev - 1 + characters.length) % characters.length);
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        if (canConfirm) {
          handleConfirm();
        }
        return;
      }
      if (event.key === 'Escape' && selected) {
        event.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [modalOpen, characters.length, canConfirm, handleConfirm, handleClose, selected]);

  if (!modalOpen) {
    return null;
  }

  if (characters.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {modalOpen ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-plum-900/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="mx-4 w-full max-w-5xl rounded-3xl border border-white/40 bg-white/95 p-6 shadow-2xl md:p-8"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="character-select-title"
          >
            <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2
                  id="character-select-title"
                  className="text-2xl font-semibold text-plum-900 md:text-3xl"
                >
                  {t('char.select.title')}
                </h2>
                <p className="text-sm text-plum-600 md:text-base">
                  {t('char.select.helper')}
                </p>
              </div>
              <div className="text-xs text-plum-400 md:text-sm">
                {t('char.select.keyboardHint')}
              </div>
            </header>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {characters.map((character, index) => {
                const Icon = resolveIcon(character.icon);
                const isHighlighted = index === highlighted;
                return (
                  <button
                    key={character.id}
                    type="button"
                    className={cn(
                      'group relative flex h-full flex-col rounded-2xl border border-white/60 bg-white/80 p-4 text-left shadow transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400',
                      isHighlighted ? 'ring-2 ring-plum-400 shadow-lg' : 'hover:shadow-md',
                    )}
                    onClick={() => setHighlighted(index)}
                    aria-pressed={isHighlighted}
                  >
                    <div
                      className={cn(
                        'mb-3 flex items-center gap-3 rounded-xl bg-gradient-to-br p-3 text-white shadow-inner',
                        character.color ?? 'from-plum-400 to-plum-600',
                      )}
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                        <Icon className="h-6 w-6" aria-hidden />
                      </span>
                      <div>
                        <p className="text-lg font-semibold">
                          {t(character.nameKey)}
                        </p>
                        <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium uppercase tracking-wide">
                          {t(`char.difficulty.${character.difficulty ?? 'normal'}`)}
                        </span>
                      </div>
                    </div>
                    <p className="mb-3 text-sm text-plum-600">{t(character.descKey)}</p>
                    <div className="space-y-3 text-sm text-plum-700">
                      {character.passives.length > 0 ? (
                        <section>
                          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-plum-500">
                            {t('char.passives')}
                          </h3>
                          <ul className="space-y-1">
                            {character.passives.map((passive) => (
                              <li key={passive.id}>
                                <p className="font-semibold text-plum-800">
                                  {t(passive.nameKey)}
                                </p>
                                <p className="text-xs text-plum-500">
                                  {t(passive.descKey)}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ) : null}
                      {character.uniqueSkills && character.uniqueSkills.length > 0 ? (
                        <section>
                          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-plum-500">
                            {t('char.uniqueSkill')}
                          </h3>
                          <ul className="space-y-1">
                            {character.uniqueSkills.map((skill) => (
                              <li key={skill.id}>
                                <p className="font-semibold text-plum-800">
                                  {t(skill.nameKey)}
                                </p>
                                <p className="text-xs text-plum-500">
                                  {t(skill.descKey)}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ) : null}
                    </div>
                    {selected === character.id ? (
                      <span className="absolute top-4 right-4 rounded-full bg-plum-500/90 px-3 py-1 text-xs font-semibold text-white shadow">
                        {t('char.selected')}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <footer className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-plum-500">
                {!canChangeCharacter && !isCurrentSelection
                  ? t('char.changeDisabled')
                  : t('char.select.prompt')}
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={!selected}
                  className={cn(
                    'rounded-full border border-plum-200 px-4 py-2 text-sm font-semibold text-plum-600 transition hover:border-plum-300 hover:text-plum-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-300',
                    !selected && 'cursor-not-allowed opacity-60',
                  )}
                >
                  {t('action.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!canConfirm}
                  className={cn(
                    'rounded-full px-5 py-2 text-sm font-semibold text-white shadow transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-400',
                    canConfirm
                      ? 'bg-plum-500 hover:bg-plum-600'
                      : 'cursor-not-allowed bg-plum-300 opacity-70',
                  )}
                >
                  {isCurrentSelection ? t('char.selected') : t('char.start')}
                </button>
              </div>
            </footer>
          </motion.div>
        </motion.div>
      ) : (
        <Fragment />
      )}
    </AnimatePresence>
  );
}

function resolveIcon(iconName?: string): LucideIcon {
  if (iconName && ICONS[iconName]) {
    return ICONS[iconName];
  }
  return Sparkles;
}
