export function AppFooter() {
  return (
    <footer className="app-footer">
      <p className="app-footer-line">
        Built with <strong className="app-footer-brand">Codex</strong>
        <span aria-hidden="true" className="app-footer-sep">
          {" "}
          ·{" "}
        </span>
        OAuth
        <span aria-hidden="true" className="app-footer-sep">
          {" "}
          ·{" "}
        </span>
        OpenAI
      </p>
      <p className="app-footer-line app-footer-line--secondary">
        Developed by Ralph Andrei Masangkay
        <span aria-hidden="true" className="app-footer-sep">
          {" "}
          ·{" "}
        </span>
        <a href="https://www.linkedin.com/in/randreitomas/" rel="noreferrer" target="_blank">
          LinkedIn
        </a>
        <span aria-hidden="true" className="app-footer-sep">
          {" "}
          ·{" "}
        </span>
        <a href="https://github.com/randreitomas" rel="noreferrer" target="_blank">
          GitHub
        </a>
      </p>
    </footer>
  );
}
