"""Rasmlarni WebP'ga o'giradi va siqadi.
Ishlatish:  pip install pillow
            python optimize-images.py
`images-src/` ichiga asl rasmlarni (jpg/png) tashlang, tayyor fayllar `images/` ga tushadi."""
from pathlib import Path
from PIL import Image, ImageOps

SRC, DST, MAX_SIDE, QUALITY = Path("images-src"), Path("images"), 1200, 80
DST.mkdir(exist_ok=True)

for f in sorted(SRC.iterdir()):
    if f.suffix.lower() not in {".jpg", ".jpeg", ".png", ".heic"}:
        continue
    img = ImageOps.exif_transpose(Image.open(f)).convert("RGB")
    img.thumbnail((MAX_SIDE, MAX_SIDE))
    out = DST / (f.stem + ".webp")
    img.save(out, "WEBP", quality=QUALITY, method=6)
    print(f"{f.name}: {f.stat().st_size // 1024} KB -> {out.stat().st_size // 1024} KB")
