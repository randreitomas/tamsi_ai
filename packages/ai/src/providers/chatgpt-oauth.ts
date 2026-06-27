import { extractionPrompt, extractionRetryPrompt } from "../prompts";
import {
  isEmptyTermsExtractionError,
  parseExtractionJson,
  type AcademicExtractor,
  type ExtractGradeReportInput
} from "../extraction";
import { callCodexResponses, getDefaultCodexApiBaseUrl } from "../chatgpt-oauth/codex-responses";
import { generateWithChatGptAccount } from "../chatgpt-oauth/generate";
import { toChatGptCredentials } from "../chatgpt-oauth/session";
import type { ChatGPTOAuthCredentials } from "ai-sdk-provider-chatgpt-oauth";

type ChatGptOAuthExtractorConfig = {
  apiBaseUrl: string;
  model: string;
  credentials: ChatGPTOAuthCredentials;
};

export class ChatGptOAuthVisionExtractor implements AcademicExtractor {
  constructor(private readonly config: ChatGptOAuthExtractorConfig) {}

  async extractGradeReport(input: ExtractGradeReportInput) {
    const credentials = input.credentials ? toChatGptCredentials(input.credentials) : this.config.credentials;

    if (!credentials.accessToken || !credentials.accountId) {
      throw new Error("ChatGPT OAuth credentials are required for extraction.");
    }

    try {
      const result = await this.requestExtraction(credentials, input, extractionPrompt);
      return parseExtractionJson(result);
    } catch (error) {
      if (!isEmptyTermsExtractionError(error)) {
        throw error;
      }

      const retryResult = await this.requestExtraction(credentials, input, extractionRetryPrompt);
      return parseExtractionJson(retryResult);
    }
  }

  private async requestExtraction(
    credentials: ChatGPTOAuthCredentials,
    input: ExtractGradeReportInput,
    prompt: string
  ) {
    return generateWithChatGptAccount({
      credentials,
      preferredModel: this.config.model,
      run: async (modelId) =>
        callCodexResponses({
          apiBaseUrl: this.config.apiBaseUrl,
          credentials,
          model: modelId,
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: `${prompt}\n\nExtract every visible SOLAR Grade Report row from the attached screenshot. Return at least one term with one or more courses. OUTPUT ONLY JSON.`
                },
                {
                  type: "input_image",
                  image_url: input.image.dataUrl,
                  detail: "high"
                }
              ]
            }
          ]
        })
    });
  }
}

export { getDefaultCodexApiBaseUrl };
