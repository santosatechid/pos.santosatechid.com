#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

ENV_FILE=".env.production"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ $ENV_FILE tidak ada. Buat dulu dari .env.example." >&2
  exit 1
fi

# Compose butuh variabel ini untuk nama image/container. Shell juga perlu
# nilai yang sama supaya tidak ada nama image aneh seperti "-web:latest".
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

: "${COMPOSE_PROJECT_NAME:?COMPOSE_PROJECT_NAME belum diisi di $ENV_FILE}"
: "${PORT:?PORT belum diisi di $ENV_FILE}"

echo "📦 Project: ${COMPOSE_PROJECT_NAME} · port ${PORT}"

git pull --ff-only

echo "🔨 Building images..."
docker compose --env-file "$ENV_FILE" build

echo "🚀 Starting services..."
docker compose --env-file "$ENV_FILE" up -d

echo "🧹 Pruning old images and build cache..."
docker image prune -f --filter "until=24h" || true
docker builder prune -f --filter "until=48h" || true

echo "📊 Disk usage:"
docker system df

echo "✅ Deploy selesai."
