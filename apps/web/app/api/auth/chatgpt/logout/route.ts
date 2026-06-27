import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clearChatGptSessionCookies } from "../../../../../lib/chatgpt-oauth-session";

export async function POST() {
  const cookieStore = await cookies();
  clearChatGptSessionCookies(cookieStore);

  return NextResponse.json({ disconnected: true });
}
