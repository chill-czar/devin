"use client";

import { useEffect, useRef, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  ArrowUp,
  GitCommit,
  Loader2,
  Mic,
  Plus,
} from "lucide-react";
import type { Task, TaskEvent } from "@devin/types";
import { MotionButton } from "@/components/dashboard/motion-button";
import { SessionDesktopPanel } from "@/components/dashboard/session-desktop-panel";
import {
  buildConversationMessages,
  pickStatusLine,
  formatAgentFailureMessage,
} from "@/lib/sessions/agent-activity";
import { canUseDevbox } from "@/lib/sessions/devbox";
import { taskSessionLabel } from "@/lib/sessions/labels";
import { cn } from "@/lib/utils";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
};

export function buildChatMessages(
  task: Task,
  events: TaskEvent[],
): ChatMessage[] {
  const messages: ChatMessage[] = [];

  for (const event of events) {
    if (
      event.type === "task.failed" ||
      event.type === "sandbox.failed" ||
      event.type === "task.completed"
    ) {
      const text = event.message?.trim();
      if (!text) continue;
      const display =
        event.type === "task.failed" || event.type === "sandbox.failed"
          ? formatAgentFailureMessage(text)
          : text;
      messages.push({
        id: event.id,
        role: "system",
        content: display,
        timestamp: event.timestamp,
      });
    }
  }

  return messages;
}

interface SessionChatColumnProps {
  task: Task;
  events: TaskEvent[];
  elapsedTime: string;
  isActive: boolean;
  onBack: () => void;
  followUpPrompt: string;
  onFollowUpChange: (value: string) => void;
  onSendFollowUp: () => void;
  continuingSession: boolean;
  sessionActive: boolean;
  banner?: ReactNode;
  composerDisabled?: boolean;
  addedLineCount?: number;
  onOpenDesktop?: () => void;
}

export function SessionChatColumn({
  task,
  events,
  elapsedTime,
  isActive,
  onBack,
  followUpPrompt,
  onFollowUpChange,
  onSendFollowUp,
  continuingSession,
  banner,
  composerDisabled,
  addedLineCount = 0,
  onOpenDesktop,
}: SessionChatColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const conversation = buildConversationMessages(task, events);
  const systemMessages =
    task.status === "failed" ? [] : buildChatMessages(task, events);
  const statusLine = pickStatusLine(task, events, isActive);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [conversation.length, isActive, statusLine]);

  const workLabel = isActive
    ? `Working… ${elapsedTime}`
    : `Worked for ${elapsedTime}${
        addedLineCount > 0 ? ` · +${addedLineCount}` : ""
      }`;

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col bg-transparent">
      <header className="border-border flex shrink-0 items-center gap-2 border-b px-3 py-2.5">
        <MotionButton
          type="button"
          pressStyle="icon"
          onClick={onBack}
          className="text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer rounded-none p-1.5 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </MotionButton>
        <p className="text-foreground font-heading min-w-0 flex-1 truncate text-[13px] font-medium">
          {taskSessionLabel(task)}
        </p>
        {task.repository ? (
          <a
            href={`https://github.com/${task.repository}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Open repository"
          >
            <GitCommit className="size-4" />
          </a>
        ) : null}
      </header>

      {banner ? (
        <div className="border-border shrink-0 border-b px-4 py-2">
          {banner}
        </div>
      ) : null}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-4">
          {conversation.map((message) =>
            message.role === "user" ? (
              <div key={message.id} className="flex flex-col items-end gap-1">
                {message.timestamp ? (
                  <time
                    dateTime={message.timestamp}
                    className="text-muted-foreground mr-10 text-[11px] tabular-nums"
                  >
                    {formatMessageTime(message.timestamp)}
                  </time>
                ) : null}
                <div className="flex items-end gap-2">
                  <div className="border-border bg-muted/60 text-foreground max-w-[min(88%,20rem)] rounded-none border px-3.5 py-2.5 text-[13px] leading-relaxed shadow-2xs">
                    {message.content}
                  </div>
                  <UserAvatar />
                </div>
              </div>
            ) : (
              <div key={message.id} className="pr-2">
                <AssistantMarkdown content={message.content} />
              </div>
            ),
          )}
        </div>

        {isActive && statusLine ? (
          <p className="text-foreground mt-4 text-[13px] leading-relaxed">
            {statusLine}
          </p>
        ) : null}

        <p
          className={cn(
            "text-muted-foreground mt-3 flex items-center gap-2 text-[12px]",
            isActive && "text-foreground font-medium",
          )}
        >
          {isActive ? (
            <span className="bg-primary size-1.5 shrink-0 animate-pulse rounded-full" />
          ) : null}
          {workLabel}
        </p>

        {systemMessages.map((message) => (
          <p
            key={message.id}
            className="text-muted-foreground mt-3 text-center text-[11px]"
          >
            {message.content}
          </p>
        ))}
      </div>

      {canUseDevbox(task) ? (
        <div className="border-border shrink-0 border-t bg-transparent px-3 pt-3">
          <div className="border-border bg-card overflow-hidden rounded-none border shadow-xs">
            <SessionDesktopPanel
              task={task}
              layout="embed"
              onOpenDesktop={onOpenDesktop}
            />
          </div>
        </div>
      ) : null}

      <div className="border-border shrink-0 border-t bg-transparent p-3">
        <form
          className="border-border bg-background focus-within:border-ring focus-within:ring-ring rounded-none border p-2.5 shadow-xs focus-within:ring-1"
          onSubmit={(event) => {
            event.preventDefault();
            if (!composerDisabled && followUpPrompt.trim()) {
              onSendFollowUp();
            }
          }}
        >
          <textarea
            value={followUpPrompt}
            onChange={(event) => onFollowUpChange(event.target.value)}
            disabled={composerDisabled || continuingSession}
            rows={1}
            placeholder="Ask Devin to build features, fix bugs, or work on your code"
            className="text-foreground placeholder:text-muted-foreground w-full resize-none bg-transparent px-2 py-1.5 text-[13px] leading-relaxed outline-none disabled:opacity-50"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (!composerDisabled && followUpPrompt.trim()) {
                  onSendFollowUp();
                }
              }
            }}
          />
          <div className="mt-1 flex items-center justify-between px-1">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-none p-1.5 transition-colors"
                aria-label="Add attachment"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-none p-1.5 transition-colors"
                aria-label="Voice input"
              >
                <Mic className="size-4" />
              </button>
              <MotionButton
                type="submit"
                disabled={
                  composerDisabled ||
                  continuingSession ||
                  !followUpPrompt.trim()
                }
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex cursor-pointer items-center justify-center rounded-none p-2 transition-colors disabled:opacity-40"
                aria-label="Send message"
              >
                {continuingSession ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowUp className="size-4" />
                )}
              </MotionButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatMessageTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function UserAvatar() {
  return (
    <div
      className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold shadow-xs"
      aria-hidden
    >
      You
    </div>
  );
}

function AssistantMarkdown({ content }: { content: string }) {
  return (
    <div className="text-foreground/90 [&_a]:text-primary [&_code]:bg-muted [&_code]:border-border [&_h1]:text-foreground [&_h1]:font-heading [&_h2]:text-foreground [&_h2]:font-heading [&_h3]:text-foreground [&_h3]:font-heading [&_strong]:text-foreground text-[13px] leading-relaxed [&_a]:font-medium [&_a]:underline-offset-2 hover:[&_a]:underline [&_code]:rounded-none [&_code]:border [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px] [&_h1]:mb-2 [&_h1]:text-[15px] [&_h1]:font-semibold [&_h2]:mb-1.5 [&_h2]:text-[14px] [&_h2]:font-medium [&_h3]:mb-1 [&_h3]:text-[13px] [&_h3]:font-medium [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1.5 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

export function SessionPhaseStrip({
  task,
  events,
}: {
  task: Task;
  events: TaskEvent[];
}) {
  const sandboxDone = events.some((e) => e.type === "sandbox.started");
  const executeDone =
    task.status === "completed" ||
    task.status === "awaiting_review" ||
    events.some((e) => e.type === "task.completed");
  const done = task.status === "completed";

  const steps = [
    { label: "Sandbox", done: sandboxDone },
    { label: "Build", done: executeDone },
    { label: "Done", done },
  ];

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center gap-2">
          <span
            className={cn(
              "text-[10px] font-medium tracking-wide uppercase",
              step.done ? "text-primary font-medium" : "text-muted-foreground",
            )}
          >
            {step.label}
          </span>
          {index < steps.length - 1 ? (
            <span className="bg-border h-px w-4" />
          ) : null}
        </div>
      ))}
    </div>
  );
}
