const express = require('express');
const multer = require('multer');
const path = require('path');
const { google } = require('googleapis');
const fs = require('fs');
const { Readable } = require('stream');

// Initialize express app
const app = express();
const port = 3000;

// Configure Google Drive API
const GOOGLE_DRIVE_FOLDER_ID = '1-88YiM-7JkhDcIaFteRCclGVdHGqPQQZ';
let drive;
try {
    const auth = new google.auth.GoogleAuth({
        keyFile: 'credentials.json', // You'll need to create this file
        scopes: ['https://www.googleapis.com/auth/drive.file']
    });
    drive = google.drive({ version: 'v3', auth });
} catch (error) {
    console.error('Error loading credentials.json:', error);
    process.exit(1); // Exit the application if credentials.json is not found
}

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mkv|mov|txt|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            return cb(new Error('Only images, videos, and text files are allowed!'));
        }
    }
}).array('files');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Function to get the next available filename
async function getNextFileName(baseName, extension) {
    let index = 1;
    let fileName;
    let exists = true;

    while (exists) {
        fileName = `${baseName}${String(index).padStart(3, '0')}.${extension}`;
        const res = await drive.files.list({
            q: `name='${fileName}' and '${GOOGLE_DRIVE_FOLDER_ID}' in parents`,
            fields: 'files(id, name)',
            spaces: 'drive'
        });
        exists = res.data.files.length > 0;
        if (exists) index++;
    }

    return fileName;
}

// Function to sanitize the base name
function sanitizeBaseName(name) {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

// Modified upload route to handle Google Drive upload
app.post('/upload', async (req, res) => {
    try {
        upload(req, res, async function(err) {
            if (err) {
                return res.status(400).json({ message: err.message });
            }

            const { name } = req.body;
            const files = req.files;

            if (!files || files.length === 0) {
                return res.status(400).json({ message: "No files uploaded!" });
            }

            const uploadedFiles = [];

            // Upload each file to Google Drive
            for (const file of files) {
                const baseName = sanitizeBaseName(name.replace(/\s+/g, '_'));
                const extension = path.extname(file.originalname).toLowerCase().slice(1);
                const fileName = await getNextFileName(baseName, extension);
                
                const response = await drive.files.create({
                    requestBody: {
                        name: fileName,
                        parents: [GOOGLE_DRIVE_FOLDER_ID],
                        mimeType: file.mimetype
                    },
                    media: {
                        mimeType: file.mimetype,
                        body: Readable.from(file.buffer) // Use Readable stream
                    }
                });

                uploadedFiles.push(fileName);
            }

            res.json({
                message: `${name}, your files were uploaded successfully to Google Drive!`,
                uploadedFiles: uploadedFiles
            });
        });
    } catch (error) {
        console.error('Error uploading to Google Drive:', error);
        res.status(500).json({ message: 'Error uploading files to Google Drive' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
