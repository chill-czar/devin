"use client";

import { useState } from "react";
import { ArrowUp, Plus } from "lucide-react";
import { GithubIcon } from "@/components/dashboard/github-icon";
import { MotionButton } from "@/components/dashboard/motion-button";
import { cn } from "@/lib/utils";

const featuredAutomations = [
  {
    id: "slack",
    icon: "💬",
    title: "Triage Bug Reports on Slack",
    description: "Automatically triage and respond to bug reports in Slack",
  },
  {
    id: "ci",
    icon: "github",
    title: "CI Failure Fixer",
    description: "Fix CI failures automatically when tests fail on PRs",
  },
  {
    id: "issue",
    icon: "github",
    title: "/devin Issue Fix",
    description: "Respond to GitHub issues tagged with /devin",
  },
];

export function AutomationsView() {
  const [prompt, setPrompt] = useState("");
  const [activeTab, setActiveTab] = useState<"automations" | "triage">(
    "automations",
  );

  return (
    <div className="mx-auto flex w-full max-w-[840px] flex-col">
      <h1 className="text-foreground font-heading mb-6 text-[22px] font-semibold">
        Automations
      </h1>

      <div className="border-border bg-card text-card-foreground overflow-hidden rounded-none border shadow-md">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Fix lint errors whenever CI fails on a PR"
          rows={2}
          className="text-foreground placeholder:text-muted-foreground w-full resize-none bg-transparent px-5 pt-5 pb-2 text-[15px] italic outline-none placeholder:italic"
        />
        <div className="flex justify-end px-3 pb-3">
          <MotionButton
            type="button"
            pressStyle="primary"
            disabled={!prompt.trim()}
            className={cn(
              "flex size-8 cursor-pointer items-center justify-center rounded-none transition-colors disabled:cursor-not-allowed",
              prompt.trim()
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                : "bg-muted text-muted-foreground",
            )}
            aria-label="Create automation"
          >
            <ArrowUp className="size-4" strokeWidth={2.5} />
          </MotionButton>
        </div>

        <div className="border-border border-t px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-foreground font-heading text-[13px] font-medium">
              Featured automations
            </span>
            <MotionButton
              type="button"
              className="text-muted-foreground hover:text-foreground cursor-pointer text-[13px] transition-colors"
            >
              View all examples
            </MotionButton>
          </div>

          <div className="space-y-1">
            {featuredAutomations.map((item) => (
              <MotionButton
                key={item.id}
                type="button"
                className="hover:bg-muted flex w-full cursor-pointer items-center gap-3 rounded-none px-3 py-2.5 text-left transition-colors"
              >
                <span className="border-border bg-muted/60 flex size-8 shrink-0 items-center justify-center rounded-none border text-[14px]">
                  {item.icon === "github" ? (
                    <GithubIcon className="text-foreground size-4" />
                  ) : (
                    item.icon
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-[14px] font-medium">
                    {item.title}
                  </p>
                  <p className="text-muted-foreground truncate text-[12px]">
                    {item.description}
                  </p>
                </div>
                <Plus className="text-muted-foreground size-4 shrink-0" />
              </MotionButton>
            ))}
          </div>
        </div>
      </div>

      <div className="border-border mt-8 flex items-center justify-between border-b pb-0">
        <div className="flex gap-4">
          <MotionButton
            type="button"
            onClick={() => setActiveTab("automations")}
            className={cn(
              "cursor-pointer border-b-2 pb-2.5 text-[14px] font-medium transition-colors",
              activeTab === "automations"
                ? "border-primary text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            Automations
          </MotionButton>
          <MotionButton
            type="button"
            onClick={() => setActiveTab("triage")}
            className={cn(
              "cursor-pointer border-b-2 pb-2.5 text-[14px] font-medium transition-colors",
              activeTab === "triage"
                ? "border-primary text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            Triage Devins
          </MotionButton>
        </div>
        <MotionButton
          type="button"
          pressStyle="primary"
          className="bg-primary text-primary-foreground hover:bg-primary/90 mb-2 cursor-pointer rounded-none px-4 py-2 text-[13px] font-medium shadow-xs transition-colors"
        >
          + Create automation
        </MotionButton>
      </div>

      <p className="text-muted-foreground mt-12 text-center text-[14px]">
        No automations yet
      </p>
    </div>
  );
}
