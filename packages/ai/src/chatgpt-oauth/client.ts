import { createHash, randomBytes } from "node:crypto";
import { extractAccountIdFromToken } from "ai-sdk-provider-chatgpt-oauth";

export type ChatGptOAuthClientConfig = {
  clientId: string;
  issuer: string;
  redirectUri: string;
  scope?: string;
};

export type ChatGptAuthorizationRequest = {
  url: string;
  state: string;
  verifier: string;
};

export type ChatGptTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  id_token?: string;
};

export class ChatGptOAuthClient {
  private readonly clientId: string;
  private readonly issuer: string;
  private readonly redirectUri: string;
  private readonly scope: string;

  constructor(config: ChatGptOAuthClientConfig) {
    this.clientId = config.clientId;
    this.issuer = config.issuer.replace(/\/$/, "");
    this.redirectUri = config.redirectUri;
    this.scope = config.scope ?? "openid profile email offline_access";
  }

  createAuthorizationRequest(): ChatGptAuthorizationRequest {
    const verifier = randomBytes(32).toString("hex");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const state = randomBytes(16).toString("hex");

    const url = new URL(`${this.issuer}/oauth/authorize`);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("redirect_uri", this.redirectUri);
    url.searchParams.set("scope", this.scope);
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("state", state);
    url.searchParams.set("id_token_add_organizations", "true");
    url.searchParams.set("codex_cli_simplified_flow", "true");
    url.searchParams.set("originator", "codex_cli_rs");

    return { url: url.toString(), state, verifier };
  }

  async exchangeCodeForTokens(code: string, verifier: string): Promise<ChatGptTokenResponse> {
    const response = await fetch(`${this.issuer}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: this.clientId,
        code,
        code_verifier: verifier,
        redirect_uri: this.redirectUri
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Token exchange failed: ${errorBody}`);
    }

    return response.json() as Promise<ChatGptTokenResponse>;
  }

  async refreshAccessToken(refreshToken: string): Promise<ChatGptTokenResponse> {
    const response = await fetch(`${this.issuer}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: this.clientId,
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Token refresh failed: ${errorBody}`);
    }

    return response.json() as Promise<ChatGptTokenResponse>;
  }
}

export function extractChatGptAccountId(accessToken: string, idToken?: string): string {
  const fromAccessToken = extractAccountIdFromAccessToken(accessToken);
  if (fromAccessToken) {
    return fromAccessToken;
  }

  if (idToken) {
    const fromIdToken = extractAccountIdFromToken(idToken);
    if (fromIdToken) {
      return fromIdToken;
    }
  }

  throw new Error("ChatGPT account ID not found in OAuth tokens.");
}

function extractAccountIdFromAccessToken(accessToken: string): string | null {
  const parts = accessToken.split(".");
  if (parts.length !== 3 || !parts[1]) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString()) as Record<string, unknown>;
    const authData = payload["https://api.openai.com/auth"] as Record<string, unknown> | undefined;
    const accountId = authData?.chatgpt_account_id;

    return typeof accountId === "string" && accountId.length > 0 ? accountId : null;
  } catch {
    return null;
  }
}
