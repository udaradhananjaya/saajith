// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./models/db'); // our DB helper
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });


  let loadTarget;
  if (isDev) {
    loadTarget = 'http://localhost:5173';
  } else {
    loadTarget = path.join(__dirname, 'dist', 'index.html');
  }


  console.log(`[Electron] NODE_ENV=${process.env.NODE_ENV}`);
  console.log(`[Electron] App mode: ${isDev ? 'DEV' : 'PROD'}`);
  console.log(`[Electron] Loading: ${loadTarget}`);

  if (isDev) {
    win.loadURL(loadTarget).catch(err => {
      console.error('[Electron] Failed to load dev server:', err);
    });
    win.webContents.openDevTools();
  } else {
    win.loadFile(loadTarget).catch(err => {
      console.error('[Electron] Failed to load file:', err);
    });
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

/* ---------- IPC handlers (calls to models/db.js) ---------- */
ipcMain.handle('db:getEntries', () => {
  return db.getEntries();
});

ipcMain.handle('db:addEntry', (event, entry) => {
  return db.addEntry(entry);
});

ipcMain.handle('db:togglePaid', (event, id, paid) => {
  return db.togglePaid(id, paid);
});

ipcMain.handle('db:deleteEntry', (event, id) => {
  return db.deleteEntry(id);
});
