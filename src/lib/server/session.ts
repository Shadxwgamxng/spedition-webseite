import { createHmac, timingSafeEqual } from "node:crypto";
import type { PublicEmployee } from "@/lib/server/db-types";

export const SESSION_COOKIE = "bf_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 Tage

/**
 * Signing secret for session cookies. Falls back to a secret generated once
 * per server process if SESSION_SECRET isn't set — fine for local dev, but
 * means every deployed instance/restart invalidates existing sessions unless
 * a real SESSION_SECRET env var is configured (see README).
 */
function getSecret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const globalKey = "__bf_session_secret__";
  const g = globalThis as unknown as Record<string, string | undefined>;
  if (!g[globalKey]) {
    g[globalKey] = createHmac("sha256", `${Date.now()}-${Math.random()}`).update("fallback").digest("hex");
  }
  return g[globalKey]!;
}

function base64url(input: string): string {
  return Buffer.from(input, "utf-8").toString("base64url");
}

function fromBase64url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf-8");
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function createSessionToken(user: PublicEmployee): string {
  const payload = base64url(JSON.stringify({ user, exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000 }));
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): PublicEmployee | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(fromBase64url(payload)) as { user: PublicEmployee; exp: number };
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return data.user;
  } catch {
    return null;
  }
}

export function sessionCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`;
}

export function clearSessionCookieHeader(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

/** Short-lived, signed CSRF "state" token for the Discord OAuth round-trip. */
export function createOAuthState(): string {
  const payload = base64url(JSON.stringify({ n: Math.random().toString(36).slice(2), exp: Date.now() + 10 * 60 * 1000 }));
  return `${payload}.${sign(payload)}`;
}

export function verifyOAuthState(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = sign(payload);
  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(fromBase64url(payload)) as { exp: number };
    return typeof data.exp === "number" && data.exp >= Date.now();
  } catch {
    return false;
  }
}
