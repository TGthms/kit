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
PILL_BG = (255, 255, 255, 28)
PILL_FG = (244, 244, 247, 255)

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
        draw.rounded_rectangle((cx, y, cx + w, y + h), radius=h // 2, fill=PILL_BG)
        # Vertically center using bbox offset
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
    pill_font = font("text_medium", 28)
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


if __name__ == "__main__":
    render()
