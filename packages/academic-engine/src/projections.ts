import { roundGwa, type GradeRecord } from "./gwa";

export function computeProjectedAverage(records: GradeRecord[], futureUnits: number, targetFutureGrade: number): number | null {
  const completed = records.filter((record) => record.status === "completed" && record.grade !== null);
  const completedUnits = completed.reduce((sum, record) => sum + record.units, 0);
  const completedWeighted = completed.reduce((sum, record) => sum + (record.grade ?? 0) * record.units, 0);
  const totalUnits = completedUnits + futureUnits;

  if (totalUnits === 0) {
    return null;
  }

  return roundGwa((completedWeighted + targetFutureGrade * futureUnits) / totalUnits);
}

export function computeRequiredTermAverage(
  cumulativeGwa: number,
  completedUnits: number,
  futureUnits: number,
  targetCumulativeGwa: number
): number | null {
  if (futureUnits <= 0) {
    return null;
  }

  const requiredWeighted =
    targetCumulativeGwa * (completedUnits + futureUnits) - cumulativeGwa * completedUnits;

  return roundGwa(requiredWeighted / futureUnits);
}
