# Setup Guide: Automated UI Tests with Playwright 1.41.2+ & Electron 37.1.0

This guide walks you through the bare-bones steps to get up and running with automated UI tests in an Electron + TypeScript app, using Playwright 1.41.2 (or higher) and Electron 37.1.0. You’ll install dependencies, configure Playwright to launch your app, write a simple test that clicks a button, takes a screenshot, and dumps CSS, and finally run everything in one go.

---

## 1. Prerequisites

- **Node.js ≥ 18.x** (LTS)
- **npm** or **yarn**
- Your Electron app at version **37.1.0**, with a `main.js` (or `main.ts`) entrypoint
- A VS Codium (or VS Code) workspace open at your project root

---

## 2. Install & Configure Playwright

1. **Install Playwright Test** as a dev dependency:

```bash
   npm install --save-dev @playwright/test@^1.41.2
   # or
   yarn add --dev @playwright/test@^1.41.2
```

2. Install browsers (Chromium, Firefox, WebKit):

```
npx playwright install

```

3. Add a Playwright config at playwright.config.ts:

```
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  use: {
    headless: true,
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'electron',
      use: {
        // leave browserName blank; we'll launch Electron directly in tests
      },
    },
  ],
});

```

## 3. Wiring Playwright to Electron

1. Add the Electron dependency (if not already):

```
npm install --save electron@^37.1.0
# or
yarn add electron@^37.1.0
```

2. Ensure your package.json has a start script that launches your app:

```jsonc
{
  "main": "dist/main.js", // or wherever your compiled entry is
  "scripts": {
    "start": "electron .",
    "test:ui": "playwright test",
  },
}
```

## 4. Writing Your First Electron UI Test

1. Create a file tests/ui.spec.ts:

```ts
import { test, expect, _electron as electron } from "@playwright/test";
import fs from "fs";
import path from "path";

test.describe("Electron UI Smoke", () => {
  let app: electron.ElectronApplication;
  let page: electron.Page;

  test.beforeAll(async () => {
    // Launch your Electron app
    app = await electron.launch({ args: ["."] });
    page = await app.firstWindow();
  });

  test.afterAll(async () => {
    await app.close();
  });

  test("click a button, screenshot & dump CSS", async () => {
    // 1. Wait for app to load
    await page.waitForSelector("#my-button", { timeout: 10_000 });

    // 2. Simulate a click
    await page.click("#my-button");

    // 3. Take a screenshot
    const shotPath = path.join("tests", "output", "after-click.png");
    await page.screenshot({ path: shotPath, fullPage: true });

    // 4. Dump computed CSS of an element
    const styles = await page.evaluate(() => {
      const el = document.querySelector("#my-button");
      return el
        ? Object.fromEntries(
            Array.from(window.getComputedStyle(el)).map((p) => [
              p,
              window.getComputedStyle(el).getPropertyValue(p),
            ]),
          )
        : {};
    });
    fs.writeFileSync(
      path.join("tests", "output", "button-styles.json"),
      JSON.stringify(styles, null, 2),
    );

    // 5. Simple assertion to ensure UI reacted
    const label = await page.textContent("#my-button");
    expect(label).toContain("Clicked");
  });
});
```

- What it does:
  - Launches Electron (electron.launch)
  - Gets the first BrowserWindow as a Playwright page
  - Clicks a button with selector #my-button
  - Saves a full-page screenshot (for AI analysis)
  - Extracts all computed CSS properties of that button and writes them to a JSON file
  - Makes a basic assertion that the UI updated

## 5. Organizing Outputs

- Create an output folder:

```bash
mkdir -p tests/output
```

- After running, you’ll have:

```pgsql
tests/
  output/
    after-click.png
    button-styles.json
  ui.spec.ts
playwright-report/
```

6. Running the Tests
   From your project root:

```
# Single run
npm run test:ui

# With verbose tracing on failures
npx playwright test --trace on

# Open the HTML report
npx playwright show-report

```

7. Next Steps
   Add more scenarios: duplicate the test block for each screen—navigate via menu clicks, form fills, etc.

Label your screenshots clearly (login-success.png, dashboard-default.png, etc.).

Integrate AI analysis: feed the .png and corresponding .json into your Claude Code pipeline to auto-diagnose misalignments or CSS drifts.

CI integration: hook npm run test:ui into your nightly or pre-release job. Only invoke AI analysis when snapshots differ from a golden baseline.
