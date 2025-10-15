import pygame

# Screen & timing
W, H = 900, 560
FPS = 60

# Colours
BG = (18, 16, 28)
CARD = (32, 28, 52)
TEXT = (245, 240, 255)
BORDER = (66, 58, 100)
LOG_BG = (22, 20, 36)

SAVEFILE = "save_cat_clicker_v1.json"

# Font setup
pygame.font.init()
FUJI_FONT_PATH = "assets/fonts/HuiFont29.ttf"
FONT_FALLBACK_CANDIDATES = [
    "M PLUS Rounded 1c",
    "MPLUSRounded1c",
    "Yu Gothic UI",
    "Meiryo",
    "MS Gothic",
    "Noto Sans CJK JP",
    "Source Han Sans JP",
]


def load_font(size: int):
    """Return a font object, preferring the bundled font."""
    try:
        return pygame.font.Font(FUJI_FONT_PATH, size)
    except Exception:
        pass
    for name in FONT_FALLBACK_CANDIDATES:
        path = pygame.font.match_font(name)
        if path:
            return pygame.font.Font(path, size)
    return pygame.font.Font(None, size)


PRESTIGE_CONFIG = {
    "prestige_unlock_happy": 1_000_000,
    "prestige_unlock_level": 10,
    "point_log_base": 10.0,
    "point_per_log": 1.0,
    "per_point_mult": 0.10,
}

BALANCE_CONFIG = {
    "skill_bonus": 0.75,
    "skill_duration": 10.0,
    "skill_cooldown": 35.0,
    "level_exp_base": 10.0,
    "level_exp_growth": 1.35,
    "level_pet_power_mult": 1.08,
}
