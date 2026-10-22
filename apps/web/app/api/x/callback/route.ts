import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { getDb, schema } from "@/lib/db";
import {
  getOAuthConfig,
  exchangeCodeForToken,
} from "@/lib/x-api/oauth";
import { createXApiClient } from "@/lib/x-api/client";
import { encryptToken } from "@/lib/x-api/encryption";
import { xOAuthCallbackSchema, xOAuthStateSchema } from "@/lib/validators/x";

const OAUTH_COOKIE_NAME = "x_oauth_pkce";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const cookieStore = await cookies();

  try {
    const searchParams = request.nextUrl.searchParams;
    const error = searchParams.get("error");

    if (error) {
      const errorDesc = searchParams.get("error_description") || error;
      return NextResponse.redirect(
        new URL(`/settings?x_error=${encodeURIComponent(errorDesc)}`, request.url)
      );
    }

    const callbackParsed = xOAuthCallbackSchema.safeParse({
      code: searchParams.get("code"),
      state: searchParams.get("state"),
    });

    if (!callbackParsed.success) {
      return NextResponse.redirect(
        new URL("/settings?x_error=Invalid+callback+parameters", request.url)
      );
    }

    const rawCookie = cookieStore.get(OAUTH_COOKIE_NAME)?.value;
    if (!rawCookie) {
      return NextResponse.redirect(
        new URL("/settings?x_error=OAuth+session+expired.+Please+try+again.", request.url)
      );
    }

    let storedState: { state: string; codeVerifier: string };
    try {
      const parsed = JSON.parse(rawCookie);
      const validated = xOAuthStateSchema.safeParse(parsed);
      if (!validated.success) throw new Error("Invalid cookie data");
      storedState = validated.data;
    } catch {
      return NextResponse.redirect(
        new URL("/settings?x_error=Invalid+OAuth+session", request.url)
      );
    }

    if (callbackParsed.data.state !== storedState.state) {
      return NextResponse.redirect(
        new URL("/settings?x_error=State+mismatch.+Possible+CSRF+attack.", request.url)
      );
    }

    const config = getOAuthConfig();
    if (!config) {
      return NextResponse.redirect(
        new URL("/settings?x_error=X+API+not+configured", request.url)
      );
    }

    const tokenResponse = await exchangeCodeForToken(
      config,
      callbackParsed.data.code,
      storedState.codeVerifier
    );

    const client = createXApiClient(tokenResponse.access_token, null);
    const xUser = await client.getMe();

    const encryptedAccess = encryptToken(tokenResponse.access_token);
    const encryptedRefresh = tokenResponse.refresh_token
      ? encryptToken(tokenResponse.refresh_token)
      : null;
    const expiresAt = new Date(
      Date.now() + tokenResponse.expires_in * 1000
    );

    const db = getDb();
    const userId = session.user.id;

    const [existing] = await db
      .select()
      .from(schema.xAccounts)
      .where(
        and(
          eq(schema.xAccounts.userId, userId),
          eq(schema.xAccounts.xUserId, xUser.id)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(schema.xAccounts)
        .set({
          xUsername: xUser.username,
          xDisplayName: xUser.name,
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
          tokenExpiresAt: expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(schema.xAccounts.id, existing.id));
    } else {
      await db.insert(schema.xAccounts).values({
        userId,
        xUserId: xUser.id,
        xUsername: xUser.username,
        xDisplayName: xUser.name,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: expiresAt,
      });
    }

    cookieStore.delete(OAUTH_COOKIE_NAME);

    return NextResponse.redirect(
      new URL(
        `/settings?x_success=${encodeURIComponent(`Connected @${xUser.username}`)}`,
        request.url
      )
    );
  } catch (e) {
    cookieStore.delete(OAUTH_COOKIE_NAME);
    const message =
      e instanceof Error ? e.message : "Unknown error during OAuth";
    return NextResponse.redirect(
      new URL(
        `/settings?x_error=${encodeURIComponent(message.slice(0, 200))}`,
        request.url
      )
    );
  }
}
