import { env } from "./config";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogPayload = Record<string, unknown>;

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const REDACT_KEYS = new Set([
  "authorization",
  "cookie",
  "password",
  "password_hash",
  "token",
  "access_token",
  "refresh_token",
  "secret",
]);

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(input)) {
      const keyLower = key.toLowerCase();
      if (REDACT_KEYS.has(keyLower) || keyLower.includes("password") || keyLower.includes("token")) {
        output[key] = "[REDACTED]";
      } else {
        output[key] = sanitizeValue(nestedValue);
      }
    }

    return output;
  }

  return value;
}

export interface Logger {
  child(bindings: LogPayload): Logger;
  debug(message: string, payload?: LogPayload): void;
  info(message: string, payload?: LogPayload): void;
  warn(message: string, payload?: LogPayload): void;
  error(message: string, payload?: LogPayload): void;
}

class JsonLogger implements Logger {
  constructor(
    private readonly level: LogLevel,
    private readonly bindings: LogPayload = {},
  ) {}

  child(bindings: LogPayload): Logger {
    return new JsonLogger(this.level, { ...this.bindings, ...bindings });
  }

  debug(message: string, payload?: LogPayload): void {
    this.log("debug", message, payload);
  }

  info(message: string, payload?: LogPayload): void {
    this.log("info", message, payload);
  }

  warn(message: string, payload?: LogPayload): void {
    this.log("warn", message, payload);
  }

  error(message: string, payload?: LogPayload): void {
    this.log("error", message, payload);
  }

  private log(level: LogLevel, message: string, payload?: LogPayload): void {
    if (LOG_LEVEL_ORDER[level] < LOG_LEVEL_ORDER[this.level]) {
      return;
    }

    const event = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(sanitizeValue(this.bindings) as LogPayload),
      ...(payload ? (sanitizeValue(payload) as LogPayload) : {}),
    };

    const line = JSON.stringify(event);
    if (level === "error" || level === "warn") {
      console.error(line);
      return;
    }

    console.log(line);
  }
}

export const logger: Logger = new JsonLogger(env.LOG_LEVEL, {
  service: "api-bun-boilerplate",
  env: env.NODE_ENV,
});
