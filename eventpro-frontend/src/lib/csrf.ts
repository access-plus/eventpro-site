import axios, { AxiosInstance, AxiosResponseHeaders, RawAxiosResponseHeaders } from "axios";

export interface CsrfTokenResponse {
  headerName: string;
  parameterName: string;
  token: string;
}

export interface ResolvedCsrfToken {
  headerName: string;
  token: string;
}

/**
 * Keeps the browser CSRF token in memory. The matching cookie remains HttpOnly
 * and is managed by the browser through credentialed requests.
 */
export class CsrfTokenManager {
  private readonly bootstrapClient: AxiosInstance;
  private current: ResolvedCsrfToken | null = null;
  private pending: Promise<ResolvedCsrfToken> | null = null;

  constructor(baseURL: string) {
    this.bootstrapClient = axios.create({ baseURL, withCredentials: true });
  }

  initialize(): Promise<ResolvedCsrfToken> {
    return this.getToken();
  }

  getToken(forceRefresh = false): Promise<ResolvedCsrfToken> {
    if (forceRefresh) this.current = null;
    if (this.current) return Promise.resolve(this.current);
    if (this.pending) return this.pending;

    this.pending = this.bootstrapClient
      .get<CsrfTokenResponse>("/api/v1/csrf")
      .then((response) => {
        const data = response.data;
        if (!data?.headerName || !data?.token) {
          throw new Error("The server returned an invalid CSRF token response");
        }
        this.current = { headerName: data.headerName, token: data.token };
        return this.current;
      })
      .finally(() => {
        this.pending = null;
      });

    return this.pending;
  }

  updateFromResponse(headers: AxiosResponseHeaders | RawAxiosResponseHeaders): void {
    const headerName = this.current?.headerName ?? "X-XSRF-TOKEN";
    const headersWithGet = headers as AxiosResponseHeaders;
    const value = typeof headersWithGet.get === "function"
      ? headersWithGet.get(headerName)
      : headers[headerName.toLowerCase()];
    if (typeof value === "string" && value.length > 0) {
      this.current = { headerName, token: value };
    }
  }

  clear(): void {
    this.current = null;
    this.pending = null;
  }
}

export function isUnsafeMethod(method?: string): boolean {
  return ["post", "put", "patch", "delete"].includes((method ?? "get").toLowerCase());
}

export function isCsrfFailureCode(code: unknown): boolean {
  return code === "CSRF_TOKEN_MISSING" || code === "CSRF_TOKEN_INVALID";
}
