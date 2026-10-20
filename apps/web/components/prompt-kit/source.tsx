"use client";

import { useState, type ReactNode } from "react";
import { Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

export type ShellSourceProps = {
  command: string;
  label?: string;
  className?: string;
};

export function ShellSource({ command, label, className }: ShellSourceProps) {
  const [open, setOpen] = useState(false);
  const display = label ?? command;

  return (
    <span className={cn("inline-flex max-w-full align-middle", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground inline-flex max-w-full items-center gap-1 rounded-none border px-2 py-0.5 text-[11px] transition-colors"
      >
        <Terminal className="text-primary size-3 shrink-0" />
        <span className="truncate font-mono">{display}</span>
      </button>
      {open ? (
        <div className="border-border bg-muted/60 mt-1 w-full rounded-none border p-2">
          <pre className="text-foreground overflow-x-auto font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
            {command}
          </pre>
        </div>
      ) : null}
    </span>
  );
}

export type SourceProps = {
  href: string;
  children: ReactNode;
};

export function Source({ href, children }: SourceProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary inline-flex items-center gap-1 underline-offset-2 hover:underline"
    >
      {children}
    </a>
  );
}

export function SourceTrigger({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "border-border bg-muted/60 text-muted-foreground inline-flex items-center rounded-none border px-2 py-0.5 text-[11px]",
        className,
      )}
    >
      {label}
    </span>
  );
}
