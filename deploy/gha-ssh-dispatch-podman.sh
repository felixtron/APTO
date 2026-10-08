#!/bin/bash
# Forced command para la llave de deploy de GitHub Actions (APTO) — Podman.
# Instalado en propodvps2: /opt/stacks/apto/deploy/gha-ssh-dispatch-podman.sh
# y referenciado desde /root/.ssh/authorized_keys con
#   command="...",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty
#
# Unico comando permitido:  deploy <sha>
# stdin (opcional, solo si la imagen no esta local):
#   linea 1 = usuario de GHCR, linea 2 = token efimero (GITHUB_TOKEN del job)
#
# Cambia Image= del Quadlet, reinicia la unit, espera /api/health y, si falla,
# vuelve a la imagen anterior. Deja solo la imagen actual y la anterior.
set -euo pipefail

UNIT=apto-app
QUADLET=/etc/containers/systemd/${UNIT}.container
REPO=ghcr.io/felixtron/apto
# 127.0.0.1, no localhost: dentro del contenedor localhost resuelve a IPv6
HEALTH_URL=http://127.0.0.1:3000/api/health
HEALTH_ATTEMPTS=30

reject() {
  echo "Comando no permitido para esta llave de deploy" >&2
  exit 1
}

read -r ACTION SHA EXTRA <<< "${SSH_ORIGINAL_COMMAND:-}" || true
[ "${ACTION:-}" = "deploy" ] || reject
[ -z "${EXTRA:-}" ] || reject
[[ "${SHA:-}" =~ ^[0-9a-f]{7,40}$ ]] || reject
IMAGE="${REPO}:sha-${SHA}"

# Un deploy a la vez
exec 9>/run/lock/apto-deploy.lock
flock -n 9 || { echo "Ya hay un deploy de APTO en curso" >&2; exit 1; }

trap 'podman logout ghcr.io >/dev/null 2>&1 || true' EXIT

[ -f "$QUADLET" ] || { echo "No existe el Quadlet $QUADLET" >&2; exit 1; }
PREVIOUS="$(sed -n 's/^Image=//p' "$QUADLET")"
echo "Imagen actual: ${PREVIOUS}"

is_healthy() {
  podman exec "$UNIT" wget -q -O /dev/null "$HEALTH_URL" 2>/dev/null
}

if [ "$PREVIOUS" = "$IMAGE" ] && is_healthy; then
  echo "Ya corre ${IMAGE} y esta sano; nada que hacer"
  exit 0
fi

# El Quadlet usa Pull=never: la imagen tiene que estar en el almacen local.
if ! podman image exists "$IMAGE"; then
  read -r GHCR_USER || true
  read -r GHCR_TOKEN || true
  [[ "${GHCR_USER:-}" =~ ^[A-Za-z0-9][A-Za-z0-9-]*(\[bot\])?$ ]] || {
    echo "Falta usuario de GHCR valido por stdin" >&2; exit 1; }
  [ -n "${GHCR_TOKEN:-}" ] || { echo "Falta token de GHCR por stdin" >&2; exit 1; }
  printf '%s' "$GHCR_TOKEN" | podman login ghcr.io --username "$GHCR_USER" --password-stdin >/dev/null
  unset GHCR_TOKEN
  podman pull --quiet "$IMAGE" >/dev/null
  podman logout ghcr.io >/dev/null 2>&1 || true
fi

switch_image() {
  sed -i "s|^Image=.*|Image=$1|" "$QUADLET"
  systemctl daemon-reload
  systemctl restart "$UNIT"
}

switch_image "$IMAGE"

for attempt in $(seq 1 "$HEALTH_ATTEMPTS"); do
  if is_healthy; then
    echo "Sano en ${IMAGE}"
    # Conservar solo la imagen en uso y la anterior (destino de rollback)
    podman images --format '{{.Repository}}:{{.Tag}}' \
      | grep "^${REPO}:" \
      | grep -vxF -e "$IMAGE" -e "$PREVIOUS" \
      | xargs -r podman rmi >/dev/null 2>&1 || true
    exit 0
  fi
  echo "Esperando a ${UNIT} (${attempt}/${HEALTH_ATTEMPTS})..."
  sleep 2
done

echo "Healthcheck fallido: rollback a ${PREVIOUS}" >&2
switch_image "$PREVIOUS"
exit 1
