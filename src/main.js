const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('node:path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Uncomment the line below to open DevTools during development:
  // mainWindow.webContents.openDevTools();

  // Check for updates after window loads
  mainWindow.webContents.on('did-finish-load', () => {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;

    autoUpdater.on('update-available', (info) => {
      mainWindow.webContents.send('update-available', info.version);
    });

    autoUpdater.checkForUpdates().catch(() => {
      // Silently fail if offline — app works fine without updates
    });
  });

  return mainWindow;
};

// Open the GitHub Releases page when user clicks the update banner
ipcMain.on('open-releases', () => {
  shell.openExternal('https://github.com/george-aristides/LogicMonkey/releases');
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
