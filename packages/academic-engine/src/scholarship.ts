import {
  FEU_SCHOLARSHIP_THRESHOLDS,
  formatScholarshipEnrollment,
  scholarshipThresholdForEnrollment,
  type ScholarshipEnrollmentDetails,
  type ScholarshipEnrollmentTier
} from "./feu-standards";

export type ScholarshipRetentionInput = ScholarshipEnrollmentDetails & {
  cumulativeGwa: number | null;
  termGwa: number | null;
  hasFailingGrade: boolean;
};

export type ScholarshipRetentionResult = {
  retained: boolean;
  reason: string;
};

export function checkScholarshipRetention(input: ScholarshipRetentionInput): ScholarshipRetentionResult {
  if (input.enrollment === "none") {
    return { retained: true, reason: "No scholarship enrolled — retention rules do not apply." };
  }

  if (input.enrollment === "others") {
    const scholarshipName = formatScholarshipEnrollment("others", input.customName);
    const threshold = scholarshipThresholdForEnrollment(input);

    if (threshold === null) {
      return {
        retained: true,
        reason: `${scholarshipName} is enrolled — add a maintaining grade to evaluate retention.`
      };
    }

    if (input.cumulativeGwa === null) {
      return { retained: false, reason: "Not enough completed grades to evaluate scholarship retention." };
    }

    if (input.hasFailingGrade) {
      return { retained: false, reason: "Scholarship retention requires no failing grades." };
    }

    if (input.cumulativeGwa < threshold) {
      return {
        retained: false,
        reason: `${scholarshipName} requires a cumulative GWA of ${threshold.toFixed(2)} or higher.`
      };
    }

    return { retained: true, reason: `The computed grades currently meet ${scholarshipName} retention rules.` };
  }

  if (input.cumulativeGwa === null) {
    return { retained: false, reason: "Not enough completed grades to evaluate scholarship retention." };
  }

  if (input.hasFailingGrade) {
    return { retained: false, reason: "Scholarship retention requires no failing grades." };
  }

  if (input.enrollment === "presidential" && input.cumulativeGwa < FEU_SCHOLARSHIP_THRESHOLDS.presidential) {
    return {
      retained: false,
      reason: `Presidential scholarship requires a cumulative GWA of ${FEU_SCHOLARSHIP_THRESHOLDS.presidential.toFixed(1)} or higher.`
    };
  }

  if (input.enrollment === "elite" && input.cumulativeGwa < FEU_SCHOLARSHIP_THRESHOLDS.elite) {
    return {
      retained: false,
      reason: `Elite scholarship requires a cumulative GWA of ${FEU_SCHOLARSHIP_THRESHOLDS.elite.toFixed(1)} or higher.`
    };
  }

  return { retained: true, reason: "The computed grades currently meet scholarship retention rules." };
}

export type { ScholarshipEnrollmentTier };
