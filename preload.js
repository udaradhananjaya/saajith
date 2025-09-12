// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getEntries: () => ipcRenderer.invoke('db:getEntries'),
  addEntry: (entry) => ipcRenderer.invoke('db:addEntry', entry),
  togglePaid: (id, paid) => ipcRenderer.invoke('db:togglePaid', id, paid),
  deleteEntry: (id) => ipcRenderer.invoke('db:deleteEntry', id)
});
