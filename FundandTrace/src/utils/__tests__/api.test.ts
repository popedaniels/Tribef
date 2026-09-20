import { getApiBaseUrl } from "../api";

describe("getApiBaseUrl", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("prefers NEXT_PUBLIC_API_URL when set", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
    expect(getApiBaseUrl()).toBe("https://api.example.com");
  });

  it("falls back to the current origin in the browser", () => {
    expect(getApiBaseUrl()).toBe(window.location.origin);
  });
});
