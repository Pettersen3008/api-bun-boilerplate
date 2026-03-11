import express from "express";

const app = express();
app.use(express.json());

app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/api/v1/ping", (_req, res) => {
  res.status(200).json({ pong: true });
});

app.post("/api/v1/echo", (req, res) => {
  res.status(200).json({ data: req.body ?? null });
});

const port = Number(process.env.BENCH_PORT ?? 3101);
const host = process.env.BENCH_HOST ?? "127.0.0.1";

app.listen(port, host, () => {
  console.log(`express bench server running at http://${host}:${port}`);
});
