const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Initialize express app
const app = express();
const port = 3000;

// Set the upload folder and file storage settings
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir); // Create folder if it doesn't exist
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Upload files to the 'uploads' folder
    },
    filename: (req, file, cb) => {
        const name = req.body.name.replace(/\s+/g, '_'); // Replace spaces with underscores
        let fileExt = path.extname(file.originalname);
        let fileName = `${name}`;
        let count = 1;
        let newFileName = `${fileName}_${String(count).padStart(3, '0')}${fileExt}`;
        while (fs.existsSync(path.join(uploadDir, newFileName))) {
            count++;
            newFileName = `${fileName}_${String(count).padStart(3, '0')}${fileExt}`;
        }
        cb(null, newFileName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mkv|mov|txt|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    // Debugging: Print file details
    console.log(`File: ${file.originalname}, Extname: ${path.extname(file.originalname)}, Mimetype: ${file.mimetype}`);
    
    if (extname && mimetype) {
        return cb(null, true);  // Allow the file
    } else {
        return cb(new Error('Only images, videos, and text files are allowed!'));  // Reject the file
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter
}).array('files'); // Ensure the file filter is applied

// Serve static files like HTML, CSS, JS
app.use(express.static(path.join(__dirname, 'public'))); // Corrected static files path

// Parse form data
app.use(express.urlencoded({ extended: true }));

// Route to render the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Serve index.html from public directory
});

// Route to handle file uploads
app.post('/upload', (req, res) => {
    upload(req, res, function (err) {
        if (err) {
            return res.status(400).json({ message: err.message });
        }

        const { name } = req.body;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ message: "No files uploaded!" });
        }

        // Respond with the list of uploaded files and the user name
        res.json({
            message: `${name}, your files were uploaded successfully!`,
            uploadedFiles: files.map(file => file.filename)
        });
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
