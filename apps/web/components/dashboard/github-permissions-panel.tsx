"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Check,
  CircleDot,
  ExternalLink,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Loader2,
  PlusCircle,
  Shield,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { getCallbackURL } from "@/lib/auth-config";
import {
  fetchGitHubStatusSafe,
  GITHUB_REPO_SCOPES,
  updateGitHubPermissions,
  type GitHubPermissions,
  type GitHubStatus,
} from "@/lib/github-api";
import { MotionButton } from "@/components/dashboard/motion-button";
import { DEVIN_BOT, displayBotUsername } from "@/lib/devin-bot";
import { cn } from "@/lib/utils";

interface GitHubPermissionsPanelProps {
  compact?: boolean;
}

const permissionItems = [
  {
    key: "canCommit" as const,
    label: "Commit changes",
    description: "Allow Devin to commit code in your repository",
    icon: GitCommit,
  },
  {
    key: "canPush" as const,
    label: "Push branches",
    description: "Push agent branches to your remote repository",
    icon: GitBranch,
  },
  {
    key: "canCreatePr" as const,
    label: "Open pull requests",
    description: "Create PRs after Devin finishes work",
    icon: GitPullRequest,
  },
  {
    key: "canCreateRepo" as const,
    label: "Create repositories",
    description:
      "Let baby-devin-bot create new GitHub repos for greenfield tasks",
    icon: PlusCircle,
  },
  {
    key: "canCreateIssue" as const,
    label: "Create issues",
    description: "Open GitHub issues for follow-ups and task tracking",
    icon: CircleDot,
  },
];

export function GitHubPermissionsPanel({
  compact = false,
}: GitHubPermissionsPanelProps) {
  const [status, setStatus] = useState<GitHubStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchGitHubStatusSafe()
      .then((next) => {
        if (!cancelled) {
          setStatus(next);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load GitHub connection");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleConnect() {
    setIsConnecting(true);
    setError(null);

    try {
      await authClient.linkSocial({
        provider: "github",
        scopes: [...GITHUB_REPO_SCOPES, "read:user", "user:email"],
        callbackURL: getCallbackURL("/s"),
      });
    } catch {
      setError("Failed to connect GitHub. Please try again.");
      setIsConnecting(false);
    }
  }

  async function handleRequestRepoAccess() {
    setIsConnecting(true);
    setError(null);

    try {
      await authClient.linkSocial({
        provider: "github",
        scopes: ["repo"],
        callbackURL: getCallbackURL("/s"),
      });
    } catch {
      setError("Failed to request repository access. Please try again.");
      setIsConnecting(false);
    }
  }

  async function togglePermission(key: keyof GitHubPermissions) {
    if (!status) {
      return;
    }

    const next: GitHubPermissions = {
      ...status.permissions,
      [key]: !status.permissions[key],
    };

    setIsSaving(true);
    setError(null);

    try {
      const result = await updateGitHubPermissions(next);
      setStatus((current) =>
        current ? { ...current, permissions: result.permissions } : current,
      );
    } catch {
      setError("Failed to update permissions");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-6">
        <Loader2 className="text-primary size-4 animate-spin" />
      </div>
    );
  }

  if (!status?.connected) {
    return (
      <div
        className={cn(
          "border-border bg-card text-card-foreground rounded-none border shadow-xs",
          compact ? "p-4" : "p-5",
        )}
      >
        <div className="flex items-start gap-3">
          <Shield className="text-primary mt-0.5 size-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="text-foreground font-heading text-[14px] font-medium">
              Connect your GitHub
            </h3>
            <p className="text-muted-foreground mt-1 text-[13px]">
              Link your personal GitHub account so Devin can work on your
              repositories, commit changes, and open pull requests.
            </p>
            <MotionButton
              type="button"
              pressStyle="primary"
              disabled={isConnecting}
              onClick={handleConnect}
              className="bg-primary text-primary-foreground hover:bg-primary/90 mt-3 cursor-pointer rounded-none px-4 py-2 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isConnecting ? "Redirecting…" : "Connect GitHub"}
            </MotionButton>
          </div>
        </div>

        <div className="border-border bg-muted/30 mt-4 rounded-none border px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2.5">
              <Image
                src={DEVIN_BOT.avatarUrl}
                alt=""
                width={32}
                height={32}
                unoptimized
                className="border-border mt-0.5 size-8 rounded-full border"
              />
              <div className="min-w-0">
                <p className="text-foreground text-[13px]">
                  Platform bot:{" "}
                  <a
                    href={DEVIN_BOT.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-medium hover:underline"
                  >
                    @{displayBotUsername(status?.bot.username)}
                  </a>
                </p>
                <p className="text-muted-foreground text-[11px]">
                  Creates new repos and handles greenfield tasks on your behalf
                </p>
              </div>
            </div>
            <span
              className={cn(
                "rounded-none border px-2.5 py-0.5 text-[11px] font-medium",
                status?.bot.configured
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400",
              )}
            >
              {status?.bot.configured ? "Ready" : "Not configured"}
            </span>
          </div>
        </div>

        {error ? (
          <p className="text-destructive mt-3 text-[12px]">{error}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-border bg-card text-card-foreground rounded-none border shadow-xs",
        compact ? "p-4" : "p-5",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-foreground font-heading text-[14px] font-medium">
            GitHub permissions
          </h3>
          <p className="text-muted-foreground mt-0.5 text-[12px]">
            Connected as{" "}
            <span className="text-foreground font-medium">
              @{status.username}
            </span>
          </p>
        </div>
        {status.hasRepoAccess ? (
          <span className="flex items-center gap-1 rounded-none border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <Check className="size-3" />
            Repo access
          </span>
        ) : (
          <MotionButton
            type="button"
            disabled={isConnecting}
            onClick={handleRequestRepoAccess}
            className="border-input bg-background text-foreground hover:bg-muted cursor-pointer rounded-none border px-3 py-1.5 text-[12px] transition-colors disabled:cursor-not-allowed"
          >
            {isConnecting ? "Redirecting…" : "Grant repo access"}
          </MotionButton>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {permissionItems.map((item) => {
          const Icon = item.icon;
          const enabled = status.permissions[item.key];
          const isBotRequired = item.key === "canCreateRepo";
          const botUnavailable = isBotRequired && !status.bot.configured;
          const disabled = isSaving || !status.hasRepoAccess || botUnavailable;

          return (
            <div
              key={item.key}
              className={cn(
                "border-border bg-muted/30 flex items-center justify-between gap-3 rounded-none border px-3 py-2.5",
                botUnavailable && "opacity-60",
              )}
            >
              <div className="flex min-w-0 items-start gap-2.5">
                <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-foreground text-[13px] font-medium">
                    {item.label}
                  </p>
                  {!compact ? (
                    <p className="text-muted-foreground text-[11px]">
                      {botUnavailable
                        ? "Platform bot not configured by admin"
                        : item.description}
                    </p>
                  ) : null}
                </div>
              </div>
              <MotionButton
                type="button"
                disabled={disabled}
                onClick={() => togglePermission(item.key)}
                className={cn(
                  "relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  enabled && !botUnavailable
                    ? "bg-primary"
                    : "bg-muted-foreground/30",
                )}
                aria-label={`Toggle ${item.label}`}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-4 rounded-full bg-white transition-transform",
                    enabled && !botUnavailable ? "left-[18px]" : "left-0.5",
                  )}
                />
              </MotionButton>
            </div>
          );
        })}
      </div>

      {status.selectedRepository ? (
        <p className="text-muted-foreground mt-3 text-[12px]">
          Active repo:{" "}
          <a
            href={`https://github.com/${status.selectedRepository}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary inline-flex items-center gap-1 font-medium hover:underline"
          >
            {status.selectedRepository}
            <ExternalLink className="size-3" />
          </a>
        </p>
      ) : null}

      <div
        className={cn(
          "mt-4 rounded-none border px-3 py-2.5",
          status.bot.configured
            ? "border-border bg-muted/30"
            : "border-amber-500/30 bg-amber-500/5",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-foreground text-[13px] font-medium">
              Platform bot: @{status.bot.username}
            </p>
            <p className="text-muted-foreground text-[11px]">
              {status.bot.configured
                ? "Used for new repo creation when no repository is selected"
                : "Bot token not set. Contact admin to enable repo creation."}
            </p>
          </div>
          <span
            className={cn(
              "rounded-none border px-2.5 py-0.5 text-[11px] font-medium",
              status.bot.configured
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400",
            )}
          >
            {status.bot.configured ? "Ready" : "Not configured"}
          </span>
        </div>
      </div>

      {error ? (
        <p className="text-destructive mt-3 text-[12px]">{error}</p>
      ) : null}
    </div>
  );
}
