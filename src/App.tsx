import { useEffect } from 'react';

import { BossModal } from './components/BossModal';
import { ClickPad } from './components/ClickPad';
import { SkillBar } from './components/SkillBar';
import { MetaPanel } from './components/MetaPanel';
import { RewardPicker } from './components/RewardPicker';
import { RunSummary } from './components/RunSummary';
import { ShopPanel } from './components/ShopPanel';
import { SkillToasts } from './components/SkillToasts';
import { StagePanel } from './components/StagePanel';
import { TopPills } from './components/TopPills';
import { TopBar } from './components/TopBar';
import { ToastStack } from './components/Toast';
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
    <div className="min-h-screen bg-gradient-to-br from-plum-50 via-plum-100 to-plum-200 p-4 md:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:gap-6">
        <TopBar />
        <TopPills />
        <SkillBar />
        <div className="grid gap-4 md:gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-4 md:gap-6">
            <ClickPad />
            <StagePanel />
          </div>
          <div className="flex flex-col gap-4 md:gap-6">
            <ShopPanel />
            <MetaPanel />
          </div>
        </div>
      </div>
      <ToastStack />
      <SkillToasts />
      <BossModal />
      <RewardPicker />
      <RunSummary />
    </div>
  );
}
