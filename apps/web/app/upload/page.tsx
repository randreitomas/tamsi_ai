"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, Lock, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { solarExtractionSchema } from "@tamsi/types";
import { AppFooter } from "../../components/app-footer";
import { ConnectChatGptButton } from "../../components/connect-chatgpt-button";
import { PageIntro } from "../../components/page-intro";
import { SectionCard } from "../../components/section-card";
import { SiteTopbar } from "../../components/site-topbar";
import { Button } from "../../components/ui/button";
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
    <div className="app-shell app-shell--workflow">
      <SiteTopbar
        variant="fixed"
        end={
          <div className="site-topbar-end">
            <StartOverButton />
            <ConnectChatGptButton className="btn-header-cta" variant="primary" />
          </div>
        }
      />

      <main className="app-container--wide">
        <PageIntro
          description="Drop your SOLAR Grade Report screenshots. Tamsi reads the table for you — one term per screenshot works best."
          eyebrow="Step 2"
          title="Upload Grades"
        />

        <SectionCard description="A screenshot is enough — phone or desktop." step={2} title="Upload your SOLAR Grade Report">
            <div
              className="upload-dropzone"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                selectFiles(event.dataTransfer.files);
              }}
            >
              <div className="upload-dropzone-icon">
                <UploadCloud aria-hidden="true" size={28} />
              </div>
              <div className="min-w-[240px] flex-1">
                <b className="text-[15.5px]">Drop your grade reports here</b>
                <p className="mt-1 text-sm text-muted">
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

            <p className="mt-4 flex items-center gap-2 text-[12.5px] text-muted">
              <Lock aria-hidden="true" className="text-accent" size={15} />
              Screenshots are read to extract grades, then cleared from this session when you close the tab. Nothing is stored on Tamsi servers.
            </p>

            {files.length > 0 ? (
              <ul className="mt-5 space-y-2">
                {files.map((file) => (
                  <li className="workflow-file-item" key={`${file.name}-${file.lastModified}`}>
                    <span className="truncate">{file.name}</span>
                    <button
                      aria-label={`Remove ${file.name}`}
                      className="grid size-7 shrink-0 place-items-center rounded-md text-muted transition hover:bg-canvas hover:text-accent"
                      onClick={() => removeFile(file)}
                      type="button"
                    >
                      <X aria-hidden="true" size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {extractProgress ? <p className="mt-5 text-sm font-semibold text-accent-dark">{extractProgress}</p> : null}

            {error ? (
              <p className="error-banner mt-5">
                <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={16} />
                {error}
              </p>
            ) : null}

            {extractionReady ? (
              <div className="success-banner mt-6">
                <p className="flex items-center gap-2 text-sm font-bold text-success">
                  <CheckCircle2 aria-hidden="true" size={18} />
                  Grades read successfully
                </p>
                <p className="mt-2 text-sm leading-6 text-secondary">
                  Tamsi detected <b className="text-accent-dark">{termCount} term{termCount === 1 ? "" : "s"}</b>
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
                  <Button href="/review">
                    Continue to review
                    <ArrowRight aria-hidden="true" size={17} />
                  </Button>
                  <Button type="button" variant="secondary" onClick={resetUpload}>
                    Upload again
                  </Button>
                </div>
              </div>
            ) : null}

            {!oauthReady && uploadStatus && !uploadStatus.chatgptOAuth.mockMode ? (
              <p className="mt-5 text-sm text-muted">
                Connect ChatGPT above before Tamsi can read your screenshots.
              </p>
            ) : null}
        </SectionCard>
      </main>

      <AppFooter />
    </div>
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
      className="ml-auto w-[172px] overflow-hidden rounded-lg border border-line bg-elevated shadow-card"
      aria-label="Sample SOLAR grade report screenshot"
    >
      <div className="flex h-[22px] items-center gap-1 bg-accent-dark px-2">
        <i className="size-1.5 rounded-full bg-white/45" />
        <i className="size-1.5 rounded-full bg-white/45" />
        <i className="size-1.5 rounded-full bg-white/45" />
      </div>
      <div className="p-2.5">
        <div className="mb-1.5 h-[9px] rounded-[3px] bg-accent/85" />
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
