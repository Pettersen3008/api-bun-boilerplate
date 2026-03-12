import { describe, expect, test } from "bun:test";
import { normalizeQueryInput } from "../src/request/listing";
import { ListUsersQuerySchema } from "../src/request/users";
import { decodeUsersCursor, encodeUsersCursor } from "../src/utils/pagination";

describe("ListUsersQuerySchema", () => {
  test("accepts offset mode", () => {
    const value = ListUsersQuerySchema.parse({
      limit: "20",
      offset: "10",
    });

    expect(value.limit).toBe(20);
    expect(value.offset).toBe(10);
    expect(value.cursor).toBeUndefined();
  });

  test("accepts cursor mode", () => {
    const value = ListUsersQuerySchema.parse(normalizeQueryInput({
      limit: "15",
      cursor: "abc123",
      sortBy: "createdAt",
      sortOrder: "desc",
    }));

    expect(value.limit).toBe(15);
    expect(value.cursor).toBe("abc123");
    expect(value.offset).toBeUndefined();
  });

  test("rejects mixed offset and cursor", () => {
    expect(() =>
      ListUsersQuerySchema.parse(normalizeQueryInput({
        limit: 20,
        offset: 0,
        cursor: "abc123",
      })),
    ).toThrow();
  });

  test("rejects unknown query parameters", () => {
    expect(() =>
      ListUsersQuerySchema.parse(normalizeQueryInput({
        limit: "20",
        notAllowed: "x",
      })),
    ).toThrow();
  });

  test("parses sort and email filter", () => {
    const value = ListUsersQuerySchema.parse(
      normalizeQueryInput({
        limit: "10",
        offset: "0",
        sortBy: "email",
        sortOrder: "asc",
        email: "a@example.com",
      }),
    );

    expect(value.email).toBe("a@example.com");
    expect(value.sortBy).toBe("email");
    expect(value.sortOrder).toBe("asc");
  });

  test("rejects sortOrder asc in cursor-first mode without offset", () => {
    expect(() =>
      ListUsersQuerySchema.parse(
        normalizeQueryInput({
          sortOrder: "asc",
        }),
      ),
    ).toThrow();
  });

  test("rejects non-createdAt sort in cursor mode", () => {
    expect(() =>
      ListUsersQuerySchema.parse(
        normalizeQueryInput({
          limit: "10",
          cursor: "abc123",
          sortBy: "email",
          sortOrder: "desc",
        }),
      ),
    ).toThrow();
  });

  test("rejects createdFrom after createdTo", () => {
    expect(() =>
      ListUsersQuerySchema.parse(
        normalizeQueryInput({
          createdFrom: "2026-03-12T12:00:00.000Z",
          createdTo: "2026-03-11T12:00:00.000Z",
        }),
      ),
    ).toThrow();
  });
});

describe("users cursor helpers", () => {
  test("encodes and decodes cursor", () => {
    const encoded = encodeUsersCursor({
      createdAt: "2026-03-12T07:00:00.000Z",
      id: "2f36a63f-48c4-4dd8-9f82-6e40ef2ab6f3",
    });

    const decoded = decodeUsersCursor(encoded);

    expect(decoded.createdAt).toBe("2026-03-12T07:00:00.000Z");
    expect(decoded.id).toBe("2f36a63f-48c4-4dd8-9f82-6e40ef2ab6f3");
  });

  test("rejects invalid cursor", () => {
    expect(() => decodeUsersCursor("not-a-valid-cursor")).toThrow();
  });
});
