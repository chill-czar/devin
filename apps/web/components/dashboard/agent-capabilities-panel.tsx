"use client";

import { useEffect, useState } from "react";
import { Activity, Loader2, X } from "lucide-react";
import { motion } from "motion/react";
import { MotionButton } from "@/components/dashboard/motion-button";
import { fetchInfraDiagnostics } from "@/lib/api/tasks";
import type { PlatformDiagnostics, ServiceProbe } from "@devin/types";
import { cn } from "@/lib/utils";

interface PlatformStatusPanelProps {
  onClose: () => void;
}

const backdropSpring = {
  type: "spring" as const,
  stiffness: 420,
  damping: 40,
  mass: 0.85,
};

const panelSpring = {
  type: "spring" as const,
  stiffness: 380,
  damping: 34,
  mass: 0.9,
};

function serviceModeLabel(mode: PlatformDiagnostics["serviceMode"]): string {
  switch (mode) {
    case "brain":
      return "Brain (control plane)";
    case "worker":
      return "Execution worker";
    default:
      return "Standalone scheduler";
  }
}

function StatusRow({
  title,
  description,
  probe,
  okLabel = "Connected",
  failLabel = "Unreachable",
}: {
  title: string;
  description: string;
  probe?: ServiceProbe;
  okLabel?: string;
  failLabel?: string;
}) {
  const reachable = probe?.reachable ?? false;

  return (
    <div className="border-border bg-muted/30 rounded-none border px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-foreground text-[13px] font-medium">{title}</p>
          <p className="text-muted-foreground text-[11px]">{description}</p>
          {probe?.url ? (
            <p className="text-muted-foreground/75 mt-1 truncate font-mono text-[10px]">
              {probe.url}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-none border px-2.5 py-0.5 text-[11px] font-medium",
            reachable
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 text-destructive border-destructive/25",
          )}
        >
          {reachable ? okLabel : failLabel}
        </span>
      </div>
      {probe?.error ? (
        <p className="text-destructive mt-2 text-[11px] leading-relaxed">
          {probe.error}
        </p>
      ) : null}
    </div>
  );
}

export function AgentCapabilitiesPanel({ onClose }: PlatformStatusPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [platform, setPlatform] = useState<PlatformDiagnostics | null>(null);
  const [orchestrator, setOrchestrator] = useState<ServiceProbe | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchInfraDiagnostics()
      .then((diagnostics) => {
        if (!cancelled) {
          setPlatform(diagnostics.platform);
          setOrchestrator(diagnostics.orchestrator);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load platform status from the control plane");
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

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={backdropSpring}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="platform-status-title"
        className="border-border bg-card text-card-foreground w-full max-w-[520px] rounded-none border p-5 shadow-2xl"
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={panelSpring}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Activity className="text-primary mt-0.5 size-5 shrink-0" />
            <div>
              <h3
                id="platform-status-title"
                className="text-foreground font-heading text-[16px] font-semibold"
              >
                Platform status
              </h3>
              <p className="text-muted-foreground mt-1 text-[13px]">
                Sessions run through the brain control plane. Agent credentials
                stay on the execution host — never in the browser.
              </p>
            </div>
          </div>
          <MotionButton
            type="button"
            pressStyle="icon"
            onClick={onClose}
            className="text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer rounded-none p-1 transition-colors"
            aria-label="Close"
          >
            <X className="size-4" />
          </MotionButton>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground mt-5 flex items-center gap-2 text-[13px]">
            <Loader2 className="text-primary size-4 animate-spin" />
            Checking control plane…
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {platform ? (
              <div className="border-border bg-muted/30 rounded-none border px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-foreground text-[13px] font-medium">
                      {serviceModeLabel(platform.serviceMode)}
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      Default agent: {platform.defaultAgent}
                      {platform.preferredHost
                        ? ` · host ${platform.preferredHost}`
                        : null}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-none border px-2.5 py-0.5 text-[11px] font-medium",
                      platform.durable
                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    )}
                  >
                    {platform.durable ? "Durable sessions" : "In-memory"}
                  </span>
                </div>
              </div>
            ) : null}

            {platform?.serviceMode === "brain" ? (
              <StatusRow
                title="Execution worker"
                description="Runs devboxes and agent CLIs on the execution host"
                probe={platform.executionWorker}
                okLabel="Ready"
                failLabel="Not reachable"
              />
            ) : null}

            <StatusRow
              title="Orchestrator"
              description="Provisions Firecracker sandboxes for devbox sessions"
              probe={orchestrator ?? undefined}
            />
          </div>
        )}

        <div className="border-border bg-muted/40 mt-5 rounded-none border p-3">
          <p className="text-foreground font-heading text-[12px] font-medium">
            How sessions work
          </p>
          <ol className="text-muted-foreground mt-2 list-decimal space-y-1.5 pl-4 text-[12px] leading-relaxed">
            <li>
              The web UI talks to the API server, which forwards tasks to the
              brain control plane.
            </li>
            <li>
              Brain persists sessions in Postgres and delegates sandbox work to
              the execution worker.
            </li>
            <li>
              Cursor or Claude runs inside the devbox microVM — credentials are
              configured on the execution host only.
            </li>
          </ol>
        </div>

        {error ? (
          <p className="text-destructive mt-3 text-[12px]">{error}</p>
        ) : null}

        <div className="mt-5 flex justify-end">
          <MotionButton
            type="button"
            onClick={onClose}
            className="border-input bg-background text-foreground hover:bg-muted cursor-pointer rounded-none border px-4 py-2 text-[13px] font-medium transition-colors"
          >
            Close
          </MotionButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
