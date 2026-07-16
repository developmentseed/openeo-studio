#!/bin/sh
# nginx entrypoint hook: write config.js and template index.html from env.
set -eu

HTML_ROOT=/usr/share/nginx/html
CONFIG_JS="${HTML_ROOT}/config.js"
INDEX_HTML="${HTML_ROOT}/index.html"
PATH_PREFIX_INC=/etc/nginx/conf.d/path-prefix.inc

# Leading slash, no trailing slash; empty for root.
normalize_prefix() {
  prefix="$1"
  if [ -z "$prefix" ] || [ "$prefix" = "/" ]; then
    printf ''
    return
  fi
  case "$prefix" in
    /*) ;;
    *) prefix="/${prefix}" ;;
  esac
  printf '%s' "$prefix" | sed 's|/*$||'
}

PATH_PREFIX="$(normalize_prefix "$PATH_PREFIX")"

json_escape() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

if [ "$ENABLE_NARRATIVE_EXPORT" = "true" ]; then
  ENABLE_NARRATIVE_EXPORT_JS=true
else
  ENABLE_NARRATIVE_EXPORT_JS=false
fi

cat >"$CONFIG_JS" <<EOF
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
EOF
chmod 644 "$CONFIG_JS"

tmp_index="$(mktemp)"
# shellcheck disable=SC2016
envsubst '${BASE_URL} ${APP_TITLE} ${APP_DESCRIPTION}' <"$INDEX_HTML" >"$tmp_index"
mv "$tmp_index" "$INDEX_HTML"

# <base> so Vite relative assets resolve on deep links under PATH_PREFIX.
sed -i "s|<head>|<head><base href=\"${PATH_PREFIX}/\">|" "$INDEX_HTML"
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

echo "openeo-studio: wrote ${CONFIG_JS} (PATH_PREFIX='${PATH_PREFIX}', OPENEO_API_URL='${OPENEO_API_URL}')"
