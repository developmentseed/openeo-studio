#!/usr/bin/env bash
# Smoke test of the local stack: titiler-openeo API + Keycloak + live Planetary Computer data.
# Usage: ./smoke.sh   (overridable: API, IDP, OUT for the outputs, IMAGE to decode them with rasterio)
set -uo pipefail
API=${API:-http://localhost:8081}
IDP=${IDP:-http://localhost:8082/realms/openeo}
IMAGE=${IMAGE:-$(kubectl --kubeconfig "$(dirname "$0")/kubeconfig" -n openeo-dev get deploy dev-titiler-openeo \
  -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null)}   # the deployed image
OUT=${OUT:-$(mktemp -d "${TMPDIR:-/tmp}/smoke.XXXXXX")}
fails=0
check() {  # check <name> <expected glob> <actual>
  # shellcheck disable=SC2053  # <expected> is a glob pattern on purpose
  if [[ "$3" == $2 ]]; then echo "PASS  $1 (${3:0:80})"; return; fi
  echo "FAIL  $1: expected $2, got ${3:0:200}"
  [[ -s "$OUT/body" ]] && echo "      last response: $(head -c 200 "$OUT/body")"
  fails=$((fails + 1))
}
code() { curl -s -o "$OUT/body" -w '%{http_code}' "$@"; }
stats() {  # stats <file>: band count, size, valid fraction and mean of band 1 (decoded with rasterio), or "all nodata"
  # stderr goes to a file (rasterio warns on PNGs); it is shown only when there is no result, e.g. docker errors.
  local out
  out=$(docker run --rm -i "$IMAGE" python -c '
import sys, numpy as np, rasterio
with rasterio.MemoryFile(sys.stdin.buffer.read()) as m, m.open() as d:
    a = d.read(1, masked=True)
    v = 1 - np.ma.getmaskarray(a).mean()
    print(f"bands={d.count} {d.width}x{d.height} " + (f"valid={v:.2f} mean={float(a.mean()):.3f}" if v else "all nodata"))
' < "$1" 2>"$OUT/stats.err")
  echo "${out:-$(tail -n 1 "$OUT/stats.err")}"
}

check "GET /healthz" 200 "$(code "$API/healthz")"
check "GET /readyz" 200 "$(code "$API/readyz")"
check "GET / version" "0.*" "$(curl -s "$API/" | jq -r .backend_version)"
oidc=$(curl -s "$API/credentials/oidc")
check "OIDC provider id" oidc "$(jq -r '.providers[0].id' <<<"$oidc")"
check "OIDC default client" openeo-studio "$(jq -r '.providers[0].default_clients[0].id' <<<"$oidc")"
cols=$(curl -s "$API/collections?limit=500" | jq -r '[.collections[].id] | join(" ")')
for c in sentinel-2-l2a sentinel-1-rtc sentinel-1-grd landsat-c2-l2; do check "collection $c" "*$c*" "$cols"; done
procs=$(curl -s "$API/processes" | jq -r '[.processes[].id] | join(" ")')
for p in apply_kernel apply_pixel_selection sar_backscatter colormap; do check "process $p" "* $p *" " $procs "; done

check "POST /result, no token" 400 "$(code -X POST "$API/result" -H 'Content-Type: application/json' -d '{}')"
check "POST /result, bad token" 40[13] "$(code -X POST "$API/result" -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer oidc/oidc/garbage' -d '{}')"

TOKEN=$(curl -s -d grant_type=password -d client_id=openeo-studio -d username=dev -d password=dev -d scope=openid \
  "$IDP/protocol/openid-connect/token" | jq -r .access_token)
check "password-grant token" "ey*" "${TOKEN:0:2}"
AUTH=(-H "Authorization: Bearer oidc/oidc/$TOKEN" -H 'Content-Type: application/json')
check "GET /me" 200 "$(code "$API/me" "${AUTH[@]}")"

# Ulysse layer 2: Sentinel-2 L2A true colour on 9 Oct 2018 (one item, tile 32TNN), as a GeoTIFF.
cat > "$OUT/s2.json" <<'EOF'
{"process": {"process_graph": {
  "load": {"process_id": "load_collection", "arguments": {"id": "sentinel-2-l2a",
    "spatial_extent": {"west": 9.25, "south": 43.15, "east": 9.55, "north": 43.35},
    "temporal_extent": ["2018-10-09T10:15:00Z", "2018-10-09T10:25:00Z"], "bands": ["B04", "B03", "B02"],
    "properties": {"s2:mgrs_tile": {"process_graph": {"f": {"process_id": "eq",
      "arguments": {"x": {"from_parameter": "value"}, "y": "32TNN"}, "result": true}}}}}},
  "sel": {"process_id": "apply_pixel_selection", "arguments": {"data": {"from_node": "load"}, "pixel_selection": "first"}},
  "save": {"process_id": "save_result", "arguments": {"data": {"from_node": "sel"}, "format": "GTiff"}, "result": true}}}}
EOF
check "POST /result S2 GeoTIFF" 200 "$(code -X POST "$API/result" "${AUTH[@]}" -d @"$OUT/s2.json")"
cp "$OUT/body" "$OUT/s2.tif"
check "s2.tif has data" "bands=3 * valid=*" "$(stats "$OUT/s2.tif")"

# Ulysse layer 1: Sentinel-1 RTC VV in dB, coloured, as an XYZ service (what Studio creates on Run).
cat > "$OUT/s1.json" <<'EOF'
{"title": "smoke s1 rtc", "description": null, "type": "XYZ", "enabled": true, "plan": null, "budget": null,
 "configuration": {"scope": "public", "minZoom": 6, "maxZoom": 15},
 "process": {"process_graph": {
  "load": {"process_id": "load_collection", "arguments": {"id": "sentinel-1-rtc",
    "spatial_extent": {"west": 6.4, "south": 42.7, "east": 9.7, "north": 43.9},
    "temporal_extent": ["2018-10-09T17:09:00Z", "2018-10-09T17:19:00Z"], "bands": ["vv"]}},
  "sel": {"process_id": "apply_pixel_selection", "arguments": {"data": {"from_node": "load"}, "pixel_selection": "first"}},
  "db": {"process_id": "apply", "arguments": {"data": {"from_node": "sel"}, "process": {"process_graph": {
    "log": {"process_id": "log", "arguments": {"x": {"from_parameter": "x"}, "base": 10}},
    "mul": {"process_id": "multiply", "arguments": {"x": {"from_node": "log"}, "y": 10}, "result": true}}}}},
  "cm": {"process_id": "colormap", "arguments": {"data": {"from_node": "db"}, "colormap":
    [[[-80, -26], [0, 0, 0, 255]], [[-26, -16], [90, 90, 90, 255]], [[-16, -6], [180, 180, 180, 255]], [[-6, 40], [255, 255, 255, 255]]]}},
  "save": {"process_id": "save_result", "arguments": {"data": {"from_node": "cm"}, "format": "PNG"}, "result": true}}}}
EOF
loc=$(curl -s -D - -o "$OUT/body" -X POST "$API/services" "${AUTH[@]}" -d @"$OUT/s1.json" | tr -d '\r' | awk 'tolower($1)=="location:"{print $2}')
check "POST /services XYZ -> Location" "http*" "$loc"
url=$(curl -s "$loc" "${AUTH[@]}" | jq -r .url)
url=$(printf '%b' "${url//%/\\x}")   # URL-encoded (%7Bz%7D); Studio decodes it too
check "service tile URL" "http*" "$url"
tile() { local u=${url//\{z\}/$1}; u=${u//\{x\}/$2}; echo "${u//\{y\}/$3}"; }
check "tile z8/134/93 (Cap Corse slick)" 200 "$(code "$(tile 8 134 93)")"   # public service: no auth header
cp "$OUT/body" "$OUT/tile.png"
check "tile.png has data" "bands=4 * valid=*" "$(stats "$OUT/tile.png")"
check "tile z8/0/0 (no data)" 404 "$(code "$(tile 8 0 0)")"
check "DELETE service" 204 "$(code -X DELETE "$loc" "${AUTH[@]}")"

echo "outputs in $OUT"; echo "$fails failure(s)"; exit $((fails > 0))
