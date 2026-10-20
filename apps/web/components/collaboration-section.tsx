import { BookOpen, GitBranch, Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  label: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: BookOpen,
    label: "Learns your codebase",
    title: "Learns your codebase & picks up tribal knowledge",
    description:
      "Devin builds institutional memory from your repos, docs, and past sessions so it gets smarter with every task.",
  },
  {
    icon: Workflow,
    label: "Collaborate",
    title: "Works where your team works",
    description:
      "Ask Devin to triage Datadog incidents, route Slack messages, and tackle Linear tickets. Or automate entirely using the Devin API.",
  },
  {
    icon: GitBranch,
    label: "Multi-repo",
    title: "Multi-week, multi-repo projects",
    description:
      "Devin can spin up a team of agents for large tasks. It gets better over time by reading past session trajectories.",
  },
];

export function CollaborationSection() {
  return (
    <section className="bg-background text-foreground py-24 sm:py-32">
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="font-heading text-foreground text-4xl font-semibold tracking-tight sm:text-5xl">
            Learn &amp; work together
          </h2>
          <p className="text-muted-foreground mt-5 text-lg leading-relaxed">
            Devin is built for engineering teams with complex, multi-repo
            projects.
          </p>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="group">
              <div className="border-border bg-secondary/40 overflow-hidden rounded-none border">
                <div className="flex h-56 flex-col justify-end p-6">
                  <div className="border-border bg-card rounded-none border p-5 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-none">
                        <feature.icon className="size-4" />
                      </div>
                      <span className="text-card-foreground text-sm font-medium">
                        {feature.label}
                      </span>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="bg-muted h-2.5 w-3/4 rounded-none" />
                      <div className="bg-muted h-2.5 w-1/2 rounded-none" />
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="font-heading text-foreground mt-6 text-lg font-semibold">
                {feature.title}
              </h3>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
