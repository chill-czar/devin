"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileCode2, Globe, Loader2, Play, Terminal } from "lucide-react";
import { MotionButton } from "@/components/dashboard/motion-button";
import {
  listTaskFiles,
  readTaskFile,
  runTaskTerminalStream,
  wakeSession,
  fetchTask,
} from "@/lib/api/tasks";
import type { Task } from "@devin/types";
import { canUseDevbox } from "@/lib/sessions/devbox";
import { SessionDesktopPanel } from "@/components/dashboard/session-desktop-panel";
import { cn } from "@/lib/utils";

type WorkspaceTab = "shell" | "files" | "browser";

interface DevboxWorkspaceProps {
  task: Task;
  onTaskChange?: (task: Task) => void;
  layout?: "card" | "panel";
  defaultTab?: WorkspaceTab;
}

interface FileEntry {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
}

export function DevboxWorkspace({
  task,
  onTaskChange,
  layout = "card",
  defaultTab = "shell",
}: DevboxWorkspaceProps) {
  const canUse = canUseDevbox(task);

  const [tab, setTab] = useState<WorkspaceTab>(defaultTab);
  const [waking, setWaking] = useState(false);
  const [wakeError, setWakeError] = useState<string | null>(null);

  const handleWake = useCallback(async () => {
    setWaking(true);
    setWakeError(null);
    try {
      const updated = await wakeSession(task.id);
      onTaskChange?.(updated);
      void fetchTask(task.id)
        .then(onTaskChange)
        .catch(() => undefined);
    } catch (error) {
      setWakeError(error instanceof Error ? error.message : "Wake failed");
    } finally {
      setWaking(false);
    }
  }, [task.id, onTaskChange]);

  if (!canUse) {
    return (
      <div
        className={cn(
          "border-border bg-card/50 flex flex-col items-center justify-center rounded-none border border-dashed px-6 py-12 text-center",
          layout === "panel" ? "min-h-[200px] flex-1" : "mb-4",
        )}
      >
        <FileCode2 className="text-muted-foreground mb-3 size-8" />
        <p className="text-foreground text-[13px] font-medium">
          Devbox workspace
        </p>
        <p className="text-muted-foreground mt-1 max-w-sm text-[12px]">
          Files and shell unlock once the sandbox is running.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden",
        layout === "panel"
          ? "border-border bg-card min-h-[240px] flex-1 rounded-none border"
          : "border-border bg-card mb-4 rounded-none border",
      )}
    >
      <div
        className={cn(
          "border-border flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5",
        )}
      >
        <div className="flex items-center gap-1">
          <WorkspaceTabButton
            active={tab === "shell"}
            onClick={() => setTab("shell")}
            icon={Terminal}
            label="Shell"
          />
          <WorkspaceTabButton
            active={tab === "files"}
            onClick={() => setTab("files")}
            icon={FileCode2}
            label="Files"
          />
          <WorkspaceTabButton
            active={tab === "browser"}
            onClick={() => setTab("browser")}
            icon={Globe}
            label="Browser"
          />
        </div>
        {task.sessionSleeping ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-amber-500">Devbox sleeping</span>
            <MotionButton
              type="button"
              onClick={() => void handleWake()}
              disabled={waking}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-none border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-600 hover:bg-amber-500/20 disabled:opacity-60 dark:text-amber-400"
            >
              {waking ? <Loader2 className="size-3 animate-spin" /> : null}
              Wake devbox
            </MotionButton>
          </div>
        ) : null}
      </div>

      {wakeError ? (
        <p className="border-border text-destructive border-b px-4 py-2 text-[12px]">
          {wakeError}
        </p>
      ) : null}

      {tab === "shell" ? (
        <InteractiveShell taskId={task.id} disabled={task.sessionSleeping} />
      ) : null}
      {tab === "files" ? (
        <FileExplorer taskId={task.id} disabled={task.sessionSleeping} />
      ) : null}
      {tab === "browser" ? (
        <SessionDesktopPanel task={task} layout="embed" />
      ) : null}
    </div>
  );
}

function WorkspaceTabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Terminal;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-none px-2.5 py-1.5 text-[12px] font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary border-primary border-b-2"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}

function InteractiveShell({
  taskId,
  disabled,
}: {
  taskId: string;
  disabled?: boolean;
}) {
  const [command, setCommand] = useState("");
  const [lines, setLines] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const runCommand = useCallback(async () => {
    const trimmed = command.trim();
    if (!trimmed || disabled) {
      return;
    }

    setRunning(true);
    setLines((prev) => [...prev, `$ ${trimmed}`]);

    try {
      await runTaskTerminalStream(taskId, trimmed, (event) => {
        if (event.type === "terminal.output") {
          const prefix = event.data.stream === "stderr" ? "[stderr] " : "";
          setLines((prev) => [...prev, `${prefix}${event.data.line}`]);
        }
        if (event.type === "terminal.done") {
          if (event.data.exitCode !== 0) {
            setLines((prev) => [...prev, `[exit ${event.data.exitCode}]`]);
          }
        }
        if (event.type === "terminal.error") {
          setLines((prev) => [...prev, `[error] ${event.data.error}`]);
        }
      });
    } catch (error) {
      setLines((prev) => [
        ...prev,
        error instanceof Error ? error.message : "Command failed",
      ]);
    } finally {
      setRunning(false);
      setCommand("");
    }
  }, [command, disabled, taskId]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines.length]);

  return (
    <div className="flex flex-col">
      <div
        ref={outputRef}
        className="bg-muted/40 text-foreground max-h-[320px] min-h-[180px] overflow-auto p-3 font-mono text-[12px] leading-relaxed"
      >
        {lines.length === 0 ? (
          <p className="text-muted-foreground">
            Run shell commands in the live devbox (repo cwd).
          </p>
        ) : (
          lines.map((line, index) => (
            <div
              key={`${index}-${line.slice(0, 24)}`}
              className={cn(
                "whitespace-pre-wrap",
                line.startsWith("$")
                  ? "text-primary font-medium"
                  : "text-foreground",
              )}
            >
              {line}
            </div>
          ))
        )}
      </div>
      <div className="border-border flex gap-2 border-t p-3">
        <input
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void runCommand();
            }
          }}
          disabled={disabled || running}
          placeholder={
            disabled ? "Wake devbox to run commands…" : "Enter command…"
          }
          className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-ring min-w-0 flex-1 rounded-none border px-3 py-2 font-mono text-[12px] outline-none disabled:opacity-60"
        />
        <MotionButton
          type="button"
          onClick={() => void runCommand()}
          disabled={disabled || running || !command.trim()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-none px-3 py-2 text-[12px] font-medium disabled:opacity-60"
        >
          {running ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Play className="size-3.5" />
          )}
          Run
        </MotionButton>
      </div>
    </div>
  );
}

function FileExplorer({
  taskId,
  disabled,
}: {
  taskId: string;
  disabled?: boolean;
}) {
  const [path, setPath] = useState("repo");
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDir = useCallback(
    async (nextPath: string) => {
      if (disabled) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await listTaskFiles(taskId, nextPath);
        setPath(result.path);
        setEntries(result.items);
        setSelected(null);
        setContent("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to list files");
      } finally {
        setLoading(false);
      }
    },
    [disabled, taskId],
  );

  useEffect(() => {
    void loadDir("repo");
  }, [loadDir]);

  const openFile = useCallback(
    async (entry: FileEntry) => {
      if (entry.isDir) {
        void loadDir(entry.path);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const file = await readTaskFile(taskId, entry.path);
        setSelected(entry.path);
        setContent(file.content);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to read file");
      } finally {
        setLoading(false);
      }
    },
    [loadDir, taskId],
  );

  return (
    <div className="grid min-h-[280px] flex-1 grid-cols-1 lg:grid-cols-[minmax(140px,34%)_1fr]">
      <div className="border-border border-b lg:border-r lg:border-b-0">
        <div className="border-border flex items-center justify-between border-b px-3 py-2">
          <span className="text-muted-foreground truncate font-mono text-[11px]">
            /workspace/{path}
          </span>
          {loading ? (
            <Loader2 className="text-muted-foreground size-3.5 animate-spin" />
          ) : null}
        </div>
        <div className="max-h-none min-h-[200px] flex-1 overflow-auto p-2 lg:max-h-[min(50vh,420px)]">
          {disabled ? (
            <p className="text-muted-foreground px-2 py-3 text-[12px]">
              Wake devbox to browse files.
            </p>
          ) : error ? (
            <p className="text-destructive px-2 py-3 text-[12px]">{error}</p>
          ) : (
            entries.map((entry) => (
              <button
                key={entry.path}
                type="button"
                onClick={() => void openFile(entry)}
                className={cn(
                  "hover:bg-muted flex w-full cursor-pointer items-center gap-2 rounded-none px-2 py-1.5 text-left text-[12px] transition-colors",
                  selected === entry.path
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground",
                )}
              >
                <span className="truncate font-mono">
                  {entry.isDir ? `${entry.name}/` : entry.name}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
      <div className="bg-muted/30 min-h-[200px] flex-1 overflow-auto p-3 lg:max-h-[min(50vh,420px)]">
        {selected ? (
          <pre className="text-foreground font-mono text-[12px] leading-relaxed whitespace-pre-wrap">
            {content}
          </pre>
        ) : (
          <p className="text-muted-foreground text-[12px]">
            Select a file to preview.
          </p>
        )}
      </div>
    </div>
  );
}
