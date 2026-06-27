import {
  generateAdvisorAdvice,
  isChatGptOAuthConfigured,
  readChatGptOAuthEnv,
  type AdvisorContext
} from "@tamsi/ai";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ensureValidChatGptSession } from "../../../lib/chatgpt-oauth-session";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as AdvisorContext;
  const cookieStore = await cookies();
  const session = await ensureValidChatGptSession(cookieStore);

  if (!session) {
    return NextResponse.json(
      {
        error: "Connect ChatGPT before requesting academic advice.",
        action: "chatgpt_oauth_required"
      },
      { status: 401 }
    );
  }

  if (!body?.computedMetrics || typeof body.computedMetrics !== "object") {
    return NextResponse.json({ error: "Provide computedMetrics for the advisor." }, { status: 400 });
  }

  try {
    const { model } = readChatGptOAuthEnv();
    const advice = await generateAdvisorAdvice(body, {
      model,
      credentials: session
    });

    return NextResponse.json({ advice });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Advisor request failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function GET() {
  const configured = isChatGptOAuthConfigured();
  const cookieStore = await cookies();
  const connected = Boolean(await ensureValidChatGptSession(cookieStore));

  return NextResponse.json({
    configured,
    connected,
    model: readChatGptOAuthEnv().model
  });
}
