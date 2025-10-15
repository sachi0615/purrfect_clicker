import { useGameStore } from '../store';
import { fmt } from '../util';

const Pills = () => {
  const happy = useGameStore((state) => state.happy);
  const petPower = useGameStore((state) => state.petPower);
  const pps = useGameStore((state) => state.pps);
  const totalPets = useGameStore((state) => state.totalPets);
  const level = useGameStore((state) => state.level);
  const exp = useGameStore((state) => state.exp);
  const nextExp = useGameStore((state) => state.nextExp);

  return (
    <div className="pills">
      <div className="pill">
        <span className="pill-label">ハッピー</span>
        <span className="pill-value">{fmt(happy)}</span>
      </div>
      <div className="pill">
        <span className="pill-label">なで力</span>
        <span className="pill-value">{petPower.toFixed(1)}</span>
      </div>
      <div className="pill">
        <span className="pill-label">PPS</span>
        <span className="pill-value">{pps.toFixed(2)}</span>
      </div>
      <div className="pill">
        <span className="pill-label">合計なで</span>
        <span className="pill-value">{fmt(totalPets)}</span>
      </div>
      <div className="pill">
        <span className="pill-label">Lv</span>
        <span className="pill-value">
          {level} ({Math.floor(exp)}/{Math.floor(nextExp)})
        </span>
      </div>
    </div>
  );
};

export default Pills;
