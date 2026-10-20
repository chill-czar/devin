"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Product", href: "#" },
  { label: "Solutions", href: "#" },
  { label: "Customers", href: "#" },
  { label: "Resources", href: "#" },
  { label: "Pricing", href: "#" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 px-4 pt-3 sm:px-6 lg:px-8">
      <div
        className={cn(
          "mx-auto flex h-14 max-w-5xl items-center justify-between rounded-none px-4 transition-all duration-300 sm:px-6",
          scrolled
            ? "border-border bg-background/80 border shadow-xs backdrop-blur-md"
            : "bg-transparent",
        )}
      >
        <Link href="/" className="text-foreground flex items-center">
          <Logo size={26} />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="#"
            className="text-muted-foreground hover:text-foreground hidden text-sm font-medium transition-colors sm:inline"
          >
            Contact sales
          </Link>
          <Link
            href="#"
            className={cn(
              "border-border bg-card hidden rounded-none border px-4 py-2",
              "text-foreground hover:bg-muted text-sm font-medium shadow-xs transition-colors sm:inline",
            )}
          >
            Download
          </Link>
          <Link
            href="/login"
            className={cn(
              "bg-primary text-primary-foreground rounded-none px-4 py-2 text-sm font-medium shadow-xs",
              "hover:bg-primary/90 transition-colors",
            )}
          >
            Try Devin
          </Link>
        </div>
      </div>
    </header>
  );
}
