"use client";

import { useEffect, useState } from "react";

const PREVIEW_ROWS = [
  { code: "CCS0001", title: "INTRODUCTION TO COMPUTING (LEC)", units: "2", midterm: "3.5", final: "4.0" },
  { code: "GED0009", title: "READINGS IN PHILIPPINE HISTORY", units: "3", midterm: "3.5", final: "4.0" },
  { code: "CS0001", title: "DISCRETE STRUCTURES 1", units: "3", midterm: "3.0", final: "3.5" }
] as const;

const FIELD_ORDER = ["code", "title", "units", "midterm", "final"] as const;

type PreviewRow = (typeof PREVIEW_ROWS)[number];
type PreviewField = (typeof FIELD_ORDER)[number];
type DisplayRow = Record<PreviewField, string>;
type Cursor = { row: number; field: PreviewField };

const CHAR_MS = 30;
const ROW_PAUSE_MS = 400;
const LOOP_PAUSE_MS = 2400;
const HEADER_DELAY_MS = 450;

function emptyRow(): DisplayRow {
  return { code: "", title: "", units: "", midterm: "", final: "" };
}

function rowStarted(row: DisplayRow) {
  return FIELD_ORDER.some((field) => row[field].length > 0);
}

function gradeClass(value: string) {
  const numeric = Number(value || 0);
  if (numeric >= 3.4) {
    return "text-success";
  }

  if (numeric >= 3.0) {
    return "text-accent-dark";
  }

  return "text-warning";
}

export function LandingPreviewTable() {
  const [showHeaders, setShowHeaders] = useState(false);
  const [displayRows, setDisplayRows] = useState<DisplayRow[]>(() => PREVIEW_ROWS.map(() => emptyRow()));
  const [cursor, setCursor] = useState<Cursor | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const delay = (ms: number) =>
      new Promise<void>((resolve) => {
        timeouts.push(setTimeout(resolve, ms));
      });

    async function run() {
      while (!cancelled) {
        setShowHeaders(false);
        setDisplayRows(PREVIEW_ROWS.map(() => emptyRow()));
        setCursor(null);

        await delay(HEADER_DELAY_MS);
        if (cancelled) {
          return;
        }

        setShowHeaders(true);

        const current = PREVIEW_ROWS.map(() => emptyRow());

        for (let rowIndex = 0; rowIndex < PREVIEW_ROWS.length; rowIndex++) {
          const source = PREVIEW_ROWS[rowIndex];

          for (const field of FIELD_ORDER) {
            const full = source[field];

            for (let charIndex = 0; charIndex <= full.length; charIndex++) {
              if (cancelled) {
                return;
              }

              current[rowIndex] = { ...current[rowIndex], [field]: full.slice(0, charIndex) };
              setDisplayRows(current.map((row) => ({ ...row })));
              setCursor(charIndex < full.length ? { row: rowIndex, field } : null);

              if (charIndex < full.length) {
                await delay(CHAR_MS);
              }
            }
          }

          await delay(ROW_PAUSE_MS);
        }

        setCursor(null);
        await delay(LOOP_PAUSE_MS);
      }
    }

    void run();

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <>
      <div className="space-y-3 md:hidden">
        {displayRows.map((row, rowIndex) => {
          if (!rowStarted(row)) {
            return null;
          }

          const active = cursor?.row === rowIndex;

          return (
            <div
              className={`preview-table-card rounded-lg border border-line bg-canvas p-4 ${active ? "preview-table-card--active" : ""}`}
              key={PREVIEW_ROWS[rowIndex].code}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <TypedValue
                    active={cursor?.row === rowIndex && cursor.field === "code"}
                    className="font-mono text-[12.5px] font-bold text-accent-dark"
                    value={row.code}
                  />
                  <div className="mt-1 text-[13px] leading-5 text-ink">
                    <TypedValue
                      active={cursor?.row === rowIndex && cursor.field === "title"}
                      value={row.title}
                    />
                  </div>
                </div>
                <span className="shrink-0 font-mono text-xs font-semibold text-muted">
                  <TypedValue
                    active={cursor?.row === rowIndex && cursor.field === "units"}
                    suffix={row.units ? " u" : ""}
                    value={row.units}
                  />
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">Midterm</div>
                  <div className={`mt-0.5 font-mono text-sm font-bold ${gradeClass(row.midterm)}`}>
                    <TypedValue
                      active={cursor?.row === rowIndex && cursor.field === "midterm"}
                      value={row.midterm}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">Final</div>
                  <div className={`mt-0.5 font-mono text-sm font-bold ${gradeClass(row.final)}`}>
                    <TypedValue
                      active={cursor?.row === rowIndex && cursor.field === "final"}
                      value={row.final}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="-mx-1 hidden overflow-x-auto px-1 md:block">
        <table className="w-full min-w-[520px] border-collapse text-[13.5px]">
          <thead className={showHeaders ? "preview-table-header--visible" : "opacity-0"}>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-[0.06em] text-muted">
              <th className="px-2.5 pb-2.5 font-semibold">Course</th>
              <th className="px-2.5 pb-2.5 font-semibold">Title</th>
              <th className="px-2.5 pb-2.5 text-center font-semibold">Units</th>
              <th className="px-2.5 pb-2.5 text-center font-semibold">Midterm</th>
              <th className="px-2.5 pb-2.5 text-center font-semibold">Final</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, rowIndex) => {
              if (!rowStarted(row)) {
                return null;
              }

              const active = cursor?.row === rowIndex;

              return (
                <tr
                  className={`preview-table-row border-b border-line/60 last:border-0 ${active ? "preview-table-row--active" : ""}`}
                  key={PREVIEW_ROWS[rowIndex].code}
                >
                  <td className="px-2.5 py-3 font-mono text-[12.5px] font-bold text-accent-dark">
                    <TypedValue
                      active={cursor?.row === rowIndex && cursor.field === "code"}
                      value={row.code}
                    />
                  </td>
                  <td className="px-2.5 py-3 text-ink">
                    <TypedValue
                      active={cursor?.row === rowIndex && cursor.field === "title"}
                      value={row.title}
                    />
                  </td>
                  <td className="px-2.5 py-3 text-center font-mono">
                    <TypedValue
                      active={cursor?.row === rowIndex && cursor.field === "units"}
                      value={row.units}
                    />
                  </td>
                  <td className={`px-2.5 py-3 text-center font-mono font-bold ${gradeClass(row.midterm)}`}>
                    <TypedValue
                      active={cursor?.row === rowIndex && cursor.field === "midterm"}
                      value={row.midterm}
                    />
                  </td>
                  <td className={`px-2.5 py-3 text-center font-mono font-bold ${gradeClass(row.final)}`}>
                    <TypedValue
                      active={cursor?.row === rowIndex && cursor.field === "final"}
                      value={row.final}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function TypedValue({
  active,
  className,
  suffix = "",
  value
}: {
  active?: boolean;
  className?: string;
  suffix?: string;
  value: string;
}) {
  return (
    <span className={className}>
      {value}
      {suffix}
      {active ? <span aria-hidden="true" className="preview-type-cursor" /> : null}
    </span>
  );
}
