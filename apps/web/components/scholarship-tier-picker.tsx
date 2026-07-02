"use client";

import type { ScholarshipEnrollmentTier } from "@tamsi/academic-engine";

export type ScholarshipPickerValue = {
  enrollment: ScholarshipEnrollmentTier;
  customName: string;
  customMaintainingGrade: string;
};

type ScholarshipTierPickerProps = {
  value: ScholarshipPickerValue;
  onChange: (value: ScholarshipPickerValue) => void;
  error?: string | null;
};

const OPTIONS: ScholarshipEnrollmentTier[] = ["none", "presidential", "elite", "others"];

const OPTION_LABELS: Record<ScholarshipEnrollmentTier, string> = {
  none: "None",
  presidential: "Presidential",
  elite: "Elite",
  others: "Others"
};

export function ScholarshipTierPicker({ value, onChange, error }: ScholarshipTierPickerProps) {
  const showCustomFields = value.enrollment === "others";

  return (
    <div className="workflow-card">
      <div className="workflow-card-header">
        <div>
          <h2 className="workflow-card-title">Your scholarship</h2>
          <p className="workflow-card-desc">Select one so Tamsi checks the right retention threshold.</p>
        </div>
      </div>
      <div className="workflow-card-body">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Scholarship tier">
        {OPTIONS.map((option) => {
          const selected = option === value.enrollment;

          return (
            <button
              aria-checked={selected}
              className={selected ? "chip chip--active" : "chip"}
              key={option}
              onClick={() => onChange({ ...value, enrollment: option })}
              role="radio"
              type="button"
            >
              {OPTION_LABELS[option]}
            </button>
          );
        })}
      </div>

      {showCustomFields ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="form-label text-[11px] uppercase tracking-[0.05em] text-muted">Scholarship name</span>
            <input
              className="form-input"
              onChange={(event) => onChange({ ...value, customName: event.target.value })}
              placeholder="e.g. Academic scholarship"
              type="text"
              value={value.customName}
            />
          </label>
          <label className="block">
            <span className="form-label text-[11px] uppercase tracking-[0.05em] text-muted">Maintaining grade</span>
            <input
              className="form-input font-mono"
              inputMode="decimal"
              max={4}
              min={0.5}
              onChange={(event) => onChange({ ...value, customMaintainingGrade: event.target.value })}
              placeholder="e.g. 3.0"
              step="0.25"
              type="number"
              value={value.customMaintainingGrade}
            />
          </label>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm font-semibold text-danger">{error}</p> : null}
      </div>
    </div>
  );
}

export function parseMaintainingGrade(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function pickerValueFromPreferences(preferences: {
  scholarshipEnrollment: ScholarshipEnrollmentTier;
  customScholarshipName: string;
  customMaintainingGrade: number | null;
}): ScholarshipPickerValue {
  return {
    enrollment: preferences.scholarshipEnrollment,
    customName: preferences.customScholarshipName,
    customMaintainingGrade:
      preferences.customMaintainingGrade === null ? "" : String(preferences.customMaintainingGrade)
  };
}
