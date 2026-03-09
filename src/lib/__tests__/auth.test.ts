import { test, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({}));

const { mockSign, mockSetProtectedHeader, mockSetExpirationTime, mockSetIssuedAt, MockSignJWT, mockCookieSet, mockCookieStore } = vi.hoisted(() => {
  const mockSign = vi.fn().mockResolvedValue("mock-token");
  const mockSetExpirationTime = vi.fn();
  const mockSetIssuedAt = vi.fn();
  const mockSetProtectedHeader = vi.fn();
  const instance = {
    setProtectedHeader: mockSetProtectedHeader,
    setExpirationTime: mockSetExpirationTime,
    setIssuedAt: mockSetIssuedAt,
    sign: mockSign,
  };
  mockSetProtectedHeader.mockReturnValue(instance);
  mockSetExpirationTime.mockReturnValue(instance);
  mockSetIssuedAt.mockReturnValue(instance);
  const MockSignJWT = vi.fn().mockReturnValue(instance);

  const mockCookieSet = vi.fn();
  const mockCookieStore = { set: mockCookieSet, get: vi.fn(), delete: vi.fn() };

  return { mockSign, mockSetProtectedHeader, mockSetExpirationTime, mockSetIssuedAt, MockSignJWT, mockCookieSet, mockCookieStore };
});

vi.mock("jose", () => ({ SignJWT: MockSignJWT, jwtVerify: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn().mockResolvedValue(mockCookieStore) }));

import { createSession, getSession } from "../auth";

import { jwtVerify } from "jose";
const mockJwtVerify = vi.mocked(jwtVerify);

beforeEach(() => {
  vi.clearAllMocks();
  mockSign.mockResolvedValue("mock-token");
  mockSetProtectedHeader.mockReturnValue({
    setProtectedHeader: mockSetProtectedHeader,
    setExpirationTime: mockSetExpirationTime,
    setIssuedAt: mockSetIssuedAt,
    sign: mockSign,
  });
});

test("createSession signs a JWT with the userId and email", async () => {
  await createSession("user-1", "user@example.com");

  expect(MockSignJWT).toHaveBeenCalledWith(
    expect.objectContaining({ userId: "user-1", email: "user@example.com" })
  );
});

test("createSession sets HS256 protected header", async () => {
  await createSession("user-1", "user@example.com");

  expect(mockSetProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
});

test("createSession sets expiration to 7d", async () => {
  await createSession("user-1", "user@example.com");

  expect(mockSetExpirationTime).toHaveBeenCalledWith("7d");
});

test("createSession sets the auth-token cookie with the signed token", async () => {
  await createSession("user-1", "user@example.com");

  expect(mockCookieSet).toHaveBeenCalledWith(
    "auth-token",
    "mock-token",
    expect.any(Object)
  );
});

test("createSession sets httpOnly on the cookie", async () => {
  await createSession("user-1", "user@example.com");

  const options = mockCookieSet.mock.calls[0][2];
  expect(options.httpOnly).toBe(true);
});

test("createSession sets sameSite lax on the cookie", async () => {
  await createSession("user-1", "user@example.com");

  const options = mockCookieSet.mock.calls[0][2];
  expect(options.sameSite).toBe("lax");
});

test("createSession sets path / on the cookie", async () => {
  await createSession("user-1", "user@example.com");

  const options = mockCookieSet.mock.calls[0][2];
  expect(options.path).toBe("/");
});

test("createSession sets cookie expiry ~7 days from now", async () => {
  const before = Date.now();
  await createSession("user-1", "user@example.com");
  const after = Date.now();

  const options = mockCookieSet.mock.calls[0][2];
  const expires: Date = options.expires;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 100);
  expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 100);
});

test("createSession sets secure=false outside production", async () => {
  await createSession("user-1", "user@example.com");

  const options = mockCookieSet.mock.calls[0][2];
  expect(options.secure).toBe(false);
});

// getSession tests

test("getSession returns null when no cookie is present", async () => {
  mockCookieStore.get.mockReturnValue(undefined);

  const result = await getSession();

  expect(result).toBeNull();
});

test("getSession returns the session payload when token is valid", async () => {
  const payload = { userId: "user-1", email: "user@example.com", expiresAt: new Date() };
  mockCookieStore.get.mockReturnValue({ value: "valid-token" });
  mockJwtVerify.mockResolvedValue({ payload } as never);

  const result = await getSession();

  expect(result).toEqual(payload);
});

test("getSession calls jwtVerify with the cookie token", async () => {
  mockCookieStore.get.mockReturnValue({ value: "some-token" });
  mockJwtVerify.mockResolvedValue({ payload: {} } as never);

  await getSession();

  expect(mockJwtVerify).toHaveBeenCalledWith("some-token", expect.anything());
});

test("getSession returns null when jwtVerify throws", async () => {
  mockCookieStore.get.mockReturnValue({ value: "bad-token" });
  mockJwtVerify.mockRejectedValue(new Error("invalid signature"));

  const result = await getSession();

  expect(result).toBeNull();
});
