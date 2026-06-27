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
    <div className="rounded-2xl border border-[#d7e2d4] bg-white p-5">
      <div className="mb-1 text-sm font-bold text-[#0b1f12]">Your scholarship</div>
      <p className="mb-4 text-[13px] leading-6 text-[#5c6b5e]">Select one so Tamsi checks the right retention threshold.</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Scholarship tier">
        {OPTIONS.map((option) => {
          const selected = option === value.enrollment;

          return (
            <button
              aria-checked={selected}
              className={
                selected
                  ? "rounded-[10px] border border-[#0e6b2e] bg-[#0e6b2e] px-3.5 py-2 text-[12.5px] font-bold text-white shadow-[0_4px_12px_rgba(14,107,46,.25)]"
                  : "rounded-[10px] border border-[#d7e2d4] bg-[#f6faf4] px-3.5 py-2 text-[12.5px] font-bold text-[#5c6b5e] transition hover:border-[#b9cdb3] hover:text-[#0a4d21]"
              }
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
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#5c6b5e]">Scholarship name</span>
            <input
              className="w-full rounded-[10px] border border-[#d7e2d4] bg-[#f6faf4] px-3 py-2.5 text-sm text-[#0b1f12] outline-none focus:border-[#0e6b2e] focus:bg-white"
              onChange={(event) => onChange({ ...value, customName: event.target.value })}
              placeholder="e.g. Academic scholarship"
              type="text"
              value={value.customName}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#5c6b5e]">Maintaining grade</span>
            <input
              className="w-full rounded-[10px] border border-[#d7e2d4] bg-[#f6faf4] px-3 py-2.5 text-sm font-mono text-[#0b1f12] outline-none focus:border-[#0e6b2e] focus:bg-white"
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

      {error ? <p className="mt-3 text-sm font-semibold text-[#9a2f20]">{error}</p> : null}
    </div>
  );
}

export function pickerValueFromPreferences(preferences: {
  scholarshipEnrollment: ScholarshipEnrollmentTier;
  customScholarshipName?: string;
  customMaintainingGrade?: number | null;
}): ScholarshipPickerValue {
  return {
    enrollment: preferences.scholarshipEnrollment,
    customName: preferences.customScholarshipName ?? "",
    customMaintainingGrade:
      preferences.customMaintainingGrade !== null && preferences.customMaintainingGrade !== undefined
        ? String(preferences.customMaintainingGrade)
        : ""
  };
}

export function parseMaintainingGrade(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0.5 || parsed > 4) {
    return null;
  }

  return Math.round(parsed * 100) / 100;
}
