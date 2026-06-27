export const CHATGPT_ACCOUNT_MODELS = ["gpt-5.5", "gpt-5.4-mini", "gpt-5.4"] as const;

const DEPRECATED_CHATGPT_ACCOUNT_MODELS = new Set([
  "gpt-5",
  "gpt-5-codex",
  "gpt-5.1",
  "gpt-5.1-codex",
  "gpt-5.2",
  "gpt-5.2-codex",
  "gpt-5.3-codex",
  "codex-mini-latest"
]);

export function getChatGptAccountModelCandidates(preferredModel: string): string[] {
  const normalizedPreferred = preferredModel.trim();
  const candidates = normalizedPreferred ? [normalizedPreferred, ...CHATGPT_ACCOUNT_MODELS] : [...CHATGPT_ACCOUNT_MODELS];

  return [...new Set(candidates.filter(Boolean))];
}

export function isChatGptAccountModelUnsupportedError(error: unknown): boolean {
  const message = readErrorMessage(error);
  return message.includes("not supported when using Codex with a ChatGPT account");
}

export function normalizeChatGptAccountModel(model: string): string {
  const trimmed = model.trim();
  if (!trimmed || DEPRECATED_CHATGPT_ACCOUNT_MODELS.has(trimmed)) {
    return CHATGPT_ACCOUNT_MODELS[0];
  }

  return trimmed;
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
