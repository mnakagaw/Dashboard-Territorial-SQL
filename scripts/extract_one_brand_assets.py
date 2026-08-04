"""Extract transparent ONE dashboard brand assets from the supplied design PDF.

The source file is an Illustrator-exported PDF. Its logo artwork is outlined,
so the most faithful portable web asset is produced by rendering the relevant
PDF pages and separating the solid brand artwork from its wine background.

Usage:
    python scripts/extract_one_brand_assets.py \
        --page-1 tmp/pdfs/one-color-spec/page-1.png \
        --page-2 tmp/pdfs/one-color-spec/page-2.png \
        --output public/brand
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image


BRAND_WINE = np.array([80.0, 16.0, 44.0])
PDF_HEADER_WINE = np.array([105.0, 20.0, 58.0])
WHITE = np.array([255.0, 255.0, 255.0])
MAGENTA = np.array([182.0, 18.0, 90.0])


def separate_solid_artwork(
    image: Image.Image,
    background: np.ndarray,
    foregrounds: tuple[np.ndarray, ...],
) -> Image.Image:
    """Recover antialiased solid artwork composited over a flat background."""

    source = np.asarray(image.convert("RGB"), dtype=np.float32)
    candidates: list[tuple[np.ndarray, np.ndarray]] = []

    for foreground in foregrounds:
        direction = foreground - background
        denominator = float(np.dot(direction, direction))
        alpha = np.clip(
            np.sum((source - background) * direction, axis=2) / denominator,
            0.0,
            1.0,
        )
        reconstruction = background + alpha[..., None] * direction
        error = np.sum((source - reconstruction) ** 2, axis=2)
        candidates.append((alpha, error))

    errors = np.stack([candidate[1] for candidate in candidates], axis=2)
    selection = np.argmin(errors, axis=2)
    alphas = np.stack([candidate[0] for candidate in candidates], axis=2)
    alpha = np.take_along_axis(alphas, selection[..., None], axis=2)[..., 0]

    rgba = np.zeros((*source.shape[:2], 4), dtype=np.uint8)
    for index, foreground in enumerate(foregrounds):
        rgba[selection == index, :3] = foreground.astype(np.uint8)
    rgba[..., 3] = np.where(alpha < 0.025, 0, np.round(alpha * 255)).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--page-1", required=True, type=Path)
    parser.add_argument("--page-2", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)
    page_1 = Image.open(args.page_1)
    page_2 = Image.open(args.page_2)

    # Coordinates refer to the 140 dpi renders used for the supplied PDF.
    dashboard_logo = page_2.crop((60, 730, 1780, 1120))
    dashboard_logo = separate_solid_artwork(
        dashboard_logo,
        BRAND_WINE,
        (WHITE, MAGENTA),
    )
    dashboard_logo.save(args.output / "tu-municipio-logo-white.png", optimize=True)

    institutional_logo = page_1.crop((2565, 15, 2975, 135))
    institutional_logo = separate_solid_artwork(
        institutional_logo,
        PDF_HEADER_WINE,
        (WHITE,),
    )
    institutional_logo.save(args.output / "one-institutional-logo-white.png", optimize=True)


if __name__ == "__main__":
    main()
