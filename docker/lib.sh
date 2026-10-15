#!/bin/sh
# Pure string/path helpers shared by 90-app-config.sh. No side effects —
# safe to source directly in tests.

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

# Extracts the path from a BASE_URL of the form scheme://host[/path].
# Empty string if there's no scheme (e.g. unset, or an unresolved
# `${BASE_URL}` build-time placeholder that hasn't been envsubst'd yet).
derive_prefix() {
  case "$1" in
    http://*|https://*)
      rest=${1#*://}
      path=${rest#*/}
      if [ "$path" = "$rest" ]; then
        printf ''
      else
        printf '/%s' "$path"
      fi
      ;;
    *)
      printf ''
      ;;
  esac
}

# Escapes a value for use inside a double-quoted string in an inline <script>.
# Newlines become \n and CRs are dropped, so multi-line values (e.g.
# BASEMAPS JSON from a YAML block) stay on one line. `<` becomes \u003c, so a
# value cannot close the <script> tag.
json_escape() {
  printf '%s' "$1" | tr -d '\r' |
    sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's/</\\u003c/g' |
    sed -e ':a' -e '$!N' -e '$!ba' -e 's/\n/\\n/g'
}
