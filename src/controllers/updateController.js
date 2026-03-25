const { app } = require('electron');
const updateService = require('../services/updateService');

function register(ipcMain, { getMainWindow }) {
  ipcMain.handle('check-for-update', async () => {
    try { return await updateService.checkForUpdate(app.getVersion()); }
    catch (e) { return { hasUpdate: false, error: e.message }; }
  });

  ipcMain.handle('install-update', async (_event, dmgUrl) => {
    try {
      return await updateService.downloadAndInstall(dmgUrl, (percent) => {
        const win = getMainWindow();
        if (win) win.webContents.send('download-progress', percent);
      });
    } catch (e) { return { error: e.message }; }
  });
}

module.exports = { register };
