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

FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY docker/90-app-config.sh docker/lib.sh /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/90-app-config.sh \
    && touch /etc/nginx/conf.d/path-prefix.inc

ENV OPENEO_API_URL=https://api.explorer.eopf.copernicus.eu/openeo \
    BASE_URL= \
    APP_TITLE="openEO Studio" \
    APP_DESCRIPTION="Interactive code editor for openEO satellite imagery processing" \
    MAPTILER_KEY= \
    AUTH_AUTHORITY= \
    AUTH_CLIENT_ID= \
    AUTH_REDIRECT_URI= \
    ENABLE_NARRATIVE_EXPORT=false

EXPOSE 80
