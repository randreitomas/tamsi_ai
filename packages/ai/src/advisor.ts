import { advisorPrompt } from "./prompts";

export type AdvisorContext = {
  computedMetrics: Record<string, string | number | boolean | null>;
  notes?: string;
};

export function buildAdvisorSystemPrompt() {
  return advisorPrompt;
}

export function buildAdvisorUserContext(context: AdvisorContext) {
  return JSON.stringify(context, null, 2);
}

