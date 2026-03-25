const quizService = require('../services/quizService');

function register(ipcMain) {
  ipcMain.handle('get-questions', async (_event, filter) => {
    try { return await quizService.getQuestions(filter); }
    catch (e) { return { error: e.message }; }
  });

  ipcMain.handle('submit-answer', async (_event, payload) => {
    try { return await quizService.submitAnswer(payload); }
    catch (e) { return { error: e.message }; }
  });
}

module.exports = { register };
