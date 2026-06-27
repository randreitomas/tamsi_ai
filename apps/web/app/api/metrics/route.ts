import {
  buildAdvisorMetrics,
  computeAcademicSnapshot,
  type ConfirmedCourseInput,
  type ScholarshipEnrollmentTier
} from "@tamsi/academic-engine";
import { reviewCourseSchema } from "@tamsi/types";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  courses: z.array(reviewCourseSchema).min(1),
  scholarshipEnrollment: z.enum(["presidential", "elite", "none", "others"]).optional(),
  customScholarshipName: z.string().optional(),
  customMaintainingGrade: z.number().min(0.5).max(4).nullable().optional()
});

export async function POST(request: NextRequest) {
  const body = (await request.json()) as unknown;
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Provide at least one confirmed course." }, { status: 400 });
  }

  const courses: ConfirmedCourseInput[] = parsed.data.courses.map(({ id: _id, ...course }) => course);
  const scholarshipEnrollment = (parsed.data.scholarshipEnrollment ?? "none") as ScholarshipEnrollmentTier;
  const snapshotOptions = {
    scholarshipEnrollment,
    customScholarshipName: parsed.data.customScholarshipName,
    customMaintainingGrade: parsed.data.customMaintainingGrade ?? null
  };
  const snapshot = computeAcademicSnapshot(courses, snapshotOptions);

  return NextResponse.json({
    snapshot,
    advisorMetrics: buildAdvisorMetrics(snapshot, snapshotOptions)
  });
}
