"use client";

import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Lock, UploadCloud, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { solarExtractionSchema } from "@tamsi/types";
import { ConnectChatGptButton } from "../../components/connect-chatgpt-button";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { StartOverButton } from "../../components/start-over-button";
import {
  readSessionJSON,
  removeSession,
  TAMSI_STORAGE_KEYS,
  writeSessionJSON
} from "../../lib/tamsi-storage";

const acceptedTypes = ["image/png", "image/jpeg", "image/webp"];
const maxFileSizeBytes = 8 * 1024 * 1024;

type UploadStatus = {
  chatgptOAuth: {
    configured: boolean;
    connected: boolean;
    mockMode: boolean;
  };
};

type ExtractionResponse = {
  terms: unknown;
  meta?: {
    screenshotCount: number;
    sourceFiles: string[];
  };
};

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [termCount, setTermCount] = useState<number | null>(null);
  const [sourceFiles, setSourceFiles] = useState<string[]>([]);

  useEffect(() => {
    const stored = readSessionJSON<{ terms?: unknown[] }>(TAMSI_STORAGE_KEYS.lastExtraction);
    if (stored?.terms?.length) {
      setTermCount(stored.terms.length);
    }

    const storedSources = readSessionJSON<string[]>(TAMSI_STORAGE_KEYS.lastExtractionSources);
    if (storedSources) {
      setSourceFiles(storedSources);
    }

    void refreshStatus();
  }, []);

  async function refreshStatus() {
    const response = await fetch("/api/proof/status", { cache: "no-store" });
    const payload = (await response.json()) as UploadStatus;
    setUploadStatus(payload);
  }

  function selectFiles(nextFiles: FileList | File[] | null) {
    setError(null);

    if (!nextFiles || nextFiles.length === 0) {
      return;
    }

    const accepted = Array.from(nextFiles).filter((file) => acceptedTypes.includes(file.type));

    if (accepted.length === 0) {
      setError("Upload PNG, JPEG, or WEBP screenshots.");
      return;
    }

    const oversized = accepted.find((file) => file.size > maxFileSizeBytes);
    if (oversized) {
      setError(`${oversized.name} is larger than 8 MB.`);
      return;
    }

    setFiles((current) => mergeUniqueFiles(current, accepted));
  }

  function removeFile(target: File) {
    setFiles((current) =>
      current.filter((file) => file.name !== target.name || file.lastModified !== target.lastModified)
    );
  }

  async function extract() {
    if (files.length === 0) {
      setError("Choose at least one SOLAR screenshot first.");
      return;
    }

    setExtracting(true);
    setError(null);
    setExtractProgress(`Reading ${files.length} screenshot${files.length === 1 ? "" : "s"}...`);
    setTermCount(null);
    setSourceFiles([]);

    const body = new FormData();
    for (const file of files) {
      body.append("file", file);
    }

    const response = await fetch("/api/extraction", {
      method: "POST",
      body
    });

    const payload = (await response.json()) as ExtractionResponse & { error?: string };
    await refreshStatus();

    if (!response.ok) {
      setExtracting(false);
      setExtractProgress(null);
      setError(readApiError(payload));
      return;
    }

    const parsed = solarExtractionSchema.safeParse({ terms: payload.terms });
    if (!parsed.success) {
      setExtracting(false);
      setExtractProgress(null);
      setError("We could not read a valid grade table from those screenshots. Try clearer captures with the term dropdown visible.");
      return;
    }

    writeSessionJSON(TAMSI_STORAGE_KEYS.lastExtraction, parsed.data);
    writeSessionJSON(
      TAMSI_STORAGE_KEYS.lastExtractionSources,
      payload.meta?.sourceFiles ?? files.map((file) => file.name)
    );

    setTermCount(parsed.data.terms.length);
    setSourceFiles(payload.meta?.sourceFiles ?? files.map((file) => file.name));
    setExtractProgress(null);
    setExtracting(false);
  }

  function resetUpload() {
    setError(null);
    setExtractProgress(null);
    setTermCount(null);
    setSourceFiles([]);
    setFiles([]);
    removeSession(TAMSI_STORAGE_KEYS.lastExtraction);
    removeSession(TAMSI_STORAGE_KEYS.lastExtractionSources);
  }

  const oauthReady = Boolean(uploadStatus?.chatgptOAuth.mockMode || uploadStatus?.chatgptOAuth.connected);
  const extractionReady = termCount !== null && termCount > 0;

  return (
    <main className="min-h-screen bg-[#ecf2ea] px-6 py-10 text-[#0b1f12]">
      <div className="mx-auto max-w-[1080px]">
        <header className="mb-9 flex flex-wrap items-center justify-between gap-4">
          <Link className="inline-flex items-center gap-2 text-sm font-bold text-[#0a4d21]" href="/">
            <ArrowLeft aria-hidden="true" size={17} />
            Tamsi
          </Link>
          <div className="flex flex-wrap items-center gap-4">
            <StartOverButton />
            <ConnectChatGptButton />
          </div>
        </header>

        <section className="mb-8 text-center">
          <div className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#0e6b2e]">Step 2</div>
          <h1 className="mx-auto max-w-[18ch] text-[clamp(32px,5vw,48px)] font-extrabold leading-[1.04] tracking-[-0.02em]">
            Upload Grades
          </h1>
          <p className="mx-auto mt-4 max-w-[58ch] text-lg leading-8 text-[#33483a]">
            Drop your SOLAR Grade Report screenshots. Tamsi reads the table for you — one term per screenshot works best.
          </p>
        </section>

        <Card>
          <div className="flex items-center gap-3.5 border-b border-[#d7e2d4] bg-gradient-to-b from-[#fcfefb] to-[#f6faf4] px-5 py-[18px]">
            <span className="grid size-[30px] shrink-0 place-items-center rounded-[9px] bg-[#0e6b2e] font-mono text-[13px] font-bold text-white">2</span>
            <div>
              <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Upload your SOLAR Grade Report</h2>
              <p className="text-[12.5px] text-[#5c6b5e]">A screenshot is enough — phone or desktop.</p>
            </div>
          </div>

          <div className="p-[22px]">
            <div
              className="flex min-h-[220px] flex-wrap items-center gap-6 rounded-2xl border border-dashed border-[#b9cdb3] bg-[#f6faf4] p-6"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                selectFiles(event.dataTransfer.files);
              }}
            >
              <div className="grid size-[54px] shrink-0 place-items-center rounded-[14px] bg-[#e2efdd] text-[#0e6b2e]">
                <UploadCloud aria-hidden="true" size={28} />
              </div>
              <div className="min-w-[240px] flex-1">
                <b className="text-[15.5px]">Drop your grade reports here</b>
                <p className="mt-1 text-sm text-[#5c6b5e]">
                  PNG or JPG · include the term dropdown in each screenshot · upload multiple terms at once
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button type="button" onClick={() => inputRef.current?.click()} variant="secondary">
                    Choose images
                  </Button>
                  <Button
                    disabled={files.length === 0 || isExtracting || (!uploadStatus?.chatgptOAuth.mockMode && !oauthReady)}
                    type="button"
                    onClick={() => void extract()}
                  >
                    {isExtracting ? "Reading grades..." : files.length > 1 ? `Read ${files.length} screenshots` : "Read grades"}
                  </Button>
                </div>
              </div>
              <SolarThumb />
            </div>

            <input
              accept={acceptedTypes.join(",")}
              className="sr-only"
              multiple
              onChange={(event) => {
                selectFiles(event.target.files);
                event.target.value = "";
              }}
              ref={inputRef}
              type="file"
            />

            <p className="mt-4 flex items-center gap-2 text-[12.5px] text-[#5c6b5e]">
              <Lock aria-hidden="true" className="text-[#0e6b2e]" size={15} />
              Screenshots are read to extract grades, then cleared from this session when you close the tab. Nothing is stored on Tamsi servers.
            </p>

            {files.length > 0 ? (
              <ul className="mt-5 space-y-2">
                {files.map((file) => (
                  <li
                    className="flex items-center justify-between gap-3 rounded-[10px] border border-[#d7e2d4] bg-white px-4 py-3 text-sm font-semibold text-[#0b1f12]"
                    key={`${file.name}-${file.lastModified}`}
                  >
                    <span className="truncate">{file.name}</span>
                    <button
                      aria-label={`Remove ${file.name}`}
                      className="grid size-7 shrink-0 place-items-center rounded-md text-[#5c6b5e] transition hover:bg-[#f6faf4] hover:text-[#0a4d21]"
                      onClick={() => removeFile(file)}
                      type="button"
                    >
                      <X aria-hidden="true" size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {extractProgress ? <p className="mt-5 text-sm font-semibold text-[#0a4d21]">{extractProgress}</p> : null}

            {error ? (
              <p className="mt-5 flex items-start gap-2 rounded-[10px] border border-[#f0c4bc] bg-[#fff0ed] px-4 py-3 text-sm font-bold text-[#9a2f20]">
                <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={16} />
                {error}
              </p>
            ) : null}

            {extractionReady ? (
              <div className="mt-6 rounded-2xl border border-[#c2e6cd] bg-[#e4f4e9] p-5">
                <p className="flex items-center gap-2 text-sm font-bold text-[#1e8a4c]">
                  <CheckCircle2 aria-hidden="true" size={18} />
                  Grades read successfully
                </p>
                <p className="mt-2 text-sm leading-6 text-[#33483a]">
                  Tamsi detected <b className="text-[#0a4d21]">{termCount} term{termCount === 1 ? "" : "s"}</b>
                  {sourceFiles.length > 0 ? (
                    <>
                      {" "}
                      from {sourceFiles.length} screenshot{sourceFiles.length === 1 ? "" : "s"}.
                    </>
                  ) : (
                    "."
                  )}{" "}
                  Review and edit anything before we compute your standing.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/review">
                    <Button>
                      Continue to review
                      <ArrowRight aria-hidden="true" size={17} />
                    </Button>
                  </Link>
                  <Button type="button" variant="secondary" onClick={resetUpload}>
                    Upload again
                  </Button>
                </div>
              </div>
            ) : null}

            {!oauthReady && uploadStatus && !uploadStatus.chatgptOAuth.mockMode ? (
              <p className="mt-5 text-sm text-[#5c6b5e]">
                Connect ChatGPT above before Tamsi can read your screenshots.
              </p>
            ) : null}
          </div>
        </Card>
      </div>
    </main>
  );
}

function mergeUniqueFiles(current: File[], next: File[]): File[] {
  const merged = new Map<string, File>();

  for (const file of [...current, ...next]) {
    merged.set(`${file.name}-${file.size}-${file.lastModified}`, file);
  }

  return Array.from(merged.values());
}

function SolarThumb() {
  return (
    <div
      className="ml-auto w-[172px] overflow-hidden rounded-[10px] border border-[#d7e2d4] bg-white shadow-[0_6px_18px_rgba(11,31,18,.10)]"
      aria-label="Sample SOLAR grade report screenshot"
    >
      <div className="flex h-[22px] items-center gap-1 bg-[#0a4d21] px-2">
        <i className="size-1.5 rounded-full bg-white/45" />
        <i className="size-1.5 rounded-full bg-white/45" />
        <i className="size-1.5 rounded-full bg-white/45" />
      </div>
      <div className="p-2.5">
        <div className="mb-1.5 h-[9px] rounded-[3px] bg-[#0e6b2e]/85" />
        <div className="mb-1.5 h-[9px] rounded-[3px] bg-[#eaf0e8]" />
        <div className="mb-1.5 h-[9px] rounded-[3px] bg-[#eaf0e8]" />
        <div className="mb-1.5 h-[9px] w-[62%] rounded-[3px] bg-[#eaf0e8]" />
        <div className="h-[9px] rounded-[3px] bg-[#eaf0e8]" />
      </div>
    </div>
  );
}

function readApiError(payload: unknown) {
  if (typeof payload === "object" && payload !== null && "error" in payload) {
    const error = payload.error;
    if (typeof error === "string") {
      return error;
    }
  }

  return "Could not read your grades. Check your ChatGPT connection and try again.";
}
