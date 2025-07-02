import { jest } from "@jest/globals";

const exposeInMainWorld = jest.fn();
const invoke = jest.fn(async () => {});

jest.mock("electron", () => ({
  contextBridge: { exposeInMainWorld },
  ipcRenderer: { invoke },
}));

it("logs warning for non-serializable arguments", async () => {
  const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  // Import the preload module to trigger electronAPI setup
  await import("../../src/preload.js");
  const electronApi = exposeInMainWorld.mock.calls.find(
    (c) => c[0] === "electronAPI",
  )?.[1] as any;
  const nonSerializable = { fn: () => {} } as any;
  await electronApi.readFile(nonSerializable, {});
  expect(warnSpy).toHaveBeenCalledWith(
    expect.stringContaining("arg[0] for fs-read-file"),
    nonSerializable,
  );
  warnSpy.mockRestore();
});
