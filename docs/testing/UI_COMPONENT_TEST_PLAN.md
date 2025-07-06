# UI Component Test Plan

This document describes how to expand the UI testing framework to cover every component in the Omnia component library. Use it alongside [UI_TESTING.md](./UI_TESTING.md) for Playwright setup and [PLUGIN_TESTING.md](./PLUGIN_TESTING.md) for plugin-specific patterns.

---

## 1. Goals

- Validate user facing behaviour for each component
- Simulate real interactions: clicks, hover, keyboard navigation
- Ensure accessibility attributes are present
- Verify visual states (active, disabled, error) using class changes or screenshots

## 2. Tooling

- **React Testing Library + Jest** for component tests
- **userEvent** helpers for realistic interaction
- **Playwright** for end‑to‑end flows and hover/screenshot checks

Tests should be written following TDD as mandated in `AGENTS.md` – write a failing test before implementing or refactoring a component.

## 3. General Approach

1. Render the component via React Testing Library
2. Interact with the component using `userEvent`
3. Assert visible changes, emitted events and accessibility roles
4. For hover/focus styles, verify CSS classes or capture screenshots with Playwright
5. Document edge cases and add regression tests when bugs are fixed

## 4. Component Coverage Matrix

Below is a high level checklist of behaviours to verify for each component. Use it to create individual test files under `tests/ui/components/`.

### Primitive Components

| Component      | Key Tests |
| -------------- | --------- |
| **Button**     | Renders text/children; calls `onClick`; applies variants & sizes; disabled state prevents clicks; hover/focus classes added |
| **Input**      | Renders label and helper text; accepts typing; error state styling; icon rendering; generates unique `id`; focus management |
| **Badge**      | Displays children; variant colours; size options |
| **ToggleSwitch** | Toggles checked state on click; calls `onChange`; keyboard activation; disabled state |

### Layout Components

| Component | Key Tests |
| --------- | --------- |
| **Card**  | Renders children; `onClick` invoked when interactive; elevation & hover classes applied when `elevated`/`interactive`; respects custom className |
| **Grid**  | Creates correct column count; gap sizes; responsive className passthrough |
| **Sidebar & SidebarItem** | Collapse/expand behaviour; item click callbacks; active item highlighting; icon rendering |

### Navigation Components

| Component | Key Tests |
| --------- | --------- |
| **AppNavigation** | Buttons render with labels and icons; highlights current view; invokes `onViewChange` on click or key press; accessibility roles |
| **AppHeader** | Displays title and optional actions; ensures semantic `<header>` element |

### Complex Components

| Component | Key Tests |
| --------- | --------- |
| **PluginCard** | Shows plugin info; status-based styling; toggle/configure/remove buttons fire callbacks; loading/error states |
| **DashboardPluginCard** | Entire card clickable when plugin active; hover animation; displays plugin metadata |
| **StatusBar** | Displays plugin counts and view label; hides counts on Dashboard; colour indicators for active/error plugins |
| **SettingsForm** | Generates fields from schema; validates input; calls `onSubmit` with values; change tracking via `onChange` |
| **SchemaForm** | Handles nested and array fields; validation errors shown; submit handler invoked |
| **AppSettings** | Renders settings sections; saves updates; displays success feedback |
| **PluginSettings** | Loads plugin schema; enable/disable actions; configuration validation |
| **SettingsPage** | Tab navigation between App, Plugin and System settings; preserves active tab; integrates other settings components |

### Other Components

Components like **FileScanner**, **JsonEditor**, **CommitPrompt** and plugin related UIs already have initial tests. Continue adding edge case coverage following the same approach.

## 5. Validation Strategy

- Run `npm test` to execute Jest suites
- Run `npm run test:ui` for Playwright scenarios
- Review Playwright screenshots and CSS dumps to catch visual regressions
- Use the generated HTML report (`playwright-report/`) to inspect failures
- CI should block merges when tests fail or coverage decreases

---

This plan serves as the starting point for comprehensive UI testing. Implement tests incrementally, keeping the test suite fast and focused on observable user behaviour.
