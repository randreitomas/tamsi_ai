import { z } from "zod";

export const courseStatusSchema = z.enum(["completed", "in_progress", "dropped", "credited"]);

export const gradeValueSchema = z.preprocess(normalizeGradeInput, z.number().min(0).max(5).nullable());

export const extractedCourseSchema = z.object({
  code: z.string().trim().min(1),
  title: z.string().trim().min(1),
  units: z.coerce.number().positive(),
  midterm: gradeValueSchema,
  final: gradeValueSchema,
  status: courseStatusSchema
});

export const extractedTermSchema = z.object({
  term: z.string().trim().min(1),
  courses: z.array(extractedCourseSchema).min(1)
});

export const solarExtractionSchema = z.object({
  terms: z.array(extractedTermSchema).min(1)
});

export const reviewCourseSchema = extractedCourseSchema.extend({
  id: z.string().min(1),
  term: z.string().trim().min(1)
});

export type CourseStatus = z.infer<typeof courseStatusSchema>;
export type ExtractedCourse = z.infer<typeof extractedCourseSchema>;
export type ExtractedTerm = z.infer<typeof extractedTermSchema>;
export type SolarExtraction = z.infer<typeof solarExtractionSchema>;
export type ReviewCourse = z.infer<typeof reviewCourseSchema>;

function normalizeGradeInput(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "-" || trimmed === "—" || trimmed.toUpperCase() === "N/A" || trimmed.toUpperCase() === "NA") {
      return null;
    }

    value = Number(trimmed.replace(/,/g, ""));
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.round(value * 4) / 4;
}

