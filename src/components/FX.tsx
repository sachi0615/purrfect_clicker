import { useGameStore } from '../store';
import { useInterval, useTicker } from '../hooks/useTicker';

const FX = () => {
  const tick = useGameStore((state) => state.tick);
  const save = useGameStore((state) => state.save);
  const texts = useGameStore((state) => state.fx.texts);
  const rings = useGameStore((state) => state.fx.rings);
  const skill = useGameStore((state) => state.skill);

  useTicker(tick);
  useInterval(() => save(false), 10_000);

  return (
    <div className="fx-container">
      <div className="fx-layer">
        {rings.map((ring) => (
          <div
            key={ring.id}
            className="fx-ring"
            style={{
              left: `${ring.xPercent}%`,
              top: `${ring.yPercent}%`,
              opacity: Math.max(0, ring.life),
              transform: `translate(-50%, -50%) scale(${1 + (1 - ring.life) * 0.4})`,
            }}
          />
        ))}
        {texts.map((text) => (
          <div
            key={text.id}
            className="fx-text"
            style={{
              left: `${text.xPercent}%`,
              top: `${text.yPercent}%`,
              opacity: Math.max(0, text.life),
              transform: `translate(-50%, -50%) translateY(${(1 - text.life) * -30}px)`,
            }}
          >
            {text.value}
          </div>
        ))}
      </div>
      <div className="skill-status">
        {skill.active
          ? `ごきげんタイム 残り ${skill.timeLeft.toFixed(1)}s`
          : skill.cooldown > 0
          ? `ごきげんタイム 冷却中 ${skill.cooldown.toFixed(1)}s`
          : 'ごきげんタイム 準備完了'}
      </div>
    </div>
  );
};

export default FX;
