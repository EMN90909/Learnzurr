#!/usr/bin/env sh
set -eu
API_PORT=8090 /app/api &
API_PID=$!
cd /app/frontend
npm run preview -- --host 127.0.0.1 --port 3000 &
FRONTEND_PID=$!
nginx -g 'daemon off;' &
NGINX_PID=$!
trap 'kill $API_PID $FRONTEND_PID $NGINX_PID 2>/dev/null || true' INT TERM
wait $NGINX_PID
