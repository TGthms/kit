#!/usr/bin/env python3
"""Render Kit's Open Graph image (1200×630) from the brand mark + SF Pro."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
ICON = ROOT / "public" / "icons" / "icon-512.png"
OUT = ROOT / "public" / "og" / "kit.png"

W, H = 2400, 1260  # 2×, then downscale
FINAL = (1200, 630)

BG = (7, 9, 15, 255)
GLOW = (10, 132, 255)
WHITE = (255, 255, 255, 255)
TITLE = (255, 255, 255, 255)
SUB = (199, 199, 204, 255)
ACCENT = (100, 210, 255, 255)
MUTED = (142, 142, 147, 255)
LINE = (255, 255, 255, 28)
PILL_BG = (6, 10, 18, 150)
PILL_STROKE = (255, 255, 255, 38)
PILL_FG = (174, 180, 190, 255)

FONTS = {
    "display_bold": "/Library/Fonts/SF-Pro-Display-Bold.otf",
    "display_medium": "/Library/Fonts/SF-Pro-Display-Medium.otf",
    "text_regular": "/Library/Fonts/SF-Pro-Text-Regular.otf",
    "text_medium": "/Library/Fonts/SF-Pro-Text-Medium.otf",
}


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONTS[name], size)


def radial_glow(size: tuple[int, int], center: tuple[int, int], radius: int, color: tuple[int, int, int], strength: int) -> Image.Image:
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    cx, cy = center
    # Draw a soft disk then blur heavily.
    blob = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(blob)
    d.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=(*color, strength))
    blob = blob.filter(ImageFilter.GaussianBlur(radius=int(radius * 0.55)))
    layer = Image.alpha_composite(layer, blob)
    return layer


def rounded_icon(src: Path, box: int, radius: int) -> Image.Image:
    im = Image.open(src).convert("RGBA").resize((box, box), Image.Resampling.LANCZOS)
    mask = Image.new("L", (box, box), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, box, box), radius=radius, fill=255)
    out = Image.new("RGBA", (box, box), (0, 0, 0, 0))
    out.paste(im, (0, 0), mask)
    return out


def drop_shadow(img: Image.Image, offset: tuple[int, int], blur: int, alpha: int) -> Image.Image:
    w, h = img.size
    pad = blur * 2
    canvas = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    # Use alpha of the icon as shadow silhouette.
    a = img.split()[-1].point(lambda p: alpha if p > 8 else 0)
    shadow.putalpha(a)
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    ox, oy = offset
    canvas.paste(shadow, (pad + ox, pad + oy), shadow)
    canvas.alpha_composite(img, (pad, pad))
    return canvas


def draw_pills(draw: ImageDraw.ImageDraw, labels: list[str], x: int, y: int, fnt: ImageFont.FreeTypeFont) -> None:
    gap = 16
    pad_x, pad_y = 28, 14
    cx = x
    for label in labels:
        bbox = draw.textbbox((0, 0), label, font=fnt)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        w, h = tw + pad_x * 2, th + pad_y * 2
        draw.rounded_rectangle(
            (cx, y, cx + w, y + h),
            radius=h // 2,
            fill=PILL_BG,
            outline=PILL_STROKE,
            width=2,
        )
        draw.text((cx + pad_x, y + pad_y - bbox[1]), label, font=fnt, fill=PILL_FG)
        cx += w + gap


def render() -> None:
    img = Image.new("RGBA", (W, H), BG)
    # Atmosphere
    img = Image.alpha_composite(img, radial_glow((W, H), (520, 620), 720, GLOW, 110))
    img = Image.alpha_composite(img, radial_glow((W, H), (1900, -80), 680, (88, 86, 214), 40))
    img = Image.alpha_composite(img, radial_glow((W, H), (2100, 1400), 520, GLOW, 36))

    draw = ImageDraw.Draw(img)
    # Hairline frame
    inset = 3
    draw.rounded_rectangle((inset, inset, W - inset - 1, H - inset - 1), radius=0, outline=LINE, width=2)

    icon = rounded_icon(ICON, 360, 84)
    icon = drop_shadow(icon, offset=(0, 28), blur=36, alpha=110)
    img.alpha_composite(icon, (136, 430))

    title_font = font("display_bold", 168)
    sub_font = font("text_regular", 48)
    accent_font = font("display_medium", 46)
    pill_font = font("text_medium", 30)
    url_font = font("text_regular", 30)

    text_x = 620
    # Optical vertical group
    draw.text((text_x, 318), "Kit", font=title_font, fill=TITLE)
    draw.text((text_x, 530), "Everyday tools in your browser.", font=sub_font, fill=SUB)
    draw.text((text_x, 602), "Private by design.", font=accent_font, fill=ACCENT)

    draw_pills(
        draw,
        ["PDF", "Images", "Audio", "Video", "Data", "Developer"],
        text_x,
        740,
        pill_font,
    )

    # Footer rule + URL
    draw.line((160, 1088, W - 160, 1088), fill=LINE, width=2)
    draw.text((160, 1124), "trykit.pages.dev", font=url_font, fill=MUTED)
    draw.text((W - 160, 1124), "Runs on your device", font=url_font, fill=MUTED, anchor="ra")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    final = img.convert("RGB").resize(FINAL, Image.Resampling.LANCZOS)
    final.save(OUT, "PNG", optimize=True)
    print(f"wrote {OUT.relative_to(ROOT)} ({final.size[0]}×{final.size[1]})")


def wrap_text(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    if not words:
        return [text]
    lines: list[str] = []
    current = words[0]
    for word in words[1:]:
        trial = f"{current} {word}"
        bbox = draw.textbbox((0, 0), trial, font=fnt)
        if bbox[2] - bbox[0] <= max_width:
            current = trial
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines[:3]


def render_tool(tool_id: str, name: str, category: str) -> None:
    img = Image.new("RGBA", (W, H), BG)
    img = Image.alpha_composite(img, radial_glow((W, H), (520, 620), 720, GLOW, 110))
    img = Image.alpha_composite(img, radial_glow((W, H), (1900, -80), 680, (88, 86, 214), 40))
    draw = ImageDraw.Draw(img)
    inset = 3
    draw.rounded_rectangle((inset, inset, W - inset - 1, H - inset - 1), radius=0, outline=LINE, width=2)

    icon = rounded_icon(ICON, 280, 68)
    icon = drop_shadow(icon, offset=(0, 22), blur=28, alpha=100)
    img.alpha_composite(icon, (160, 470))

    kit_font = font("display_medium", 52)
    name_font = font("display_bold", 96)
    cat_font = font("text_medium", 36)
    url_font = font("text_regular", 30)

    text_x = 520
    draw.text((text_x, 300), "Kit", font=kit_font, fill=ACCENT)
    lines = wrap_text(draw, name, name_font, W - text_x - 160)
    y = 380
    for line in lines:
        draw.text((text_x, y), line, font=name_font, fill=TITLE)
        y += 110
    draw.text((text_x, y + 12), category, font=cat_font, fill=SUB)

    draw.line((160, 1088, W - 160, 1088), fill=LINE, width=2)
    draw.text((160, 1124), "trykit.pages.dev", font=url_font, fill=MUTED)
    draw.text((W - 160, 1124), "Runs on your device", font=url_font, fill=MUTED, anchor="ra")

    out = ROOT / "public" / "og" / "tools" / f"{tool_id}.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    final = img.convert("RGB").resize(FINAL, Image.Resampling.LANCZOS)
    final.save(out, "PNG", optimize=True)


def tool_categories() -> dict[str, str]:
    import re

    src = (ROOT / "src" / "lib" / "tools" / "registry.ts").read_text()
    return dict(re.findall(r'id:\s*"([a-z0-9-]+)"\s*,\s*category:\s*"([a-z]+)"', src))


def render_tools() -> None:
    import json

    messages = json.loads((ROOT / "messages" / "en.json").read_text())
    tools = messages["tools"]
    categories = messages["categories"]
    cats = tool_categories()
    count = 0
    for tool_id, entry in tools.items():
        name = entry.get("name")
        if not isinstance(name, str) or not name.strip():
            continue
        public_id = "world-clock" if tool_id == "timezone-converter" else tool_id
        family = cats.get(tool_id, "")
        category = str(categories.get(family, "Kit"))
        render_tool(public_id, name.strip(), category)
        count += 1
    print(f"wrote {count} tool OG images")


if __name__ == "__main__":
    import sys

    if "--tools" in sys.argv:
        render_tools()
    else:
        render()

