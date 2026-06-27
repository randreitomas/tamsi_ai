"use client";

import { buildAdvisorMetrics, computeAcademicSnapshot, type AcademicSnapshot } from "@tamsi/academic-engine";
import { reviewCourseSchema, type ReviewCourse } from "@tamsi/types";
import { ArrowLeft, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { AdvicePanel } from "../../components/dashboard/advice-panel";
import { GwaChart } from "../../components/dashboard/gwa-chart";
import { StandingGauge } from "../../components/dashboard/standing-gauge";
import { StatusCards } from "../../components/dashboard/status-cards";
import { StartOverButton } from "../../components/start-over-button";
import { Card } from "../../components/ui/card";
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
    return <main className="grid min-h-screen place-items-center bg-[#ecf2ea] text-[#0b1f12]">Computing metrics...</main>;
  }

  if (!snapshot) {
    return (
      <main className="min-h-screen bg-[#ecf2ea] px-6 py-10 text-[#0b1f12]">
        <div className="mx-auto max-w-[720px] text-center">
          <BarChart3 aria-hidden="true" className="mx-auto mb-4 text-[#0e6b2e]" size={40} />
          <h1 className="text-3xl font-extrabold tracking-[-0.02em]">No confirmed grades yet</h1>
          <p className="mt-3 text-[#5c6b5e]">Upload screenshots and confirm your extraction before opening the dashboard.</p>
          <Link className="mt-6 inline-flex rounded-xl bg-[#0e6b2e] px-5 py-3 text-sm font-bold text-white" href="/upload">
            Go to upload
          </Link>
        </div>
      </main>
    );
  }

  const snapshotOptions = preferencesToSnapshotOptions(preferences);
  const advisorMetrics = buildAdvisorMetrics(snapshot, snapshotOptions);
  const fingerprint = fingerprintCourses(courses, preferences);

  return (
    <main className="min-h-screen bg-[#ecf2ea] px-6 py-10 text-[#0b1f12]">
      <div className="mx-auto max-w-[1080px]">
        <header className="mb-9 flex items-center justify-between gap-4">
          <Link className="inline-flex items-center gap-2 text-sm font-bold text-[#0a4d21]" href="/review">
            <ArrowLeft aria-hidden="true" size={17} />
            Review
          </Link>
          <StartOverButton />
        </header>

        <section className="mb-8 text-center">
          <div className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#0e6b2e]">Steps 4 & 5</div>
          <h1 className="mx-auto max-w-[18ch] text-[clamp(32px,5vw,48px)] font-extrabold leading-[1.04] tracking-[-0.02em]">
            Your standing — computed and explained.
          </h1>
          <p className="mx-auto mt-4 max-w-[58ch] text-lg leading-8 text-[#33483a]">
            Tamsi calculated your GWA, scholarship position, and Latin honors using FEU Tech thresholds. Grades stay in this tab only — nothing is saved on our servers.
          </p>
        </section>

        <div className="grid gap-[18px]">
          <Card>
            <div className="flex items-center gap-3.5 border-b border-[#d7e2d4] bg-gradient-to-b from-[#fcfefb] to-[#f6faf4] px-5 py-[18px]">
              <span className="grid size-[30px] shrink-0 place-items-center rounded-[9px] bg-[#0e6b2e] font-mono text-[13px] font-bold text-white">4</span>
              <div>
                <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Compute — your GWA across terms</h2>
                <p className="text-[12.5px] text-[#5c6b5e]">Every term weighted and charted, so you see the trend, not just the number.</p>
              </div>
            </div>
            <div className="p-[22px]">
              <GwaChart
                cumulativeGwa={snapshot.cumulativeGwa}
                terms={snapshot.terms}
                totalCompletedUnits={snapshot.totalCompletedUnits}
              />
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3.5 border-b border-[#d7e2d4] bg-gradient-to-b from-[#fcfefb] to-[#f6faf4] px-5 py-[18px]">
              <span className="grid size-[30px] shrink-0 place-items-center rounded-[9px] bg-[#0e6b2e] font-mono text-[13px] font-bold text-white">5</span>
              <div>
                <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Your standing & your plan</h2>
                <p className="text-[12.5px] text-[#5c6b5e]">Where you are now, and what each goal needs this term.</p>
              </div>
            </div>
            <div className="p-[22px]">
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
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
