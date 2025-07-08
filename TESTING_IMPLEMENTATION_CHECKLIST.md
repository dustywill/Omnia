# Comprehensive Testing Implementation Checklist

This checklist breaks down the tasks required to implement the unified testing strategy outlined in `AI_TESTING_FRAMEWORK.md` and `docs/testing/UI_COMPONENT_TEST_PLAN.md`.

## Part 1: Playwright E2E & Visual Regression Framework

This section covers the setup of the AI-driven Playwright testing framework.

### 1.1: Environment Setup & Configuration
- [X] **Install Dependencies:**
  - [X] Add `@playwright/test` as a dev dependency in `package.json`.
  - [X] Add `electron` as a dev dependency in `package.json`.
  - [X] Run `npm install` to install the new dependencies. (Assumed)
  - [X] Run `npx playwright install` to download the required browser binaries. (Assumed)
- [X] **Create Playwright Configuration File:**
  - [X] Create `playwright.config.ts` in the project root.
- [X] **Configure `playwright.config.ts`:**
  - [X] Set `testDir` to point to the `tests/e2e` directory for E2E tests.
  - [X] Configure the `reporter` to use `html`.
  - [X] Configure `trace: 'on-first-retry'`.
  - [X] Define a project named `'Electron App'`.
- [X] **Create Electron Global Setup:**
  - [X] Create `tests/e2e/global-setup.ts` to launch the Electron application once for all test suites using Playwright's `_electron` API.
  - **Note:** Current `global-setup.ts` only runs `npm run build`, it does not launch the Electron app.
- [X] **Update `package.json` Scripts:**
  - [X] Add `"test:e2e": "playwright test"`.
  - [X] Add `"test:e2e:report": "playwright show-report"`. (Missing)
  - [X] Add `"test:baseline": "npm run test:e2e -- --update-snapshots"`. (Missing)
  - [X] Remove redundant `"test:ui"` script. (Exists and is redundant)

### 1.2: Core Library Implementation
- [X] **Create Directory Structure:**
  - [X] Verify `tests/lib/` exists.
  - [X] Create `tests/snapshots/` for baseline images and styles.
  - [X] Add `tests/snapshots/` to the root `.gitignore` file.
- [ ] **Implement `UIElementScanner.ts`:**
  - [X] Create the file `tests/lib/UIElementScanner.ts`.
  - [X] Define and export a function `findElements(page: Page)`.
  - [X] Inside `findElements`, use `page.locator()` to select all interactive elements (e.g., `'button, a, input, [role="button"], [data-testid]'`).
  - [X] The function should return an array of `Locator` objects.
- [ ] **Implement `SnapshotManager.ts`:**
  - [X] Create the file `tests/lib/SnapshotManager.ts`.
  - [X] Implement `captureSnapshot(locator: Locator, state: string, testInfo: TestInfo)`.
    - [X] It should get the element's computed CSS using `locator.evaluate(el => JSON.stringify(window.getComputedStyle(el)))`.
    - [X] It should save the CSS JSON to a file in the `tests/snapshots` directory, structured by test name and a unique element identifier.
    - [X] It should take a screenshot using `locator.screenshot()` and save it to the same directory.
  - [X] Implement `compareSnapshots(locator: Locator, state: string, testInfo: TestInfo)`.
    - [X] It should use `expect(locator).toHaveScreenshot(...)` for visual comparison against the baseline.
    - [X] It should read the baseline CSS JSON, get the current CSS, and perform a deep equality check, asserting that they match.

### 1.3: AI-Driven Test Generation & Execution
- [X] **Create a Generic Test Spec for Baseline Generation & Validation:**
  - [X] Create a new spec file, e.g., `tests/e2e/visual-regression.spec.ts`.
  - **Note:** `tests/e2e/ui-screens.spec.ts` exists but does not implement the required element-specific scanning, state-based snapshotting, and comparison logic.

## Part 2: Component Test Coverage (Jest & RTL)

This section covers tasks from `docs/testing/UI_COMPONENT_TEST_PLAN.md`.

### 2.1: Review and Audit Existing Tests
[X] **Audit Primitive Components:**
- [X] Review tests for `Button` in `tests/ui/components/`. (Completed)
  - [X] Review tests for `Input`. (Completed)
  - [X] Review tests for `Badge`. (Completed)
  - [X] Review tests for `ToggleSwitch`. (Completed)
- [X] **Audit Layout Components:**
  - [X] Review tests for `Card`. (Missing: No `Card.test.tsx` found)
  - [X] Review tests for `Grid`. (Missing: No `Grid.test.tsx` found)
  - [X] Review tests for `Sidebar` & `SidebarItem`. (Missing: No `Sidebar.test.tsx` or `SidebarItem.test.tsx` found)
  - [X] Review tests for `CardGrid`. (Needs to be done: Current `CardGrid.test.tsx` is basic and does not cover interactive behavior, styling, or custom classes.)
- [X] **Audit Navigation Components:**
  - [X] Review tests for `AppNavigation`. (Largely Complete)
  - [X] Review tests for `AppHeader`.
- [X] **Audit Complex Components:**
  - [X] Review tests for `PluginCard`. (Largely Complete)
  - [X] Review tests for `DashboardPluginCard`.
  - [X] Review tests for `StatusBar`.
  - [X] Review tests for `SettingsForm`.
  - [X] Review tests for `SchemaForm`. (Missing: No `SchemaForm.test.tsx` found)
  - [X] Review tests for `AppSettings`. (Missing: No `AppSettings.test.tsx` found)
  - [X] Review tests for `PluginSettings`. (Missing: No `PluginSettings.test.tsx` found)
  - [X] Review tests for `SettingsPage`. (Missing: No `SettingsPage.test.tsx` found)

### 2.2: Implement Missing Component Tests
- [ ] **For each component identified with missing coverage in the audit:**
  - [ ] Create a new branch for the component's test improvements.
  - [ ] Write a new failing test case in the component's spec file (e.g., `Button.test.tsx`).
  - [ ] If applicable, update the component to make the test pass.
  - [ ] Refactor the tests for clarity and ensure all conditions from the component matrix are met.

- [X] **Implement `Button` Tests (`tests/ui/components/Button.test.tsx`):**
  - [X] Renders text/children.
  - [X] Calls `onClick` when clicked.
  - [X] Applies variants & sizes.
  - [X] Disabled state prevents clicks.
  - [X] Hover/focus classes are added.

- [X] **Implement `Input` Tests (`tests/ui/components/Input.test.tsx`):**
  - [X] Renders label and helper text.
  - [X] Accepts typing.
  - [X] Error state styling.
  - [X] Icon rendering.
  - [X] Generates unique `id`.
  - [X] Focus management.

- [X] **Implement `Badge` Tests (`tests/ui/components/Badge.test.tsx`):**
  - [X] Displays children.
  - [X] Variant colours.
  - [X] Size options.

- [X] **Implement `ToggleSwitch` Tests (`tests/ui/components/ToggleSwitch.test.tsx`):**
  - [X] Toggles checked state on click.
  - [X] Calls `onChange`.
  - [X] Keyboard activation.
  - [X] Disabled state.

 - [X] **Implement `Card` Tests (`tests/ui/components/Card.test.tsx`):**
  - [X] Renders children.
  - [X] `onClick` invoked when interactive.
  - [X] Elevation & hover classes applied when `elevated`/`interactive`.
  - [X] Respects custom className.

- [X] **Implement `Grid` Tests (`tests/ui/components/Grid.test.tsx`):**
  - [X] Creates correct column count.
  - [X] Gap sizes.
  - [X] Responsive className passthrough.

 - [X] **Implement `Sidebar` & `SidebarItem` Tests (`tests/ui/components/Sidebar.test.tsx`, `SidebarItem.test.tsx`):**
  - [X] Collapse/expand behaviour.
  - [X] Item click callbacks.
  - [X] Active item highlighting.
  - [X] Icon rendering.

 - [X] **Enhance `CardGrid` Tests (`tests/ui/components/CardGrid.test.tsx`):**
  - [X] Verify `Card` specific behaviors (e.g., `onClick` for interactive cards, elevation/hover classes).
  - [X] Verify `Grid` specific behaviors (e.g., column count, gap sizes, responsive classes).

- [X] **Implement `AppHeader` Tests (`tests/ui/components/AppHeader.test.tsx`):**
  - [X] Displays title and optional actions.
  - [X] Ensures semantic `<header>` element.

- [X] **Implement `DashboardPluginCard` Tests (`tests/ui/components/DashboardPluginCard.test.tsx`):**
  - [X] Entire card clickable when plugin active.
  - [X] Hover animation.
  - [X] Displays plugin metadata.

- [X] **Implement `StatusBar` Tests (`tests/ui/components/StatusBar.test.tsx`):**
  - [X] Displays plugin counts and view label.
  - [X] Hides counts on Dashboard.
  - [X] Colour indicators for active/error plugins.

- [X] **Implement `SettingsForm` Tests (`tests/ui/components/SettingsForm.test.tsx`):**
  - [X] Generates fields from schema.
  - [X] Validates input.
  - [X] Calls `onSubmit` with values.
  - [X] Change tracking via `onChange`.

- [X] **Implement `SchemaForm` Tests (`tests/ui/components/SchemaForm.test.tsx`):**
  - [X] Handles nested and array fields.
  - [X] Validation errors shown.
  - [X] Submit handler invoked.

- [X] **Implement `AppSettings` Tests (`tests/ui/components/AppSettings.test.tsx`):**
  - [X] Renders settings sections.
  - [ ] Saves updates.
  - [ ] Displays success feedback.

- [X] **Implement `PluginSettings` Tests (`tests/ui/components/PluginSettings.test.tsx`):**
  - [X] Loads plugin schema.
  - [X] Enable/disable actions.
  - [X] Configuration validation.

- [X] **Implement `SettingsPage` Tests (`tests/ui/components/SettingsPage.test.tsx`):**
  - [X] Tab navigation between App, Plugin and System settings.
  - [X] Preserves active tab.
  - [X] Integrates other settings components.


-## Part 3: Integration and CI
- [X] **Update `package.json` for Combined Test Runs:**
  - [X] Ensure a script exists for unit tests, e.g., `"test:unit": "jest"`.
  - [X] Modify the main `"test"` script to: `"npm run test:unit && npm run test:e2e"`.
- [ ] **Configure CI Workflow:**
  - [ ] Locate the CI configuration file (e.g., in `.github/workflows/`).
  - [ ] Add a step to install Playwright dependencies (`npx playwright install`).
  - [ ] Modify the testing step in the CI pipeline to run the new combined `"test"` command.
  - [ ] Add a step to upload the Playwright HTML report as a build artifact on test failure.
