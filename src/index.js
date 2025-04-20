import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import screenshot from 'screenshot-desktop';
import AutoLaunch from 'auto-launch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Handle Squirrel Startup for Windows
if (process.platform === 'win32') {
  import('electron-squirrel-startup')
    .then((squirrelStartup) => {
      if (squirrelStartup.default) {
        app.quit();
      }
    })
    .catch((err) => {
      console.error('Failed to load electron-squirrel-startup', err);
    });
}

// Create the main window
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,  // Disable nodeIntegration for security reasons
      preload: path.join(__dirname, 'preload.js'),
      devTools: false  // Disable dev tools
    },
    autoHideMenuBar: true,  // Hide the menu bar
    menu: null  // Disable the default menu
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
};

// Create the countdown window
let countdownWindow = null;
const createCountdownWindow = () => {
  countdownWindow = new BrowserWindow({
    width: 300,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    fullscreenable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  countdownWindow.loadFile(path.join(__dirname, 'countdown.html'));

  countdownWindow.on('closed', () => {
    countdownWindow = null;
  });
};

app.whenReady().then(() => {
  createWindow();

  // Set up Auto Launch for Windows/Mac/Linux
  const myAppAutoLauncher = new AutoLaunch({
    name: 'screen-capture', // App name
    path: app.getPath('exe'), // Path to the app's executable
  });

  // Enable auto-launch
  myAppAutoLauncher.enable();

  // Check if auto-launch is enabled
  myAppAutoLauncher.isEnabled()
    .then((isEnabled) => {
      if (!isEnabled) {
        myAppAutoLauncher.enable();
      }
    })
    .catch((err) => {
      console.error('Error enabling auto-launch:', err);
    });
});

// Quit app when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Re-create the window if the app is activated (MacOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

let captureInterval;

// Start capture process
ipcMain.on('start-capture', async (event, { interval, format, folderPath }) => {
  const mainWindow = BrowserWindow.getFocusedWindow();
  if (mainWindow) {
    mainWindow.minimize(); // Minimize the main window
  }

  createCountdownWindow(); // Show countdown overlay

  // Wait for countdown to finish (3 seconds)
  await new Promise(resolve => setTimeout(resolve, 3000));

  const date = new Date().toISOString().split('T')[0];
  const screenshotsDir = path.join(folderPath, 'Screenshots', date);

  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Start taking screenshots at the specified interval
  captureInterval = setInterval(async () => {
    const screenshotPath = path.join(screenshotsDir, `screenshot_${Date.now()}.${format}`);

    try {
      const img = await screenshot({ format });
      fs.writeFileSync(screenshotPath, img); // Save the screenshot

      // Send the screenshot path to the renderer process after saving
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('screenshot-taken', `file://${screenshotPath}`);
      }
    } catch (error) {
      console.error('Error capturing screenshot:', error);
    }
  }, interval * 1000);
});

// Stop capture process
ipcMain.on('stop-capture', () => {
  clearInterval(captureInterval);
});

// Folder selection via dialog
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});

// Cleanup intervals when app quits
app.on('quit', () => {
  clearInterval(captureInterval); // Clear the capture interval on quit
});
