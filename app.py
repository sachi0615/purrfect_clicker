import math
import random
import sys
import time

import pygame

from config import (
    BALANCE_CONFIG,
    BG,
    BORDER,
    FPS,
    H,
    PRESTIGE_CONFIG,
    TEXT,
    W,
    load_font,
)
from models import Achievement
from saveio import load_game, save_game
from shop import SHOP, price_of
from state import GameState
from ui import Button, Log, confirm_dialog, draw_card, draw_pill
from util import fmt

ACHIEVEMENTS = [
    Achievement("pets_100", "はじめの100なで", "合計100回なでる", "total_pets", 100),
    Achievement("pets_1k", "なで名人", "合計1,000回なでる", "total_pets", 1_000),
    Achievement("happy_1k", "小さな幸せ", "ハッピーを1,000獲得", "happy", 1_000),
    Achievement("happy_1m", "大きな幸せ", "ハッピーを1,000,000獲得", "happy", 1_000_000),
    Achievement("pps_10", "自動化の芽", "有効PPSを10に到達", "pps", 10),
    Achievement("pps_100", "自動化の要", "有効PPSを100に到達", "pps", 100),
    Achievement("lv_5", "新米キャットマスター", "プレイヤーレベル5に到達", "level", 5),
    Achievement("lv_10", "熟練キャットマスター", "プレイヤーレベル10に到達", "level", 10),
    Achievement("prestige_1", "初めての転生", "Prestigeポイントを1獲得", "prestige_points", 1),
    Achievement("prestige_10", "転生の達人", "Prestigeポイントを10獲得", "prestige_points", 10),
]

CRIT_CHANCE = 0.10
CRIT_MULT = 2.0
COMBO_WINDOW = 1.2
COMBO_STEP = 0.05
MAX_COMBO_BONUS = 1.0


def main():
    pygame.init()
    screen = pygame.display.set_mode((W, H))
    pygame.display.set_caption("Purrfect Clicker ✨")
    clock = pygame.time.Clock()

    font_h1 = load_font(34)
    font = load_font(24)
    font_small = load_font(20)
    font_large = load_font(42)

    log = Log(max_lines=6, font=font_small)
    log.add("ゲームへようこそ！　ねこをなでてハッピーを集めよう")

    state = load_game(log)

    margin = 16
    title_rect = pygame.Rect(margin, margin, W - margin * 2, 40)
    pill_h = 34
    pill_w = 200
    gap = 8

    top_keys = ["happy", "pet_power", "pps", "total_pets"]
    bottom_keys = ["level", "prestige", "lifetime"]

    pill_rects = {}
    for idx, key in enumerate(top_keys):
        rect = pygame.Rect(
            margin + idx * (pill_w + gap),
            title_rect.bottom + 8,
            pill_w,
            pill_h,
        )
        pill_rects[key] = rect

    total_top_width = len(top_keys) * pill_w + (len(top_keys) - 1) * gap
    total_bottom_width = len(bottom_keys) * pill_w + (len(bottom_keys) - 1) * gap
    bottom_start = margin + (total_top_width - total_bottom_width) / 2
    base_y = pill_rects[top_keys[0]].bottom + gap
    for idx, key in enumerate(bottom_keys):
        rect = pygame.Rect(
            int(bottom_start + idx * (pill_w + gap)),
            base_y,
            pill_w,
            pill_h,
        )
        pill_rects[key] = rect

    info_bottom = max(rect.bottom for rect in pill_rects.values())
    left_width = int(W * 0.56)
    left = pygame.Rect(margin, info_bottom + 10, left_width, H - (info_bottom + 10) - margin)
    right = pygame.Rect(left.right + margin, left.y, W - left_width - margin * 3, left.height)

    click_btn = Button((left.x + 16, left.y + 16, left.w - 32, 140), "なでる！", font_large)
    skill_btn = Button((left.x + 16, click_btn.rect.bottom + 10, 220, 38), "ごきげんタイム (Space)", font)
    prestige_btn = Button((skill_btn.rect.right + 12, skill_btn.rect.y, 220, 38), "転生 (未解放)", font)

    prestige_info_height = font_small.get_linesize()
    save_btn = Button(
        (left.x + 16, prestige_btn.rect.bottom + prestige_info_height + 12, 160, 36),
        "手動セーブ",
        font,
    )
    reset_btn = Button(
        (save_btn.rect.right + 12, save_btn.rect.y, 160, 36),
        "初期化",
        font,
    )
    log_rect = pygame.Rect(
        left.x + 16,
        reset_btn.rect.bottom + 12,
        left.w - 32,
        left.bottom - (reset_btn.rect.bottom + 24),
    )

    shop_rect = pygame.Rect(right.x + 16, right.y + 16, right.w - 32, right.h - 32)
    shop_item_h = 96

    float_texts = []
    rings = []
    autosave_timer = 0.0
    playtime_accum = 0.0

    running = True
    while running:
        dt = clock.tick(FPS) / 1000.0

        for ev in pygame.event.get():
            if ev.type == pygame.QUIT:
                save_game(state, log)
                pygame.quit()
                sys.exit()

            if click_btn.clicked(ev):
                now = time.time()
                if now - state.last_click_time <= COMBO_WINDOW:
                    state.combo += 1
                else:
                    state.combo = 0
                state.last_click_time = now

                combo_mult = 1.0 + min(MAX_COMBO_BONUS, state.combo * COMBO_STEP)
                crit = random.random() < CRIT_CHANCE
                crit_mult = CRIT_MULT if crit else 1.0
                gain = state.pet_power * combo_mult * crit_mult * state.prestige_mult

                state.happy += gain
                state.lifetime_happy += gain
                state.total_pets += 1
                state.exp += 1.0 + 0.1 * gain

                mx, my = pygame.mouse.get_pos()
                text = f"+{fmt(gain)}{' ニャッ!' if crit else ''}"
                float_texts.append({"x": mx, "y": my, "vy": -60, "life": 0.9, "text": text})
                rings.append({"x": mx, "y": my, "r": 2, "vr": 180, "life": 0.35})

                log.add(
                    f"+{fmt(gain)} ハッピー "
                    f"{'(クリティカル)' if crit else ''} x{combo_mult:.2f}"
                )
                check_achievements(state, log)

            if skill_btn.clicked(ev):
                try_activate_skill(state, log)

            if ev.type == pygame.KEYDOWN and ev.key == pygame.K_SPACE:
                try_activate_skill(state, log)

            if prestige_btn.clicked(ev) and can_prestige(state):
                gain, total = calculate_prestige_reward(state)
                new_mult = 1.0 + PRESTIGE_CONFIG["per_point_mult"] * (state.prestige_points + gain)
                message = (
                    "転生を行いますか？\n"
                    f"獲得予定ポイント: +{gain}（累計 {state.prestige_points + gain}）\n"
                    f"倍率: x{state.prestige_mult:.2f} → x{new_mult:.2f}"
                )
                if confirm_dialog(screen, font_h1, font, message):
                    perform_prestige(state, log, float_texts, rings)
                    check_achievements(state, log)

            if save_btn.clicked(ev):
                save_game(state, log)

            if reset_btn.clicked(ev):
                if confirm_dialog(screen, font_h1, font, "初期化しますか？\n（元に戻せません）"):
                    state = GameState()
                    log.add("初期化しました")

            if ev.type == pygame.MOUSEBUTTONDOWN and ev.button == 1:
                mx, my = ev.pos
                y = shop_rect.y + 6
                for upgrade in SHOP:
                    row = pygame.Rect(shop_rect.x + 6, y, shop_rect.w - 12, shop_item_h - 10)
                    button_rect = pygame.Rect(row.right - 120, row.y + 24, 100, 36)
                    if button_rect.collidepoint(mx, my):
                        owned = state.owned.get(upgrade.key, 0)
                        price = price_of(upgrade.base, owned)
                        if state.happy >= price:
                            state.happy -= price
                            state.owned[upgrade.key] = owned + 1
                            if upgrade.type == "click":
                                state.pet_power += upgrade.gain
                            state.recalc_stats()
                            log.add(f"{upgrade.name} を購入！")
                            check_achievements(state, log)
                    y += shop_item_h

        state.skill_cd = max(0.0, state.skill_cd - dt)
        state.skill_rem = max(0.0, state.skill_rem - dt)
        skill_mult = 1.0 + (BALANCE_CONFIG["skill_bonus"] if state.skill_rem > 0 else 0.0)

        auto_gain = state.pps * state.prestige_mult * skill_mult * dt
        if auto_gain > 0:
            state.happy += auto_gain
            state.lifetime_happy += auto_gain

        playtime_accum += dt
        if playtime_accum >= 1.0:
            inc = int(playtime_accum)
            state.playtime_sec += inc
            playtime_accum -= inc

        leveled = False
        while state.exp >= state.next_exp:
            state.exp -= state.next_exp
            state.level += 1
            state.next_exp = math.ceil(state.next_exp * BALANCE_CONFIG["level_exp_growth"])
            state.pet_power *= BALANCE_CONFIG["level_pet_power_mult"]
            leveled = True
        if leveled:
            log.add(f"レベルアップ！ Lv{state.level} になった（なで力強化）")
            cx, cy = W // 2, H // 2
            for i in range(3):
                rings.append(
                    {"x": cx, "y": cy, "r": 12 + i * 10, "vr": 200 + i * 30, "life": 0.6}
                )
            check_achievements(state, log)

        autosave_timer += dt
        if autosave_timer >= 10.0:
            autosave_timer = 0.0
            save_game(state, log)

        for ft in list(float_texts):
            ft["y"] += ft["vy"] * dt
            ft["life"] -= dt
            if ft["life"] <= 0:
                float_texts.remove(ft)

        for ring in list(rings):
            ring["r"] += ring["vr"] * dt
            ring["life"] -= dt
            if ring["life"] <= 0:
                rings.remove(ring)

        check_achievements(state, log)

        screen.fill(BG)

        title = font_h1.render("Purrfect Clicker", True, TEXT)
        screen.blit(title, (title_rect.x, title_rect.y))

        pill_texts = {
            "happy": f"ハッピー: {fmt(state.happy)}",
            "pet_power": f"なで力: {fmt(state.pet_power * state.prestige_mult)}",
            "pps": f"PPS: {fmt(state.effective_pps())}",
            "total_pets": f"合計なで: {fmt(state.total_pets)}",
            "level": f"Lv{state.level} ({int(state.exp)}/{int(state.next_exp)})",
            "prestige": f"Prestige x{state.prestige_mult:.2f}",
            "lifetime": f"生涯ハッピー: {fmt(state.lifetime_happy)}",
        }
        for key, rect in pill_rects.items():
            draw_pill(screen, rect, pill_texts[key], font_small)

        draw_card(screen, left)

        click_btn.text = f"なでる！ +{fmt(state.pet_power * state.prestige_mult)}"
        click_btn.draw(screen)

        if state.skill_rem > 0:
            skill_btn.text = f"ごきげん中… {state.skill_rem:4.1f}s"
            skill_btn.disabled = True
        elif state.skill_cd > 0:
            skill_btn.text = f"CD {state.skill_cd:4.1f}s"
            skill_btn.disabled = True
        else:
            skill_btn.text = "ごきげんタイム (Space)"
            skill_btn.disabled = False
        skill_btn.draw(screen)

        prestige_unlocked = can_prestige(state)
        prestige_btn.disabled = not prestige_unlocked
        prestige_btn.text = "転生する" if prestige_unlocked else "転生 (未解放)"
        prestige_btn.draw(screen)

        prestige_info = build_prestige_info_text(state, prestige_unlocked)
        info_surf = font_small.render(prestige_info, True, TEXT)
        screen.blit(info_surf, (prestige_btn.rect.x, prestige_btn.rect.bottom + 4))

        save_btn.draw(screen)
        reset_btn.draw(screen)
        log.draw(screen, log_rect)

        draw_card(screen, right)
        shop_title = font_h1.render("ねこショップ", True, TEXT)
        screen.blit(shop_title, (right.x + 16, right.y + 16))

        y = shop_rect.y + 10
        for upgrade in SHOP:
            row = pygame.Rect(shop_rect.x + 6, y, shop_rect.w - 12, shop_item_h - 10)
            pygame.draw.rect(screen, (40, 34, 64), row, border_radius=10)
            pygame.draw.rect(screen, BORDER, row, 1, border_radius=10)

            owned = state.owned.get(upgrade.key, 0)
            price = price_of(upgrade.base, owned)

            name = font.render(f"{upgrade.name}  x{owned}", True, TEXT)
            desc = font_small.render(upgrade.desc, True, TEXT)
            price_text = font_small.render(f"価格: {fmt(price)} ハッピー", True, TEXT)

            screen.blit(name, (row.x + 12, row.y + 8))
            screen.blit(desc, (row.x + 12, row.y + 8 + font.get_linesize()))
            screen.blit(price_text, (row.x + 12, row.y + 8 + font.get_linesize() * 2))

            button_rect = pygame.Rect(row.right - 120, row.y + 24, 100, 36)
            can_buy = state.happy >= price
            btn_bg = (200, 160, 80) if can_buy else (90, 78, 120)
            btn_fg = (30, 22, 12) if can_buy else (200, 190, 210)
            pygame.draw.rect(screen, btn_bg, button_rect, border_radius=10)
            pygame.draw.rect(screen, (230, 200, 120), button_rect, 1, border_radius=10)
            label = font_small.render("購入", True, btn_fg)
            screen.blit(label, label.get_rect(center=button_rect.center))

            y += shop_item_h

        for ft in float_texts:
            alpha = max(0, min(255, int((ft["life"] / 0.9) * 255)))
            surf = font_small.render(ft["text"], True, (255, 255, 255))
            fade_surface = pygame.Surface(surf.get_size(), pygame.SRCALPHA)
            fade_surface.blit(surf, (0, 0))
            fade_surface.set_alpha(alpha)
            screen.blit(fade_surface, (ft["x"], ft["y"]))

        for ring in rings:
            alpha = max(0, min(140, int((ring["life"] / 0.6) * 140)))
            ring_surface = pygame.Surface((W, H), pygame.SRCALPHA)
            pygame.draw.circle(
                ring_surface,
                (255, 255, 255, alpha),
                (int(ring["x"]), int(ring["y"])),
                int(ring["r"]),
                width=2,
            )
            screen.blit(ring_surface, (0, 0))

        pygame.display.flip()


def can_prestige(state: GameState) -> bool:
    cfg = PRESTIGE_CONFIG
    return state.happy >= cfg["prestige_unlock_happy"] or state.level >= cfg["prestige_unlock_level"]


def calculate_prestige_reward(state: GameState) -> tuple[int, int]:
    cfg = PRESTIGE_CONFIG
    lifetime = max(state.lifetime_happy, 1.0)
    total_points = max(
        1,
        int(math.log(max(lifetime, cfg["point_log_base"]), cfg["point_log_base"]) * cfg["point_per_log"]),
    )
    gained = max(1, total_points - state.prestige_points)
    return gained, total_points


def perform_prestige(state: GameState, log: Log, float_texts, rings):
    gain, _ = calculate_prestige_reward(state)
    state.prestige_points += gain
    state.update_prestige_multiplier()
    log.add(f"転生完了！ Prestigeポイント +{gain}（累計 {state.prestige_points}）")
    log.add(f"恒久倍率が x{state.prestige_mult:.2f} になった")

    cx, cy = W // 2, H // 2
    float_texts.append({"x": cx - 60, "y": cy - 80, "vy": -20, "life": 1.4, "text": f"+{gain} Prestige!"})
    for i in range(5):
        rings.append({"x": cx, "y": cy, "r": 40 + i * 24, "vr": 220 + i * 40, "life": 0.8})

    state.reset_progress_for_prestige()
    state.last_played_at = time.time()


def try_activate_skill(state: GameState, log: Log):
    if state.skill_cd <= 0 and state.skill_rem <= 0:
        state.skill_rem = BALANCE_CONFIG["skill_duration"]
        state.skill_cd = BALANCE_CONFIG["skill_cooldown"]
        bonus = int(BALANCE_CONFIG["skill_bonus"] * 100)
        log.add(f"ごきげんタイム発動！ {BALANCE_CONFIG['skill_duration']:g}s間PPS +{bonus}%")


def check_achievements(state: GameState, log: Log):
    unlocked = set(state.achievements)

    def metric_value(metric: str) -> float:
        if metric == "happy":
            return state.happy
        if metric == "total_pets":
            return state.total_pets
        if metric == "pps":
            return state.effective_pps()
        if metric == "level":
            return state.level
        if metric == "prestige_points":
            return state.prestige_points
        return 0.0

    newly = []
    for achievement in ACHIEVEMENTS:
        if achievement.key in unlocked:
            continue
        if metric_value(achievement.metric) >= achievement.threshold:
            state.achievements.append(achievement.key)
            newly.append(achievement)

    for achievement in newly:
        log.add(f"実績解除！ {achievement.name} – {achievement.desc}")


def build_prestige_info_text(state: GameState, unlocked: bool) -> str:
    cfg = PRESTIGE_CONFIG
    if not unlocked:
        req_happy = fmt(cfg["prestige_unlock_happy"])
        return f"解放条件: ハッピー {req_happy} / Lv{cfg['prestige_unlock_level']}"
    gain, _ = calculate_prestige_reward(state)
    new_mult = 1.0 + PRESTIGE_CONFIG["per_point_mult"] * (state.prestige_points + gain)
    return f"転生で +{gain}pt → x{new_mult:.2f}"


if __name__ == "__main__":
    main()
