# Local openEO stack for Studio development. See README.md. Run make from this folder, or make -C dev/local-stack.

.DEFAULT_GOAL := help
.PHONY: help up smoke studio sample down

help: ## List the targets
	@awk -F ':.*## ' '/^[a-z]+:.*## /{printf "  make %-7s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

up: ## Create or update the stack (kind, Keycloak, titiler-openeo); TITILER_REF, TITILER_REPO
	@./up.sh

smoke: ## Check the API, login and live Planetary Computer data
	@./smoke.sh

# node_modules and the pnpm store live in named volumes: no Linux binaries in the checkout, and no
# ~470 MB .pnpm-store created inside it. The mkdir keeps Docker from creating the mount point as root on Linux.
# One shell line, so that root is still set when docker run starts.
studio: ## Run Studio (Vite dev server) in a node:22-slim container on http://localhost:9000; Ctrl-C stops it
	@root=$$(cd ../.. && pwd) && mkdir -p "$$root/node_modules" && \
	docker run --rm --init --name openeo-studio-dev -p 127.0.0.1:9000:9000 \
	  -v "$$root":/app -w /app \
	  -v openeo-studio-node-modules:/app/node_modules -v openeo-studio-pnpm-store:/pnpm-store \
	  --env-file studio.env.example -e HUSKY=0 -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
	  node:22-slim sh -c 'corepack enable && pnpm install --frozen-lockfile --store-dir /pnpm-store && exec node_modules/.bin/vite --host 0.0.0.0'

# Studio's ?sample= link: base64url of the sample JSON. It loads the code; Save runs it.
sample: ## Print a link that opens Studio with a one-layer sample (log in first)
	@echo "http://localhost:9000/editor?sample=$$(jq -c . samples/s2-true-colour.json | base64 | tr '+/' '-_' | tr -d '=\n')"

down: ## Delete the cluster and everything in it, saved Studio projects included
	@./down.sh
