import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createChatGptDeviceOAuthClient } from "../../../../../../lib/chatgpt-device-oauth";
import { writeChatGptSessionCookies } from "../../../../../../lib/chatgpt-oauth-session";

type CompleteDeviceAuthBody = {
  deviceAuthId?: string;
  userCode?: string;
  intervalMs?: number;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CompleteDeviceAuthBody;

  if (!body.deviceAuthId || !body.userCode) {
    return NextResponse.json({ error: "Device authentication session is incomplete." }, { status: 400 });
  }

  try {
    const client = createChatGptDeviceOAuthClient();
    const tokens = await client.completeDeviceAuth({
      deviceAuthId: body.deviceAuthId,
      userCode: body.userCode,
      intervalMs: body.intervalMs ?? 5000
    });

    const cookieStore = await cookies();
    writeChatGptSessionCookies(cookieStore, tokens);

    return NextResponse.json({ connected: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Device authentication failed.";
    const status = message.includes("timed out") ? 408 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
