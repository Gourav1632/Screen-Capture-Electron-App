const { ipcRenderer } = require('electron');

const intervalInput = document.getElementById('interval');
const formatSelect = document.getElementById('format');
const folderInput = document.getElementById('folder');
const selectFolderBtn = document.getElementById('selectFolderBtn');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const status = document.getElementById('status');

let folderPath = '';

selectFolderBtn.addEventListener('click', async () => {
  const selectedPath = await ipcRenderer.invoke('select-folder');
  if (selectedPath) {
    folderPath = selectedPath;
    folderInput.value = folderPath;
  }
});

startBtn.addEventListener('click', () => {
  const interval = parseInt(intervalInput.value);
  const format = formatSelect.value;

  if (!folderPath) {
    alert('Please select a destination folder.');
    return;
  }

  if (isNaN(interval) || interval <= 0) {
    alert('Please enter a valid interval in seconds.');
    return;
  }

  ipcRenderer.send('start-capture', { interval, format, folderPath });
  status.textContent = `Capturing screenshots every ${interval} seconds in ${format.toUpperCase()} format...`;
  startBtn.disabled = true;
  stopBtn.disabled = false;
});

stopBtn.addEventListener('click', () => {
  ipcRenderer.send('stop-capture');
  status.textContent = 'Capture stopped.';
  startBtn.disabled = false;
  stopBtn.disabled = true;
});