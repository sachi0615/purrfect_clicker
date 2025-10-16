import { useCallback } from 'react';

import { useRunStore } from '../store/run';

export function ClickPad() {
  const run = useRunStore((state) => state.run);
  const click = useRunStore((state) => state.click);
  const floatingTexts = useRunStore((state) => state.floatingTexts);

  const handleClick = useCallback(() => {
    click();
  }, [click]);

  if (!run) {
    return null;
  }

  return (
    <div className="relative flex flex-1 flex-col gap-3 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur">
      <h2 className="text-lg font-semibold text-plum-800">Pet the Cat!</h2>
      <div className="relative flex flex-1 items-center justify-center">
        <button
          type="button"
          onClick={handleClick}
          className="relative h-48 w-48 rounded-full bg-gradient-to-br from-plum-300 to-plum-500 text-xl font-bold text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
        >
          Click!
        </button>

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {floatingTexts.map((text) => (
            <span
              key={text.id}
              className="absolute text-sm font-semibold text-plum-700 transition-all"
              style={{
                left: `calc(50% + ${text.offsetX}px)`,
                top: `calc(50% + ${text.offsetY}px)`,
                opacity: Math.max(0, Math.min(1, text.life)),
                transform: `translate(-50%, -50%)`,
              }}
            >
              {text.value}
            </span>
          ))}
        </div>
      </div>
      <p className="text-sm text-plum-600">
        Click to earn Happy. Clear each stage goal to earn a choice of reward cards.
      </p>
    </div>
  );
}
