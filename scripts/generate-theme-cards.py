#!/usr/bin/env python3
"""Generate SVG tarot card images for alternative deck themes.
Pure Python standard library — zero dependencies.
Outputs SVG files that the backend serves via /api/theme-images/"""

import os, math, json

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "theme-cards")

# ── Card Data ──

MAJOR_NAMES = [
    (0, "The Fool", "愚者", "fool"),
    (1, "The Magician", "魔术师", "magician"),
    (2, "The High Priestess", "女祭司", "high-priestess"),
    (3, "The Empress", "女皇", "empress"),
    (4, "The Emperor", "皇帝", "emperor"),
    (5, "The Hierophant", "教皇", "hierophant"),
    (6, "The Lovers", "恋人", "lovers"),
    (7, "The Chariot", "战车", "chariot"),
    (8, "Strength", "力量", "strength"),
    (9, "The Hermit", "隐士", "hermit"),
    (10, "Wheel of Fortune", "命运之轮", "wheel-of-fortune"),
    (11, "Justice", "正义", "justice"),
    (12, "The Hanged Man", "倒吊人", "hanged-man"),
    (13, "Death", "死神", "death"),
    (14, "Temperance", "节制", "temperance"),
    (15, "The Devil", "恶魔", "devil"),
    (16, "The Tower", "塔", "tower"),
    (17, "The Star", "星星", "star"),
    (18, "The Moon", "月亮", "moon"),
    (19, "The Sun", "太阳", "sun"),
    (20, "Judgement", "审判", "judgement"),
    (21, "The World", "世界", "world"),
]

MINOR_NAMES_CN = {
    1: "王牌", 2: "二", 3: "三", 4: "四", 5: "五",
    6: "六", 7: "七", 8: "八", 9: "九", 10: "十",
    11: "侍从", 12: "骑士", 13: "皇后", 14: "国王",
}
MINOR_NAMES_EN = {
    1: "Ace", 2: "Two", 3: "Three", 4: "Four", 5: "Five",
    6: "Six", 7: "Seven", 8: "Eight", 9: "Nine", 10: "Ten",
    11: "Page", 12: "Knight", 13: "Queen", 14: "King",
}

SUITS = [
    ("wands", "权杖", "Wands", "fire"),
    ("cups", "圣杯", "Cups", "water"),
    ("swords", "宝剑", "Swords", "air"),
    ("pentacles", "星币", "Pentacles", "earth"),
]

ROMAN = ["0","I","II","III","IV","V","VI","VII","VIII","IX","X",
         "XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX","XXI"]

# ── SVG Helpers ──

def svg_tag(tag, attrs=None, inner="", **extra):
    a = []
    if attrs:
        for k, v in attrs.items():
            a.append(f'{k}="{v}"')
    for k, v in extra.items():
        a.append(f'{k.replace("_","-")}="{v}"')
    return f'<{tag} {" ".join(a)}>{inner}</{tag}>'

def svg_rect(x, y, w, h, **attrs):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" {" ".join(f"{k.replace(chr(95),chr(45))}={v!r}" for k,v in attrs.items())}" />'

# ── Theme: Marseille (马赛风格) ──

def gen_marseille_major(num, name_en, name_cn, slug):
    """Generate a Marseille-style major arcana card SVG"""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 500" width="300" height="500">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#faf3e0"/>
      <stop offset="100%" stop-color="#f0e6c8"/>
    </linearGradient>
    <pattern id="hatch" width="8" height="8" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="8" stroke="#d4a853" stroke-width="0.3" opacity="0.15"/>
    </pattern>
  </defs>
  <!-- Background -->
  <rect width="300" height="500" fill="url(#bg)" rx="12"/>
  <rect width="300" height="500" fill="url(#hatch)" rx="12"/>
  <!-- Inner border -->
  <rect x="16" y="16" width="268" height="468" fill="none" stroke="#8b1a1a" stroke-width="2.5" rx="8"/>
  <rect x="22" y="22" width="256" height="456" fill="none" stroke="#1a3a6b" stroke-width="1" rx="6"/>
  <!-- Top section: Roman numeral -->
  <text x="150" y="75" text-anchor="middle" font-family="Georgia,serif" font-size="36" fill="#8b1a1a" font-weight="bold">{ROMAN[num]}</text>
  <!-- Center: decorative circle with suit symbol -->
  <circle cx="150" cy="240" r="70" fill="none" stroke="#1a3a6b" stroke-width="1.5"/>
  <circle cx="150" cy="240" r="62" fill="none" stroke="#d4a853" stroke-width="0.8" stroke-dasharray="4 3"/>
  <!-- Central ornament -->
  <text x="150" y="255" text-anchor="middle" font-family="Georgia,serif" font-size="60" fill="#8b1a1a" opacity="0.8">✧</text>
  <!-- Card number circle -->
  <circle cx="150" cy="240" r="24" fill="#faf3e0" stroke="#1a3a6b" stroke-width="1"/>
  <text x="150" y="249" text-anchor="middle" font-family="Georgia,serif" font-size="22" fill="#1a3a6b">{num}</text>
  <!-- Bottom section: Name -->
  <text x="150" y="400" text-anchor="middle" font-family="Georgia,serif" font-size="22" fill="#1a3a6b" font-weight="bold">{name_cn}</text>
  <text x="150" y="425" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="#8b1a1a" font-style="italic">{name_en}</text>
  <!-- Decorative corner flourishes -->
  <text x="34" y="40" font-size="14" fill="#d4a853" opacity="0.5">◆</text>
  <text x="266" y="40" font-size="14" fill="#d4a853" opacity="0.5">◆</text>
  <text x="34" y="480" font-size="14" fill="#d4a853" opacity="0.5">◆</text>
  <text x="266" y="480" font-size="14" fill="#d4a853" opacity="0.5">◆</text>
</svg>'''

def gen_marseille_minor(num, suit_en, suit_cn, suit_element):
    """Generate a Marseille-style minor arcana card SVG"""
    suit_symbols = {"wands": "🜂", "cups": "🜄", "swords": "🜁", "pentacles": "🜃"}
    suit_colors = {"wands": "#c0392b", "cups": "#2980b9", "swords": "#7d8c2e", "pentacles": "#8b6914"}
    color = suit_colors.get(suit_en, "#1a3a6b")
    symbol = suit_symbols.get(suit_en, "✦")
    name_cn = MINOR_NAMES_CN.get(num, str(num))
    name_en = MINOR_NAMES_EN.get(num, str(num))

    # Generate N small suit symbols in a grid pattern
    rows = min(num, 4)
    cols = math.ceil(num / rows) if rows > 0 else 1
    symbols_svg = ""
    if num <= 10:
        spacing_x = 240 // (cols + 1)
        spacing_y = 200 // (rows + 1)
        start_x = 30 + (300 - (cols * spacing_x)) // 2
        start_y = 140 + (300 - (rows * spacing_y)) // 2
        for r in range(rows):
            for c in range(cols):
                idx = r * cols + c
                if idx < num:
                    x = start_x + c * spacing_x
                    y = start_y + r * spacing_y
                    symbols_svg += f'<text x="{x}" y="{y}" font-size="28" fill="{color}" text-anchor="middle" opacity="0.9">{symbol}</text>\n'

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 500" width="300" height="500">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#faf3e0"/>
      <stop offset="100%" stop-color="#f0e6c8"/>
    </linearGradient>
  </defs>
  <rect width="300" height="500" fill="url(#bg)" rx="12"/>
  <rect x="16" y="16" width="268" height="468" fill="none" stroke="{color}" stroke-width="2.5" rx="8"/>
  <rect x="22" y="22" width="256" height="456" fill="none" stroke="#1a3a6b" stroke-width="1" rx="6"/>
  <!-- Top: suit + number -->
  <text x="150" y="65" text-anchor="middle" font-family="Georgia,serif" font-size="20" fill="{color}" font-weight="bold">{suit_cn}{name_cn}</text>
  <text x="150" y="86" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="#8b1a1a">{name_en} of {suit_en.title()}</text>
  <!-- Center: symbols -->
  {symbols_svg}
  <!-- If court card (11-14), show large symbol + role icon -->
  {f'<text x="150" y="280" font-size="80" fill="{color}" text-anchor="middle" opacity="0.7">{symbol}</text>' if num > 10 else ''}
  {f'<text x="150" y="370" font-size="28" fill="{color}" text-anchor="middle" font-weight="bold">{name_cn}</text>' if num > 10 else ''}
  <!-- Bottom -->
  <text x="150" y="440" text-anchor="middle" font-size="16" fill="#1a3a6b">{suit_cn}</text>
  <!-- Corners -->
  <text x="30" y="35" font-size="12" fill="{color}" opacity="0.6">{symbol}</text>
  <text x="270" y="35" font-size="12" fill="{color}" opacity="0.6">{symbol}</text>
  <text x="30" y="482" font-size="12" fill="{color}" opacity="0.6">{symbol}</text>
  <text x="270" y="482" font-size="12" fill="{color}" opacity="0.6">{symbol}</text>
</svg>'''

# ── Theme: Modern Minimalist (现代极简) ──

def gen_minimal_major(num, name_en, name_cn, slug):
    """Generate a minimalist modern major arcana card SVG"""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 500" width="300" height="500">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1a2e"/>
      <stop offset="100%" stop-color="#16213e"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="300" height="500" fill="url(#bg)" rx="8"/>
  <!-- Subtle border -->
  <rect x="12" y="12" width="276" height="476" fill="none" stroke="rgba(212,168,83,0.3)" stroke-width="1" rx="6"/>
  <!-- Top line accent -->
  <line x1="60" y1="50" x2="240" y2="50" stroke="rgba(212,168,83,0.4)" stroke-width="0.5"/>
  <!-- Roman numeral -->
  <text x="150" y="85" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="20" fill="rgba(212,168,83,0.5)" font-weight="300" letter-spacing="6">{ROMAN[num]}</text>
  <!-- Center: geometric ornament -->
  <circle cx="150" cy="230" r="75" fill="none" stroke="rgba(212,168,83,0.12)" stroke-width="0.5"/>
  <circle cx="150" cy="230" r="50" fill="none" stroke="rgba(212,168,83,0.08)" stroke-width="0.5" stroke-dasharray="3 5"/>
  <text x="150" y="255" text-anchor="middle" font-size="64" fill="rgba(192,132,252,0.5)">✧</text>
  <!-- Number -->
  <text x="150" y="175" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="14" fill="rgba(255,255,255,0.3)">{num:02d}</text>
  <!-- Bottom section -->
  <line x1="60" y1="380" x2="240" y2="380" stroke="rgba(212,168,83,0.3)" stroke-width="0.5"/>
  <text x="150" y="420" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="24" fill="#d4a853" font-weight="300" letter-spacing="2">{name_cn}</text>
  <text x="150" y="448" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="10" fill="rgba(255,255,255,0.35)" letter-spacing="3">{name_en.upper()}</text>
</svg>'''

def gen_minimal_minor(num, suit_en, suit_cn, suit_element):
    suit_symbols = {"wands": "◆", "cups": "●", "swords": "▲", "pentacles": "■"}
    suit_colors = {"wands": "#e74c3c", "cups": "#3498db", "swords": "#2ecc71", "pentacles": "#f39c12"}
    color = suit_colors.get(suit_en, "#d4a853")
    symbol = suit_symbols.get(suit_en, "✦")
    name_cn = MINOR_NAMES_CN.get(num, str(num))
    name_en = MINOR_NAMES_EN.get(num, str(num))

    # Generate N symbols arranged minimalist way
    symbols_svg = ""
    if num <= 10:
        cols = min(num, 5)
        rows = math.ceil(num / cols)
        cell_w = 200 // cols
        cell_h = 200 // rows
        start_x = (300 - cols * cell_w) // 2
        start_y = 150 + (300 - rows * cell_h) // 2
        for r in range(rows):
            for c in range(cols):
                idx = r * cols + c
                if idx < num:
                    x = start_x + c * cell_w + cell_w // 2
                    y = start_y + r * cell_h + cell_h // 2
                    symbols_svg += f'<text x="{x}" y="{y}" font-size="18" fill="{color}" text-anchor="middle" opacity="0.8">{symbol}</text>\n'

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 500" width="300" height="500">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1a2e"/>
      <stop offset="100%" stop-color="#16213e"/>
    </linearGradient>
  </defs>
  <rect width="300" height="500" fill="url(#bg)" rx="8"/>
  <rect x="12" y="12" width="276" height="476" fill="none" stroke="rgba(212,168,83,0.25)" stroke-width="1" rx="6"/>
  <!-- Top -->
  <text x="150" y="55" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="16" fill="{color}" font-weight="300" letter-spacing="3">{suit_cn}{name_cn}</text>
  <line x1="80" y1="72" x2="220" y2="72" stroke="{color}" stroke-width="0.5" opacity="0.3"/>
  <!-- Symbols -->
  {symbols_svg}
  <!-- Court card large symbol -->
  {f'<text x="150" y="280" font-size="72" fill="{color}" text-anchor="middle" opacity="0.5">{symbol}</text>' if num > 10 else ''}
  {f'<text x="150" y="360" font-size="22" fill="{color}" text-anchor="middle" font-weight="300" letter-spacing="4">{name_cn}</text>' if num > 10 else ''}
  <!-- Bottom -->
  <line x1="80" y1="430" x2="220" y2="430" stroke="{color}" stroke-width="0.5" opacity="0.3"/>
  <text x="150" y="458" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="10" fill="rgba(255,255,255,0.3)" letter-spacing="3">{name_en.upper()} OF {suit_en.upper()}</text>
</svg>'''

# ── Generate all cards ──

def generate():
    themes = {
        "marseille": {
            "major": gen_marseille_major,
            "minor": gen_marseille_minor,
        },
        "modern-minimal": {
            "major": gen_minimal_major,
            "minor": gen_minimal_minor,
        },
    }

    for theme_id, generators in themes.items():
        theme_dir = os.path.join(OUT_DIR, theme_id)
        os.makedirs(theme_dir, exist_ok=True)

        # Major Arcana
        for num, name_en, name_cn, slug in MAJOR_NAMES:
            svg = generators["major"](num, name_en, name_cn, slug)
            filename = f"{num:02d}-{slug}.svg"
            with open(os.path.join(theme_dir, filename), "w", encoding="utf-8") as f:
                f.write(svg)

        # Minor Arcana
        for suit_en, suit_cn, suit_name, suit_element in SUITS:
            for num in range(1, 15):
                svg = generators["minor"](num, suit_en, suit_cn, suit_element)
                filename = f"{suit_en}-{num:02d}.svg"
                with open(os.path.join(theme_dir, filename), "w", encoding="utf-8") as f:
                    f.write(svg)

        print(f"[{theme_id}] Generated {len(MAJOR_NAMES) + 4*14} cards in {theme_dir}")

    # Also generate a manifest
    manifest = {
        "marseille": {"name": "马赛风格", "description": "法式经典 Marseille 风格牌面", "icon": "🎴"},
        "modern-minimal": {"name": "现代极简", "description": "简约几何现代风格牌面", "icon": "✨"},
    }
    with open(os.path.join(OUT_DIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    generate()
    print("Done. All theme cards generated.")
