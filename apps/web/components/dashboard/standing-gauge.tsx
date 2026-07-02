"use client";

import { useEffect, useState } from "react";
import {
  FEU_HONORS_THRESHOLDS,
  FEU_SCHOLARSHIP_THRESHOLDS
} from "@tamsi/academic-engine";

const GAUGE_TOP = 4.0;
const GAUGE_BOTTOM = 2.0;
const GAUGE_GRADIENT = "linear-gradient(180deg, #1e8a4c 0%, #7db36a 38%, #e7c44e 62%, #d98c3a 82%, #c0392b 100%)";

function gwaToPercent(gwa: number): number {
  const clamped = Math.min(Math.max(gwa, GAUGE_BOTTOM), GAUGE_TOP);
  return (1 - (clamped - GAUGE_BOTTOM) / (GAUGE_TOP - GAUGE_BOTTOM)) * 100;
}

type StandingGaugeProps = {
  cumulativeGwa: number | null;
  totalCompletedUnits: number;
  academicYearLabel: string;
};

const markers = [
  { label: "Summa", value: FEU_HONORS_THRESHOLDS.summaCumLaude },
  { label: "Magna", value: FEU_HONORS_THRESHOLDS.magnaCumLaude },
  { label: "Cum Laude", value: FEU_HONORS_THRESHOLDS.cumLaude },
  { label: "Presidential", value: FEU_SCHOLARSHIP_THRESHOLDS.presidential },
  { label: "Elite", value: FEU_SCHOLARSHIP_THRESHOLDS.elite }
];

export function StandingGauge({ cumulativeGwa, totalCompletedUnits, academicYearLabel }: StandingGaugeProps) {
  const [animated, setAnimated] = useState(false);
  const studentPercent = cumulativeGwa !== null ? gwaToPercent(cumulativeGwa) : 100;

  useEffect(() => {
    const timer = window.setTimeout(() => setAnimated(true), 120);
    return () => window.clearTimeout(timer);
  }, [cumulativeGwa]);

  return (
    <div className="workflow-card bg-canvas p-5">
      <div className="mb-4 text-center text-[13px] font-semibold tracking-[0.02em] text-muted">
        Cumulative GWA · {totalCompletedUnits} units · {academicYearLabel}
      </div>
      <div className="relative mx-auto h-[330px] w-full">
        <div
          className="absolute left-1/2 h-full w-3.5 -translate-x-1/2 rounded-full opacity-90"
          style={{ background: GAUGE_GRADIENT }}
        />

        {markers.map((marker) => (
          <div
            className="absolute right-[calc(50%+16px)] flex -translate-y-1/2 items-baseline gap-1.5 whitespace-nowrap after:absolute after:-right-4 after:top-1/2 after:h-0.5 after:w-2.5 after:-translate-y-1/2 after:bg-line"
            key={marker.label}
            style={{ top: `${gwaToPercent(marker.value)}%` }}
          >
            <span className="text-[9px] uppercase leading-none tracking-[0.05em] text-muted">{marker.label}</span>
            <span className="font-mono text-xs font-bold text-ink">{marker.value.toFixed(1)}</span>
          </div>
        ))}

        {cumulativeGwa !== null ? (
          <>
            <div
              className="absolute left-1/2 z-[4] size-[26px] -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-accent bg-elevated shadow-[0_4px_12px_rgba(14,107,46,0.35)] transition-[top] duration-[1100ms] ease-[cubic-bezier(.22,1,.36,1)] after:absolute after:inset-[5px] after:rounded-full after:bg-[var(--gold)]"
              style={{ top: animated ? `${studentPercent}%` : "100%" }}
            />
            <div
              className="absolute left-[calc(50%+22px)] z-[5] -translate-y-1/2 whitespace-nowrap transition-[top] duration-[1100ms] ease-[cubic-bezier(.22,1,.36,1)]"
              style={{ top: animated ? `${studentPercent}%` : "100%" }}
            >
              <span className="block font-mono text-xl font-bold leading-none text-accent-dark">{cumulativeGwa.toFixed(2)}</span>
              <span className="mt-1 block text-[10px] uppercase leading-none tracking-[0.08em] text-muted">You</span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
