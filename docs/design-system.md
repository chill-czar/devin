# Devin Design System Specification

## Overview
This design system implements shadcn preset `b5rR41Mtnc`:
- **Base Palette**: Stone
- **Theme Color**: Vibrant Light Orange (`oklch(0.553 0.195 38.402)`)
- **Chart Palette**: Orange scale
- **Border Radius**: Sharp Zero Radius (`--radius: 0`, `rounded-none`)
- **Heading Font**: `Oxanium` (`--font-heading`)
- **Body / Sans Font**: `Outfit` (`--font-sans`)
- **Default Theme**: Light Mode (with seamless Dark Mode support via `.dark`)

---

## 1. Color Tokens (OKLCH)

### Light Theme (`:root`)
| Token | OKLCH Value | Role / Usage |
|---|---|---|
| `--background` | `oklch(1 0 0)` | Page background canvas (clean white) |
| `--foreground` | `oklch(0.147 0.004 49.25)` | High contrast body text |
| `--card` | `oklch(1 0 0)` | Surface cards and panels |
| `--card-foreground` | `oklch(0.147 0.004 49.25)` | Text on card surfaces |
| `--popover` | `oklch(1 0 0)` | Dropdown menus, popovers, and tooltips |
| `--popover-foreground`| `oklch(0.147 0.004 49.25)` | Text inside popovers |
| `--primary` | `oklch(0.553 0.195 38.402)` | **Primary Orange Accent** (action buttons, highlights, badges) |
| `--primary-foreground`| `oklch(0.98 0.016 73.684)` | Contrast text on primary orange buttons |
| `--secondary` | `oklch(0.967 0.001 286.375)` | Subtle secondary buttons and tags |
| `--secondary-foreground`| `oklch(0.21 0.006 285.885)` | Text on secondary elements |
| `--muted` | `oklch(0.97 0.001 106.424)` | Warm stone muted backgrounds, tab tracks |
| `--muted-foreground` | `oklch(0.553 0.013 58.071)` | Secondary/meta text, icons, captions |
| `--accent` | `oklch(0.97 0.001 106.424)` | Hover states on interactive items |
| `--accent-foreground`| `oklch(0.216 0.006 56.043)`| Text on active/hovered accent items |
| `--destructive` | `oklch(0.577 0.245 27.325)` | Destructive buttons, errors, failure alerts |
| `--border` | `oklch(0.923 0.003 48.717)` | Subtle card, input, and divider borders |
| `--input` | `oklch(0.923 0.003 48.717)` | Form controls and text fields |
| `--ring` | `oklch(0.709 0.01 56.259)` | Focus visible rings |
| `--sidebar` | `oklch(0.985 0.001 106.423)`| Navigation sidebar surface |
| `--sidebar-foreground`| `oklch(0.147 0.004 49.25)` | Sidebar link and icon colors |
| `--sidebar-primary` | `oklch(0.646 0.222 41.116)` | Active navigation highlight |
| `--sidebar-border` | `oklch(0.923 0.003 48.717)` | Sidebar right border divider |

### Dark Theme (`.dark`)
| Token | OKLCH Value | Role / Usage |
|---|---|---|
| `--background` | `oklch(0.147 0.004 49.25)` | Deep stone dark canvas |
| `--foreground` | `oklch(0.985 0.001 106.423)`| Crisp light body text |
| `--card` | `oklch(0.216 0.006 56.043)` | Elevated cards and floating panels |
| `--primary` | `oklch(0.47 0.157 37.304)` | Warm dark orange accent |
| `--primary-foreground`| `oklch(0.98 0.016 73.684)` | Contrast text on dark primary |
| `--border` | `oklch(1 0 0 / 10%)` | Subtle translucent dark border |
| `--sidebar` | `oklch(0.216 0.006 56.043)` | Dark sidebar surface |

---

## 2. Typography

- **Heading Font**: `Oxanium` (Google Font loaded in `layout.tsx`). Applied via `font-heading` to brand titles, modal headers, major section headlines, and section labels.
- **Body / Interface Font**: `Outfit` (Google Font loaded in `layout.tsx`). Applied via `font-sans` or base `body` styles for UI copy, tables, forms, and message text.
- **Monospace Font**: System monospace (`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`) for code snippets, terminal streams, file paths, diff viewers, and hash indicators.

---

## 3. Radius & Geometry

- **Global Radius**: Strictly `--radius: 0`.
- All buttons, input fields, cards, popovers, dropdown menus, modal dialogs, and code blocks use **sharp zero-radius** (`rounded-none`).
- Circular elements are reserved strictly for functional indicator dots (e.g., status pulses, user avatars, spinners).

---

## 4. UI Components and Variants

### Button (`apps/web/components/ui/button.tsx`)
- `default`: `bg-primary text-primary-foreground hover:bg-primary/90 rounded-none shadow-none`
- `outline`: `border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-none`
- `secondary`: `bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-none`
- `ghost`: `hover:bg-accent hover:text-accent-foreground rounded-none`
- `destructive`: `bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-none`

### Input (`apps/web/components/ui/input.tsx`)
- Sharp borders (`rounded-none border-input bg-background`), focus ring `focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary`.

### Badge (`apps/web/components/ui/badge.tsx`)
- `default`: `bg-primary text-primary-foreground rounded-none`
- `primaryLight`: `bg-primary/10 border-primary/25 text-primary rounded-none font-medium` (designed for light theme tags)
- `secondary`: `bg-secondary text-secondary-foreground rounded-none`
- `outline`: `border-border text-foreground rounded-none`

### Card (`apps/web/components/ui/card.tsx`)
- `rounded-none border border-border bg-card text-card-foreground shadow-sm`

### Interactive Tabs
- Active state styled with `border-b-2 border-primary text-primary font-semibold` and `bg-primary/10` subtle highlight for clear light-mode focus.

---

## 5. Light Mode Accent Strategy
To ensure the light orange color identity is clean, modern, and prominent throughout light mode:
1. **Primary actions**: Solid `bg-primary` with `text-primary-foreground` and hover micro-transitions.
2. **Active indicators**: `border-primary` bottom tabs, left-rail active markers, and status dots.
3. **Accent tags & cards**: `bg-primary/10` warm tint with `border-primary/25` border and `text-primary` typography.
4. **Interactive sweeps**: Loading and progress indicators (e.g. `LoadingLogo`, `Diamond`) sweep in vivid `text-primary`.
