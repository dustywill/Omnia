/**
 * @file plugins/as-built-documenter/index.js
 * @description Entry point for the As-Built Documenter plugin.
 * Provides the ability to open a dedicated BrowserWindow for the template
 * editor. The editor window loads the HTML from the plugin's `ui` folder and
 * uses the application's preload script so it can access the same APIs as other
 * renderer processes.
 */

const path = require("node:path");
const { BrowserWindow, ipcMain, app } = require("electron");

const mainModule = require("./ui/index.js");

let editorWindow = null;

function createEditorWindow(initialTemplatePath, ipAddress) {
  if (editorWindow) {
    editorWindow.focus();
    if (initialTemplatePath) {
      editorWindow.webContents.send(
        "as-built-documenter:load-template",
        initialTemplatePath,
      );
    }
    if (ipAddress) {
      editorWindow.webContents.send(
        "as-built-documenter:set-ip-address",
        ipAddress,
      );
    }
    return;
  }
  editorWindow = new BrowserWindow({
    width: 900,
    height: 700,
    title: "Template Editor",
    webPreferences: {
      preload: path.resolve(__dirname, "../../src/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const editorHtml = path.join(__dirname, "ui", "template-editor.html");
  editorWindow.loadFile(editorHtml);
  if (!app.isPackaged) {
    editorWindow.webContents.openDevTools({ mode: "detach" });
  }
  editorWindow.webContents.once("did-finish-load", () => {
    if (initialTemplatePath) {
      editorWindow.webContents.send(
        "as-built-documenter:load-template",
        initialTemplatePath,
      );
    }
    if (ipAddress) {
      editorWindow.webContents.send(
        "as-built-documenter:set-ip-address",
        ipAddress,
      );
    }
  });
  editorWindow.on("closed", () => {
    editorWindow = null;
  });
}

async function activate(coreAPI) {
  await mainModule.activate(coreAPI);
  ipcMain.handle("as-built-documenter:open-editor", (_event, args) => {
    const templatePath = args?.templatePath;
    const ipAddress = args?.ipAddress;
    createEditorWindow(templatePath, ipAddress);
  });
}

async function deactivate() {
  if (editorWindow) {
    editorWindow.close();
    editorWindow = null;
  }
  ipcMain.removeHandler("as-built-documenter:open-editor");
  await mainModule.deactivate();
}

module.exports = { activate, deactivate, createEditorWindow };
