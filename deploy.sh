#!/bin/bash
# APTO deployment to propodvps2 (Podman 5 + Quadlet, Traefik file provider).
# Follows Prosuite-Directiva-Deployment-2026-08-22-Podman: the runtime unit is
# /etc/containers/systemd/apto-app.container; a deploy swaps its Image= tag
# and restarts the unit. Rollback = the previous tag, kept in local storage.
#
# Usage: ./deploy.sh [environment] [commit-sha]
# Example: ./deploy.sh production 5084aa7
#
# Env: GHCR_USER / GHCR_TOKEN — short-lived registry credential (the CI job's
# GITHUB_TOKEN). The host is logged into GHCR only for the pull.

set -euo pipefail

ENVIRONMENT="${1:-production}"
COMMIT_SHA="${2:-$(git rev-parse --short HEAD)}"
SSH_HOST="${SSH_HOST:-195.26.255.71}" # propodvps2
SSH_PORT="${SSH_PORT:-2226}"
DEPLOY_USER="${DEPLOY_USER:-root}"
UNIT="apto-app"
IMAGE="ghcr.io/felixtron/apto:sha-${COMMIT_SHA}"

SSH_OPTS=(-p "$SSH_PORT" -o StrictHostKeyChecking=accept-new -o BatchMode=yes)
REMOTE="${DEPLOY_USER}@${SSH_HOST}"

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

# ─────────────────────────────────────────────────────────────────────────────
# 1. PRE-DEPLOYMENT CHECKS
# ─────────────────────────────────────────────────────────────────────────────

# The SHA is interpolated into a remote command: only accept hex.
if [[ ! "$COMMIT_SHA" =~ ^[0-9a-f]{7,40}$ ]]; then
  log_error "Invalid commit SHA: $COMMIT_SHA"
  exit 1
fi

log_info "Starting APTO deployment to propodvps2 (Podman)..."
log_info "Environment: $ENVIRONMENT"
log_info "Image: $IMAGE"

# ─────────────────────────────────────────────────────────────────────────────
# 2. REGISTRY LOGIN (ephemeral, token via stdin — never on a command line)
# ─────────────────────────────────────────────────────────────────────────────

if [ -n "${GHCR_TOKEN:-}" ]; then
  log_info "Logging the host into GHCR for this pull..."
  printf '%s' "$GHCR_TOKEN" | ssh "${SSH_OPTS[@]}" "$REMOTE" \
    "podman login ghcr.io --username '${GHCR_USER:-github-actions}' --password-stdin >/dev/null"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 3. PULL, SWAP IMAGE, RESTART, HEALTH CHECK (auto-rollback on failure)
# ─────────────────────────────────────────────────────────────────────────────

ssh "${SSH_OPTS[@]}" "$REMOTE" "bash -s -- '${IMAGE}' '${UNIT}'" <<'REMOTE_SCRIPT'
set -euo pipefail
IMAGE="$1"
UNIT="$2"
QUADLET="/etc/containers/systemd/${UNIT}.container"
# 127.0.0.1, not localhost: inside the container localhost resolves to IPv6
HEALTH_URL="http://127.0.0.1:3000/api/health"
HEALTH_ATTEMPTS=30

trap 'podman logout ghcr.io >/dev/null 2>&1 || true' EXIT

[ -f "$QUADLET" ] || { echo "Quadlet not found: $QUADLET"; exit 1; }
PREVIOUS="$(sed -n 's/^Image=//p' "$QUADLET")"
echo "Current image: ${PREVIOUS}"

# The Quadlet uses Pull=never, so the image must be in local storage first.
podman pull --quiet "$IMAGE" >/dev/null
podman logout ghcr.io >/dev/null 2>&1 || true

switch_image() {
  sed -i "s|^Image=.*|Image=$1|" "$QUADLET"
  systemctl daemon-reload
  systemctl restart "$UNIT"
}

switch_image "$IMAGE"

for attempt in $(seq 1 "$HEALTH_ATTEMPTS"); do
  if podman exec "$UNIT" wget -q -O /dev/null "$HEALTH_URL" 2>/dev/null; then
    echo "Healthy on ${IMAGE}"
    # Keep only the running and the previous tag (rollback target)
    podman images --format '{{.Repository}}:{{.Tag}}' \
      | grep '^ghcr.io/felixtron/apto:' \
      | grep -vxF -e "$IMAGE" -e "$PREVIOUS" \
      | xargs -r podman rmi >/dev/null 2>&1 || true
    exit 0
  fi
  echo "Waiting for ${UNIT} (${attempt}/${HEALTH_ATTEMPTS})..."
  sleep 2
done

echo "Health check failed — rolling back to ${PREVIOUS}"
switch_image "$PREVIOUS"
exit 1
REMOTE_SCRIPT

log_info "✓ Deployment complete: $IMAGE"
