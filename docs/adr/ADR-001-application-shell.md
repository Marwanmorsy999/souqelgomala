# ADR-001: Application Shell Architecture

- **Status:** Accepted
- **Date:** 2026-02
- **Deciders:** Engineering Team

## Context

The admin dashboard needs a persistent application shell that hosts all feature modules (orders, products, customers, …). The shell must support:

- RTL-first layout (Arabic)
- Desktop collapsible sidebar + mobile drawer
- Nested navigation with active-route highlighting
- Permission-aware and feature-flag-aware rendering
- Topbar with global search, notifications, user menu, theme toggle
- Future extension points: command palette, branch selector, AI assistant, realtime status
- Minimal enterprise aesthetic (Linear / Stripe / Vercel style), no heavy animation

The customer-facing store already renders its own full-page layout under the root `app/layout.tsx`. The admin surface must be visually and structurally independent while sharing the same design tokens.

## Decision

We will build a **client-side composition shell** under `app/admin/layout.tsx` composed of:

| Component | Responsibility |
|-----------|----------------|
| `AppShell` | Orchestrates sidebar + topbar + content, owns shell UI state, exposes extension slots |
| `AppSidebar` | Renders navigation tree from `src/config/sidebar.ts`, handles collapse/drawer/nested/keyboard |
| `Topbar` | Search trigger, notifications trigger, branch selector slot, theme toggle, user menu |
| `PageHeader` | Page title + description + actions + breadcrumbs |
| `Breadcrumbs` | Derives trail from route config + sidebar config |
| `ThemeToggle` | Light/dark via `next-themes` |

### Key decisions

1. **Config-driven navigation.** The sidebar renders entirely from `src/config/sidebar.ts`. New modules register there — no shell edits. This satisfies the "plugin/module injection without modifying existing code" requirement.
2. **Server-component friendly layout.** The admin layout stays a server component; only interactive subcomponents (`AppSidebar`, `Topbar`, `ThemeToggle`) are client components. Content pages are server components by default.
3. **No global client state for shell UI.** Sidebar collapse state is local UI state (per ENGINEERING.md §6.2). We deliberately avoid Zustand/Redux for shell chrome.
4. **Extension points as slots.** `AppShell` accepts render props / slot children for `searchTrigger`, `notificationTrigger`, `branchSelector`, `userMenu`, and `realtimeStatus`. Placeholders are rendered for now; real implementations (auth, notifications backend, search backend) land in later milestones.
5. **Mock providers, not business logic.** This milestone is UI-first. Permission and feature-flag rendering are wired to existing configs (`src/lib/permissions.ts`) with safe defaults; real auth/RBAC is a later milestone.
6. **Framer Motion usage is limited** to sidebar collapse, mobile drawer, and small page transitions — never tables/dashboards.

### Consequences

- **Positive:** clean separation between shell and features; features register in config and stay zero-coupled.
- **Positive:** RTL, theme, and responsive behavior are owned once, in the shell.
- **Trade-off:** the shell is a client component cluster, so admin pages are slightly less SSR-heavy than the customer store. Acceptable — admin is an authenticated app.
- **Trade-off:** some extension points are placeholders until auth/data milestones arrive.

## Alternatives Considered

- **Radix/Base UI Sidebar primitive:** rejected — custom layout is lightweight and RTL-native; the existing shadcn-style tokens already cover sidebar colors.
- **Server-only shell (no client JS):** rejected — collapse state, mobile drawer, and theme toggle require client interactivity.
- **Third-party admin template:** rejected — licensing, RTL customization cost, and control over enterprise aesthetics.

## References

- `docs/ARCHITECTURE.md` §5 (design system), §6 (state), §10 (phases)
- `ENGINEERING.md` §4 (component guidelines), §6 (hook rules)
- `src/config/sidebar.ts`, `src/config/routes.ts`, `src/lib/permissions.ts`

