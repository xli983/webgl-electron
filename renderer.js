document.getElementById('select-folder-btn').addEventListener('click', async () => {
    const folderPath = await window.electron.selectFolder();
    if (folderPath) {
        window.electron.watchFolder(folderPath);
    }
});

window.electron.onInitialFolderLoad((event, files) => {
    const fileList = document.getElementById('file-list');
    fileList.innerHTML = ''; // Clear
    files.forEach(filePath => {
        const li = document.createElement('li');
        li.textContent = filePath; 
        fileList.appendChild(li);
    });
});

window.electron.onFolderChanged((event, { type, path }) => {
    const fileList = document.getElementById('file-list');

    if (type === 'add') {
        const existingItems = Array.from(fileList.getElementsByTagName('li')).map(item => item.textContent);
        if (!existingItems.includes(path)) {
            const li = document.createElement('li');
            li.textContent = path; 
            fileList.appendChild(li);
        }
    } else if (type === 'change') {
        console.log(`File changed: ${path}`);
    } else if (type === 'unlink') {
        const items = fileList.getElementsByTagName('li');
        for (let item of items) {
            if (item.textContent === path) {
                fileList.removeChild(item);
                break;
            }
        }
    }
});
