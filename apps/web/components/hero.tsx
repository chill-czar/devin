import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function Hero() {
  return (
    <section className="bg-background text-foreground relative overflow-hidden">
      <div className="mx-auto max-w-[90rem] px-4 pt-16 pb-20 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
        <div className="flex flex-col items-center text-center">
          <Link
            href="#"
            className="hero-capsule border-border bg-card text-card-foreground hover:bg-muted mb-10 inline-flex items-center gap-2.5 rounded-none border px-4 py-2 text-sm font-medium shadow-xs transition-colors"
          >
            <span className="bg-primary text-primary-foreground rounded-none px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase">
              New
            </span>
            <span>Windsurf is now Devin Desktop</span>
            <ArrowUpRight className="text-muted-foreground size-4" />
          </Link>

          <h1 className="font-heading text-foreground max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-[72px] lg:leading-[1.08]">
            <span className="block">Devin, the AI</span>
            <span className="text-primary block">software engineer</span>
          </h1>
        </div>

        <div className="relative -mx-4 mt-14 sm:-mx-6 sm:mt-16 lg:-mx-10 lg:mt-20">
          <div className="border-border bg-card overflow-hidden rounded-none border shadow-md">
            <Image
              src="/hero_new.webp"
              alt="Devin dashboard showing sessions, activity feed, and test report"
              width={2400}
              height={1400}
              priority
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
