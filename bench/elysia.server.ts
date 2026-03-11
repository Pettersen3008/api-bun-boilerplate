import { Elysia } from "elysia";

const port = Number(process.env.BENCH_PORT ?? 3102);
const host = process.env.BENCH_HOST ?? "127.0.0.1";

new Elysia()
  .get("/healthz", () => ({ ok: true }))
  .get("/api/v1/ping", () => ({ pong: true }))
  .post("/api/v1/echo", ({ body }) => ({ data: body ?? null }))
  .listen({ port, hostname: host }, () => {
    console.log(`elysia bench server running at http://${host}:${port}`);
  });
