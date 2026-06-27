import {
  ChatGptOAuthClient,
  extractChatGptAccountId,
  readChatGptOAuthEnv,
  type ChatGptOAuthSession,
  type ChatGptTokenResponse
} from "@tamsi/ai";
import { cookies } from "next/headers";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export const CHATGPT_COOKIE_NAMES = {
  state: "tamsi_chatgpt_oauth_state",
  pkceVerifier: "tamsi_chatgpt_pkce_verifier",
  accessToken: "tamsi_chatgpt_access_token",
  refreshToken: "tamsi_chatgpt_refresh_token",
  accountId: "tamsi_chatgpt_account_id",
  expiresAt: "tamsi_chatgpt_token_expires_at",
  connected: "tamsi_chatgpt_connected"
} as const;

export type CookieStore = Awaited<ReturnType<typeof cookies>>;

export function createChatGptOAuthClient() {
  const config = readChatGptOAuthEnv();
  return new ChatGptOAuthClient(config);
}

export function readChatGptSession(cookieStore: CookieStore): ChatGptOAuthSession | null {
  const accessToken = cookieStore.get(CHATGPT_COOKIE_NAMES.accessToken)?.value;
  const accountId = cookieStore.get(CHATGPT_COOKIE_NAMES.accountId)?.value;

  if (!accessToken || !accountId) {
    return null;
  }

  const expiresAtRaw = cookieStore.get(CHATGPT_COOKIE_NAMES.expiresAt)?.value;
  const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : undefined;

  return {
    accessToken,
    accountId,
    refreshToken: cookieStore.get(CHATGPT_COOKIE_NAMES.refreshToken)?.value,
    expiresAt: Number.isFinite(expiresAt) ? expiresAt : undefined
  };
}

export function isChatGptConnected(cookieStore: CookieStore): boolean {
  return Boolean(readChatGptSession(cookieStore));
}

export async function ensureValidChatGptSession(cookieStore: CookieStore): Promise<ChatGptOAuthSession | null> {
  const session = readChatGptSession(cookieStore);
  if (!session) {
    return null;
  }

  const expiresAt = session.expiresAt ?? 0;
  const refreshBufferMs = 5 * 60 * 1000;
  if (expiresAt > Date.now() + refreshBufferMs) {
    return session;
  }

  if (!session.refreshToken) {
    return session;
  }

  try {
    const client = createChatGptOAuthClient();
    const refreshed = await client.refreshAccessToken(session.refreshToken);
    writeChatGptSessionCookies(cookieStore, refreshed);
    return readChatGptSession(cookieStore);
  } catch {
    clearChatGptSessionCookies(cookieStore);
    return null;
  }
}

export function writeChatGptSessionCookies(cookieStore: CookieStore, tokens: ChatGptTokenResponse) {
  const accountId = extractChatGptAccountId(tokens.access_token, tokens.id_token);
  const expiresAt = Date.now() + tokens.expires_in * 1000;
  const secure = process.env.NODE_ENV === "production";
  const cookieBase: Partial<ResponseCookie> = {
    path: "/",
    sameSite: "lax",
    secure
  };

  cookieStore.set(CHATGPT_COOKIE_NAMES.accessToken, tokens.access_token, {
    ...cookieBase,
    httpOnly: true,
    maxAge: tokens.expires_in
  });
  cookieStore.set(CHATGPT_COOKIE_NAMES.accountId, accountId, {
    ...cookieBase,
    httpOnly: true,
    maxAge: tokens.expires_in
  });
  cookieStore.set(CHATGPT_COOKIE_NAMES.expiresAt, String(expiresAt), {
    ...cookieBase,
    httpOnly: true,
    maxAge: tokens.expires_in
  });
  cookieStore.set(CHATGPT_COOKIE_NAMES.connected, "true", {
    ...cookieBase,
    httpOnly: false,
    maxAge: tokens.expires_in
  });

  if (tokens.refresh_token) {
    cookieStore.set(CHATGPT_COOKIE_NAMES.refreshToken, tokens.refresh_token, {
      ...cookieBase,
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30
    });
  }
}

export function writeOAuthFlowCookies(cookieStore: CookieStore, state: string, verifier: string) {
  const secure = process.env.NODE_ENV === "production";
  const flowCookieBase: Partial<ResponseCookie> = {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure
  };

  cookieStore.set(CHATGPT_COOKIE_NAMES.state, state, flowCookieBase);
  cookieStore.set(CHATGPT_COOKIE_NAMES.pkceVerifier, verifier, flowCookieBase);
}

export function clearOAuthFlowCookies(cookieStore: CookieStore) {
  cookieStore.delete(CHATGPT_COOKIE_NAMES.state);
  cookieStore.delete(CHATGPT_COOKIE_NAMES.pkceVerifier);
}

export function clearChatGptSessionCookies(cookieStore: CookieStore) {
  for (const name of Object.values(CHATGPT_COOKIE_NAMES)) {
    cookieStore.delete(name);
  }
}
