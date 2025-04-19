// render.js
const intervalInput = document.getElementById('interval');
const formatSelect = document.getElementById('format');
const folderInput = document.getElementById('folder');
const selectFolderBtn = document.getElementById('selectFolderBtn');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');

let folderPath = '';

// Select Folder Button
selectFolderBtn.addEventListener('click', async () => {
  try {
    const selectedPath = await window.electronAPI.selectFolder(); 
    if (selectedPath) {
      folderPath = selectedPath;
      folderInput.value = folderPath;
    }
  } catch (error) {
    console.error('Failed to select folder:', error);
  }
});

// Start Capture Button
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

  window.electronAPI.startCapture({ interval, format, folderPath });  // Use electronAPI to send start capture
  startBtn.disabled = true;
  stopBtn.disabled = false;
});

// Stop Capture Button
stopBtn.addEventListener('click', () => {
  window.electronAPI.stopCapture();  // Use electronAPI to stop capture
  startBtn.disabled = false;
  stopBtn.disabled = true;
});
