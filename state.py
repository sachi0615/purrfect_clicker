import time
from typing import Dict

from config import BALANCE_CONFIG, PRESTIGE_CONFIG
from shop import SHOP


class GameState:
    def __init__(self):
        self.happy = 0.0
        self.total_pets = 0
        self.pet_power = 1.0
        self.pps = 0.0
        self.owned: Dict[str, int] = {u.key: 0 for u in SHOP}
        self.playtime_sec = 0
        self.last_played_at = time.time()
        self.combo = 0
        self.last_click_time = 0.0
        self.skill_cd = 0.0
        self.skill_rem = 0.0
        self.level = 1
        self.exp = 0.0
        self.next_exp = BALANCE_CONFIG["level_exp_base"]
        self.achievements = []
        self.prestige_points = 0
        self.prestige_mult = 1.0
        self.lifetime_happy = 0.0
        self.update_prestige_multiplier()

    def update_prestige_multiplier(self):
        self.prestige_mult = 1.0 + PRESTIGE_CONFIG["per_point_mult"] * self.prestige_points

    def reset_progress_for_prestige(self):
        self.happy = 0.0
        self.total_pets = 0
        self.pet_power = 1.0
        self.pps = 0.0
        self.owned = {u.key: 0 for u in SHOP}
        self.combo = 0
        self.last_click_time = 0.0
        self.skill_cd = 0.0
        self.skill_rem = 0.0
        self.level = 1
        self.exp = 0.0
        self.next_exp = BALANCE_CONFIG["level_exp_base"]
        self.recalc_stats()

    def recalc_stats(self):
        pps = 0.0
        for u in SHOP:
            if u.type == "pps":
                pps += self.owned.get(u.key, 0) * u.gain
        self.pps = pps

    def effective_pps(self) -> float:
        return self.pps * self.prestige_mult

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
            "prestige_points": self.prestige_points,
            "prestige_mult": self.prestige_mult,
            "lifetime_happy": self.lifetime_happy,
        }

    @classmethod
    def from_dict(cls, data: dict):
        g = cls()
        g.happy = float(data.get("happy", 0.0))
        g.total_pets = int(data.get("total_pets", 0))
        g.pet_power = float(data.get("pet_power", 1.0))
        g.pps = float(data.get("pps", 0.0))
        owned = data.get("owned", {})
        g.owned = {**{u.key: 0 for u in SHOP}, **owned}
        g.playtime_sec = int(data.get("playtime_sec", 0))
        g.last_played_at = float(data.get("last_played_at", g.last_played_at))
        g.combo = int(data.get("combo", 0))
        g.last_click_time = float(data.get("last_click_time", 0.0))
        g.skill_cd = float(data.get("skill_cd", 0.0))
        g.skill_rem = float(data.get("skill_rem", 0.0))
        g.level = int(data.get("level", 1))
        g.exp = float(data.get("exp", 0.0))
        g.next_exp = float(data.get("next_exp", BALANCE_CONFIG["level_exp_base"]))
        g.achievements = list(data.get("achievements", []))
        g.prestige_points = int(data.get("prestige_points", 0))
        g.lifetime_happy = float(data.get("lifetime_happy", 0.0))
        g.update_prestige_multiplier()
        g.recalc_stats()
        return g
