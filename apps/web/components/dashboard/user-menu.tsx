"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, LogOut, X } from "lucide-react";
import { MotionButton } from "@/components/dashboard/motion-button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  userName: string;
  collapsed?: boolean;
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "U";
}

const menuTransition = {
  duration: 0.24,
  ease: "easeIn" as const,
};

export function UserMenu({ userName, collapsed = false }: UserMenuProps) {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [logoutConfirmPending, setLogoutConfirmPending] = useState(false);

  useEffect(() => {
    if (!open) {
      setLogoutConfirmPending(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (
        target.closest("[data-user-menu]") ||
        target.closest("[data-user-menu-trigger]")
      ) {
        return;
      }
      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function toggleMenu() {
    if (open) {
      setOpen(false);
      setMenuPosition(null);
      return;
    }

    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 6,
      left: rect.left,
      width: Math.max(rect.width, 268),
    });
    setOpen(true);
  }

  async function handleLogout() {
    setIsSigningOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            setOpen(false);
            router.replace("/login");
          },
        },
      });
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <>
      <MotionButton
        ref={triggerRef}
        type="button"
        data-user-menu-trigger
        onClick={toggleMenu}
        className={cn(
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex cursor-pointer items-center gap-2 rounded-none px-1.5 py-1.5 text-left transition-colors",
          collapsed ? "justify-center" : "min-w-0 flex-1",
          open && "bg-sidebar-accent",
        )}
        aria-label={collapsed ? userName : undefined}
      >
        <span className="bg-primary/15 text-primary border-primary/25 flex size-6 shrink-0 items-center justify-center rounded-none border text-xs font-semibold">
          {getInitial(userName)}
        </span>
        {!collapsed ? (
          <>
            <span className="text-sidebar-foreground min-w-0 flex-1 truncate text-sm font-medium">
              {userName}
            </span>
            <ChevronDown
              className={cn(
                "text-muted-foreground size-3.5 shrink-0 transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </>
        ) : null}
      </MotionButton>

      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {open && menuPosition ? (
                <motion.div
                  data-user-menu
                  className="border-border bg-popover text-popover-foreground fixed z-[200] overflow-hidden rounded-none border shadow-xl"
                  style={{
                    top: menuPosition.top,
                    left: menuPosition.left,
                    width: menuPosition.width,
                  }}
                  initial={{ opacity: 0, scale: 0.96, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -4 }}
                  transition={menuTransition}
                >
                  <div className="flex items-start gap-3 px-4 py-4">
                    <span className="bg-primary/15 text-primary border-primary/25 flex size-10 shrink-0 items-center justify-center rounded-none border text-sm font-semibold">
                      {getInitial(userName)}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-popover-foreground truncate text-sm font-semibold">
                        {userName}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        Organization • 1 member
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                    <MotionButton
                      type="button"
                      className="bg-secondary text-secondary-foreground border-border/50 hover:bg-secondary/80 cursor-pointer rounded-none border px-3 py-2 text-xs font-medium transition-colors"
                    >
                      Settings
                    </MotionButton>
                    <MotionButton
                      type="button"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer rounded-none px-3 py-2 text-xs font-medium transition-colors"
                    >
                      Upgrade
                    </MotionButton>
                  </div>

                  <div className="border-border border-t py-1">
                    <MotionButton
                      type="button"
                      className="text-popover-foreground hover:bg-muted flex w-full cursor-pointer px-4 py-2 text-left text-sm transition-colors"
                    >
                      Create new organization
                    </MotionButton>
                    <div
                      className={cn(
                        "hover:bg-muted flex w-full items-center transition-colors",
                        logoutConfirmPending && "bg-muted/70",
                      )}
                    >
                      <MotionButton
                        type="button"
                        disabled={isSigningOut}
                        onClick={() => setLogoutConfirmPending(true)}
                        className="text-popover-foreground flex flex-1 cursor-pointer px-4 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSigningOut ? "Logging out…" : "Log out"}
                      </MotionButton>
                      {logoutConfirmPending && !isSigningOut ? (
                        <div className="flex items-center gap-0.5 pr-2">
                          <MotionButton
                            type="button"
                            pressStyle="icon"
                            onClick={() => void handleLogout()}
                            className="text-destructive hover:bg-destructive/15 cursor-pointer rounded-none p-1.5 transition-colors"
                            aria-label="Confirm log out"
                          >
                            <LogOut className="size-4" />
                          </MotionButton>
                          <MotionButton
                            type="button"
                            pressStyle="icon"
                            onClick={() => setLogoutConfirmPending(false)}
                            className="text-muted-foreground hover:bg-muted hover:text-popover-foreground cursor-pointer rounded-none p-1.5 transition-colors"
                            aria-label="Cancel log out"
                          >
                            <X className="size-4" />
                          </MotionButton>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
