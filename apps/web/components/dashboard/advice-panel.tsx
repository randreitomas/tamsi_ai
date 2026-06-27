"use client";

import { Sparkles } from "lucide-react";
import { ConnectChatGptButton } from "../connect-chatgpt-button";

type AdvicePanelProps = {
  advice: string | null;
  loading: boolean;
  error: string | null;
  connected: boolean;
  onRetry: () => void;
};

export function AdvicePanel({ advice, loading, error, connected, onRetry }: AdvicePanelProps) {
  return (
    <div className="rounded-[14px] border border-[#d7e2d4] border-l-4 border-l-[#0e6b2e] bg-[#f6faf4] p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#0a4d21]">
        <span className="rounded-md bg-[#0e6b2e] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-white">AI</span>
        What your numbers mean
      </h3>

      {!connected ? (
        <div className="space-y-3">
          <p className="text-sm text-[#2c3f31]">Connect ChatGPT to generate plain-language advice from your computed metrics.</p>
          <ConnectChatGptButton />
        </div>
      ) : loading ? (
        <p className="flex items-center gap-2 text-sm text-[#5c6b5e]">
          <Sparkles aria-hidden="true" className="animate-pulse text-[#0e6b2e]" size={16} />
          Generating advice from your standing...
        </p>
      ) : error ? (
        <div className="space-y-3">
          <p className="text-sm text-[#c0392b]">{error}</p>
          <button className="text-sm font-bold text-[#0a4d21] underline" onClick={onRetry} type="button">
            Try again
          </button>
        </div>
      ) : advice ? (
        <div
          className="space-y-3 text-left text-sm leading-7 text-[#2c3f31] [&_p+p]:mt-3 [&_.target]:rounded-[5px] [&_.target]:bg-[#fbe8a6] [&_.target]:px-1.5 [&_.target]:py-px [&_.target]:font-mono [&_.target]:font-bold [&_.target]:text-[#6b5300] [&_b]:font-bold [&_b]:text-[#0a4d21]"
          dangerouslySetInnerHTML={{ __html: formatAdviceHtml(advice) }}
        />
      ) : (
        <p className="text-sm text-[#5c6b5e]">Advice will appear here once metrics are ready.</p>
      )}
    </div>
  );
}

function formatAdviceHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br />")}</p>`)
    .join("");
}
