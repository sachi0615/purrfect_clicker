# 画面/色/保存先などの共通定数
W, H = 900, 560
FPS = 60

# カラー
BG = (18, 16, 28)
CARD = (32, 28, 52)
TEXT = (245, 240, 255)
BORDER = (66, 58, 100)
LOG_BG = (22, 20, 36)

# セーブファイル名
SAVEFILE = "save_cat_clicker_v1.json"


# ===== 日本語フォント設定 =====
import pygame
pygame.font.init()

# ふい字（同梱する場合はこのパスに配置）
FUJI_FONT_PATH = "assets/fonts/HuiFont29.ttf"

# フォールバック候補（環境フォント）
FONT_FALLBACK_CANDIDATES = [
    "M PLUS Rounded 1c", "MPLUSRounded1c",
    "Yu Gothic UI", "Meiryo", "MS Gothic",
    "Noto Sans CJK JP", "Source Han Sans JP",
]

def load_font(size: int):
    """ふい字→候補→デフォルトの順でフォントを返す"""
    # ふい字（同梱）を最優先
    try:
        return pygame.font.Font(FUJI_FONT_PATH, size)
    except Exception:
        pass
    # 環境内候補を順に探す
    for name in FONT_FALLBACK_CANDIDATES:
        path = pygame.font.match_font(name)
        if path:
            return pygame.font.Font(path, size)
    # 最終手段
    return pygame.font.Font(None, size)
