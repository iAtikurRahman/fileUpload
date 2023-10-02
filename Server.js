require("dotenv").config();
const express = require('express');
const app = express();
const port = process.env.PORT;
const http = require('http');
const multer = require('multer');

// Middleware for parsing JSON data
app.use(express.json({ limit: '1gb' }));

// Auth start
const clientRequestValidation = require('./middlewares/clientRequestValidation');
const serverAuthMiddleware = require('./middlewares/serverAuthorization');

const tokenValidation = clientRequestValidation.isValidRequestFromClient;
const serverValidation = serverAuthMiddleware.ServerAuthorization;
// Auth end

// ---- Different angle using multer
const upload = multer({
  storage: multer.memoryStorage(), // Use memory storage
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1024 MB limit (adjust as needed)
  },
});

// Controller Files
const uploadController = require('./controllers/uploadController');

// Route
app.get('/',serverValidation,(req,res)=>{
  res.status(200).send("The Server is Running Successsfully.");
});

app.post('/upload', serverValidation, tokenValidation, upload.fields([{ name: 'image' },{ name: 'thumbnail' },{ name: 'audio' },{ name: 'video' } ]), uploadController.insertfiles);


app.listen(port,()=>{
    console.log(`Port listen at ${port}`);
});


// ERROR: client error handling
app.use('*', (req, res) => {
  res.status(400).json({ status:400, Error: 'Route Not Found' });
})