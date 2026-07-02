import { AppFooter } from "../components/app-footer";
import { ConnectChatGptButton } from "../components/connect-chatgpt-button";
import { LandingPreviewTable } from "../components/landing-preview-table";

const processItems = [
  {
    step: 1,
    title: "Connect ChatGPT",
    body: "Sign in with your ChatGPT account so Tamsi can read screenshots and explain your standing."
  },
  {
    step: 2,
    title: "Upload grades",
    body: "Drop your SOLAR Grade Report screenshots — one term per capture works best."
  },
  {
    step: 3,
    title: "Review & confirm",
    body: "Fix any misread courses, pick your scholarship, then confirm the records."
  },
  {
    step: 4,
    title: "Your standing & plan",
    body: "Tamsi computes your GWA, charts it term by term, checks scholarship and Latin honors, then explains what your numbers mean."
  }
];

export default function Home() {
  return (
    <div className="hero-page">
      <main className="overflow-x-hidden">
        <section className="hero-content">
          <h1 className="hero-headline text-ink">
            Know your standing. <span className="headline-gradient">Act on it.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-[480px] text-[18px] leading-7 text-muted">
            Upload your SOLAR screenshot. Confirm what Tamsi reads. Get your GWA and next steps — calculated in code, not guesswork.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ConnectChatGptButton
              className="h-12 px-7"
              connectedHref="/upload"
              connectedLabel="Continue to upload"
              label="Get started"
              variant="primary"
            />
          </div>

          <div className="preview-window mx-auto mt-12 max-w-[640px] text-left">
            <div className="preview-window-bar">
              <span className="preview-dot bg-[#ff5f57]" />
              <span className="preview-dot bg-[#febc2e]" />
              <span className="preview-dot bg-[#28c840]" />
            </div>
            <div className="p-5">
              <LandingPreviewTable />
            </div>
          </div>
        </section>

        <section className="landing-how-it-works">
          <h2 className="landing-section-title">How it works</h2>
          <div className="landing-steps-grid">
            {processItems.map((item) => (
              <div className="landing-step-card" key={item.step}>
                <span className="landing-step-number">{String(item.step).padStart(2, "0")}</span>
                <h3 className="landing-step-title">{item.title}</h3>
                <p className="landing-step-body">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-cta">
          <h2 className="landing-cta-title">Ready to see where you stand?</h2>
          <p className="landing-cta-body">
            Connect ChatGPT, upload your SOLAR screenshots, and get your standing in minutes.
          </p>
          <ConnectChatGptButton
            className="btn-cta-inverse"
            connectedHref="/upload"
            connectedLabel="Continue to upload"
            label="Get started"
            variant="primary"
          />
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
