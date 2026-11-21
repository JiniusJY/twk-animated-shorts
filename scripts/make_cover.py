#!/usr/bin/env python3
"""TWK cover variants for the Boeing 787 248-day bug episode.
Palette per references/STYLE_BIBLE.md: paper #f1eddd, ink #26352f, red #cb4a32.
Photo: ANA Boeing 787-8 JA801A, CC BY-SA 3.0 (Spaceaero2 / Altair78, Wikimedia Commons).
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

W, H = 1080, 1920
PAPER = "#f1eddd"
INK = "#26352f"
RED = "#cb4a32"

SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
SANSB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

CREDIT = "Photo: Spaceaero2 / Altair78, CC BY-SA 3.0, via Wikimedia Commons"


def f(path, size):
    return ImageFont.truetype(path, size)


def draw_tracked(draw, xy, text, font, fill, tracking=0):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += font.getlength(ch) + tracking
    return x


def tracked_width(text, font, tracking=0):
    return sum(font.getlength(c) for c in text) + tracking * (len(text) - 1)


def draw_segments(draw, xy, segments, font):
    """segments: list of (text, fill)."""
    x, y = xy
    for text, fill in segments:
        draw.text((x, y), text, font=font, fill=fill)
        x += font.getlength(text)


def crop_to(im, tw, th, cx=None, cy=None):
    """Crop im to aspect tw:th centered on (cx, cy) fractions, then resize."""
    iw, ih = im.size
    target = tw / th
    if iw / ih > target:  # too wide
        ch = ih
        cw = int(ih * target)
    else:
        cw = iw
        ch = int(iw / target)
    cx = 0.5 if cx is None else cx
    cy = 0.5 if cy is None else cy
    left = int(min(max(cx * iw - cw / 2, 0), iw - cw))
    top = int(min(max(cy * ih - ch / 2, 0), ih - ch))
    return im.crop((left, top, left + cw, top + ch)).resize((tw, th), Image.LANCZOS)


def variant_a(photo):
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)
    M = 64

    # kicker
    kf = f(SANSB, 30)
    draw_tracked(d, (M, 84), "TECHWHOKNOWS", kf, RED, tracking=8)
    # hairline rule
    d.rectangle([M, 140, W - M, 142], fill=INK)

    # headline, serif bold, mixed ink/red
    hf = f(SERIF, 98)
    lh = 118
    y = 230
    draw_segments(d, (M, y), [("Every ", INK), ("248 days,", RED)], hf)
    draw_segments(d, (M, y + lh), [("this jet needed", INK)], hf)
    draw_segments(d, (M, y + 2 * lh), [("a reboot.", INK)], hf)

    # photo plate with ink frame
    plate_w = W - 2 * M
    plate_h = 740
    plate = crop_to(photo, plate_w, plate_h, cx=0.5, cy=0.47)
    py = 700
    d.rectangle([M - 3, py - 3, M + plate_w + 2, py + plate_h + 2], outline=INK, width=3)
    img.paste(plate, (M, py))

    # annotation under plate
    af = f(SANS, 33)
    d.text((M, py + plate_h + 34), "Boeing 787  ·  FAA airworthiness directive  ·  2015",
           font=af, fill=INK)

    # second hairline + credit near bottom edge (non-critical zone)
    cf = f(SANS, 22)
    d.rectangle([M, 1770, W - M, 1771], fill=INK)
    d.text((M, 1792), CREDIT, font=cf, fill=INK)
    return img


def variant_b(photo):
    # full-bleed photo: nose + 787 titles + engine; crop window x 134..1574 of 3840
    iw, ih = photo.size
    left = int(134 / 3840 * iw)
    cw = int(1440 / 3840 * iw)
    plate = photo.crop((left, 0, left + cw, ih)).resize((W, H), Image.LANCZOS)
    img = plate.convert("RGB")
    d = ImageDraw.Draw(img)

    # gentle darkening behind lower area so the band edge reads cleanly
    grad = Image.new("L", (1, H))
    for yy in range(H):
        v = 0
        if yy > 900:
            v = min(70, int((yy - 900) / (H - 900) * 70))
        grad.putpixel((0, yy), v)
    grad = grad.resize((W, H))
    dark = Image.new("RGB", (W, H), (20, 26, 23))
    img = Image.composite(dark, img, grad)
    d = ImageDraw.Draw(img)

    # paper band card
    bx0, by0, bx1, by1 = 48, 1150, W - 48, 1630
    d.rectangle([bx0, by0, bx1, by1], fill=PAPER, outline=INK, width=3)

    pad = 56
    kf = f(SANSB, 30)
    draw_tracked(d, (bx0 + pad, by0 + 48), "BOEING 787  ·  FAA, 2015", kf, RED, tracking=5)

    hf = f(SERIF, 92)
    d.text((bx0 + pad, by0 + 118), "Turn it off", font=hf, fill=INK)
    d.text((bx0 + pad, by0 + 118 + 112), "and on again.", font=hf, fill=INK)

    sf = f(SANS, 33)
    d.text((bx0 + pad, by0 + 118 + 2 * 112 + 26),
           "The 248-day software bug haunting the Dreamliner.", font=sf, fill=INK)

    # tiny credit, bottom edge over photo
    cf = f(SANS, 22)
    tw = cf.getlength(CREDIT)
    d.text((W - tw - 28, H - 40), CREDIT, font=cf, fill=(241, 237, 221))
    return img


def main():
    import argparse
    from pathlib import Path
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--photo", type=Path, required=True, help="Licensed real 787 source photograph; preserve attribution and license")
    parser.add_argument("--out-dir", type=Path, required=True)
    args = parser.parse_args()
    args.out_dir.mkdir(parents=True, exist_ok=True)
    photo = Image.open(args.photo).convert("RGB")
    for name, build in [("A", variant_a), ("B", variant_b)]:
        cover = build(photo)
        cover.save(args.out_dir / f"twk_787_cover_{name}.jpg", quality=92)
    print("Wrote two 1080x1920 cover candidates. Inspect pixels and crops before publishing.")


if __name__ == "__main__":
    main()
