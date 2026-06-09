#!/bin/bash
# APTO Deployment Script for Prosuite Worker (panel-prosuite-2)
# Usage: ./deploy.sh [environment] [commit-sha]
# Example: ./deploy.sh production 5084aa7

set -euo pipefail

ENVIRONMENT="${1:-production}"
COMMIT_SHA="${2:-$(git rev-parse --short HEAD)}"
CLIENT="apto"
SSH_HOST="${SSH_HOST:-195.26.255.71}" # panel-prosuite-2.prosuite.pro / VPS-2 IP
SSH_PORT="${SSH_PORT:-2226}"
DEPLOY_USER="${DEPLOY_USER:-root}"
STACK_DIR="/opt/stacks/${CLIENT}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# ─────────────────────────────────────────────────────────────────────────────
# 1. PRE-DEPLOYMENT CHECKS
# ─────────────────────────────────────────────────────────────────────────────

log_info "Starting APTO deployment to Prosuite Worker (VPS-2)..."
log_info "Environment: $ENVIRONMENT"
log_info "Commit SHA: $COMMIT_SHA"

# ─────────────────────────────────────────────────────────────────────────────
# 2. PREPARE DOCKER COMPOSE FILE WITH COMMIT SHA
# ─────────────────────────────────────────────────────────────────────────────

log_info "Preparing docker-compose file with commit SHA..."

# Copy and modify docker-compose.yml to use the correct image tag (GHCR prefix is sha-)
docker_compose_temp=$(mktemp)
sed "s/\${COMMIT_SHA:-latest}/sha-${COMMIT_SHA}/g" docker-compose.yml > "$docker_compose_temp"

log_info "✓ docker-compose file prepared: $docker_compose_temp"

# ─────────────────────────────────────────────────────────────────────────────
# 3. REMOTE DEPLOY via SSH + docker compose
# ─────────────────────────────────────────────────────────────────────────────

log_info "Connecting to ${SSH_HOST}:${SSH_PORT} for deployment..."

# Ensure remote stack directory exists
ssh -p "${SSH_PORT}" -o StrictHostKeyChecking=no "${DEPLOY_USER}@${SSH_HOST}" "mkdir -p ${STACK_DIR} && chmod 750 ${STACK_DIR}"

# Copy docker-compose to remote
scp -P "${SSH_PORT}" -o StrictHostKeyChecking=no \
    "$docker_compose_temp" \
    "${DEPLOY_USER}@${SSH_HOST}:${STACK_DIR}/docker-compose.yml"

# Deploy using docker compose on remote
log_info "Pulling and deploying containers..."

ssh -p "${SSH_PORT}" -o StrictHostKeyChecking=no \
    "${DEPLOY_USER}@${SSH_HOST}" \
    "cd ${STACK_DIR} && \
     export COMMIT_SHA=${COMMIT_SHA} && \
     docker compose pull && \
     docker compose up -d && \
     docker compose ps"

log_info "✓ Deployment command executed"

# ─────────────────────────────────────────────────────────────────────────────
# 4. HEALTH CHECKS
# ─────────────────────────────────────────────────────────────────────────────

log_info "Waiting for APTO services to be healthy..."

ssh -p "${SSH_PORT}" -o StrictHostKeyChecking=no \
    "${DEPLOY_USER}@${SSH_HOST}" \
    "for i in {1..30}; do \
       if docker compose -f ${STACK_DIR}/docker-compose.yml exec -T app node -e \"require('http').get('http://localhost:3000/', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))\" > /dev/null 2>&1; then \
         echo 'APTO App is healthy'; \
         exit 0; \
       fi; \
       echo \"Attempt \$i/30...\"; \
       sleep 2; \
     done; \
     echo 'Health check failed'; \
     exit 1"

log_info "✓ Health checks passed"

# ─────────────────────────────────────────────────────────────────────────────
# 5. CLEANUP & SUMMARY
# ─────────────────────────────────────────────────────────────────────────────

rm -f "$docker_compose_temp"

log_info "════════════════════════════════════════════════════════════════"
log_info "APTO Deployment Successful!"
log_info "Client: ${CLIENT}"
log_info "Environment: ${ENVIRONMENT}"
log_info "Commit: ${COMMIT_SHA}"
log_info "URL: https://apto.org.mx"
log_info "════════════════════════════════════════════════════════════════"
