import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import * as path from 'path';

import pkg from './package.json';
import { parseBaseUrl } from './app/config/base-url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const alias = Object.entries(pkg.alias).reduce((acc, [key, value]) => {
  // Resolve the alias path relative to the current file
  return {
    ...acc,
    [key]: path.resolve(rootDir, value.replace('~/', './'))
  };
}, {});

/**
 * Derives Vite's `base` from VITE_BASE_URL so a build's asset URLs and the
 * router's mount point always agree with wherever it's actually served.
 * Falls back to a relative base when VITE_BASE_URL isn't set, or isn't a
 * real URL yet (Docker's build stage deliberately leaves it as the literal
 * `${BASE_URL}` placeholder, resolved by envsubst at container start) — a
 * relative base keeps that same build deployable at any runtime path
 * prefix, since asset URLs then resolve against whatever <base href> the
 * container's entrypoint script injects into index.html.
 */
function resolveBase(rawBaseUrl: string | undefined): string {
  const url = parseBaseUrl(rawBaseUrl);
  if (!url) return rawBaseUrl ? './' : '/';
  const prefix = url.pathname.replace(/\/+$/, '');
  return prefix ? `${prefix}/` : '/';
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    base: resolveBase(env.VITE_BASE_URL),
    plugins: [react()],
    define: {
      APP_VERSION: JSON.stringify(pkg.version)
    },
    server: {
      port: 9000
    },
    resolve: {
      alias,
      dedupe: ['react', 'react-dom', '@tanstack/react-query']
    },
    optimizeDeps: {
      exclude: ['@astral-sh/ruff-wasm-web']
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(rootDir, 'index.html'),
          404: path.resolve(rootDir, '404.html')
        }
      }
    }
  };
});
