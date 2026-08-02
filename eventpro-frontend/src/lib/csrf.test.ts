import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CsrfTokenManager, isCsrfFailureCode, isUnsafeMethod } from "@/lib/csrf";

vi.mock("axios", () => ({
  default: {
    create: vi.fn(),
  },
}));

describe("CsrfTokenManager", () => {
  const get = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axios.create).mockReturnValue({ get } as never);
  });

  it("shares one bootstrap request across concurrent callers", async () => {
    get.mockResolvedValue({
      data: { headerName: "X-XSRF-TOKEN", parameterName: "_csrf", token: "token-1" },
    });
    const manager = new CsrfTokenManager("");

    const [first, second] = await Promise.all([manager.getToken(), manager.getToken()]);

    expect(get).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
    expect(first.token).toBe("token-1");
  });

  it("force refresh replaces the in-memory token", async () => {
    get
      .mockResolvedValueOnce({
        data: { headerName: "X-XSRF-TOKEN", parameterName: "_csrf", token: "token-1" },
      })
      .mockResolvedValueOnce({
        data: { headerName: "X-XSRF-TOKEN", parameterName: "_csrf", token: "token-2" },
      });
    const manager = new CsrfTokenManager("");

    await manager.getToken();
    const refreshed = await manager.getToken(true);

    expect(get).toHaveBeenCalledTimes(2);
    expect(refreshed.token).toBe("token-2");
  });

  it("accepts the rotated token from a login response header", async () => {
    get.mockResolvedValue({
      data: { headerName: "X-XSRF-TOKEN", parameterName: "_csrf", token: "token-1" },
    });
    const manager = new CsrfTokenManager("");
    await manager.getToken();

    manager.updateFromResponse({ "x-xsrf-token": "rotated" });

    await expect(manager.getToken()).resolves.toEqual({
      headerName: "X-XSRF-TOKEN",
      token: "rotated",
    });
  });
});

describe("CSRF request policy", () => {
  it.each(["post", "PUT", "patch", "DELETE"])("treats %s as unsafe", (method) => {
    expect(isUnsafeMethod(method)).toBe(true);
  });

  it.each(["get", "HEAD", "options", undefined])("does not block safe method %s", (method) => {
    expect(isUnsafeMethod(method)).toBe(false);
  });

  it("retries only explicit CSRF failure codes", () => {
    expect(isCsrfFailureCode("CSRF_TOKEN_MISSING")).toBe(true);
    expect(isCsrfFailureCode("CSRF_TOKEN_INVALID")).toBe(true);
    expect(isCsrfFailureCode("ACCESS_DENIED")).toBe(false);
    expect(isCsrfFailureCode(undefined)).toBe(false);
  });
});
