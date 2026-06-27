import { normalizeChatGptAccountModel } from "./models";

export type ChatGptOAuthEnvConfig = {
  clientId: string;
  issuer: string;
  redirectUri: string;
  scope: string;
  model: string;
};

const DEFAULT_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const DEFAULT_ISSUER = "https://auth.openai.com";
const DEFAULT_SCOPE = "openid profile email offline_access";
const DEFAULT_MODEL = "gpt-5.5";
const DEFAULT_REDIRECT_URI = "http://127.0.0.1:1455/auth/callback";

export function readChatGptOAuthEnv(env: NodeJS.ProcessEnv = process.env): ChatGptOAuthEnvConfig {
  return {
    clientId: readEnvValue(env.CHATGPT_OAUTH_CLIENT_ID, DEFAULT_CLIENT_ID),
    issuer: readEnvValue(
      env.CHATGPT_OAUTH_ISSUER ?? env.CHATGPT_OAUTH_AUTHORIZATION_URL?.replace(/\/oauth\/authorize$/, ""),
      DEFAULT_ISSUER
    ),
    redirectUri: readEnvValue(env.CHATGPT_OAUTH_REDIRECT_URI, DEFAULT_REDIRECT_URI),
    scope: readEnvValue(env.CHATGPT_OAUTH_SCOPES, DEFAULT_SCOPE),
    model: normalizeChatGptAccountModel(readEnvValue(env.GPT_MODEL, DEFAULT_MODEL))
  };
}

function readEnvValue(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

export function isChatGptOAuthConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  const config = readChatGptOAuthEnv(env);
  return Boolean(config.clientId && config.issuer && config.redirectUri);
}
