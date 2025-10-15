import json, time, os
from config import SAVEFILE
from state import GameState
from util import fmt

def save_game(state: GameState, logger):
    state.last_played_at = time.time()
    with open(SAVEFILE, "w", encoding="utf-8") as f:
        json.dump(state.to_dict(), f, ensure_ascii=False, indent=2)
    logger.add("セーブ完了")

def load_game(logger) -> GameState:
    if not os.path.exists(SAVEFILE):
        logger.add("セーブデータなし（初回起動）")
        return GameState()
    try:
        with open(SAVEFILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        st = GameState.from_dict(data)

        # オフライン進行（最大8時間）
        now = time.time()
        delta = max(0, int(now - st.last_played_at))
        delta = min(delta, 8*60*60)
        if delta > 3:
            gain = st.pps * delta
            st.happy += gain
            st.playtime_sec += delta
            logger.add(f"お留守番ボーナス：{delta}s で +{fmt(gain)} ハッピー（{fmt(st.pps)}/s）")
        st.last_played_at = now
        st.recalc_stats()
        logger.add("セーブデータ読込完了")
        return st
    except Exception as e:
        logger.add(f"読込に失敗: {e}")
        return GameState()
