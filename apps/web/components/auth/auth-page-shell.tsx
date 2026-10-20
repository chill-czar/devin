import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

interface AuthPageShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthPageShell({
  title,
  subtitle,
  children,
  footer,
}: AuthPageShellProps) {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px]">
        <div className="text-primary mb-8 flex justify-center">
          <Logo size={40} />
        </div>

        <div className="mb-8 text-center">
          <h1 className="font-heading text-foreground text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>
        </div>

        {children}

        {footer ? (
          <div className="text-muted-foreground mt-8 text-center text-sm">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AuthFooterLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-primary font-medium transition-colors hover:underline"
    >
      {children}
    </Link>
  );
}
