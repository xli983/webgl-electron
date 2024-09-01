const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    selectFolder: () => ipcRenderer.invoke('dialog:openFolder'),
    watchFolder: (folderPath) => ipcRenderer.invoke('watch-folder', folderPath),
    onFolderChanged: (callback) => ipcRenderer.on('folder-changed', callback),
    onInitialFolderLoad: (callback) => ipcRenderer.on('initial-folder-load', callback),
});
