"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { solarExtractionSchema } from "@tamsi/types";
import {
  parseMaintainingGrade,
  pickerValueFromPreferences,
  ScholarshipTierPicker,
  type ScholarshipPickerValue
} from "../../components/scholarship-tier-picker";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import {
  clearMetricsCache,
  readSessionJSON,
  readPreferences,
  TAMSI_STORAGE_KEYS,
  writeConfirmedCourses,
  writePreferences,
  type TamsiPreferences
} from "../../lib/tamsi-storage";

const reviewSchema = z.object({
  courses: z.array(
    z.object({
      id: z.string(),
      code: z.string().min(1),
      title: z.string().min(1),
      units: z.coerce.number().positive(),
      midterm: z.union([z.coerce.number().min(0).max(5), z.literal("").transform(() => null), z.null()]),
      final: z.union([z.coerce.number().min(0).max(5), z.literal("").transform(() => null), z.null()]),
      status: z.enum(["completed", "in_progress", "dropped", "credited"]),
      term: z.string().min(1)
    })
  )
});

type ReviewForm = z.infer<typeof reviewSchema>;

function pickerToPreferences(value: ScholarshipPickerValue): TamsiPreferences {
  return {
    scholarshipEnrollment: value.enrollment,
    customScholarshipName: value.customName.trim(),
    customMaintainingGrade: parseMaintainingGrade(value.customMaintainingGrade)
  };
}

export default function ReviewPage() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [scholarship, setScholarship] = useState<ScholarshipPickerValue>(() =>
    pickerValueFromPreferences(readPreferences())
  );
  const [scholarshipError, setScholarshipError] = useState<string | null>(null);
  const form = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { courses: [] }
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "courses"
  });

  useEffect(() => {
    setScholarship(pickerValueFromPreferences(readPreferences()));

    const stored = readSessionJSON<{ terms: unknown }>(TAMSI_STORAGE_KEYS.lastExtraction);
    if (!stored) {
      setLoaded(true);
      return;
    }

    const parsed = solarExtractionSchema.safeParse(stored);
    if (!parsed.success) {
      setLoaded(true);
      return;
    }

    form.reset({
      courses: parsed.data.terms.flatMap((term, termIndex) =>
        term.courses.map((course, courseIndex) => ({
          ...course,
          id: `${term.term}-${termIndex}-${course.code}-${courseIndex}`,
          term: term.term
        }))
      )
    });
    setSelectedTerm(parsed.data.terms.at(-1)?.term ?? null);
    setLoaded(true);
  }, [form]);

  const terms = useMemo(() => Array.from(new Set(fields.map((field) => field.term))), [fields]);
  const activeTerm = selectedTerm ?? terms.at(0) ?? null;
  const visibleRows = useMemo(
    () =>
      fields
        .map((field, index) => ({ field, index }))
        .filter(({ field }) => field.term === activeTerm),
    [activeTerm, fields]
  );

  function handleScholarshipChange(value: ScholarshipPickerValue) {
    setScholarship(value);
    setScholarshipError(null);
    writePreferences(pickerToPreferences(value));
  }

  function confirm(values: ReviewForm) {
    if (scholarship.enrollment === "others") {
      const name = scholarship.customName.trim();
      const grade = parseMaintainingGrade(scholarship.customMaintainingGrade);

      if (!name) {
        setScholarshipError("Enter your scholarship name.");
        return;
      }

      if (grade === null) {
        setScholarshipError("Enter a maintaining grade between 0.5 and 4.0.");
        return;
      }
    }

    const preferences = pickerToPreferences(scholarship);
    writePreferences(preferences);
    writeConfirmedCourses(values.courses);
    clearMetricsCache();
    router.push("/dashboard");
  }

  if (!loaded) {
    return <main className="grid min-h-screen place-items-center bg-[#ecf2ea] text-[#0b1f12]">Loading grades...</main>;
  }

  return (
    <main className="min-h-screen bg-[#ecf2ea] px-6 py-10 text-[#0b1f12]">
      <div className="mx-auto max-w-[1080px]">
        <header className="mb-9">
          <Link className="inline-flex items-center gap-2 text-sm font-bold text-[#0a4d21]" href="/upload">
            <ArrowLeft aria-hidden="true" size={17} />
            Upload
          </Link>
        </header>

        <section className="mb-8 text-center">
          <div className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#0e6b2e]">Step 3</div>
          <h1 className="mx-auto max-w-[20ch] text-[clamp(32px,5vw,48px)] font-extrabold leading-[1.04] tracking-[-0.02em]">
            Review your grades
          </h1>
          <p className="mx-auto mt-4 max-w-[52ch] text-lg leading-8 text-[#33483a]">
            Tap a term, fix anything that looks off, then confirm when you&apos;re ready.
          </p>
        </section>

        <form className="grid gap-5" onSubmit={form.handleSubmit(confirm)}>
          <Card>
            <div className="flex items-center gap-3.5 border-b border-[#d7e2d4] bg-gradient-to-b from-[#fcfefb] to-[#f6faf4] px-5 py-[18px]">
              <span className="grid size-[30px] shrink-0 place-items-center rounded-[9px] bg-[#0e6b2e] font-mono text-[13px] font-bold text-white">3</span>
              <div>
                <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Grades by term</h2>
                <p className="text-[12.5px] text-[#5c6b5e]">
                  {terms.length > 0 ? `${terms.length} term${terms.length === 1 ? "" : "s"} · ${fields.length} courses` : "No grades loaded yet"}
                </p>
              </div>
            </div>

            <div className="p-[22px]">
              {terms.length > 0 ? (
                <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Uploaded terms">
                  {terms.map((term) => (
                    <button
                      aria-selected={term === activeTerm}
                      className={
                        term === activeTerm
                          ? "rounded-[10px] border border-[#0e6b2e] bg-[#0e6b2e] px-3 py-2 text-center text-[12.5px] font-bold leading-tight text-white shadow-[0_4px_12px_rgba(14,107,46,.25)]"
                          : "rounded-[10px] border border-[#d7e2d4] bg-white px-3 py-2 text-center text-[12.5px] font-bold leading-tight text-[#5c6b5e] transition hover:border-[#b9cdb3] hover:text-[#0a4d21]"
                      }
                      key={term}
                      onClick={() => setSelectedTerm(term)}
                      role="tab"
                      type="button"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              ) : null}

              {fields.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#b9cdb3] bg-[#f6faf4] p-6 text-center text-[#5c6b5e]">
                  No grades loaded yet.{" "}
                  <Link className="font-bold text-[#0a4d21] underline" href="/upload">
                    Upload screenshots first
                  </Link>
                  .
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] border-collapse text-[13.5px]">
                    <thead>
                      <tr className="border-b border-[#d7e2d4] text-left text-[11px] uppercase tracking-[0.06em] text-[#5c6b5e]">
                        <th className="px-2.5 pb-2.5 font-semibold">Course</th>
                        <th className="px-2.5 pb-2.5 font-semibold">Title</th>
                        <th className="px-2.5 pb-2.5 text-center font-semibold">Units</th>
                        <th className="px-2.5 pb-2.5 text-center font-semibold">Midterm</th>
                        <th className="px-2.5 pb-2.5 text-center font-semibold">Final</th>
                        <th className="px-2.5 pb-2.5 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map(({ field, index }) => (
                        <tr className="border-b border-[#eef3ec] last:border-0" key={field.id}>
                          <td className="px-2.5 py-3">
                            <input className="w-28 rounded-lg border border-transparent bg-transparent px-2 py-2 font-mono text-[12.5px] font-bold text-[#0a4d21] hover:border-[#d7e2d4] focus:border-[#0e6b2e] focus:bg-white" {...form.register(`courses.${index}.code`)} />
                          </td>
                          <td className="px-2.5 py-3">
                            <input className="w-full min-w-64 rounded-lg border border-transparent bg-transparent px-2 py-2 text-[#0b1f12] hover:border-[#d7e2d4] focus:border-[#0e6b2e] focus:bg-white" {...form.register(`courses.${index}.title`)} />
                          </td>
                          <td className="px-2.5 py-3 text-center">
                            <input className="w-20 rounded-lg border border-[#d7e2d4] bg-white px-2 py-2 text-center font-mono" type="number" step="0.5" {...form.register(`courses.${index}.units`)} />
                          </td>
                          <td className="px-2.5 py-3 text-center">
                            <input className="w-24 rounded-lg border border-[#d7e2d4] bg-white px-2 py-2 text-center font-mono font-bold text-[#1e8a4c]" type="number" step="0.25" {...form.register(`courses.${index}.midterm`)} />
                          </td>
                          <td className="px-2.5 py-3 text-center">
                            <input className="w-24 rounded-lg border border-[#d7e2d4] bg-white px-2 py-2 text-center font-mono font-bold text-[#7a8aa0]" type="number" step="0.25" {...form.register(`courses.${index}.final`)} />
                          </td>
                          <td className="px-2.5 py-3">
                            <select className={statusClass(field.status)} {...form.register(`courses.${index}.status`)}>
                              <option value="completed">Completed</option>
                              <option value="in_progress">In progress</option>
                              <option value="dropped">Dropped</option>
                              <option value="credited">Credited</option>
                            </select>
                            <input type="hidden" {...form.register(`courses.${index}.term`)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>

          <ScholarshipTierPicker error={scholarshipError} onChange={handleScholarshipChange} value={scholarship} />

          <Button className="w-full sm:w-auto" disabled={fields.length === 0} type="submit">
            <Save aria-hidden="true" size={18} />
            Confirm extraction
          </Button>
        </form>
      </div>
    </main>
  );
}

function statusClass(status: string) {
  const base = "rounded-full border px-3 py-2 text-[10.5px] font-bold uppercase tracking-[0.03em]";

  if (status === "completed") {
    return `${base} border-[#c2e6cd] bg-[#e4f4e9] text-[#1e8a4c]`;
  }

  if (status === "in_progress") {
    return `${base} border-[#c3ddee] bg-[#e3eff7] text-[#1f5c8a]`;
  }

  return `${base} border-[#dbe1e9] bg-[#eef1f5] text-[#7a8aa0]`;
}
