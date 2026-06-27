import { describe, expect, it } from "vitest";
import { computeAcademicSnapshot } from "./analytics";
import { computeCumulativeGWA, computeRemainingUnits, computeTermGWA } from "./gwa";

describe("academic engine", () => {
  it("computes term GWA using only completed graded courses", () => {
    expect(
      computeTermGWA([
        { units: 3, grade: 3.5, status: "completed" },
        { units: 2, grade: 3.75, status: "completed" },
        { units: 3, grade: null, status: "in_progress" }
      ])
    ).toBe(3.6);
  });

  it("returns null when no completed graded units exist", () => {
    expect(computeTermGWA([{ units: 3, grade: null, status: "in_progress" }])).toBeNull();
  });

  it("computes cumulative GWA across terms on the FEU 4.0-high scale", () => {
    expect(
      computeCumulativeGWA([
        {
          term: "1 - 20232024",
          courses: [{ units: 3, grade: 4, status: "completed" }]
        },
        {
          term: "2 - 20232024",
          courses: [{ units: 3, grade: 3.5, status: "completed" }]
        }
      ])
    ).toBe(3.75);
  });

  it("computes remaining required units", () => {
    expect(
      computeRemainingUnits(12, [
        {
          term: "1 - 20232024",
          courses: [
            { units: 3, grade: 3.5, status: "completed" },
            { units: 3, grade: null, status: "credited" }
          ]
        }
      ])
    ).toBe(6);
  });

  it("builds an academic snapshot with honors and scholarship context", () => {
    const snapshot = computeAcademicSnapshot([
      {
        code: "CS101",
        title: "Intro",
        units: 3,
        midterm: null,
        final: 3.8,
        status: "completed",
        term: "1 - 20232024"
      },
      {
        code: "CS102",
        title: "Logic",
        units: 3,
        midterm: 3.5,
        final: null,
        status: "in_progress",
        term: "2 - 20232024"
      }
    ], { scholarshipEnrollment: "presidential" });

    expect(snapshot.cumulativeGwa).toBe(3.8);
    expect(snapshot.honors.currentTier).toBe("summa_cum_laude");
    expect(snapshot.scholarship.enrollment).toBe("presidential");
    expect(snapshot.scholarship.inferredTier).toBe("presidential");
    expect(snapshot.academicYearLabel).toBe("entering 1st year");
    expect(snapshot.terms).toHaveLength(2);
    expect(snapshot.terms[1]?.inProgress).toBe(true);
    expect(snapshot.projections.inProgressUnits).toBe(3);
  });

  it("supports custom scholarship retention thresholds", () => {
    const snapshot = computeAcademicSnapshot(
      [
        {
          code: "CS101",
          title: "Intro",
          units: 3,
          midterm: null,
          final: 3.2,
          status: "completed",
          term: "1 - 20232024"
        }
      ],
      {
        scholarshipEnrollment: "others",
        customScholarshipName: "Dean's List Grant",
        customMaintainingGrade: 3.25
      }
    );

    expect(snapshot.scholarship.enrollmentLabel).toBe("Dean's List Grant");
    expect(snapshot.scholarship.retentionThreshold).toBe(3.25);
    expect(snapshot.scholarship.retention.retained).toBe(false);
  });
});
