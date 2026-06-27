import type { ChatGPTOAuthCredentials } from "ai-sdk-provider-chatgpt-oauth";

const DEFAULT_CODEX_API_BASE_URL = "https://chatgpt.com/backend-api";

export type CodexResponsesInput = Array<{
  role: "user";
  content: Array<
    | { type: "input_text"; text: string }
    | { type: "input_image"; image_url: string; detail?: "auto" | "low" | "high" }
  >;
}>;

type CallCodexResponsesOptions = {
  credentials: ChatGPTOAuthCredentials;
  model: string;
  input: CodexResponsesInput;
  apiBaseUrl?: string;
};

export async function callCodexResponses(options: CallCodexResponsesOptions): Promise<string> {
  const baseUrl = (options.apiBaseUrl ?? DEFAULT_CODEX_API_BASE_URL).replace(/\/$/, "");

  const response = await fetch(`${baseUrl}/codex/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.credentials.accessToken}`,
      "chatgpt-account-id": options.credentials.accountId,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      "OpenAI-Beta": "responses=experimental",
      originator: "tamsi"
    },
    body: JSON.stringify({
      model: options.model,
      input: options.input,
      store: false,
      stream: true,
      parallel_tool_calls: false,
      reasoning: null
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`ChatGPT OAuth API error: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  return readCodexSseText(response);
}

export function getDefaultCodexApiBaseUrl(): string {
  return DEFAULT_CODEX_API_BASE_URL;
}

async function readCodexSseText(response: Response): Promise<string> {
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error("Codex response did not include a stream body.");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) {
          continue;
        }

        const data = line.slice(6).trim();
        if (!data || data === "[DONE]") {
          continue;
        }

        try {
          const event = JSON.parse(data) as Record<string, unknown>;

          if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
            text += event.delta;
          }

          if (event.type === "response.completed") {
            const responsePayload = event.response;
            if (isRecord(responsePayload) && typeof responsePayload.output_text === "string") {
              text = responsePayload.output_text;
            }
          }
        } catch {
          // Ignore malformed SSE chunks.
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Codex response did not include output text.");
  }

  return trimmed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
