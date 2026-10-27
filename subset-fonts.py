"""Cuts IBM Plex Sans down to the characters the site uses. build-site.sh runs
it on the laid-out site; it writes the cuts to <site>/fonts/cv-sans/.

IBM Plex has the Reserved Font Name "Plex" under the OFL, and a subset is a
Modified Version, so the cuts are named CV Sans; style.css asks for the
installed Plex first. The text is every character of the site's pages
(attribute values too: the theme button reads its labels from data-*), of
style.css (its content strings), and printable ASCII.

Usage: python3 subset-fonts.py <site-dir>
Needs fontTools and brotli: pip install --require-hashes -r requirements-fonts.txt
"""

import html
import shutil
import sys
from pathlib import Path

try:
    from fontTools import subset
    from fontTools.ttLib import TTFont
except ImportError:
    sys.exit(
        "subset-fonts.py: fontTools is missing; "
        "pip install --require-hashes -r requirements-fonts.txt"
    )

SOURCE = Path(__file__).parent / "fonts" / "ibm-plex-sans"
CUTS = {
    "IBMPlexSans-Regular": "CVSans-Regular",
    "IBMPlexSans-Bold": "CVSans-Bold",
    "IBMPlexSansKR-Regular": "CVSansKR-Regular",
    "IBMPlexSansKR-Bold": "CVSansKR-Bold",
    "IBMPlexSansJP-Regular": "CVSansJP-Regular",
    "IBMPlexSansJP-Bold": "CVSansJP-Bold",
}
# Family, unique, full, PostScript, typographic family and subfamily, and
# the variation PostScript prefix: the names a reader picks the font by.
# Copyright and trademark notices keep the name.
NAME_IDS = {1, 3, 4, 6, 16, 17, 18, 21, 22, 25}
RENAMES = (("IBM Plex Sans", "CV Sans"), ("IBMPlexSans", "CVSans"))


def site_text(site: Path) -> str:
    chars: set[str] = {chr(c) for c in range(0x20, 0x7F)}
    for path in [*sorted(site.rglob("*.html")), Path(__file__).parent / "style.css"]:
        raw = path.read_text(encoding="utf-8")
        chars.update(raw, html.unescape(raw))
    return "".join(sorted(c for c in chars if c.isprintable()))


def rename(font: TTFont) -> None:
    table = font["name"]
    for record in list(table.names):
        if record.nameID not in NAME_IDS:
            continue
        name = record.toUnicode()
        for old, new in RENAMES:
            name = name.replace(old, new)
        if "Plex" in name:
            sys.exit(f"subset-fonts.py: name {record.nameID} keeps Plex: {name}")
        table.setName(
            name, record.nameID, record.platformID, record.platEncID, record.langID
        )


def main() -> int:
    site = Path(sys.argv[1])
    out = site / "fonts" / "cv-sans"
    out.mkdir(parents=True, exist_ok=True)
    text = site_text(site)
    options = subset.Options(flavor="woff2")
    # Language tags the JP cut carries; fontTools cannot cut the table.
    options.drop_tables += ["meta"]
    for source, target in CUTS.items():
        font = subset.load_font(str(SOURCE / f"{source}.woff2"), options)
        cutter = subset.Subsetter(options)
        cutter.populate(text=text)
        cutter.subset(font)
        rename(font)
        path = out / f"{target}.woff2"
        subset.save_font(font, str(path), options)
        print(f"{path}: {path.stat().st_size // 1024} KiB")
    shutil.copy(SOURCE / "LICENSE.txt", out / "LICENSE.txt")
    return 0


if __name__ == "__main__":
    sys.exit(main())
