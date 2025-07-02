import { jest } from "@jest/globals";
import { loadNodeModule } from "../../src/ui/node-module-loader.js";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

it("falls back to Node require when window.require is absent", async () => {
  const originalWindow = (globalThis as any).window;
  (globalThis as any).window = {};
  const path = await loadNodeModule<typeof import("path")>("path");
  expect(typeof path.join).toBe("function");
  (globalThis as any).window = originalWindow;
});

it("build output does not include module specifier import", () => {
  // Ensure the dist files are up to date
  execSync("npm run build", { stdio: "ignore" });
  const js = readFileSync(
    join(__dirname, "../../dist/ui/node-module-loader.js"),
    "utf8",
  );
  expect(js.includes("import { createRequire } from 'module'")).toBe(false);
});

it("logs environment details", async () => {
  jest.resetModules();
  const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  const { loadNodeModule } = await import("../../src/ui/node-module-loader.js");
  await loadNodeModule("path");
  (globalThis as any).window = originalWindow;
  const logs = logSpy.mock.calls.flat().join("\n");
  expect(logs).toContain("[loadNodeModule] Attempting to load module: path");
  expect(logs).toContain("[loadNodeModule] Using dynamic import for path");
  logSpy.mockRestore();
});

it("wraps readdir results from electron", async () => {
  const originalWindow = (global as any).window;

  // Set up window as a global for the test environment
  const mockWindow = {
    electronAPI: {
      readdir: async (_dir: string, _opts?: any) => [
        { name: "a", isDirectory: true },
        { name: "b", isDirectory: false },
      ],
    },
  };

  // Set window in global scope
  (global as any).window = mockWindow;
  (globalThis as any).window = mockWindow;

  jest.resetModules();

  // Set window globally in the test environment
  (global as any).window = mockWindow;

  const { loadNodeModule } = await import("../../src/ui/node-module-loader.js");
  const fs = await loadNodeModule<typeof import("fs/promises")>("fs/promises");
  const entries = await fs.readdir("/any-dir", { withFileTypes: true });
  expect(entries[0].name).toBe("a");
  expect(entries[0].isDirectory()).toBe(true);
  expect(entries[1].name).toBe("b");
  expect(entries[1].isDirectory()).toBe(false);

  // Restore environment
  (global as any).window = originalWindow;
  (globalThis as any).window = originalWindow;
});
