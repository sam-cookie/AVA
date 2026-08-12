#!/bin/sh
set -e

echo "[entrypoint] Running database migrations..."
node /app/docker-migrate.mjs

echo "[entrypoint] Starting server..."
exec node /app/server.js
