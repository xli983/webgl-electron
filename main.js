const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    mainWindow.loadFile('packed.html');

    ipcMain.handle('select-folders', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory', 'multiSelections']
        });
        return result.filePaths;
    });

    ipcMain.handle('get-folder-structure', async (event, folderPaths) => {
        const structure = folderPaths.map(getFolderStructure);
        return structure;
    });

    ipcMain.handle('add-image', async (event, targetFolder, imagePath) => {
        try {
            const fileName = path.basename(imagePath);
            const destination = path.join(targetFolder, fileName);
            fs.copyFileSync(imagePath, destination); 
            return { success: true };
        } catch (error) {
            console.error('Error adding image:', error);
            return { success: false, error };
        }
    });

    ipcMain.handle('delete-file', async (event, filePath) => {
        try {
            fs.unlinkSync(filePath); 
            return { success: true };
        } catch (error) {
            console.error('Error deleting file:', error);
            return { success: false, error };
        }
    });
});

function getFolderStructure(folderPath) {
    const folderContents = fs.readdirSync(folderPath, { withFileTypes: true });
    return {
        path: folderPath,
        children: folderContents.map(file => ({
            name: file.name,
            path: path.join(folderPath, file.name),
            isDirectory: file.isDirectory(),
            children: file.isDirectory() ? getFolderStructure(path.join(folderPath, file.name)).children : []  // Recursively get the structure for subfolders
        }))
    };
}
