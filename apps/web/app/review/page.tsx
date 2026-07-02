"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
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
import { AppFooter } from "../../components/app-footer";
import { PageIntro } from "../../components/page-intro";
import { SectionCard } from "../../components/section-card";
import { SiteTopbar } from "../../components/site-topbar";
import { Button } from "../../components/ui/button";
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
    return <main className="app-shell app-shell--workflow grid min-h-screen place-items-center text-ink">Loading grades...</main>;
  }

  return (
    <div className="app-shell app-shell--workflow">
      <SiteTopbar variant="fixed" />

      <main className="app-container--wide">
        <PageIntro
          description="Tap a term, fix anything that looks off, then confirm when you're ready."
          eyebrow="Step 3"
          title="Review your grades"
        />

        <form className="grid gap-5" onSubmit={form.handleSubmit(confirm)}>
          <SectionCard
            description={
              terms.length > 0 ? `${terms.length} term${terms.length === 1 ? "" : "s"} · ${fields.length} courses` : "No grades loaded yet"
            }
            step={3}
            title="Grades by term"
          >
              {terms.length > 0 ? (
                <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Uploaded terms">
                  {terms.map((term) => (
                    <button
                      aria-selected={term === activeTerm}
                      className={term === activeTerm ? "chip chip--active" : "chip"}
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
                <div className="rounded-lg border border-dashed border-[rgba(11,31,18,0.14)] bg-[#fafafa] p-8 text-center text-muted">
                  No grades loaded yet.{" "}
                  <Link className="font-bold text-accent underline" href="/upload">
                    Upload screenshots first
                  </Link>
                  .
                </div>
              ) : (
                <div className="review-table-wrap overflow-x-auto">
                  <table className="review-table">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Title</th>
                        <th className="text-center">Units</th>
                        <th className="text-center">Midterm</th>
                        <th className="text-center">Final</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map(({ field, index }) => (
                        <tr key={field.id}>
                          <td>
                            <input className="form-input w-28 border-transparent bg-transparent px-2 py-2 font-mono text-[12.5px] font-bold text-accent-dark hover:border-line focus:bg-elevated" {...form.register(`courses.${index}.code`)} />
                          </td>
                          <td>
                            <input className="form-input w-full min-w-64 border-transparent bg-transparent px-2 py-2 text-ink hover:border-line focus:bg-elevated" {...form.register(`courses.${index}.title`)} />
                          </td>
                          <td className="text-center">
                            <input className="form-input mx-auto w-20 px-2 py-2 text-center font-mono" type="number" step="0.5" {...form.register(`courses.${index}.units`)} />
                          </td>
                          <td className="text-center">
                            <input className="form-input mx-auto w-24 px-2 py-2 text-center font-mono font-bold text-success" type="number" step="0.25" {...form.register(`courses.${index}.midterm`)} />
                          </td>
                          <td className="text-center">
                            <input className="form-input mx-auto w-24 px-2 py-2 text-center font-mono font-bold text-muted" type="number" step="0.25" {...form.register(`courses.${index}.final`)} />
                          </td>
                          <td>
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
          </SectionCard>

          <ScholarshipTierPicker error={scholarshipError} onChange={handleScholarshipChange} value={scholarship} />

          <Button className="workflow-submit" disabled={fields.length === 0} type="submit">
            <Save aria-hidden="true" size={18} />
            Confirm extraction
          </Button>
        </form>
      </main>

      <AppFooter />
    </div>
  );
}

function statusClass(status: string) {
  const base = "rounded-pill border px-3 py-2 text-[10.5px] font-bold uppercase tracking-[0.03em]";

  if (status === "completed") {
    return `${base} border-success/30 bg-success-light text-success`;
  }

  if (status === "in_progress") {
    return `${base} border-accent/20 bg-accent-light text-accent-dark`;
  }

  return `${base} border-line bg-canvas text-muted`;
}
