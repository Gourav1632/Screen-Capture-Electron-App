// DOM elements
const intervalInput = document.getElementById('interval');
const folderInput = document.getElementById('folder');
const selectFolderBtn = document.getElementById('selectFolderBtn');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const pngRadio = document.getElementById("formatPng");
const jpegRadio = document.getElementById("formatJpeg");
const toggleBg = document.getElementById("toggleBg");
const labelPng = document.getElementById("labelPng");
const labelJpeg = document.getElementById("labelJpeg");

let folderPath = '';
const storedScreenshots = [];
let currentPage = 1;
const screenshotsPerPage = 12;

// Switch image format to PNG
pngRadio.addEventListener("change", () => {
  toggleBg.style.left = "0.25rem";
  labelPng.classList.add("text-white");
  labelJpeg.classList.remove("text-white");
});

// Switch image format to JPEG
jpegRadio.addEventListener("change", () => {
  toggleBg.style.left = "calc(50% + 0.25rem)";
  labelJpeg.classList.add("text-white");
  labelPng.classList.remove("text-white");
});

// Folder selection
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

// Start capturing screenshots
startBtn.addEventListener('click', () => {
  const interval = parseInt(intervalInput.value);
  const format = pngRadio.checked ? 'png' : 'jpeg';

  if (!folderPath) {
    alert('Please select a destination folder.');
    return;
  }

  if (isNaN(interval) || interval <= 0) {
    alert('Please enter a valid interval in seconds.');
    return;
  }

  window.electronAPI.startCapture({ interval, format, folderPath });
  startBtn.disabled = true;
  startBtn.textContent = "Capturing...";
  stopBtn.disabled = false;
});

// Stop capturing screenshots
stopBtn.addEventListener('click', () => {
  window.electronAPI.stopCapture();
  startBtn.disabled = false;
  startBtn.textContent = "Capture";
  stopBtn.disabled = true;
});

// Open screenshot preview modal
function openPreview(src) {
  document.getElementById('previewImage').src = src;
  document.getElementById('previewModal').classList.remove('hidden');
}

// Close screenshot preview modal
function closePreview() {
  document.getElementById('previewModal').classList.add('hidden');
}

document.getElementById('closePreview').addEventListener('click', closePreview);

// Render screenshots in grid and handle pagination
function renderScreenshots(screenshots) {
  const grid = document.getElementById('screenshotGrid');
  const noShot = document.getElementById('noScreenshots');
  const totalPages = Math.ceil(screenshots.length / screenshotsPerPage);

  if (screenshots.length === 0) {
    noShot.classList.remove('hidden');
    grid.classList.add('hidden');
    document.getElementById('paginationControls').classList.add('hidden');
    return;
  }

  noShot.classList.add('hidden');
  grid.classList.remove('hidden');
  document.getElementById('paginationControls').classList.remove('hidden');

  grid.innerHTML = '';

  const start = (currentPage - 1) * screenshotsPerPage;
  const end = start + screenshotsPerPage;
  const pageItems = screenshots.slice(start, end);

  pageItems.forEach(src => {
    const div = document.createElement('div');
    div.className = 'cursor-pointer border rounded-lg overflow-hidden hover:shadow-md transition-all';

    const img = document.createElement('img');
    img.src = src;
    img.alt = "Screenshot";
    img.className = "w-full h-auto";
    img.addEventListener('click', () => openPreview(src));

    div.appendChild(img);
    grid.appendChild(div);
  });

  document.getElementById('prevPage').disabled = currentPage === 1;
  document.getElementById('nextPage').disabled = currentPage === totalPages;
}

// Pagination buttons
document.getElementById('prevPage').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    renderScreenshots(storedScreenshots);
  }
});

document.getElementById('nextPage').addEventListener('click', () => {
  const totalPages = Math.ceil(storedScreenshots.length / screenshotsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderScreenshots(storedScreenshots);
  }
});

// Handle screenshot received from backend
window.electronAPI.onScreenshotTaken((event, path) => {
  storedScreenshots.unshift(path); // Add new screenshot to the start
  renderScreenshots(storedScreenshots);
});
