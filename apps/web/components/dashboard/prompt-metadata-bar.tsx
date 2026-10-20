"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "motion/react";
import { ChevronDown, GitBranch, Loader2, Sparkles } from "lucide-react";
import { AgentCapabilitiesPanel } from "@/components/dashboard/agent-capabilities-panel";
import {
  environmentOptions,
  fetchDashboardSettingsSafe,
  updateDashboardSettings,
} from "@/lib/dashboard-settings-api";
import {
  fetchGitHubRepos,
  fetchGitHubStatusSafe,
  selectGitHubRepository,
  type GitHubRepo,
} from "@/lib/github-api";
import { MotionButton } from "@/components/dashboard/motion-button";
import { cn } from "@/lib/utils";

type MenuKind = "repositories" | "environment" | null;

interface MenuPosition {
  top: number;
  left: number;
  width: number;
}

function MetadataMenu({
  open,
  position,
  children,
  onClose,
}: {
  open: boolean;
  position: MenuPosition | null;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (target.closest("[data-metadata-menu]")) {
        return;
      }
      if (target.closest("[data-metadata-trigger]")) {
        return;
      }
      onClose();
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open || !position) {
    return null;
  }

  return createPortal(
    <div
      data-metadata-menu
      className="border-border bg-popover text-popover-foreground fixed z-[200] overflow-hidden rounded-none border py-1 shadow-lg"
      style={{
        top: position.top,
        left: position.left,
        minWidth: position.width,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

export function PromptMetadataBar() {
  const [repositoryLabel, setRepositoryLabel] = useState(
    "No repository selected",
  );
  const [selectedRepository, setSelectedRepository] = useState<string | null>(
    null,
  );
  const [environment, setEnvironment] = useState("Ubuntu");
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [githubConnected, setGithubConnected] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuKind>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [customEnvironment, setCustomEnvironment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAgentCapabilities, setShowAgentCapabilities] = useState(false);
  const repositoryTriggerRef = useRef<HTMLButtonElement>(null);
  const environmentTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      fetchDashboardSettingsSafe(),
      fetchGitHubStatusSafe(),
    ]).then(([settings, github]) => {
      if (!cancelled) {
        setRepositoryLabel(settings.repositoryLabel);
        setSelectedRepository(settings.selectedRepository);
        setEnvironment(settings.environment);
        setCustomEnvironment(settings.environment);
        setGithubConnected(github.connected);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!githubConnected || openMenu !== "repositories") {
      return;
    }

    let cancelled = false;
    setIsLoadingRepos(true);

    fetchGitHubRepos()
      .then((next) => {
        if (!cancelled) {
          setRepos(next);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load GitHub repositories");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingRepos(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [githubConnected, openMenu]);

  function openMenuAt(kind: MenuKind, trigger: HTMLButtonElement | null) {
    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 8,
      left: rect.left,
      width: Math.max(rect.width, kind === "repositories" ? 280 : 180),
    });
    setOpenMenu(kind);
    setError(null);
  }

  function toggleMenu(
    kind: Exclude<MenuKind, null>,
    trigger: HTMLButtonElement | null,
  ) {
    if (openMenu === kind) {
      setOpenMenu(null);
      setMenuPosition(null);
      return;
    }

    openMenuAt(kind, trigger);
  }

  async function persistEnvironment(value: string) {
    setIsSaving(true);
    setError(null);

    try {
      const saved = await updateDashboardSettings({ environment: value });
      setEnvironment(saved.environment);
      setCustomEnvironment(saved.environment);
      setOpenMenu(null);
      setMenuPosition(null);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function selectRepository(fullName: string | null) {
    setIsSaving(true);
    setError(null);

    try {
      const saved = await selectGitHubRepository(fullName);
      setRepositoryLabel(saved.repositoryLabel);
      setSelectedRepository(saved.selectedRepository);
      setOpenMenu(null);
      setMenuPosition(null);
    } catch {
      setError("Failed to select repository");
    } finally {
      setIsSaving(false);
    }
  }

  function saveCustomEnvironment() {
    const value = customEnvironment.trim();
    if (!value) {
      return;
    }
    void persistEnvironment(value);
  }

  return (
    <>
      <div className="text-muted-foreground relative mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px]">
        <MotionButton
          ref={repositoryTriggerRef}
          type="button"
          data-metadata-trigger
          disabled={isSaving}
          onClick={() =>
            toggleMenu("repositories", repositoryTriggerRef.current)
          }
          className="hover:bg-muted hover:text-foreground flex cursor-pointer items-center gap-1.5 rounded-none px-2 py-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GitBranch className="size-3.5" />
          {repositoryLabel}
          <ChevronDown
            className={cn(
              "size-3 transition-transform",
              openMenu === "repositories" && "rotate-180",
            )}
          />
        </MotionButton>

        <MotionButton
          ref={environmentTriggerRef}
          type="button"
          data-metadata-trigger
          disabled={isSaving}
          onClick={() =>
            toggleMenu("environment", environmentTriggerRef.current)
          }
          className="hover:bg-muted hover:text-foreground flex cursor-pointer items-center gap-1.5 rounded-none px-2 py-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {environment}
          <ChevronDown
            className={cn(
              "size-3 transition-transform",
              openMenu === "environment" && "rotate-180",
            )}
          />
        </MotionButton>

        <MotionButton
          type="button"
          className="text-primary hover:text-primary/80 flex cursor-pointer items-center gap-1.5 font-medium transition-colors"
        >
          <Sparkles className="size-3" />
          Upgrade plan
        </MotionButton>
        <MotionButton
          type="button"
          onClick={() => setShowAgentCapabilities(true)}
          className="hover:text-foreground text-muted-foreground cursor-pointer transition-colors"
        >
          Platform status →
        </MotionButton>
      </div>

      <AnimatePresence>
        {showAgentCapabilities ? (
          <AgentCapabilitiesPanel
            onClose={() => setShowAgentCapabilities(false)}
          />
        ) : null}
      </AnimatePresence>

      {error ? (
        <p className="text-destructive mt-2 text-center text-[12px]">{error}</p>
      ) : null}

      <MetadataMenu
        open={openMenu === "repositories"}
        position={menuPosition}
        onClose={() => {
          setOpenMenu(null);
          setMenuPosition(null);
        }}
      >
        {!githubConnected ? (
          <p className="text-muted-foreground px-3 py-3 text-[13px]">
            Connect GitHub to select a repository
          </p>
        ) : isLoadingRepos ? (
          <div className="text-muted-foreground flex items-center gap-2 px-3 py-3 text-[13px]">
            <Loader2 className="text-primary size-4 animate-spin" />
            Loading repositories…
          </div>
        ) : repos.length === 0 ? (
          <p className="text-muted-foreground px-3 py-3 text-[13px]">
            No repositories found. Grant repo access in GitHub permissions.
          </p>
        ) : (
          <div className="max-h-[280px] overflow-y-auto">
            {repos.map((repo) => (
              <MotionButton
                key={repo.id}
                type="button"
                disabled={isSaving}
                onClick={() => selectRepository(repo.fullName)}
                className={cn(
                  "hover:bg-muted flex w-full cursor-pointer flex-col px-3 py-2 text-left transition-colors disabled:cursor-not-allowed",
                  selectedRepository === repo.fullName
                    ? "text-primary bg-primary/10 font-medium"
                    : "text-foreground",
                )}
              >
                <span className="text-[13px]">{repo.fullName}</span>
                {repo.description ? (
                  <span className="text-muted-foreground truncate text-[11px]">
                    {repo.description}
                  </span>
                ) : null}
              </MotionButton>
            ))}
          </div>
        )}
        <div className="border-border border-t p-2">
          <MotionButton
            type="button"
            disabled={isSaving}
            onClick={() => selectRepository(null)}
            className="text-muted-foreground hover:bg-muted hover:text-foreground w-full cursor-pointer rounded-none px-2 py-1.5 text-left text-[12px] transition-colors disabled:cursor-not-allowed"
          >
            Clear selection
          </MotionButton>
        </div>
      </MetadataMenu>

      <MetadataMenu
        open={openMenu === "environment"}
        position={menuPosition}
        onClose={() => {
          setOpenMenu(null);
          setMenuPosition(null);
        }}
      >
        {environmentOptions.map((option) => (
          <MotionButton
            key={option}
            type="button"
            disabled={isSaving}
            onClick={() => persistEnvironment(option)}
            className={cn(
              "hover:bg-muted flex w-full cursor-pointer px-3 py-2 text-left text-[13px] transition-colors disabled:cursor-not-allowed",
              environment === option
                ? "text-primary bg-primary/10 font-medium"
                : "text-foreground",
            )}
          >
            {option}
          </MotionButton>
        ))}
        <div className="border-border border-t p-2">
          <p className="text-muted-foreground mb-1.5 px-1 text-[11px]">
            Custom environment
          </p>
          <div className="flex gap-2">
            <input
              value={customEnvironment}
              onChange={(event) => setCustomEnvironment(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  saveCustomEnvironment();
                }
              }}
              className="border-input bg-background text-foreground focus:border-ring focus:ring-ring min-w-0 flex-1 rounded-none border px-2 py-1.5 text-[13px] outline-none focus:ring-1"
              placeholder="e.g. Ubuntu 24.04"
            />
            <MotionButton
              type="button"
              pressStyle="primary"
              disabled={isSaving || !customEnvironment.trim()}
              onClick={saveCustomEnvironment}
              className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer rounded-none px-2.5 py-1.5 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save
            </MotionButton>
          </div>
        </div>
      </MetadataMenu>
    </>
  );
}
