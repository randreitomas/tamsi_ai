"use client";

import { Bot, CheckCircle2, Copy, ExternalLink, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

type ConnectChatGptButtonProps = {
  className?: string;
  connectedHref?: string;
  connectedLabel?: string;
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
};

type DeviceAuthSession = {
  deviceAuthId: string;
  userCode: string;
  verificationUrl: string;
  intervalMs: number;
};

export function ConnectChatGptButton({
  className,
  connectedHref,
  connectedLabel = "ChatGPT connected",
  label = "Connect ChatGPT",
  variant = "secondary"
}: ConnectChatGptButtonProps) {
  const [connected, setConnected] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<DeviceAuthSession | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setConnected(document.cookie.includes("tamsi_chatgpt_connected=true"));
  }, []);

  async function startDeviceAuth() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/chatgpt/device/start", { method: "POST" });
      const payload = (await response.json()) as DeviceAuthSession & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not start ChatGPT authentication.");
      }

      setSession(payload);
      setDialogOpen(true);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Could not start ChatGPT authentication.");
    } finally {
      setLoading(false);
    }
  }

  async function completeDeviceAuth() {
    if (!session) {
      return;
    }

    setPolling(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/chatgpt/device/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(session)
      });
      const payload = (await response.json()) as { connected?: boolean; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "ChatGPT authentication did not complete.");
      }

      setConnected(true);
      setDialogOpen(false);
      setSession(null);

      if (connectedHref) {
        window.location.href = connectedHref;
      }
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : "ChatGPT authentication did not complete.");
    } finally {
      setPolling(false);
    }
  }

  async function copyUserCode() {
    if (!session?.userCode) {
      return;
    }

    await navigator.clipboard.writeText(session.userCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  if (connected) {
    if (connectedHref) {
      return (
        <Link href={connectedHref}>
          <Button className={className} variant={variant}>
            <CheckCircle2 aria-hidden="true" size={18} />
            {connectedLabel}
          </Button>
        </Link>
      );
    }

    return (
      <div className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-[#c2e6cd] bg-white px-4 text-sm font-bold text-[#1e8a4c]">
        <CheckCircle2 aria-hidden="true" size={18} />
        {connectedLabel}
      </div>
    );
  }

  return (
    <>
      <Button className={className} disabled={loading} type="button" variant={variant} onClick={() => void startDeviceAuth()}>
        {loading ? <LoaderCircle aria-hidden="true" className="animate-spin" size={18} /> : <Bot aria-hidden="true" size={18} />}
        {loading ? "Starting..." : label}
      </Button>

      {error && !dialogOpen ? <p className="mt-2 text-sm text-[#c0392b]">{error}</p> : null}

      {dialogOpen && session ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1f12]/55 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#d7e2d4] bg-white p-6 shadow-2xl">
            <div className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#0e6b2e]">Connect ChatGPT</div>
            <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-[#0b1f12]">Sign in with your ChatGPT account</h2>
            <p className="mt-3 text-sm leading-6 text-[#5c6b5e]">
              Open the Codex device page, sign in, and enter this one-time code. Tamsi will use your own ChatGPT entitlement for Vision and advice.
            </p>

            <div className="mt-5 rounded-2xl border border-[#d7e2d4] bg-[#f6faf4] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5c6b5e]">Your code</div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <code className="font-mono text-2xl font-bold tracking-[0.18em] text-[#0a4d21]">{session.userCode}</code>
                <Button type="button" variant="secondary" onClick={() => void copyUserCode()}>
                  <Copy aria-hidden="true" size={16} />
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <a href={session.verificationUrl} rel="noreferrer" target="_blank">
                <Button type="button" variant="primary">
                  <ExternalLink aria-hidden="true" size={16} />
                  Open ChatGPT sign-in
                </Button>
              </a>
              <Button disabled={polling} type="button" variant="secondary" onClick={() => void completeDeviceAuth()}>
                {polling ? <LoaderCircle aria-hidden="true" className="animate-spin" size={16} /> : null}
                {polling ? "Waiting for sign-in..." : "I entered the code"}
              </Button>
            </div>

            {error ? <p className="mt-4 text-sm text-[#c0392b]">{error}</p> : null}

            <button
              className="mt-5 block w-full text-center text-sm font-semibold text-[#5c6b5e] underline"
              type="button"
              onClick={() => {
                setDialogOpen(false);
                setSession(null);
                setError(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
