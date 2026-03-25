const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Update system
  checkForUpdate: () => ipcRenderer.invoke('check-for-update'),
  installUpdate: (dmgUrl) => ipcRenderer.invoke('install-update', dmgUrl),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (_event, percent) => callback(percent)),

  // Supabase / questions
  getCategories: () => ipcRenderer.invoke('get-categories'),
  getQuestions: (filter) => ipcRenderer.invoke('get-questions', filter),
  submitAnswer: (payload) => ipcRenderer.invoke('submit-answer', payload),
  getUserStats: () => ipcRenderer.invoke('get-user-stats'),
});
