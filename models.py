from dataclasses import dataclass

@dataclass
class Upgrade:
    key: str
    name: str
    desc: str
    type: str   # "pps" or "click"
    base: int
    gain: float

# 実績の定義用
@dataclass
class Achievement:
    key: str
    name: str
    desc: str
    metric: str  # "happy" | "total_pets" | "pps" | "level"
    threshold: float
