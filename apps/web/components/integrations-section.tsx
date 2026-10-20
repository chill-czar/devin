const integrations = [
  "GitHub",
  "Linear",
  "Slack",
  "Datadog",
  "AWS",
  "Stripe",
  "Notion",
  "Confluence",
  "Sentry",
  "PostgreSQL",
  "MongoDB",
  "Snowflake",
  "Azure",
  "Databricks",
  "Airtable",
  "Asana",
  "Segment",
  "Google Drive",
];

const highlights = [
  {
    name: "GitHub",
    description:
      "Devin ships PRs the way your team does — picking up review feedback and CI results to get each PR approved and merged.",
  },
  {
    name: "Linear",
    description:
      "Assign Devin tickets directly in Linear, or add a Devin label.",
  },
  {
    name: "Slack and Teams",
    description:
      "Tag Devin in any conversation to surface relevant context, dig into issues, or turn discussions directly into PRs.",
  },
];

export function IntegrationsSection() {
  return (
    <section className="border-border bg-secondary/30 overflow-hidden border-t py-24 sm:py-32">
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-heading text-foreground text-4xl font-semibold tracking-tight sm:text-5xl">
            Able to work with hundreds of tools
          </h2>
        </div>

        <div className="relative mt-14">
          <div className="animate-marquee flex gap-5 whitespace-nowrap">
            {[...integrations, ...integrations].map((tool, i) => (
              <span
                key={`${tool}-${i}`}
                className="border-border bg-card text-muted-foreground inline-flex shrink-0 items-center rounded-none border px-4 py-2 text-sm font-medium shadow-xs"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-20 grid gap-7 sm:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.name}
              className="border-border bg-card rounded-none border p-8 shadow-xs"
            >
              <h3 className="font-heading text-card-foreground text-lg font-semibold">
                {item.name}
              </h3>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
