#!/usr/bin/env python3
"""TWK cover variants for the FBI NCIC breach episode.
Palette per references/STYLE_BIBLE.md: paper #f1eddd, ink #26352f, red #cb4a32.
Variant A photo: FBI Building entrance with flags and sign, Tony Webster, CC BY 2.0 (Wikimedia Commons).
Variant B photo: J. Edgar Hoover Building at sunset, WalterFish, CC BY-SA 4.0 (Wikimedia Commons).
"""
from PIL import Image, ImageDraw, ImageFont, ImageOps
from pathlib import Path

W, H = 1080, 1920
PAPER = "#f1eddd"
INK = "#26352f"
RED = "#cb4a32"

SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
SANSB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

CREDIT_A = "Photo: Tony Webster, CC BY 2.0, via Wikimedia Commons"
CREDIT_B = "Photo: WalterFish, CC BY-SA 4.0, via Wikimedia Commons"


def f(path, size):
    return ImageFont.truetype(path, size)


def draw_tracked(draw, xy, text, font, fill, tracking=0):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += font.getlength(ch) + tracking
    return x


def draw_segments(draw, xy, segments, font):
    x, y = xy
    for text, fill in segments:
        draw.text((x, y), text, font=font, fill=fill)
        x += font.getlength(text)


def crop_to(im, tw, th, cx=None, cy=None):
    iw, ih = im.size
    target = tw / th
    if iw / ih > target:
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
    """photo: Webster entrance shot; plate frames the flags + FBI sign."""
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)
    M = 64

    kf = f(SANSB, 30)
    draw_tracked(d, (M, 84), "TECHWHOKNOWS", kf, RED, tracking=8)
    d.rectangle([M, 140, W - M, 142], fill=INK)

    hf = f(SERIF, 96)
    lh = 112
    y = 240
    draw_segments(d, (M, y), [("What ", INK), ("police", RED)], hf)
    draw_segments(d, (M, y + lh), [("know about ", INK), ("you.", RED)], hf)

    plate_w = W - 2 * M
    plate_h = 760
    # centered window on the Webster photo: both flags + the full FBI Building sign
    plate = crop_to(photo, plate_w, plate_h, cx=0.5)
    py = 660
    d.rectangle([M - 3, py - 3, M + plate_w + 2, py + plate_h + 2], outline=INK, width=3)
    img.paste(plate, (M, py))

    af = f(SANS, 33)
    d.text((M, py + plate_h + 34), "FBI crime database  ·  apparent breach  ·  Nov 2026",
           font=af, fill=INK)

    cf = f(SANS, 22)
    d.rectangle([M, 1770, W - M, 1771], fill=INK)
    d.text((M, 1792), CREDIT_A, font=cf, fill=INK)
    return img


def variant_b(photo):
    """photo: WalterFish sunset street view (portrait after EXIF); full-bleed."""
    iw, ih = photo.size
    cw = int(ih * W / H)
    left = int(min(max(0.5 * iw - cw / 2, 0), iw - cw))
    plate = photo.crop((left, 0, left + cw, ih)).resize((W, H), Image.LANCZOS)
    img = plate.convert("RGB")
    d = ImageDraw.Draw(img)

    grad = Image.new("L", (1, H))
    for yy in range(H):
        v = 0
        if yy > 850:
            v = min(80, int((yy - 850) / (H - 850) * 80))
        grad.putpixel((0, yy), v)
    grad = grad.resize((W, H))
    dark = Image.new("RGB", (W, H), (20, 26, 23))
    img = Image.composite(dark, img, grad)
    d = ImageDraw.Draw(img)

    bx0, by0, bx1, by1 = 48, 1120, W - 48, 1650
    d.rectangle([bx0, by0, bx1, by1], fill=PAPER, outline=INK, width=3)

    pad = 56
    kf = f(SANSB, 30)
    draw_tracked(d, (bx0 + pad, by0 + 48), "FBI  ·  NCIC  ·  NOV 2026", kf, RED, tracking=5)

    hf = f(SERIF, 96)
    d.text((bx0 + pad, by0 + 118), "Is your", font=hf, fill=INK)
    d.text((bx0 + pad, by0 + 118 + 112), "name in it?", font=hf, fill=RED)

    sf = f(SANS, 33)
    d.text((bx0 + pad, by0 + 118 + 2 * 112 + 30),
           "The crime database police check 10 million times a day.", font=sf, fill=INK)

    cf = f(SANS, 22)
    tw = cf.getlength(CREDIT_B)
    d.text((W - tw - 28, H - 40), CREDIT_B, font=cf, fill=(241, 237, 221))
    return img


def variant_c1(photo):
    """Bold-claim dark variant: 'Who hacked the FBI?' over darkened full-bleed HQ."""
    iw, ih = photo.size
    cw = int(ih * W / H)
    left = int(min(max(0.5 * iw - cw / 2, 0), iw - cw))
    plate = photo.crop((left, 0, left + cw, ih)).resize((W, H), Image.LANCZOS)
    black = Image.new("RGB", (W, H), (10, 12, 11))
    img = Image.blend(plate, black, 0.55)
    d = ImageDraw.Draw(img)

    kf = f(SANSB, 32)
    kw = sum(kf.getlength(c) + 7 for c in "FBI  ·  NCIC  ·  NOV 2026") - 7
    draw_tracked(d, ((W - kw) / 2, 600), "FBI  ·  NCIC  ·  NOV 2026", kf, RED, tracking=7)

    hf = f(SERIF, 148)
    lh = 172
    l1 = [("Who ", PAPER), ("hacked", RED)]
    l2 = [("the FBI?", PAPER)]
    w1 = sum(hf.getlength(t) for t, _ in l1)
    w2 = sum(hf.getlength(t) for t, _ in l2)
    draw_segments(d, ((W - w1) / 2, 690), l1, hf)
    draw_segments(d, ((W - w2) / 2, 690 + lh), l2, hf)

    cf = f(SANS, 22)
    tw = cf.getlength(CREDIT_B)
    d.text((W - tw - 28, H - 40), CREDIT_B, font=cf, fill=(241, 237, 221))
    return img


def variant_c2(photo):
    """Viewer-stakes paper variant: 'Every cop checks you here.'"""
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)
    M = 64

    kf = f(SANSB, 30)
    draw_tracked(d, (M, 84), "TECHWHOKNOWS", kf, RED, tracking=8)
    d.rectangle([M, 140, W - M, 142], fill=INK)

    hf = f(SERIF, 96)
    lh = 112
    y = 240
    draw_segments(d, (M, y), [("Every ", INK), ("cop", RED)], hf)
    draw_segments(d, (M, y + lh), [("checks ", INK), ("you", RED), (" here.", INK)], hf)

    plate_w = W - 2 * M
    plate_h = 760
    # centered window on the Webster photo: both flags + the full FBI Building sign
    plate = crop_to(photo, plate_w, plate_h, cx=0.5)
    py = 660
    d.rectangle([M - 3, py - 3, M + plate_w + 2, py + plate_h + 2], outline=INK, width=3)
    img.paste(plate, (M, py))

    af = f(SANS, 33)
    d.text((M, py + plate_h + 34), "FBI crime database  ·  apparent breach  ·  Nov 2026",
           font=af, fill=INK)

    cf = f(SANS, 22)
    d.rectangle([M, 1770, W - M, 1771], fill=INK)
    d.text((M, 1792), CREDIT_A, font=cf, fill=INK)
    return img


def main():
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--photo-a", type=Path, required=True, help="Licensed Webster FBI entrance photo (variant A plate)")
    parser.add_argument("--photo-b", type=Path, required=True, help="Licensed WalterFish sunset FBI HQ photo (variant B full-bleed)")
    parser.add_argument("--out-dir", type=Path, required=True)
    args = parser.parse_args()
    args.out_dir.mkdir(parents=True, exist_ok=True)
    a = variant_a(ImageOps.exif_transpose(Image.open(args.photo_a)).convert("RGB"))
    a.save(args.out_dir / "twk_ncic_cover_A.jpg", quality=92)
    b = variant_b(ImageOps.exif_transpose(Image.open(args.photo_b)).convert("RGB"))
    b.save(args.out_dir / "twk_ncic_cover_B.jpg", quality=92)
    c1 = variant_c1(ImageOps.exif_transpose(Image.open(args.photo_b)).convert("RGB"))
    c1.save(args.out_dir / "twk_ncic_cover_C1.jpg", quality=92)
    c2 = variant_c2(ImageOps.exif_transpose(Image.open(args.photo_a)).convert("RGB"))
    c2.save(args.out_dir / "twk_ncic_cover_C2.jpg", quality=92)
    print("Wrote four 1080x1920 NCIC cover candidates. Inspect pixels and crops before publishing.")


if __name__ == "__main__":
    main()
