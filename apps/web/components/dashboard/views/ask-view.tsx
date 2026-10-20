"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  ChevronDown,
  Globe,
  Info,
  List,
  MessageSquare,
  Mic,
  Plus,
} from "lucide-react";
import { DashboardLogo } from "@/components/dashboard/dashboard-logo";
import { MotionButton } from "@/components/dashboard/motion-button";
import { cn } from "@/lib/utils";

type AskMode = "auto" | "qa" | "plan";

const modes = [
  {
    id: "auto" as const,
    label: "Auto",
    description: "Automatically select mode",
    icon: Globe,
  },
  {
    id: "qa" as const,
    label: "Q&A",
    description: "Answer questions about codebase",
    icon: MessageSquare,
  },
  {
    id: "plan" as const,
    label: "Plan",
    description: "Create actionable plans for tasks",
    icon: List,
  },
];

export function AskView() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<AskMode>("auto");
  const [deepMode, setDeepMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const activeMode = modes.find((item) => item.id === mode) ?? modes[0]!;
  const ActiveIcon = activeMode.icon;

  return (
    <div className="flex w-full max-w-[840px] flex-col items-center">
      <div className="mb-6 flex justify-center">
        <DashboardLogo size={52} className="text-primary" />
      </div>

      <h1 className="text-foreground font-heading mb-6 text-[22px] font-medium">
        What questions do you have?
      </h1>

      <div className="relative w-full">
        <div className="border-border bg-card text-card-foreground w-full overflow-hidden rounded-none border shadow-md">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ask Devin questions about your code"
            rows={3}
            className="text-foreground placeholder:text-muted-foreground w-full resize-none bg-transparent px-5 pt-5 pb-2 text-[15px] leading-relaxed outline-none"
          />

          <div className="flex items-center justify-between px-3 pt-1 pb-3.5">
            <div className="relative flex items-center gap-0.5" ref={menuRef}>
              <MotionButton
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="border-border bg-muted/60 text-foreground hover:bg-muted flex cursor-pointer items-center gap-1.5 rounded-none border px-2.5 py-1 text-[13px] transition-colors"
              >
                <ActiveIcon
                  className="text-muted-foreground size-3.5"
                  strokeWidth={1.75}
                />
                {activeMode.label}
                <ChevronDown className="text-muted-foreground size-3" />
              </MotionButton>
              <MotionButton
                type="button"
                pressStyle="icon"
                className="text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer rounded-none p-1.5 transition-colors"
                aria-label="Add attachment"
              >
                <Plus className="size-4" />
              </MotionButton>

              {menuOpen ? (
                <div className="border-border bg-popover text-popover-foreground absolute bottom-full left-0 z-20 mb-2 w-[280px] overflow-hidden rounded-none border py-1 shadow-lg">
                  {modes.map((item) => {
                    const Icon = item.icon;
                    const isSelected = mode === item.id;

                    return (
                      <MotionButton
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setMode(item.id);
                          setMenuOpen(false);
                        }}
                        className={cn(
                          "hover:bg-muted flex w-full cursor-pointer items-start gap-3 px-3 py-2.5 text-left transition-colors",
                          isSelected &&
                            "bg-primary/10 text-primary font-medium",
                        )}
                      >
                        <Icon
                          className="text-muted-foreground mt-0.5 size-4 shrink-0"
                          strokeWidth={1.75}
                        />
                        <div>
                          <p className="text-foreground text-[14px] font-medium">
                            {item.label}
                          </p>
                          <p className="text-muted-foreground text-[12px]">
                            {item.description}
                          </p>
                        </div>
                      </MotionButton>
                    );
                  })}

                  <div className="border-border mt-1 border-t px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-2">
                        <Info className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                        <div>
                          <p className="text-foreground text-[14px] font-medium">
                            Deep mode
                          </p>
                          <p className="text-muted-foreground text-[12px] leading-relaxed">
                            More thorough answers with deeper reasoning
                          </p>
                        </div>
                      </div>
                      <MotionButton
                        type="button"
                        role="switch"
                        aria-checked={deepMode}
                        onClick={() => setDeepMode((on) => !on)}
                        className={cn(
                          "relative mt-1 h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors",
                          deepMode ? "bg-primary" : "bg-muted-foreground/30",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 size-4 rounded-full bg-white transition-transform",
                            deepMode ? "left-[18px]" : "left-0.5",
                          )}
                        />
                      </MotionButton>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5">
              <MotionButton
                type="button"
                pressStyle="icon"
                className="text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer rounded-none p-1.5 transition-colors"
                aria-label="Voice input"
              >
                <Mic className="size-4" />
              </MotionButton>
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
                aria-label="Send prompt"
              >
                <ArrowUp className="size-4" strokeWidth={2.5} />
              </MotionButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
