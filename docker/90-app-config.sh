#!/bin/sh
# nginx entrypoint hook: template index.html from env.
set -eu

# Read the built index.html from the image and write the result to /tmp, so
# the container runs as any UID/GID. nginx serves index.html from RUNTIME_DIR.
# The built app (Vite dist/), copied by the Dockerfile to the nginx web root.
SOURCE_DIR=/usr/share/nginx/html
SOURCE_INDEX_HTML="${SOURCE_DIR}/index.html"
RUNTIME_DIR=/tmp/openeo-studio
INDEX_HTML="${RUNTIME_DIR}/index.html"
PATH_PREFIX_INC="${RUNTIME_DIR}/path-prefix.inc"

mkdir -p "$RUNTIME_DIR"

. "$(dirname "$0")/lib.sh"

# BASE_URL is the single source of truth for where the app is mounted —
# derive the path prefix from it instead of a separate env var.
PATH_PREFIX="$(normalize_prefix "$(derive_prefix "$BASE_URL")")"

if [ "$ENABLE_NARRATIVE_EXPORT" = "true" ]; then
  ENABLE_NARRATIVE_EXPORT_JS=true
else
  ENABLE_NARRATIVE_EXPORT_JS=false
fi

tmp_index="$(mktemp)"
# shellcheck disable=SC2016
envsubst '${BASE_URL} ${APP_TITLE} ${APP_DESCRIPTION} ${OPENEO_API_URL}' <"$SOURCE_INDEX_HTML" >"$tmp_index"
mv "$tmp_index" "$INDEX_HTML"

# The documents for agents (llms.txt, agents/*.md, the manifest) have
# placeholders too. Write them to RUNTIME_DIR; nginx serves them from there.
# The deployment URL without a trailing slash, so links do not get "//".
STUDIO_ROOT_URL="$(printf '%s' "$BASE_URL" | sed 's|/*$||')"
export STUDIO_ROOT_URL
for doc in llms.txt llms-full.txt agents/script-contract.md agents/samples.md \
  agents/backend.md agents/prefill.md agents/user-guide.md \
  .well-known/openeo-studio.json; do
  [ -f "${SOURCE_DIR}/${doc}" ] || continue
  mkdir -p "$(dirname "${RUNTIME_DIR}/${doc}")"
  # shellcheck disable=SC2016
  envsubst '${STUDIO_ROOT_URL} ${OPENEO_API_URL} ${APP_TITLE} ${APP_DESCRIPTION}' \
    <"${SOURCE_DIR}/${doc}" >"${RUNTIME_DIR}/${doc}"
  chmod 644 "${RUNTIME_DIR}/${doc}"
done

# Splice the runtime app config in as an inline script where index.html has
# <!-- __APP_CONFIG__ -->. Using sed's `r` (read file) instead of `s|...|...|`
# avoids fighting sed's replacement-text escaping rules for values that may
# contain slashes or quotes (URLs, titles, etc.).
config_script="$(mktemp)"
cat >"$config_script" <<EOF
<script>
window.__APP_CONFIG__ = {
  openeoApiUrl: "$(json_escape "$OPENEO_API_URL")",
  pathPrefix: "$(json_escape "$PATH_PREFIX")",
  appTitle: "$(json_escape "$APP_TITLE")",
  appDescription: "$(json_escape "$APP_DESCRIPTION")",
  maptilerKey: "$(json_escape "$MAPTILER_KEY")",
  basemaps: "$(json_escape "$BASEMAPS")",
  authAuthority: "$(json_escape "$AUTH_AUTHORITY")",
  authClientId: "$(json_escape "$AUTH_CLIENT_ID")",
  authRedirectUri: "$(json_escape "$AUTH_REDIRECT_URI")",
  enableNarrativeExport: ${ENABLE_NARRATIVE_EXPORT_JS},
  partnerLogoUrl: "$(json_escape "$PARTNER_LOGO_URL")",
  partnerName: "$(json_escape "$PARTNER_NAME")"
};
</script>
EOF

tmp_index="$(mktemp)"
sed -e "/<!-- __APP_CONFIG__ -->/r ${config_script}" -e "/<!-- __APP_CONFIG__ -->/d" "$INDEX_HTML" >"$tmp_index"
mv "$tmp_index" "$INDEX_HTML"
rm -f "$config_script"

# <base> so Vite relative assets resolve on deep links under PATH_PREFIX.
tmp_index="$(mktemp)"
sed "s|<head>|<head><base href=\"${PATH_PREFIX}/\">|" "$INDEX_HTML" >"$tmp_index"
mv "$tmp_index" "$INDEX_HTML"
chmod 644 "$INDEX_HTML"

# Empty include when at root (avoids rewrite loops).
if [ -n "$PATH_PREFIX" ]; then
  cat >"$PATH_PREFIX_INC" <<EOF
rewrite ^${PATH_PREFIX}\$ ${PATH_PREFIX}/ permanent;
rewrite ^${PATH_PREFIX}/(.*)\$ /\$1 last;
EOF
else
  : >"$PATH_PREFIX_INC"
fi

echo "openeo-studio: templated ${INDEX_HTML} (PATH_PREFIX='${PATH_PREFIX}', OPENEO_API_URL='${OPENEO_API_URL}')"

# The browser validates BASEMAPS; log only that it is set (URLs may hold keys).
[ -z "$BASEMAPS" ] || echo "openeo-studio: BASEMAPS set (${#BASEMAPS} characters)"
