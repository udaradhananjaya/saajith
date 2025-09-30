// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getEntries: () => ipcRenderer.invoke('db:getEntries'),
  addEntry: (entry) => ipcRenderer.invoke('db:addEntry', entry),
  togglePaid: (id, paid) => ipcRenderer.invoke('db:togglePaid', id, paid),
  deleteEntry: (id) => ipcRenderer.invoke('db:deleteEntry', id),
  editEntry: (id, data) => ipcRenderer.invoke('db:editEntry', id, data),
  markEntryCategoriesPaid: (entryId, categories, paid) => ipcRenderer.invoke('db:markEntryCategoriesPaid', entryId, categories, paid),
  titleExists: (title) => ipcRenderer.invoke('db:titleExists', title),
  goToIndex: () => ipcRenderer.send('go-to-index'),
  goToQueries: () => ipcRenderer.send('go-to-queries'),
  getCategories: () => ipcRenderer.invoke('db:getCategories'),
  addCategory: (name, rate) => ipcRenderer.invoke('db:addCategory', name, rate),
  editCategory: (id, name, rate) => ipcRenderer.invoke('db:editCategory', id, name, rate),
  deleteCategory: (id) => ipcRenderer.invoke('db:deleteCategory', id),
  getCategoryById: (id) => ipcRenderer.invoke('db:getCategoryById', id),
  goToSettings: () => ipcRenderer.send('go-to-settings')
});
