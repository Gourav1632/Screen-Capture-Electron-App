import { app, BrowserWindow, ipcMain} from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import screenshot from 'screenshot-desktop';
import { dialog } from 'electron';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const createWindow = () => {
  console.log(__dirname)
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.webContents.openDevTools();
};

let countdownWindow = null;

const createCountdownWindow = ()=>{
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
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

let captureInterval;
ipcMain.on('start-capture', async (event, { interval, format, folderPath }) => {

  const mainWindow = BrowserWindow.getFocusedWindow();
  if (mainWindow) {
    mainWindow.minimize(); // minimize the app
  }

  createCountdownWindow(); // show overlay

  // Wait for countdown to finish (3 seconds)
  await new Promise(resolve => setTimeout(resolve, 3000));

  const date = new Date().toISOString().split('T')[0];
  const screenshotsDir = path.join(folderPath, 'Screenshots', date);

  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  captureInterval = setInterval(async () => {
    const screenshotPath = path.join(screenshotsDir, `screenshot_${Date.now()}.${format}`);
    
    try {
      const img = await screenshot({ format });
      fs.writeFileSync(screenshotPath, img); // save the screenshot
      
      // Send the screenshot path to the renderer process after saving
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('screenshot-taken', `file://${screenshotPath}`);
      }
    } catch (error) {
      console.error('Error capturing screenshot:', error);
    }
  }, interval * 1000);
});

ipcMain.on('stop-capture', () => {
  clearInterval(captureInterval);
});



ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});