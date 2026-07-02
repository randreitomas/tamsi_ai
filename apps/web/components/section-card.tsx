import type { ReactNode } from "react";

type SectionCardProps = {
  bodyClassName?: string;
  children: ReactNode;
  description?: string;
  step?: number | string;
  title: string;
};

export function SectionCard({ bodyClassName = "workflow-card-body", children, description, step, title }: SectionCardProps) {
  return (
    <section className="workflow-card">
      <div className="workflow-card-header">
        {step !== undefined ? (
          <span className="workflow-card-step">{String(step).padStart(2, "0")}</span>
        ) : null}
        <div className="min-w-0">
          <h2 className="workflow-card-title">{title}</h2>
          {description ? <p className="workflow-card-desc">{description}</p> : null}
        </div>
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
