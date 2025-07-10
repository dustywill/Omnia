# AI-Driven Testing Framework Plan

## 1. Overview & Goals

The primary goal is to create an automated, AI-driven testing framework that complements the existing component test suite. This framework will use Playwright to perform end-to-end (E2E) and visual regression testing, allowing an AI developer to validate changes, catch unexpected UI bugs, and ensure application stability.

This plan should be used in conjunction with the existing `docs/testing/UI_COMPONENT_TEST_PLAN.md`, which covers component-level testing with React Testing Library and Jest.

## 2. Core Technologies

- **E2E & Visual Regression:** Playwright
- **Component Testing:** React Testing Library + Jest
- **Language:** TypeScript
- **Application Target:** Electron

## 3. Proposed Project Structure

To keep the testing framework organized, the following structure will be created within the `Omnia` project:

```
/Omnia
|-- /tests/
|   |-- /lib/
|   |   |-- UIElementScanner.ts   # Discovers interactive elements on a page
|   |   |-- SnapshotManager.ts    # Handles saving/comparing screenshots and styles
|   |-- /specs/                 # Auto-generated test files will go here
|   |-- /snapshots/             # Baseline screenshots and style data
|   |   |-- /<view_name>/
|   |   |   |-- /<element_id>/
|   |   |   |   |-- base.png
|   |   |   |   |-- base.json
|   |   |   |   |-- hover.png
|   |   |   |   |-- hover.json
|   |-- playwright.config.ts      # Playwright configuration
|-- AI_TESTING_FRAMEWORK.md     # This documentation
... (rest of the project files)
```

## 4. Implementation Plan

### Phase 1: Configuration

1.  **Install Playwright:** Add Playwright and its dependencies to `package.json`.
2.  **Configure `playwright.config.ts`:**
    *   Set up the test runner to launch the Electron application.
    *   Define the `testDir` to point to the `/tests/specs` directory.
    *   Configure screenshot and trace settings for optimal debugging.
    *   Set up a project configuration specifically for the Electron app.

### Phase 2: Core Library (`/tests/lib`)

1.  **`UIElementScanner.ts`:**
    *   This module will contain a function that accepts a Playwright `page` object.
    *   It will traverse the DOM to find all "interactive" elements (e.g., `button`, `a`, `input`, elements with `role` attributes or `data-testid`).
    *   It will return an array of locators or unique selectors for each discovered element.

2.  **`SnapshotManager.ts`:**
    *   **`captureSnapshot(page, elementLocator, state)`:** This function will:
        1.  Take a screenshot of the specific element and save it.
        2.  Use `locator.evaluate()` to execute `window.getComputedStyle()` on the element in the browser context.
        3.  Save the resulting CSS properties as a JSON file.
        4.  The `state` parameter (e.g., 'base', 'hover', 'active') will determine the filenames (`base.png`, `hover.json`).
    *   **`compareSnapshots(page, elementLocator, state)`:** This function will:
        1.  Capture a new snapshot.
        2.  Use Playwright's built-in `expect(page).toHaveScreenshot()` for pixel-perfect image comparison.
        3.  Read the baseline and new style JSON files and perform a deep object comparison to detect style changes.

### Phase 3: AI-Driven Workflow & Scripts

This is how the AI developer will use the framework.

1.  **Baseline Generation (`npm run test:baseline`)**
    *   This script will trigger a test run in "baseline" mode.
    *   The test will:
        1.  Launch the application.
        2.  Navigate to a specific view/page.
        3.  Use `UIElementScanner` to find all interactive elements.
        4.  For each element, iterate through its states (base, hover, focus, active):
            *   Simulate the state (e.g., `element.hover()`).
            *   Call `SnapshotManager.captureSnapshot()` to save the baseline screenshot and style JSON to the `/tests/snapshots` directory.
    *   This process will automatically generate a comprehensive visual baseline for the entire application.

2.  **Test Execution & Validation (`npm run test:e2e`)**
    *   This is the standard test run, executed after code changes.
    *   It will perform the same steps as the baseline generation, but instead of saving new files, it will call `SnapshotManager.compareSnapshots()`.
    *   The test will fail if any screenshot or style doesn't match its baseline, indicating either an intended change that needs a new baseline or an unintended regression.

## 5. Testing Strategy

This project will use a two-pronged testing strategy:

1.  **Component Tests (`npm test`):**
    *   Uses Jest and React Testing Library to test individual components in isolation.
    *   Focuses on component logic, props, and events.
    *   Fast and efficient for catching bugs early.

2.  **E2E and Visual Regression Tests (`npm run test:e2e`):**
    *   Uses Playwright to test the full application.
    *   Focuses on user flows, component integration, and visual correctness.
    *   Catches bugs that only appear when the application is fully assembled.

A full test run can be executed by running both `npm test` and `npm run test:e2e`.