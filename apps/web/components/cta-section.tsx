import Link from "next/link";
import { cn } from "@/lib/utils";

export function CtaSection() {
  return (
    <section className="bg-background text-foreground py-24 sm:py-32">
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
        <div className="border-border bg-card relative overflow-hidden rounded-none border px-8 py-20 text-center shadow-md sm:px-16 sm:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.553_0.195_38.402_/_15%),transparent_65%)]" />
          <div className="relative">
            <h2 className="font-heading text-foreground text-4xl font-semibold tracking-tight sm:text-5xl">
              Ready to ship faster with Devin?
            </h2>
            <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-lg leading-relaxed">
              Join engineering teams using Devin to plan, code, review, and ship
              — from migrations to on-call incident resolution.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/login"
                className={cn(
                  "bg-primary text-primary-foreground rounded-none px-6 py-3 text-base font-medium shadow-xs",
                  "hover:bg-primary/90 transition-colors",
                )}
              >
                Try Devin
              </Link>
              <Link
                href="#"
                className={cn(
                  "border-border bg-background text-foreground rounded-none border px-6 py-3 text-base font-medium shadow-xs",
                  "hover:bg-muted transition-colors",
                )}
              >
                Contact sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
