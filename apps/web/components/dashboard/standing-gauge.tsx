"use client";

import { useEffect, useState } from "react";
import {
  FEU_HONORS_THRESHOLDS,
  FEU_SCHOLARSHIP_THRESHOLDS
} from "@tamsi/academic-engine";

const GAUGE_TOP = 4.0;
const GAUGE_BOTTOM = 2.0;

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
    <div className="rounded-2xl border border-[#d7e2d4] bg-gradient-to-b from-[#fbfdfa] to-[#f4f9f2] p-5">
      <div className="mb-4 text-center text-[13px] font-semibold tracking-[0.02em] text-[#5c6b5e]">
        Cumulative GWA · {totalCompletedUnits} units · {academicYearLabel}
      </div>
      <div className="relative mx-auto h-[330px] w-full">
        <div className="absolute left-1/2 h-full w-3.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-[#1e8a4c] via-[#7db36a] via-[38%] via-[#e7c44e] via-[62%] via-[#d98c3a] via-[82%] to-[#c0392b] opacity-90" />

        {markers.map((marker) => (
          <div
            className="absolute right-[calc(50%+16px)] flex -translate-y-1/2 items-baseline gap-1.5 whitespace-nowrap after:absolute after:-right-4 after:top-1/2 after:h-0.5 after:w-2.5 after:-translate-y-1/2 after:bg-[#b9cdb3]"
            key={marker.label}
            style={{ top: `${gwaToPercent(marker.value)}%` }}
          >
            <span className="text-[9px] uppercase leading-none tracking-[0.05em] text-[#5c6b5e]">{marker.label}</span>
            <span className="font-mono text-xs font-bold text-[#0b1f12]">{marker.value.toFixed(1)}</span>
          </div>
        ))}

        {cumulativeGwa !== null ? (
          <>
            <div
              className="absolute left-1/2 z-[4] size-[26px] -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[#0e6b2e] bg-white shadow-[0_4px_12px_rgba(14,107,46,.35)] transition-[top] duration-[1100ms] ease-[cubic-bezier(.22,1,.36,1)] after:absolute after:inset-[5px] after:rounded-full after:bg-[#f5b800]"
              style={{ top: animated ? `${studentPercent}%` : "100%" }}
            />
            <div
              className="absolute left-[calc(50%+22px)] z-[5] -translate-y-1/2 whitespace-nowrap transition-[top] duration-[1100ms] ease-[cubic-bezier(.22,1,.36,1)]"
              style={{ top: animated ? `${studentPercent}%` : "100%" }}
            >
              <span className="block font-mono text-xl font-bold leading-none text-[#0a4d21]">{cumulativeGwa.toFixed(2)}</span>
              <span className="text-[10px] uppercase tracking-[0.08em] text-[#5c6b5e]">You</span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
