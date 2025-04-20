const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  startCapture: (data) => ipcRenderer.send('start-capture', data),
  stopCapture: () => ipcRenderer.send('stop-capture'),
  onScreenshotTaken: (callback) => ipcRenderer.on('screenshot-taken', callback),
  openPreview: (src) => {
    document.getElementById('previewImage').src = src;
    document.getElementById('previewModal').classList.remove('hidden');
  },
  closePreview: () => {
    document.getElementById('previewModal').classList.add('hidden');
  }
});