import math
from models import Upgrade


def price_of(base: int, owned: int) -> int:
    """Return the escalating cost for a shop item with owned copies."""
    growth = 1.18 + 0.015 * owned
    accel = 1.0 + 0.05 * owned + 0.0015 * (owned ** 2)
    return math.ceil(base * (growth ** owned) * accel)


SHOP = [
    Upgrade("toy", "ねこじゃらし", "PPS +0.2 / 軽い運動でご機嫌に", "pps", 18, 0.2),
    Upgrade("feeder", "おやつディスペンサー", "PPS +1.5 / きまぐれオヤツ補充", "pps", 130, 1.5),
    Upgrade("tower", "キャットタワー", "PPS +12 / 登って遊んでリフレッシュ", "pps", 980, 12.0),
    Upgrade("petting", "なで技強化", "クリック +1 / 手動なで力の基礎強化", "click", 70, 1.0),
    Upgrade("silk_gloves", "月光シルク手袋", "クリック +6 / 月光で研ぎ澄まされた手さばき", "click", 4_500, 6.0),
    Upgrade("aroma_lamp", "眠りのアロマランプ", "PPS +75 / 眠りを誘う香りで自動収入増", "pps", 8_200, 75.0),
    Upgrade("aurora_oil", "オーロラ肉球オイル", "クリック +18 / 肉球がとろける撫で心地", "click", 22_000, 18.0),
    Upgrade("starlight_hub", "星灯キャットハブ", "PPS +420 / 宇宙規模の癒やし装置", "pps", 180_000, 420.0),
    Upgrade("cosmic_gloves", "コズミック手袋", "クリック +85 / 銀河級のなで力", "click", 350_000, 85.0),
    Upgrade("dream_orchestra", "夢渡りオルゴール", "PPS +3,200 / 眠りへ誘う音色", "pps", 2_400_000, 3200.0),
    Upgrade("mythic_halo", "神話のニャン光輪", "クリック +680 / 伝説の加護", "click", 6_800_000, 680.0),
    Upgrade("celestial_palace", "天空キャットパレス", "PPS +18,000 / 雲上の楽園を建設", "pps", 18_500_000, 18000.0),
    Upgrade("galaxy_whisper", "銀河ささやきブラシ", "クリック +5,400 / 星々が見守る撫で心地", "click", 74_000_000, 5_400.0),
    Upgrade("quantum_garden", "量子キャット庭園", "PPS +125,000 / 次元を超えたお世話システム", "pps", 520_000_000, 125000.0),
]
