import { useMemo } from 'react';

import { useGameStore } from '../store';

const Log = () => {
  const log = useGameStore((state) => state.log);

  const items = useMemo(
    () =>
      log.map((entry) => ({
        ...entry,
        time: new Date(entry.createdAt).toLocaleTimeString('ja-JP', {
          hour12: false,
        }),
      })),
    [log],
  );

  return (
    <div className="log-panel">
      <h2>ログ</h2>
      <ul className="log-list">
        {items.map((entry) => (
          <li key={entry.id} className="log-item">
            <span className="log-time">[{entry.time}]</span>
            <span className="log-message">{entry.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Log;
