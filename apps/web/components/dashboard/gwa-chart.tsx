"use client";

import type { TermMetric } from "@tamsi/academic-engine";
import { FEU_HONORS_THRESHOLDS } from "@tamsi/academic-engine";

const CHART_MIN = 3.0;
const CHART_MAX = 4.0;
const PLOT_HEIGHT = 180;
const LABEL_MIN_GAP = 15;

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

type ChartAnnotation = {
  id: string;
  bottom: number;
  label: string;
  lineClassName: string;
  labelClassName: string;
};

function layoutAnnotationLabels(annotations: ChartAnnotation[]) {
  const sorted = [...annotations].sort((left, right) => right.bottom - left.bottom);
  const placed: Array<ChartAnnotation & { labelBottom: number }> = [];

  for (const annotation of sorted) {
    let labelBottom = annotation.bottom;

    for (const previous of placed) {
      if (Math.abs(labelBottom - previous.labelBottom) < LABEL_MIN_GAP) {
        labelBottom = previous.labelBottom - LABEL_MIN_GAP;
      }
    }

    placed.push({ ...annotation, labelBottom });
  }

  return placed;
}

type GwaChartProps = {
  cumulativeGwa: number | null;
  totalCompletedUnits: number;
  terms: TermMetric[];
};

export function GwaChart({ cumulativeGwa, totalCompletedUnits, terms }: GwaChartProps) {
  const cumulativeLine = cumulativeGwa !== null ? gwaToHeight(cumulativeGwa) : null;

  const annotations = layoutAnnotationLabels(
    [
      {
        id: "magna",
        bottom: gwaToHeight(FEU_HONORS_THRESHOLDS.magnaCumLaude),
        label: `Magna ${FEU_HONORS_THRESHOLDS.magnaCumLaude.toFixed(1)}`,
        lineClassName: "border-dashed border-[#9ab394]",
        labelClassName: "text-[#5c6b5e] bg-white"
      },
      cumulativeLine !== null
        ? {
            id: "you",
            bottom: cumulativeLine,
            label: `You ${cumulativeGwa?.toFixed(2)}`,
            lineClassName: "border-solid border-[#f5b800]",
            labelClassName: "rounded bg-[#fbe8a6] text-[#6b5300]"
          }
        : null,
      {
        id: "cum-laude",
        bottom: gwaToHeight(FEU_HONORS_THRESHOLDS.cumLaude),
        label: `Cum Laude ${FEU_HONORS_THRESHOLDS.cumLaude.toFixed(1)}`,
        lineClassName: "border-dashed border-[#c77a12]",
        labelClassName: "text-[#c77a12] bg-white"
      }
    ].filter((annotation): annotation is ChartAnnotation => annotation !== null)
  );

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

      <div className="flex items-start gap-2">
        <div className="relative min-w-0 flex-1 pl-[34px]">
          <div className="absolute left-0 top-0 h-[180px] w-[30px]">
            <span className="absolute bottom-full right-1.5 translate-y-1/2 font-mono text-[10px] text-[#5c6b5e]">4.0</span>
            <span className="absolute bottom-[60%] right-1.5 translate-y-1/2 font-mono text-[10px] text-[#5c6b5e]">3.6</span>
            <span className="absolute bottom-[40%] right-1.5 translate-y-1/2 font-mono text-[10px] text-[#5c6b5e]">3.4</span>
            <span className="absolute bottom-0 right-1.5 translate-y-1/2 font-mono text-[10px] text-[#5c6b5e]">3.0</span>
          </div>

          <div className="relative h-[180px] overflow-visible border-b-2 border-[#c9d6c5]">
            {annotations.map((annotation) => (
              <div
                className={`absolute inset-x-0 border-t-[1.5px] ${annotation.id === "you" ? "z-[2]" : "z-[1]"} ${annotation.lineClassName}`}
                key={annotation.id}
                style={{ bottom: annotation.bottom }}
              />
            ))}

            <div className="absolute inset-0 z-[3] flex items-end justify-around gap-2 px-1">
              {terms.map((term) => {
                const displayGwa = term.inProgress ? term.snapshotGwa : term.gwa;
                const height = displayGwa !== null ? gwaToHeight(displayGwa) : gwaToHeight(CHART_MIN);
                const belowHonors = displayGwa !== null && displayGwa < FEU_HONORS_THRESHOLDS.cumLaude;

                return (
                  <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-end" key={term.term}>
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
                          ? "w-[62%] max-w-[44px] min-w-[18px] rounded-t-[7px] border-[1.5px] border-b-0 border-dashed border-[#7fa8c9] bg-[#eef4fa]"
                          : belowHonors
                            ? "w-[62%] max-w-[44px] min-w-[18px] rounded-t-[7px] bg-gradient-to-b from-[#e6ac45] to-[#c77a12] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
                            : "w-[62%] max-w-[44px] min-w-[18px] rounded-t-[7px] bg-gradient-to-b from-[#23994f] to-[#0e6b2e] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
                      }
                      style={{ height: `${Math.max(height, 8)}px` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-around gap-2 px-1 pt-2">
            {terms.map((term) => (
              <span className="min-w-0 flex-1 truncate text-center font-mono text-[10px] text-[#5c6b5e]" key={term.term}>
                {term.shortLabel}
              </span>
            ))}
          </div>
        </div>

        <div className="relative hidden h-[180px] w-[78px] shrink-0 sm:block">
          {annotations.map((annotation) => (
            <span
              className={`absolute right-0 -translate-y-1/2 whitespace-nowrap px-1 font-mono text-[9px] font-bold leading-none ${annotation.labelClassName}`}
              key={`${annotation.id}-label`}
              style={{ bottom: annotation.labelBottom }}
            >
              {annotation.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 sm:hidden">
        {annotations.map((annotation) => (
          <span
            className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-bold ${annotation.labelClassName}`}
            key={`${annotation.id}-mobile`}
          >
            {annotation.label}
          </span>
        ))}
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
