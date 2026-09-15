import { createOAuthState, type OAuthPurpose } from "@/lib/server/session";

const STATE_COOKIE = "bf_oauth_state";

/**
 * Same Discord app / same registered redirect URI serves both login flows —
 * ?purpose=customer here starts the Bestandskunden-Login (/kunden), anything
 * else (or omitted) starts the employee login. See createOAuthState() for why.
 */
export async function GET(request: Request) {
  const purpose: OAuthPurpose = new URL(request.url).searchParams.get("purpose") === "customer" ? "customer" : "employee";
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return Response.json(
      {
        ok: false,
        error:
          "Discord-Login ist serverseitig nicht konfiguriert (DISCORD_CLIENT_ID / DISCORD_REDIRECT_URI fehlen). Siehe README.",
      },
      { status: 500 },
    );
  }

  const state = createOAuthState(purpose);
  const authorizeUrl = new URL("https://discord.com/oauth2/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "identify");
  authorizeUrl.searchParams.set("state", state);

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizeUrl.toString(),
      "Set-Cookie": `${STATE_COOKIE}=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}`,
    },
  });
}
