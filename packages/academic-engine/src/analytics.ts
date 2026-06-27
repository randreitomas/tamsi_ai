import type { CourseStatus } from "@tamsi/types";
import {
  FEU_GRADE_SCALE,
  FEU_HONORS_THRESHOLDS,
  FEU_SCHOLARSHIP_THRESHOLDS,
  formatHonorsTier,
  formatScholarshipEnrollment,
  formatScholarshipTier,
  resolveHonorsTier,
  resolveScholarshipTier,
  scholarshipThresholdForEnrollment,
  type FeuHonorsTier,
  type FeuScholarshipTier,
  type ScholarshipEnrollmentTier
} from "./feu-standards";
import { computeCumulativeGWA, computeTermGWA, roundGwa, type GradeRecord, type TermRecord } from "./gwa";
import { checkCumLaudeEligibility, checkMagnaEligibility, checkSummaEligibility } from "./honors";
import { computeRequiredTermAverage } from "./projections";
import { checkScholarshipRetention } from "./scholarship";
import { inferAcademicYearLabel, inferAcademicYearNumber } from "./year-level";

export type AcademicSnapshotOptions = {
  scholarshipEnrollment?: ScholarshipEnrollmentTier;
  customScholarshipName?: string;
  customMaintainingGrade?: number | null;
};

export type ConfirmedCourseInput = {
  code: string;
  title: string;
  units: number;
  midterm: number | null;
  final: number | null;
  status: CourseStatus;
  term: string;
};

export type TermMetric = {
  term: string;
  shortLabel: string;
  gwa: number | null;
  snapshotGwa: number | null;
  units: number;
  completedUnits: number;
  inProgress: boolean;
  courseCount: number;
};

export type AcademicSnapshot = {
  cumulativeGwa: number | null;
  totalCompletedUnits: number;
  totalInProgressUnits: number;
  hasFailingGrade: boolean;
  honors: {
    currentTier: FeuHonorsTier;
    currentLabel: string;
    cumLaude: ReturnType<typeof checkCumLaudeEligibility>;
    magna: ReturnType<typeof checkMagnaEligibility>;
    summa: ReturnType<typeof checkSummaEligibility>;
    magnaWithinReach: boolean;
  };
  scholarship: {
    enrollment: ScholarshipEnrollmentTier;
    enrollmentLabel: string;
    customName: string | null;
    inferredTier: FeuScholarshipTier;
    inferredTierLabel: string;
    retention: ReturnType<typeof checkScholarshipRetention>;
    retentionThreshold: number | null;
  };
  academicYearLabel: string;
  academicYearNumber: number;
  terms: TermMetric[];
  inProgressTerm: string | null;
  projections: {
    inProgressUnits: number;
    requiredToMaintainCumLaude: number | null;
    requiredForMagna: number | null;
    requiredForSumma: number | null;
    requiredForPresidential: number | null;
    requiredForElite: number | null;
    requiredForScholarship: number | null;
  };
  riskCourses: string[];
};

function toGradeRecord(course: ConfirmedCourseInput): GradeRecord {
  return {
    units: course.units,
    grade: course.status === "completed" ? course.final : null,
    status: course.status
  };
}

function isFailingGrade(grade: number | null): boolean {
  return grade !== null && grade <= FEU_GRADE_SCALE.failing;
}

function computeSnapshotTermGWA(courses: ConfirmedCourseInput[]): number | null {
  const gradable = courses.filter((course) => course.status !== "dropped" && course.status !== "credited");
  const weighted = gradable
    .map((course) => ({
      units: course.units,
      grade: course.status === "completed" ? course.final : (course.final ?? course.midterm)
    }))
    .filter((entry) => entry.grade !== null);

  const totalUnits = weighted.reduce((sum, entry) => sum + entry.units, 0);
  if (totalUnits === 0) {
    return null;
  }

  const totalWeighted = weighted.reduce((sum, entry) => sum + (entry.grade ?? 0) * entry.units, 0);
  return roundGwa(totalWeighted / totalUnits);
}

function termIsInProgress(courses: ConfirmedCourseInput[]): boolean {
  return courses.some((course) => course.status === "in_progress" || (course.status === "completed" && course.final === null));
}

function shortTermLabel(term: string, index: number): string {
  const trimmed = term.trim();
  const solarMatch = trimmed.match(/^(\d+)\s*-\s*(\d{4})(\d{4})$/);
  if (solarMatch) {
    const trimester = solarMatch[1];
    const startYear = solarMatch[2]?.slice(-2);
    return `${startYear} · T${trimester}`;
  }

  const compact = trimmed.replace(/\s+/g, " ");
  if (compact.length <= 10) {
    return compact;
  }

  return `Term ${index + 1}`;
}

function groupCoursesByTerm(courses: ConfirmedCourseInput[]): TermRecord[] {
  const order: string[] = [];
  const grouped = new Map<string, ConfirmedCourseInput[]>();

  for (const course of courses) {
    if (!grouped.has(course.term)) {
      grouped.set(course.term, []);
      order.push(course.term);
    }
    grouped.get(course.term)?.push(course);
  }

  return order.map((term) => ({
    term,
    courses: (grouped.get(term) ?? []).map(toGradeRecord)
  }));
}

function sumCompletedUnits(terms: TermRecord[]): number {
  return terms
    .flatMap((term) => term.courses)
    .filter((course) => course.status === "completed" && course.grade !== null)
    .reduce((sum, course) => sum + course.units, 0);
}

function sumInProgressUnits(courses: ConfirmedCourseInput[]): number {
  return courses
    .filter((course) => course.status === "in_progress")
    .reduce((sum, course) => sum + course.units, 0);
}

function findRiskCourses(courses: ConfirmedCourseInput[]): string[] {
  return courses
    .filter((course) => course.status === "in_progress" && course.midterm !== null && course.final === null)
    .sort((left, right) => (left.midterm ?? FEU_GRADE_SCALE.highest) - (right.midterm ?? FEU_GRADE_SCALE.highest))
    .slice(0, 3)
    .map((course) => `${course.code} (${course.title}) — midterm ${course.midterm?.toFixed(2)}`);
}

export function computeAcademicSnapshot(
  courses: ConfirmedCourseInput[],
  options: AcademicSnapshotOptions = {}
): AcademicSnapshot {
  const scholarshipEnrollment = options.scholarshipEnrollment ?? "none";
  const customScholarshipName = options.customScholarshipName?.trim() ?? "";
  const customMaintainingGrade = options.customMaintainingGrade ?? null;
  const scholarshipDetails = {
    enrollment: scholarshipEnrollment,
    customName: customScholarshipName,
    customMaintainingGrade
  };
  const terms = groupCoursesByTerm(courses);
  const cumulativeGwa = computeCumulativeGWA(terms);
  const totalCompletedUnits = sumCompletedUnits(terms);
  const totalInProgressUnits = sumInProgressUnits(courses);
  const hasFailingGrade = courses.some(
    (course) => course.status === "completed" && isFailingGrade(course.final)
  );

  const honorsInput = {
    cumulativeGwa,
    hasFailingGrade,
    hasDisciplinaryCase: false
  };

  const scholarshipTier = resolveScholarshipTier(cumulativeGwa);
  const retentionThreshold = scholarshipThresholdForEnrollment(scholarshipDetails);
  const currentHonorsTier = resolveHonorsTier(cumulativeGwa);
  const magnaEligible = checkMagnaEligibility(honorsInput).eligible;
  const magnaWithinReach =
    !magnaEligible &&
    cumulativeGwa !== null &&
    cumulativeGwa >= FEU_HONORS_THRESHOLDS.cumLaude &&
    cumulativeGwa < FEU_HONORS_THRESHOLDS.magnaCumLaude;

  const termMetrics: TermMetric[] = terms.map((term, index) => {
    const termCourses = courses.filter((course) => course.term === term.term);
    const inProgress = termIsInProgress(termCourses);

    return {
      term: term.term,
      shortLabel: shortTermLabel(term.term, index),
      gwa: computeTermGWA(term.courses),
      snapshotGwa: inProgress ? computeSnapshotTermGWA(termCourses) : computeTermGWA(term.courses),
      units: termCourses.reduce((sum, course) => sum + course.units, 0),
      completedUnits: term.courses
        .filter((course) => course.status === "completed" && course.grade !== null)
        .reduce((sum, course) => sum + course.units, 0),
      inProgress,
      courseCount: termCourses.length
    };
  });

  const inProgressTerm = termMetrics.find((term) => term.inProgress)?.term ?? null;
  const inProgressUnits = inProgressTerm
    ? courses.filter((course) => course.term === inProgressTerm && course.status === "in_progress").reduce((sum, course) => sum + course.units, 0)
    : totalInProgressUnits;

  const requiredForScholarship =
    cumulativeGwa !== null && inProgressUnits > 0 && retentionThreshold !== null
      ? computeRequiredTermAverage(cumulativeGwa, totalCompletedUnits, inProgressUnits, retentionThreshold)
      : null;

  const projections =
    cumulativeGwa !== null && inProgressUnits > 0
      ? {
          inProgressUnits,
          requiredToMaintainCumLaude: computeRequiredTermAverage(
            cumulativeGwa,
            totalCompletedUnits,
            inProgressUnits,
            FEU_HONORS_THRESHOLDS.cumLaude
          ),
          requiredForMagna: computeRequiredTermAverage(
            cumulativeGwa,
            totalCompletedUnits,
            inProgressUnits,
            FEU_HONORS_THRESHOLDS.magnaCumLaude
          ),
          requiredForSumma: computeRequiredTermAverage(
            cumulativeGwa,
            totalCompletedUnits,
            inProgressUnits,
            FEU_HONORS_THRESHOLDS.summaCumLaude
          ),
          requiredForPresidential: computeRequiredTermAverage(
            cumulativeGwa,
            totalCompletedUnits,
            inProgressUnits,
            FEU_SCHOLARSHIP_THRESHOLDS.presidential
          ),
          requiredForElite: computeRequiredTermAverage(
            cumulativeGwa,
            totalCompletedUnits,
            inProgressUnits,
            FEU_SCHOLARSHIP_THRESHOLDS.elite
          ),
          requiredForScholarship
        }
      : {
          inProgressUnits,
          requiredToMaintainCumLaude: null,
          requiredForMagna: null,
          requiredForSumma: null,
          requiredForPresidential: null,
          requiredForElite: null,
          requiredForScholarship: null
        };

  const hasInProgressTerm = termMetrics.some((term) => term.inProgress);

  return {
    cumulativeGwa,
    totalCompletedUnits,
    totalInProgressUnits,
    hasFailingGrade,
    honors: {
      currentTier: currentHonorsTier,
      currentLabel: formatHonorsTier(currentHonorsTier),
      cumLaude: checkCumLaudeEligibility(honorsInput),
      magna: checkMagnaEligibility(honorsInput),
      summa: checkSummaEligibility(honorsInput),
      magnaWithinReach
    },
    scholarship: {
      enrollment: scholarshipEnrollment,
      enrollmentLabel: formatScholarshipEnrollment(
        scholarshipEnrollment,
        scholarshipEnrollment === "others" ? customScholarshipName : undefined
      ),
      customName: scholarshipEnrollment === "others" ? customScholarshipName || null : null,
      inferredTier: scholarshipTier,
      inferredTierLabel: formatScholarshipTier(scholarshipTier),
      retentionThreshold,
      retention: checkScholarshipRetention({
        cumulativeGwa,
        termGwa: inProgressTerm
          ? termMetrics.find((term) => term.term === inProgressTerm)?.gwa ?? null
          : null,
        ...scholarshipDetails,
        hasFailingGrade
      })
    },
    academicYearLabel: inferAcademicYearLabel(termMetrics.length, hasInProgressTerm),
    academicYearNumber: inferAcademicYearNumber(termMetrics.length, hasInProgressTerm),
    terms: termMetrics,
    inProgressTerm,
    projections,
    riskCourses: findRiskCourses(courses)
  };
}

export function buildAdvisorMetrics(
  snapshot: AcademicSnapshot,
  options: AcademicSnapshotOptions = {}
): Record<string, string | number | boolean | null> {
  const scholarshipEnrollment = options.scholarshipEnrollment ?? snapshot.scholarship.enrollment;
  const customScholarshipName = options.customScholarshipName ?? snapshot.scholarship.customName ?? "";
  const customMaintainingGrade = options.customMaintainingGrade ?? snapshot.scholarship.retentionThreshold;

  return {
    scale: "FEU Tech trimester 4.0-high (0.5 fail)",
    cumulativeGwa: snapshot.cumulativeGwa,
    totalCompletedUnits: snapshot.totalCompletedUnits,
    totalInProgressUnits: snapshot.totalInProgressUnits,
    academicYearLabel: snapshot.academicYearLabel,
    academicYearNumber: snapshot.academicYearNumber,
    hasFailingGrade: snapshot.hasFailingGrade,
    honorsTier: snapshot.honors.currentLabel,
    cumLaudeThreshold: FEU_HONORS_THRESHOLDS.cumLaude,
    magnaThreshold: FEU_HONORS_THRESHOLDS.magnaCumLaude,
    summaThreshold: FEU_HONORS_THRESHOLDS.summaCumLaude,
    presidentialThreshold: FEU_SCHOLARSHIP_THRESHOLDS.presidential,
    eliteThreshold: FEU_SCHOLARSHIP_THRESHOLDS.elite,
    scholarshipEnrollment: formatScholarshipEnrollment(
      scholarshipEnrollment,
      scholarshipEnrollment === "others" ? customScholarshipName : undefined
    ),
    customScholarshipName: scholarshipEnrollment === "others" ? customScholarshipName || null : null,
    customMaintainingGrade: scholarshipEnrollment === "others" ? customMaintainingGrade : null,
    scholarshipRetentionThreshold: snapshot.scholarship.retentionThreshold,
    scholarshipRetained: snapshot.scholarship.retention.retained,
    inferredScholarshipStanding: snapshot.scholarship.inferredTierLabel,
    magnaWithinReach: snapshot.honors.magnaWithinReach,
    inProgressTerm: snapshot.inProgressTerm,
    inProgressUnits: snapshot.projections.inProgressUnits,
    requiredToMaintainCumLaude: snapshot.projections.requiredToMaintainCumLaude,
    requiredForMagnaThisTerm: snapshot.projections.requiredForMagna,
    requiredForSummaThisTerm: snapshot.projections.requiredForSumma,
    requiredForPresidentialThisTerm: snapshot.projections.requiredForPresidential,
    requiredForEliteThisTerm: snapshot.projections.requiredForElite,
    requiredForScholarshipThisTerm: snapshot.projections.requiredForScholarship,
    riskCourses: snapshot.riskCourses.join("; ") || null,
    termGwaSummary: snapshot.terms
      .map((term) => `${term.shortLabel}: ${term.inProgress ? "in progress" : term.gwa?.toFixed(2) ?? "n/a"}`)
      .join(" | ")
  };
}
