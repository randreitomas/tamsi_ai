import type { ChatGptOAuthClientConfig, ChatGptTokenResponse } from "./client";

const DEVICE_USER_CODE_URL = "https://auth.openai.com/api/accounts/deviceauth/usercode";
const DEVICE_TOKEN_URL = "https://auth.openai.com/api/accounts/deviceauth/token";
export const CHATGPT_DEVICE_VERIFICATION_URL = "https://auth.openai.com/codex/device";
const DEVICE_TOKEN_EXCHANGE_REDIRECT_URI = "https://auth.openai.com/deviceauth/callback";
const DEFAULT_POLL_INTERVAL_MS = 5000;
const DEFAULT_DEVICE_TIMEOUT_MS = 15 * 60 * 1000;

export type ChatGptDeviceCodeSession = {
  deviceAuthId: string;
  userCode: string;
  verificationUrl: string;
  intervalMs: number;
};

type DeviceUserCodeResponse = {
  device_auth_id: string;
  user_code?: string;
  usercode?: string;
  interval?: number | string;
};

type DevicePollResponse = {
  authorization_code: string;
  code_verifier: string;
  code_challenge?: string;
};

export class ChatGptDeviceOAuthClient {
  private readonly clientId: string;
  private readonly issuer: string;

  constructor(config: ChatGptOAuthClientConfig) {
    this.clientId = config.clientId;
    this.issuer = config.issuer.replace(/\/$/, "");
  }

  async startDeviceAuth(): Promise<ChatGptDeviceCodeSession> {
    const response = await fetch(DEVICE_USER_CODE_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ client_id: this.clientId })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Device code request failed (${response.status}): ${errorBody}`);
    }

    const payload = (await response.json()) as DeviceUserCodeResponse;
    const userCode = payload.user_code ?? payload.usercode;

    if (!payload.device_auth_id || !userCode) {
      throw new Error("Device code response was missing required fields.");
    }

    return {
      deviceAuthId: payload.device_auth_id,
      userCode,
      verificationUrl: CHATGPT_DEVICE_VERIFICATION_URL,
      intervalMs: parsePollIntervalMs(payload.interval)
    };
  }

  async completeDeviceAuth(
    session: Pick<ChatGptDeviceCodeSession, "deviceAuthId" | "userCode" | "intervalMs">,
    options?: { timeoutMs?: number; signal?: AbortSignal }
  ): Promise<ChatGptTokenResponse> {
    const deadline = Date.now() + (options?.timeoutMs ?? DEFAULT_DEVICE_TIMEOUT_MS);

    while (Date.now() < deadline) {
      if (options?.signal?.aborted) {
        throw new Error("Device authentication was cancelled.");
      }

      const pollResponse = await fetch(DEVICE_TOKEN_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          device_auth_id: session.deviceAuthId,
          user_code: session.userCode
        }),
        signal: options?.signal
      });

      if (pollResponse.ok) {
        const payload = (await pollResponse.json()) as DevicePollResponse;

        if (!payload.authorization_code || !payload.code_verifier) {
          throw new Error("Device token response was missing authorization details.");
        }

        return this.exchangeDeviceAuthorizationCode(payload.authorization_code, payload.code_verifier);
      }

      if (pollResponse.status === 403 || pollResponse.status === 404) {
        await sleep(session.intervalMs, options?.signal);
        continue;
      }

      const errorBody = await pollResponse.text();
      throw new Error(`Device token polling failed (${pollResponse.status}): ${errorBody}`);
    }

    throw new Error("Device authentication timed out. Try connecting again.");
  }

  private async exchangeDeviceAuthorizationCode(
    authorizationCode: string,
    codeVerifier: string
  ): Promise<ChatGptTokenResponse> {
    const response = await fetch(`${this.issuer}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: this.clientId,
        code: authorizationCode,
        code_verifier: codeVerifier,
        redirect_uri: DEVICE_TOKEN_EXCHANGE_REDIRECT_URI
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Device token exchange failed (${response.status}): ${errorBody}`);
    }

    return response.json() as Promise<ChatGptTokenResponse>;
  }
}

function parsePollIntervalMs(value: number | string | undefined): number {
  if (typeof value === "number" && value > 0) {
    return value * 1000;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed * 1000;
    }
  }

  return DEFAULT_POLL_INTERVAL_MS;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timeout);
      reject(new Error("Device authentication was cancelled."));
    };

    if (signal) {
      if (signal.aborted) {
        clearTimeout(timeout);
        reject(new Error("Device authentication was cancelled."));
        return;
      }

      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}
