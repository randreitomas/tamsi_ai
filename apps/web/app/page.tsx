import { BarChart3, Bot, CheckCircle2, FileCheck2, PencilLine, ShieldCheck, UploadCloud } from "lucide-react";
import { ConnectChatGptButton } from "../components/connect-chatgpt-button";
import { Card } from "../components/ui/card";

const pills = ["4.0 high · 0.5 fail", "Reads SOLAR screenshots", "Review before saving", "Session-only — no server storage"];

const processItems = [
  {
    step: 1,
    title: "Connect ChatGPT",
    body: "Sign in with your ChatGPT account so Tamsi can read screenshots and explain your standing.",
    icon: Bot
  },
  {
    step: 2,
    title: "Upload grades",
    body: "Drop your SOLAR Grade Report screenshots — one term per capture works best.",
    icon: UploadCloud
  },
  {
    step: 3,
    title: "Review & confirm",
    body: "Fix any misread courses, pick your scholarship, then confirm the records.",
    icon: PencilLine
  },
  {
    step: 4,
    title: "Your standing & plan",
    body: "Tamsi computes your GWA, charts it term by term, checks scholarship and Latin honors, then explains what your numbers mean.",
    icon: BarChart3
  }
];

const previewRows = [
  ["CCS0001", "INTRODUCTION TO COMPUTING (LEC)", "2", "3.5", "4.0"],
  ["GED0009", "READINGS IN PHILIPPINE HISTORY", "3", "3.5", "4.0"],
  ["CS0001", "DISCRETE STRUCTURES 1", "3", "3.0", "3.5"]
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#ecf2ea] text-[#0b1f12]">
      <div className="mx-auto w-full max-w-[1080px] px-6">
        <header className="py-12 text-center">
          <div className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#0e6b2e]">
            From your grades to a plan, in one upload
          </div>
          <h1 className="mx-auto max-w-[18ch] text-[clamp(34px,6vw,58px)] font-extrabold leading-[1.02] tracking-[-0.02em]">
            Know exactly where you stand and <span className="text-[#0e6b2e]">what it takes</span> to stay there.
          </h1>
          <p className="mx-auto mt-5 max-w-[56ch] text-lg leading-8 text-[#33483a]">
            Tamsi reads your SOLAR Grade Report, drafts the academic record table, and keeps every calculation in deterministic code.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {pills.map((pill) => (
              <span className="rounded-full border border-[#d7e2d4] bg-white px-4 py-2 text-[12.5px] font-semibold text-[#0a4d21]" key={pill}>
                {pill === "4.0 high · 0.5 fail" ? (
                  <>
                    Scale <b className="text-[#f5b800]">4.0 high · 0.5 fail</b>
                  </>
                ) : pill === "Session-only — no server storage" ? (
                  <>
                    <b className="text-[#f5b800]">Session-only</b>
                    {" — nothing saved on our servers"}
                  </>
                ) : (
                  pill
                )}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ConnectChatGptButton
              className="h-12"
              connectedHref="/upload"
              connectedLabel="Continue to upload"
              label="Get started"
              variant="primary"
            />
          </div>
        </header>

        <section className="grid gap-[18px] pb-12">
          <Card>
            <div className="border-b border-[#d7e2d4] bg-gradient-to-b from-[#fcfefb] to-[#f6faf4] px-5 py-[18px] text-center">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#0e6b2e]">How it works</p>
              <h2 className="mt-2 text-[24px] font-extrabold tracking-[-0.02em]">Four steps from screenshot to a plan</h2>
              <p className="mx-auto mt-2 max-w-[58ch] text-sm leading-6 text-[#5c6b5e]">
                Connect once, upload your grades, confirm what Tamsi read, then get your standing and advice.
              </p>
            </div>
            <div className="grid gap-4 p-[22px] sm:grid-cols-2 lg:grid-cols-4">
              {processItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div className="rounded-2xl border border-[#d7e2d4] bg-[#fbfdfa] p-5" key={item.step}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="grid size-[42px] place-items-center rounded-[12px] bg-[#e2efdd] text-[#0e6b2e]">
                        <Icon aria-hidden="true" size={22} />
                      </div>
                      <span className="rounded-lg bg-[#0e6b2e] px-2.5 py-1 font-mono text-[12px] font-bold text-white">Step {item.step}</span>
                    </div>
                    <h3 className="text-[16px] font-bold tracking-[-0.01em]">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#5c6b5e]">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="grid gap-6 p-[22px] lg:grid-cols-[1fr_1.2fr] lg:items-center">
              <div className="min-w-0">
                <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-[#e2efdd] px-3 py-1.5 font-mono text-[12.5px] font-bold text-[#0a4d21]">
                  <CheckCircle2 aria-hidden="true" size={15} />
                  Review-first workflow
                </div>
                <h2 className="text-[24px] font-extrabold tracking-[-0.02em]">Nothing is final until the student confirms it.</h2>
                <p className="mt-3 text-sm leading-6 text-[#5c6b5e]">
                  Tamsi separates interpretation from computation: AI reads the image, you approve the records, then deterministic services handle academic metrics.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <ConnectChatGptButton
                    connectedHref="/upload"
                    connectedLabel="Continue to upload"
                    label="Connect ChatGPT"
                    variant="primary"
                  />
                </div>
              </div>
              <div className="min-w-0">
                <PreviewTable />
                <p className="mt-4 flex items-start gap-2 text-[12.5px] text-[#5c6b5e]">
                  <PencilLine aria-hidden="true" className="mt-0.5 shrink-0 text-[#0e6b2e]" size={15} />
                  The table shown here is a preview of the review step, not an inline upload form.
                </p>
              </div>
            </div>
          </Card>

          <div className="grid gap-[18px] md:grid-cols-3">
            <MiniCard icon={<Bot size={22} />} title="ChatGPT OAuth" text="Students connect their own ChatGPT account for AI extraction." />
            <MiniCard icon={<FileCheck2 size={22} />} title="JSON first" text="Vision output is validated against Tamsi schemas before review." />
            <MiniCard icon={<ShieldCheck size={22} />} title="Session-only" text="Grades live in this browser tab until you close it. Tamsi does not store academic records." />
          </div>
        </section>

        <footer className="border-t border-[#d7e2d4] py-8 text-center">
          <b className="text-3xl font-extrabold tracking-[-0.02em] text-[#0a4d21]">Tamsi</b>
          <p className="mt-3 text-xs font-medium text-[#5c6b5e]">Developed by Ralph Andrei Masangkay</p>
        </footer>
      </div>
    </main>
  );
}

function PreviewTable() {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {previewRows.map(([code, title, units, midterm, finalGrade]) => (
          <div className="rounded-2xl border border-[#d7e2d4] bg-[#fbfdfa] p-4" key={code}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-mono text-[12.5px] font-bold text-[#0a4d21]">{code}</div>
                <div className="mt-1 text-[13px] leading-5 text-[#0b1f12]">{title}</div>
              </div>
              <span className="shrink-0 font-mono text-xs font-semibold text-[#5c6b5e]">{units} u</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#eef3ec] pt-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#5c6b5e]">Midterm</div>
                <div className={`mt-0.5 font-mono text-sm font-bold ${gradeClass(midterm)}`}>{midterm}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#5c6b5e]">Final</div>
                <div className={`mt-0.5 font-mono text-sm font-bold ${gradeClass(finalGrade)}`}>{finalGrade}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="-mx-1 hidden overflow-x-auto px-1 md:block">
        <table className="w-full min-w-[520px] border-collapse text-[13.5px]">
          <thead>
            <tr className="border-b border-[#d7e2d4] text-left text-[11px] uppercase tracking-[0.06em] text-[#5c6b5e]">
              <th className="px-2.5 pb-2.5 font-semibold">Course</th>
              <th className="px-2.5 pb-2.5 font-semibold">Title</th>
              <th className="px-2.5 pb-2.5 text-center font-semibold">Units</th>
              <th className="px-2.5 pb-2.5 text-center font-semibold">Midterm</th>
              <th className="px-2.5 pb-2.5 text-center font-semibold">Final</th>
            </tr>
          </thead>
          <tbody>
            {previewRows.map(([code, title, units, midterm, finalGrade]) => (
              <tr className="border-b border-[#eef3ec] last:border-0" key={code}>
                <td className="px-2.5 py-3 font-mono text-[12.5px] font-bold text-[#0a4d21]">{code}</td>
                <td className="px-2.5 py-3">{title}</td>
                <td className="px-2.5 py-3 text-center font-mono">{units}</td>
                <td className={`px-2.5 py-3 text-center font-mono font-bold ${gradeClass(midterm)}`}>{midterm}</td>
                <td className={`px-2.5 py-3 text-center font-mono font-bold ${gradeClass(finalGrade)}`}>{finalGrade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function gradeClass(value: string | undefined) {
  const numeric = Number(value ?? 0);
  if (numeric >= 3.4) {
    return "text-[#1e8a4c]";
  }

  if (numeric >= 3.0) {
    return "text-[#0a4d21]";
  }

  return "text-[#c77a12]";
}

function MiniCard({ icon, text, title }: { icon: React.ReactNode; text: string; title: string }) {
  return (
    <Card className="p-5">
      <div className="text-[#0e6b2e]">{icon}</div>
      <h2 className="mt-4 text-lg font-bold tracking-[-0.01em]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#5c6b5e]">{text}</p>
    </Card>
  );
}
