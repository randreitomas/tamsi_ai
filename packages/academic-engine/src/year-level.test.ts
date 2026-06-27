import { describe, expect, it } from "vitest";
import { inferAcademicYearLabel, inferAcademicYearNumber } from "./year-level";

describe("year level", () => {
  it("labels six terms with an in-progress term as entering 3rd year", () => {
    expect(inferAcademicYearLabel(6, true)).toBe("entering 3rd year");
    expect(inferAcademicYearNumber(6, true)).toBe(3);
  });

  it("labels completed terms without in-progress work", () => {
    expect(inferAcademicYearLabel(3, false)).toBe("in 1st year");
    expect(inferAcademicYearLabel(6, false)).toBe("in 2nd year");
  });

  it("labels two terms with one in progress as entering 1st year", () => {
    expect(inferAcademicYearLabel(2, true)).toBe("entering 1st year");
  });
});
