// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./models/db'); // our DB helper

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

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  // win.webContents.openDevTools(); // uncomment for dev
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
