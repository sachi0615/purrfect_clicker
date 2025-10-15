import pygame, sys, time, random, math
from config import W, H, FPS, BG, TEXT, load_font
from ui import Button, draw_card, draw_pill, Log, confirm_dialog
from saveio import save_game, load_game
from shop import SHOP, price_of
from util import fmt
from models import Achievement

# ===== 実績の定義 =====
ACHIEVEMENTS = [
    Achievement("pets_100",  "はじめの100なで",     "合計100回なでた",           "total_pets", 100),
    Achievement("pets_1k",   "なで名人",            "合計1,000回なでた",         "total_pets", 1000),
    Achievement("happy_1k",  "小さな幸せ",          "ハッピー1,000達成",         "happy",      1_000),
    Achievement("happy_1m",  "大きな幸せ",          "ハッピー1,000,000達成",     "happy",      1_000_000),
    Achievement("pps_10",    "自動化の芽",          "PPSが10に到達",             "pps",        10),
    Achievement("pps_100",   "自動化の覇者",        "PPSが100に到達",            "pps",        100),
    Achievement("lv_5",      "新米キャットテイマー","プレイヤーレベル5到達",      "level",      5),
    Achievement("lv_10",     "熟練キャットテイマー","プレイヤーレベル10到達",     "level",      10),
]

def main():
    pygame.init()
    screen = pygame.display.set_mode((W, H))
    pygame.display.set_caption("Purrfect Clicker ✨ (modular)")
    clock = pygame.time.Clock()

    font_h1    = load_font(34)
    font       = load_font(24)
    font_small = load_font(20)

    # ログ
    log = Log(max_lines=6, font=font_small)

    # 初回メッセージ
    log.add("ゲームへようこそ！ 画面左のねこをなでて幸せを集めよう。")
    state = load_game(log)

    # レイアウト
    margin = 16
    title_rect = pygame.Rect(margin, margin, W - margin*2, 36)
    pill_h = 30
    # 5本のまま「プレイ秒」→「レベル」に差し替え（横幅崩さない）
    pills = [
        pygame.Rect(margin,             title_rect.bottom + 8, 160, pill_h),  # ハッピー
        pygame.Rect(margin+168,         title_rect.bottom + 8, 190, pill_h),  # クリック力
        pygame.Rect(margin+168+198,     title_rect.bottom + 8, 170, pill_h),  # PPS
        pygame.Rect(margin+168+198+178, title_rect.bottom + 8, 190, pill_h),  # 合計なで
        pygame.Rect(margin+168+198+178+198, title_rect.bottom + 8, 140, pill_h), # レベル
    ]
    left_w = int(W * 0.56)
    left = pygame.Rect(margin, pills[0].bottom + 10, left_w, H - (pills[0].bottom + 10) - margin)
    right = pygame.Rect(left.right + margin, left.y, W - left_w - margin*3, left.h)

    # 左UI
    click_btn = Button((left.x+16, left.y+16, left.w-32, 140), "なでる！", pygame.font.SysFont(None, 42))
    skill_btn = Button((left.x+16, click_btn.rect.bottom+10, 240, 36), "ごきげんタイム (Space)", font)
    save_btn  = Button((skill_btn.rect.right + 10, skill_btn.rect.y, 120, 36), "手動セーブ", font)
    reset_btn = Button((save_btn.rect.right + 10, save_btn.rect.y, 110, 36), "初期化", font)
    log_rect  = pygame.Rect(left.x+16, reset_btn.rect.bottom+12, left.w-32, left.bottom - (reset_btn.rect.bottom+24))

    # 右UI（ショップ）
    shop_rect = pygame.Rect(right.x+16, right.y+16, right.w-32, right.h-32)
    shop_item_h = 88

    # アニメーション：クリック演出（浮遊テキスト＆リング）
    float_texts = []  # dict: {x,y,vy,life,text}
    rings = []        # dict: {x,y,r,vr,life}

    autosave_timer = 0.0
    playtime_accum = 0.0
    log.add("ようこそ！なでてハッピーを集め、ねこグッズで加速しよう")

    running = True
    while running:
        dt = clock.tick(FPS) / 1000.0

        # ===== 入力 =====
        for ev in pygame.event.get():
            if ev.type == pygame.QUIT:
                save_game(state, log)
                pygame.quit(); sys.exit()

            # クリック：なでる
            if click_btn.clicked(ev):
                now_t = time.time()
                if now_t - state.last_click_time <= 1.2:
                    state.combo += 1
                else:
                    state.combo = 0
                state.last_click_time = now_t

                combo_mult = 1.0 + min(1.0, state.combo * 0.05)   # 最大+100%
                crit = (1 if (random.random() < 0.10) else 0)     # 10%クリティカル
                crit_mult = 2.0 if crit else 1.0
                gain = state.pet_power * combo_mult * crit_mult
                state.happy += gain
                state.total_pets += 1

                # --- レベル経験値（クリックで入手） ---
                state.exp += 1.0 + 0.1 * gain  # クリックの質で微増

                # 浮遊テキスト（アニメ）
                mx, my = pygame.mouse.get_pos()
                txt = f"+{fmt(gain)} {'ニャッ!' if crit else ''}"
                float_texts.append({"x": mx, "y": my, "vy": -50, "life": 0.9, "text": txt})
                # リング
                rings.append({"x": mx, "y": my, "r": 2, "vr": 160, "life": 0.35})

                log.add(f"+{fmt(gain)} ハッピー {'(ニャッ!)' if crit else ''} x{1+state.combo*0.05:.2f}")

                # 実績チェック（クリック系が動いたタイミングで）
                check_achievements(state, log)

            if save_btn.clicked(ev):
                save_game(state, log)

            if reset_btn.clicked(ev):
                if confirm_dialog(screen, font_h1, font, "本当に初期化しますか？\n（元に戻せません）"):
                    from state import GameState
                    import os
                    from config import SAVEFILE
                    try:
                        if os.path.exists(SAVEFILE):
                            os.remove(SAVEFILE)
                    except: pass
                    state = GameState()
                    state.recalc_stats()
                    log.add("初期化しました")

            # ごきげんタイム（ボタン or Space）
            if skill_btn.clicked(ev):
                try_activate_skill(state, log)
            if ev.type == pygame.KEYDOWN and ev.key == pygame.K_SPACE:
                try_activate_skill(state, log)

            # ショップ購入
            if ev.type == pygame.MOUSEBUTTONDOWN and ev.button == 1:
                mx, my = ev.pos
                y = shop_rect.y + 6
                for u in SHOP:
                    row = pygame.Rect(shop_rect.x+6, y, shop_rect.w-12, shop_item_h-8)
                    btn = pygame.Rect(row.right - 120, row.y + 20, 100, 36)
                    if btn.collidepoint(mx, my):
                        owned = state.owned[u.key]
                        price = price_of(u.base, owned)
                        if state.happy >= price:
                            state.happy -= price
                            state.owned[u.key] = owned + 1
                            if u.type == "click":
                                state.pet_power += u.gain
                            state.recalc_stats()
                            log.add(f"{u.name} を購入！")
                            check_achievements(state, log)
                    y += shop_item_h

        # ===== 進行 =====
        # ごきげん：PPS+75%/10s, CD 35s
        state.skill_cd = max(0.0, state.skill_cd - dt)
        state.skill_rem = max(0.0, state.skill_rem - dt)
        skill_mult = 1.0 + (0.75 if state.skill_rem > 0 else 0.0)

        # 自動加算
        state.happy += state.pps * skill_mult * dt

        # プレイ時間
        playtime_accum += dt
        if playtime_accum >= 1.0:
            inc = int(playtime_accum)
            state.playtime_sec += inc
            playtime_accum -= inc

        # レベル判定（必要経験値は1.35倍で増加）
        leveled = False
        while state.exp >= state.next_exp:
            state.exp -= state.next_exp
            state.level += 1
            state.next_exp = math.ceil(state.next_exp * 1.35)
            # レベルアップ報酬：手動なで力を少し底上げ
            state.pet_power += 0.5
            leveled = True
        if leveled:
            log.add(f" レベルアップ！ Lv{state.level} に到達（なで力+0.5）")
            # レベルアップ演出：中央にリング追加
            cx, cy = W//2, H//2
            for i in range(3):
                rings.append({"x": cx, "y": cy, "r": 8 + i*6, "vr": 200 + i*40, "life": 0.5})
            check_achievements(state, log)

        # オートセーブ（10秒）
        autosave_timer += dt
        if autosave_timer >= 10.0:
            autosave_timer = 0.0
            save_game(state, log)

        # ===== アニメ更新 =====
        for p in list(float_texts):
            p["y"] += p["vy"] * dt
            p["life"] -= dt
            if p["life"] <= 0:
                float_texts.remove(p)
        for r in list(rings):
            r["r"] += r["vr"] * dt
            r["life"] -= dt
            if r["life"] <= 0:
                rings.remove(r)

        # ===== 描画 =====
        screen.fill(BG)

        # タイトル
        title = font_h1.render("Purrfect Clicker ", True, TEXT)
        screen.blit(title, (title_rect.x, title_rect.y))

        # ピル
        draw_pill(screen, pills[0], f"ハッピー: {fmt(state.happy)}", font)
        draw_pill(screen, pills[1], f"なで力/クリック: {fmt(state.pet_power)}", font)
        draw_pill(screen, pills[2], f"毎秒(PPS): {state.pps:.1f}", font)
        draw_pill(screen, pills[3], f"合計なで回数: {fmt(state.total_pets)}", font)
        # プレイ秒の代わりにレベル/EXP
        draw_pill(screen, pills[4], f"Lv{state.level}  ({int(state.exp)}/{int(state.next_exp)})", font)

        # 左カード
        draw_card(screen, left)
        click_btn.text = f"なでる！  +{fmt(state.pet_power)}"
        click_btn.draw(screen)

        # ごきげんボタン
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

        save_btn.draw(screen)
        reset_btn.draw(screen)
        log.draw(screen, log_rect)

        # 右カード（ショップ）
        draw_card(screen, right)
        shop_title = font_h1.render("ねこグッズ ", True, TEXT)
        screen.blit(shop_title, (right.x+16, right.y+16))

        y = shop_rect.y + 6
        for u in SHOP:
            row = pygame.Rect(shop_rect.x+6, y, shop_rect.w-12, shop_item_h-8)
            pygame.draw.rect(screen, (40, 34, 64), row, border_radius=10)
            from config import BORDER
            pygame.draw.rect(screen, BORDER, row, 1, border_radius=10)

            owned = state.owned[u.key]
            price = price_of(u.base, owned)

            name = font.render(f"{u.name}  x{owned}", True, TEXT)
            desc = font_small.render(u.desc, True, TEXT)
            price_s = font_small.render(f"価格: {fmt(price)} ハッピー", True, TEXT)
            screen.blit(name, (row.x+12, row.y+10))
            screen.blit(desc, (row.x+12, row.y+10 + font.get_linesize()))
            screen.blit(price_s, (row.x+12, row.y+10 + font.get_linesize()*2))

            btn = pygame.Rect(row.right - 120, row.y + 20, 100, 36)
            can = state.happy >= price
            btn_bg = (200, 160, 80) if can else (90, 78, 120)
            btn_fg = (30, 22, 12) if can else (200, 190, 210)
            pygame.draw.rect(screen, btn_bg, btn, border_radius=10)
            pygame.draw.rect(screen, (230, 200, 120), btn, 1, border_radius=10)
            label = font_small.render("購入", True, btn_fg)
            screen.blit(label, label.get_rect(center=btn.center))

            y += shop_item_h

        # アニメ描画（最後に重ねる）
        # 浮遊テキスト
        for p in float_texts:
            alpha = max(0, min(255, int((p["life"]/0.9)*255)))
            surf = font_small.render(p["text"], True, (255, 255, 255))
            s2 = pygame.Surface(surf.get_size(), pygame.SRCALPHA)
            s2.blit(surf, (0,0))
            s2.set_alpha(alpha)
            screen.blit(s2, (p["x"], p["y"]))
        # リング
        for r in rings:
            alpha = max(0, min(120, int((r["life"]/0.5)*120)))
            s = pygame.Surface((W, H), pygame.SRCALPHA)
            pygame.draw.circle(s, (255, 255, 255, alpha), (int(r["x"]), int(r["y"])), int(r["r"]), width=2)
            screen.blit(s, (0,0))

        pygame.display.flip()

def try_activate_skill(state, log):
    if state.skill_cd <= 0 and state.skill_rem <= 0:
        state.skill_rem = 10.0
        state.skill_cd = 35.0
        log.add("ごきげんタイム発動！（10s, PPS +75%）")

def check_achievements(state, log):
    # すでに解除済みのキーをset化
    unlocked = set(state.achievements)
    def metric_value(m):
        if m == "happy": return state.happy
        if m == "total_pets": return state.total_pets
        if m == "pps": return state.pps
        if m == "level": return state.level
        return 0

    newly = []
    for a in ACHIEVEMENTS:
        if a.key in unlocked: 
            continue
        if metric_value(a.metric) >= a.threshold:
            state.achievements.append(a.key)
            newly.append(a)

    for a in newly:
        log.add(f" 実績解除：{a.name} － {a.desc}")
