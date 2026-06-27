export const FEU_GRADE_SCALE = {
  highest: 4.0,
  failing: 0.5
} as const;

export const FEU_HONORS_THRESHOLDS = {
  cumLaude: 3.4,
  magnaCumLaude: 3.6,
  summaCumLaude: 3.8
} as const;

export const FEU_SCHOLARSHIP_THRESHOLDS = {
  presidential: 3.0,
  elite: 2.5
} as const;

export type FeuHonorsTier = "summa_cum_laude" | "magna_cum_laude" | "cum_laude" | "none";

export type FeuScholarshipTier = "presidential" | "elite" | "at_risk" | "unknown";

export type ScholarshipEnrollmentTier = "presidential" | "elite" | "none" | "others";

export type ScholarshipEnrollmentDetails = {
  enrollment: ScholarshipEnrollmentTier;
  customName?: string;
  customMaintainingGrade?: number | null;
};

export function resolveHonorsTier(cumulativeGwa: number | null): FeuHonorsTier {
  if (cumulativeGwa === null) {
    return "none";
  }

  if (cumulativeGwa >= FEU_HONORS_THRESHOLDS.summaCumLaude) {
    return "summa_cum_laude";
  }

  if (cumulativeGwa >= FEU_HONORS_THRESHOLDS.magnaCumLaude) {
    return "magna_cum_laude";
  }

  if (cumulativeGwa >= FEU_HONORS_THRESHOLDS.cumLaude) {
    return "cum_laude";
  }

  return "none";
}

export function resolveScholarshipTier(cumulativeGwa: number | null): FeuScholarshipTier {
  if (cumulativeGwa === null) {
    return "unknown";
  }

  if (cumulativeGwa >= FEU_SCHOLARSHIP_THRESHOLDS.presidential) {
    return "presidential";
  }

  if (cumulativeGwa >= FEU_SCHOLARSHIP_THRESHOLDS.elite) {
    return "elite";
  }

  return "at_risk";
}

export function formatHonorsTier(tier: FeuHonorsTier): string {
  switch (tier) {
    case "summa_cum_laude":
      return "Summa Cum Laude";
    case "magna_cum_laude":
      return "Magna Cum Laude";
    case "cum_laude":
      return "Cum Laude";
    default:
      return "No Latin honors yet";
  }
}

export function formatScholarshipTier(tier: FeuScholarshipTier): string {
  switch (tier) {
    case "presidential":
      return "Presidential";
    case "elite":
      return "Elite";
    case "at_risk":
      return "At risk";
    default:
      return "Unknown";
  }
}

export function formatScholarshipEnrollment(tier: ScholarshipEnrollmentTier, customName?: string): string {
  switch (tier) {
    case "presidential":
      return "Presidential";
    case "elite":
      return "Elite";
    case "others":
      return customName?.trim() || "Other scholarship";
    default:
      return "None";
  }
}

export function scholarshipThresholdForEnrollment(details: ScholarshipEnrollmentDetails): number | null {
  switch (details.enrollment) {
    case "presidential":
      return FEU_SCHOLARSHIP_THRESHOLDS.presidential;
    case "elite":
      return FEU_SCHOLARSHIP_THRESHOLDS.elite;
    case "others":
      return typeof details.customMaintainingGrade === "number" ? details.customMaintainingGrade : null;
    default:
      return null;
  }
}
