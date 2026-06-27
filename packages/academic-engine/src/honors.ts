import { FEU_HONORS_THRESHOLDS } from "./feu-standards";

export type HonorsInput = {
  cumulativeGwa: number | null;
  hasFailingGrade: boolean;
  hasDisciplinaryCase: boolean;
};

export type EligibilityResult = {
  eligible: boolean;
  reason: string;
};

function checkMinimumGwa(input: HonorsInput, minimumGwa: number, label: string): EligibilityResult {
  if (input.cumulativeGwa === null) {
    return { eligible: false, reason: "Not enough completed grades to evaluate honors." };
  }

  if (input.hasFailingGrade) {
    return { eligible: false, reason: `${label} requires no failing grades.` };
  }

  if (input.hasDisciplinaryCase) {
    return { eligible: false, reason: `${label} requires a clear disciplinary record.` };
  }

  if (input.cumulativeGwa < minimumGwa) {
    return {
      eligible: false,
      reason: `${label} requires a cumulative GWA of ${minimumGwa.toFixed(1)} or higher.`
    };
  }

  return { eligible: true, reason: `The computed cumulative GWA currently meets ${label} standing.` };
}

export function checkCumLaudeEligibility(input: HonorsInput): EligibilityResult {
  return checkMinimumGwa(input, FEU_HONORS_THRESHOLDS.cumLaude, "Cum Laude");
}

export function checkMagnaEligibility(input: HonorsInput): EligibilityResult {
  return checkMinimumGwa(input, FEU_HONORS_THRESHOLDS.magnaCumLaude, "Magna Cum Laude");
}

export function checkSummaEligibility(input: HonorsInput): EligibilityResult {
  return checkMinimumGwa(input, FEU_HONORS_THRESHOLDS.summaCumLaude, "Summa Cum Laude");
}
