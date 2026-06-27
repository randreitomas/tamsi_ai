import type { AcademicSnapshot, AcademicSnapshotOptions, ScholarshipEnrollmentTier } from "@tamsi/academic-engine";
import type { ReviewCourse } from "@tamsi/types";

export const TAMSI_STORAGE_KEYS = {
  confirmedCourses: "tamsi:confirmedCourses",
  lastExtraction: "tamsi:lastExtraction",
  lastExtractionSources: "tamsi:lastExtractionSources",
  preferences: "tamsi:preferences",
  metricsCache: "tamsi:metricsCache"
} as const;

const ALL_KEYS = Object.values(TAMSI_STORAGE_KEYS);

export type TamsiPreferences = {
  scholarshipEnrollment: ScholarshipEnrollmentTier;
  customScholarshipName: string;
  customMaintainingGrade: number | null;
};

export type MetricsCache = {
  fingerprint: string;
  snapshot: AcademicSnapshot;
  advice: string | null;
  computedAt: string;
};

const DEFAULT_PREFERENCES: TamsiPreferences = {
  scholarshipEnrollment: "none",
  customScholarshipName: "",
  customMaintainingGrade: null
};

function isBrowser() {
  return typeof window !== "undefined";
}

let legacyLocalStoragePurged = false;

/** Drop any grades cached in localStorage from earlier builds. */
export function purgeLegacyLocalStorage() {
  if (!isBrowser() || legacyLocalStoragePurged) {
    return;
  }

  for (const key of ALL_KEYS) {
    localStorage.removeItem(key);
  }

  legacyLocalStoragePurged = true;
}

function readRaw(key: string): string | null {
  if (!isBrowser()) {
    return null;
  }

  purgeLegacyLocalStorage();
  return sessionStorage.getItem(key);
}

function parseJSON<T>(raw: string | null): T | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeSession(key: string, value: string) {
  if (!isBrowser()) {
    return;
  }

  purgeLegacyLocalStorage();
  sessionStorage.setItem(key, value);
}

export function removeSession(key: string) {
  if (!isBrowser()) {
    return;
  }

  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
}

export function readSessionJSON<T>(key: string): T | null {
  return parseJSON<T>(readRaw(key));
}

export function writeSessionJSON(key: string, value: unknown) {
  writeSession(key, JSON.stringify(value));
}

/** Clear all Tamsi session data (grades, extraction draft, preferences, cached advice). */
export function clearAllSessionData() {
  if (!isBrowser()) {
    return;
  }

  for (const key of ALL_KEYS) {
    removeSession(key);
  }
}

function normalizePreferences(raw: Partial<TamsiPreferences> | null): TamsiPreferences {
  if (!raw) {
    return DEFAULT_PREFERENCES;
  }

  return {
    scholarshipEnrollment: raw.scholarshipEnrollment ?? DEFAULT_PREFERENCES.scholarshipEnrollment,
    customScholarshipName: raw.customScholarshipName ?? "",
    customMaintainingGrade:
      typeof raw.customMaintainingGrade === "number" ? raw.customMaintainingGrade : null
  };
}

export function readPreferences(): TamsiPreferences {
  return normalizePreferences(readSessionJSON<Partial<TamsiPreferences>>(TAMSI_STORAGE_KEYS.preferences));
}

export function writePreferences(preferences: TamsiPreferences) {
  writeSessionJSON(TAMSI_STORAGE_KEYS.preferences, preferences);
}

export function preferencesToSnapshotOptions(preferences: TamsiPreferences): AcademicSnapshotOptions {
  return {
    scholarshipEnrollment: preferences.scholarshipEnrollment,
    customScholarshipName: preferences.customScholarshipName,
    customMaintainingGrade: preferences.customMaintainingGrade
  };
}

export function readConfirmedCourses(): ReviewCourse[] | null {
  return readSessionJSON<ReviewCourse[]>(TAMSI_STORAGE_KEYS.confirmedCourses);
}

export function writeConfirmedCourses(courses: ReviewCourse[]) {
  writeSessionJSON(TAMSI_STORAGE_KEYS.confirmedCourses, courses);
}

export function fingerprintCourses(courses: ReviewCourse[], preferences: TamsiPreferences): string {
  const payload = courses.map((course) => ({
    code: course.code,
    term: course.term,
    units: course.units,
    midterm: course.midterm,
    final: course.final,
    status: course.status
  }));

  return `${JSON.stringify(preferences)}:${JSON.stringify(payload)}`;
}

export function readMetricsCache(): MetricsCache | null {
  return readSessionJSON<MetricsCache>(TAMSI_STORAGE_KEYS.metricsCache);
}

export function writeMetricsCache(cache: MetricsCache) {
  writeSessionJSON(TAMSI_STORAGE_KEYS.metricsCache, cache);
}

export function clearMetricsCache() {
  removeSession(TAMSI_STORAGE_KEYS.metricsCache);
}
