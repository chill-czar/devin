"use client";

import { AlertTriangle } from "lucide-react";
import type { InfraDiagnostics, Task, TaskDiagnostics } from "@devin/types";
import { cn } from "@/lib/utils";
import { formatAgentFailureMessage } from "@/lib/sessions/agent-activity";
import { CollapsiblePanel } from "./session-detail-panels";

export function DiagnosticsPanel({
  task,
  taskDiagnostics,
  infraDiagnostics,
  loading,
  error,
  onRefresh,
  defaultExpanded = false,
}: {
  task: Task;
  taskDiagnostics: TaskDiagnostics | null;
  infraDiagnostics: InfraDiagnostics | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  defaultExpanded?: boolean;
}) {
  const sandbox = taskDiagnostics?.sandbox;
  const host = infraDiagnostics?.firecrackerHost;

  return (
    <CollapsiblePanel
      title="Sandbox diagnostics"
      icon={AlertTriangle}
      iconClassName="text-amber-500"
      defaultExpanded={defaultExpanded}
      className="border-destructive/30 bg-destructive/5 text-card-foreground"
      headerRight={
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRefresh();
          }}
          disabled={loading}
          className="border-border text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer rounded-none border px-2.5 py-1 text-[11px] transition-colors disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      }
    >
      {task.message ? (
        <div className="mb-3 space-y-2">
          <p className="border-destructive/25 bg-destructive/10 text-destructive rounded-none border px-3 py-2 text-[12px] leading-relaxed">
            {formatAgentFailureMessage(task.message)}
          </p>
          {/database or disk is full/i.test(task.message) ? (
            <p className="text-muted-foreground text-[12px] leading-relaxed">
              The Cursor CLI could not write its session database inside the
              sandbox (disk full). On the execution host free space under{" "}
              <span className="text-foreground font-mono">/var/lib/devin</span>,
              remove stale sandboxes, and retry. This is not a web or API bug.
            </p>
          ) : null}
          {/clone golden rootfs|host disk full under|host disk guardrail/i.test(
            task.message ?? "",
          ) ? (
            <p className="text-muted-foreground text-[12px] leading-relaxed">
              The execution host ran out of disk while copying the golden rootfs
              into{" "}
              <span className="text-foreground font-mono">
                /var/lib/devin/vms
              </span>{" "}
              (not guest tmpfs). Free host space; firecracker also prunes orphan
              VM dirs on start and periodically. Ops:{" "}
              <span className="text-foreground font-mono">
                sudo devin-infra free-disk
              </span>{" "}
              on the execution host when available.
            </p>
          ) : /host active VM guardrail/i.test(task.message ?? "") ? (
            <p className="text-muted-foreground text-[12px] leading-relaxed">
              This execution host is at its microVM concurrency limit. Wait for
              an active sandbox to finish, or raise{" "}
              <span className="text-foreground font-mono">
                FIRECRACKER_MAX_ACTIVE_VMS
              </span>{" "}
              / add another host.
            </p>
          ) : /enospc|no space left on device/i.test(task.message) ? (
            <p className="text-muted-foreground text-[12px] leading-relaxed">
              The sandbox workspace tmpfs filled up (pip/npm caches, build
              artifacts). Retry the session — redeploy the runtime worker so
              tmpfs grows to 8G and automatic cache pruning is active. If it
              persists, free host disk under{" "}
              <span className="text-foreground font-mono">/var/lib/devin</span>.
            </p>
          ) : null}
          {/resource_exhausted/i.test(task.message) ? (
            <p className="text-muted-foreground text-[12px] leading-relaxed">
              The Cursor cloud agent ran out of temporary capacity mid-run. The
              control plane finalizes commits already on disk when possible;
              retry the session if the product is incomplete.
            </p>
          ) : null}
          {/agent credentials are not configured/i.test(task.message) ? (
            <p className="text-muted-foreground text-[12px] leading-relaxed">
              Agent credentials are managed on the execution host, not in the
              browser. Ask your platform admin to configure secrets, then open{" "}
              <span className="text-foreground font-medium">
                Platform status
              </span>{" "}
              on the dashboard to verify the brain and worker are connected.
            </p>
          ) : null}
          {/Runtime supervisor at .* did not become ready/i.test(
            task.message ?? "",
          ) ? (
            <p className="text-muted-foreground text-[12px] leading-relaxed">
              The execution host cannot reach the sandbox runtime on{" "}
              <span className="text-foreground font-mono">
                192.168.127.8:8081
              </span>
              . Guest network was likely stale — retry the task. If it persists,
              on the Firecracker host run{" "}
              <span className="text-foreground font-mono">
                sudo devin-infra fix-sandbox-dns
              </span>{" "}
              then{" "}
              <span className="text-foreground font-mono">
                sudo systemctl restart devin-firecracker.service
              </span>
              .
            </p>
          ) : /cannot reach orchestrator/i.test(task.message ?? "") ? (
            <p className="text-muted-foreground text-[12px] leading-relaxed">
              The scheduler cannot reach the orchestrator API. In EKS set{" "}
              <span className="text-foreground font-mono">
                ORCHESTRATOR_URL
              </span>{" "}
              to{" "}
              <span className="text-foreground font-mono">
                http://devin-orchestrator-lb.devin-system.svc:9090
              </span>
              , or on execution hosts run{" "}
              <span className="text-foreground font-mono">
                sudo devin-infra sync-platform-config
              </span>
              .
            </p>
          ) : null}
          {/Structure needs cleaning|guest filesystem corrupt|Bad message|cannot create \/tmp\/|cursor agent CLI is not runnable/i.test(
            task.message,
          ) ? (
            <p className="text-muted-foreground text-[12px] leading-relaxed">
              The sandbox root filesystem is corrupt (ext4{" "}
              <span className="text-foreground font-mono">
                Structure needs cleaning
              </span>{" "}
              or <span className="text-foreground font-mono">Bad message</span>
              ). On the execution host rebuild Firecracker snapshots:{" "}
              <span className="text-foreground font-mono">
                sudo devin-infra fix-guest-fs --discover
              </span>
              , then retry the task.
            </p>
          ) : null}
          {/task not found/i.test(task.message) ? (
            <p className="text-muted-foreground text-[12px] leading-relaxed">
              The execution worker could not load this task. Confirm{" "}
              <span className="text-foreground font-mono">DATABASE_URL</span> is
              set on the worker scheduler (
              <span className="text-foreground font-mono">
                sudo devin-infra sync-platform-config
              </span>
              ) and redeploy{" "}
              <span className="text-foreground font-mono">devin-brain</span> and
              the worker image, then retry.
            </p>
          ) : null}
          {/EXECUTION_WORKER_URL|worker rejected job|worker unavailable/i.test(
            task.message,
          ) ? (
            <p className="text-muted-foreground text-[12px] leading-relaxed">
              The brain control plane could not reach the execution worker.
              Check Platform status on the dashboard and confirm the worker
              scheduler is running on the execution host.
            </p>
          ) : null}
          {/timed out/i.test(task.message) ? (
            <p className="text-muted-foreground text-[12px] leading-relaxed">
              {/npm install timed out/i.test(task.message) ? (
                <>
                  Dependency install in the sandbox timed out. On the execution
                  host run{" "}
                  <span className="text-foreground font-mono">
                    sudo devin-infra fix-sandbox-dns
                  </span>{" "}
                  and confirm the microVM has outbound HTTPS (443) to the npm
                  registry.
                </>
              ) : /sandbox.*did not become ready/i.test(task.message) ? (
                <>
                  The sandbox never reached Running. Confirm{" "}
                  <span className="text-foreground font-mono">
                    SCHEDULER_HOST_NAME
                  </span>{" "}
                  matches your FirecrackerHost CR name, the orchestrator sandbox
                  controller is running, and the nextjs snapshot is built on the
                  execution host.
                </>
              ) : (
                <>
                  The task hit a timeout before finishing. For greenfield runs,
                  confirm{" "}
                  <span className="text-foreground font-mono">
                    SCHEDULER_HOST_NAME
                  </span>{" "}
                  matches your FirecrackerHost CR name, the orchestrator sandbox
                  controller is running, and the nextjs snapshot is built on the
                  execution host.
                </>
              )}
            </p>
          ) : null}
          {/cannot reach Cursor or GitHub/i.test(task.message) ? (
            <p className="text-muted-foreground text-[12px] leading-relaxed">
              The microVM sandbox has no outbound internet. Check Firecracker
              CNI NAT, DNS, and security group egress rules for HTTPS (443).
            </p>
          ) : null}
          {/Runtime request failed/i.test(task.message) ? (
            <p className="text-muted-foreground text-[12px] leading-relaxed">
              The scheduler could not talk to the runtime supervisor inside the
              microVM. Rebuild the agent snapshot, restart firecracker and
              scheduler, and confirm SCHEDULER_HOST_NAME matches the
              FirecrackerHost CR on this execution host.
            </p>
          ) : null}
          {/cannot reach the Cursor API/i.test(task.message) ? (
            <p className="text-muted-foreground text-[12px] leading-relaxed">
              The sandbox could not reach api2.cursor.sh. On the execution host
              run{" "}
              <span className="text-foreground font-mono">
                sudo devin-infra fix-sandbox-dns
              </span>{" "}
              (enables ip_forward + CNI DNS), restart firecracker and scheduler,
              then rebuild the agent snapshot.
            </p>
          ) : null}
          {/not available in range|failed to allocate|failed to create CNI network/i.test(
            task.message,
          ) ? (
            <p className="text-muted-foreground text-[12px] leading-relaxed">
              Sandbox networking failed while allocating the microVM IP. On the
              execution host run{" "}
              <span className="text-foreground font-mono">
                sudo devin-infra fix-sandbox-dns
              </span>
              , then restart firecracker and scheduler. If the error persists,
              redeploy the latest{" "}
              <span className="text-foreground font-mono">
                devin-firecracker
              </span>{" "}
              image on the host.
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="text-destructive mb-3 text-[12px]">{error}</p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="border-border bg-card rounded-none border p-3 shadow-xs">
          <p className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wide uppercase">
            Task sandbox
          </p>
          <dl className="space-y-1.5 text-[12px]">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="text-foreground font-mono">
                {taskDiagnostics?.sandboxName ?? task.sandboxName ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Phase</dt>
              <dd
                className={cn(
                  "font-medium",
                  sandbox?.phase === "Running"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400",
                )}
              >
                {sandbox?.phase ??
                  (task.sandboxName ? "Ended or not tracked" : "Not found")}
              </dd>
            </div>
            {!sandbox?.phase && task.sandboxName ? (
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                The orchestrator no longer lists this sandbox (common after
                failure or when the microVM was torn down). Infra below may
                still show snapshot availability for the next run.
              </p>
            ) : null}
            {sandbox?.message ? (
              <div>
                <dt className="text-muted-foreground mb-0.5">
                  Orchestrator message
                </dt>
                <dd className="text-foreground font-mono text-[11px] leading-relaxed">
                  {sandbox.message}
                </dd>
              </div>
            ) : null}
            {sandbox?.runtime ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Runtime image</dt>
                <dd className="text-foreground">{sandbox.runtime}</dd>
              </div>
            ) : null}
            {sandbox?.vmId ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">VM ID</dt>
                <dd className="text-foreground truncate font-mono">
                  {sandbox.vmId}
                </dd>
              </div>
            ) : null}
            {sandbox?.host ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Host</dt>
                <dd className="text-foreground">{sandbox.host}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="border-border bg-card rounded-none border p-3 shadow-xs">
          <p className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wide uppercase">
            Execution plane
          </p>
          <dl className="space-y-1.5 text-[12px]">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Orchestrator</dt>
              <dd
                className={cn(
                  infraDiagnostics?.orchestrator.reachable
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-destructive",
                )}
              >
                {infraDiagnostics?.orchestrator.reachable
                  ? "Reachable"
                  : "Unreachable"}
              </dd>
            </div>
            {infraDiagnostics?.orchestrator.error ? (
              <div>
                <dt className="text-muted-foreground mb-0.5">
                  Orchestrator error
                </dt>
                <dd className="text-destructive font-mono text-[11px]">
                  {infraDiagnostics.orchestrator.error}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Firecracker host</dt>
              <dd
                className={cn(
                  host?.reachable
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-destructive",
                )}
              >
                {host
                  ? host.reachable
                    ? "Reachable"
                    : "Unreachable"
                  : "Not configured"}
              </dd>
            </div>
            {host?.readyVMs !== undefined ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Warm microVMs</dt>
                <dd
                  className={cn(
                    host.readyVMs > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400",
                  )}
                >
                  {host.readyVMs}
                </dd>
              </div>
            ) : null}
            {host?.availableRuntimes && host.availableRuntimes.length > 0 ? (
              <div>
                <dt className="text-muted-foreground mb-0.5">
                  Snapshot runtimes
                </dt>
                <dd className="text-foreground font-mono text-[11px]">
                  {host.availableRuntimes.join(", ")}
                </dd>
              </div>
            ) : null}
            {host?.lastWarmError ? (
              <div>
                <dt className="text-muted-foreground mb-0.5">
                  Warm pool error
                </dt>
                <dd className="font-mono text-[11px] text-amber-600 dark:text-amber-400">
                  {host.lastWarmError}
                </dd>
              </div>
            ) : null}
            {host?.activeVMs !== undefined ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Active microVMs</dt>
                <dd className="text-foreground">
                  {host.activeVMs}
                  {host.maxActiveVMs ? ` / ${host.maxActiveVMs}` : ""}
                </dd>
              </div>
            ) : null}
            {host?.freeDiskGiB !== undefined ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Host free disk</dt>
                <dd className="text-foreground">
                  {host.freeDiskGiB.toFixed(1)} GiB
                  {host.minFreeDiskGiB ? ` (min ${host.minFreeDiskGiB})` : ""}
                </dd>
              </div>
            ) : null}
            {host?.error ? (
              <div>
                <dt className="text-muted-foreground mb-0.5">Host error</dt>
                <dd className="text-destructive font-mono text-[11px]">
                  {host.error}
                </dd>
              </div>
            ) : null}
            {infraDiagnostics ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Tracked sandboxes</dt>
                <dd className="text-foreground">
                  {infraDiagnostics.sandboxes.total}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>

      {task.status === "failed" && host?.lastWarmError ? (
        <p className="mt-3 text-[12px] leading-relaxed text-amber-600 dark:text-amber-400">
          Firecracker snapshot warm-up failed on the execution host:{" "}
          {host.lastWarmError}. Rebuild snapshots on the host or check{" "}
          <span className="font-mono">docker logs firecracker</span>.
        </p>
      ) : task.status === "failed" && host?.readyVMs === 0 ? (
        <p className="mt-3 text-[12px] leading-relaxed text-amber-600 dark:text-amber-400">
          No warm microVMs are available. The firecracker service may still be
          warming snapshots, snapshots may be missing for the requested runtime,
          or the host process may not be running.
        </p>
      ) : null}

      {task.status === "failed" &&
      infraDiagnostics &&
      !infraDiagnostics.orchestrator.reachable ? (
        <p className="mt-3 text-[12px] leading-relaxed text-amber-600 dark:text-amber-400">
          The scheduler cannot reach the orchestrator. Sandbox phase will never
          advance to Running until orchestrator connectivity is restored.
        </p>
      ) : null}
    </CollapsiblePanel>
  );
}
