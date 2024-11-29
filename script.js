// Handling file input preview and upload submission
document.getElementById('fileInput').addEventListener('change', previewFiles);
document.getElementById('uploadForm').addEventListener('submit', uploadFiles);

const fileInputContainer = document.getElementById('fileInputContainer');
fileInputContainer.addEventListener('dragover', (event) => {
    event.preventDefault();
    fileInputContainer.classList.add('dragover');
});

fileInputContainer.addEventListener('dragleave', () => {
    fileInputContainer.classList.remove('dragover');
});

fileInputContainer.addEventListener('drop', (event) => {
    event.preventDefault();
    fileInputContainer.classList.remove('dragover');
    const files = event.dataTransfer.files;
    document.getElementById('fileInput').files = files;
    previewFiles({ target: { files } });
});

fileInputContainer.addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

let filesToUpload = [];

function previewFiles(event) {
    const previewContainer = document.getElementById('filePreview');
    const newFiles = Array.from(event.target.files);
    filesToUpload = filesToUpload.concat(newFiles); // Append new files to filesToUpload

    newFiles.forEach((file, index) => {
        const fileReader = new FileReader();
        
        fileReader.onload = function() {
            const previewElementContainer = document.createElement('div');
            previewElementContainer.classList.add('preview-container');
            
            let previewElement;
            if (file.type.startsWith('image')) {
                previewElement = document.createElement('img');
                previewElement.src = fileReader.result;
                previewElement.style.width = '100px'; // Set width
                previewElement.style.height = '100px'; // Set height
                previewElement.style.objectFit = 'cover'; // Maintain aspect ratio
            } else if (file.type.startsWith('video')) {
                previewElement = document.createElement('video');
                previewElement.src = fileReader.result;
                previewElement.controls = true;
                previewElement.style.width = '100px'; // Set width
                previewElement.style.height = '100px'; // Set height
                previewElement.style.objectFit = 'cover'; // Maintain aspect ratio
            }
            
            const removeButton = document.createElement('button');
            removeButton.classList.add('remove-btn');
            removeButton.textContent = 'X';
            removeButton.addEventListener('click', () => {
                previewElementContainer.remove();
                filesToUpload.splice(filesToUpload.indexOf(file), 1); // Remove file from filesToUpload
            });
            
            previewElementContainer.appendChild(previewElement);
            previewElementContainer.appendChild(removeButton);
            previewContainer.appendChild(previewElementContainer);
        };
        
        fileReader.readAsDataURL(file);
    });
}

function uploadFiles(event) {
    event.preventDefault(); // Prevent form from reloading the page

    if (filesToUpload.length === 0) {
        const notification = document.getElementById('message');
        notification.style.display = 'block';
        notification.classList.add('error');
        notification.textContent = 'Please select files to upload.';
        return;
    }

    const formData = new FormData();
    const name = document.getElementById('name').value;
    formData.append('name', name);
    filesToUpload.forEach(file => formData.append('files', file));

    const notification = document.getElementById('message'); // Updated ID
    
    // Show loading message
    notification.style.display = 'none'; // Hide previous messages
    notification.classList.remove('error', 'success');
    notification.textContent = 'Uploading your files...';
    notification.style.display = 'block';

    // Send data to server
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Success: Show notification
        notification.classList.add('success');
        notification.textContent = `${data.message} Files: ${data.uploadedFiles.join(', ')}`;
    })
    .catch(error => {
        // Error: Show notification
        notification.classList.add('error');
        notification.textContent = 'Error uploading files. Please try again.';
    });
}