"use client";

import { Check, Circle, Loader2, Terminal } from "lucide-react";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import { ShellSource } from "@/components/prompt-kit/source";
import { cn } from "@/lib/utils";

function parseShellLine(line: string): {
  prefix: string;
  command: string;
} | null {
  const match = line.match(/^Ran `(.+)`$/);
  if (!match?.[1]) {
    return null;
  }
  return { prefix: "Ran", command: match[1] };
}

function formatStepTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function WorkStepLabel({
  line,
  active,
  timestamp,
}: {
  line: string;
  active: boolean;
  timestamp?: string;
}) {
  const shell = parseShellLine(line);
  const timeLabel = timestamp ? formatStepTime(timestamp) : "";

  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      {shell ? (
        <p
          className={cn(
            "flex min-w-0 flex-wrap items-center gap-1.5",
            active ? "text-foreground font-medium" : "text-muted-foreground",
          )}
        >
          <span className="text-muted-foreground">{shell.prefix}</span>
          <ShellSource command={shell.command} />
        </p>
      ) : (
        <p
          className={cn(
            "min-w-0",
            active ? "text-foreground font-medium" : "text-muted-foreground",
          )}
        >
          {line}
        </p>
      )}
      {timeLabel ? (
        <time
          dateTime={timestamp}
          className="text-muted-foreground shrink-0 pt-0.5 text-[11px] tabular-nums"
        >
          {timeLabel}
        </time>
      ) : null}
    </div>
  );
}

export function SessionWorkSteps({
  lines,
  isActive,
  elapsedTime,
}: {
  lines: Array<{ line: string; timestamp?: string }>;
  isActive: boolean;
  elapsedTime: string;
}) {
  if (lines.length === 0 && !isActive) {
    return (
      <p className="text-muted-foreground text-[12px]">No progress recorded.</p>
    );
  }

  const header = isActive
    ? `Working… ${elapsedTime}`
    : `Worked for ${elapsedTime}`;

  return (
    <ChainOfThought defaultOpen className="text-muted-foreground space-y-3">
      <ChainOfThoughtHeader className="text-muted-foreground hover:text-foreground font-medium">
        {header}
      </ChainOfThoughtHeader>
      <ChainOfThoughtContent className="text-muted-foreground mt-3 space-y-0">
        {lines.map((entry, index) => {
          const isLast = index === lines.length - 1;
          const shell = parseShellLine(entry.line);
          // Shell rows keep the terminal icon; spinning the last Shell forever
          // (e.g. bun start hung) is confusing — only spin non-shell steps.
          const active = isActive && isLast && !shell;
          const StepIcon = active ? Loader2 : shell ? Terminal : Check;

          return (
            <ChainOfThoughtStep
              key={`${index}-${entry.line.slice(0, 20)}`}
              icon={StepIcon}
              status={active ? "active" : "complete"}
              label={
                <WorkStepLabel
                  line={entry.line}
                  active={active}
                  timestamp={entry.timestamp}
                />
              }
              className={cn(
                "border-border gap-3 border-l py-2 pl-3 text-[12px]",
                active ? "text-foreground" : "text-muted-foreground",
                active && "[&_svg]:text-primary [&_svg]:animate-spin",
              )}
            />
          );
        })}
        {isActive && lines.length === 0 ? (
          <ChainOfThoughtStep
            icon={Circle}
            status="pending"
            label={
              <p className="text-muted-foreground text-[12px]">
                Waiting for agent steps…
              </p>
            }
            className="text-muted-foreground gap-3 py-2 pl-3"
          />
        ) : null}
      </ChainOfThoughtContent>
    </ChainOfThought>
  );
}
