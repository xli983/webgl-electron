const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Select folders dialog
    selectFolders: () => ipcRenderer.invoke('select-folders'),

    // Get folder structure
    getFolderStructure: (folderPaths) => ipcRenderer.invoke('get-folder-structure', folderPaths),

    // Add an image to a folder
    addImage: (folderPath, imagePath) => ipcRenderer.invoke('add-image', folderPath, imagePath),

    // Optionally, delete a file
    deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
});
