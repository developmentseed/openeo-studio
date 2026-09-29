# syntax=docker/dockerfile:1

FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
ENV HUSKY=0
RUN pnpm install --frozen-lockfile

COPY . .

# File copy (not ENV) so Docker does not expand the $ placeholders.
COPY docker/vite-placeholders.env .env.production.local

RUN pnpm build

FROM nginxinc/nginx-unprivileged:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html

# The entrypoint writes only to /tmp at start, so the container runs as any
# UID/GID and the image files stay read-only.
COPY docker/default.conf /etc/nginx/conf.d/default.conf
COPY --chmod=755 docker/90-app-config.sh /docker-entrypoint.d/
# Not executable: the entrypoint runs every executable *.sh in this directory.
COPY docker/lib.sh /docker-entrypoint.d/

ENV OPENEO_API_URL=https://api.explorer.eopf.copernicus.eu/openeo \
    BASE_URL= \
    APP_TITLE="openEO Studio" \
    APP_DESCRIPTION="Interactive code editor for openEO satellite imagery processing" \
    MAPTILER_KEY= \
    AUTH_AUTHORITY= \
    AUTH_CLIENT_ID= \
    AUTH_REDIRECT_URI= \
    ENABLE_NARRATIVE_EXPORT=false \
    PARTNER_LOGO_URL= \
    PARTNER_NAME=

EXPOSE 8080
