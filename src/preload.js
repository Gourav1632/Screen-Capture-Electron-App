const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  startCapture: (data) => ipcRenderer.send('start-capture', data),
  stopCapture: () => ipcRenderer.send('stop-capture'),
});
