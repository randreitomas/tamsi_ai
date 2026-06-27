export type GradeRecord = {
  units: number;
  grade: number | null;
  status: "completed" | "in_progress" | "dropped" | "credited";
};

export type TermRecord = {
  term: string;
  courses: GradeRecord[];
};

export function computeTermGWA(courses: GradeRecord[]): number | null {
  const completed = courses.filter((course) => course.status === "completed" && course.grade !== null);
  const totalUnits = completed.reduce((sum, course) => sum + course.units, 0);

  if (totalUnits === 0) {
    return null;
  }

  const weightedGrades = completed.reduce((sum, course) => {
    return sum + (course.grade ?? 0) * course.units;
  }, 0);

  return roundGwa(weightedGrades / totalUnits);
}

export function computeCumulativeGWA(terms: TermRecord[]): number | null {
  const completed = terms.flatMap((term) => term.courses).filter((course) => {
    return course.status === "completed" && course.grade !== null;
  });

  return computeTermGWA(completed);
}

export function computeRemainingUnits(requiredUnits: number, terms: TermRecord[]): number {
  const completedUnits = terms
    .flatMap((term) => term.courses)
    .filter((course) => course.status === "completed" || course.status === "credited")
    .reduce((sum, course) => sum + course.units, 0);

  return Math.max(requiredUnits - completedUnits, 0);
}

export function roundGwa(value: number): number {
  return Math.round(value * 1000) / 1000;
}

