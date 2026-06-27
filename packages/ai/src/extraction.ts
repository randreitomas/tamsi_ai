import { solarExtractionSchema, type ExtractedCourse, type SolarExtraction } from "@tamsi/types";
import { ZodError } from "zod";
import type { ChatGptOAuthSession } from "./chatgpt-oauth/session";

export type GradeReportImage = {
  dataUrl: string;
  mediaType: "image/png" | "image/jpeg" | "image/webp";
};

export type ExtractGradeReportInput = {
  image: GradeReportImage;
  credentials?: ChatGptOAuthSession;
};

export interface AcademicExtractor {
  extractGradeReport(input: ExtractGradeReportInput): Promise<SolarExtraction>;
}

export function mergeSolarExtractions(extractions: SolarExtraction[]): SolarExtraction {
  if (extractions.length === 0) {
    throw new Error("No extractions were provided to merge.");
  }

  if (extractions.length === 1) {
    return extractions[0]!;
  }

  const termMap = new Map<string, Map<string, ExtractedCourse>>();

  for (const extraction of extractions) {
    for (const term of extraction.terms) {
      const courses = termMap.get(term.term) ?? new Map<string, ExtractedCourse>();

      for (const course of term.courses) {
        courses.set(course.code, course);
      }

      termMap.set(term.term, courses);
    }
  }

  const merged = {
    terms: Array.from(termMap.entries()).map(([term, courses]) => ({
      term,
      courses: Array.from(courses.values())
    }))
  };

  return solarExtractionSchema.parse(merged);
}

export function parseExtractionJson(text: string): SolarExtraction {
  const parsed = JSON.parse(extractJsonObject(text)) as unknown;
  const normalized = normalizeExtractionPayload(parsed);

  try {
    return solarExtractionSchema.parse(normalized);
  } catch (error) {
    if (error instanceof ZodError) {
      const emptyTerms = error.issues.some((issue) => issue.path[0] === "terms" && issue.code === "too_small");

      if (emptyTerms) {
        throw new Error(
          "Vision did not detect any SOLAR grade rows. Upload a clear, uncropped SOLAR Grade Report screenshot and try again."
        );
      }

      throw new Error(formatExtractionValidationError(error));
    }

    throw error;
  }
}

function normalizeExtractionPayload(payload: unknown): unknown {
  if (!isRecord(payload) || !Array.isArray(payload.terms)) {
    return payload;
  }

  return {
    ...payload,
    terms: payload.terms.map((term) => {
      if (!isRecord(term) || !Array.isArray(term.courses)) {
        return term;
      }

      return {
        ...term,
        courses: term.courses.map((course) => {
          if (!isRecord(course)) {
            return course;
          }

          return {
            ...course,
            status: inferCourseStatus(course)
          };
        })
      };
    })
  };
}

function inferCourseStatus(course: Record<string, unknown>) {
  const explicit = normalizeStatusValue(course.status);
  if (explicit) {
    return explicit;
  }

  const finalGrade = readNullableNumber(course.final);
  const midtermGrade = readNullableNumber(course.midterm);

  if (finalGrade !== null) {
    return "completed";
  }

  if (midtermGrade !== null) {
    return "in_progress";
  }

  return "in_progress";
}

function normalizeStatusValue(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");

  if (normalized === "completed" || normalized === "complete" || normalized === "passed") {
    return "completed";
  }

  if (normalized === "in_progress" || normalized === "ongoing" || normalized === "current") {
    return "in_progress";
  }

  if (normalized === "dropped" || normalized === "drop") {
    return "dropped";
  }

  if (normalized === "credited" || normalized === "credit") {
    return "credited";
  }

  return null;
}

function readNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatExtractionValidationError(error: ZodError): string {
  const firstIssue = error.issues[0];
  if (!firstIssue) {
    return "Vision returned JSON that did not match the expected SOLAR schema.";
  }

  const path = firstIssue.path.join(".");
  return `Vision returned invalid data at ${path || "root"}: ${firstIssue.message}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractJsonObject(text: string): string {
  const trimmed = stripCodeFence(text).trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Vision response did not include JSON.");
  }

  return trimmed.slice(start, end + 1);
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim();

  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}
