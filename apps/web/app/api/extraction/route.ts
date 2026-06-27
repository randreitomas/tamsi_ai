import {
  ChatGptOAuthVisionExtractor,
  MockAcademicExtractor,
  getDefaultCodexApiBaseUrl,
  mergeSolarExtractions,
  readChatGptOAuthEnv,
  type AcademicExtractor,
  type GradeReportImage
} from "@tamsi/ai";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ensureValidChatGptSession } from "../../../lib/chatgpt-oauth-session";

const supportedTypes = ["image/png", "image/jpeg", "image/webp"] as const;
const maxFileSizeBytes = 8 * 1024 * 1024;
type SupportedType = (typeof supportedTypes)[number];

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = readUploadedFiles(formData);

  if (files.length === 0) {
    return NextResponse.json({ error: "Upload at least one SOLAR screenshot image." }, { status: 400 });
  }

  for (const file of files) {
    if (!isSupportedType(file.type)) {
      return NextResponse.json(
        { error: `${file.name}: only PNG, JPEG, and WEBP screenshots are supported.` },
        { status: 415 }
      );
    }

    if (file.size > maxFileSizeBytes) {
      return NextResponse.json({ error: `${file.name}: image must be 8 MB or smaller.` }, { status: 413 });
    }
  }

  try {
    const cookieStore = await cookies();
    const useMockAi = process.env.TAMSI_USE_MOCK_AI === "true";
    const session = useMockAi ? null : await ensureValidChatGptSession(cookieStore);

    if (!useMockAi && !session) {
      return NextResponse.json(
        {
          error: "Connect ChatGPT before invoking GPT-5 Vision.",
          action: "chatgpt_oauth_required"
        },
        { status: 401 }
      );
    }

    const { model } = readChatGptOAuthEnv();
    const extractor: AcademicExtractor = useMockAi
      ? new MockAcademicExtractor()
      : new ChatGptOAuthVisionExtractor({
          apiBaseUrl: process.env.CHATGPT_OAUTH_API_BASE_URL ?? getDefaultCodexApiBaseUrl(),
          model,
          credentials: session!
        });

    const extractions = [];

    for (const file of files) {
      try {
        const extraction = await extractor.extractGradeReport({
          credentials: session ?? undefined,
          image: await fileToImage(file)
        });
        extractions.push(extraction);
      } catch (error) {
        const message = formatExtractionError(error);
        throw new Error(`${file.name}: ${message}`);
      }
    }

    const merged = mergeSolarExtractions(extractions);

    return NextResponse.json({
      ...merged,
      meta: {
        screenshotCount: files.length,
        sourceFiles: files.map((file) => file.name)
      }
    });
  } catch (error) {
    const message = formatExtractionError(error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

function readUploadedFiles(formData: FormData): File[] {
  const fromFileField = formData
    .getAll("file")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const fromFilesField = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const unique = new Map<string, File>();

  for (const file of [...fromFileField, ...fromFilesField]) {
    unique.set(`${file.name}-${file.size}-${file.lastModified}`, file);
  }

  return Array.from(unique.values());
}

async function fileToImage(file: File): Promise<GradeReportImage> {
  const buffer = Buffer.from(await file.arrayBuffer());

  return {
    dataUrl: `data:${file.type};base64,${buffer.toString("base64")}`,
    mediaType: file.type as GradeReportImage["mediaType"]
  };
}

function formatExtractionError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Extraction failed.";
}

function isSupportedType(value: string): value is SupportedType {
  return supportedTypes.some((type) => type === value);
}
