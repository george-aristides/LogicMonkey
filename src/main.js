const { app, BrowserWindow, ipcMain, shell } = require('electron');
const https = require('https');
const fs = require('fs');
const path = require('node:path');
const { execSync } = require('child_process');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const REPO_OWNER = 'george-aristides';
const REPO_NAME = 'LogicMonkey';
const CURRENT_VERSION = app.getVersion();

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Uncomment the line below to open DevTools during development:
  // mainWindow.webContents.openDevTools();
};

// Compare semver versions: returns true if remote > current
function isNewer(remote, current) {
  const r = remote.replace(/^v/, '').split('.').map(Number);
  const c = current.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((r[i] || 0) > (c[i] || 0)) return true;
    if ((r[i] || 0) < (c[i] || 0)) return false;
  }
  return false;
}

// Check GitHub Releases API for a newer version
ipcMain.handle('check-for-update', async () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
      headers: { 'User-Agent': 'LogicMonkey' },
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const release = JSON.parse(data);
          const remoteVersion = release.tag_name;
          if (isNewer(remoteVersion, CURRENT_VERSION)) {
            // Find the DMG asset
            const dmgAsset = release.assets.find((a) => a.name.endsWith('.dmg'));
            resolve({
              hasUpdate: true,
              version: remoteVersion,
              dmgUrl: dmgAsset ? dmgAsset.browser_download_url : null,
            });
          } else {
            resolve({ hasUpdate: false, version: CURRENT_VERSION });
          }
        } catch {
          resolve({ hasUpdate: false, error: 'Could not parse response' });
        }
      });
    }).on('error', () => {
      resolve({ hasUpdate: false, error: 'No internet connection' });
    });
  });
});

// Download DMG and open it so user can drag to Applications
ipcMain.handle('install-update', async (_event, dmgUrl) => {
  return new Promise((resolve, reject) => {
    const dmgPath = path.join(app.getPath('downloads'), 'LogicMonkey-update.dmg');
    const file = fs.createWriteStream(dmgPath);

    const download = (url) => {
      https.get(url, (res) => {
        // Follow redirects (GitHub serves assets via redirect)
        if (res.statusCode === 302 || res.statusCode === 301) {
          download(res.headers.location);
          return;
        }

        const total = parseInt(res.headers['content-length'], 10);
        let downloaded = 0;

        res.on('data', (chunk) => {
          downloaded += chunk.length;
          file.write(chunk);
          if (total && mainWindow) {
            const percent = Math.round((downloaded / total) * 100);
            mainWindow.webContents.send('download-progress', percent);
          }
        });

        res.on('end', () => {
          file.end(() => {
            // Open the DMG so user sees the drag-to-Applications window
            shell.openPath(dmgPath);
            resolve(true);
          });
        });
      }).on('error', (err) => {
        reject(err.message);
      });
    };

    download(dmgUrl);
  });
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
