import { useEffect } from 'react';

import { BossModal } from './components/BossModal';
import { ClickPad } from './components/ClickPad';
import { MetaPanel } from './components/MetaPanel';
import { RewardPicker } from './components/RewardPicker';
import { RunSummary } from './components/RunSummary';
import { ShopPanel } from './components/ShopPanel';
import { StagePanel } from './components/StagePanel';
import { TopPills } from './components/TopPills';
import { useRunStore } from './store/run';

export default function App() {
  const run = useRunStore((state) => state.run);
  const newRun = useRunStore((state) => state.newRun);
  const tick = useRunStore((state) => state.tick);

  useEffect(() => {
    if (!run) {
      newRun();
    }
  }, [run, newRun]);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();

    const step = (time: number) => {
      const dt = (time - last) / 1000;
      last = time;
      tick(dt);
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [tick]);

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <TopPills />
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-6">
            <ClickPad />
            <StagePanel />
          </div>
          <div className="flex flex-col gap-6">
            <ShopPanel />
            <MetaPanel />
          </div>
        </div>
      </div>
      <BossModal />
      <RewardPicker />
      <RunSummary />
    </div>
  );
}
