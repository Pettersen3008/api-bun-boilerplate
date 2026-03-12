import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Server } from "node:http";
import { app } from "../src/app";

async function registerAndLogin(baseUrl: string) {
  const register = await fetch(`${baseUrl}/api/v1/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "owner@example.com",
      fullName: "Owner User",
      password: "very-strong-password",
    }),
  });

  expect(register.status).toBe(201);

  const login = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "owner@example.com",
      password: "very-strong-password",
    }),
  });

  expect(login.status).toBe(200);
  const body = (await login.json()) as {
    data: { accessToken: string };
  };

  return body.data.accessToken;
}

describe("auth + users integration", () => {
  let server: Server;
  let baseUrl = "";

  beforeEach(() => {
    server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Failed to bind test server");
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(() => {
    server.close();
  });

  test("register/login/logout flow works", async () => {
    const token = await registerAndLogin(baseUrl);

    const logout = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: "{}",
    });

    expect(logout.status).toBe(204);

    const usersAfterLogout = await fetch(`${baseUrl}/api/v1/users`, {
      headers: { authorization: `Bearer ${token}` },
    });

    expect(usersAfterLogout.status).toBe(401);
  });

  test("users list supports cursor pagination", async () => {
    const token = await registerAndLogin(baseUrl);

    const create = async (email: string, fullName: string) => {
      const response = await fetch(`${baseUrl}/api/v1/users`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, fullName }),
      });
      expect(response.status).toBe(201);
    };

    await create("ada@example.com", "Ada Lovelace");
    await create("grace@example.com", "Grace Hopper");
    await create("linus@example.com", "Linus Torvalds");

    const firstPage = await fetch(`${baseUrl}/api/v1/users?limit=2`);
    expect(firstPage.status).toBe(401);

    const pageOne = await fetch(`${baseUrl}/api/v1/users?limit=2`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(pageOne.status).toBe(200);
    const pageOneBody = (await pageOne.json()) as {
      data: Array<{ id: string; created_at: string }>;
      meta: { mode: string; count: number; nextCursor?: string | null };
    };
    expect(pageOneBody.meta.mode).toBe("cursor");
    expect(pageOneBody.meta.count).toBe(2);

    const cursor = Buffer.from(
      JSON.stringify({
        createdAt: pageOneBody.data[0]?.created_at,
        id: pageOneBody.data[0]?.id,
      }),
      "utf8",
    ).toString("base64url");
    const cursorPageOne = await fetch(`${baseUrl}/api/v1/users?limit=2&cursor=${cursor}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(cursorPageOne.status).toBe(200);

    const offsetPage = await fetch(`${baseUrl}/api/v1/users?limit=2&offset=0`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(offsetPage.status).toBe(200);
    const offsetBody = (await offsetPage.json()) as {
      data: Array<{ id: string }>;
      meta: { mode: string; count: number };
    };
    expect(offsetBody.meta.mode).toBe("offset");
    expect(offsetBody.meta.count).toBe(2);
  });
});
