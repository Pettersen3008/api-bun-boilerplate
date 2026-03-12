import { afterEach, describe, expect, mock, test } from "bun:test";
import { FetchHttpClient, HttpRequestError } from "../src/provider/http";

const originalFetch = globalThis.fetch;

function setMockFetch(fn: Parameters<typeof mock>[0]): void {
  globalThis.fetch = mock(fn) as unknown as typeof fetch;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("FetchHttpClient", () => {
  test("returns parsed json on success", async () => {
    setMockFetch(async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const client = new FetchHttpClient();
    const result = await client.getJson<{ ok: boolean }>("https://example.com");

    expect(result.ok).toBe(true);
  });

  test("throws HttpRequestError with status on non-ok response", async () => {
    setMockFetch(async () =>
      new Response("bad", {
        status: 503,
      })
    );

    const client = new FetchHttpClient();

    await expect(client.getJson("https://example.com")).rejects.toMatchObject({
      statusCode: 503,
      isTimeout: false,
    } satisfies Partial<HttpRequestError>);
  });

  test("maps timeout errors to isTimeout=true", async () => {
    setMockFetch(async () => {
      const error = new Error("timeout");
      (error as { name?: string }).name = "TimeoutError";
      throw error;
    });

    const client = new FetchHttpClient();

    await expect(client.getJson("https://example.com", { timeoutMs: 10 })).rejects.toMatchObject({
      isTimeout: true,
    } satisfies Partial<HttpRequestError>);
  });

  test("maps generic failures to HttpRequestError", async () => {
    setMockFetch(async () => {
      throw new Error("network down");
    });

    const client = new FetchHttpClient();

    await expect(client.getJson("https://example.com")).rejects.toMatchObject({
      message: "network down",
      isTimeout: false,
    } satisfies Partial<HttpRequestError>);
  });
});
