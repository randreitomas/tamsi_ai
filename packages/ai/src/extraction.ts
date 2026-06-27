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
      if (hasEmptyTermsIssue(error)) {
        throw new Error(buildEmptyTermsErrorMessage());
      }

      throw new Error(formatExtractionValidationError(error));
    }

    throw error;
  }
}

export function isEmptyTermsExtractionError(error: unknown): boolean {
  return error instanceof Error && error.message === buildEmptyTermsErrorMessage();
}

function normalizeExtractionPayload(payload: unknown): unknown {
  const unwrapped = unwrapExtractionPayload(payload);

  if (!isRecord(unwrapped) || !Array.isArray(unwrapped.terms)) {
    return unwrapped;
  }

  return {
    ...unwrapped,
    terms: unwrapped.terms
      .map((term) => normalizeTerm(term))
      .filter((term): term is Record<string, unknown> => term !== null)
  };
}

function unwrapExtractionPayload(payload: unknown): unknown {
  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return { terms: [] };
    }

    const first = payload[0];
    if (isRecord(first) && Array.isArray(first.courses)) {
      return { terms: payload };
    }

    if (isRecord(first) && readCourseCode(first)) {
      return {
        terms: [
          {
            term: "Unknown term",
            courses: payload
          }
        ]
      };
    }

    return { terms: [] };
  }

  if (!isRecord(payload)) {
    return payload;
  }

  for (const key of ["data", "result", "gradeReport", "grade_report", "extraction", "response"]) {
    if (key in payload) {
      const nested = unwrapExtractionPayload(payload[key]);
      if (isRecord(nested) && Array.isArray(nested.terms) && nested.terms.length > 0) {
        return nested;
      }
    }
  }

  if (Array.isArray(payload.terms) && payload.terms.length > 0) {
    return payload;
  }

  if (Array.isArray(payload.courses) && payload.courses.length > 0) {
    return {
      terms: [
        {
          term: readTermLabel(payload) ?? "Unknown term",
          courses: payload.courses
        }
      ]
    };
  }

  if (readTermLabel(payload) && Array.isArray(payload.courses)) {
    return { terms: [payload] };
  }

  return payload;
}

function normalizeTerm(term: unknown): Record<string, unknown> | null {
  if (!isRecord(term) || !Array.isArray(term.courses)) {
    return null;
  }

  const courses = term.courses
    .map((course) => normalizeCourse(course))
    .filter((course): course is Record<string, unknown> => course !== null);

  if (courses.length === 0) {
    return null;
  }

  return {
    ...term,
    term: readTermLabel(term) ?? "Unknown term",
    courses
  };
}

function normalizeCourse(course: unknown): Record<string, unknown> | null {
  if (!isRecord(course)) {
    return null;
  }

  const code = readCourseCode(course);
  const title = readCourseTitle(course);

  if (!code || !title) {
    return null;
  }

  const normalized = {
    ...course,
    code,
    title,
    units: course.units ?? course.unit ?? course.credits ?? course.credit,
    midterm: course.midterm ?? course.mid ?? course.midTerm ?? course.mid_term,
    final: course.final ?? course.finalGrade ?? course.final_grade,
    status: inferCourseStatus({
      ...course,
      midterm: course.midterm ?? course.mid ?? course.midTerm ?? course.mid_term,
      final: course.final ?? course.finalGrade ?? course.final_grade
    })
  };

  return normalized;
}

function readTermLabel(record: Record<string, unknown>): string | null {
  for (const key of ["term", "termLabel", "term_label", "label", "name", "schoolYear", "school_year"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function readCourseCode(course: Record<string, unknown>): string | null {
  for (const key of ["code", "courseCode", "course_code", "course"]) {
    const value = course[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function readCourseTitle(course: Record<string, unknown>): string | null {
  for (const key of ["title", "courseTitle", "course_title", "name", "description"]) {
    const value = course[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
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

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "-" || trimmed === "—") {
      return null;
    }

    value = Number(trimmed.replace(/,/g, ""));
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasEmptyTermsIssue(error: ZodError): boolean {
  return error.issues.some((issue) => issue.path[0] === "terms" && issue.code === "too_small");
}

function buildEmptyTermsErrorMessage(): string {
  return "Vision did not detect any SOLAR grade rows. Open SOLAR → Grade Report (not Class Schedule), capture the full table with COURSE CODE, TITLE, UNITS, MIDTERM, and FINAL visible, then upload a clear uncropped screenshot.";
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
