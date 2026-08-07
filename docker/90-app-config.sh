#!/bin/sh
# nginx entrypoint hook: template index.html from env.
set -eu

HTML_ROOT=/usr/share/nginx/html
INDEX_HTML="${HTML_ROOT}/index.html"
PATH_PREFIX_INC=/etc/nginx/conf.d/path-prefix.inc

. "$(dirname "$0")/lib.sh"

# BASE_URL is the single source of truth for where the app is mounted —
# derive the path prefix from it instead of a separate env var.
PATH_PREFIX="$(normalize_prefix "$(derive_prefix "$BASE_URL")")"

json_escape() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

if [ "$ENABLE_NARRATIVE_EXPORT" = "true" ]; then
  ENABLE_NARRATIVE_EXPORT_JS=true
else
  ENABLE_NARRATIVE_EXPORT_JS=false
fi

tmp_index="$(mktemp)"
# shellcheck disable=SC2016
envsubst '${BASE_URL} ${APP_TITLE} ${APP_DESCRIPTION}' <"$INDEX_HTML" >"$tmp_index"
mv "$tmp_index" "$INDEX_HTML"

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
  authAuthority: "$(json_escape "$AUTH_AUTHORITY")",
  authClientId: "$(json_escape "$AUTH_CLIENT_ID")",
  authRedirectUri: "$(json_escape "$AUTH_REDIRECT_URI")",
  enableNarrativeExport: ${ENABLE_NARRATIVE_EXPORT_JS}
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
