export const MIN_TEXTAREA_HEIGHT = 72;

export const CHAT_COLUMN_WIDTH = 395;

export const workspaceShellClassName =
  "overflow-hidden rounded-none border border-border bg-card text-card-foreground shadow-md transition-colors";

/** Smooth decelerate — avoids harsh stops. */
export const chatLaunchEase = [0.16, 1, 0.3, 1] as const;

export const chatLaunchTransition = {
  duration: 0.55,
  ease: chatLaunchEase,
} as const;

/** Wait for expand to finish before routing. */
export const CHAT_MORPH_MS = 560;

/** Hold workspace diamond before crossfade. */
export const CHAT_MORPH_HANDOFF_MS = 280;

/** Crossfade overlay → real panels. */
export const CHAT_MORPH_FADE_MS = 200;

export const textareaSpring = {
  type: "spring" as const,
  stiffness: 420,
  damping: 32,
  mass: 0.85,
};

export const agentOptions = [
  {
    id: "brain" as const,
    label: "Brain",
    description: "OpenAI on control plane — Devbox tools over gRPC",
  },
] as const;

export type AgentId = (typeof agentOptions)[number]["id"];

export type RepoMode = "existing" | "create";

export type MorphRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};
