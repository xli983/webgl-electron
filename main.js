const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.handle('dialog:openFolder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    if (canceled || filePaths.length === 0) {
        return null;
    } else {
        return filePaths[0];
    }
});

ipcMain.handle('watch-folder', (event, folderPath) => {
    const watcher = chokidar.watch(folderPath, {
        ignored: /(^|[\/\\])\../,
        persistent: true
    });

    watcher.on('add', filePath => {
        mainWindow.webContents.send('folder-changed', { type: 'add', path: filePath });
    });

    watcher.on('change', filePath => {
        mainWindow.webContents.send('folder-changed', { type: 'change', path: filePath });
    });

    watcher.on('unlink', filePath => {
        mainWindow.webContents.send('folder-changed', { type: 'unlink', path: filePath });
    });

    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error('Failed to read directory:', err);
            return;
        }
        const fullPaths = files.map(file => path.join(folderPath, file)); // Full paths only
        mainWindow.webContents.send('initial-folder-load', fullPaths);
    });
});
