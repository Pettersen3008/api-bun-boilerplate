import { describe, expect, test } from "bun:test";
import type { Request } from "express";
import { buildProblemDetails } from "../src/utils/problem";

describe("Problem Details (RFC 9457 style)", () => {
  test("fills defaults for RFC type/title/instance", () => {
    const req = {
      method: "GET",
      originalUrl: "/api/v1/users/123",
      url: "/api/v1/users/123",
    } as Request;

    const problem = buildProblemDetails(req, {
      status: 404,
      detail: "User not found",
    });

    expect(problem.type).toBe("https://tools.ietf.org/html/rfc9110#section-15.5.5");
    expect(problem.title).toBe("Not Found");
    expect(problem.status).toBe(404);
    expect(problem.detail).toBe("User not found");
    expect(problem.instance).toBe("GET /api/v1/users/123");
  });

  test("keeps explicit type/title/instance and extension members", () => {
    const req = {
      method: "POST",
      originalUrl: "/api/v1/auth/login",
      url: "/api/v1/auth/login",
    } as Request;

    const problem = buildProblemDetails(req, {
      type: "https://example.com/problems/unauthorized",
      title: "Unauthorized",
      status: 401,
      detail: "Invalid credentials",
      instance: "POST /custom-instance",
      requestId: "req-123",
    });

    expect(problem.type).toBe("https://example.com/problems/unauthorized");
    expect(problem.title).toBe("Unauthorized");
    expect(problem.instance).toBe("POST /custom-instance");
    expect(problem.requestId).toBe("req-123");
  });
});
