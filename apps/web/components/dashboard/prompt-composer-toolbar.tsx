"use client";

import {
  ArrowUp,
  Bot,
  ChevronDown,
  Loader2,
  Mic,
  Paperclip,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MotionButton } from "@/components/dashboard/motion-button";
import {
  agentOptions,
  type AgentId,
} from "@/components/dashboard/prompt-composer-constants";
import { brainAgentModelLabel, DEFAULT_BRAIN_AGENT_MODEL } from "@devin/types";
import { cn } from "@/lib/utils";

interface PromptComposerToolbarProps {
  agent: AgentId;
  onAgentChange: (agent: AgentId) => void;
  showAgentMenu: boolean;
  onToggleAgentMenu: () => void;
  agentMenuRef: React.RefObject<HTMLDivElement | null>;
  prompt: string;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function PromptComposerToolbar({
  agent,
  onAgentChange,
  showAgentMenu,
  onToggleAgentMenu,
  agentMenuRef,
  prompt,
  isSubmitting,
  onSubmit,
}: PromptComposerToolbarProps) {
  const selectedAgent =
    agentOptions.find((option) => option.id === agent) ?? agentOptions[0]!;
  const canSend = Boolean(prompt.trim()) && !isSubmitting;

  return (
    <div className="flex items-center justify-between px-3.5 pt-1 pb-3">
      <div className="flex items-center gap-0.5">
        <MotionButton
          type="button"
          pressStyle="icon"
          className="text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer rounded-none p-1.5 transition-colors"
          aria-label="Add"
        >
          <Plus className="size-4" strokeWidth={2} />
        </MotionButton>
        <MotionButton
          type="button"
          pressStyle="icon"
          className="text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer rounded-none p-1.5 transition-colors"
          aria-label="Attach file"
        >
          <Paperclip className="size-4" strokeWidth={1.75} />
        </MotionButton>

        <div className="relative ml-0.5" ref={agentMenuRef}>
          <MotionButton
            type="button"
            onClick={onToggleAgentMenu}
            className="text-foreground hover:bg-muted flex cursor-pointer items-center gap-1 rounded-none px-2 py-1 text-xs transition-colors"
          >
            <span>{selectedAgent.label}</span>
            <ChevronDown
              className={cn(
                "text-muted-foreground size-3.5 transition-transform",
                showAgentMenu && "rotate-180",
              )}
            />
          </MotionButton>

          <AnimatePresence>
            {showAgentMenu ? (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="border-border bg-popover text-popover-foreground absolute bottom-full left-0 z-[100] mb-2 min-w-[180px] overflow-hidden rounded-none border py-1 shadow-xl"
              >
                {agentOptions.map((option) => (
                  <MotionButton
                    key={option.id}
                    type="button"
                    onClick={() => onAgentChange(option.id)}
                    className={cn(
                      "hover:bg-muted flex w-full cursor-pointer flex-col px-3 py-2 text-left transition-colors",
                      agent === option.id
                        ? "text-primary font-medium"
                        : "text-muted-foreground",
                    )}
                  >
                    <span className="flex items-center gap-1.5 text-xs">
                      <Bot className="size-3.5 opacity-60" />
                      {option.label}
                    </span>
                    <span className="text-muted-foreground mt-0.5 text-[11px]">
                      {option.id === "brain"
                        ? brainAgentModelLabel(DEFAULT_BRAIN_AGENT_MODEL)
                        : option.description}
                    </span>
                  </MotionButton>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <MotionButton
          type="button"
          pressStyle="icon"
          className="text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer rounded-none p-1.5 transition-colors"
          aria-label="Voice input"
        >
          <Mic className="size-4" strokeWidth={1.75} />
        </MotionButton>
        <MotionButton
          type="button"
          pressStyle="primary"
          disabled={!canSend}
          onClick={onSubmit}
          className={cn(
            "flex size-8 cursor-pointer items-center justify-center rounded-none shadow-xs transition-colors disabled:cursor-not-allowed",
            canSend
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground opacity-40",
          )}
          aria-label="Send prompt"
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowUp className="size-4" strokeWidth={2.5} />
          )}
        </MotionButton>
        <MotionButton
          type="button"
          pressStyle="icon"
          aria-label="Send options"
          className="text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer rounded-none p-1 transition-colors"
        >
          <ChevronDown className="size-3.5" />
        </MotionButton>
      </div>
    </div>
  );
}
