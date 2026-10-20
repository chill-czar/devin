import Link from "next/link";
import {
  ArrowRightLeft,
  Bug,
  CalendarClock,
  FileText,
  GitPullRequest,
  MoreHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface UseCase {
  icon: LucideIcon;
  title: string;
  bullets: string[];
  link?: { label: string; href: string };
}

const useCases: UseCase[] = [
  {
    icon: GitPullRequest,
    title: "PR review & visual QA",
    bullets: [
      "Automatically identify and resolve bugs",
      "Visual QA with full browser and desktop use",
      "Intelligently organize code diffs for review",
    ],
    link: { label: "Learn about Devin Review", href: "#" },
  },
  {
    icon: FileText,
    title: "Documentation",
    bullets: [
      "Auto-generate documentation and system diagrams for legacy codebases",
      "Comprehensive visibility into systems your team hasn't built",
    ],
    link: { label: "Learn more about DeepWiki", href: "#" },
  },
  {
    icon: ArrowRightLeft,
    title: "Code migration + refactors",
    bullets: [
      "Assign a fleet of agents to migrate all repos in parallel",
      "Accelerate modernizations — COBOL, .NET, Talend, legacy ETL, and more",
      "Complete audibility at each step",
    ],
  },
  {
    icon: CalendarClock,
    title: "Scheduled chores and application development",
    bullets: [
      "Schedule daily QA and release notes",
      "Continuously review and address user feedback",
      "Maintain documentation",
    ],
  },
  {
    icon: Bug,
    title: "Issue triage + bug fixing",
    bullets: [
      "Investigate Datadog incidents immediately",
      "Intelligently route Slack bug reports",
      "Automatically fix CI failures",
    ],
  },
  {
    icon: MoreHorizontal,
    title: "And many others",
    bullets: [
      "Automated ticket resolution",
      "Unit and E2E testing",
      "Performance optimization",
      "Web research and scraping",
      "Repetitive browser task automation",
    ],
  },
];

export function UseCasesSection() {
  return (
    <section className="bg-secondary/40 py-24 sm:py-32">
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="font-heading text-foreground text-4xl font-semibold tracking-tight sm:text-5xl">
            Use cases
          </h2>
          <p className="text-muted-foreground mt-5 text-lg leading-relaxed">
            Use Devin to plan and execute complex engineering tasks, from code
            migrations to on-call incident resolution.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((useCase) => (
            <div
              key={useCase.title}
              className="border-border bg-card hover:border-primary/50 flex flex-col rounded-none border p-8 shadow-xs transition-colors"
            >
              <div className="bg-primary/10 text-primary border-primary/25 flex size-11 items-center justify-center rounded-none border">
                <useCase.icon className="size-5" />
              </div>
              <h3 className="font-heading text-card-foreground mt-5 text-lg font-semibold">
                {useCase.title}
              </h3>
              <ul className="mt-4 flex-1 space-y-2.5">
                {useCase.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="text-muted-foreground flex gap-2.5 text-sm leading-relaxed"
                  >
                    <span className="bg-primary/60 mt-2 size-1.5 shrink-0 rounded-full" />
                    {bullet}
                  </li>
                ))}
              </ul>
              {useCase.link && (
                <Link
                  href={useCase.link.href}
                  className="text-primary mt-5 text-sm font-medium transition-colors hover:underline"
                >
                  {useCase.link.label} →
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
