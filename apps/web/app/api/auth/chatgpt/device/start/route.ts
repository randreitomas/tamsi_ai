import { NextResponse } from "next/server";
import { createChatGptDeviceOAuthClient } from "../../../../../../lib/chatgpt-device-oauth";

export async function POST() {
  try {
    const client = createChatGptDeviceOAuthClient();
    const session = await client.startDeviceAuth();

    return NextResponse.json({
      deviceAuthId: session.deviceAuthId,
      userCode: session.userCode,
      verificationUrl: session.verificationUrl,
      intervalMs: session.intervalMs
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start device authentication.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
