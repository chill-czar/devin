# Frontend Redesign Changes Summary

This document records all changes made during the frontend migration of the Devin web application (`apps/web`) to the new design system (Preset `b5rR41Mtnc`: Stone base, Orange theme, Zero radius, Oxanium headings, Outfit sans font).

---

## 1. Summary of Work Done
- Implemented exact OKLCH tokens for both `:root` (light) and `.dark` (dark mode) in `apps/web/app/globals.css`.
- Configured default theme to **light mode** with vibrant light orange accents (`oklch(0.553 0.195 38.402)`).
- Loaded official fonts `Oxanium` (Headings) and `Outfit` (Sans/Body) via HTML `<link>` tags in `<head>` within `apps/web/app/layout.tsx` to ensure reliable offline building.
- Converted all components across landing, authentication, dashboard, session workspace, devbox terminal, file explorer, and secondary views to **sharp zero-radius** (`rounded-none`).
- Replaced hardcoded `#hex`, `rgb`, `zinc-`, and arbitrary values with semantic CSS variables and design tokens.
- Fully preserved all props contracts, exports, event handlers, state logic, and routes.
- Strictly adhered to user constraint: **did not run `next build`**.

---

## 2. Tokens Introduced & Mapped

### Color Tokens (in `apps/web/app/globals.css`)
- `--primary`: Light orange `oklch(0.553 0.195 38.402)` (light) / `oklch(0.47 0.157 37.304)` (dark)
- `--primary-foreground`: Crisp high-contrast text `oklch(0.98 0.016 73.684)`
- `--background`: Clean white `oklch(1 0 0)` (light) / deep stone `oklch(0.147 0.004 49.25)` (dark)
- `--foreground`: Stone dark `oklch(0.147 0.004 49.25)` (light) / crisp stone `oklch(0.985 0.001 106.423)` (dark)
- `--card` / `--popover`: Surface white `oklch(1 0 0)` (light) / `oklch(0.216 0.006 56.043)` (dark)
- `--muted` / `--accent`: Warm stone `oklch(0.97 0.001 106.424)` (light) / `oklch(0.268 0.007 34.298)` (dark)
- `--border` / `--input`: Subtle divider `oklch(0.923 0.003 48.717)` (light) / `oklch(1 0 0 / 10%)` (dark)
- `--sidebar`: Light stone `oklch(0.985 0.001 106.423)` (light) / `oklch(0.216 0.006 56.043)` (dark)
- `--sidebar-primary`: Accent highlight `oklch(0.646 0.222 41.116)` (light) / `oklch(0.705 0.213 47.604)` (dark)
- `--radius`: `0` (enforcing zero border radius across all primitives and containers)

### Typography Tokens
- `--font-heading`: `'Oxanium', var(--font-sans), sans-serif`
- `--font-sans`: `'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

---

## 3. Files Changed by Category

### Foundations & Styling Configuration
- `apps/web/app/globals.css`: Wired `:root` and `.dark` design tokens, font family mapping, scrollbar tokens, animation keyframes.
- `apps/web/app/layout.tsx`: Added preconnect and stylesheet `<link>` tags for `Outfit` and `Oxanium` Google Fonts; configured `<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>`.

### UI Primitives (`apps/web/components/ui/`)
- `apps/web/components/ui/button.tsx`: Sharp zero-radius (`rounded-none`), primary orange styling with `hover:bg-primary/90`.
- `apps/web/components/ui/badge.tsx`: Sharp zero-radius, added `primaryLight` variant (`bg-primary/10 border-primary/25 text-primary`).
- `apps/web/components/ui/card.tsx`: Zero-radius card container with `border-border bg-card text-card-foreground`.
- `apps/web/components/ui/input.tsx`: Zero-radius input with `border-input bg-background focus-visible:border-primary`.
- `apps/web/components/ui/alert.tsx`: Zero-radius alerts with semantic border/fill token colors.

### Navigation & Layout Shell
- `apps/web/components/dashboard/dashboard-shell.tsx`: Converted canvas background to `bg-background text-foreground`.
- `apps/web/components/dashboard/sidebar.tsx`: Migrated from hardcoded `#111111` to `bg-sidebar text-sidebar-foreground border-sidebar-border`, active orange tab highlight, orange upgrade action button, zero-radius items.
- `apps/web/components/dashboard/user-menu.tsx`: Restyled popover menu, logout triggers, avatar to zero-radius and theme tokens.
- `apps/web/components/mode-toggle.tsx`: Converted theme toggle dropdown and icon buttons to design tokens and zero-radius.

### Auth & Loading Surfaces
- `apps/web/components/loading-screen.tsx`: Converted loading background to `bg-background text-foreground`.
- `apps/web/components/dashboard/loading-logo.tsx`: Replaced hardcoded `#353535` and `#d4d4d4` with theme tokens and dynamic orange shine sweep (`text-primary`).
- `apps/web/app/login/loading.tsx`: Cleaned loading state.
- `apps/web/components/auth/auth-page-shell.tsx`: Restyled auth container to `bg-card border-border shadow-sm rounded-none`.
- `apps/web/components/auth/auth-divider.tsx`: Updated divider border token.
- `apps/web/components/auth/login-form.tsx`: Updated inputs, form text, and primary orange "Send sign-in link" button.
- `apps/web/components/auth/social-auth-buttons.tsx`: Zero-radius provider buttons with theme borders.
- `apps/web/components/auth/local-dev-login.local.example.tsx`: Updated to zero radius and theme tokens.

### Marketing & Landing Surfaces
- `apps/web/app/page.tsx`: Changed wrapper to `bg-background text-foreground`, replaced obsolete `font-inter` with `font-sans`.
- `apps/web/components/header.tsx`: Updated nav links, login button to theme tokens and zero radius.
- `apps/web/components/hero.tsx`: Headings updated to `font-heading`, waitlist CTA button to primary orange with zero radius.
- `apps/web/components/customers-section.tsx`: Converted badges and metrics to theme tokens and zero radius.
- `apps/web/components/use-cases-section.tsx`: Section titles to `font-heading`, cards to `rounded-none border-border bg-card`.
- `apps/web/components/collaboration-section.tsx`: Restyled cards and tabs to zero radius and theme tokens.
- `apps/web/components/integrations-section.tsx`: Converted grid cards to zero radius and theme tokens.
- `apps/web/components/cta-section.tsx`: Converted CTA banner to zero radius, primary orange button.
- `apps/web/components/footer.tsx`: Converted footer links and borders to theme tokens.

### Dashboard Hub & Panels
- `apps/web/components/dashboard/prompt-composer-constants.ts`: Updated `workspaceShellClassName` to `rounded-none border-border bg-card text-card-foreground`.
- `apps/web/components/dashboard/prompt-composer.tsx`: Restyled composer card to zero radius and theme tokens.
- `apps/web/components/dashboard/prompt-composer-toolbar.tsx`: Updated action icons, options button, and primary orange send button.
- `apps/web/components/dashboard/prompt-metadata-bar.tsx`: Dropdown menus, repository selector, environment options, custom environment input styled with theme tokens and zero radius.
- `apps/web/components/dashboard/onboarding-panel.tsx`: Progress bar converted to primary orange, checklist items to `rounded-none`, orange badges.
- `apps/web/components/dashboard/dismiss-checklist-modal.tsx`: Modal dialog restyled to `rounded-none border-border bg-card`, orange Dismiss CTA.
- `apps/web/components/dashboard/github-permissions-panel.tsx`: Toggles, status badges, bot card, and connect button converted to theme tokens and zero radius.
- `apps/web/components/dashboard/agent-capabilities-panel.tsx`: Probe status rows, status tags, and action buttons converted to theme tokens and zero radius.

### Session Workspace & Live Components
- `apps/web/components/dashboard/session-page.tsx`: Diamond loader updated to `text-primary`, error state updated to `text-foreground` and `text-primary`.
- `apps/web/components/dashboard/session-detail.tsx`: Failure/sleeping banners converted to `rounded-none border-destructive/30`, confirmation to `border-primary/25 bg-primary/10`, action buttons to primary orange and emerald, morph overlay to `bg-card` and `Diamond text-primary`.
- `apps/web/components/dashboard/session-chat-column.tsx`: Converted message bubbles to `rounded-none border-border bg-muted/60`, UserAvatar to vibrant primary orange circular badge, devbox embed frame to zero radius card, composer form to zero radius border and orange send button, markdown code blocks and headings updated to design tokens.
- `apps/web/components/dashboard/session-code-column.tsx`: Tabs, active pulse dot to `bg-primary`, file search input to `rounded-none border-input bg-background`, file list sidebar to theme tokens.
- `apps/web/components/dashboard/session-code-helpers.tsx`: `TabButton` converted to `border-b-2 border-primary text-primary font-semibold`, `FileTreeRow` to orange active indicator, `ChangesStackPanel` to theme borders/cards, `CopyFileButton` to `rounded-none`.
- `apps/web/components/dashboard/session-desktop-panel.tsx`: `DesktopSnapshotAwaiting` styled with `rounded-none bg-card` and orange progress glow, snapshot/interactive segmented control and refresh buttons converted to zero-radius theme tokens, "Open Desktop" button converted to theme card and orange icon.
- `apps/web/components/dashboard/session-detail-panels.tsx`: `CollapsiblePanel`, `LiveWorkPanel`, `BotCoAuthorNote`, `GitHubProgressBanner`, and `EventRow` restyled to `rounded-none`, theme tokens, and primary orange links.
- `apps/web/components/dashboard/session-work-steps.tsx`: Shell source labels, loader spinners converted to `animate-spin text-primary`, zero radius and theme tokens.
- `apps/web/components/dashboard/session-syntax.tsx`: Diff added/modified lines converted to `bg-emerald-500/10` and `bg-destructive/10`, hunk header styled with theme tokens.
- `apps/web/components/dashboard/session-detail-diagnostics.tsx`: Diagnostics panel, alert banners, orchestrator/VM metrics table converted to `rounded-none border-border bg-card text-card-foreground`.
- `apps/web/components/dashboard/devbox-workspace.tsx`: Restyled devbox workspace outer shell, tabs, sleeping notification, interactive shell terminal, and file explorer to zero radius and theme tokens.
- `apps/web/components/dashboard/chat-launch-morph.tsx`: Converted morph overlay bubble to zero radius and theme tokens.

### Views & Shared Helpers
- `apps/web/components/dashboard/views/ask-view.tsx`: Converted Devin logo to `text-primary`, container to zero-radius, mode selector to theme popovers, deep mode toggle to orange, send button to `bg-primary`.
- `apps/web/components/dashboard/views/review-view.tsx`: Converted review container to `rounded-none border-border bg-card`, initial badge to orange, input to theme tokens, status rows to cards.
- `apps/web/components/dashboard/views/automations-view.tsx`: Converted title to `font-heading`, composer to `rounded-none bg-card`, tabs to orange active border, create button to `bg-primary`.
- `apps/web/components/dashboard/views/wiki-view.tsx`: Converted title to `font-heading`, search input to zero radius, repo cards to `rounded-none border-border bg-card`, generate button to `bg-primary`.
- `apps/web/components/ai-elements/chain-of-thought.tsx`: Converted image container to zero radius and border, BrainIcon to `text-primary`, badge to `rounded-none`.
- `apps/web/components/ai-elements/confirmation.tsx`: Converted alert container and confirmation actions to zero radius and theme tokens.
- `apps/web/components/prompt-kit/steps.tsx`: Converted triggers, bars, and content to theme tokens (`text-muted-foreground`, `hover:text-foreground`, `bg-border`).
- `apps/web/components/prompt-kit/source.tsx`: Converted shell command trigger and source links to zero radius, theme tokens, and `text-primary`.

---

## 4. Components Extracted or Refactored
- `apps/web/components/ui/card.tsx`: Standalone zero-radius card primitive created for shared use.
- `apps/web/components/ui/input.tsx`: Standalone zero-radius input primitive created for shared use.
- `Badge` variant `primaryLight`: Added for subtle light-theme accent tags without breaking existing badge variants.

---

## 5. Anything Intentionally Left Alone
- **Code Syntax Colors**: Syntax highlighting tokens in `session-syntax.tsx` (strings, keywords, types, numbers) were preserved with VSCode-style coloring for developer readability.
- **Git Blue Accent**: Git commit/branch icon color in `session-detail-utils.tsx` was preserved for semantic clarity.
- **Backend / Non-web files**: No changes to `apps/brain`, `apps/firecracker`, `packages/`, or any server-side business logic.
- **Build Scripts & Package Versions**: No dependencies were added or altered in `package.json`.

---

## 6. Verification
- **TypeScript**: Ran `tsc -p apps/web/tsconfig.json --noEmit` which completed with **zero errors** (Exit code 0).
- **Zero Radius Audit**: Full search for `rounded-(sm|md|lg|xl|2xl|3xl)` across `apps/web` confirmed **0 occurrences remaining**.
- **No Build Command Executed**: Honored the explicit user directive: "do not build ? just make changes".
