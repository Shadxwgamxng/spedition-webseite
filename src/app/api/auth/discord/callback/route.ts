import { cookies } from "next/headers";
import { verifyCustomerLogin, verifyDiscordLogin } from "@/lib/server/store";
import {
  createCustomerSessionToken,
  createSessionToken,
  customerSessionCookieHeader,
  sessionCookieHeader,

  verifyOAuthState,
  type OAuthPurpose,
} from "@/lib/server/session";

const STATE_COOKIE = "bf_oauth_state";
const APP_ORIGIN = process.env.APP_URL || "https://baltic-freight.de";

const LOGIN_PATH: Record<OAuthPurpose, string> = {
  employee: "/mitarbeiter/login",
  customer: "/kunden/login",
};

function redirectToLogin(origin: string, purpose: OAuthPurpose, error: string, extraSetCookie?: string) {
  const url = new URL(LOGIN_PATH[purpose], origin);
  url.searchParams.set("error", error);
  const headers = new Headers({ Location: url.toString() });
  if (extraSetCookie) headers.append("Set-Cookie", extraSetCookie);
  return new Response(null, { status: 302, headers });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const savedState = cookieStore.get(STATE_COOKIE)?.value;
  const clearStateCookie = `${STATE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

  const purpose = state && state === savedState ? verifyOAuthState(state) : null;
  if (!code || !purpose) {
    // No valid state to read a purpose from — the employee login is the safer default landing page.
    return redirectToLogin(APP_ORIGIN, "employee", "state", clearStateCookie);
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    return redirectToLogin(APP_ORIGIN, purpose, "config", clearStateCookie);
  }

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });
    if (!tokenRes.ok) return redirectToLogin(APP_ORIGIN, purpose, "token", clearStateCookie);
    const tokenJson = await tokenRes.json();

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `${tokenJson.token_type} ${tokenJson.access_token}` },
    });
    if (!userRes.ok) return redirectToLogin(APP_ORIGIN, purpose, "profile", clearStateCookie);
    const discordUser = await userRes.json();

    if (purpose === "customer") {
      const customer = await verifyCustomerLogin(String(discordUser.id));
      if (!customer) return redirectToLogin(APP_ORIGIN, purpose, "unlinked", clearStateCookie);

      const sessionToken = createCustomerSessionToken(customer);
      const dest = new URL("/kunden", APP_ORIGIN);
      const headers = new Headers({ Location: dest.toString() });
      headers.append("Set-Cookie", clearStateCookie);
      headers.append("Set-Cookie", customerSessionCookieHeader(sessionToken));
      return new Response(null, { status: 302, headers });
    }

    const employee = await verifyDiscordLogin(String(discordUser.id));
    if (!employee) return redirectToLogin(APP_ORIGIN, purpose, "unlinked", clearStateCookie);

    const sessionToken = createSessionToken(employee);
    const dest = new URL("/mitarbeiter", APP_ORIGIN);
    const headers = new Headers({ Location: dest.toString() });
    headers.append("Set-Cookie", clearStateCookie);
    headers.append("Set-Cookie", sessionCookieHeader(sessionToken));
    return new Response(null, { status: 302, headers });
  } catch {
    return redirectToLogin(APP_ORIGIN, purpose, "unknown", clearStateCookie);
  }
}
