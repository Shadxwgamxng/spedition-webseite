import { cookies } from "next/headers";
import { verifyDiscordLogin } from "@/lib/server/store";
import { createSessionToken, sessionCookieHeader, verifyOAuthState } from "@/lib/server/session";

const STATE_COOKIE = "bf_oauth_state";

function redirectToLogin(origin: string, error: string, extraSetCookie?: string) {
  const url = new URL("/mitarbeiter/login", origin);
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

  if (!code || !state || state !== savedState || !verifyOAuthState(state)) {
    return redirectToLogin(url.origin, "state", clearStateCookie);
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    return redirectToLogin(url.origin, "config", clearStateCookie);
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
    if (!tokenRes.ok) return redirectToLogin(url.origin, "token", clearStateCookie);
    const tokenJson = await tokenRes.json();

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `${tokenJson.token_type} ${tokenJson.access_token}` },
    });
    if (!userRes.ok) return redirectToLogin(url.origin, "profile", clearStateCookie);
    const discordUser = await userRes.json();

    const employee = await verifyDiscordLogin(String(discordUser.id));
    if (!employee) return redirectToLogin(url.origin, "unlinked", clearStateCookie);

    const sessionToken = createSessionToken(employee);
    const dest = new URL("/mitarbeiter", url.origin);
    const headers = new Headers({ Location: dest.toString() });
    headers.append("Set-Cookie", clearStateCookie);
    headers.append("Set-Cookie", sessionCookieHeader(sessionToken));
    return new Response(null, { status: 302, headers });
  } catch {
    return redirectToLogin(url.origin, "unknown", clearStateCookie);
  }
}
