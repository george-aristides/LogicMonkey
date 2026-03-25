const statsService = require('../services/statsService');

function register(ipcMain) {
  ipcMain.handle('get-user-stats', async () => {
    try { return await statsService.getUserStats(); }
    catch (e) { return { error: e.message }; }
  });
}

module.exports = { register };
