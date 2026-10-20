"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { DismissChecklistModal } from "@/components/dashboard/dismiss-checklist-modal";
import { MotionButton } from "@/components/dashboard/motion-button";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
  badge?: string;
}

interface OnboardingPanelProps {
  githubConnected?: boolean;
  hasRepoAccess?: boolean;
  hasRepository?: boolean;
  sessionCount?: number;
  onDismissConfirmed?: () => void;
}

const advancedItems = [
  { id: "integration", label: "Connect an integration" },
  { id: "automations", label: "Set up automations" },
  { id: "playbook", label: "Create a playbook" },
  { id: "capabilities", label: "Check platform status" },
];

export function OnboardingPanel({
  githubConnected = false,
  hasRepoAccess = false,
  hasRepository = false,
  sessionCount = 0,
  onDismissConfirmed,
}: OnboardingPanelProps) {
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [showAdvancedTips, setShowAdvancedTips] = useState(true);

  const checklistItems: ChecklistItem[] = [
    {
      id: "git",
      label: "Connect to Git",
      completed: githubConnected,
      current: !githubConnected,
    },
    {
      id: "repos",
      label: "Select repositories",
      completed: hasRepoAccess && hasRepository,
      current: githubConnected && (!hasRepoAccess || !hasRepository),
      badge: hasRepoAccess && hasRepository ? "Earned $10" : undefined,
    },
    {
      id: "session",
      label: "Make your first session",
      completed: sessionCount > 0,
      current:
        githubConnected && hasRepoAccess && hasRepository && sessionCount === 0,
    },
    {
      id: "review",
      label: "Validate in Devin Review",
      completed: false,
      current: sessionCount > 0,
    },
    { id: "wiki", label: "Set up your wiki", completed: false, current: false },
    {
      id: "ask",
      label: "Ask Devin about your codebase",
      completed: false,
      current: false,
    },
  ];

  const completedCount =
    (githubConnected ? 1 : 0) +
    (hasRepoAccess && hasRepository ? 1 : 0) +
    (sessionCount > 0 ? 1 : 0);
  const totalCount = 10;
  const progress = (completedCount / totalCount) * 100;

  function handleDismissConfirm() {
    setShowDismissModal(false);
    onDismissConfirmed?.();
  }

  return (
    <>
      <div className="border-border bg-card text-card-foreground w-full max-w-[840px] overflow-hidden rounded-none border shadow-xs">
        <div className="border-border flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-foreground font-heading text-[14px] font-medium">
            Get started with Devin
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-[12px]">
                {completedCount} of {totalCount}
              </span>
              <div className="bg-muted h-1.5 w-16 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <MotionButton
              type="button"
              pressStyle="icon"
              onClick={() => setShowDismissModal(true)}
              className="text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer rounded-none p-1 transition-colors"
              aria-label="Dismiss onboarding"
            >
              <X className="size-4" />
            </MotionButton>
          </div>
        </div>

        <div className="px-2 py-2">
          {checklistItems.map((item) => (
            <MotionButton
              key={item.id}
              type="button"
              className={cn(
                "hover:bg-muted/60 flex w-full cursor-pointer items-center justify-between rounded-none px-3 py-2.5 text-left transition-colors",
                item.current && "bg-muted/80",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border",
                    item.completed
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-transparent",
                  )}
                >
                  {item.completed ? (
                    <Check className="size-3" strokeWidth={3} />
                  ) : null}
                </span>
                <span
                  className={cn(
                    "text-[14px]",
                    item.completed
                      ? "text-muted-foreground line-through"
                      : "text-foreground font-medium",
                  )}
                >
                  {item.label}
                </span>
              </div>
              {item.badge ? (
                <span className="text-primary bg-primary/10 border-primary/25 rounded-none border px-1.5 py-0.5 text-[12px] font-medium">
                  {item.badge}
                </span>
              ) : null}
            </MotionButton>
          ))}

          {showAdvancedTips ? (
            <>
              <p className="text-muted-foreground font-heading mt-2 px-3 py-1.5 text-[13px] font-medium">
                Advanced
              </p>

              {advancedItems.map((item) => (
                <MotionButton
                  key={item.id}
                  type="button"
                  className="hover:bg-muted/60 flex w-full cursor-pointer items-center gap-3 rounded-none px-3 py-2.5 text-left transition-colors"
                >
                  <span className="border-border flex size-5 shrink-0 items-center justify-center rounded-full border" />
                  <span className="text-foreground text-[14px]">
                    {item.label}
                  </span>
                </MotionButton>
              ))}
            </>
          ) : null}
        </div>

        <MotionButton
          type="button"
          onClick={() => setShowAdvancedTips((open) => !open)}
          className="border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground flex w-full cursor-pointer items-center justify-center gap-1.5 border-t px-4 py-2.5 text-[13px] transition-colors"
        >
          {showAdvancedTips ? (
            <>
              <ChevronUp className="size-3.5" />
              Hide advanced tips
            </>
          ) : (
            <>
              <ChevronDown className="size-3.5" />
              Show advanced tips
            </>
          )}
        </MotionButton>
      </div>

      <AnimatePresence initial={false}>
        {showDismissModal ? (
          <DismissChecklistModal
            onCancel={() => setShowDismissModal(false)}
            onDismiss={handleDismissConfirm}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
