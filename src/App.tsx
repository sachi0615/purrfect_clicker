import { useEffect } from 'react';

import { BossModal } from './components/BossModal';
import { ClickPad } from './components/ClickPad';
import { SkillBar } from './components/SkillBar';
import { MetaPanel } from './components/MetaPanel';
import { RewardPicker } from './components/RewardPicker';
import { BuildSelect } from './components/BuildSelect';
import { RunSummary } from './components/RunSummary';
import { ShopPanel } from './components/ShopPanel';
import { SkillToasts } from './components/SkillToasts';
import { StagePanel } from './components/StagePanel';
import { TopPills } from './components/TopPills';
import { TopBar } from './components/TopBar';
import { ToastStack } from './components/Toast';
import { CharacterSelect } from './components/CharacterSelect';
import { useRunStore } from './store/run';
import { useCharsStore } from './store/chars';

export default function App() {
  const run = useRunStore((state) => state.run);
  const newRun = useRunStore((state) => state.newRun);
  const tick = useRunStore((state) => state.tick);
  const selectedCharacter = useCharsStore((state) => state.selected);

  useEffect(() => {
    if (!run && selectedCharacter) {
      newRun();
    }
  }, [run, newRun, selectedCharacter]);

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
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-plum-50 via-plum-100 to-plum-200 p-4 md:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 overflow-hidden md:gap-6">
        <TopBar />
        <TopPills />
        <main className="grid flex-1 gap-4 overflow-hidden md:grid-cols-[2fr_1fr] md:items-start">
          <div className="grid h-full min-h-0 gap-4 md:auto-rows-min">
            <div className="min-h-0">
              <ClickPad />
            </div>
            <div className="min-h-0">
              <StagePanel />
            </div>
          </div>
          <div className="grid h-full min-h-0 gap-4 md:grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)]">
            <div className="min-h-0">
              <SkillBar />
            </div>
            <div className="min-h-0">
              <ShopPanel />
            </div>
            <div className="min-h-0">
              <MetaPanel />
            </div>
          </div>
        </main>
      </div>
      <ToastStack />
      <SkillToasts />
      <CharacterSelect />
      <BuildSelect />
      <BossModal />
      <RewardPicker />
      <RunSummary />
    </div>
  );
}
