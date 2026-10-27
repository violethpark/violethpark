#!/usr/bin/env bash
# Lays out the GitHub Pages site from the converted CV*.html (npm run convert
# first). deploy-cv.yml runs it; run it locally to check the site before a
# merge, e.g. `python3 -m http.server -d _site`.
#
# Usage: bash build-site.sh [out-dir]   (default: _site)
# Needs fontTools for subset-fonts.py: PYTHON names a Python that has it
# (pip install --require-hashes -r requirements-fonts.txt), default python3.
set -euo pipefail

cd "$(dirname "$0")"
site=${1:-_site}

# The fonts are copied, not built here: check them against their pins.
(cd fonts && node -e '
  for (const a of require("./fonts.json").archives)
    for (const [file, pin] of Object.entries(a.files)) console.log(pin.sha256 + "  " + file);
' | sha256sum -c --quiet)

rm -rf "$site"
mkdir -p "$site"

# English at / and /en/, the others under their language.
for pair in .:CV.html en:CV.html ko:CV_ko.html jp:CV_jp.html; do
  dir=${pair%%:*}
  mkdir -p "$site/$dir/images"
  cp "${pair#*:}" "$site/$dir/index.html"
  cp -r images/. "$site/$dir/images/"
done

# One style sheet and one set of fonts at the root, which the style sheet
# reaches by a path relative to itself. The text font is cut to the
# characters of the pages below, once their links are final.
cp style.css "$site/"
mkdir -p "$site/fonts"
cp -r fonts/sarasa-mono-slab "$site/fonts/"
for dir in en ko jp; do
  sed -i 's|href="style\.css"|href="../style.css"|' "$site/$dir/index.html"
done

# Cross-language links (.md → clean URLs), in the text and in the panel.
for dir in . en ko jp; do
  sed -i \
    -e 's|href="CV\.md"|href="/en/"|g' \
    -e 's|href="CV_ko\.md"|href="/ko/"|g' \
    -e 's|href="CV_jp\.md"|href="/jp/"|g' \
    "$site/$dir/index.html"
done

"${PYTHON:-python3}" subset-fonts.py "$site"

echo "about.violethpark.com" >"$site/CNAME"
