const categoryService = require('../services/categoryService');

function register(ipcMain) {
  ipcMain.handle('get-categories', async () => {
    try { return await categoryService.getCategories(); }
    catch (e) { return { error: e.message }; }
  });
}

module.exports = { register };
