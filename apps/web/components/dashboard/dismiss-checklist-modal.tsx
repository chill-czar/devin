"use client";

import { motion } from "motion/react";
import { MotionButton } from "@/components/dashboard/motion-button";

interface DismissChecklistModalProps {
  onCancel: () => void;
  onDismiss: () => void;
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

export function DismissChecklistModal({
  onCancel,
  onDismiss,
}: DismissChecklistModalProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={backdropSpring}
      onClick={onCancel}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dismiss-checklist-title"
        className="border-border bg-card text-card-foreground w-full max-w-[400px] rounded-none border p-5 shadow-2xl"
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={panelSpring}
        onClick={(event) => event.stopPropagation()}
      >
        <h3
          id="dismiss-checklist-title"
          className="text-foreground font-heading text-[16px] font-semibold"
        >
          Dismiss checklist?
        </h3>
        <p className="text-muted-foreground mt-2 text-[14px] leading-relaxed">
          This will hide the onboarding checklist. You can bring it back from
          your account settings.
        </p>

        <div className="mt-5 flex items-center justify-end gap-3">
          <MotionButton
            type="button"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer rounded-none px-3 py-1.5 text-[14px] transition-colors"
          >
            Cancel
          </MotionButton>
          <MotionButton
            type="button"
            pressStyle="primary"
            onClick={onDismiss}
            className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer rounded-none px-4 py-1.5 text-[14px] font-medium transition-colors"
          >
            Dismiss
          </MotionButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
