"use client";

import type { TermMetric } from "@tamsi/academic-engine";
import { FEU_HONORS_THRESHOLDS } from "@tamsi/academic-engine";

const CHART_MIN = 3.0;
const CHART_MAX = 4.0;
const PLOT_HEIGHT = 180;

function gwaToHeight(gwa: number): number {
  const clamped = Math.min(Math.max(gwa, CHART_MIN), CHART_MAX);
  return ((clamped - CHART_MIN) / (CHART_MAX - CHART_MIN)) * PLOT_HEIGHT;
}

function formatGwa(value: number | null): string {
  if (value === null) {
    return "···";
  }

  return value.toFixed(2);
}

type GwaChartProps = {
  cumulativeGwa: number | null;
  totalCompletedUnits: number;
  terms: TermMetric[];
};

export function GwaChart({ cumulativeGwa, totalCompletedUnits, terms }: GwaChartProps) {
  const cumulativeLine = cumulativeGwa !== null ? gwaToHeight(cumulativeGwa) : null;

  return (
    <section>
      <div className="mb-[22px] flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#5c6b5e]">Cumulative GWA</div>
          <div className="mt-0.5 text-[30px] font-extrabold leading-none tracking-[-0.01em] text-[#0a4d21]">
            {cumulativeGwa?.toFixed(2) ?? "—"}{" "}
            <small className="text-[13px] font-medium text-[#5c6b5e]">· {totalCompletedUnits} units</small>
          </div>
        </div>
        <div className="flex flex-wrap gap-3.5 text-[11.5px] text-[#5c6b5e]">
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block size-[11px] rounded-[3px] bg-gradient-to-b from-[#1e8a4c] to-[#0e6b2e]" />
            Above Cum Laude
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block size-[11px] rounded-[3px] bg-gradient-to-b from-[#e0a33a] to-[#c77a12]" />
            Below Cum Laude
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block size-[11px] rounded-[3px] border-[1.5px] border-dashed border-[#7fa8c9] bg-[#e3eff7]" />
            In progress
          </span>
        </div>
      </div>

      <div className="relative pl-[34px]">
        <div className="absolute left-0 top-0 h-[180px] w-[30px]">
          <span className="absolute bottom-full right-1.5 translate-y-1/2 font-mono text-[10px] text-[#5c6b5e]">4.0</span>
          <span className="absolute bottom-[60%] right-1.5 translate-y-1/2 font-mono text-[10px] text-[#5c6b5e]">3.6</span>
          <span className="absolute bottom-[40%] right-1.5 translate-y-1/2 font-mono text-[10px] text-[#5c6b5e]">3.4</span>
          <span className="absolute bottom-0 right-1.5 translate-y-1/2 font-mono text-[10px] text-[#5c6b5e]">3.0</span>
        </div>

        <div className="relative h-[180px] border-b-2 border-[#c9d6c5]">
          <div className="absolute inset-x-0 z-[1] border-t-[1.5px] border-dashed border-[#9ab394]" style={{ bottom: gwaToHeight(FEU_HONORS_THRESHOLDS.magnaCumLaude) }}>
            <span className="absolute -top-2 right-0 bg-white px-1 font-mono text-[9px] font-bold text-[#5c6b5e]">Magna {FEU_HONORS_THRESHOLDS.magnaCumLaude}</span>
          </div>
          {cumulativeLine !== null ? (
            <div className="absolute inset-x-0 z-[2] border-t-[1.5px] border-solid border-[#f5b800]" style={{ bottom: cumulativeLine }}>
              <span className="absolute -top-2 right-0 rounded bg-[#fbe8a6] px-1 font-mono text-[9px] font-bold text-[#6b5300]">
                You {cumulativeGwa?.toFixed(2)}
              </span>
            </div>
          ) : null}
          <div className="absolute inset-x-0 z-[1] border-t-[1.5px] border-dashed border-[#c77a12]" style={{ bottom: gwaToHeight(FEU_HONORS_THRESHOLDS.cumLaude) }}>
            <span className="absolute -top-2 right-0 bg-white px-1 font-mono text-[9px] font-bold text-[#c77a12]">Cum Laude {FEU_HONORS_THRESHOLDS.cumLaude}</span>
          </div>

          <div className="absolute inset-0 z-[3] flex items-end justify-around gap-2 px-1">
            {terms.map((term) => {
              const displayGwa = term.inProgress ? term.snapshotGwa : term.gwa;
              const height = displayGwa !== null ? gwaToHeight(displayGwa) : gwaToHeight(CHART_MIN);
              const belowHonors = displayGwa !== null && displayGwa < FEU_HONORS_THRESHOLDS.cumLaude;

              return (
                <div className="flex h-full flex-1 flex-col items-center justify-end" key={term.term}>
                  <span
                    className={
                      term.inProgress
                        ? "mb-1 font-mono text-xs font-bold tracking-[1px] text-[#7fa8c9]"
                        : belowHonors
                          ? "mb-1 font-mono text-xs font-bold text-[#c77a12]"
                          : "mb-1 font-mono text-xs font-bold text-[#0a4d21]"
                    }
                  >
                    {term.inProgress ? "···" : formatGwa(displayGwa)}
                  </span>
                  <div
                    className={
                      term.inProgress
                        ? "w-[62%] max-w-[44px] rounded-t-[7px] border-[1.5px] border-b-0 border-dashed border-[#7fa8c9] bg-[#eef4fa]"
                        : belowHonors
                          ? "w-[62%] max-w-[44px] rounded-t-[7px] bg-gradient-to-b from-[#e6ac45] to-[#c77a12]"
                          : "w-[62%] max-w-[44px] rounded-t-[7px] bg-gradient-to-b from-[#23994f] to-[#0e6b2e]"
                    }
                    style={{ height: `${Math.max(height, 8)}px` }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="ml-[34px] flex justify-around gap-2 px-1 pt-2">
          {terms.map((term) => (
            <span className="flex-1 text-center font-mono text-[10px] text-[#5c6b5e]" key={term.term}>
              {term.shortLabel}
            </span>
          ))}
        </div>
      </div>

      <p className="mt-4 text-[12.5px] leading-6 text-[#5c6b5e]">
        Axis zoomed to 3.0–4.0 to show term-to-term movement.
        {terms.some((term) => term.inProgress) ? (
          <>
            {" "}
            The final bar is the term still <b className="text-[#0a4d21]">in progress</b>.
          </>
        ) : null}
      </p>
    </section>
  );
}
