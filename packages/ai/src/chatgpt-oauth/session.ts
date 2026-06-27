import type { ChatGPTOAuthCredentials } from "ai-sdk-provider-chatgpt-oauth";

export type ChatGptOAuthSession = ChatGPTOAuthCredentials;

export function toChatGptCredentials(session: ChatGptOAuthSession): ChatGPTOAuthCredentials {
  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    accountId: session.accountId,
    expiresAt: session.expiresAt
  };
}

export function isSessionExpired(session: ChatGptOAuthSession, bufferMs = 5 * 60 * 1000): boolean {
  if (!session.expiresAt) {
    return false;
  }

  return session.expiresAt <= Date.now() + bufferMs;
}
