#!/usr/bin/env bash
# Delete the local stack's cluster, with every volume in it (saved Studio projects included).
# Keeps the titiler-openeo image and Studio's Docker volumes; README.md says how to remove them.
set -euo pipefail
cd "$(dirname "$0")"
kind delete cluster --name openeo-local --kubeconfig "$PWD/kubeconfig"
rm -f kubeconfig
