import { isChatGptOAuthConfigured } from "@tamsi/ai";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createChatGptOAuthClient, writeOAuthFlowCookies } from "../../../../../lib/chatgpt-oauth-session";

export async function POST() {
  if (!isChatGptOAuthConfigured()) {
    return NextResponse.json(
      {
        error:
          "ChatGPT OAuth is not configured. Set CHATGPT_OAUTH_CLIENT_ID and CHATGPT_OAUTH_REDIRECT_URI, or rely on the default Codex OAuth client."
      },
      { status: 501 }
    );
  }

  const client = createChatGptOAuthClient();
  const authorization = client.createAuthorizationRequest();
  const cookieStore = await cookies();

  writeOAuthFlowCookies(cookieStore, authorization.state, authorization.verifier);

  return NextResponse.redirect(authorization.url);
}
