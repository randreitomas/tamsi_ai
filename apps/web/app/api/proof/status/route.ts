import { isChatGptOAuthConfigured, readChatGptOAuthEnv } from "@tamsi/ai";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ensureValidChatGptSession } from "../../../../lib/chatgpt-oauth-session";

export async function GET() {
  const cookieStore = await cookies();
  const mockMode = process.env.TAMSI_USE_MOCK_AI === "true";
  const configured = isChatGptOAuthConfigured();
  const session = mockMode ? null : await ensureValidChatGptSession(cookieStore);
  const { model, issuer, redirectUri } = readChatGptOAuthEnv();

  return NextResponse.json({
    chatgptOAuth: {
      configured,
      connected: mockMode ? false : Boolean(session),
      mockMode,
      issuer,
      redirectUri
    },
    extraction: {
      model,
      provider: "ai-sdk-provider-chatgpt-oauth",
      ready: mockMode || Boolean(session)
    },
    advisor: {
      model,
      ready: mockMode ? false : Boolean(session)
    }
  });
}
