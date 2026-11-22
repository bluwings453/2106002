#!/usr/bin/env bash
# Usage: scripts/build-geo.sh /path/to/india-maps-data
# Converts udit-001/india-maps-data GeoJSON into simplified TopoJSON under public/geo.
set -euo pipefail
SRC="${1:?path to india-maps-data checkout}"
OUT="$(dirname "$0")/../public/geo"
MS="npx --no-install mapshaper"
mkdir -p "$OUT/states"
$MS "$SRC/geojson/india.geojson" -simplify 6% keep-shapes -dissolve st_nm -clean -rename-layers states \
  -o "$OUT/india.topo.json" format=topojson quantization=100000
for f in "$SRC"/geojson/states/*.geojson; do
  slug="$(basename "$f" .geojson)"
  $MS "$f" -simplify 18% keep-shapes -filter-fields district -clean -rename-layers districts \
    -o "$OUT/states/$slug.topo.json" format=topojson quantization=100000
done
cp "$SRC/state-list.json" "$OUT/state-list.json"
