# Elysia Benchmark Experiment

Goal: Compare baseline Express vs Elysia under the same local conditions before considering any migration.

## Scope

This is a spike only.
- Branch: `codex/benchmark-elysia`
- Files in `bench/*` are isolated from production app behavior.

## What is measured

Benchmark endpoints:
- `GET /api/v1/ping`
- `POST /api/v1/echo`

Servers:
- `bench/express.server.ts`
- `bench/elysia.server.ts`

Tool:
- `autocannon`

## Run

```bash
bun run bench:run
```

Optional tuning:

```bash
BENCH_CONNECTIONS=200 BENCH_DURATION_SEC=30 BENCH_PIPELINING=1 bun run bench:run
```

## Fairness rules

1. Same machine and no heavy background workloads.
2. Same endpoint shapes and payloads.
3. Same benchmark settings for both servers.
4. Run each case multiple times and compare median results.

## Interpretation

Look at:
- req/sec
- latency p50 / p95 / p99
- stability across repeated runs

A migration should only be considered if gains are meaningful for your workload and complexity tradeoffs are acceptable.
