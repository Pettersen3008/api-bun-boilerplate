export type HttpHeaders = Record<string, string>;

export interface HttpClient {
  getJson<T>(url: string, init?: { headers?: HttpHeaders }): Promise<T>;
}

export class FetchHttpClient implements HttpClient {
  async getJson<T>(url: string, init?: { headers?: HttpHeaders }): Promise<T> {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  }
}

export const http: HttpClient = new FetchHttpClient();
