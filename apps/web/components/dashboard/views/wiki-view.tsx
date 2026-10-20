"use client";

import { useState } from "react";
import { RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { GithubIcon } from "@/components/dashboard/github-icon";
import { MotionButton } from "@/components/dashboard/motion-button";

const repositories = [
  "advanced-typescript",
  "airbnb-shadcn-nextjs-template",
  "argocd-deployment",
  "better-auth",
  "devin",
  "drizzle-orm",
  "nextjs-boilerplate",
  "turbo",
];

export function WikiView() {
  const [search, setSearch] = useState("");

  const filtered = repositories.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex w-full max-w-[900px] flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-foreground font-heading text-[22px] font-semibold">
          DeepWiki
        </h1>
        <div className="flex items-center gap-2">
          <MotionButton
            type="button"
            pressStyle="icon"
            className="text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer rounded-none p-1.5 transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className="size-4" />
          </MotionButton>
          <MotionButton
            type="button"
            pressStyle="icon"
            className="text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer rounded-none p-1.5 transition-colors"
            aria-label="Filter"
          >
            <SlidersHorizontal className="size-4" />
          </MotionButton>
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search repositories"
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring w-[220px] rounded-none border py-1.5 pr-3 pl-9 text-[13px] outline-none focus:ring-1"
            />
          </div>
        </div>
      </div>

      <p className="text-foreground font-heading mb-4 text-[13px] font-medium">
        Repositories
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filtered.map((name) => (
          <div
            key={name}
            className="border-border bg-card hover:border-primary/40 flex flex-col rounded-none border p-4 shadow-xs transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-foreground truncate text-[14px] font-semibold">
                  {name}
                </p>
                <p className="text-muted-foreground mt-0.5 text-[12px]">
                  chill-czar
                </p>
              </div>
              <GithubIcon className="text-muted-foreground size-4 shrink-0" />
            </div>
            <MotionButton
              type="button"
              pressStyle="primary"
              className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 w-fit cursor-pointer rounded-none px-3 py-1.5 text-[13px] font-medium shadow-xs transition-colors"
            >
              Generate
            </MotionButton>
          </div>
        ))}
      </div>
    </div>
  );
}
