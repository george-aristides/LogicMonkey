const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  checkForUpdate: () => ipcRenderer.invoke('check-for-update'),
  installUpdate: (dmgUrl) => ipcRenderer.invoke('install-update', dmgUrl),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (_event, percent) => callback(percent)),
});
