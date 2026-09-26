from pathlib import Path
import shutil
from PIL import Image, ImageDraw, ImageFont

# ===== D.El.Ed Buddy production watermark settings =====
BRAND_NAME = "D.El.Ed Buddy"
AUTHOR_NAME = "Prepared by Sayeem Sadik"
WATERMARK_COLOR = (18, 60, 70)
WATERMARK_OPACITY = 34
WATERMARK_ANGLE = -27

USE_LOGO = True
LOGO_FILENAME = "watermark-logo.png"
LOGO_HEIGHT_RATIO = 0.16
LOGO_OPACITY_MULTIPLIER = 0.90

# Set True only if you also want a tiny edge attribution.
USE_EDGE_ATTRIBUTION = True
EDGE_OPACITY = 75
EDGE_FONT_SIZE = 14

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}

# This script is in site/scripts/, so parent = site/
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent

INFOGRAPHICS_DIR = PROJECT_ROOT / "public" / "infographics"
BACKUP_DIR = PROJECT_ROOT / ".watermark-backups" / "infographics"
LOGO_PATH = PROJECT_ROOT / LOGO_FILENAME


def find_font(size, bold=False):
    candidates = (
        [Path(r"C:\Windows\Fonts\segoeuib.ttf"),
         Path(r"C:\Windows\Fonts\arialbd.ttf"),
         Path(r"C:\Windows\Fonts\Aptos-Bold.ttf")]
        if bold else
        [Path(r"C:\Windows\Fonts\segoeui.ttf"),
         Path(r"C:\Windows\Fonts\arial.ttf"),
         Path(r"C:\Windows\Fonts\Aptos.ttf")]
    )
    candidates.append(
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")
        if bold else
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
    )
    for p in candidates:
        if p.exists():
            return ImageFont.truetype(str(p), size=size)
    return ImageFont.load_default()


def backup_original(src):
    relative = src.relative_to(INFOGRAPHICS_DIR)
    dest = BACKUP_DIR / relative
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists():
        shutil.copy2(src, dest)
        print(f"  Backup created: {relative}")


def restore_original(src):
    relative = src.relative_to(INFOGRAPHICS_DIR)
    backup = BACKUP_DIR / relative
    if backup.exists():
        shutil.copy2(backup, src)


def load_logo(target_height):
    if not USE_LOGO or not LOGO_PATH.exists():
        return None
    with Image.open(LOGO_PATH) as original:
        logo = original.convert("RGBA")
    ratio = target_height / logo.height
    logo = logo.resize(
        (max(1, int(logo.width * ratio)), target_height),
        Image.Resampling.LANCZOS,
    )
    alpha = logo.getchannel("A")
    alpha = alpha.point(lambda v: int(v * LOGO_OPACITY_MULTIPLIER))
    logo.putalpha(alpha)
    return logo


def create_watermark(width, height):
    layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    m = min(width, height)

    brand_font = find_font(max(28, int(m * 0.055)), bold=True)
    author_font = find_font(max(15, int(m * 0.024)), bold=False)

    measure = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    bb1 = measure.textbbox((0, 0), BRAND_NAME, font=brand_font)
    bb2 = measure.textbbox((0, 0), AUTHOR_NAME, font=author_font)

    brand_w, brand_h = bb1[2] - bb1[0], bb1[3] - bb1[1]
    author_w, author_h = bb2[2] - bb2[0], bb2[3] - bb2[1]

    logo = load_logo(max(30, int(m * LOGO_HEIGHT_RATIO)))
    spacing = max(8, int(author_font.size * 0.35))
    logo_gap = max(12, int(author_font.size * 0.7)) if logo else 0

    total_w = max(brand_w, author_w, logo.width if logo else 0) + 30
    total_h = 30 + brand_h + spacing + author_h
    if logo:
        total_h += logo.height + logo_gap

    mark = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(mark)

    draw.rounded_rectangle(
        (0, 0, total_w - 1, total_h - 1),
        radius=max(10, int(author_font.size * 0.5)),
        fill=(255, 255, 255, max(3, WATERMARK_OPACITY // 8)),
    )

    y = 15
    if logo:
        mark.alpha_composite(logo, ((total_w - logo.width) // 2, y))
        y += logo.height + logo_gap

    draw.text(
        ((total_w - brand_w) // 2, y),
        BRAND_NAME,
        font=brand_font,
        fill=(*WATERMARK_COLOR, WATERMARK_OPACITY),
    )
    y += brand_h + spacing

    draw.text(
        ((total_w - author_w) // 2, y),
        AUTHOR_NAME,
        font=author_font,
        fill=(*WATERMARK_COLOR, int(WATERMARK_OPACITY * 0.9)),
    )

    mark = mark.rotate(
        WATERMARK_ANGLE,
        expand=True,
        resample=Image.Resampling.BICUBIC,
    )

    layer.alpha_composite(
        mark,
        ((width - mark.width) // 2, (height - mark.height) // 2),
    )
    return layer


def add_edge_attribution(image):
    if not USE_EDGE_ATTRIBUTION:
        return image

    width, height = image.size
    size = max(12, min(EDGE_FONT_SIZE, int(min(width, height) * 0.018)))
    font = find_font(size)
    text = BRAND_NAME

    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    bb = draw.textbbox((0, 0), text, font=font)
    margin = max(10, int(min(width, height) * 0.018))

    draw.text(
        (width - (bb[2] - bb[0]) - margin, height - (bb[3] - bb[1]) - margin),
        text,
        font=font,
        fill=(*WATERMARK_COLOR, EDGE_OPACITY),
    )
    return Image.alpha_composite(image, overlay)


def watermark_image(path):
    relative = path.relative_to(INFOGRAPHICS_DIR)
    print(f"Processing: {relative}")

    # If previously processed, restore the clean original first.
    restore_original(path)
    # Otherwise, create a backup of the current clean original.
    backup_original(path)

    with Image.open(path) as original:
        image = original.convert("RGBA")
        image = Image.alpha_composite(image, create_watermark(*image.size))
        image = add_edge_attribution(image)

        suffix = path.suffix.lower()
        if suffix in {".jpg", ".jpeg"}:
            image.convert("RGB").save(
                path, quality=95, optimize=True, progressive=True
            )
        elif suffix == ".webp":
            image.save(path, quality=95, method=6)
        else:
            image.save(path, optimize=True)


def main():
    if not INFOGRAPHICS_DIR.exists():
        raise SystemExit(f"Infographics folder not found:\n{INFOGRAPHICS_DIR}")

    files = sorted(
        p for p in INFOGRAPHICS_DIR.rglob("*")
        if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
    )

    if not files:
        print(f"No supported images found in:\n{INFOGRAPHICS_DIR}")
        return

    print("D.El.Ed Buddy — Production Infographic Watermarker")
    print("=================================================")
    print(f"Source: {INFOGRAPHICS_DIR}")
    print(f"Backup: {BACKUP_DIR}")
    print(f"Logo:   {LOGO_PATH if LOGO_PATH.exists() else 'Not found — text only'}")
    print(f"Images: {len(files)}")
    print(f'Watermark: "{BRAND_NAME}" / "{AUTHOR_NAME}"')
    print()

    for path in files:
        watermark_image(path)

    print()
    print(f"Done. Watermarked {len(files)} image(s).")
    print(f"Clean originals are backed up at:\n{BACKUP_DIR}")
    print("Preview the results before committing them to Git.")


if __name__ == "__main__":
    main()
