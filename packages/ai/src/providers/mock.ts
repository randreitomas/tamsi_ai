import type { SolarExtraction } from "@tamsi/types";
import type { AcademicExtractor } from "../extraction";

export class MockAcademicExtractor implements AcademicExtractor {
  async extractGradeReport(): Promise<SolarExtraction> {
    return {
      terms: [
        {
          term: "1 - 20232024",
          courses: [
            {
              code: "CCS0001",
              title: "INTRODUCTION TO COMPUTING (LEC)",
              units: 2,
              midterm: 2.5,
              final: 2.5,
              status: "completed"
            },
            {
              code: "GED0009",
              title: "READINGS IN PHILIPPINE HISTORY",
              units: 3,
              midterm: 1.0,
              final: 1.0,
              status: "completed"
            },
            {
              code: "CS0001",
              title: "DISCRETE STRUCTURES 1",
              units: 3,
              midterm: 1.5,
              final: 2.0,
              status: "completed"
            }
          ]
        }
      ]
    };
  }
}
