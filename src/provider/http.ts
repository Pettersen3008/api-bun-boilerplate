import { env } from "./config";

export type HttpHeaders = Record<string, string>;

export interface HttpClient {
  getJson<T>(url: string, init?: { headers?: HttpHeaders; timeoutMs?: number }): Promise<T>;
}

export class HttpRequestError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
    readonly isTimeout: boolean = false,
  ) {
    super(message);
  }
}

export class FetchHttpClient implements HttpClient {
  async getJson<T>(url: string, init?: { headers?: HttpHeaders; timeoutMs?: number }): Promise<T> {
    const timeoutMs = init?.timeoutMs ?? env.HTTP_TIMEOUT_MS;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          ...(init?.headers ?? {}),
        },
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        throw new HttpRequestError(`HTTP request failed with status ${response.status}`, response.status, false);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof HttpRequestError) throw error;

      const maybeError = error as { name?: string; message?: string };
      if (maybeError.name === "AbortError" || maybeError.name === "TimeoutError") {
        throw new HttpRequestError(`HTTP request timed out after ${timeoutMs}ms`, undefined, true);
      }

      throw new HttpRequestError(maybeError.message ?? "HTTP request failed", undefined, false);
    }
  }
}

export const http: HttpClient = new FetchHttpClient();
