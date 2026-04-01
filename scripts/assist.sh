#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR/apps/api"
REPORT_DIR="$ROOT_DIR/reports"
REPORT_FILE="$REPORT_DIR/assist-$(date +%Y%m%d).log"

mkdir -p "$REPORT_DIR"

log() {
  local msg="$1"
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$msg" | tee -a "$REPORT_FILE"
}

env_value() {
  local key="$1"
  local file="${2:-$APP_DIR/.env}"
  if [[ ! -f "$file" ]]; then
    return 1
  fi
  local raw
  raw="$(grep -E "^${key}=" "$file" | head -n1 | cut -d= -f2- | tr -d '\r\n' || true)"
  raw="${raw%\"}"
  raw="${raw#\"}"
  raw="${raw%\'}"
  raw="${raw#\'}"
  printf '%s' "$raw"
}

base_url() {
  local from_env
  from_env="$(env_value QG_BASE_URL 2>/dev/null || true)"
  if [[ -n "$from_env" ]]; then
    printf '%s' "$from_env"
    return
  fi
  printf 'https://ideiatoapp.me'
}

auth_token() {
  local token
  token="$(env_value QG_AUTH_TOKEN 2>/dev/null || true)"
  if [[ -z "$token" ]]; then
    log "ERRO: QG_AUTH_TOKEN nao encontrado em $APP_DIR/.env"
    exit 1
  fi
  printf '%s' "$token"
}

api_get() {
  local path="$1"
  local base token sep
  base="$(base_url)"
  token="$(auth_token)"
  sep='?'
  if [[ "$path" == *"?"* ]]; then
    sep='&'
  fi
  curl -fsS "${base}/api${path}${sep}token=${token}"
}

check_health() {
  local base
  base="$(base_url)"
  log "Health-check em ${base}"
  curl -fsS -o /dev/null -w "HOME %{http_code}\n" "${base}/" | tee -a "$REPORT_FILE"
  curl -fsS -o /dev/null -w "API_STATUS %{http_code}\n" "${base}/api/status" | tee -a "$REPORT_FILE"
  curl -fsS -o /dev/null -w "FABRICA_STATUS %{http_code}\n" "${base}/api/fabrica/status?token=$(auth_token)" | tee -a "$REPORT_FILE"
}

diag_local() {
  log "Diagnostico local (sem token)"
  curl -fsS "http://127.0.0.1:3005/api/internal/diagnostic" | tee -a "$REPORT_FILE"
  printf '\n' | tee -a "$REPORT_FILE"
}

agentes_test() {
  local base token start_json pipeline_id stream_url
  local agentes_preview timeline_preview
  base="$(base_url)"
  token="$(auth_token)"

  log "Teste de agentes: listagem e pipeline"
  agentes_preview="$(api_get "/agentes" || true)"
  printf '%s\n' "$agentes_preview" | cut -c 1-220 | tee -a "$REPORT_FILE"
  printf '\n' | tee -a "$REPORT_FILE"

  start_json="$(curl -fsS -X POST \
    -H 'Content-Type: application/json' \
    -d '{"ideia":"Teste automatico assist.sh dos agentes"}' \
    "${base}/api/fabrica/pipeline/iniciar?token=${token}")"

  pipeline_id="$(printf '%s' "$start_json" | sed -n 's/.*"pipelineId":"\([^"]*\)".*/\1/p' | head -n1)"
  if [[ -z "$pipeline_id" ]]; then
    log "ERRO: nao foi possivel obter pipelineId"
    printf '%s\n' "$start_json" | tee -a "$REPORT_FILE"
    exit 1
  fi
  log "Pipeline criado: ${pipeline_id}"

  stream_url="${base}/api/fabrica/pipeline/${pipeline_id}/stream?token=${token}"
  timeout 10s curl -fsS -N "$stream_url" > /tmp/assist_stream.out || true
  local stream_lines
  stream_lines="$(wc -l < /tmp/assist_stream.out | tr -d ' ')"
  log "Stream linhas capturadas: ${stream_lines}"
  head -n 8 /tmp/assist_stream.out | tee -a "$REPORT_FILE"

  timeline_preview="$(api_get "/fabrica/pipeline/${pipeline_id}/timeline?limit=20" || true)"
  printf '%s\n' "$timeline_preview" | cut -c 1-280 | tee -a "$REPORT_FILE"
  printf '\n' | tee -a "$REPORT_FILE"
}

rotina() {
  log "Rotina iniciada"
  (cd "$ROOT_DIR" && npm test --workspace=apps/api) | tee -a "$REPORT_FILE"
  (cd "$ROOT_DIR" && npm run lint --workspace=apps/web) | tee -a "$REPORT_FILE"
  check_health
  agentes_test
  diag_local
  log "Rotina finalizada"
}

deploy() {
  log "Deploy local: pull + build web + restart PM2"
  (cd "$ROOT_DIR" && git pull --ff-only origin main) | tee -a "$REPORT_FILE"
  (cd "$ROOT_DIR" && npm run build --workspace=apps/web) | tee -a "$REPORT_FILE"
  (cd "$APP_DIR" && pm2 restart qgia) | tee -a "$REPORT_FILE"
  check_health
  log "Deploy finalizado"
}

usage() {
  cat <<'EOF'
Uso:
  scripts/assist.sh health
  scripts/assist.sh diag-local
  scripts/assist.sh agentes-test
  scripts/assist.sh rotina
  scripts/assist.sh deploy
EOF
}

cmd="${1:-}"
case "$cmd" in
  health) check_health ;;
  diag-local) diag_local ;;
  agentes-test) agentes_test ;;
  rotina) rotina ;;
  deploy) deploy ;;
  *) usage; exit 1 ;;
esac
