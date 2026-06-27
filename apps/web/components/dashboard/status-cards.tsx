import type { AcademicSnapshot } from "@tamsi/academic-engine";
import { FEU_HONORS_THRESHOLDS } from "@tamsi/academic-engine";

type StatusCardsProps = {
  snapshot: AcademicSnapshot;
};

export function StatusCards({ snapshot }: StatusCardsProps) {
  const enrollment = snapshot.scholarship.enrollment;
  const threshold = snapshot.scholarship.retentionThreshold;

  const scholarshipSecure =
    enrollment !== "none" &&
    snapshot.cumulativeGwa !== null &&
    threshold !== null &&
    snapshot.cumulativeGwa >= threshold &&
    snapshot.scholarship.retention.retained;

  const honorsLabel =
    snapshot.honors.currentTier === "none"
      ? "Building record"
      : snapshot.honors.currentLabel.replace(" Cum Laude", "");

  const honorsBadge = snapshot.honors.magnaWithinReach
    ? { tone: "reach" as const, text: "Magna within reach" }
    : snapshot.honors.cumLaude.eligible
      ? { tone: "ok" as const, text: `Above ${FEU_HONORS_THRESHOLDS.cumLaude.toFixed(1)} Cum Laude line` }
      : { tone: "reach" as const, text: `Need ${FEU_HONORS_THRESHOLDS.cumLaude.toFixed(1)} for Cum Laude` };

  const scholarshipBadge =
    enrollment === "none"
      ? { tone: "reach" as const, text: "No scholarship on record" }
      : enrollment === "others" && threshold === null
        ? { tone: "reach" as const, text: "Add maintaining grade on review" }
        : scholarshipSecure
          ? {
              tone: "ok" as const,
              text: `Secure · above ${threshold?.toFixed(Number.isInteger(threshold) ? 1 : 2)}`
            }
          : {
              tone: "reach" as const,
              text: `Hold above ${threshold?.toFixed(Number.isInteger(threshold) ? 1 : 2)}`
            };

  return (
    <div className="mb-[18px] grid gap-3 sm:grid-cols-2">
      <div className="rounded-[14px] border border-[#d7e2d4] bg-white p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#5c6b5e]">Scholarship</div>
        <div className="mt-1 text-[22px] font-bold tracking-[-0.01em] text-[#0b1f12]">{snapshot.scholarship.enrollmentLabel}</div>
        <div className={`mt-2 inline-flex items-center gap-1.5 text-xs font-bold ${scholarshipBadge.tone === "ok" ? "text-[#1e8a4c]" : "text-[#c77a12]"}`}>
          <span className={`size-2 rounded-full ${scholarshipBadge.tone === "ok" ? "bg-[#1e8a4c]" : "bg-[#c77a12]"}`} />
          {scholarshipBadge.text}
        </div>
      </div>

      <div className="rounded-[14px] border border-[#d7e2d4] bg-white p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#5c6b5e]">Latin honors</div>
        <div className="mt-1 text-[22px] font-bold tracking-[-0.01em] text-[#0b1f12]">
          {honorsLabel}
          {snapshot.honors.cumLaude.eligible ? <small className="ml-1 text-[13px] font-medium text-[#5c6b5e]">now</small> : null}
        </div>
        <div className={`mt-2 inline-flex items-center gap-1.5 text-xs font-bold ${honorsBadge.tone === "ok" ? "text-[#1e8a4c]" : "text-[#c77a12]"}`}>
          <span className={`size-2 rounded-full ${honorsBadge.tone === "ok" ? "bg-[#1e8a4c]" : "bg-[#c77a12]"}`} />
          {honorsBadge.text}
        </div>
      </div>
    </div>
  );
}
