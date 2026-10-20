"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  Clock,
  GitPullRequest,
  RefreshCw,
  X,
} from "lucide-react";
import { MotionButton } from "@/components/dashboard/motion-button";
const waitingReviews = [
  {
    id: "1",
    title: "test: should fail the tests #2",
    meta: "9mo • chill-czar • chill-czar/testing-sprint",
    status: "failed" as const,
  },
  {
    id: "2",
    title: "test: should pass all tests #1",
    meta: "9mo • chill-czar • chill-czar/testing-sprint",
    status: "passed" as const,
  },
];

export function ReviewView() {
  const [prUrl, setPrUrl] = useState("");

  return (
    <div className="flex w-full max-w-[900px] flex-col">
      <div className="mb-6 flex items-center gap-3">
        <MotionButton
          type="button"
          className="border-border bg-card text-foreground hover:bg-muted flex cursor-pointer items-center gap-2 rounded-none border px-3 py-1.5 text-[13px] shadow-xs transition-colors"
        >
          <span className="bg-primary/15 text-primary border-primary/25 flex size-5 items-center justify-center rounded-full border text-[10px] font-bold">
            R
          </span>
          chill-czar
          <ChevronDown className="text-muted-foreground size-3.5" />
        </MotionButton>

        <MotionButton
          type="button"
          className="border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground flex cursor-pointer items-center gap-1.5 rounded-none border px-3 py-1.5 text-[13px] shadow-xs transition-colors"
        >
          All repositories
          <ChevronDown className="size-3.5" />
        </MotionButton>

        <MotionButton
          type="button"
          pressStyle="icon"
          className="text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer rounded-none p-1.5 transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw className="size-4" />
        </MotionButton>

        <div className="ml-auto max-w-[280px] flex-1">
          <input
            type="text"
            value={prUrl}
            onChange={(event) => setPrUrl(event.target.value)}
            placeholder="Paste pull request URL"
            className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring w-full rounded-none border px-3 py-1.5 text-[13px] outline-none focus:ring-1"
          />
        </div>
      </div>

      <div className="text-foreground font-heading flex items-center gap-2 text-[14px] font-medium">
        <Clock className="text-muted-foreground size-4" />
        <span>Waiting for reviewers</span>
      </div>

      <div className="mt-4 space-y-2">
        {waitingReviews.map((item) => (
          <MotionButton
            key={item.id}
            type="button"
            className="border-border bg-card hover:bg-muted/50 flex w-full cursor-pointer items-start gap-3 rounded-none border p-3 text-left shadow-xs transition-colors"
          >
            <GitPullRequest className="text-primary mt-0.5 size-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-foreground text-[14px] font-medium">
                  {item.title}
                </span>
                {item.status === "failed" ? (
                  <X className="text-destructive size-3.5" />
                ) : (
                  <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <p className="text-muted-foreground mt-0.5 text-[12px]">
                {item.meta}
              </p>
            </div>
          </MotionButton>
        ))}
      </div>
    </div>
  );
}

export const reviewRecentItems = [
  {
    id: "r1",
    title: "refactor(llm): centralize system prom...",
    meta: "4 months ago • kasyap1234",
  },
  {
    id: "r2",
    title: "test: should fail the tests",
    meta: "9 months ago • chill-czar",
  },
  {
    id: "r3",
    title: "test: should pass all tests",
    meta: "9 months ago • chill-czar",
  },
];
