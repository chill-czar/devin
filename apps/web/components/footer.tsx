import Link from "next/link";
import { Logo } from "@/components/logo";

const footerLinks = {
  Product: ["Features", "Pricing", "Devin Review", "DeepWiki", "API"],
  Solutions: ["Enterprise", "Startups", "Code migration", "On-call"],
  Resources: ["Blog", "Docs", "Changelog", "Status"],
  Company: ["About", "Careers", "Contact", "Privacy"],
};

export function Footer() {
  return (
    <footer className="border-border bg-background text-foreground border-t">
      <div className="mx-auto max-w-[90rem] px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link
              href="/"
              className="text-foreground flex items-center gap-2.5"
            >
              <Logo size={20} />
              <span className="font-heading text-sm font-semibold tracking-tight">
                Devin
              </span>
            </Link>
            <p className="text-muted-foreground mt-4 text-xs leading-relaxed">
              The AI software engineer that helps your team plan, code, review,
              and ship faster.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-heading text-foreground text-xs font-semibold tracking-wider uppercase">
                {category}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-muted-foreground hover:text-foreground text-xs transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-border mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Devin. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Terms
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
