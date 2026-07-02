type PageIntroProps = {
  description: string;
  eyebrow: string;
  title: string;
};

export function PageIntro({ description, eyebrow, title }: PageIntroProps) {
  return (
    <section className="workflow-intro">
      <span className="chip chip--accent">{eyebrow}</span>
      <h1 className="workflow-intro-title">{title}</h1>
      <p className="workflow-intro-desc">{description}</p>
    </section>
  );
}
