const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
    loadTextureFromPath: (filePath) => ipcRenderer.invoke('loadTextureFromPath', filePath)
});
