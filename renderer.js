const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

let folderWatchers = [];  // Array to keep track of all watchers
let selectedFolderPath = null;
let pollingInterval = null;
let selectedFoldersStructure = [];  // Array to keep track of all selected folders

select_folders.addEventListener('click', async () => {
    const folderPaths = await ipcRenderer.invoke('select-folders');
    const structure = await ipcRenderer.invoke('get-folder-structure', folderPaths);
    selectedFoldersStructure = structure;  // Store all initially selected folders
    displayFolders(selectedFoldersStructure);
    watchAllFolders(selectedFoldersStructure);  // Start watching all selected folders
    startPolling(selectedFoldersStructure);  // Start polling to handle missed events like deletions
});

function displayFolders(structure) {
    const folderList = folder_list;
    folderList.innerHTML = ''; // Clear the existing list before rendering new folders

    structure.forEach(folder => {
        // Create a new element using the structure of `folder_item`
        const folderItem = document.createElement('p');
        folderItem.setAttribute('class', 'folder-item'); // Use the existing style class

        // Create a span element to hold the folder name as in the generated HTML
        const folderName = document.createElement('span');
        folderName.setAttribute('class', 'span'); // Use the same style class as in the generated HTML
        folderName.textContent = folder.path; // Set the folder name text

        // Set styles to ensure visibility and clickability
        folderItem.style.cursor = 'pointer'; // Set cursor to pointer
        folderItem.style.zIndex = '10'; // Bring folder item to the front

        // Append the folder name to the folder item
        folderItem.appendChild(folderName);

        // Add click event listener for folders
        folderItem.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent the click from bubbling up
            handleFolderClick(folder.path, event);
        });

        // Append the styled folder item to the folder list
        folderList.appendChild(folderItem);

        // Display the files and folders inside the folder
        displayFolderContents(folder.children, folderItem);
    });
}

function displayFolderContents(contents, parentElement) {
    contents.forEach(item => {
        // Create a new folder item element for each file or folder
        const itemElement = document.createElement('p');
        itemElement.setAttribute('class', 'folder-item'); // Use the style class of folder item
        itemElement.style.paddingLeft = '20px'; // Indent for child items
        itemElement.style.cursor = 'pointer'; // Set cursor to pointer
        itemElement.style.zIndex = '10'; // Bring item element to the front

        // Create a span element to hold the item name as in the generated HTML
        const itemName = document.createElement('span');
        itemName.setAttribute('class', 'span'); // Use the same style class as in the generated HTML
        itemName.textContent = item.name; // Set the item name text

        // Append the item name to the item element
        itemElement.appendChild(itemName);

        if (item.isDirectory) {
            // Add click event listener for directories
            itemElement.addEventListener('click', (event) => {
                event.stopPropagation(); // Stop the event from propagating to avoid interference
                handleFolderClick(item.path, event);
            });

            // Append the styled directory item element to the parent element
            parentElement.appendChild(itemElement);

            // Recursively display subfolder contents
            displayFolderContents(item.children, itemElement);
        } else {
            itemElement.classList.add('file-item'); // Add additional class for files if needed

            // Add click event listener to show JPG images
            itemElement.addEventListener('click', (event) => {
                event.stopPropagation(); // Stop the event from propagating to avoid interference
                handleFileClick(item);
            });

            // Append the styled file item element to the parent element
            parentElement.appendChild(itemElement);
        }
    });
}




function handleFileClick(item) {
    if (!item.isDirectory && item.name.toLowerCase().endsWith('.jpg')) {
        const image = document.createElement('img');
        image.src = item.path;
        image.style.maxWidth = '100%';
        image.style.maxHeight = '100%';

        const imageContainer = image_container;
        imageContainer.innerHTML = '';
        imageContainer.appendChild(image);
    }
}

function handleFolderClick(folderPath, event) {
    event.stopPropagation();  // Stop event bubbling
    selectedFolderPath = folderPath;  // Set the selected folder for drag-and-drop
    alert(`Selected folder: ${folderPath}`);
}


// Function to start watching all selected folders and their subfolders
function watchAllFolders(structure) {
    clearAllWatchers();  // Clear previous watchers to avoid duplicate watching

    structure.forEach(folder => {
        watchFolderRecursively(folder.path);
    });
}

// Function to recursively watch a folder and its contents
function watchFolderRecursively(folderPath) {
    if (fs.existsSync(folderPath)) {
        const watcher = fs.watch(folderPath, (eventType, filename) => {
            if (filename) {
                console.log(`File ${filename} was changed (${eventType}) in ${folderPath}`);
                refreshFolder(folderPath);  // Refresh the folder when changes are detected
            }
        });

        folderWatchers.push(watcher);  // Add watcher to the list

        // Watch subfolders as well
        const folderContents = fs.readdirSync(folderPath, { withFileTypes: true });
        folderContents.forEach(item => {
            if (item.isDirectory()) {
                const subFolderPath = path.join(folderPath, item.name);
                watchFolderRecursively(subFolderPath);  // Recursively watch subfolders
            }
        });
    }
}

// Function to refresh a specific folder's contents without removing other folders
function refreshFolder(folderPath) {
    ipcRenderer.invoke('get-folder-structure', [folderPath]).then(structure => {
        const updatedFolder = structure[0];  // Get the updated folder structure
        const folderList = document.getElementById('folder-list');

        // Update the specific folder in the selectedFoldersStructure array
        selectedFoldersStructure = selectedFoldersStructure.map(folder => 
            folder.path === updatedFolder.path ? updatedFolder : folder
        );

        // Redisplay all selected folders, keeping other folders intact
        displayFolders(selectedFoldersStructure);
    });
}

// Clear all folder watchers when a new set of folders is selected
function clearAllWatchers() {
    folderWatchers.forEach(watcher => watcher.close());  // Close all existing watchers
    folderWatchers = [];  // Reset the array of watchers
}

// Start polling the folder every few seconds to detect file deletions or missed events
function startPolling(structure) {
    clearInterval(pollingInterval);  // Clear any existing polling

    pollingInterval = setInterval(() => {
        structure.forEach(folder => {
            refreshFolder(folder.path);  // Refresh the folder contents
        });
    }, 2000);  // Poll every 2 seconds (adjust this interval as needed)
}

// Drop area outside the folder structure (for dragging to selected folder)
const dropArea = drop_area;
dropArea.addEventListener('dragover', (event) => {
    event.preventDefault();
});

dropArea.addEventListener('drop', async (event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;

    if (files.length && selectedFolderPath) {
        for (const file of files) {
            if (file.name.toLowerCase().endsWith('.jpg')) {
                // Add the image to the selected folder
                await ipcRenderer.invoke('add-image', selectedFolderPath, file.path);
                alert(`${file.name} added to ${selectedFolderPath}`);

                // Refresh the folder after drag and drop
                refreshFolder(selectedFolderPath);
            } else {
                alert('Only JPG files are supported');
            }
        }
    } else if (!selectedFolderPath) {
        alert('Please select a folder first');
    }
});
