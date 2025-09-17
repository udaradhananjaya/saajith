// main.js
const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const db = require('./models/db'); // our DB helper
const isDev = process.env.NODE_ENV === 'development';
let win;

function getIndexPath() {
  return isDev
    ? 'http://localhost:5173'
    : path.join(__dirname, 'dist', 'index.html');
}

function getQueriesPath() {
  return isDev
    ? 'http://localhost:5173/queries.html'
    : path.join(__dirname, 'dist', 'queries.html');
}

function createWindow() {
  win = new BrowserWindow({
    width: 1250,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.setMenuBarVisibility(false);

  const loadTarget = getIndexPath();

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

function registerShortcuts() {
  // F1 -> index, F2 -> queries
  globalShortcut.register('F1', () => {
    if (win) {
      const target = getIndexPath();
      if (isDev) {
        win.loadURL(target);
      } else {
        win.loadFile(target);
      }
    }
  });

  globalShortcut.register('F2', () => {
    if (win) {
      const target = getQueriesPath();
      if (isDev) {
        win.loadURL(target);
      } else {
        win.loadFile(target);
      }
    }
  });
}

function unregisterShortcuts() {
  globalShortcut.unregisterAll();
}

app.whenReady().then(() => {
  createWindow();
  registerShortcuts();
});

app.on('will-quit', unregisterShortcuts);

app.on('window-all-closed', () => {
  unregisterShortcuts();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

/* ---------- IPC handlers (calls to models/db.js) ---------- */
ipcMain.handle('db:getEntries', () => db.getEntries());
ipcMain.handle('db:addEntry', (event, entry) => db.addEntry(entry));
ipcMain.handle('db:togglePaid', (event, id, paid) => db.togglePaid(id, paid));
ipcMain.handle('db:deleteEntry', (event, id) => db.deleteEntry(id));
ipcMain.handle('db:editEntry', (event, id, data) => db.editEntry(id, data));

/* Navigation via contextBridge (optional, for renderer-triggered navigation) */
ipcMain.on('go-to-index', () => {
  if (win) {
    const target = getIndexPath();
    if (isDev) {
      win.loadURL(target);
    } else {
      win.loadFile(target);
    }
  }
});

ipcMain.on('go-to-queries', () => {
  if (win) {
    const target = getQueriesPath();
    if (isDev) {
      win.loadURL(target);
    } else {
      win.loadFile(target);
    }
  }
});