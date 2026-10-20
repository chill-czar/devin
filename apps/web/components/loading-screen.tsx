import { cn } from "@/lib/utils";
import { LoadingLogo } from "@/components/dashboard/loading-logo";

interface LoadingScreenProps {
  className?: string;
  logoSize?: number;
}

export function LoadingScreen({
  className,
  logoSize = 56,
}: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "bg-background text-foreground flex min-h-screen items-center justify-center",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <LoadingLogo size={logoSize} />
    </div>
  );
}
