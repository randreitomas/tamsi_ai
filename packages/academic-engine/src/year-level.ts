const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th"] as const;

function toOrdinal(yearNumber: number): string {
  return ORDINALS[Math.min(Math.max(yearNumber, 1), ORDINALS.length) - 1] ?? `${yearNumber}th`;
}

export function inferAcademicYearNumber(termCount: number, hasInProgressTerm = false): number {
  if (termCount <= 0) {
    return 1;
  }

  if (hasInProgressTerm) {
    return Math.min(Math.floor(termCount / 3) + 1, ORDINALS.length);
  }

  return Math.min(Math.max(1, Math.ceil(termCount / 3)), ORDINALS.length);
}

export function inferAcademicYearLabel(termCount: number, hasInProgressTerm: boolean): string {
  if (termCount <= 0) {
    return "starting 1st year";
  }

  const yearNumber = inferAcademicYearNumber(termCount, hasInProgressTerm);
  const ordinal = toOrdinal(yearNumber);

  return hasInProgressTerm ? `entering ${ordinal} year` : `in ${ordinal} year`;
}
