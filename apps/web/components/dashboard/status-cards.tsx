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
      <div className="workflow-metric-card">
        <div className="workflow-metric-label">Scholarship</div>
        <div className="workflow-metric-value">{snapshot.scholarship.enrollmentLabel}</div>
        <div className={`mt-2 inline-flex items-center gap-1.5 text-xs font-bold ${scholarshipBadge.tone === "ok" ? "text-success" : "text-warning"}`}>
          <span className={`size-2 rounded-full ${scholarshipBadge.tone === "ok" ? "bg-success" : "bg-warning"}`} />
          {scholarshipBadge.text}
        </div>
      </div>

      <div className="workflow-metric-card">
        <div className="workflow-metric-label">Latin honors</div>
        <div className="workflow-metric-value">
          {honorsLabel}
          {snapshot.honors.cumLaude.eligible ? <small className="ml-1 text-[13px] font-medium text-muted">now</small> : null}
        </div>
        <div className={`mt-2 inline-flex items-center gap-1.5 text-xs font-bold ${honorsBadge.tone === "ok" ? "text-success" : "text-warning"}`}>
          <span className={`size-2 rounded-full ${honorsBadge.tone === "ok" ? "bg-success" : "bg-warning"}`} />
          {honorsBadge.text}
        </div>
      </div>
    </div>
  );
}
