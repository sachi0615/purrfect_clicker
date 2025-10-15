import math
from models import Upgrade   # ← ここだけ変更！

def price_of(base: int, owned: int) -> int:
    return math.ceil(base * ((1.10 + 0.02 * owned) ** owned) + 0.4 * owned * owned)

SHOP = [
    Upgrade("toy",     "ねこじゃらし",         "+0.2 PPS（自動ごきげん）",   "pps",   18,   0.2),
    Upgrade("feeder",  "おやつディスペンサー",   "+1.5 PPS（安定ごほうび）",   "pps",   130,  1.5),
    Upgrade("tower",   "キャットタワー",       "+12 PPS（運動＆満足）",      "pps",   980,  12.0),
    Upgrade("petting", "なで技強化",           "クリック +1（手動なで力）",  "click", 70,   1.0),
]
