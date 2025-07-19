const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onTempAssetsVar: (callback) => ipcRenderer.on('tempassets-var', (_event, value) => callback(value))
})