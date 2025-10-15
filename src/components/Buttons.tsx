import { useRef } from 'react';

import { useGameStore } from '../store';
import { clamp } from '../util';
import FX from './FX';

const Buttons = () => {
  const click = useGameStore((state) => state.click);
  const activateSkill = useGameStore((state) => state.activateSkill);
  const skill = useGameStore((state) => state.skill);
  const save = useGameStore((state) => state.save);
  const reset = useGameStore((state) => state.reset);
  const combo = useGameStore((state) => state.combo);
  const petPower = useGameStore((state) => state.petPower);

  const areaRef = useRef<HTMLDivElement>(null);

  const handlePet = (event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) {
      click(50, 50);
      return;
    }
    const xPercent = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const yPercent = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
    click(xPercent, yPercent);
  };

  const comboPercent = Math.round(combo.bonus * 100);

  const handleReset = () => {
    if (window.confirm('本当に初期化しますか？')) {
      reset();
    }
  };

  return (
    <div className="controls">
      <div className="pet-area" ref={areaRef}>
        <button
          className="pet-button"
          onPointerDown={handlePet}
          onContextMenu={(event) => event.preventDefault()}
        >
          なでる！
          <span className="pet-subtext">
            {`なで力 ${petPower.toFixed(1)}${comboPercent > 0 ? ` / コンボ +${comboPercent}%` : ''}`}
          </span>
        </button>
        <FX />
      </div>
      <div className="button-row">
        <button
          className="secondary-button"
          onClick={activateSkill}
          disabled={skill.active || skill.cooldown > 0}
        >
          ごきげんタイム
        </button>
        <button className="secondary-button" onClick={() => save(true)}>
          セーブ
        </button>
        <button className="secondary-button secondary-button--danger" onClick={handleReset}>
          初期化
        </button>
      </div>
      <div className="button-row button-row--hint">
        <span>コンボ: 最大 +100%、1.2 秒以内に連打で維持できます。</span>
        <span>クリティカル: 10% / 2 倍</span>
      </div>
    </div>
  );
};

export default Buttons;
