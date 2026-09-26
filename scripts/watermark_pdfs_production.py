#!/usr/bin/env python3
"""
D.El.Ed Buddy — Production PDF Watermarker

PROJECT STRUCTURE
-----------------
site/
├── scripts/
│   └── watermark_pdfs.py              <-- this script
├── watermark-logo.png                 <-- optional logo
├── public/
│   └── downloads/
│       ├── s1-1-study-notes.pdf
│       ├── s1-1-detailed-notes.pdf
│       ├── ...
│       └── pyqs/
│           └── ...
└── ...

The script recursively processes every PDF inside:
    site/public/downloads/

Clean originals are backed up to:
    site/.watermark-backups/downloads/

The backup preserves the exact folder structure.

Each PDF page receives:
1. One large, subtle diagonal D.El.Ed Buddy signature.
2. A small D.El.Ed Buddy attribution near the bottom-right.

Requires:
    pip install pypdf reportlab pillow

IMPORTANT:
- The script never intentionally stacks watermarks.
- If a clean backup exists, it restores that version before applying
  the watermark again.
- Preview several PDFs before committing the results to Git.
"""

from pathlib import Path
import shutil
import io

from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


# ═════════════════════════════════════════════════════════════
# WATERMARK SETTINGS
# ═════════════════════════════════════════════════════════════

BRAND_NAME = "D.El.Ed Buddy"
AUTHOR_NAME = "Prepared by Sayeem Sadik"

# Deep teal/navy — intended to match the infographic watermark.
WATERMARK_COLOR = (18 / 255, 60 / 255, 70 / 255)

# Main diagonal watermark.
# 0.10–0.16 is a good subtle range.
MAIN_OPACITY = 0.13
MAIN_ANGLE = 27

# Small bottom-right attribution.
EDGE_ENABLED = True
EDGE_OPACITY = 0.42

# Optional logo.
USE_LOGO = True
LOGO_FILENAME = "watermark-logo.png"

# Relative size of the main watermark compared with page width.
MAIN_WIDTH_RATIO = 0.48

# How far from the bottom/right edge the small attribution sits.
EDGE_MARGIN_RATIO = 0.018

# PDFs to process.
PDF_EXTENSION = ".pdf"


# ═════════════════════════════════════════════════════════════
# PROJECT PATHS
# ═════════════════════════════════════════════════════════════

# Script:
#     site/scripts/watermark_pdfs.py
#
# Therefore:
#     SCRIPT_DIR   = site/scripts
#     PROJECT_ROOT = site

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent

PDF_DIR = PROJECT_ROOT / "public" / "downloads"
BACKUP_DIR = PROJECT_ROOT / ".watermark-backups" / "downloads"
LOGO_PATH = PROJECT_ROOT / LOGO_FILENAME


# ═════════════════════════════════════════════════════════════
# FONTS
# ═════════════════════════════════════════════════════════════

def register_fonts():
    """Register a Unicode-capable Windows font if available."""
    regular_candidates = [
        Path(r"C:\Windows\Fonts\segoeui.ttf"),
        Path(r"C:\Windows\Fonts\arial.ttf"),
        Path(r"C:\Windows\Fonts\Aptos.ttf"),
    ]

    bold_candidates = [
        Path(r"C:\Windows\Fonts\segoeuib.ttf"),
        Path(r"C:\Windows\Fonts\arialbd.ttf"),
        Path(r"C:\Windows\Fonts\Aptos-Bold.ttf"),
    ]

    regular = next((p for p in regular_candidates if p.exists()), None)
    bold = next((p for p in bold_candidates if p.exists()), None)

    if regular:
        pdfmetrics.registerFont(
            TTFont("DLEDBuddyRegular", str(regular))
        )
        regular_name = "DLEDBuddyRegular"
    else:
        regular_name = "Helvetica"

    if bold:
        pdfmetrics.registerFont(
            TTFont("DLEDBuddyBold", str(bold))
        )
        bold_name = "DLEDBuddyBold"
    else:
        bold_name = "Helvetica-Bold"

    return regular_name, bold_name


REGULAR_FONT, BOLD_FONT = register_fonts()


# ═════════════════════════════════════════════════════════════
# BACKUP / RESTORE
# ═════════════════════════════════════════════════════════════

def backup_original(src: Path):
    relative = src.relative_to(PDF_DIR)
    destination = BACKUP_DIR / relative

    destination.parent.mkdir(parents=True, exist_ok=True)

    if not destination.exists():
        shutil.copy2(src, destination)
        print(f"  Backup created: {relative}")


def restore_original(src: Path):
    relative = src.relative_to(PDF_DIR)
    backup = BACKUP_DIR / relative

    if backup.exists():
        shutil.copy2(backup, src)


# ═════════════════════════════════════════════════════════════
# WATERMARK OVERLAY
# ═════════════════════════════════════════════════════════════

def create_page_overlay(width: float, height: float) -> io.BytesIO:
    """
    Create a one-page transparent PDF overlay containing:
      - large diagonal signature
      - small bottom-right attribution
    """

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=(width, height))

    # ---------------------------------------------------------
    # Main diagonal signature
    # ---------------------------------------------------------

    target_width = width * MAIN_WIDTH_RATIO

    brand_size = max(24, min(48, target_width * 0.075))
    author_size = max(12, min(24, brand_size * 0.42))

    # Estimate the signature block dimensions.
    brand_width = pdfmetrics.stringWidth(
        BRAND_NAME,
        BOLD_FONT,
        brand_size,
    )

    author_width = pdfmetrics.stringWidth(
        AUTHOR_NAME,
        REGULAR_FONT,
        author_size,
    )

    block_width = max(brand_width, author_width)
    block_height = brand_size + author_size + 18

    # Optional logo.
    logo = None
    logo_width = 0
    logo_height = 0

    if USE_LOGO and LOGO_PATH.exists():
        try:
            logo = ImageReader(str(LOGO_PATH))
            iw, ih = logo.getSize()

            logo_height = min(
                height * 0.11,
                max(34, target_width * 0.16),
            )
            logo_width = logo_height * (iw / ih)
        except Exception as exc:
            print(f"  Warning: could not load watermark logo: {exc}")
            logo = None

    if logo:
        block_width = max(block_width, logo_width)
        block_height += logo_height + 10

    # Keep the entire signature centered on the page.
    cx = width / 2
    cy = height / 2

    c.saveState()

    c.translate(cx, cy)
    c.rotate(MAIN_ANGLE)

    # Very subtle white backing makes the mark readable on both
    # light and dark pages without creating a large visible box.
    c.setFillColorRGB(1, 1, 1)
    c.setFillAlpha(0.025)

    pad = 12
    c.roundRect(
        -block_width / 2 - pad,
        -block_height / 2 - pad,
        block_width + pad * 2,
        block_height + pad * 2,
        10,
        stroke=0,
        fill=1,
    )

    c.setFillColorRGB(*WATERMARK_COLOR)
    c.setFillAlpha(MAIN_OPACITY)

    current_y = block_height / 2

    if logo:
        c.drawImage(
            logo,
            -logo_width / 2,
            current_y - logo_height,
            width=logo_width,
            height=logo_height,
            preserveAspectRatio=True,
            mask="auto",
        )
        current_y -= logo_height + 10

    # Brand name
    c.setFont(BOLD_FONT, brand_size)
    c.drawCentredString(
        0,
        current_y - brand_size,
        BRAND_NAME,
    )

    # Author
    c.setFont(REGULAR_FONT, author_size)
    c.setFillAlpha(MAIN_OPACITY * 0.90)
    c.drawCentredString(
        0,
        current_y - brand_size - author_size - 4,
        AUTHOR_NAME,
    )

    c.restoreState()

    # ---------------------------------------------------------
    # Small bottom-right attribution
    # ---------------------------------------------------------

    if EDGE_ENABLED:
        edge_size = max(
            8,
            min(13, width * 0.011),
        )

        margin = max(
            8,
            min(width, height) * EDGE_MARGIN_RATIO,
        )

        c.saveState()
        c.setFillColorRGB(*WATERMARK_COLOR)
        c.setFillAlpha(EDGE_OPACITY)
        c.setFont(REGULAR_FONT, edge_size)

        text_width = pdfmetrics.stringWidth(
            BRAND_NAME,
            REGULAR_FONT,
            edge_size,
        )

        c.drawString(
            width - text_width - margin,
            margin,
            BRAND_NAME,
        )

        c.restoreState()

    c.showPage()
    c.save()
    buffer.seek(0)

    return buffer


# ═════════════════════════════════════════════════════════════
# PROCESS ONE PDF
# ═════════════════════════════════════════════════════════════

def watermark_pdf(path: Path):
    relative = path.relative_to(PDF_DIR)
    print(f"Processing: {relative}")

    # Start from a clean original whenever possible.
    restore_original(path)

    # Create a clean backup only once.
    backup_original(path)

    reader = PdfReader(str(path))
    writer = PdfWriter()

    if reader.is_encrypted:
        print("  Skipped: encrypted/password-protected PDF")
        return

    for page_number, page in enumerate(reader.pages, start=1):
        width = float(page.mediabox.width)
        height = float(page.mediabox.height)

        overlay_bytes = create_page_overlay(width, height)
        overlay_reader = PdfReader(overlay_bytes)

        page.merge_page(overlay_reader.pages[0])
        writer.add_page(page)

    # Preserve common metadata where possible.
    if reader.metadata:
        metadata = dict(reader.metadata)
        writer.add_metadata({
            str(k): str(v)
            for k, v in metadata.items()
            if k is not None and v is not None
        })

    # Write to a temporary file first so a failed operation doesn't
    # destroy the existing PDF.
    temp_path = path.with_suffix(".watermark-temp.pdf")

    with open(temp_path, "wb") as output:
        writer.write(output)

    shutil.move(str(temp_path), str(path))

    print(f"  Pages processed: {len(reader.pages)}")


# ═════════════════════════════════════════════════════════════
# MAIN
# ═════════════════════════════════════════════════════════════

def main():
    if not PDF_DIR.exists():
        raise SystemExit(
            "PDF folder not found:\n"
            f"{PDF_DIR}"
        )

    files = sorted(
        p for p in PDF_DIR.rglob("*")
        if p.is_file()
        and p.suffix.lower() == PDF_EXTENSION
    )

    if not files:
        print(
            "No PDF files found in:\n"
            f"{PDF_DIR}"
        )
        return

    print()
    print("D.El.Ed Buddy — Production PDF Watermarker")
    print("==========================================")
    print(f"Source:  {PDF_DIR}")
    print(f"Backup:  {BACKUP_DIR}")
    print(
        "Logo:    "
        f"{LOGO_PATH if LOGO_PATH.exists() else 'Not found — text only'}"
    )
    print(f"PDFs:    {len(files)}")
    print()
    print(f'Brand:   "{BRAND_NAME}"')
    print(f'Author:  "{AUTHOR_NAME}"')
    print()

    failed = []

    for path in files:
        try:
            watermark_pdf(path)
        except Exception as exc:
            failed.append((path, exc))
            print(f"  ERROR: {exc}")

    print()
    print("Finished.")
    print(f"Successfully processed: {len(files) - len(failed)}")
    print(f"Failed:                 {len(failed)}")
    print()
    print(f"Clean originals are backed up at:")
    print(BACKUP_DIR)

    if failed:
        print()
        print("Files with errors:")
        for path, exc in failed:
            print(f"  - {path.relative_to(PDF_DIR)}: {exc}")

    print()
    print("Preview several PDFs before committing the changes to Git.")


if __name__ == "__main__":
    main()
