#!/usr/bin/env bash
# Sobe/derruba o ecommerce-synthetic-data  nativo (sem Docker).
#
# Uso:
#   ./stack.sh up    # npm install + npm start em background
#   ./stack.sh down  # para o processo que está ouvindo na porta
set -euo pipefail
cd "$(dirname "$0")"
ROOT="$(pwd)"

PORT="${PORT:-3000}"
LOG_FILE="$ROOT/.stack-ecommerce-synthetic-data .log"

log() { echo "[ecommerce-synthetic-data] $*"; }

wait_for() {
  local tries=30
  for ((i = 0; i < tries; i++)); do
    curl -sf -m 2 "http://localhost:$PORT/health" >/dev/null 2>&1 && { log "no ar em :$PORT"; return 0; }
    sleep 1
  done
  log "não respondeu em ${tries}s — ver $LOG_FILE"
  return 1
}

cmd_up() {
  if curl -sf -m 2 "http://localhost:$PORT/health" >/dev/null 2>&1; then
    log " rodando em :$PORT"
    return
  fi
  log "instalando deps e iniciando..."
  npm install --silent
  PORT="$PORT" nohup npm start >"$LOG_FILE" 2>&1 &
  disown
  wait_for
}

cmd_down() {
  pid=$(lsof -ti "tcp:$PORT" 2>/dev/null || true)
  if [ -n "$pid" ]; then
    kill $pid 2>/dev/null && log "parado (porta $PORT)"
  else
    log "não estava rodando"
  fi
}

case "${1:-}" in
  up) cmd_up ;;
  down) cmd_down ;;
  *)
    echo "Uso: $0 {up|down}" >&2
    exit 1
    ;;
esac
