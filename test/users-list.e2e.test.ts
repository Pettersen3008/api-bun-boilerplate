import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Server } from "node:http";
import { app } from "../src/app";

describe("users list e2e", () => {
  let server: Server;
  let baseUrl = "";
  let token = "";

  beforeEach(async () => {
    server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Failed to bind test server");
    }
    baseUrl = `http://127.0.0.1:${address.port}`;

    await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "e2e-owner@example.com",
        fullName: "E2E Owner",
        password: "very-strong-password",
      }),
    });

    const login = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "e2e-owner@example.com",
        password: "very-strong-password",
      }),
    });
    const loginBody = (await login.json()) as { data: { accessToken: string } };
    token = loginBody.data.accessToken;
  });

  afterEach(() => {
    server.close();
  });

  test("rejects unknown filter and returns Problem Details", async () => {
    const response = await fetch(`${baseUrl}/api/v1/users?limit=10&foo=bar`, {
      headers: { authorization: `Bearer ${token}` },
    });

    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")?.startsWith("application/problem+json")).toBe(true);
    expect(body.title).toBe("Bad Request");
  });

  test("supports deterministic offset result", async () => {
    const users = [
      { email: "charlie@example.com", fullName: "Charlie" },
      { email: "alice@example.com", fullName: "Alice" },
      { email: "bob@example.com", fullName: "Bob" },
    ];

    for (const user of users) {
      const create = await fetch(`${baseUrl}/api/v1/users`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(user),
      });
      expect(create.status).toBe(201);
    }

    const response = await fetch(`${baseUrl}/api/v1/users?limit=10&offset=0`, {
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: Array<{ email: string; created_at: string; id: string }>;
      meta: { mode: string; limit: number; count: number };
    };

    expect(body.meta.mode).toBe("offset");
    expect(body.meta.limit).toBe(10);
    expect(body.meta.count).toBe(4);
    for (let index = 1; index < body.data.length; index += 1) {
      const previous = body.data[index - 1];
      const current = body.data[index];
      expect(previous).toBeDefined();
      expect(current).toBeDefined();
      if (!previous || !current) continue;
      const prevKey = `${previous.created_at}|${previous.id}`;
      const currKey = `${current.created_at}|${current.id}`;
      expect(prevKey >= currKey).toBe(true);
    }
  });
});
