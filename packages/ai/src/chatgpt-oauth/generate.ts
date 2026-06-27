import { createChatGPTOAuth, type ChatGPTOAuthCredentials } from "ai-sdk-provider-chatgpt-oauth";
import { generateText } from "ai";
import { getChatGptAccountModelCandidates, isChatGptAccountModelUnsupportedError } from "./models";

type GenerateWithChatGptAccountInput<TResult> = {
  credentials: ChatGPTOAuthCredentials;
  preferredModel: string;
  run: (modelId: string) => Promise<TResult>;
};

export async function generateWithChatGptAccount<TResult>(input: GenerateWithChatGptAccountInput<TResult>) {
  const candidates = getChatGptAccountModelCandidates(input.preferredModel);
  let lastError: unknown;

  for (const modelId of candidates) {
    try {
      return await input.run(modelId);
    } catch (error) {
      if (!isChatGptAccountModelUnsupportedError(error)) {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("No supported ChatGPT account model is available.");
}

export async function generateTextWithChatGptAccount(input: {
  credentials: ChatGPTOAuthCredentials;
  preferredModel: string;
  system: string;
  prompt: string;
}) {
  const provider = createChatGPTOAuth({
    credentials: input.credentials,
    autoRefresh: Boolean(input.credentials.refreshToken)
  });

  return generateWithChatGptAccount({
    credentials: input.credentials,
    preferredModel: input.preferredModel,
    run: (modelId) =>
      generateText({
        model: provider(modelId),
        system: input.system,
        prompt: input.prompt
      })
  });
}
