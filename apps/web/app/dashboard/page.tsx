"use client";

import { buildAdvisorMetrics, computeAcademicSnapshot, type AcademicSnapshot } from "@tamsi/academic-engine";
import { reviewCourseSchema, type ReviewCourse } from "@tamsi/types";
import { BarChart3 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { AdvicePanel } from "../../components/dashboard/advice-panel";
import { GwaChart } from "../../components/dashboard/gwa-chart";
import { StandingGauge } from "../../components/dashboard/standing-gauge";
import { StatusCards } from "../../components/dashboard/status-cards";
import { AppFooter } from "../../components/app-footer";
import { PageIntro } from "../../components/page-intro";
import { SectionCard } from "../../components/section-card";
import { StartOverButton } from "../../components/start-over-button";
import { Button } from "../../components/ui/button";
import {
  fingerprintCourses,
  preferencesToSnapshotOptions,
  readConfirmedCourses,
  readMetricsCache,
  readPreferences,
  type TamsiPreferences,
  writeMetricsCache
} from "../../lib/tamsi-storage";

const confirmedCoursesSchema = z.array(reviewCourseSchema);

export default function DashboardPage() {
  const [snapshot, setSnapshot] = useState<AcademicSnapshot | null>(null);
  const [courses, setCourses] = useState<ReviewCourse[]>([]);
  const [preferences, setPreferences] = useState<TamsiPreferences>(() => readPreferences());
  const [loaded, setLoaded] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);
  const [chatGptConnected, setChatGptConnected] = useState(false);

  const fetchAdvice = useCallback(
    async (
      metrics: Record<string, string | number | boolean | null>,
      nextSnapshot: AcademicSnapshot,
      fingerprint: string,
      options?: { preferCache?: boolean }
    ) => {
      if (options?.preferCache) {
        const cache = readMetricsCache();
        if (cache?.fingerprint === fingerprint && cache.advice) {
          setAdvice(cache.advice);
          return;
        }
      }

      setAdviceLoading(true);
      setAdviceError(null);

      try {
        const statusResponse = await fetch("/api/advisor");
        const statusBody = (await statusResponse.json()) as { connected?: boolean };
        setChatGptConnected(Boolean(statusBody.connected));

        if (!statusBody.connected) {
          setAdvice(null);
          return;
        }

        const response = await fetch("/api/advisor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ computedMetrics: metrics })
        });

        const body = (await response.json()) as { advice?: string; error?: string };

        if (!response.ok) {
          throw new Error(body.error ?? "Could not generate advice.");
        }

        const nextAdvice = body.advice ?? null;
        setAdvice(nextAdvice);
        writeMetricsCache({
          fingerprint,
          snapshot: nextSnapshot,
          advice: nextAdvice,
          computedAt: new Date().toISOString()
        });
      } catch (error) {
        setAdviceError(error instanceof Error ? error.message : "Could not generate advice.");
      } finally {
        setAdviceLoading(false);
      }
    },
    []
  );

  const recompute = useCallback(
    (nextCourses: ReviewCourse[], nextPreferences: TamsiPreferences, options?: { preferCachedAdvice?: boolean }) => {
      const snapshotOptions = preferencesToSnapshotOptions(nextPreferences);
      const nextSnapshot = computeAcademicSnapshot(nextCourses, snapshotOptions);
      const fingerprint = fingerprintCourses(nextCourses, nextPreferences);
      const metrics = buildAdvisorMetrics(nextSnapshot, snapshotOptions);

      setSnapshot(nextSnapshot);
      setCourses(nextCourses);
      setPreferences(nextPreferences);

      if (options?.preferCachedAdvice) {
        const cache = readMetricsCache();
        if (cache?.fingerprint === fingerprint && cache.advice) {
          setAdvice(cache.advice);
          return;
        }
      }

      setAdvice(null);
      void fetchAdvice(metrics, nextSnapshot, fingerprint);
    },
    [fetchAdvice]
  );

  useEffect(() => {
    void fetch("/api/advisor")
      .then((response) => response.json())
      .then((body: { connected?: boolean }) => setChatGptConnected(Boolean(body.connected)))
      .catch(() => setChatGptConnected(false));
  }, []);

  useEffect(() => {
    const storedCourses = readConfirmedCourses();
    if (!storedCourses) {
      setLoaded(true);
      return;
    }

    const parsed = confirmedCoursesSchema.safeParse(storedCourses);
    if (!parsed.success) {
      setLoaded(true);
      return;
    }

    const savedPreferences = readPreferences();
    recompute(parsed.data, savedPreferences, { preferCachedAdvice: true });
    setLoaded(true);
  }, [recompute]);

  if (!loaded) {
    return <main className="app-shell grid min-h-screen place-items-center text-ink">Computing metrics...</main>;
  }

  if (!snapshot) {
    return (
      <div className="app-shell">
        <main className="app-container">
          <div className="workflow-empty-state">
            <div className="workflow-empty-icon">
              <BarChart3 aria-hidden="true" size={28} />
            </div>
            <h1 className="page-title text-ink">No confirmed grades yet</h1>
            <p className="mt-3 text-muted">Upload screenshots and confirm your extraction before opening the dashboard.</p>
            <Button className="mt-6" href="/upload">
              Go to upload
            </Button>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  const snapshotOptions = preferencesToSnapshotOptions(preferences);
  const advisorMetrics = buildAdvisorMetrics(snapshot, snapshotOptions);
  const fingerprint = fingerprintCourses(courses, preferences);

  return (
    <div className="app-shell">
      <main className="app-container--brief">
        <PageIntro
          description="Tamsi calculated your GWA, scholarship position, and Latin honors using FEU Tech thresholds. Grades stay in this tab only — nothing is saved on our servers."
          eyebrow="Step 4"
          title="Your standing — computed and explained."
        />

        <div className="mb-6 flex justify-center">
          <StartOverButton />
        </div>

        <div className="grid gap-5">
          <SectionCard
            description="Every term weighted and charted, so you see the trend, not just the number."
            step={4}
            title="Compute — your GWA across terms"
          >
            <GwaChart
              cumulativeGwa={snapshot.cumulativeGwa}
              terms={snapshot.terms}
              totalCompletedUnits={snapshot.totalCompletedUnits}
            />
          </SectionCard>

          <SectionCard
            description="Where you are now, and what each goal needs this term."
            step={5}
            title="Your standing & your plan"
          >
            <div className="grid gap-7 lg:grid-cols-[248px_1fr]">
              <StandingGauge
                academicYearLabel={snapshot.academicYearLabel}
                cumulativeGwa={snapshot.cumulativeGwa}
                totalCompletedUnits={snapshot.totalCompletedUnits}
              />
              <div>
                <StatusCards snapshot={snapshot} />
                <AdvicePanel
                  advice={advice}
                  connected={chatGptConnected}
                  error={adviceError}
                  loading={adviceLoading}
                  onRetry={() => fetchAdvice(advisorMetrics, snapshot, fingerprint)}
                />
              </div>
            </div>
          </SectionCard>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
