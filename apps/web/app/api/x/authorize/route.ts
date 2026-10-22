import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth/config";
import {
  getOAuthConfig,
  generatePKCE,
  generateState,
  buildAuthorizationUrl,
} from "@/lib/x-api/oauth";

const OAUTH_COOKIE_NAME = "x_oauth_pkce";
const COOKIE_MAX_AGE = 600;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const config = getOAuthConfig();
  if (!config) {
    return NextResponse.json(
      { error: "X API is not configured. Set X_CLIENT_ID and X_CLIENT_SECRET." },
      { status: 503 }
    );
  }

  const state = generateState();
  const { codeVerifier, codeChallenge } = generatePKCE();

  const cookieStore = await cookies();
  cookieStore.set(OAUTH_COOKIE_NAME, JSON.stringify({ state, codeVerifier }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  const authUrl = buildAuthorizationUrl(config, state, codeChallenge);
  return NextResponse.redirect(authUrl);
}
