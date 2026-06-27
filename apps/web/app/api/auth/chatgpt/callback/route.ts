import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  CHATGPT_COOKIE_NAMES,
  clearOAuthFlowCookies,
  createChatGptOAuthClient,
  writeChatGptSessionCookies
} from "../../../../../lib/chatgpt-oauth-session";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");
  const cookieStore = await cookies();

  if (oauthError) {
    clearOAuthFlowCookies(cookieStore);
    return NextResponse.redirect(new URL(`/?chatgpt=${encodeURIComponent(oauthError)}`, request.url));
  }

  const expectedState = cookieStore.get(CHATGPT_COOKIE_NAMES.state)?.value;
  const verifier = cookieStore.get(CHATGPT_COOKIE_NAMES.pkceVerifier)?.value;

  if (!code || !state || !expectedState || !verifier || state !== expectedState) {
    clearOAuthFlowCookies(cookieStore);
    return NextResponse.redirect(new URL("/?chatgpt=invalid_state", request.url));
  }

  try {
    const client = createChatGptOAuthClient();
    const tokens = await client.exchangeCodeForTokens(code, verifier);

    clearOAuthFlowCookies(cookieStore);
    writeChatGptSessionCookies(cookieStore, tokens);

    return NextResponse.redirect(new URL("/upload?chatgpt=connected", request.url));
  } catch {
    clearOAuthFlowCookies(cookieStore);
    return NextResponse.redirect(new URL("/?chatgpt=token_failed", request.url));
  }
}
