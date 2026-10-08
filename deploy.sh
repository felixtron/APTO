#!/bin/bash
# APTO deployment to propodvps2 (Podman 5 + Quadlet, Traefik file provider).
# Follows Prosuite-Directiva-Deployment-2026-08-22-Podman.
#
# The CI key is pinned to a forced command on the host
# (deploy/gha-ssh-dispatch-podman.sh, installed in /opt/stacks/apto/deploy/),
# so the only thing this script can ask for is "deploy <sha>". The host swaps
# Image= in the apto-app Quadlet, restarts it, waits for /api/health and
# rolls back to the previous tag on failure.
#
# Usage: ./deploy.sh [environment] [commit-sha]
# Example: ./deploy.sh production 5084aa7
#
# Env: GHCR_USER / GHCR_TOKEN — short-lived registry credential (the CI job's
# GITHUB_TOKEN), sent over stdin so it never appears on a command line.

set -euo pipefail

ENVIRONMENT="${1:-production}"
COMMIT_SHA="${2:-$(git rev-parse --short HEAD)}"
SSH_HOST="${SSH_HOST:-195.26.255.71}" # propodvps2
SSH_PORT="${SSH_PORT:-2226}"
DEPLOY_USER="${DEPLOY_USER:-root}"

SSH_OPTS=(-p "$SSH_PORT" -o StrictHostKeyChecking=accept-new -o BatchMode=yes)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

if [[ ! "$COMMIT_SHA" =~ ^[0-9a-f]{7,40}$ ]]; then
  log_error "Invalid commit SHA: $COMMIT_SHA"
  exit 1
fi

log_info "Deploying APTO sha-${COMMIT_SHA} to propodvps2 (${ENVIRONMENT})..."

printf '%s\n%s\n' "${GHCR_USER:-github-actions}" "${GHCR_TOKEN:-}" \
  | ssh "${SSH_OPTS[@]}" "${DEPLOY_USER}@${SSH_HOST}" "deploy ${COMMIT_SHA}"

log_info "✓ Deployment complete: ghcr.io/felixtron/apto:sha-${COMMIT_SHA}"
