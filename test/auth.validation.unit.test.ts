import { describe, expect, test } from "bun:test";
import { LoginSchema, RegisterSchema } from "../src/request/auth";

describe("Auth request schemas", () => {
  test("register accepts valid payload", () => {
    const payload = RegisterSchema.parse({
      email: "USER@example.com",
      fullName: "Ada Lovelace",
      password: "very-strong-password",
    });

    expect(payload.email).toBe("user@example.com");
  });

  test("register rejects too short password", () => {
    expect(() =>
      RegisterSchema.parse({
        email: "u@example.com",
        fullName: "Test User",
        password: "short",
      }),
    ).toThrow();
  });

  test("login rejects invalid email", () => {
    expect(() => LoginSchema.parse({ email: "nope", password: "x" })).toThrow();
  });
});
