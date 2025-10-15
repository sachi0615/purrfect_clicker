import pygame
from config import CARD, BORDER, LOG_BG, TEXT

class Button:
    def __init__(self, rect, text, font, *, bg=CARD, border=BORDER, fg=TEXT):
        self.rect = pygame.Rect(rect)
        self.text = text
        self.font = font
        self.bg = bg
        self.border = border
        self.fg = fg
        self.disabled = False

    def draw(self, screen):
        color = self.bg if not self.disabled else (self.bg[0], self.bg[1], max(0, self.bg[2]-20))
        pygame.draw.rect(screen, color, self.rect, border_radius=14)
        pygame.draw.rect(screen, self.border, self.rect, 2, border_radius=14)
        label = self.font.render(self.text, True, self.fg)
        screen.blit(label, label.get_rect(center=self.rect.center))

    def clicked(self, ev):
        return (not self.disabled) and ev.type == pygame.MOUSEBUTTONDOWN and ev.button == 1 and self.rect.collidepoint(ev.pos)

def draw_card(screen, rect):
    pygame.draw.rect(screen, CARD, rect, border_radius=16)
    pygame.draw.rect(screen, BORDER, rect, 2, border_radius=16)

def draw_pill(screen, rect, text, font):
    pygame.draw.rect(screen, (40, 34, 64), rect, border_radius=999)
    pygame.draw.rect(screen, BORDER, rect, 1, border_radius=999)
    label = font.render(text, True, TEXT)
    screen.blit(label, label.get_rect(center=rect.center))

class Log:
    def __init__(self, font, max_lines=100):
        self.lines = []
        self.font = font
        self.max_lines = max_lines

    def add(self, msg):
        import time
        t = time.strftime("%H:%M:%S")
        self.lines.insert(0, f"[{t}] {msg}")
        self.lines = self.lines[:self.max_lines]

    def draw(self, screen, rect):
        pygame.draw.rect(screen, LOG_BG, rect, border_radius=8)
        pygame.draw.rect(screen, BORDER, rect, 1, border_radius=8)
        y = rect.y + 6
        for line in self.lines[:12]:
            surf = self.font.render(line, True, TEXT)
            screen.blit(surf, (rect.x + 8, y))
            y += self.font.get_linesize()

def confirm_dialog(screen, font_h1, font, message: str) -> bool:
    import pygame
    from config import CARD, BORDER
    from config import W, H
    overlay = pygame.Surface((W, H), pygame.SRCALPHA)
    overlay.fill((0,0,0,160))
    rect = pygame.Rect(0,0,520,200); rect.center = (W//2, H//2)
    ok_btn = Button((rect.x+60, rect.bottom-60, 160, 40), "OK", font)
    cancel_btn = Button((rect.right-60-160, rect.bottom-60, 160, 40), "キャンセル", font)

    while True:
        for ev in pygame.event.get():
            if ev.type == pygame.QUIT:
                pygame.quit(); raise SystemExit
            if ok_btn.clicked(ev): return True
            if cancel_btn.clicked(ev): return False

        screen.blit(overlay, (0,0))
        pygame.draw.rect(screen, CARD, rect, border_radius=16)
        pygame.draw.rect(screen, BORDER, rect, 2, border_radius=16)

        # メッセージ簡易折返し
        lines = []
        for line in message.split("\n"):
            if font_h1.size(line)[0] <= rect.w-40:
                lines.append(line)
            else:
                cur = ""
                for ch in line:
                    if font_h1.size(cur+ch)[0] <= rect.w-40:
                        cur += ch
                    else:
                        lines.append(cur); cur = ch
                if cur: lines.append(cur)
        y = rect.y + 24
        for l in lines:
            surf = font_h1.render(l, True, TEXT)
            screen.blit(surf, surf.get_rect(centerx=rect.centerx, y=y))
            y += font_h1.get_linesize() + 4

        ok_btn.draw(screen); cancel_btn.draw(screen)
        pygame.display.flip()
        pygame.time.delay(10)
