import { streamText } from "ai";
import { createChatGPTOAuth } from "ai-sdk-provider-chatgpt-oauth";
import { buildAdvisorSystemPrompt, buildAdvisorUserContext, type AdvisorContext } from "./advisor";
import { generateTextWithChatGptAccount } from "./chatgpt-oauth/generate";
import { toChatGptCredentials } from "./chatgpt-oauth/session";
import type { ChatGptOAuthSession } from "./chatgpt-oauth/session";

export type AdvisorServiceConfig = {
  model: string;
  credentials: ChatGptOAuthSession;
};

export async function generateAdvisorAdvice(context: AdvisorContext, config: AdvisorServiceConfig) {
  const credentials = toChatGptCredentials(config.credentials);

  const result = await generateTextWithChatGptAccount({
    credentials,
    preferredModel: config.model,
    system: buildAdvisorSystemPrompt(),
    prompt: buildAdvisorUserContext(context)
  });

  return result.text;
}

export function streamAdvisorAdvice(context: AdvisorContext, config: AdvisorServiceConfig) {
  const credentials = toChatGptCredentials(config.credentials);
  const chatgpt = createChatGPTOAuth({
    credentials,
    autoRefresh: Boolean(credentials.refreshToken)
  });

  return streamText({
    model: chatgpt(config.model),
    system: buildAdvisorSystemPrompt(),
    prompt: buildAdvisorUserContext(context)
  });
}
