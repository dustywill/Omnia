import { loadNodeModule } from "../../src/ui/node-module-loader.js";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

it("falls back to Node require when window.require is absent", () => {
  const originalWindow = (globalThis as any).window;
  (globalThis as any).window = {};
  const path = loadNodeModule<typeof import("path")>("path");
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
  loadNodeModule("path");
  const logs = logSpy.mock.calls.flat().join("\n");
  expect(logs).toContain("[loadNodeModule] environment details");
  logSpy.mockRestore();
});

it("wraps readdir results from electron", async () => {
  jest.resetModules();
  const originalWindow = (global as any).window;
  (originalWindow as any).electronAPI = {
    readdir: async (_dir: string, _opts?: any) => [
      { name: "a", isDirectory: true },
      { name: "b", isDirectory: false },
    ],
  };
  const { loadNodeModule } = await import("../../src/ui/node-module-loader.js");
  const fs = loadNodeModule<typeof import("fs/promises")>("fs/promises");
  const entries = await fs.readdir("/tmp", { withFileTypes: true });
  expect(entries[0].name).toBe("a");
  expect(entries[0].isDirectory()).toBe(true);
  expect(entries[1].name).toBe("b");
  expect(entries[1].isDirectory()).toBe(false);
  delete (originalWindow as any).electronAPI;
});
