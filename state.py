import time
from shop import SHOP

class GameState:
    def __init__(self):
        self.happy = 0.0               # 通貨：ハッピー
        self.total_pets = 0            # 総なで回数
        self.pet_power = 1.0           # 1クリック当たり
        self.pps = 0.0                 # 自動生産/秒
        self.owned = {u.key: 0 for u in SHOP}
        self.playtime_sec = 0
        self.last_played_at = time.time()
        # コンボ＆クリティカル用
        self.combo = 0
        self.last_click_time = 0.0
        # ごきげんタイム
        self.skill_cd = 0.0
        self.skill_rem = 0.0
        # --- レベルシステム ---
        self.level = 1
        self.exp = 0.0
        self.next_exp = 10.0
        # --- 実績（解放済みキー配列） ---
        self.achievements = []

    def recalc_stats(self):
        pps = 0.0
        for u in SHOP:
            if u.type == "pps":
                pps += self.owned.get(u.key, 0) * u.gain
        self.pps = pps

    # セーブ・ロード用
    def to_dict(self):
        return {
            "happy": self.happy,
            "total_pets": self.total_pets,
            "pet_power": self.pet_power,
            "pps": self.pps,
            "owned": self.owned,
            "playtime_sec": self.playtime_sec,
            "last_played_at": self.last_played_at,
            "combo": self.combo,
            "last_click_time": self.last_click_time,
            "skill_cd": self.skill_cd,
            "skill_rem": self.skill_rem,
            "level": self.level,
            "exp": self.exp,
            "next_exp": self.next_exp,
            "achievements": self.achievements,
        }

    @classmethod
    def from_dict(cls, d: dict):
        g = cls()
        g.happy = float(d.get("happy", 0))
        g.total_pets = int(d.get("total_pets", 0))
        g.pet_power = float(d.get("pet_power", 1))
        g.pps = float(d.get("pps", 0))
        g.owned = {**{u.key:0 for u in SHOP}, **d.get("owned", {})}
        g.playtime_sec = int(d.get("playtime_sec", 0))
        g.last_played_at = float(d.get("last_played_at", g.last_played_at))
        g.combo = int(d.get("combo", 0))
        g.last_click_time = float(d.get("last_click_time", 0.0))
        g.skill_cd = float(d.get("skill_cd", 0.0))
        g.skill_rem = float(d.get("skill_rem", 0.0))
        g.level = int(d.get("level", 1))
        g.exp = float(d.get("exp", 0.0))
        g.next_exp = float(d.get("next_exp", 10.0))
        g.achievements = list(d.get("achievements", []))
        g.recalc_stats()
        return g
