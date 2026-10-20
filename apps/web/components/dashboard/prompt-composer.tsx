"use client";

import { useEffect, useRef, useState } from "react";
import { DashboardLogo } from "@/components/dashboard/dashboard-logo";
import { PromptMetadataBar } from "@/components/dashboard/prompt-metadata-bar";
import {
  MIN_TEXTAREA_HEIGHT,
  type AgentId,
} from "@/components/dashboard/prompt-composer-constants";
import { PromptComposerToolbar } from "@/components/dashboard/prompt-composer-toolbar";
import { useSessions } from "@/components/dashboard/sessions-context";
import { DEFAULT_BRAIN_AGENT_MODEL } from "@devin/types";
import { cn } from "@/lib/utils";

interface PromptComposerProps {
  selectedRepository?: string | null;
  isLaunching?: boolean;
  shellClassName?: string;
}

export function PromptComposer({
  selectedRepository,
  isLaunching = false,
  shellClassName,
}: PromptComposerProps) {
  const { startSession } = useSessions();
  const agentMenuRef = useRef<HTMLDivElement>(null);
  const [prompt, setPrompt] = useState("");
  const [agent, setAgent] = useState<AgentId>("brain");
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composerMode, setComposerMode] = useState<"agent" | "ask">("agent");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        agentMenuRef.current &&
        !agentMenuRef.current.contains(event.target as Node)
      ) {
        setShowAgentMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSubmit() {
    const trimmed = prompt.trim();
    if (!trimmed || isSubmitting || isLaunching) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await startSession({
        prompt: trimmed,
        agent,
        repository: selectedRepository ?? undefined,
        autoCreateRepository: selectedRepository ? undefined : true,
        autoStartSandbox: true,
        agentModel: agent === "brain" ? DEFAULT_BRAIN_AGENT_MODEL : undefined,
      });
      setPrompt("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to start session",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  const busy = isSubmitting || isLaunching;

  return (
    <div className="flex w-full flex-col items-center overflow-visible">
      <div
        className={cn(
          "mb-3 flex w-full items-center justify-between px-0.5",
          isLaunching && "pointer-events-none opacity-0",
        )}
      >
        <div className="font-heading text-foreground flex items-center gap-2.5 text-xl font-semibold tracking-tight">
          <DashboardLogo size={26} className="text-primary" />
          <span>Devin</span>
        </div>

        <div className="border-border bg-secondary/60 flex items-center rounded-none border p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setComposerMode("agent")}
            className={cn(
              "cursor-pointer rounded-none px-3 py-1 transition-colors",
              composerMode === "agent"
                ? "bg-card text-foreground border-border/50 border font-medium shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Agent
          </button>
          <button
            type="button"
            onClick={() => setComposerMode("ask")}
            className={cn(
              "cursor-pointer rounded-none px-3 py-1 transition-colors",
              composerMode === "ask"
                ? "bg-card text-foreground border-border/50 border font-medium shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Ask
          </button>
        </div>
      </div>

      <div
        data-composer-shell=""
        className={cn(
          shellClassName,
          "relative w-full",
          isLaunching && "opacity-0",
        )}
      >
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            composerMode === "ask"
              ? "Ask Devin anything about your code"
              : "Ask Devin to build features, fix bugs, or work on your code"
          }
          rows={3}
          disabled={busy}
          style={{ height: MIN_TEXTAREA_HEIGHT }}
          className={cn(
            "w-full resize-none overflow-y-auto bg-transparent px-4 pt-4 pb-2",
            "text-foreground placeholder:text-muted-foreground text-sm leading-relaxed",
            "selection:bg-primary/20 selection:text-foreground",
            "outline-none disabled:opacity-60",
          )}
        />

        <div className={cn(isLaunching && "pointer-events-none opacity-0")}>
          <PromptComposerToolbar
            agent={agent}
            onAgentChange={(nextAgent) => {
              setAgent(nextAgent);
              setShowAgentMenu(false);
            }}
            showAgentMenu={showAgentMenu}
            onToggleAgentMenu={() => {
              setShowAgentMenu((open) => !open);
            }}
            agentMenuRef={agentMenuRef}
            prompt={prompt}
            isSubmitting={busy}
            onSubmit={() => void handleSubmit()}
          />
        </div>
      </div>

      <div
        className={cn("w-full", isLaunching && "pointer-events-none opacity-0")}
      >
        {error ? (
          <p className="text-destructive mt-2 text-center text-xs">{error}</p>
        ) : null}

        <PromptMetadataBar />
      </div>
    </div>
  );
}
