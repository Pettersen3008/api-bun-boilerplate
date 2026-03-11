#!/usr/bin/env bash
set -euo pipefail

HOST="${BENCH_HOST:-127.0.0.1}"
CONNECTIONS="${BENCH_CONNECTIONS:-100}"
DURATION="${BENCH_DURATION_SEC:-15}"
PIPELINING="${BENCH_PIPELINING:-1}"

run_case() {
  local name="$1"
  local port="$2"
  local server_file="$3"
  local endpoint="$4"
  local method="$5"
  local body="${6:-}"

  echo ""
  echo "=== ${name} (${method} ${endpoint}) ==="

  BENCH_PORT="$port" BENCH_HOST="$HOST" bun "$server_file" >/tmp/${name}.bench.log 2>&1 &
  local pid=$!

  cleanup() {
    kill "$pid" >/dev/null 2>&1 || true
  }
  trap cleanup EXIT

  sleep 1

  if [[ -n "$body" ]]; then
    bunx autocannon \
      -c "$CONNECTIONS" \
      -d "$DURATION" \
      -p "$PIPELINING" \
      -m "$method" \
      -H "content-type: application/json" \
      -b "$body" \
      "http://${HOST}:${port}${endpoint}"
  else
    bunx autocannon \
      -c "$CONNECTIONS" \
      -d "$DURATION" \
      -p "$PIPELINING" \
      -m "$method" \
      "http://${HOST}:${port}${endpoint}"
  fi

  cleanup
  trap - EXIT
}

echo "Running benchmark with:"
echo "  host=${HOST} connections=${CONNECTIONS} duration=${DURATION}s pipelining=${PIPELINING}"

echo "\nWarmup + throughput checks"
run_case "express_get_ping" 3101 "bench/express.server.ts" "/api/v1/ping" "GET"
run_case "elysia_get_ping" 3102 "bench/elysia.server.ts" "/api/v1/ping" "GET"
run_case "express_post_echo" 3101 "bench/express.server.ts" "/api/v1/echo" "POST" '{"a":1,"b":"x"}'
run_case "elysia_post_echo" 3102 "bench/elysia.server.ts" "/api/v1/echo" "POST" '{"a":1,"b":"x"}'
