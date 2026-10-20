"use client";

import { useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  GitCommit,
  Terminal,
} from "lucide-react";
import { DEVIN_BOT } from "@/lib/devin-bot";
import type { Task, TaskEvent } from "@devin/types";
import { usesRuntimeAgent } from "@devin/types";
import { eventTypeLabel, formatEventData } from "@/lib/tasks-api";
import { cn } from "@/lib/utils";
import { eventColor, eventIcon } from "./session-detail-utils";

export function CollapsiblePanel({
  title,
  icon: Icon,
  iconClassName,
  defaultExpanded = true,
  headerRight,
  children,
  className,
}: {
  title: string;
  icon: typeof Terminal;
  iconClassName?: string;
  defaultExpanded?: boolean;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div
      className={cn(
        "border-border bg-card text-card-foreground overflow-hidden rounded-none border shadow-xs",
        className,
      )}
    >
      <div className="hover:bg-muted/40 flex w-full items-center justify-between gap-3 px-4 py-2.5 transition-colors">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
        >
          <Icon className={cn("size-4 shrink-0", iconClassName)} />
          <h2 className="text-foreground font-heading text-[13px] font-medium">
            {title}
          </h2>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          {headerRight}
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
            aria-label={expanded ? "Collapse panel" : "Expand panel"}
          >
            {expanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        </div>
      </div>
      {expanded ? (
        <div className="border-border border-t px-4 py-3">{children}</div>
      ) : null}
    </div>
  );
}

export function LiveWorkPanel({
  task,
  events,
}: {
  task: Task;
  events: TaskEvent[];
}) {
  const draftEvents = events.filter((event) => event.type.startsWith("draft."));
  const stepEvents = events.filter((event) => event.type === "draft.updated");
  const fileEvents = events.filter((event) => event.type === "draft.diff");
  const agentLogEvents = events.filter(
    (event) =>
      event.type === "agent.log" ||
      event.type === "agent.tool" ||
      event.type === "agent.started" ||
      event.type === "agent.completed",
  );
  const latestDraft = draftEvents[draftEvents.length - 1];
  const draftSummary = events.find((event) => event.type === "draft.completed")
    ?.data?.summary;
  const runtimeAgent = usesRuntimeAgent(task.agent);
  const reviewDiff = events.find((event) => event.data?.awaitingReview === true)
    ?.data?.diff;

  if (
    draftEvents.length === 0 &&
    agentLogEvents.length === 0 &&
    task.status !== "drafting" &&
    task.status !== "draft_ready" &&
    task.status !== "running" &&
    task.status !== "awaiting_review"
  ) {
    return null;
  }

  const defaultExpanded = [
    "drafting",
    "draft_ready",
    "scheduling",
    "running",
    "awaiting_review",
  ].includes(task.status);

  const summaryText = runtimeAgent
    ? task.status === "awaiting_review"
      ? "Agent finished in the sandbox — review output and activity below."
      : String(
          agentLogEvents[agentLogEvents.length - 1]?.message ??
            "Runtime agent working in sandbox…",
        )
    : String(
        draftSummary ?? latestDraft?.message ?? "Generating draft plan...",
      );

  return (
    <CollapsiblePanel
      title="Live Work"
      icon={Terminal}
      iconClassName="text-primary"
      defaultExpanded={defaultExpanded}
      className="border-primary/25 bg-primary/5"
    >
      <p className="text-foreground text-[12px]">{summaryText}</p>
      {stepEvents.length > 0 ? (
        <div className="mt-2 space-y-1">
          {stepEvents.slice(-4).map((event) => (
            <p key={event.id} className="text-muted-foreground text-[11px]">
              • {event.message}
            </p>
          ))}
        </div>
      ) : null}
      {fileEvents.length > 0 ? (
        <div className="border-border bg-muted/30 mt-2 space-y-1 rounded-none border px-3 py-2">
          {fileEvents.slice(-5).map((event) => (
            <p key={event.id} className="text-foreground font-mono text-[11px]">
              {String(event.data?.path ?? "file")} —{" "}
              {String(event.data?.summary ?? event.message)}
            </p>
          ))}
        </div>
      ) : null}
      {agentLogEvents.length > 0 ? (
        <div className="border-border bg-muted/30 mt-2 space-y-1 rounded-none border px-3 py-2">
          {agentLogEvents.slice(-6).map((event) => (
            <p key={event.id} className="text-foreground text-[11px]">
              • {event.message}
            </p>
          ))}
        </div>
      ) : null}
      {reviewDiff ? (
        <pre className="border-border bg-muted/30 text-foreground mt-2 overflow-x-auto rounded-none border px-3 py-2 font-mono text-[11px] leading-relaxed">
          {String(reviewDiff)}
        </pre>
      ) : null}
    </CollapsiblePanel>
  );
}

export function BotCoAuthorNote({ compact = false }: { compact?: boolean }) {
  return (
    <p
      className={cn(
        "mt-1 flex flex-wrap items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400",
        compact ? "text-[11px]" : "text-[12px]",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- bot avatar is a static external URL */}
      <img
        src={DEVIN_BOT.avatarUrl}
        alt=""
        className="border-border size-4 rounded-full border"
      />
      <span>Co-authored by</span>
      <a
        href={DEVIN_BOT.profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary font-medium hover:underline"
      >
        @{DEVIN_BOT.username}
      </a>
    </p>
  );
}

export function GitHubProgressBanner({
  repository,
  events,
  branch,
}: {
  repository?: string;
  events: TaskEvent[];
  branch?: string;
}) {
  if (!repository) {
    return null;
  }

  const commitEvents = events.filter((event) => event.type === "git.commit");
  const pushEvents = events.filter((event) => event.type === "git.push");
  const successfulPush = [...pushEvents]
    .reverse()
    .find(
      (event) =>
        event.data?.failed !== true &&
        !/skipped or failed|push failed/i.test(event.message),
    );
  const failedPush = [...pushEvents]
    .reverse()
    .find(
      (event) =>
        event.data?.failed === true ||
        /skipped or failed|push failed/i.test(event.message),
    );
  const pushOk = Boolean(successfulPush);
  const failedBootstrap = commitEvents.some(
    (event) => event.data?.bootstrap && event.data?.error,
  );
  const targetBranch = branch ?? "main";
  const commitsUrl = `https://github.com/${repository}/commits/${targetBranch}`;
  const repoUrl = `https://github.com/${repository}`;

  return (
    <div className="border-border bg-card text-card-foreground mb-4 rounded-none border px-4 py-3 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-foreground font-heading text-[13px] font-medium">
            GitHub: {repository}
          </p>
          <p className="text-muted-foreground mt-0.5 text-[12px]">
            {pushOk
              ? `Pushed to ${targetBranch} — commits should be visible on GitHub`
              : failedPush
                ? `Push to ${targetBranch} failed — commits may not be on GitHub yet`
                : commitEvents.length > 0
                  ? `${commitEvents.length} commit(s) recorded — waiting for push`
                  : "Waiting for initial commit and push…"}
          </p>
          {failedBootstrap ? (
            <p className="text-destructive mt-1 text-[12px]">
              Bootstrap failed — check activity log for details
            </p>
          ) : pushOk ? (
            <BotCoAuthorNote compact />
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border-border bg-background text-primary hover:bg-muted inline-flex items-center gap-1.5 rounded-none border px-3 py-1.5 text-[12px] font-medium transition-colors"
          >
            Open repo
            <ExternalLink className="size-3" />
          </a>
          <a
            href={commitsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border-border bg-background hover:bg-muted inline-flex items-center gap-1.5 rounded-none border px-3 py-1.5 text-[12px] font-medium text-emerald-600 transition-colors dark:text-emerald-400"
          >
            View commits
            <GitCommit className="size-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

export function EventRow({ event }: { event: TaskEvent }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = eventIcon(event.type);
  const details = formatEventData(event.data);
  const hasDetails = details.length > 0;
  const isRepoCreated = event.type === "git.repo";

  return (
    <div className="hover:bg-muted/40 rounded-none px-2 py-2 transition-colors">
      <div className="flex items-start gap-2.5">
        <Icon
          className={cn(
            "mt-0.5 size-3.5 shrink-0",
            eventColor(event.type),
            event.type === "runtime.waiting"
              ? "text-primary animate-spin"
              : null,
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="border-border bg-muted text-muted-foreground rounded-none border px-1.5 py-0.5 font-mono text-[10px] tracking-wide uppercase">
              {eventTypeLabel(event.type)}
            </span>
            <p className="text-foreground text-[13px]">{event.message}</p>
          </div>
          <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2 text-[11px]">
            <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
            {event.data?.prUrl ? (
              <a
                href={String(event.data.prUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline"
              >
                Open PR
              </a>
            ) : null}
            {event.data?.htmlUrl ? (
              <a
                href={String(event.data.htmlUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline"
              >
                {isRepoCreated ? "Open repo" : "View"}
              </a>
            ) : null}
            {event.type === "git.push" && event.data?.branch ? (
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                branch {String(event.data.branch)}
              </span>
            ) : null}
            {hasDetails ? (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-0.5"
              >
                {expanded ? (
                  <ChevronDown className="size-3" />
                ) : (
                  <ChevronRight className="size-3" />
                )}
                Details
              </button>
            ) : null}
          </div>
          {isRepoCreated ? <BotCoAuthorNote /> : null}
          {event.type === "git.commit" || event.type === "git.push" ? (
            <BotCoAuthorNote />
          ) : null}
          {expanded && hasDetails ? (
            <pre className="border-border bg-background text-muted-foreground mt-2 overflow-x-auto rounded-none border px-2.5 py-2 font-mono text-[11px] leading-relaxed">
              {details.join("\n")}
            </pre>
          ) : null}
        </div>
      </div>
    </div>
  );
}
